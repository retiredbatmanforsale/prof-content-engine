import React, {useCallback, useEffect, useMemo, useState} from 'react';

// ─── Setup ────────────────────────────────────────────────────
const T = 4;
const X_DIM = 2;
const H_DIM = 3;

// Strong signal at t=1, silence after — the memory test
const INPUTS: number[][] = [
  [1.0, 0.5],
  [0.0, 0.0],
  [0.0, 0.0],
  [0.0, 0.0],
];

const W_xf: number[][] = [[0.4, 0.3], [0.2, 0.4], [0.3, 0.2]];
const W_hf: number[][] = [[0.1, 0.0, 0.0], [0.0, 0.1, 0.0], [0.0, 0.0, 0.1]];
const W_xi: number[][] = [[0.7, 0.4], [-0.2, 0.8], [0.4, 0.3]];
const W_hi: number[][] = [[0.1, 0.0, 0.0], [0.0, 0.1, 0.0], [0.0, 0.0, 0.1]];
const B_i = [0.0, 0.0, 0.0];
const W_xg: number[][] = [[0.9, 0.4], [-0.5, 0.7], [0.3, 0.6]];
const W_hg: number[][] = [[0.1, 0.0, 0.0], [0.0, 0.1, 0.0], [0.0, 0.0, 0.1]];
const B_g = [0.0, 0.0, 0.0];
const W_xo: number[][] = [[0.2, 0.2], [0.2, 0.2], [0.2, 0.2]];
const W_ho: number[][] = [[0.1, 0.0, 0.0], [0.0, 0.1, 0.0], [0.0, 0.0, 0.1]];
const B_o = [1.0, 1.0, 1.0];

