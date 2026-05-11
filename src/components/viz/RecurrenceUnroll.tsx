import React, {useCallback, useEffect, useMemo, useState} from 'react';

// ─── Setup ────────────────────────────────────────────────────
const T = 4;
const X_DIM = 3;
const H_DIM = 4;

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
const B_H = [0.0, 0.0, 0.0, 0.0];

// One-hot pulse sliding across input dimensions — visually unambiguous.
const INPUTS: number[][] = [
  [1.0, 0.0, 0.0],
  [0.0, 1.0, 0.0],
  [0.0, 0.0, 1.0],
  [1.0, 1.0, 0.0],
];

function matVecMul(M: number[][], v: number[]): number[] {
  return M.map((row) => row.reduce((s, w, i) => s + w * v[i], 0));
}
function vecAdd(a: number[], b: number[]): number[] {
  return a.map((v, i) => v + b[i]);
}
function tanhVec(v: number[]): number[] {
  return v.map((x) => Math.tanh(x));
}

const HIDDEN: number[][] = (() => {
  const out: number[][] = [];
  let h = new Array(H_DIM).fill(0);
  for (let t = 0; t < T; t++) {
    const xp = matVecMul(W_XH, INPUTS[t]);
    const hp = matVecMul(W_HH, h);
    h = tanhVec(vecAdd(vecAdd(xp, hp), B_H));
    out.push([...h]);
  }
  return out;
})();

// ─── Color helpers ────────────────────────────────────────────
function signedFill(v: number, maxAbs: number): string {
  if (maxAbs === 0) return '#f1f5f9';
  const t = Math.min(1, Math.abs(v) / maxAbs);
  if (v > 0) return `rgb(${Math.round(255 - t * 200)}, ${Math.round(255 - t * 80)}, ${Math.round(255 - t * 80)})`;
  if (v < 0) return `rgb(255, ${Math.round(255 - t * 200)}, ${Math.round(255 - t * 200)})`;
  return '#f1f5f9';
}
function inputFill(v: number, maxAbs: number): string {
  const t = Math.min(1, Math.abs(v) / Math.max(0.001, maxAbs));
  const r = Math.round(238 - t * 130);
  const g = Math.round(242 - t * 90);
  const b = Math.round(255 - t * 30);
  return `rgb(${r}, ${g}, ${b})`;
}

// ─── Vector as vertical bars ──────────────────────────────────
function VectorBars({
  vec,
  tone,
  empty = false,
}: {
  vec: number[];
  tone: 'input' | 'hidden';
  empty?: boolean;
}) {
  const barW = 16;
  const gap = 5;
  const H = 56;
  const center = H / 2;
  const totalW = vec.length * barW + (vec.length - 1) * gap;
  const maxAbs = Math.max(0.001, ...vec.map(Math.abs), 1);
  const fillPos = tone === 'input' ? '#6366f1' : '#0d9488';
  const fillNeg = '#f43f5e';
  return (
    <svg viewBox={`0 0 ${totalW} ${H}`} width={totalW} height={H} className="block">
      {/* Dashed zero-line */}
      <line
        x1={0}
        y1={center}
        x2={totalW}
        y2={center}
        stroke="#cbd5e1"
        strokeWidth={0.5}
        strokeDasharray="2,3"
      />
      {vec.map((v, i) => {
        const x = i * (barW + gap);
        // Background track
        const trackY = 2;
        const trackH = H - 4;
        // Bar
        const t = Math.min(1, Math.abs(v) / maxAbs);
        const barH = empty ? 0 : t * (H / 2 - 4);
        const barY = v >= 0 ? center - barH : center;
        const fill = v >= 0 ? fillPos : fillNeg;
        return (
          <g key={i}>
            <rect
              x={x}
              y={trackY}
              width={barW}
              height={trackH}
              fill="#e2e8f0"
              opacity={0.45}
              rx={3}
            />
            {!empty && barH > 0.5 && (
              <rect x={x} y={barY} width={barW} height={barH} fill={fill} rx={3} />
            )}
          </g>
        );
      })}
    </svg>
  );
}

