import React, {useCallback, useEffect, useMemo, useState} from 'react';

// ─── Setup (consistent with RecurrenceUnroll) ─────────────────
const T = 5;
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
  [0.5, 0.5, 0.0],
  [0.0, 1.0, 0.0],
  [0.0, 0.5, 0.5],
  [0.0, 0.0, 1.0],
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

// Precompute hidden states and outputs for every timestep
const HIDDEN: number[][] = [];
const OUTPUTS: number[][] = [];
const PRE_TANH: number[][] = [];
const XPART: number[][] = [];
const HPART: number[][] = [];
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
  {key: 'input', label: 'Input', sub: 'read x_t'},
  {key: 'wxhx', label: 'W_xh · x_t', sub: 'project input'},
  {key: 'whhh', label: '+ W_hh · h_{t−1}', sub: 'add recurrent'},
  {key: 'tanh', label: 'tanh', sub: 'non-linearity'},
  {key: 'why', label: 'W_hy · h_t', sub: 'compute output'},
];

// ─── Color helpers ────────────────────────────────────────────
function signedFill(v: number, maxAbs: number): string {
  if (maxAbs === 0) return '#f1f5f9';
  const t = Math.min(1, Math.abs(v) / maxAbs);
  if (v > 0) return `rgb(${Math.round(255 - t * 200)}, ${Math.round(255 - t * 80)}, ${Math.round(255 - t * 80)})`;
  if (v < 0) return `rgb(255, ${Math.round(255 - t * 200)}, ${Math.round(255 - t * 200)})`;
  return '#f1f5f9';
}

// ─── Vector / matrix views ────────────────────────────────────
function VectorView({
  vec,
  label,
  cellSize = 26,
  layout = 'col',
  highlighted = false,
  showValues = true,
}: {
  vec: number[];
  label?: string;
  cellSize?: number;
  layout?: 'row' | 'col';
  highlighted?: boolean;
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
          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={cellSize}
                height={cellSize}
                fill={signedFill(v, maxAbs)}
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

function MatrixView({mat, label, cellSize = 22}: {mat: number[][]; label: string; cellSize?: number}) {
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
                strokeWidth={0.5}
              />
              <text
                x={c * cellSize + cellSize / 2}
                y={r * cellSize + cellSize / 2 + 3}
                fontSize={8}
                textAnchor="middle"
                fill="#0f172a"
                fontFamily="ui-monospace, monospace"
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

// ─── Stage-specific panels ────────────────────────────────────
function StageInput({t}: {t: number}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-sky-300 bg-sky-50/40 p-5 dark:border-sky-700 dark:bg-sky-950/20">
      <p className="m-0 text-xs font-bold uppercase tracking-wide text-sky-800 dark:text-sky-300">
        Stage 1 · Read input x<sub>t</sub>
      </p>
      <VectorView vec={INPUTS[t]} label={`x_${t + 1}`} cellSize={32} />
      <p className="m-0 text-center font-mono text-[11px] text-slate-700 dark:text-slate-300">
        x<sub>{t + 1}</sub> ∈ ℝ<sup>{X_DIM}</sup>
      </p>
    </div>
  );
}

function StageWxhX({t}: {t: number}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-indigo-300 bg-indigo-50/40 p-5 dark:border-indigo-700 dark:bg-indigo-950/20">
      <p className="m-0 text-xs font-bold uppercase tracking-wide text-indigo-800 dark:text-indigo-300">
        Stage 2 · W<sub>xh</sub> · x<sub>t</sub>
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <MatrixView mat={W_XH} label={`W_xh (${H_DIM}×${X_DIM})`} />
        <span className="text-base text-slate-400">·</span>
        <VectorView vec={INPUTS[t]} label={`x_${t + 1}`} cellSize={22} />
        <span className="text-base text-slate-400">=</span>
        <VectorView vec={XPART[t]} label="result" cellSize={22} highlighted />
      </div>
      <p className="m-0 text-center font-mono text-[11px] text-slate-700 dark:text-slate-300">
        Project the input into hidden-state space.
      </p>
    </div>
  );
}

function StageWhhH({t}: {t: number}) {
  const hPrev = t === 0 ? H_INIT : HIDDEN[t - 1];
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-fuchsia-300 bg-fuchsia-50/40 p-5 dark:border-fuchsia-700 dark:bg-fuchsia-950/20">
      <p className="m-0 text-xs font-bold uppercase tracking-wide text-fuchsia-800 dark:text-fuchsia-300">
        Stage 3 · Add W<sub>hh</sub> · h<sub>t−1</sub> + b<sub>h</sub>
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <MatrixView mat={W_HH} label={`W_hh (${H_DIM}×${H_DIM})`} />
        <span className="text-base text-slate-400">·</span>
        <VectorView vec={hPrev} label={`h_${t}`} cellSize={22} />
        <span className="text-base text-slate-400">=</span>
        <VectorView vec={HPART[t]} label="recurrent part" cellSize={22} />
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2 border-t border-fuchsia-200 pt-3 dark:border-fuchsia-800/40">
        <VectorView vec={XPART[t]} label="W_xh·x" cellSize={20} />
        <span className="text-sm text-slate-400">+</span>
        <VectorView vec={HPART[t]} label="W_hh·h" cellSize={20} />
        <span className="text-sm text-slate-400">+</span>
        <VectorView vec={B_H} label="b_h" cellSize={20} />
        <span className="text-sm text-slate-400">=</span>
        <VectorView vec={PRE_TANH[t]} label="pre-tanh" cellSize={22} highlighted />
      </div>
      <p className="m-0 text-center font-mono text-[11px] text-slate-700 dark:text-slate-300">
        Combine the input projection with the recurrent contribution.
      </p>
    </div>
  );
}

