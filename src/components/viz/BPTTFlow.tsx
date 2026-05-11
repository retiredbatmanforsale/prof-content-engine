import React, {useCallback, useEffect, useMemo, useState} from 'react';

// ─── Setup ────────────────────────────────────────────────────
const T = 5;
const X_DIM = 3;
const H_DIM = 4;

const W_XH: number[][] = [
  [0.8, -0.4, 0.1],
  [-0.3, 0.7, 0.2],
  [0.2, -0.1, 0.9],
  [0.5, 0.4, -0.6],
];
const B_H = [0.0, 0.0, 0.0, 0.0];

const INPUTS: number[][] = [
  [1.0, 0.0, 0.0],
  [0.5, 0.5, 0.0],
  [0.0, 1.0, 0.0],
  [0.0, 0.5, 0.5],
  [0.0, 0.0, 1.0],
];

type PresetId = 'vanishing' | 'exploding';

const PRESETS: Record<PresetId, {label: string; desc: string; W_HH: number[][]}> = {
  vanishing: {
    label: '‖W_hh‖ < 1 · vanishing',
    desc: 'Each Jacobian factor has norm < 1. Multiply enough of them and the gradient collapses to 0 — vanilla RNNs forget.',
    W_HH: [
      [0.3, 0.1, -0.2, 0.0],
      [-0.1, 0.4, 0.1, -0.2],
      [0.0, -0.2, 0.3, 0.1],
      [0.2, 0.0, -0.1, 0.4],
    ],
  },
  exploding: {
    label: '‖W_hh‖ > 1 · exploding',
    desc: 'Each Jacobian factor has norm > 1. The product blows up exponentially — gradients diverge and training collapses.',
    W_HH: [
      [1.2, 0.3, -0.4, 0.1],
      [-0.2, 1.0, 0.2, -0.3],
      [0.1, -0.4, 1.3, 0.2],
      [0.3, 0.1, -0.2, 1.1],
    ],
  },
};

// ─── Math helpers ─────────────────────────────────────────────
function matVecMul(M: number[][], v: number[]): number[] {
  return M.map((row) => row.reduce((s, w, i) => s + w * v[i], 0));
}
function vecAdd(a: number[], b: number[]): number[] {
  return a.map((v, i) => v + b[i]);
}
function tanhVec(v: number[]): number[] {
  return v.map((x) => Math.tanh(x));
}
function frobenius(M: number[][]): number {
  let s = 0;
  M.forEach((row) => row.forEach((v) => (s += v * v)));
  return Math.sqrt(s);
}

// ∂h_t/∂h_{t-1} = diag(1 - tanh²(pre_t)) · W_hh = diag(1 - h_t²) · W_hh
function jacobian(W_HH: number[][], h_t: number[]): number[][] {
  const deriv = h_t.map((v) => 1 - v * v);
  return W_HH.map((row, i) => row.map((w) => deriv[i] * w));
}

// Precompute forward pass + jacobians for a preset
function computeAll(preset: PresetId) {
  const W_HH = PRESETS[preset].W_HH;
  const HIDDEN: number[][] = [];
  let h = new Array(H_DIM).fill(0);
  for (let t = 0; t < T; t++) {
    const xp = matVecMul(W_XH, INPUTS[t]);
    const hp = matVecMul(W_HH, h);
    h = tanhVec(vecAdd(vecAdd(xp, hp), B_H));
    HIDDEN.push([...h]);
  }
  // Jacobians J_t = ∂h_t/∂h_{t-1} for t = 1..T-1 (using 0-indexed h)
  // We index jacobians as JAC[t] = ∂h_{t}/∂h_{t-1} for t=1..T-1
  const JACS: number[][][] = [];
  const JAC_NORMS: number[] = [];
  for (let t = 1; t < T; t++) {
    const J = jacobian(W_HH, HIDDEN[t]);
    JACS.push(J);
    JAC_NORMS.push(frobenius(J));
  }
  // Loss assumed scalar; ‖∂L/∂h_T‖ = 1 baseline. Cumulative ‖∂L/∂h_t‖ = ∏ ‖J_{t+1..T}‖
  const GRAD_NORMS: number[] = new Array(T).fill(0);
  GRAD_NORMS[T - 1] = 1.0;
  for (let t = T - 2; t >= 0; t--) {
    GRAD_NORMS[t] = GRAD_NORMS[t + 1] * JAC_NORMS[t]; // JAC_NORMS[t] = ‖J_{t+1}‖ = ‖∂h_{t+1}/∂h_t‖
  }
  return {HIDDEN, JACS, JAC_NORMS, GRAD_NORMS};
}

