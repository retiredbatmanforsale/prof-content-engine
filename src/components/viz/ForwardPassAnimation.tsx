import React, {useCallback, useEffect, useMemo, useState} from 'react';

// ─── Data: 8×8 binary image of a vertical bar ("I") ───────────
const INPUT: number[][] = [
  [0, 0, 0, 1, 1, 0, 0, 0],
  [0, 0, 0, 1, 1, 0, 0, 0],
  [0, 0, 0, 1, 1, 0, 0, 0],
  [0, 0, 0, 1, 1, 0, 0, 0],
  [0, 0, 0, 1, 1, 0, 0, 0],
  [0, 0, 0, 1, 1, 0, 0, 0],
  [0, 0, 0, 1, 1, 0, 0, 0],
  [0, 0, 0, 1, 1, 0, 0, 0],
];

const F_VERT: number[][] = [
  [-1, 0, 1],
  [-1, 0, 1],
  [-1, 0, 1],
];
const F_HORIZ: number[][] = [
  [-1, -1, -1],
  [0, 0, 0],
  [1, 1, 1],
];

// 3 hand-designed FC class templates (18 weights each — 9 from each pooled map)
const W_FC: number[][] = [
  // Class "I" — strong vertical edges, weak horizontal
  [0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, -0.4, -0.4, -0.4, -0.4, -0.4, -0.4, -0.4, -0.4, -0.4],
  // Class "—" — strong horizontal edges, weak vertical
  [-0.4, -0.4, -0.4, -0.4, -0.4, -0.4, -0.4, -0.4, -0.4, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9],
  // Class "+" — both
  [0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4],
];
const CLASS_NAMES = ['I', '—', '+'];

// ─── Math helpers ─────────────────────────────────────────────
function conv2d(img: number[][], k: number[][]): number[][] {
  const H = img.length;
  const W = img[0].length;
  const K = k.length;
  const out: number[][] = [];
  for (let i = 0; i <= H - K; i++) {
    out[i] = [];
    for (let j = 0; j <= W - K; j++) {
      let s = 0;
      for (let m = 0; m < K; m++) {
        for (let n = 0; n < K; n++) {
          s += img[i + m][j + n] * k[m][n];
        }
      }
      out[i][j] = s;
    }
  }
  return out;
}
function relu2d(m: number[][]): number[][] {
  return m.map((row) => row.map((v) => Math.max(0, v)));
}
function maxPool(m: number[][]): number[][] {
  const H = m.length;
  const W = m[0].length;
  const out: number[][] = [];
  for (let i = 0; i < Math.floor(H / 2); i++) {
    out[i] = [];
    for (let j = 0; j < Math.floor(W / 2); j++) {
      const r = i * 2;
      const c = j * 2;
      out[i][j] = Math.max(m[r][c], m[r][c + 1], m[r + 1][c], m[r + 1][c + 1]);
    }
  }
  return out;
}
function softmax(arr: number[]): number[] {
  const m = Math.max(...arr);
  const e = arr.map((v) => Math.exp(v - m));
  const s = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / s);
}

// ─── Precompute the forward pass once ─────────────────────────
const CONV_V = conv2d(INPUT, F_VERT);
const CONV_H = conv2d(INPUT, F_HORIZ);
const RELU_V = relu2d(CONV_V);
const RELU_H = relu2d(CONV_H);
const POOL_V = maxPool(RELU_V);
const POOL_H = maxPool(RELU_H);
const FLAT = [...POOL_V.flat(), ...POOL_H.flat()];
const LOGITS = W_FC.map((w) => w.reduce((s, wi, i) => s + wi * FLAT[i], 0));
const PROBS = softmax(LOGITS);
const PREDICTION = PROBS.indexOf(Math.max(...PROBS));