function StageTanh({t}: {t: number}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-emerald-300 bg-emerald-50/40 p-5 dark:border-emerald-700 dark:bg-emerald-950/20">
      <p className="m-0 text-xs font-bold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
        Stage 4 · tanh (non-linearity)
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <VectorView vec={PRE_TANH[t]} label="pre-tanh" cellSize={28} />
        <span className="text-lg text-slate-400">→ tanh →</span>
        <VectorView vec={HIDDEN[t]} label={`h_${t + 1}`} cellSize={28} highlighted />
      </div>
      <p className="m-0 text-center font-mono text-[11px] text-slate-700 dark:text-slate-300">
        h<sub>t</sub> = tanh(W<sub>xh</sub>·x<sub>t</sub> + W<sub>hh</sub>·h<sub>t−1</sub> + b<sub>h</sub>)
      </p>
    </div>
  );
}

function StageOutput({t}: {t: number}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-amber-300 bg-amber-50/40 p-5 dark:border-amber-700 dark:bg-amber-950/20">
      <p className="m-0 text-xs font-bold uppercase tracking-wide text-amber-800 dark:text-amber-300">
        Stage 5 · Output y<sub>t</sub> = W<sub>hy</sub> · h<sub>t</sub> + b<sub>y</sub>
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <MatrixView mat={W_HY} label={`W_hy (${Y_DIM}×${H_DIM})`} />
        <span className="text-base text-slate-400">·</span>
        <VectorView vec={HIDDEN[t]} label={`h_${t + 1}`} cellSize={22} />
        <span className="text-base text-slate-400">+</span>
        <VectorView vec={B_Y} label="b_y" cellSize={22} />
        <span className="text-base text-slate-400">=</span>
        <VectorView vec={OUTPUTS[t]} label={`y_${t + 1}`} cellSize={28} highlighted />
      </div>
      <p className="m-0 text-center font-mono text-[11px] text-slate-700 dark:text-slate-300">
        Project the hidden state into output space.
      </p>
    </div>
  );
}

function StageView({stage, t}: {stage: number; t: number}) {
  switch (stage) {
    case 0:
      return <StageInput t={t} />;
    case 1:
      return <StageWxhX t={t} />;
    case 2:
      return <StageWhhH t={t} />;
    case 3:
      return <StageTanh t={t} />;
    case 4:
      return <StageOutput t={t} />;
    default:
      return null;
  }
}