// ─── Color helpers ────────────────────────────────────────────
function signedFill(v: number, maxAbs: number): string {
  if (maxAbs === 0) return '#f1f5f9';
  const t = Math.min(1, Math.abs(v) / maxAbs);
  if (v > 0) return `rgb(${Math.round(255 - t * 200)}, ${Math.round(255 - t * 80)}, ${Math.round(255 - t * 80)})`;
  if (v < 0) return `rgb(255, ${Math.round(255 - t * 200)}, ${Math.round(255 - t * 200)})`;
  return '#f1f5f9';
}

function VectorView({vec, label, cellSize = 18, layout = 'col', highlighted}: {
  vec: number[];
  label?: string;
  cellSize?: number;
  layout?: 'row' | 'col';
  highlighted?: boolean;
}) {
  const maxAbs = useMemo(() => Math.max(0.001, ...vec.map(Math.abs), 1), [vec]);
  const isRow = layout === 'row';
  const w = isRow ? vec.length * cellSize : cellSize;
  const h = isRow ? cellSize : vec.length * cellSize;
  return (
    <div className="flex flex-col items-center gap-0.5">
      {label && (
        <p className="m-0 text-[9px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
          {label}
        </p>
      )}
      <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} className="block">
        {vec.map((v, i) => {
          const x = isRow ? i * cellSize : 0;
          const y = isRow ? 0 : i * cellSize;
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={cellSize}
              height={cellSize}
              fill={signedFill(v, maxAbs)}
              stroke={highlighted ? '#0d9488' : '#94a3b8'}
              strokeWidth={highlighted ? 1.25 : 0.5}
            />
          );
        })}
      </svg>
    </div>
  );
}