type ScenarioId = 'remember' | 'forget' | 'selective';
const SCENARIOS: Record<ScenarioId, {label: string; desc: string; fBias: number}> = {
  remember: {
    label: 'Remember',
    desc: 'Forget bias = +3 → f ≈ 0.95. The cell-state highway carries the t=1 signal forward through every timestep.',
    fBias: 3,
  },
  forget: {
    label: 'Forget',
    desc: 'Forget bias = −3 → f ≈ 0.05. The cell state is wiped at every step; the signal at t=1 is gone by t=2.',
    fBias: -3,
  },
  selective: {
    label: 'Selective',
    desc: 'Forget bias = 0 → f ≈ 0.5. Partial memory; the t=1 signal decays gradually across timesteps.',
    fBias: 0,
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
  f: number[]; i: number[]; g: number[]; o: number[];
  c: number[]; h: number[]; cPrev: number[]; hPrev: number[];
  fc: number[]; ig: number[]; // intermediate products for stage 3
  tanhC: number[]; // for stage 4
}

function lstmStep(x: number[], hPrev: number[], cPrev: number[], fBias: number): LSTMState {
  const B_f = [fBias, fBias, fBias];
  const f = sigmoidVec(vecAdd(vecAdd(matVecMul(W_xf, x), matVecMul(W_hf, hPrev)), B_f));
  const i = sigmoidVec(vecAdd(vecAdd(matVecMul(W_xi, x), matVecMul(W_hi, hPrev)), B_i));
  const g = tanhVec(vecAdd(vecAdd(matVecMul(W_xg, x), matVecMul(W_hg, hPrev)), B_g));
  const o = sigmoidVec(vecAdd(vecAdd(matVecMul(W_xo, x), matVecMul(W_ho, hPrev)), B_o));
  const fc = hadamard(f, cPrev);
  const ig = hadamard(i, g);
  const c = vecAdd(fc, ig);
  const tanhC = tanhVec(c);
  const h = hadamard(o, tanhC);
  return {f, i, g, o, c, h, cPrev, hPrev, fc, ig, tanhC};
}

function computeTrajectory(scenario: ScenarioId): LSTMState[] {
  const out: LSTMState[] = [];
  let h = new Array(H_DIM).fill(0);
  let c = new Array(H_DIM).fill(0);
  for (let t = 0; t < T; t++) {
    const st = lstmStep(INPUTS[t], h, c, SCENARIOS[scenario].fBias);
    h = st.h;
    c = st.c;
    out.push(st);
  }
  return out;
}

// ─── Colors ───────────────────────────────────────────────────
function signedFill(v: number, maxAbs: number): string {
  if (maxAbs === 0) return '#f1f5f9';
  const t = Math.min(1, Math.abs(v) / maxAbs);
  if (v > 0) return `rgb(${Math.round(255 - t * 200)}, ${Math.round(255 - t * 80)}, ${Math.round(255 - t * 80)})`;
  if (v < 0) return `rgb(255, ${Math.round(255 - t * 200)}, ${Math.round(255 - t * 200)})`;
  return '#f1f5f9';
}

const TONE_COLORS = {
  input: '#6366f1',
  hidden: '#0d9488',
  cell: '#0891b2',
  pre: '#8b5cf6',
} as const;

// ─── Vector bars ──────────────────────────────────────────────
function VectorBars({
  vec, label, tone, big = false, signed = true,
}: {
  vec: number[]; label?: string; tone: keyof typeof TONE_COLORS; big?: boolean; signed?: boolean;
}) {
  const barW = big ? 22 : 16;
  const gap = big ? 6 : 4;
  const H = big ? 70 : 54;
  const center = signed ? H / 2 : H - 2;
  const totalW = vec.length * barW + (vec.length - 1) * gap;
  const maxAbs = Math.max(0.001, ...vec.map(Math.abs), 1);
  const fillPos = TONE_COLORS[tone];
  const fillNeg = '#f43f5e';
  return (
    <div className="flex flex-col items-center gap-1.5">
      {label && (
        <p className="m-0 font-mono text-xs font-bold tracking-tight" style={{color: fillPos}}>
          {label}
        </p>
      )}
      <svg viewBox={`0 0 ${totalW} ${H}`} width={totalW} height={H} className="block">
        {signed && (
          <line x1={0} y1={center} x2={totalW} y2={center} stroke="#cbd5e1" strokeWidth={0.5} strokeDasharray="2,3" />
        )}
        {vec.map((v, i) => {
          const x = i * (barW + gap);
          const t = Math.min(1, Math.abs(v) / maxAbs);
          const barH = signed ? t * (H / 2 - 4) : t * (H - 4);
          const barY = signed ? (v >= 0 ? center - barH : center) : center - barH;
          const fill = v >= 0 ? fillPos : fillNeg;
          return (
            <g key={i}>
              <rect x={x} y={2} width={barW} height={H - 4} fill="#e2e8f0" opacity={0.45} rx={3} />
              {barH > 0.4 && <rect x={x} y={barY} width={barW} height={barH} fill={fill} rx={3} />}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Gate meter (sigmoid 0-1) ─────────────────────────────────
function GateMeter({label, vec, color, isCandidate = false}: {label: string; vec: number[]; color: string; isCandidate?: boolean}) {
  const avg = vec.reduce((a, b) => a + b, 0) / vec.length;
  return (
    <div className={`flex flex-col items-center gap-1.5 rounded-lg border-2 p-2.5 ${color}`}>
      <p className="m-0 text-xs font-bold uppercase tracking-wide">{label}</p>
      <VectorBars vec={vec} tone="hidden" signed={isCandidate} />
      <p className="m-0 font-mono text-[10px]">
        avg = <strong>{avg.toFixed(2)}</strong>
      </p>
    </div>
  );
}

// ─── Stage shell ──────────────────────────────────────────────
function StageShell({title, subtitle, equation, children}: {title: string; subtitle: string; equation: string; children: React.ReactNode}) {
  return (
    <div className="flex min-h-[260px] flex-col rounded-2xl border-2 border-slate-200 bg-slate-50/40 p-5 dark:border-slate-700 dark:bg-slate-800/30">
      <div className="mb-2">
        <p className="m-0 text-base font-bold text-slate-900 dark:text-slate-100">{title}</p>
        <p className="m-0 mt-1 text-xs text-slate-600 dark:text-slate-400">{subtitle}</p>
      </div>
      <div className="flex flex-1 items-center justify-center">{children}</div>
      <p className="m-0 mt-3 rounded-lg bg-white px-3 py-2 text-center font-mono text-sm text-slate-800 shadow-sm dark:bg-slate-900 dark:text-slate-200">
        {equation}
      </p>
    </div>
  );
}

// ─── Stages ───────────────────────────────────────────────────
function StageInputs({state, t}: {state: LSTMState; t: number}) {
  return (
    <StageShell
      title="Stage 1 · Read inputs"
      subtitle="The cell receives the current input x_t along with the previous hidden state h_{t−1} and cell state c_{t−1}."
      equation={`x_${t + 1}, h_${t}, c_${t} → enter the cell`}
    >
      <div className="flex flex-wrap items-end justify-center gap-6">
        <VectorBars vec={INPUTS[t]} label={`x_${t + 1}`} tone="input" big />
        <VectorBars vec={state.hPrev} label={`h_${t}`} tone="hidden" big />
        <VectorBars vec={state.cPrev} label={`c_${t}`} tone="cell" big />
      </div>
    </StageShell>
  );
}

function StageGates({state}: {state: LSTMState}) {
  return (
    <StageShell
      title="Stage 2 · Compute the four gates"
      subtitle="From [x_t, h_{t−1}], four gates each emit a vector — three sigmoid (in [0, 1]) and one tanh (in [−1, 1])."
      equation="f = σ(W_f·…)  ·  i = σ(W_i·…)  ·  g = tanh(W_g·…)  ·  o = σ(W_o·…)"
    >
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
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
          isCandidate
        />
        <GateMeter
          label="Output o"
          vec={state.o}
          color="border-amber-400 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30"
        />
      </div>
    </StageShell>
  );
}

function StageCellUpdate({state, t}: {state: LSTMState; t: number}) {
  return (
    <StageShell
      title="Stage 3 · Update the cell-state highway"
      subtitle="Forget gate scales the old cell state; input gate scales the candidate. Add them together."
      equation={`c_${t + 1} = f ⊙ c_${t} + i ⊙ g`}
    >
      <div className="flex flex-wrap items-end justify-center gap-2.5">
        <VectorBars vec={state.f} label="f" tone="hidden" />
        <span className="pb-7 text-lg font-bold text-slate-400">⊙</span>
        <VectorBars vec={state.cPrev} label={`c_${t}`} tone="cell" />
        <span className="pb-7 text-lg font-bold text-slate-400">=</span>
        <VectorBars vec={state.fc} label="kept" tone="cell" />
        <span className="pb-7 text-lg font-bold text-slate-400">+</span>
        <VectorBars vec={state.ig} label="written" tone="pre" />
        <span className="pb-7 text-lg font-bold text-slate-400">=</span>
        <VectorBars vec={state.c} label={`c_${t + 1}`} tone="cell" big />
      </div>
    </StageShell>
  );
}

function StageHidden({state, t}: {state: LSTMState; t: number}) {
  return (
    <StageShell
      title="Stage 4 · Compute hidden state"
      subtitle="Output gate reads from a squashed version of the cell state — that becomes the hidden state passed forward."
      equation={`h_${t + 1} = o ⊙ tanh(c_${t + 1})`}
    >
      <div className="flex flex-wrap items-end justify-center gap-3">
        <VectorBars vec={state.o} label="o" tone="hidden" big />
        <span className="pb-7 text-lg font-bold text-slate-400">⊙</span>
        <VectorBars vec={state.tanhC} label={`tanh(c_${t + 1})`} tone="cell" big />
        <span className="pb-7 text-lg font-bold text-slate-400">=</span>
        <VectorBars vec={state.h} label={`h_${t + 1}`} tone="hidden" big />
      </div>
    </StageShell>
  );
}

const STAGES = [
  {key: 'inputs', label: 'Inputs', short: '1'},
  {key: 'gates', label: 'Gates', short: '2'},
  {key: 'cell', label: 'Cell state', short: '3'},
  {key: 'hidden', label: 'Hidden state', short: '4'},
];
const N_STAGES = STAGES.length;

function StageView({stage, state, t}: {stage: number; state: LSTMState; t: number}) {
  switch (stage) {
    case 0: return <StageInputs state={state} t={t} />;
    case 1: return <StageGates state={state} />;
    case 2: return <StageCellUpdate state={state} t={t} />;
    case 3: return <StageHidden state={state} t={t} />;
    default: return null;
  }
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

// ─── Main ─────────────────────────────────────────────────────
export default function LSTMCell() {
  const [scenario, setScenario] = useState<ScenarioId>('remember');
  const [t, setT] = useState(0);
  const [stage, setStage] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(900);

  const trajectory = useMemo(() => computeTrajectory(scenario), [scenario]);
  const state = trajectory[t];

  // Reset when scenario changes
  useEffect(() => {
    setT(0);
    setStage(0);
    setPlaying(false);
  }, [scenario]);

  const reset = useCallback(() => {
    setT(0);
    setStage(0);
    setPlaying(false);
  }, []);

  const advance = useCallback(() => {
    setStage((s) => {
      if (s < N_STAGES - 1) return s + 1;
      setT((cur) => (cur < T - 1 ? cur + 1 : cur));
      return 0;
    });
  }, []);

  const stepForward = useCallback(() => {
    setPlaying(false);
    if (stage < N_STAGES - 1) setStage(stage + 1);
    else if (t < T - 1) {
      setT(t + 1);
      setStage(0);
    }
  }, [stage, t]);
  const stepBack = useCallback(() => {
    setPlaying(false);
    if (stage > 0) setStage(stage - 1);
    else if (t > 0) {
      setT(t - 1);
      setStage(N_STAGES - 1);
    }
  }, [stage, t]);

  const isDone = t >= T - 1 && stage >= N_STAGES - 1;

  useEffect(() => {
    if (!playing) return;
    if (isDone) {
      setPlaying(false);
      return;
    }
    const id = setTimeout(advance, speed);
    return () => clearTimeout(id);
  }, [playing, stage, t, speed, advance, isDone]);

  return (
    <div className="not-prose my-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-900">
      <div className="border-b border-slate-200 bg-gradient-to-br from-slate-50 to-white px-6 py-5 dark:border-slate-700 dark:from-slate-800 dark:to-slate-900">
        <p className="m-0 text-xl font-bold text-slate-900 dark:text-slate-100">
          Inside the LSTM cell · stage by stage
        </p>
        <p className="m-0 mt-2 max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          A strong signal arrives at t=1, then silence. Four operations make up one LSTM step:
          read inputs → compute four gates → update the cell-state highway → emit the hidden state.{' '}
          The <strong>forget gate</strong> alone decides whether the t=1 memory survives.
        </p>
      </div>

      <div className="space-y-4 p-6">
        {/* Scenario picker */}
        <div className="grid gap-2 sm:grid-cols-3">
          {(Object.keys(SCENARIOS) as ScenarioId[]).map((sc) => {
            const isOn = scenario === sc;
            return (
              <button
                key={sc}
                type="button"
                onClick={() => setScenario(sc)}
                className={`rounded-xl border-2 p-3 text-left transition-all ${
                  isOn
                    ? 'border-teal-500 bg-teal-50 shadow-md dark:border-teal-500 dark:bg-teal-950/40'
                    : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800/40 dark:hover:bg-slate-800/70'
                }`}
              >
                <p className={`m-0 text-sm font-bold ${isOn ? 'text-teal-900 dark:text-teal-200' : 'text-slate-900 dark:text-slate-100'}`}>
                  {SCENARIOS[sc].label}
                </p>
                <p className="m-0 mt-1 text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                  {SCENARIOS[sc].desc}
                </p>
              </button>
            );
          })}
        </div>

        {/* Stage stepper + timestep selector */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Stage:
            </span>
            {STAGES.map((s, i) => {
              const isActive = i === stage;
              const isPast = i < stage;
              return (
                <React.Fragment key={s.key}>
                  <button
                    type="button"
                    onClick={() => { setStage(i); setPlaying(false); }}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-teal-600 text-white shadow-sm'
                        : isPast
                          ? 'bg-teal-100 text-teal-800 hover:bg-teal-200 dark:bg-teal-900/40 dark:text-teal-200 dark:hover:bg-teal-900/60'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                    }`}
                  >
                    {s.short}. {s.label}
                  </button>
                  {i < N_STAGES - 1 && <span className="text-slate-300 dark:text-slate-600">→</span>}
                </React.Fragment>
              );
            })}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Timestep:
            </span>
            {Array.from({length: T}).map((_, i) => {
              const isActive = i === t;
              const isPast = i < t;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => { setT(i); setStage(0); setPlaying(false); }}
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-amber-500 text-white shadow-sm'
                      : isPast
                        ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-200'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active stage */}
        <StageView stage={stage} state={state} t={t} />

        {/* Trajectory strip — cell-state magnitude across all timesteps */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-700 dark:bg-slate-800/40">
          <div className="mb-2 flex items-baseline justify-between">
            <p className="m-0 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Cell-state magnitude across the sequence
            </p>
            <p className="m-0 text-[11px] italic text-slate-600 dark:text-slate-400">
              <strong>{SCENARIOS[scenario].label}</strong>
            </p>
          </div>
          <div className="flex items-end justify-between gap-2">
            {trajectory.map((s, i) => {
              const mag = Math.max(...s.c.map(Math.abs));
              const isActive = i === t;
              return (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <span className="font-mono text-[10px] tabular-nums text-slate-600 dark:text-slate-400">
                    {mag.toFixed(2)}
                  </span>
                  <div
                    className={`w-full rounded-t-md transition-all ${
                      isActive ? 'bg-teal-500' : 'bg-teal-200 dark:bg-teal-900/60'
                    }`}
                    style={{height: `${Math.min(48, mag * 48 + 2)}px`}}
                  />
                  <span className={`font-mono text-[10px] tabular-nums ${isActive ? 'font-bold text-teal-700 dark:text-teal-300' : 'text-slate-500'}`}>
                    t = {i + 1}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/40">
          <div className="flex flex-wrap items-center gap-2">
            <GhostBtn onClick={stepBack} ariaLabel="Previous">◀</GhostBtn>
            <PrimaryBtn
              onClick={() => {
                if (isDone) { reset(); setPlaying(true); }
                else setPlaying((p) => !p);
              }}
              className="min-w-[120px]"
            >
              {playing ? '❚❚ Pause' : isDone ? '↺ Replay' : '▶ Play'}
            </PrimaryBtn>
            <GhostBtn onClick={stepForward} ariaLabel="Next">▶</GhostBtn>
            <GhostBtn onClick={reset}>Reset</GhostBtn>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
            <span className="font-mono text-xs tabular-nums">
              t = {t + 1} · stage {stage + 1}/{N_STAGES}
            </span>
            <label htmlFor="lstm-speed" className="text-xs font-medium uppercase tracking-wide">
              Speed
            </label>
            <input
              id="lstm-speed"
              type="range"
              min={400}
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