// ─── Timeline summary ─────────────────────────────────────────
function Timeline({t, stage}: {t: number; stage: number}) {
  return (
    <div className="rounded-xl border-2 border-slate-200 bg-slate-50/40 p-4 dark:border-slate-700 dark:bg-slate-800/30">
      <p className="m-0 mb-3 text-center text-[11px] font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300">
        Sequence overview · t=1 … t={T}
      </p>
      <div className="flex items-stretch justify-between gap-1 overflow-x-auto">
        {Array.from({length: T}).map((_, ti) => {
          const isActive = ti === t;
          const reached = ti < t || (ti === t && stage >= 4);
          return (
            <React.Fragment key={ti}>
              <div
                className={`flex min-w-[64px] flex-col items-center gap-1.5 rounded-md border-2 p-1.5 transition-all ${
                  isActive
                    ? 'border-teal-500 bg-teal-50 dark:border-teal-500 dark:bg-teal-950/40'
                    : reached
                      ? 'border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800/60'
                      : 'border-dashed border-slate-300 bg-slate-50 opacity-50 dark:border-slate-700 dark:bg-slate-800/20'
                }`}
              >
                <span
                  className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                    isActive
                      ? 'bg-teal-600 text-white'
                      : reached
                        ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                        : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                  }`}
                >
                  t = {ti + 1}
                </span>
                {reached || isActive ? (
                  <>
                    <VectorView vec={INPUTS[ti]} label="x" cellSize={14} layout="col" showValues={false} />
                    <span className="text-[9px] text-slate-400">↓</span>
                    <VectorView
                      vec={ti < t || (ti === t && stage >= 3) ? HIDDEN[ti] : new Array(H_DIM).fill(0)}
                      label="h"
                      cellSize={14}
                      layout="col"
                      showValues={false}
                      highlighted={isActive && stage >= 3}
                    />
                    <span className="text-[9px] text-slate-400">↓</span>
                    <VectorView
                      vec={ti < t || (ti === t && stage >= 4) ? OUTPUTS[ti] : new Array(Y_DIM).fill(0)}
                      label="y"
                      cellSize={14}
                      layout="col"
                      showValues={false}
                      highlighted={isActive && stage >= 4}
                    />
                  </>
                ) : (
                  <div className="h-[120px] w-[14px] rounded border border-dashed border-slate-300 dark:border-slate-600" />
                )}
              </div>
              {ti < T - 1 && (
                <div className="flex items-center" aria-hidden>
                  <span className={`text-sm ${reached ? 'text-fuchsia-500' : 'text-slate-300 dark:text-slate-600'}`}>
                    →
                  </span>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────
export default function RNNForwardPass() {
  const [t, setT] = useState(0);
  const [stage, setStage] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(900);

  const reset = useCallback(() => {
    setT(0);
    setStage(0);
    setPlaying(false);
  }, []);

  const advance = useCallback(() => {
    setStage((s) => {
      if (s < STAGES.length - 1) return s + 1;
      // stage wraps; advance t
      setT((cur) => (cur < T - 1 ? cur + 1 : cur));
      return s < STAGES.length - 1 ? s + 1 : 0;
    });
  }, []);

  useEffect(() => {
    if (!playing) return;
    if (t >= T - 1 && stage >= STAGES.length - 1) {
      setPlaying(false);
      return;
    }
    const id = setTimeout(advance, speed);
    return () => clearTimeout(id);
  }, [playing, stage, t, speed, advance]);

  const stepForward = useCallback(() => {
    setPlaying(false);
    if (stage < STAGES.length - 1) {
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
      setStage(STAGES.length - 1);
    }
  }, [stage, t]);

  const isDone = t >= T - 1 && stage >= STAGES.length - 1;

  return (
    <div className="not-prose my-6 overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="border-b border-slate-200 bg-gradient-to-br from-slate-50 to-white px-6 py-5 dark:border-slate-700 dark:from-slate-800 dark:to-slate-900">
        <p className="m-0 text-xl font-bold text-slate-900 dark:text-slate-100">
          RNN forward pass, stage by stage
        </p>
        <p className="m-0 mt-2 max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          Walk through every matrix multiply of one RNN timestep, then advance through all 5 timesteps. Live values, real arithmetic.
        </p>
      </div>

      <div className="space-y-4 p-4 md:p-6">
        {/* Timestep selector */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300">
            Timestep:
          </span>
          {Array.from({length: T}).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setT(i);
                setStage(0);
                setPlaying(false);
              }}
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
          ))}
        </div>

        {/* Stage chips */}
        <div className="flex flex-wrap items-center gap-1 rounded-lg border border-slate-200 bg-slate-50/60 p-2 dark:border-slate-700 dark:bg-slate-800/30">
          <span className="mr-1 text-[10px] font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
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
                  className={`rounded px-2 py-1 text-[10px] font-semibold transition-colors ${
                    isActive
                      ? 'bg-teal-600 text-white'
                      : isPast
                        ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200'
                        : 'border border-slate-300 bg-white text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {i + 1}. {s.label}
                </button>
                {i < STAGES.length - 1 && <span className="text-slate-300 dark:text-slate-600">→</span>}
              </React.Fragment>
            );
          })}
        </div>

        {/* Active stage panel */}
        <StageView stage={stage} t={t} />

        {/* Timeline */}
        <Timeline t={t} stage={stage} />

        {/* Master equations */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-800/30">
          <p className="m-0 mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300">
            The two equations being applied at every timestep
          </p>
          <p className="m-0 text-center font-mono text-sm text-slate-900 dark:text-slate-100">
            h<sub>t</sub> = tanh(W<sub>xh</sub> · x<sub>t</sub> + W<sub>hh</sub> · h<sub>t−1</sub> + b<sub>h</sub>)
          </p>
          <p className="m-0 mt-2 text-center font-mono text-sm text-slate-900 dark:text-slate-100">
            y<sub>t</sub> = W<sub>hy</sub> · h<sub>t</sub> + b<sub>y</sub>
          </p>
          <p className="m-0 mt-3 text-center text-[11px] italic text-slate-600 dark:text-slate-400">
            <strong>Same W<sub>xh</sub>, W<sub>hh</sub>, W<sub>hy</sub> reused at every timestep</strong> — that's
            weight sharing, the reason RNNs handle variable-length sequences with a fixed number of parameters.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/30">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={stepBack}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              aria-label="Previous stage"
            >
              ◀
            </button>
            <button
              type="button"
              onClick={() => {
                if (isDone) {
                  reset();
                  setPlaying(true);
                } else {
                  setPlaying((p) => !p);
                }
              }}
              className="rounded-md bg-teal-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-teal-700"
            >
              {playing ? '❚❚ Pause' : isDone ? '↺ Replay' : '▶ Play'}
            </button>
            <button
              type="button"
              onClick={stepForward}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              aria-label="Next stage"
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
          <div className="flex items-center gap-3 text-[11px] text-slate-600 dark:text-slate-400">
            <span className="font-mono">
              t={t + 1}, stage={stage + 1}/{STAGES.length}
            </span>
            <label htmlFor="rnnfp-speed">Speed</label>
            <input
              id="rnnfp-speed"
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
