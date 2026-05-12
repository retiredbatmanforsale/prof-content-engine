import React, {useCallback, useEffect, useMemo, useState} from 'react';

// ─── Setup (consistent with RecurrenceUnroll for cross-lesson continuity) ───
const T = 4;
const X_DIM = 3;
const H_DIM = 4;
const Y_DIM = 2;

const W_XH: number[][] = [
  [0.8, -0.4, 0.1],
  [-0.3, 0.7, 0.2],
  [0.2, -0.1, 0.9],
  [0.5, 0.4, -0.6],
];
const W_HH: number[][] = [
  [0.3, 0.1, -0.2, 0.0],
  [-0.1, 0.4, 0.1, -0.2],
  [0.0, -0.2, 0.3, 0.1],
  [0.2, 0.0, -0.1, 0.4],
];
const W_HY: number[][] = [
  [0.5, -0.3, 0.4, 0.2],
  [-0.2, 0.5, -0.1, 0.6],
];
const B_H = [0.0, 0.0, 0.0, 0.0];
const B_Y = [0.0, 0.0];

const INPUTS: number[][] = [
  [1.0, 0.0, 0.0],
  [0.0, 1.0, 0.0],
  [0.0, 0.0, 1.0],
  [1.0, 1.0, 0.0],
];

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

// Precompute everything for every timestep
const HIDDEN: number[][] = [];
const OUTPUTS: number[][] = [];
const PRE_TANH: number[][] = [];
const XPART: number[][] = []; // W_xh · x_t
const HPART: number[][] = []; // W_hh · h_{t-1}
{
  let h = new Array(H_DIM).fill(0);
  for (let t = 0; t < T; t++) {
    const xp = matVecMul(W_XH, INPUTS[t]);
    const hp = matVecMul(W_HH, h);
    const pre = vecAdd(vecAdd(xp, hp), B_H);
    h = tanhVec(pre);
    const y = vecAdd(matVecMul(W_HY, h), B_Y);
    XPART.push(xp);
    HPART.push(hp);
    PRE_TANH.push(pre);
    HIDDEN.push([...h]);
    OUTPUTS.push(y);
  }
}
const H_INIT = new Array(H_DIM).fill(0);

const STAGES = [
  {key: 'input', label: 'Read x', short: '1', what: 'Read input', equation: 'x_t'},
  {key: 'wxhx', label: 'W_xh · x', short: '2', what: 'Project input', equation: 'W_xh · x_t'},
  {key: 'whhh', label: '+ W_hh · h', short: '3', what: 'Add recurrence', equation: '+ W_hh · h_{t−1} + b_h'},
  {key: 'tanh', label: 'tanh', short: '4', what: 'Non-linearity', equation: 'h_t = tanh(…)'},
  {key: 'why', label: 'W_hy · h', short: '5', what: 'Compute output', equation: 'y_t = W_hy · h_t + b_y'},
];
const N_STAGES = STAGES.length;

// ─── Colors ───────────────────────────────────────────────────
function signedFill(v: number, maxAbs: number): string {
  if (maxAbs === 0) return '#f1f5f9';
  const t = Math.min(1, Math.abs(v) / maxAbs);
  if (v > 0) return `rgb(${Math.round(255 - t * 200)}, ${Math.round(255 - t * 80)}, ${Math.round(255 - t * 80)})`;
  if (v < 0) return `rgb(255, ${Math.round(255 - t * 200)}, ${Math.round(255 - t * 200)})`;
  return '#f1f5f9';
}