// Small matrix preview (for the shared-weights badge)
function MatrixThumb({mat, label}: {mat: number[][]; label: string}) {
  const cell = 14;
  const H = mat.length;
  const W = mat[0].length;
  const maxAbs = useMemo(() => {
    let m = 0;
    mat.forEach((row) => row.forEach((v) => (m = Math.max(m, Math.abs(v)))));
    return m === 0 ? 1 : m;
  }, [mat]);
  return (
    <div className="flex flex-col items-center gap-1.5">
      <p className="m-0 font-mono text-xs font-bold text-amber-900 dark:text-amber-200">{label}</p>
      <svg viewBox={`0 0 ${W * cell} ${H * cell}`} width={W * cell} height={H * cell}>
        {mat.map((row, r) =>
          row.map((v, c) => (
            <rect
              key={`${r}-${c}`}
              x={c * cell}
              y={r * cell}
              width={cell}
              height={cell}
              fill={signedFill(v, maxAbs)}
              stroke="#cbd5e1"
              strokeWidth={0.4}
              rx={1}
            />
          )),
        )}
      </svg>
    </div>
  );
}

// ─── Timestep column ──────────────────────────────────────────
function TimestepColumn({t, current}: {t: number; current: number}) {
  const isActive = t === current;
  const isPast = t < current;
  const isFuture = t > current;
  const x_t = INPUTS[t];
  const h_t = HIDDEN[t];

  return (
    <div
      className={`flex flex-col items-center gap-2 rounded-2xl border-2 px-3 py-4 transition-all duration-200 ${
        isActive
          ? 'border-teal-500 bg-teal-50 shadow-lg dark:border-teal-500 dark:bg-teal-950/50'
          : isPast
            ? 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800/60'
            : 'border-dashed border-slate-300 bg-slate-50/40 dark:border-slate-700 dark:bg-slate-800/20'
      }`}
    >
      <span
        className={`rounded-full px-2.5 py-0.5 text-xs font-bold tracking-wide ${
          isActive
            ? 'bg-teal-600 text-white'
            : isPast
              ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
              : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
        }`}
      >
        t = {t + 1}
      </span>

      {/* Input bars */}
      <div className="flex flex-col items-center gap-1.5">
        <p className="m-0 font-mono text-xs font-bold text-indigo-700 dark:text-indigo-300">
          x<sub>{t + 1}</sub>
        </p>
        <VectorBars vec={x_t} tone="input" empty={isFuture} />
      </div>

      <span className="text-base text-slate-300 dark:text-slate-600" aria-hidden>↓</span>

      {/* The cell — visually IDENTICAL across all timesteps */}
      <div
        className={`flex h-16 w-24 items-center justify-center rounded-xl text-xl font-bold transition-all ${
          isActive
            ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg'
            : isFuture
              ? 'bg-gradient-to-br from-amber-100 to-amber-200 text-amber-700 opacity-50 dark:from-amber-950/40 dark:to-amber-900/40'
              : 'bg-gradient-to-br from-amber-200 to-orange-300 text-amber-900 dark:from-amber-900/60 dark:to-orange-900/60 dark:text-amber-100'
        }`}
      >
        f
      </div>

      <span className="text-base text-slate-300 dark:text-slate-600" aria-hidden>↓</span>

      {/* Hidden state bars */}
      <div className="flex flex-col items-center gap-1.5">
        <p className="m-0 font-mono text-xs font-bold text-teal-700 dark:text-teal-300">
          h<sub>{t + 1}</sub>
        </p>
        <VectorBars vec={h_t} tone="hidden" empty={isFuture} />
      </div>
    </div>
  );
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
export default function RecurrenceUnroll() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1100);

  const advance = useCallback(() => {
    setStep((s) => (s + 1 < T ? s + 1 : s));
  }, []);
  const reset = useCallback(() => {
    setStep(0);
    setPlaying(false);
  }, []);

  useEffect(() => {
    if (!playing) return;
    if (step >= T - 1) {
      setPlaying(false);
      return;
    }
    const id = setTimeout(advance, speed);
    return () => clearTimeout(id);
  }, [playing, step, speed, advance]);

  const atEnd = step >= T - 1;

  return (
    <div className="not-prose my-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-900">
      <div className="border-b border-slate-200 bg-gradient-to-br from-slate-50 to-white px-6 py-5 dark:border-slate-700 dark:from-slate-800 dark:to-slate-900">
        <p className="m-0 text-xl font-bold text-slate-900 dark:text-slate-100">
          One cell, reused at every timestep
        </p>
        <p className="m-0 mt-2 max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          That's <strong>recurrence</strong>: a single function <strong className="text-amber-700 dark:text-amber-300">f</strong> with one
          fixed set of weights, applied repeatedly across time. As you step forward, the <strong className="text-indigo-700 dark:text-indigo-300">input x<sub>t</sub></strong>{' '}
          changes and the <strong className="text-teal-700 dark:text-teal-300">hidden state h<sub>t</sub></strong> evolves —
          but <em>the cell itself is the same one, replicated five times</em>.
        </p>
      </div>

      <div className="space-y-5 p-6">
        {/* Stepper */}
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {Array.from({length: T}).map((_, i) => {
            const isActive = i === step;
            const isPast = i < step;
            return (
              <React.Fragment key={i}>
                <button
                  type="button"
                  onClick={() => { setStep(i); setPlaying(false); }}
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-teal-600 text-white shadow-sm'
                      : isPast
                        ? 'bg-teal-100 text-teal-800 hover:bg-teal-200 dark:bg-teal-900/40 dark:text-teal-200 dark:hover:bg-teal-900/60'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                  }`}
                >
                  t = {i + 1}
                </button>
                {i < T - 1 && <span className="text-slate-300 dark:text-slate-600">→</span>}
              </React.Fragment>
            );
          })}
        </div>

        {/* Shared weights badge */}
        <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/60 p-4 dark:border-amber-700 dark:bg-amber-950/30">
          <div className="flex flex-wrap items-center justify-center gap-5">
            <div className="text-left">
              <p className="m-0 text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                Shared weights
              </p>
              <p className="m-0 mt-1 text-sm text-slate-700 dark:text-slate-300">
                Same values <em>at every timestep</em>
              </p>
            </div>
            <MatrixThumb mat={W_XH} label="W_xh" />
            <MatrixThumb mat={W_HH} label="W_hh" />
            <MatrixThumb mat={[B_H]} label="b_h" />
          </div>
          <div className="mt-3 flex justify-center">
            <span className="rounded-full bg-amber-200 px-3 py-1 text-xs font-semibold text-amber-900 dark:bg-amber-900/60 dark:text-amber-100">
              ↓ injected into every <strong>f</strong> below
            </span>
          </div>
        </div>

        {/* The unrolled chain */}
        <div className="overflow-x-auto rounded-2xl bg-slate-50/60 p-4 dark:bg-slate-800/30">
          <div className="flex min-w-min items-stretch justify-between gap-2">
            {Array.from({length: T}).map((_, i) => (
              <React.Fragment key={i}>
                <TimestepColumn t={i} current={step} />
                {i < T - 1 && (
                  <div className="flex flex-col items-center justify-center" aria-hidden>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                      h<sub>{i + 1}</sub>
                    </div>
                    <span
                      className={`text-2xl ${
                        i < step ? 'text-teal-500' : 'text-slate-300 dark:text-slate-600'
                      }`}
                    >
                      →
                    </span>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Equation */}
        <div className="rounded-2xl bg-slate-50 px-5 py-4 dark:bg-slate-800/40">
          <p className="m-0 text-center font-mono text-base text-slate-900 dark:text-slate-100">
            h<sub>t</sub> = tanh(<span className="text-amber-700 dark:text-amber-300">W<sub>xh</sub></span> · x<sub>t</sub> +{' '}
            <span className="text-amber-700 dark:text-amber-300">W<sub>hh</sub></span> · h<sub>t−1</sub> +{' '}
            <span className="text-amber-700 dark:text-amber-300">b<sub>h</sub></span>)
          </p>
          <p className="m-0 mt-2 text-center text-xs text-slate-600 dark:text-slate-400">
            The orange terms are the <strong>same</strong> at every timestep. Only x<sub>t</sub> and h<sub>t−1</sub> differ.
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
            <GhostBtn onClick={() => { setPlaying(false); setStep(Math.min(T - 1, step + 1)); }} ariaLabel="Next">
              ▶
            </GhostBtn>
            <GhostBtn onClick={reset}>Reset</GhostBtn>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
            <label htmlFor="recur-speed" className="text-xs font-medium uppercase tracking-wide">
              Speed
            </label>
            <input
              id="recur-speed"
              type="range"
              min={400}
              max={2500}
              step={100}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="w-28 accent-teal-600"
            />
            <span className="font-mono text-xs tabular-nums">{speed}ms</span>
          </div>
        </div>
      </div>
    </div>
  );
}