const STAGES = [
  {label: 'Input', sub: '8 × 8 image'},
  {label: 'Conv', sub: '2 filters · 3 × 3'},
  {label: 'ReLU', sub: 'max(0, x)'},
  {label: 'Pool', sub: '2 × 2 max'},
  {label: 'Flatten', sub: 'tensor → vector'},
  {label: 'FC', sub: '18 → 3'},
  {label: 'Softmax', sub: 'logits → probs'},
  {label: 'Predict', sub: 'argmax'},
];

// ─── Color helpers ────────────────────────────────────────────
function grayFill(v: number): string {
  const x = Math.round(255 * Math.max(0, Math.min(1, v)));
  return `rgb(${x},${x},${x})`;
}
function signedFill(v: number, max: number): string {
  if (max === 0) return '#f1f5f9';
  const t = Math.min(1, Math.abs(v) / max);
  if (v > 0) {
    const r = Math.round(255 - t * 200);
    return `rgb(${r}, ${Math.round(255 - t * 100)}, ${Math.round(255 - t * 100)})`;
  }
  if (v < 0) {
    return `rgb(255, ${Math.round(255 - t * 200)}, ${Math.round(255 - t * 200)})`;
  }
  return '#f1f5f9';
}

// ─── Generic 2D grid ──────────────────────────────────────────
interface GridProps {
  data: number[][];
  cellSize?: number;
  mode?: 'gray' | 'signed';
  showValues?: boolean;
}
function Grid({data, cellSize = 18, mode = 'gray', showValues = false}: GridProps) {
  const H = data.length;
  const W = data[0].length;
  const maxAbs = useMemo(() => {
    let m = 0;
    data.forEach((row) => row.forEach((v) => (m = Math.max(m, Math.abs(v)))));
    return m;
  }, [data]);
  return (
    <svg
      viewBox={`0 0 ${W * cellSize} ${H * cellSize}`}
      width={W * cellSize}
      height={H * cellSize}
      className="block"
    >
      {data.map((row, r) =>
        row.map((v, c) => {
          const fill = mode === 'signed' ? signedFill(v, maxAbs) : grayFill(v);
          return (
            <g key={`${r}-${c}`}>
              <rect
                x={c * cellSize}
                y={r * cellSize}
                width={cellSize}
                height={cellSize}
                fill={fill}
                stroke="#cbd5e1"
                strokeWidth={0.5}
              />
              {showValues && (
                <text
                  x={c * cellSize + cellSize / 2}
                  y={r * cellSize + cellSize / 2 + 3}
                  fontSize={Math.max(8, cellSize * 0.4)}
                  textAnchor="middle"
                  fill={Math.abs(v) > maxAbs * 0.5 && mode === 'gray' && v > 0.5 ? '#0f172a' : '#0f172a'}
                  fontFamily="ui-monospace, monospace"
                >
                  {Number.isInteger(v) ? v : v.toFixed(1)}
                </text>
              )}
            </g>
          );
        }),
      )}
    </svg>
  );
}

// ─── Small kernel display with numeric labels ─────────────────
function KernelView({kernel, label}: {kernel: number[][]; label: string}) {
  const cell = 22;
  const size = kernel.length;
  return (
    <div className="flex flex-col items-center gap-1">
      <p className="m-0 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <svg
        viewBox={`0 0 ${size * cell} ${size * cell}`}
        width={size * cell}
        height={size * cell}
        className="block"
      >
        {kernel.map((row, r) =>
          row.map((v, c) => (
            <g key={`${r}-${c}`}>
              <rect
                x={c * cell}
                y={r * cell}
                width={cell}
                height={cell}
                fill={v === 0 ? '#f1f5f9' : v > 0 ? '#a7f3d0' : '#fecaca'}
                stroke="#cbd5e1"
                strokeWidth={0.5}
              />
              <text
                x={c * cell + cell / 2}
                y={r * cell + cell / 2 + 3}
                fontSize={9}
                textAnchor="middle"
                fill="#0f172a"
                fontFamily="ui-monospace, monospace"
              >
                {v}
              </text>
            </g>
          )),
        )}
      </svg>
    </div>
  );
}

