import React, {useCallback, useEffect, useMemo, useState} from 'react';

// ─── Setup ────────────────────────────────────────────────────
const T = 5;
const X_DIM = 2;
const H_DIM = 3;

// Inputs: a strong signal at t=1, silence afterward — the "memory test"
const INPUTS: number[][] = [
  [1.0, 0.5],
  [0.0, 0.0],
  [0.0, 0.0],
  [0.0, 0.0],
  [0.0, 0.0],
];

// Base gate weight matrices (hand-tuned, identical across scenarios)
const W_xf: number[][] = [
  [0.4, 0.3],
  [0.2, 0.4],
  [0.3, 0.2],
];
const W_hf: number[][] = [
  [0.1, 0.0, 0.0],
  [0.0, 0.1, 0.0],
  [0.0, 0.0, 0.1],
];

const W_xi: number[][] = [
  [0.7, 0.4],
  [-0.2, 0.8],
  [0.4, 0.3],
];
const W_hi: number[][] = [
  [0.1, 0.0, 0.0],
  [0.0, 0.1, 0.0],
  [0.0, 0.0, 0.1],
];
const B_i = [0.0, 0.0, 0.0];

const W_xg: number[][] = [
  [0.9, 0.4],
  [-0.5, 0.7],
  [0.3, 0.6],
];
const W_hg: number[][] = [
  [0.1, 0.0, 0.0],
  [0.0, 0.1, 0.0],
  [0.0, 0.0, 0.1],
];
const B_g = [0.0, 0.0, 0.0];

const W_xo: number[][] = [
  [0.2, 0.2],
  [0.2, 0.2],
  [0.2, 0.2],
];
const W_ho: number[][] = [
  [0.1, 0.0, 0.0],
  [0.0, 0.1, 0.0],
  [0.0, 0.0, 0.1],
];
const B_o = [1.0, 1.0, 1.0]; // baseline output gate ≈ 0.73

