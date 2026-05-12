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
    label: 'Vanishing · ‖W_hh‖ < 1',
    desc: 'Each Jacobian factor shrinks the gradient. Multiply 4 of them and ‖∂L/∂h₁‖ collapses toward zero — vanilla RNNs forget long-range dependencies.',
    W_HH: [
      [0.2, 0.05, -0.1, 0.0],
      [-0.05, 0.25, 0.05, -0.1],
      [0.0, -0.1, 0.2, 0.05],
      [0.1, 0.0, -0.05, 0.25],
    ],
  },
  exploding: {
    label: 'Exploding · ‖W_hh‖ > 1',
    desc: 'Each Jacobian factor amplifies the gradient. Multiply 4 of them and ‖∂L/∂h₁‖ blows up — training collapses into NaNs.',
    W_HH: [
      [1.4, 0.4, -0.5, 0.1],
      [-0.3, 1.2, 0.3, -0.4],
      [0.1, -0.5, 1.5, 0.3],
      [0.4, 0.1, -0.3, 1.3],
    ],
  },
};

// ─── Math ─────────────────────────────────────────────────────
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
function jacobian(W_HH: number[][], h_t: number[]): number[][] {
  const deriv = h_t.map((v) => 1 - v * v);
  return W_HH.map((row, i) => row.map((w) => deriv[i] * w));
}

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
  const JACS: number[][][] = [];
  const JAC_NORMS: number[] = [];
  for (let t = 1; t < T; t++) {
    const J = jacobian(W_HH, HIDDEN[t]);
    JACS.push(J);
    JAC_NORMS.push(frobenius(J));
  }
  const GRAD_NORMS: number[] = new Array(T).fill(0);
  GRAD_NORMS[T - 1] = 1.0;
  for (let t = T - 2; t >= 0; t--) {
    GRAD_NORMS[t] = GRAD_NORMS[t + 1] * JAC_NORMS[t];
  }
  return {HIDDEN, JACS, JAC_NORMS, GRAD_NORMS};
}