// ─── Bar viz for a vector ─────────────────────────────────────
function VectorBars({
  vec,
  tone,
  label,
  big = false,
}: {
  vec: number[];
  tone: 'input' | 'hidden' | 'output' | 'pre' | 'recur';
  label?: string;
  big?: boolean;
}) {
  const barW = big ? 22 : 16;
  const gap = big ? 6 : 4;
  const H = big ? 72 : 56;
  const center = H / 2;
  const totalW = vec.length * barW + (vec.length - 1) * gap;
  const maxAbs = Math.max(0.001, ...vec.map(Math.abs), 1);
  const fillPos =
    tone === 'input'
      ? '#6366f1'
      : tone === 'hidden'
        ? '#0d9488'
        : tone === 'output'
          ? '#d97706'
          : tone === 'pre'
            ? '#8b5cf6'
            : '#0891b2';
  const fillNeg = '#f43f5e';
  return (
    <div className="flex flex-col items-center gap-1.5">
      {label && (
        <p className="m-0 font-mono text-xs font-bold tracking-tight" style={{color: fillPos}}>
          {label}
        </p>
      )}
      <svg viewBox={`0 0 ${totalW} ${H}`} width={totalW} height={H} className="block">
        <line x1={0} y1={center} x2={totalW} y2={center} stroke="#cbd5e1" strokeWidth={0.5} strokeDasharray="2,3" />
        {vec.map((v, i) => {
          const x = i * (barW + gap);
          const t = Math.min(1, Math.abs(v) / maxAbs);
          const barH = t * (H / 2 - 4);
          const barY = v >= 0 ? center - barH : center;
          const fill = v >= 0 ? fillPos : fillNeg;
          return (
            <g key={i}>
              <rect x={x} y={2} width={barW} height={H - 4} fill="#e2e8f0" opacity={0.4} rx={3} />
              {barH > 0.5 && <rect x={x} y={barY} width={barW} height={barH} fill={fill} rx={3} />}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Mini matrix with numeric labels ──────────────────────────
function MatrixGrid({mat, label, cellSize = 22}: {mat: number[][]; label: string; cellSize?: number}) {
  const H = mat.length;
  const W = mat[0].length;
  const maxAbs = useMemo(() => Math.max(0.001, ...mat.flat().map(Math.abs)), [mat]);
  return (
    <div className="flex flex-col items-center gap-1.5">
      <p className="m-0 font-mono text-xs font-bold text-slate-700 dark:text-slate-300">{label}</p>
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
                strokeWidth={0.5}
                rx={2}
              />
              <text
                x={c * cellSize + cellSize / 2}
                y={r * cellSize + cellSize / 2 + 3}
                fontSize={9}
                textAnchor="middle"
                fill="#0f172a"
                fontFamily="ui-monospace, monospace"
                fontWeight={600}
              >
                {v.toFixed(1)}
              </text>
            </g>
          )),
        )}
      </svg>
    </div>
  );
}

// ─── Stage panels (fixed-height shell) ────────────────────────
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

function StageInput({t}: {t: number}) {
  return (
    <StageShell title="Stage 1 · Read x_t" subtitle="The sequence feeds in one timestep at a time" equation={`x_${t + 1} ∈ ℝ^${X_DIM}`}>
      <VectorBars vec={INPUTS[t]} tone="input" label={`x_${t + 1}`} big />
    </StageShell>
  );
}
function StageWxhX({t}: {t: number}) {
  return (
    <StageShell
      title="Stage 2 · W_xh · x_t"
      subtitle="Project the input into hidden-state space"
      equation="W_xh · x_t"
    >
      <div className="flex flex-wrap items-center justify-center gap-3">
        <MatrixGrid mat={W_XH} label={`W_xh · (${H_DIM}×${X_DIM})`} />
        <span className="text-lg font-bold text-slate-400">·</span>
        <VectorBars vec={INPUTS[t]} tone="input" label={`x_${t + 1}`} />
        <span className="text-lg font-bold text-slate-400">=</span>
        <VectorBars vec={XPART[t]} tone="recur" label="result" />
      </div>
    </StageShell>
  );
}
function StageWhhH({t}: {t: number}) {
  const hPrev = t === 0 ? H_INIT : HIDDEN[t - 1];
  return (
    <StageShell
      title="Stage 3 · + W_hh · h_{t−1} + b_h"
      subtitle="Add the recurrent contribution from the previous hidden state"
      equation="W_xh · x_t + W_hh · h_{t−1} + b_h"
    >
      <div className="flex flex-wrap items-center justify-center gap-3">
        <VectorBars vec={XPART[t]} tone="recur" label="W_xh · x" />
        <span className="text-lg font-bold text-slate-400">+</span>
        <MatrixGrid mat={W_HH} label={`W_hh · (${H_DIM}×${H_DIM})`} />
        <span className="text-lg font-bold text-slate-400">·</span>
        <VectorBars vec={hPrev} tone="hidden" label={`h_${t}`} />
        <span className="text-lg font-bold text-slate-400">=</span>
        <VectorBars vec={PRE_TANH[t]} tone="pre" label="pre-tanh" />
      </div>
    </StageShell>
  );
}
function StageTanh({t}: {t: number}) {
  return (
    <StageShell
      title="Stage 4 · tanh"
      subtitle="Squash the pre-activation into the [−1, 1] range — this is the new hidden state"
      equation="h_t = tanh(W_xh · x_t + W_hh · h_{t−1} + b_h)"
    >
      <div className="flex flex-wrap items-center justify-center gap-4">
        <VectorBars vec={PRE_TANH[t]} tone="pre" label="pre-tanh" big />
        <span className="font-mono text-base text-slate-500">→ tanh →</span>
        <VectorBars vec={HIDDEN[t]} tone="hidden" label={`h_${t + 1}`} big />
      </div>
    </StageShell>
  );
}
function StageOutput({t}: {t: number}) {
  return (
    <StageShell
      title="Stage 5 · y_t = W_hy · h_t + b_y"
      subtitle="Project the hidden state into output space"
      equation="y_t = W_hy · h_t + b_y"
    >
      <div className="flex flex-wrap items-center justify-center gap-3">
        <MatrixGrid mat={W_HY} label={`W_hy · (${Y_DIM}×${H_DIM})`} />
        <span className="text-lg font-bold text-slate-400">·</span>
        <VectorBars vec={HIDDEN[t]} tone="hidden" label={`h_${t + 1}`} />
        <span className="text-lg font-bold text-slate-400">=</span>
        <VectorBars vec={OUTPUTS[t]} tone="output" label={`y_${t + 1}`} big />
      </div>
    </StageShell>
  );
}

function StageView({stage, t}: {stage: number; t: number}) {
  switch (stage) {
    case 0: return <StageInput t={t} />;
    case 1: return <StageWxhX t={t} />;
    case 2: return <StageWhhH t={t} />;
    case 3: return <StageTanh t={t} />;
    case 4: return <StageOutput t={t} />;
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
export default function RNNForwardPass() {
  const [t, setT] = useState(0);
  const [stage, setStage] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(800);

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
    if (stage < N_STAGES - 1) {
      setStage(stage + 1);
    } else if (t < T - 1) {
      setT(t + 1);
      setStage(0);
    }
  }, [stage, t]);

  const stepBack = useCallback(() => {
    setPlaying(false);
    if (stage > 0) {
      setStage(stage - 1);
    } else if (t > 0) {
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
          Inside the RNN cell · stage by stage
        </p>
        <p className="m-0 mt-2 max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          Five operations make up one RNN timestep: read input → project via W_xh → add the recurrent
          term via W_hh → squash with tanh → emit output via W_hy. Watch each stage with real arithmetic.
        </p>
      </div>

      <div className="space-y-4 p-6">
        {/* Stage stepper */}
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
                  {i < STAGES.length - 1 && <span className="text-slate-300 dark:text-slate-600">→</span>}
                </React.Fragment>
              );
            })}
          </div>
          {/* Timestep selector */}
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

        {/* Active stage panel — fixed height */}
        <StageView stage={stage} t={t} />

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
            <label htmlFor="rnnfp-speed" className="text-xs font-medium uppercase tracking-wide">
              Speed
            </label>
            <input
              id="rnnfp-speed"
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