// Scenarios differ only in the forget-gate bias offset — the key teaching point
type ScenarioId = 'remember' | 'forget' | 'selective';
const SCENARIOS: Record<ScenarioId, {label: string; desc: string; fBiasOffset: number}> = {
  remember: {
    label: 'Remember everything',
    desc: 'Forget bias = +3 → f_t ≈ 0.95 — the cell-state highway carries information across all timesteps',
    fBiasOffset: 3,
  },
  forget: {
    label: 'Forget previous',
    desc: 'Forget bias = −3 → f_t ≈ 0.05 — c_t is wiped at every step; the signal at t=1 is lost by t=2',
    fBiasOffset: -3,
  },
  selective: {
    label: 'Selective',
    desc: 'Forget bias = 0 → f_t ≈ 0.5 — partial memory; the t=1 signal decays gradually',
    fBiasOffset: 0,
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
function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}
function sigmoidVec(v: number[]): number[] {
  return v.map(sigmoid);
}
function hadamard(a: number[], b: number[]): number[] {
  return a.map((v, i) => v * b[i]);
}

interface LSTMState {
  f: number[];
  i: number[];
  g: number[];
  o: number[];
  c: number[];
  h: number[];
}

function lstmStep(x: number[], hPrev: number[], cPrev: number[], fBiasOffset: number): LSTMState {
  const B_f = [0 + fBiasOffset, 0 + fBiasOffset, 0 + fBiasOffset];
  const f = sigmoidVec(vecAdd(vecAdd(matVecMul(W_xf, x), matVecMul(W_hf, hPrev)), B_f));
  const i = sigmoidVec(vecAdd(vecAdd(matVecMul(W_xi, x), matVecMul(W_hi, hPrev)), B_i));
  const g = tanhVec(vecAdd(vecAdd(matVecMul(W_xg, x), matVecMul(W_hg, hPrev)), B_g));
  const o = sigmoidVec(vecAdd(vecAdd(matVecMul(W_xo, x), matVecMul(W_ho, hPrev)), B_o));
  const c = vecAdd(hadamard(f, cPrev), hadamard(i, g));
  const h = hadamard(o, tanhVec(c));
  return {f, i, g, o, c, h};
}

// Precompute the full trajectory for each scenario
function computeTrajectory(scenario: ScenarioId): LSTMState[] {
  const out: LSTMState[] = [];
  let h = new Array(H_DIM).fill(0);
  let c = new Array(H_DIM).fill(0);
  for (let t = 0; t < T; t++) {
    const state = lstmStep(INPUTS[t], h, c, SCENARIOS[scenario].fBiasOffset);
    h = state.h;
    c = state.c;
    out.push(state);
  }
  return out;
}

// ─── Color helpers ────────────────────────────────────────────
function signedFill(v: number, maxAbs: number): string {
  if (maxAbs === 0) return '#f1f5f9';
  const t = Math.min(1, Math.abs(v) / maxAbs);
  if (v > 0) return `rgb(${Math.round(255 - t * 200)}, ${Math.round(255 - t * 80)}, ${Math.round(255 - t * 80)})`;
  if (v < 0) return `rgb(255, ${Math.round(255 - t * 200)}, ${Math.round(255 - t * 200)})`;
  return '#f1f5f9';
}
function gateFill(v: number): string {
  // gate values in [0,1] — light slate (closed) → teal (open)
  const t = Math.max(0, Math.min(1, v));
  const r = Math.round(241 - t * 200);
  const g = Math.round(245 - t * 30);
  const b = Math.round(249 - t * 100);
  return `rgb(${r}, ${g}, ${b})`;
}

// ─── Sub-components ───────────────────────────────────────────
function VectorView({
  vec,
  label,
  cellSize = 26,
  layout = 'col',
  highlighted,
  fillFn,
  showValues = true,
}: {
  vec: number[];
  label?: string;
  cellSize?: number;
  layout?: 'row' | 'col';
  highlighted?: boolean;
  fillFn?: (v: number) => string;
  showValues?: boolean;
}) {
  const maxAbs = useMemo(() => Math.max(0.001, ...vec.map(Math.abs), 1), [vec]);
  const isRow = layout === 'row';
  const w = isRow ? vec.length * cellSize : cellSize;
  const h = isRow ? cellSize : vec.length * cellSize;
  return (
    <div className="flex flex-col items-center gap-1">
      {label && (
        <p className="m-0 text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
          {label}
        </p>
      )}
      <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} className="block">
        {vec.map((v, i) => {
          const x = isRow ? i * cellSize : 0;
          const y = isRow ? 0 : i * cellSize;
          const fill = fillFn ? fillFn(v) : signedFill(v, maxAbs);
          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={cellSize}
                height={cellSize}
                fill={fill}
                stroke={highlighted ? '#0d9488' : '#94a3b8'}
                strokeWidth={highlighted ? 1.75 : 0.75}
              />
              {showValues && (
                <text
                  x={x + cellSize / 2}
                  y={y + cellSize / 2 + 4}
                  fontSize={Math.max(9, cellSize * 0.36)}
                  textAnchor="middle"
                  fill="#0f172a"
                  fontFamily="ui-monospace, monospace"
                  fontWeight={600}
                >
                  {v.toFixed(2)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function GateMeter({label, vec, color}: {label: string; vec: number[]; color: string}) {
  const avg = vec.reduce((a, b) => a + b, 0) / vec.length;
  return (
    <div className={`rounded-lg border-2 p-2 ${color}`}>
      <p className="m-0 text-center text-[10px] font-bold uppercase tracking-wide">{label}</p>
      <div className="mt-1 flex justify-center">
        <VectorView vec={vec} cellSize={22} fillFn={gateFill} layout="col" />
      </div>
      <p className="m-0 mt-1 text-center font-mono text-[9px]">
        avg = {avg.toFixed(2)}
      </p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────
export default function LSTMCell() {
  const [scenario, setScenario] = useState<ScenarioId>('remember');
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1200);

  const trajectory = useMemo(() => computeTrajectory(scenario), [scenario]);
  const state = trajectory[t];
  const cPrev = t === 0 ? new Array(H_DIM).fill(0) : trajectory[t - 1].c;
  const hPrev = t === 0 ? new Array(H_DIM).fill(0) : trajectory[t - 1].h;

  const reset = useCallback(() => {
    setT(0);
    setPlaying(false);
  }, []);

  // Resetting t when scenario changes
  useEffect(() => {
    setT(0);
    setPlaying(false);
  }, [scenario]);

  useEffect(() => {
    if (!playing) return;
    if (t >= T - 1) {
      setPlaying(false);
      return;
    }
    const id = setTimeout(() => setT((cur) => cur + 1), speed);
    return () => clearTimeout(id);
  }, [playing, t, speed]);

  const cMagnitude = Math.max(...state.c.map(Math.abs));

  return (
    <div className="not-prose my-6 overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="border-b border-slate-200 bg-gradient-to-br from-slate-50 to-white px-6 py-5 dark:border-slate-700 dark:from-slate-800 dark:to-slate-900">
        <p className="m-0 text-xl font-bold text-slate-900 dark:text-slate-100">
          The LSTM gating intuition
        </p>
        <p className="m-0 mt-2 max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          A strong input arrives at t=1; then silence. Watch the <strong>cell-state highway</strong> c<sub>t</sub>{' '}
          either preserve the signal across timesteps or wipe it, depending on the <strong>forget gate</strong>.
        </p>
      </div>

      <div className="space-y-4 p-4 md:p-6">
        {/* Scenario picker */}
        <div className="flex flex-wrap items-stretch gap-2">
          {(Object.keys(SCENARIOS) as ScenarioId[]).map((sc) => (
            <button
              key={sc}
              type="button"
              onClick={() => setScenario(sc)}
              className={`flex-1 min-w-[180px] rounded-lg border-2 p-3 text-left transition-all ${
                scenario === sc
                  ? 'border-teal-500 bg-teal-50 shadow-md dark:border-teal-500 dark:bg-teal-950/40'
                  : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800/40 dark:hover:bg-slate-800/70'
              }`}
            >
              <p className="m-0 text-sm font-bold text-slate-900 dark:text-slate-100">{SCENARIOS[sc].label}</p>
              <p className="m-0 mt-1 text-[11px] text-slate-600 dark:text-slate-400">{SCENARIOS[sc].desc}</p>
            </button>
          ))}
        </div>

        {/* Stepper */}
        <div className="flex flex-wrap items-center gap-1">
          <span className="mr-1 text-[11px] font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300">
            Timestep:
          </span>
          {Array.from({length: T}).map((_, i) => (
            <React.Fragment key={i}>
              <button
                type="button"
                onClick={() => { setT(i); setPlaying(false); }}
                className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                  i === t
                    ? 'bg-teal-600 text-white shadow-sm'
                    : i < t
                      ? 'bg-teal-100 text-teal-800 hover:bg-teal-200 dark:bg-teal-900/40 dark:text-teal-200 dark:hover:bg-teal-900/60'
                      : 'border border-slate-300 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                }`}
              >
                t = {i + 1}
              </button>
              {i < T - 1 && <span className="text-slate-300 dark:text-slate-600">→</span>}
            </React.Fragment>
          ))}
        </div>

        {/* Cell diagram */}
        <div className="rounded-xl border-2 border-slate-200 bg-slate-50/40 p-4 dark:border-slate-700 dark:bg-slate-800/30">
          <p className="m-0 mb-3 text-center text-[11px] font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300">
            LSTM cell at t = {t + 1}
          </p>
          <div className="grid items-center gap-3 md:grid-cols-[auto_1fr_auto]">
            {/* Inputs (left) */}
            <div className="flex flex-col items-center gap-2">
              <VectorView vec={INPUTS[t]} label={`x_${t + 1}`} cellSize={28} />
              <VectorView vec={hPrev} label={`h_${t}`} cellSize={22} />
            </div>

            {/* Gates + cell update (center) */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                <GateMeter
                  label="Forget f"
                  vec={state.f}
                  color="border-rose-400 bg-rose-50 dark:border-rose-700 dark:bg-rose-950/30"
                />
                <GateMeter
                  label="Input i"
                  vec={state.i}
                  color="border-sky-400 bg-sky-50 dark:border-sky-700 dark:bg-sky-950/30"
                />
                <GateMeter
                  label="Candidate g"
                  vec={state.g}
                  color="border-violet-400 bg-violet-50 dark:border-violet-700 dark:bg-violet-950/30"
                />
                <GateMeter
                  label="Output o"
                  vec={state.o}
                  color="border-amber-400 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30"
                />
              </div>
              <div className="rounded-lg border-2 border-dashed border-teal-400 bg-teal-50/60 p-3 dark:border-teal-700 dark:bg-teal-950/30">
                <p className="m-0 mb-2 text-center text-[11px] font-bold uppercase tracking-wide text-teal-800 dark:text-teal-300">
                  Cell-state highway · c<sub>t</sub> = f ⊙ c<sub>t−1</sub> + i ⊙ g
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 text-[11px]">
                  <VectorView vec={state.f} label="f" cellSize={20} fillFn={gateFill} />
                  <span className="text-slate-400">⊙</span>
                  <VectorView vec={cPrev} label={`c_${t}`} cellSize={20} />
                  <span className="text-slate-400">+</span>
                  <VectorView vec={state.i} label="i" cellSize={20} fillFn={gateFill} />
                  <span className="text-slate-400">⊙</span>
                  <VectorView vec={state.g} label="g" cellSize={20} />
                  <span className="text-slate-400">=</span>
                  <VectorView vec={state.c} label={`c_${t + 1}`} cellSize={24} highlighted />
                </div>
              </div>
              <div className="rounded-lg border-2 border-dashed border-amber-400 bg-amber-50/40 p-3 dark:border-amber-700 dark:bg-amber-950/20">
                <p className="m-0 mb-2 text-center text-[11px] font-bold uppercase tracking-wide text-amber-800 dark:text-amber-300">
                  Hidden state · h<sub>t</sub> = o ⊙ tanh(c<sub>t</sub>)
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <VectorView vec={state.o} label="o" cellSize={20} fillFn={gateFill} />
                  <span className="text-slate-400">⊙ tanh(</span>
                  <VectorView vec={state.c} label={`c_${t + 1}`} cellSize={20} />
                  <span className="text-slate-400">) =</span>
                  <VectorView vec={state.h} label={`h_${t + 1}`} cellSize={24} highlighted />
                </div>
              </div>
            </div>

            {/* Outputs (right) */}
            <div className="flex flex-col items-center gap-2">
              <p className="m-0 text-[10px] font-bold uppercase tracking-wide text-teal-700 dark:text-teal-300">
                ‖c‖∞ = {cMagnitude.toFixed(2)}
              </p>
              <VectorView vec={state.c} label={`c_${t + 1}`} cellSize={28} highlighted />
              <VectorView vec={state.h} label={`h_${t + 1}`} cellSize={22} />
            </div>
          </div>
        </div>

        {/* Trajectory summary across all timesteps */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-3 dark:border-slate-700 dark:bg-slate-800/30">
          <p className="m-0 mb-2 text-center text-[11px] font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300">
            Cell-state magnitude across the sequence
          </p>
          <div className="flex items-end justify-between gap-1">
            {trajectory.map((s, i) => {
              const mag = Math.max(...s.c.map(Math.abs));
              const isActive = i === t;
              return (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400">
                    {mag.toFixed(2)}
                  </span>
                  <div
                    className={`w-full rounded-t ${isActive ? 'bg-teal-500' : 'bg-teal-200 dark:bg-teal-900/60'}`}
                    style={{height: `${Math.min(60, mag * 60)}px`}}
                  />
                  <span className={`text-[10px] font-mono ${isActive ? 'font-bold text-teal-700 dark:text-teal-300' : 'text-slate-500'}`}>
                    t={i + 1}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="m-0 mt-2 text-center text-[10px] italic text-slate-600 dark:text-slate-400">
            With <strong>{SCENARIOS[scenario].label}</strong> · the t=1 signal{' '}
            {scenario === 'remember' ? <strong className="text-emerald-700 dark:text-emerald-400">persists</strong>
              : scenario === 'forget' ? <strong className="text-rose-700 dark:text-rose-400">decays immediately</strong>
              : <strong className="text-amber-700 dark:text-amber-400">decays gradually</strong>}
          </p>
        </div>

        {/* Equations */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-800/30">
          <p className="m-0 mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300">
            LSTM gate equations
          </p>
          <div className="grid gap-1 text-center font-mono text-[12px] text-slate-900 dark:text-slate-100 sm:grid-cols-2">
            <p className="m-0">f<sub>t</sub> = σ(W<sub>xf</sub>·x<sub>t</sub> + W<sub>hf</sub>·h<sub>t−1</sub> + b<sub>f</sub>)</p>
            <p className="m-0">i<sub>t</sub> = σ(W<sub>xi</sub>·x<sub>t</sub> + W<sub>hi</sub>·h<sub>t−1</sub> + b<sub>i</sub>)</p>
            <p className="m-0">g<sub>t</sub> = tanh(W<sub>xg</sub>·x<sub>t</sub> + W<sub>hg</sub>·h<sub>t−1</sub> + b<sub>g</sub>)</p>
            <p className="m-0">o<sub>t</sub> = σ(W<sub>xo</sub>·x<sub>t</sub> + W<sub>ho</sub>·h<sub>t−1</sub> + b<sub>o</sub>)</p>
            <p className="m-0 sm:col-span-2">c<sub>t</sub> = f<sub>t</sub> ⊙ c<sub>t−1</sub> + i<sub>t</sub> ⊙ g<sub>t</sub></p>
            <p className="m-0 sm:col-span-2">h<sub>t</sub> = o<sub>t</sub> ⊙ tanh(c<sub>t</sub>)</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/30">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { setPlaying(false); setT(Math.max(0, t - 1)); }}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              aria-label="Previous timestep"
            >
              ◀
            </button>
            <button
              type="button"
              onClick={() => {
                if (t >= T - 1) {
                  setT(0);
                  setPlaying(true);
                } else {
                  setPlaying((p) => !p);
                }
              }}
              className="rounded-md bg-teal-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-teal-700"
            >
              {playing ? '❚❚ Pause' : t >= T - 1 ? '↺ Replay' : '▶ Play'}
            </button>
            <button
              type="button"
              onClick={() => { setPlaying(false); setT(Math.min(T - 1, t + 1)); }}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              aria-label="Next timestep"
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
            <label htmlFor="lstm-speed">Speed</label>
            <input
              id="lstm-speed"
              type="range"
              min={400}
              max={3000}
              step={100}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="w-28"
            />
            <span className="font-mono">{speed}ms</span>
          </div>
        </div>
      </div>
    </div>
  );
}