// ─── Buttons ──────────────────────────────────────────────────
function PrimaryBtn({onClick, children, className = ''}: {onClick: () => void; children: React.ReactNode; className?: string}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-teal-700 hover:shadow-md active:scale-[0.97] ${className}`}
    >
      {children}
    </button>
  );
}
function GhostBtn({onClick, children, ariaLabel}: {onClick: () => void; children: React.ReactNode; ariaLabel?: string}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-150 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md active:scale-[0.97] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-700"
    >
      {children}
    </button>
  );
}

// ─── Bar viz for a vector ─────────────────────────────────────
function VectorBars({vec, tone, empty = false}: {vec: number[]; tone: 'input' | 'hidden'; empty?: boolean}) {
  const barW = 12;
  const gap = 4;
  const H = 44;
  const center = H / 2;
  const totalW = vec.length * barW + (vec.length - 1) * gap;
  const maxAbs = Math.max(0.001, ...vec.map(Math.abs), 1);
  const fillPos = tone === 'input' ? '#6366f1' : '#0d9488';
  const fillNeg = '#f43f5e';
  return (
    <svg viewBox={`0 0 ${totalW} ${H}`} width={totalW} height={H} className="block">
      <line x1={0} y1={center} x2={totalW} y2={center} stroke="#cbd5e1" strokeWidth={0.5} strokeDasharray="2,3" />
      {vec.map((v, i) => {
        const x = i * (barW + gap);
        const t = Math.min(1, Math.abs(v) / maxAbs);
        const barH = empty ? 0 : t * (H / 2 - 3);
        const barY = v >= 0 ? center - barH : center;
        const fill = v >= 0 ? fillPos : fillNeg;
        return (
          <g key={i}>
            <rect x={x} y={2} width={barW} height={H - 4} fill="#e2e8f0" opacity={0.4} rx={2} />
            {!empty && barH > 0.4 && <rect x={x} y={barY} width={barW} height={barH} fill={fill} rx={2} />}
          </g>
        );
      })}
    </svg>
  );
}

// ─── Tiny Jacobian matrix preview ─────────────────────────────
function MatrixMini({mat, label}: {mat: number[][]; label: string}) {
  const cell = 16;
  const H = mat.length;
  const W = mat[0].length;
  const maxAbs = Math.max(0.001, ...mat.flat().map(Math.abs));
  function fill(v: number): string {
    const t = Math.min(1, Math.abs(v) / maxAbs);
    if (v > 0) return `rgb(${Math.round(255 - t * 200)}, ${Math.round(255 - t * 80)}, ${Math.round(255 - t * 80)})`;
    if (v < 0) return `rgb(255, ${Math.round(255 - t * 200)}, ${Math.round(255 - t * 200)})`;
    return '#f1f5f9';
  }
  return (
    <div className="flex flex-col items-center gap-1.5">
      <p className="m-0 font-mono text-xs font-bold text-rose-900 dark:text-rose-200">{label}</p>
      <svg viewBox={`0 0 ${W * cell} ${H * cell}`} width={W * cell} height={H * cell}>
        {mat.map((row, r) =>
          row.map((v, c) => (
            <rect
              key={`${r}-${c}`}
              x={c * cell}
              y={r * cell}
              width={cell}
              height={cell}
              fill={fill(v)}
              stroke="#cbd5e1"
              strokeWidth={0.4}
              rx={2}
            />
          )),
        )}
      </svg>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────
const TOTAL_STEPS = T + 1 + (T - 1); // forward T + loss 1 + backward T-1

// Literal Tailwind class map — avoids dynamic-class purge bug
const PHASE_STYLES = {
  forward: {
    active: 'bg-teal-600 text-white shadow-md',
    past: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200',
    future: 'border border-slate-200 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500',
  },
  loss: {
    active: 'bg-amber-600 text-white shadow-md',
    past: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
    future: 'border border-slate-200 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500',
  },
  backward: {
    active: 'bg-rose-600 text-white shadow-md',
    past: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200',
    future: 'border border-slate-200 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500',
  },
} as const;

export default function BPTTFlow() {
  const [preset, setPreset] = useState<PresetId>('vanishing');
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(900);

  const data = useMemo(() => computeAll(preset), [preset]);

  const phase: 'forward' | 'loss' | 'backward' = useMemo(() => {
    if (step < T) return 'forward';
    if (step === T) return 'loss';
    return 'backward';
  }, [step]);

  const forwardDone = Math.min(step + (phase === 'forward' ? 1 : 0), T);
  const lossShown = step >= T;
  const backwardSteps = Math.max(0, step - T); // 0 .. T-1
  const revealedFrom = backwardSteps === 0 ? T : Math.max(0, T - backwardSteps);
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

  const atEnd = step >= TOTAL_STEPS - 1;
  const finalGrad = data.GRAD_NORMS[0];
  const startingGrad = data.GRAD_NORMS[T - 1];
  const magnitudeChange = finalGrad / startingGrad;

  // Phase chip helper — uses literal classes
  function phaseChip(p: 'forward' | 'loss' | 'backward', label: string, num: number) {
    const isActive = phase === p;
    const isPast =
      (p === 'forward' && phase !== 'forward') ||
      (p === 'loss' && phase === 'backward');
    const style = isActive ? PHASE_STYLES[p].active : isPast ? PHASE_STYLES[p].past : PHASE_STYLES[p].future;
    return (
      <div className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-all ${style}`}>
        {num}. {label}
      </div>
    );
  }

  return (
    <div className="not-prose my-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-900">
      <div className="border-b border-slate-200 bg-gradient-to-br from-slate-50 to-white px-6 py-5 dark:border-slate-700 dark:from-slate-800 dark:to-slate-900">
        <p className="m-0 text-xl font-bold text-slate-900 dark:text-slate-100">
          Backpropagation Through Time
        </p>
        <p className="m-0 mt-2 max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          Forward pass runs left to right. After the loss is computed, gradients flow{' '}
          <strong className="text-rose-700 dark:text-rose-400">right to left</strong> as a product
          of Jacobian matrices — and that product either{' '}
          <strong className="text-blue-700 dark:text-blue-400">vanishes</strong> or{' '}
          <strong className="text-orange-700 dark:text-orange-400">explodes</strong>.
        </p>
      </div>

      <div className="space-y-5 p-6">
        {/* Preset toggle */}
        <div className="grid gap-3 sm:grid-cols-2">
          {(Object.keys(PRESETS) as PresetId[]).map((p) => {
            const isOn = preset === p;
            const tone = p === 'vanishing' ? 'blue' : 'orange';
            return (
              <button
                key={p}
                type="button"
                onClick={() => setPreset(p)}
                className={`rounded-2xl border-2 p-4 text-left transition-all ${
                  isOn
                    ? tone === 'blue'
                      ? 'border-blue-500 bg-blue-50 shadow-md dark:border-blue-500 dark:bg-blue-950/40'
                      : 'border-orange-500 bg-orange-50 shadow-md dark:border-orange-500 dark:bg-orange-950/40'
                    : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800/40 dark:hover:bg-slate-800/70'
                }`}
              >
                <p
                  className={`m-0 text-base font-bold ${
                    isOn
                      ? tone === 'blue'
                        ? 'text-blue-900 dark:text-blue-200'
                        : 'text-orange-900 dark:text-orange-200'
                      : 'text-slate-900 dark:text-slate-100'
                  }`}
                >
                  {PRESETS[p].label}
                </p>
                <p className="m-0 mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  {PRESETS[p].desc}
                </p>
              </button>
            );
          })}
        </div>

        {/* Phase indicator */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {phaseChip('forward', 'Forward', 1)}
          <span className="text-slate-300 dark:text-slate-600">→</span>
          {phaseChip('loss', 'Loss', 2)}
          <span className="text-slate-300 dark:text-slate-600">→</span>
          {phaseChip('backward', 'Backward (BPTT)', 3)}
        </div>

        {/* 5-cell unrolled chain */}
        <div className="overflow-x-auto rounded-2xl bg-slate-50/60 p-4 dark:bg-slate-800/30">
          <div className="flex min-w-min items-stretch justify-between gap-2">
            {Array.from({length: T}).map((_, t) => {
              const fwdDone = t < forwardDone;
              const fwdActive = phase === 'forward' && step === t;
              const bwdRevealed = lossShown && t >= revealedFrom;
              const bwdActive = phase === 'backward' && t === revealedFrom;
              const isLast = t === T - 1;
              const lossActive = phase === 'loss' && isLast;
              return (
                <React.Fragment key={t}>
                  <div className="flex min-w-[88px] flex-1 flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-800/60">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                      t = {t + 1}
                    </span>
                    {/* Input bars */}
                    <VectorBars vec={INPUTS[t]} tone="input" empty={!(fwdDone || fwdActive)} />
                    {/* Cell */}
                    <div
                      className={`flex h-9 w-12 items-center justify-center rounded-lg text-sm font-bold transition-all ${
                        fwdActive
                          ? 'bg-teal-600 text-white shadow-md'
                          : fwdDone
                            ? 'bg-gradient-to-br from-amber-200 to-orange-300 text-amber-900 dark:from-amber-900/60 dark:to-orange-900/60 dark:text-amber-100'
                            : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                      }`}
                    >
                      f
                    </div>
                    {/* Hidden bars */}
                    <VectorBars vec={data.HIDDEN[t]} tone="hidden" empty={!fwdDone} />
                    {/* Loss bubble (last cell only) */}
                    {isLast && lossShown && (
                      <div
                        className={`mt-1 rounded-full border-2 border-amber-500 px-2.5 py-0.5 text-xs font-bold transition-all ${
                          lossActive ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200'
                        }`}
                      >
                        L
                      </div>
                    )}
                  </div>
                  {t < T - 1 && (
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <span
                        className={`text-xl transition-colors ${
                          forwardDone > t + 1 ? 'text-teal-500' : 'text-slate-200 dark:text-slate-700'
                        }`}
                      >
                        →
                      </span>
                      <span
                        className={`text-xl transition-colors ${
                          bwdRevealed && currentJacIdx <= t ? 'text-rose-500' : 'text-slate-200 dark:text-slate-700'
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
        </div>

        {/* The payoff — gradient magnitude bar chart */}
        <div
          className={`rounded-2xl border-2 p-4 transition-all ${
            preset === 'vanishing'
              ? 'border-blue-300 bg-blue-50/40 dark:border-blue-700 dark:bg-blue-950/20'
              : 'border-orange-300 bg-orange-50/40 dark:border-orange-700 dark:bg-orange-950/20'
          }`}
        >
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <p
              className={`m-0 text-sm font-bold ${
                preset === 'vanishing' ? 'text-blue-900 dark:text-blue-200' : 'text-orange-900 dark:text-orange-200'
              }`}
            >
              Gradient magnitude ‖∂L/∂h<sub>t</sub>‖ across timesteps
            </p>
            {lossShown && (
              <p className="m-0 font-mono text-xs text-slate-600 dark:text-slate-400">
                ratio ‖∂L/∂h₁‖ / ‖∂L/∂h<sub>T</sub>‖ ={' '}
                <strong
                  className={
                    preset === 'vanishing' ? 'text-blue-700 dark:text-blue-300' : 'text-orange-700 dark:text-orange-300'
                  }
                >
                  {magnitudeChange.toExponential(2)}
                </strong>
              </p>
            )}
          </div>
          <div className="flex items-end justify-between gap-2">
            {data.GRAD_NORMS.map((g, i) => {
              const revealed = lossShown && i >= revealedFrom;
              const mag = revealed ? g : 0;
              // Log-scale display so both 0.001 and 100 fit on the same chart
              const scaledHeight = revealed ? Math.max(4, Math.min(120, (Math.log10(mag + 1e-9) + 4) * 22)) : 0;
              const barColor = preset === 'vanishing' ? 'bg-blue-500' : 'bg-orange-500';
              const isActive = i === revealedFrom && phase === 'backward';
              return (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <span className="font-mono text-[10px] tabular-nums text-slate-700 dark:text-slate-300">
                    {revealed ? mag.toExponential(1) : '—'}
                  </span>
                  <div className="flex h-32 w-full items-end justify-center">
                    {revealed ? (
                      <div
                        className={`w-full rounded-t-lg transition-all duration-300 ${barColor} ${
                          isActive ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-offset-slate-900' : ''
                        }`}
                        style={{height: `${scaledHeight}px`}}
                      />
                    ) : (
                      <div className="h-full w-full rounded-t-lg border border-dashed border-slate-300 dark:border-slate-600 opacity-50" />
                    )}
                  </div>
                  <span className="font-mono text-xs font-semibold tabular-nums text-slate-700 dark:text-slate-300">
                    t = {i + 1}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="m-0 mt-3 text-center text-xs italic text-slate-600 dark:text-slate-400">
            log-scaled · the gradient at t=1 has been multiplied by{' '}
            <strong>4 Jacobian matrices</strong> to get here
          </p>
        </div>

        {/* Current Jacobian — only during backward */}
        {phase === 'backward' && currentJacIdx >= 0 && (
          <div className="flex flex-wrap items-center justify-center gap-5 rounded-2xl border-2 border-rose-300 bg-rose-50/40 p-4 dark:border-rose-700 dark:bg-rose-950/20">
            <p className="m-0 text-sm font-bold text-rose-800 dark:text-rose-300">
              Applying J<sub>{currentJacIdx + 2}</sub> = ∂h<sub>{currentJacIdx + 2}</sub>/∂h<sub>{currentJacIdx + 1}</sub>
            </p>
            <MatrixMini mat={data.JACS[currentJacIdx]} label={`J_${currentJacIdx + 2}`} />
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Frobenius norm
              </span>
              <span
                className={`mt-1 rounded-lg px-3 py-1.5 font-mono text-base font-bold tabular-nums ${
                  data.JAC_NORMS[currentJacIdx] < 1
                    ? 'bg-blue-100 text-blue-900 dark:bg-blue-900/40 dark:text-blue-200'
                    : 'bg-orange-100 text-orange-900 dark:bg-orange-900/40 dark:text-orange-200'
                }`}
              >
                ‖J‖ = {data.JAC_NORMS[currentJacIdx].toFixed(3)}
              </span>
              <span className="mt-1 text-[10px] italic text-slate-600 dark:text-slate-400">
                {data.JAC_NORMS[currentJacIdx] < 1 ? '< 1 → gradient shrinks' : '> 1 → gradient grows'}
              </span>
            </div>
          </div>
        )}

        {/* Equation */}
        <div className="rounded-2xl bg-slate-50 px-5 py-4 dark:bg-slate-800/40">
          <p className="m-0 text-center font-mono text-base text-slate-900 dark:text-slate-100">
            ∂L/∂h<sub>1</sub> = ∂L/∂h<sub>T</sub> ·{' '}
            <span className="text-rose-700 dark:text-rose-300">∏</span>{' '}
            ∂h<sub>t</sub>/∂h<sub>t−1</sub>
          </p>
          <p className="m-0 mt-2 text-center text-xs text-slate-600 dark:text-slate-400">
            That product of <strong>T − 1 Jacobians</strong> is exactly why vanilla RNNs can't learn long-range dependencies.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/40">
          <div className="flex flex-wrap items-center gap-2">
            <GhostBtn onClick={() => { setPlaying(false); setStep(Math.max(0, step - 1)); }} ariaLabel="Previous">
              ◀
            </GhostBtn>
            <PrimaryBtn
              onClick={() => {
                if (atEnd) { setStep(0); setPlaying(true); }
                else setPlaying((p) => !p);
              }}
              className="min-w-[120px]"
            >
              {playing ? '❚❚ Pause' : atEnd ? '↺ Replay' : '▶ Play'}
            </PrimaryBtn>
            <GhostBtn onClick={() => { setPlaying(false); setStep(Math.min(TOTAL_STEPS - 1, step + 1)); }} ariaLabel="Next">
              ▶
            </GhostBtn>
            <GhostBtn onClick={reset}>Reset</GhostBtn>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
            <span className="font-mono text-xs tabular-nums">
              step {step + 1} / {TOTAL_STEPS}
            </span>
            <label htmlFor="bptt-speed" className="text-xs font-medium uppercase tracking-wide">
              Speed
            </label>
            <input
              id="bptt-speed"
              type="range"
              min={300}
              max={2500}
              step={100}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="w-24 accent-teal-600"
            />
            <span className="font-mono text-xs tabular-nums">{speed}ms</span>
          </div>
        </div>
      </div>
    </div>
  );
}