function MatrixView({mat, label, cellSize = 16}: {mat: number[][]; label: string; cellSize?: number}) {
  const H = mat.length;
  const W = mat[0].length;
  const maxAbs = useMemo(() => {
    let m = 0;
    mat.forEach((row) => row.forEach((v) => (m = Math.max(m, Math.abs(v)))));
    return m === 0 ? 1 : m;
  }, [mat]);
  return (
    <div className="flex flex-col items-center gap-1">
      <p className="m-0 text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
        {label}
      </p>
      <svg viewBox={`0 0 ${W * cellSize} ${H * cellSize}`} width={W * cellSize} height={H * cellSize} className="block">
        {mat.map((row, r) =>
          row.map((v, c) => (
            <g key={`${r}-${c}`}>
              <rect
                x={c * cellSize}
                y={r * cellSize}
                width={cellSize}
                height={cellSize}
                fill={signedFill(v, maxAbs)}
                stroke="#cbd5e1"
                strokeWidth={0.4}
              />
              <text
                x={c * cellSize + cellSize / 2}
                y={r * cellSize + cellSize / 2 + 3}
                fontSize={7}
                textAnchor="middle"
                fill="#0f172a"
                fontFamily="ui-monospace, monospace"
              >
                {v.toFixed(2)}
              </text>
            </g>
          )),
        )}
      </svg>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────
const TOTAL_STEPS = T + 1 + (T - 1); // forward (T) + loss (1) + backward (T-1)

export default function BPTTFlow() {
  const [preset, setPreset] = useState<PresetId>('vanishing');
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(900);

  const data = useMemo(() => computeAll(preset), [preset]);

  const phase: 'idle' | 'forward' | 'loss' | 'backward' = useMemo(() => {
    if (step < T) return 'forward';
    if (step === T) return 'loss';
    return 'backward';
  }, [step]);

  // What's been computed:
  const forwardDone = Math.min(step, T); // h_1 .. h_{forwardDone} are computed
  const lossShown = step >= T;
  const backwardSteps = Math.max(0, step - T); // 0..T-1 backward applied
  // After k backward steps, ∂L/∂h_T, ∂L/∂h_{T-1}, ..., ∂L/∂h_{T-k} are revealed
  // i.e., index t (0-based) is revealed if t >= T - 1 - (backwardSteps - 1) for backwardSteps > 0
  // Simpler: index t revealed if t >= T - 1 - max(0, backwardSteps - 1)
  // We treat backwardSteps=1 as "loss only" — show grad at t=T-1
  // backwardSteps=2 → applied J_T → reveal grad at t=T-2
  const revealedFrom = backwardSteps === 0 ? T : Math.max(0, T - backwardSteps);

  // Current jacobian being applied (only during backward phase)
  // backwardSteps=1: applied J for ∂h_{T-1}/∂h_{T-2}? Actually let me reconsider.
  // step T → loss shown (no jacobian applied yet, grad at T-1 = 1.0)
  // step T+1 → apply J_{T-1} (which is JACS[T-2]) to get grad at T-2 (revealedFrom = T-2 = 3 for T=5)
  // step T+2 → apply J_{T-2} (JACS[T-3])
  // ...
  // step T+k → apply JACS[T-1-k]
  const currentJacIdx = step > T ? Math.max(0, T - 1 - (step - T)) : -1;

  const reset = useCallback(() => {
    setStep(0);
    setPlaying(false);
  }, []);

  useEffect(() => {
    setStep(0);
    setPlaying(false);
  }, [preset]);

  useEffect(() => {
    if (!playing) return;
    if (step >= TOTAL_STEPS - 1) {
      setPlaying(false);
      return;
    }
    const id = setTimeout(() => setStep((s) => s + 1), speed);
    return () => clearTimeout(id);
  }, [playing, step, speed]);

  const finalGradNorm = data.GRAD_NORMS[0];
  const isVanishing = finalGradNorm < 0.5;
  const isExploding = finalGradNorm > 2.0;

  return (
    <div className="not-prose my-6 overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="border-b border-slate-200 bg-gradient-to-br from-slate-50 to-white px-6 py-5 dark:border-slate-700 dark:from-slate-800 dark:to-slate-900">
        <p className="m-0 text-xl font-bold text-slate-900 dark:text-slate-100">
          Backpropagation Through Time
        </p>
        <p className="m-0 mt-2 max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          Same 5-cell unrolled RNN as the forward-pass animation — now the arrows reverse and gradients
          flow back through the chain of Jacobians. Watch the gradient magnitude collapse or explode
          depending on <span className="font-mono">‖W_hh‖</span>.
        </p>
      </div>

      <div className="space-y-4 p-4 md:p-6">
        {/* Preset toggle */}
        <div className="flex flex-wrap items-stretch gap-2">
          {(Object.keys(PRESETS) as PresetId[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPreset(p)}
              className={`flex-1 min-w-[220px] rounded-lg border-2 p-3 text-left transition-all ${
                preset === p
                  ? p === 'vanishing'
                    ? 'border-blue-500 bg-blue-50 shadow-md dark:border-blue-500 dark:bg-blue-950/40'
                    : 'border-orange-500 bg-orange-50 shadow-md dark:border-orange-500 dark:bg-orange-950/40'
                  : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800/40 dark:hover:bg-slate-800/70'
              }`}
            >
              <p className={`m-0 text-sm font-bold ${preset === p ? (p === 'vanishing' ? 'text-blue-900 dark:text-blue-200' : 'text-orange-900 dark:text-orange-200') : 'text-slate-900 dark:text-slate-100'}`}>
                {PRESETS[p].label}
              </p>
              <p className="m-0 mt-1 text-[11px] text-slate-600 dark:text-slate-400">{PRESETS[p].desc}</p>
            </button>
          ))}
        </div>

        {/* Phase indicator */}
        <div className="flex items-center justify-center gap-2">
          {(['forward', 'loss', 'backward'] as const).map((ph, i) => {
            const isActive = phase === ph;
            const isPast =
              (phase === 'loss' && ph === 'forward') ||
              (phase === 'backward' && (ph === 'forward' || ph === 'loss'));
            const color =
              ph === 'forward' ? 'teal' : ph === 'loss' ? 'amber' : 'rose';
            return (
              <React.Fragment key={ph}>
                <div
                  className={`rounded-md px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${
                    isActive
                      ? `bg-${color}-600 text-white shadow-md`
                      : isPast
                        ? `bg-${color}-100 text-${color}-800 dark:bg-${color}-900/40 dark:text-${color}-200`
                        : 'border border-slate-300 bg-white text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {i + 1}. {ph === 'forward' ? 'Forward pass' : ph === 'loss' ? 'Loss at t=T' : 'Backward (BPTT)'}
                </div>
                {i < 2 && <span className="text-slate-300 dark:text-slate-600">→</span>}
              </React.Fragment>
            );
          })}
        </div>

        {/* Unrolled 5-cell view */}
        <div className="rounded-xl border-2 border-slate-200 bg-slate-50/40 p-4 dark:border-slate-700 dark:bg-slate-800/30">
          <div className="flex items-stretch justify-between gap-1 overflow-x-auto">
            {Array.from({length: T}).map((_, t) => {
              const fwdDone = t < forwardDone;
              const fwdActive = phase === 'forward' && step === t;
              const bwdRevealed = lossShown && t >= revealedFrom;
              const bwdActive = phase === 'backward' && t === revealedFrom;
              const isLastTimestep = t === T - 1;
              const lossActive = phase === 'loss' && isLastTimestep;
              return (
                <React.Fragment key={t}>
                  <div className="flex min-w-[72px] flex-1 flex-col items-center gap-2 rounded-lg border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-800/60">
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                      t = {t + 1}
                    </span>
                    {/* Input x_t */}
                    {fwdDone || fwdActive ? (
                      <VectorView vec={INPUTS[t]} label="x" cellSize={12} layout="col" />
                    ) : (
                      <div className="h-[36px] w-[12px] rounded border border-dashed border-slate-300 dark:border-slate-600" />
                    )}
                    {/* Cell */}
                    <div
                      className={`flex h-7 w-12 items-center justify-center rounded text-[10px] font-bold ${
                        fwdActive
                          ? 'bg-teal-600 text-white'
                          : fwdDone
                            ? 'bg-fuchsia-100 text-fuchsia-900 dark:bg-fuchsia-900/40 dark:text-fuchsia-200'
                            : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                      }`}
                    >
                      cell
                    </div>
                    {/* Hidden state */}
                    {fwdDone ? (
                      <VectorView vec={data.HIDDEN[t]} label="h" cellSize={12} layout="col" highlighted={fwdActive} />
                    ) : (
                      <div className="h-[48px] w-[12px] rounded border border-dashed border-slate-300 dark:border-slate-600" />
                    )}
                    {/* Loss bubble (last cell) */}
                    {isLastTimestep && lossShown && (
                      <div
                        className={`mt-1 rounded-full border-2 border-amber-500 px-2 py-0.5 text-[10px] font-bold ${
                          lossActive ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200'
                        }`}
                      >
                        L
                      </div>
                    )}
                    {/* Gradient indicator */}
                    {bwdRevealed && (
                      <div
                        className={`mt-1 flex flex-col items-center gap-0.5 rounded border-2 px-1 py-0.5 ${
                          bwdActive
                            ? 'border-rose-500 bg-rose-50 dark:border-rose-500 dark:bg-rose-950/40'
                            : 'border-rose-300 bg-rose-50/50 dark:border-rose-700 dark:bg-rose-950/20'
                        }`}
                      >
                        <span className="text-[9px] font-bold text-rose-700 dark:text-rose-300">
                          ∂L/∂h
                        </span>
                        <span className="font-mono text-[10px] font-bold text-rose-700 dark:text-rose-300">
                          {data.GRAD_NORMS[t].toExponential(1)}
                        </span>
                      </div>
                    )}
                  </div>
                  {t < T - 1 && (
                    <div className="flex flex-col items-center justify-center gap-2">
                      {/* Forward arrow */}
                      <span
                        className={`text-base ${
                          forwardDone > t + 1 || (phase === 'forward' && step >= t + 1)
                            ? 'text-teal-500'
                            : 'text-slate-300 dark:text-slate-600'
                        }`}
                      >
                        →
                      </span>
                      {/* Backward arrow */}
                      <span
                        className={`text-base ${
                          bwdRevealed && (phase === 'backward' && currentJacIdx <= t)
                            ? 'text-rose-500'
                            : 'text-slate-300 dark:text-slate-600'
                        }`}
                      >
                        ←
                      </span>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
          <p className="m-0 mt-3 text-center text-[11px] italic text-slate-600 dark:text-slate-400">
            Forward: <span className="text-teal-600 dark:text-teal-400 font-mono">→</span> compute h_t · Backward: <span className="text-rose-600 dark:text-rose-400 font-mono">←</span> apply Jacobian ∂h_t/∂h_{`{t−1}`} = diag(1 − h_t²) · W_hh
          </p>
        </div>

        {/* Current Jacobian detail (during backward) */}
        {phase === 'backward' && currentJacIdx >= 0 && (
          <div className="rounded-xl border-2 border-rose-300 bg-rose-50/40 p-4 dark:border-rose-700 dark:bg-rose-950/20">
            <p className="m-0 mb-3 text-center text-xs font-bold uppercase tracking-wide text-rose-800 dark:text-rose-300">
              Applying Jacobian J<sub>{currentJacIdx + 2}</sub> = ∂h<sub>{currentJacIdx + 2}</sub> / ∂h<sub>{currentJacIdx + 1}</sub>
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <MatrixView mat={data.JACS[currentJacIdx]} label={`J_${currentJacIdx + 2}`} />
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                  Frobenius norm
                </span>
                <span
                  className={`rounded-md px-2 py-1 font-mono text-sm font-bold ${
                    data.JAC_NORMS[currentJacIdx] < 1
                      ? 'bg-blue-100 text-blue-900 dark:bg-blue-900/40 dark:text-blue-200'
                      : 'bg-orange-100 text-orange-900 dark:bg-orange-900/40 dark:text-orange-200'
                  }`}
                >
                  ‖J‖ = {data.JAC_NORMS[currentJacIdx].toFixed(3)}
                </span>
                <span className="text-[10px] italic text-slate-600 dark:text-slate-400">
                  {data.JAC_NORMS[currentJacIdx] < 1 ? '< 1 → gradient shrinks' : '> 1 → gradient grows'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Cumulative gradient norm bar chart */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-3 dark:border-slate-700 dark:bg-slate-800/30">
          <p className="m-0 mb-2 text-center text-[11px] font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300">
            Gradient magnitude ‖∂L/∂h<sub>t</sub>‖ at each timestep
          </p>
          <div className="flex items-end justify-between gap-1">
            {data.GRAD_NORMS.map((g, i) => {
              const revealed = lossShown && i >= revealedFrom;
              const mag = revealed ? g : 0;
              const scaled = Math.log10(mag + 0.001) + 3; // log scale, shift to positive
              return (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <span className="font-mono text-[9px] text-slate-600 dark:text-slate-400">
                    {revealed ? mag.toExponential(1) : '—'}
                  </span>
                  <div className="flex h-16 w-full items-end">
                    {revealed && (
                      <div
                        className={`w-full rounded-t transition-all ${
                          preset === 'vanishing' ? 'bg-blue-500' : 'bg-orange-500'
                        }`}
                        style={{height: `${Math.max(2, Math.min(64, scaled * 12))}px`}}
                      />
                    )}
                  </div>
                  <span className="font-mono text-[9px] text-slate-500">t={i + 1}</span>
                </div>
              );
            })}
          </div>
          <p className="m-0 mt-2 text-center text-[10px] italic text-slate-600 dark:text-slate-400">
            ‖∂L/∂h<sub>1</sub>‖ ≈ <strong>{data.GRAD_NORMS[0].toExponential(2)}</strong> after
            propagating through {T - 1} Jacobian factors{' '}
            {isVanishing && <strong className="text-blue-700 dark:text-blue-400">→ vanished</strong>}
            {isExploding && <strong className="text-orange-700 dark:text-orange-400">→ exploded</strong>}
          </p>
        </div>

        {/* Equation callout */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-800/30">
          <p className="m-0 mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300">
            The chain-rule product behind BPTT
          </p>
          <p className="m-0 text-center font-mono text-sm text-slate-900 dark:text-slate-100">
            ∂L/∂h<sub>1</sub> = ∂L/∂h<sub>T</sub> · ∂h<sub>T</sub>/∂h<sub>T−1</sub> · ∂h<sub>T−1</sub>/∂h<sub>T−2</sub> · … · ∂h<sub>2</sub>/∂h<sub>1</sub>
          </p>
          <p className="m-0 mt-3 text-center text-[11px] italic text-slate-600 dark:text-slate-400">
            <strong>This product of T − 1 Jacobians is exactly why vanilla RNNs can't learn long-range dependencies.</strong>
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/30">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { setPlaying(false); setStep(Math.max(0, step - 1)); }}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              ◀
            </button>
            <button
              type="button"
              onClick={() => {
                if (step >= TOTAL_STEPS - 1) {
                  setStep(0);
                  setPlaying(true);
                } else {
                  setPlaying((p) => !p);
                }
              }}
              className="rounded-md bg-teal-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-teal-700"
            >
              {playing ? '❚❚ Pause' : step >= TOTAL_STEPS - 1 ? '↺ Replay' : '▶ Play'}
            </button>
            <button
              type="button"
              onClick={() => { setPlaying(false); setStep(Math.min(TOTAL_STEPS - 1, step + 1)); }}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              ▶
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Reset
            </button>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400">
            <span className="font-mono">step {step + 1}/{TOTAL_STEPS}</span>
            <label htmlFor="bptt-speed">Speed</label>
            <input
              id="bptt-speed"
              type="range"
              min={300}
              max={2500}
              step={100}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="w-24"
            />
            <span className="font-mono">{speed}ms</span>
          </div>
        </div>
      </div>
    </div>
  );
}