// ─── 1D vector / bar visual ───────────────────────────────────
function FlatBar({values, highlightIndex}: {values: number[]; highlightIndex?: number}) {
  const cellW = 16;
  const cellH = 28;
  const maxAbs = Math.max(0.001, ...values.map(Math.abs));
  return (
    <svg
      viewBox={`0 0 ${values.length * cellW} ${cellH}`}
      width={values.length * cellW}
      height={cellH}
      className="block"
    >
      {values.map((v, i) => (
        <g key={i}>
          <rect
            x={i * cellW}
            y={0}
            width={cellW}
            height={cellH}
            fill={signedFill(v, maxAbs)}
            stroke={highlightIndex === i ? '#0d9488' : '#cbd5e1'}
            strokeWidth={highlightIndex === i ? 2 : 0.5}
          />
          <text
            x={i * cellW + cellW / 2}
            y={cellH / 2 + 3}
            fontSize={8}
            textAnchor="middle"
            fill="#0f172a"
            fontFamily="ui-monospace, monospace"
          >
            {v.toFixed(1)}
          </text>
        </g>
      ))}
    </svg>
  );
}

// ─── Probability bars ─────────────────────────────────────────
function ProbBars({probs, winner}: {probs: number[]; winner: number}) {
  return (
    <div className="flex flex-col gap-1.5">
      {probs.map((p, i) => {
        const isWin = i === winner;
        return (
          <div key={i} className="flex items-center gap-2">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-md font-mono text-sm font-bold ${
                isWin
                  ? 'bg-emerald-500 text-white ring-2 ring-emerald-700'
                  : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
              }`}
            >
              {CLASS_NAMES[i]}
            </span>
            <div className="relative h-5 w-44 overflow-hidden rounded bg-slate-100 dark:bg-slate-800">
              <div
                className={`h-full rounded transition-all duration-300 ${
                  isWin ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'
                }`}
                style={{width: `${p * 100}%`}}
              />
            </div>
            <span className="w-12 text-right font-mono text-xs text-slate-600 dark:text-slate-400">
              {(p * 100).toFixed(1)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Stage card wrapper ───────────────────────────────────────
interface StageCardProps {
  index: number;
  current: number;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}
function StageCard({index, current, title, subtitle, children}: StageCardProps) {
  const isActive = index === current;
  const isRevealed = index <= current;
  return (
    <div
      className={`rounded-xl border-2 p-4 transition-all ${
        isActive
          ? 'border-teal-500 bg-teal-50 shadow-md dark:border-teal-500 dark:bg-teal-950/30'
          : isRevealed
            ? 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800/40'
            : 'border-dashed border-slate-300 bg-slate-50 opacity-60 dark:border-slate-700 dark:bg-slate-800/20 dark:opacity-50'
      }`}
    >
      <div className="flex items-baseline gap-3">
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
            isRevealed
              ? 'bg-teal-600 text-white'
              : 'bg-slate-300 text-slate-500 dark:bg-slate-600 dark:text-slate-400'
          }`}
        >
          {index + 1}
        </span>
        <div className="min-w-0">
          <p className="m-0 text-sm font-bold text-slate-900 dark:text-slate-100">{title}</p>
          <p className="m-0 text-[11px] text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
        {isActive && (
          <span className="ml-auto rounded-md bg-teal-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            ▶ now
          </span>
        )}
      </div>
      <div className="mt-3">
        {isRevealed ? (
          children
        ) : (
          <p className="m-0 text-[11px] italic text-slate-400 dark:text-slate-500">
            …waiting for upstream stage
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Stepper chip row ─────────────────────────────────────────
function Stepper({current, onJump}: {current: number; onJump: (i: number) => void}) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {STAGES.map((s, i) => {
        const isActive = i === current;
        const isPast = i < current;
        return (
          <React.Fragment key={s.label}>
            <button
              type="button"
              onClick={() => onJump(i)}
              className={`rounded-md px-2 py-1 text-[11px] font-semibold transition-colors ${
                isActive
                  ? 'bg-teal-600 text-white shadow-sm'
                  : isPast
                    ? 'bg-teal-100 text-teal-800 hover:bg-teal-200 dark:bg-teal-900/40 dark:text-teal-200 dark:hover:bg-teal-900/60'
                    : 'border border-slate-300 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
              }`}
            >
              {i + 1}. {s.label}
            </button>
            {i < STAGES.length - 1 && (
              <span className="text-slate-300 dark:text-slate-600" aria-hidden>
                →
              </span>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────
export default function ForwardPassAnimation() {
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1300);

  const reset = useCallback(() => {
    setCurrent(0);
    setPlaying(false);
  }, []);

  useEffect(() => {
    if (!playing) return;
    if (current >= STAGES.length - 1) {
      setPlaying(false);
      return;
    }
    const id = setTimeout(() => setCurrent((c) => c + 1), speed);
    return () => clearTimeout(id);
  }, [playing, current, speed]);

  return (
    <div className="not-prose my-6 overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/60">
        <p className="m-0 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Interactive · CNN forward pass
        </p>
        <p className="m-0 mt-1 text-xs text-slate-600 dark:text-slate-400">
          A toy 3-class CNN classifies a small image as <strong>I</strong>, <strong>—</strong>, or{' '}
          <strong>+</strong>. Press <strong>Play</strong> to step through every stage of the forward
          pass.
        </p>
      </div>

      <div className="p-4 md:p-6">
        <Stepper current={current} onJump={(i) => { setCurrent(i); setPlaying(false); }} />

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {/* Stage 1: Input */}
          <StageCard
            index={0}
            current={current}
            title="Input image"
            subtitle="8 × 8 grayscale — a vertical bar"
          >
            <div className="flex items-center justify-center">
              <Grid data={INPUT} cellSize={22} mode="gray" />
            </div>
          </StageCard>

          {/* Stage 2: Conv */}
          <StageCard
            index={1}
            current={current}
            title="Convolution"
            subtitle="2 learnable filters slide across the image"
          >
            <div className="flex flex-wrap items-center justify-center gap-3">
              <div className="flex flex-col items-center gap-2">
                <KernelView kernel={F_VERT} label="Vertical filter" />
                <KernelView kernel={F_HORIZ} label="Horizontal filter" />
              </div>
              <span className="text-xl text-slate-400 dark:text-slate-500">→</span>
              <div className="flex flex-col items-center gap-2">
                <p className="m-0 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Feature maps (6 × 6)
                </p>
                <div className="flex gap-2">
                  <Grid data={CONV_V} cellSize={14} mode="signed" />
                  <Grid data={CONV_H} cellSize={14} mode="signed" />
                </div>
              </div>
            </div>
          </StageCard>

          {/* Stage 3: ReLU */}
          <StageCard
            index={2}
            current={current}
            title="ReLU"
            subtitle="negatives → 0, positives pass through"
          >
            <div className="flex flex-wrap items-center justify-center gap-3">
              <div className="flex gap-1.5">
                <Grid data={CONV_V} cellSize={13} mode="signed" />
                <Grid data={CONV_H} cellSize={13} mode="signed" />
              </div>
              <span className="text-xl text-slate-400 dark:text-slate-500">→</span>
              <div className="flex gap-1.5">
                <Grid data={RELU_V} cellSize={13} mode="signed" />
                <Grid data={RELU_H} cellSize={13} mode="signed" />
              </div>
            </div>
          </StageCard>

          {/* Stage 4: Pool */}
          <StageCard
            index={3}
            current={current}
            title="Max pooling"
            subtitle="2 × 2 stride 2 → halve H and W"
          >
            <div className="flex flex-wrap items-center justify-center gap-3">
              <div className="flex gap-1.5">
                <Grid data={RELU_V} cellSize={13} mode="signed" />
                <Grid data={RELU_H} cellSize={13} mode="signed" />
              </div>
              <span className="text-xl text-slate-400 dark:text-slate-500">→</span>
              <div className="flex gap-2">
                <Grid data={POOL_V} cellSize={22} mode="signed" showValues />
                <Grid data={POOL_H} cellSize={22} mode="signed" showValues />
              </div>
            </div>
          </StageCard>

          {/* Stage 5: Flatten */}
          <StageCard
            index={4}
            current={current}
            title="Flatten"
            subtitle="3 × 3 × 2 tensor → 18-element vector"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="flex gap-2">
                <Grid data={POOL_V} cellSize={18} mode="signed" />
                <Grid data={POOL_H} cellSize={18} mode="signed" />
              </div>
              <span className="text-xl text-slate-400 dark:text-slate-500">↓</span>
              <div className="overflow-x-auto">
                <FlatBar values={FLAT} />
              </div>
            </div>
          </StageCard>

          {/* Stage 6: FC */}
          <StageCard
            index={5}
            current={current}
            title="Fully connected"
            subtitle="18 → 3 logits (one per class)"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="overflow-x-auto">
                <FlatBar values={FLAT} />
              </div>
              <span className="text-xl text-slate-400 dark:text-slate-500">↓ W·x</span>
              <div className="flex items-center gap-2">
                {LOGITS.map((l, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      {CLASS_NAMES[i]}
                    </span>
                    <span className="flex h-9 w-14 items-center justify-center rounded-md bg-slate-100 font-mono text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {l.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <p className="m-0 text-[10px] italic text-slate-500 dark:text-slate-400">
                logits (unnormalized scores)
              </p>
            </div>
          </StageCard>

          {/* Stage 7: Softmax */}
          <StageCard
            index={6}
            current={current}
            title="Softmax"
            subtitle="exponentiate + normalize → probabilities"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2">
                {LOGITS.map((l, i) => (
                  <span
                    key={i}
                    className="flex h-9 w-14 items-center justify-center rounded-md bg-slate-100 font-mono text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  >
                    {l.toFixed(2)}
                  </span>
                ))}
              </div>
              <span className="text-xl text-slate-400 dark:text-slate-500">↓ softmax</span>
              <div className="flex items-center gap-2">
                {PROBS.map((p, i) => (
                  <span
                    key={i}
                    className="flex h-9 w-14 items-center justify-center rounded-md bg-teal-100 font-mono text-xs font-bold text-teal-900 dark:bg-teal-900/40 dark:text-teal-200"
                  >
                    {(p * 100).toFixed(1)}%
                  </span>
                ))}
              </div>
            </div>
          </StageCard>

          {/* Stage 8: Predict */}
          <StageCard
            index={7}
            current={current}
            title="Prediction"
            subtitle="argmax → winning class"
          >
            <div className="flex flex-col items-center gap-3">
              <ProbBars probs={PROBS} winner={PREDICTION} />
              <p className="m-0 mt-2 text-center text-sm font-bold text-emerald-700 dark:text-emerald-300">
                ✓ Predicted class: <span className="font-mono text-lg">{CLASS_NAMES[PREDICTION]}</span>
              </p>
            </div>
          </StageCard>
        </div>

        {/* Controls */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/30">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setPlaying(false);
                setCurrent((c) => Math.max(0, c - 1));
              }}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              aria-label="Previous stage"
            >
              ◀
            </button>
            <button
              type="button"
              onClick={() => {
                if (current >= STAGES.length - 1) {
                  setCurrent(0);
                  setPlaying(true);
                } else {
                  setPlaying((p) => !p);
                }
              }}
              className="rounded-md bg-teal-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-teal-700"
            >
              {playing
                ? '❚❚ Pause'
                : current >= STAGES.length - 1
                  ? '↺ Replay'
                  : '▶ Play'}
            </button>
            <button
              type="button"
              onClick={() => {
                setPlaying(false);
                setCurrent((c) => Math.min(STAGES.length - 1, c + 1));
              }}
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
          <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400">
            <label htmlFor="fp-speed">Speed</label>
            <input
              id="fp-speed"
              type="range"
              min={500}
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
