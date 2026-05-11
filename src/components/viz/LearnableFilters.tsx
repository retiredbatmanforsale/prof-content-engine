import React, {useCallback, useEffect, useMemo, useState} from 'react';

// ─── Setup ────────────────────────────────────────────────────
const IMG_SIZE = 16;
const K_SIZE = 3;
const OUT_SIZE = IMG_SIZE - K_SIZE + 1; // 14
const MAX_STEPS = 300;
const LR = 0.02;

// 16×16 input with a vertical edge in the middle
const INPUT: number[][] = (() => {
  const m: number[][] = [];
  for (let i = 0; i < IMG_SIZE; i++) {
    m[i] = [];
    for (let j = 0; j < IMG_SIZE; j++) {
      m[i][j] = j < IMG_SIZE / 2 ? 0 : 1;
    }
  }
  return m;
})();

// Target kernel — what we hope the network rediscovers (Sobel-style vertical edge)
const TARGET_KERNEL: number[][] = [
  [-1, 0, 1],
  [-1, 0, 1],
  [-1, 0, 1],
];

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

function computeLoss(out: number[][], target: number[][]): number {
  const H = out.length;
  const W = out[0].length;
  let s = 0;
  for (let i = 0; i < H; i++) {
    for (let j = 0; j < W; j++) {
      const d = out[i][j] - target[i][j];
      s += d * d;
    }
  }
  return s / (H * W);
}

// dL/dK[m,n] = (2/N) * sum_{i,j} (out[i,j] - target[i,j]) * I[i+m, j+n]
function computeGradient(
  kernel: number[][],
  input: number[][],
  target: number[][],
): number[][] {
  const out = conv2d(input, kernel);
  const H = out.length;
  const W = out[0].length;
  const N = H * W;
  const grad: number[][] = [];
  for (let m = 0; m < K_SIZE; m++) {
    grad[m] = [];
    for (let n = 0; n < K_SIZE; n++) {
      let g = 0;
      for (let i = 0; i < H; i++) {
        for (let j = 0; j < W; j++) {
          g += 2 * (out[i][j] - target[i][j]) * input[i + m][j + n];
        }
      }
      grad[m][n] = g / N;
    }
  }
  return grad;
}

function gradStep(kernel: number[][], grad: number[][], lr: number): number[][] {
  const out: number[][] = [];
  for (let m = 0; m < K_SIZE; m++) {
    out[m] = [];
    for (let n = 0; n < K_SIZE; n++) {
      out[m][n] = kernel[m][n] - lr * grad[m][n];
    }
  }
  return out;
}

function randomKernel(): number[][] {
  const k: number[][] = [];
  for (let i = 0; i < K_SIZE; i++) {
    k[i] = [];
    for (let j = 0; j < K_SIZE; j++) {
      // small random init around 0
      k[i][j] = (Math.random() - 0.5) * 0.5;
    }
  }
  return k;
}

const TARGET = conv2d(INPUT, TARGET_KERNEL);

function initFresh() {
  const k = randomKernel();
  const out = conv2d(INPUT, k);
  const loss = computeLoss(out, TARGET);
  return {kernel: k, history: [loss], initialLoss: Math.max(loss, 0.5)};
}

// ─── Color helpers ────────────────────────────────────────────
function grayFill(v: number): string {
  const x = Math.round(255 * Math.max(0, Math.min(1, v)));
  return `rgb(${x},${x},${x})`;
}
function signedFill(v: number, maxAbs: number): string {
  if (maxAbs === 0) return '#f1f5f9';
  const t = Math.min(1, Math.abs(v) / maxAbs);
  if (v > 0) {
    return `rgb(${Math.round(255 - t * 200)}, ${Math.round(255 - t * 80)}, ${Math.round(255 - t * 80)})`;
  }
  if (v < 0) {
    return `rgb(255, ${Math.round(255 - t * 200)}, ${Math.round(255 - t * 200)})`;
  }
  return '#f1f5f9';
}

// ─── Sub-components ───────────────────────────────────────────
interface GridProps {
  data: number[][];
  cellSize?: number;
  mode?: 'gray' | 'signed';
  maxAbs?: number;
}
function Grid({data, cellSize = 14, mode = 'gray', maxAbs}: GridProps) {
  const H = data.length;
  const W = data[0].length;
  const max = useMemo(() => {
    if (maxAbs !== undefined) return maxAbs;
    let m = 0;
    data.forEach((row) => row.forEach((v) => (m = Math.max(m, Math.abs(v)))));
    return m;
  }, [data, maxAbs]);
  return (
    <svg
      viewBox={`0 0 ${W * cellSize} ${H * cellSize}`}
      width={W * cellSize}
      height={H * cellSize}
      className="block"
    >
      {data.map((row, r) =>
        row.map((v, c) => {
          const fill = mode === 'signed' ? signedFill(v, max) : grayFill(v);
          return (
            <rect
              key={`${r}-${c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize}
              height={cellSize}
              fill={fill}
              stroke="#cbd5e1"
              strokeWidth={0.5}
            />
          );
        }),
      )}
    </svg>
  );
}

function KernelDisplay({kernel}: {kernel: number[][]}) {
  const cell = 38;
  const size = kernel.length;
  const maxAbs = useMemo(() => {
    let m = 0;
    kernel.forEach((row) => row.forEach((v) => (m = Math.max(m, Math.abs(v)))));
    return m === 0 ? 1 : m;
  }, [kernel]);
  return (
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
              fill={signedFill(v, maxAbs)}
              stroke="#94a3b8"
              strokeWidth={0.75}
            />
            <text
              x={c * cell + cell / 2}
              y={r * cell + cell / 2 + 4}
              fontSize={11}
              textAnchor="middle"
              fill="#0f172a"
              fontFamily="ui-monospace, monospace"
              fontWeight={700}
            >
              {v.toFixed(2)}
            </text>
          </g>
        )),
      )}
    </svg>
  );
}

function LossCurve({
  history,
  maxLoss,
  totalSteps,
}: {
  history: number[];
  maxLoss: number;
  totalSteps: number;
}) {
  const W = 380;
  const H = 96;
  const pad = 4;
  const yScale = (v: number) => H - pad - (v / maxLoss) * (H - 2 * pad);
  const xStep = W / Math.max(1, totalSteps);
  const points = history.map((v, i) => `${i * xStep},${yScale(v)}`).join(' ');
  const last = history.length - 1;
  const lastX = last * xStep;
  const lastY = yScale(history[last]);
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height={H}
      preserveAspectRatio="none"
      style={{maxWidth: W}}
    >
      {/* Baseline (loss = 0) */}
      <line x1={0} y1={H - pad} x2={W} y2={H - pad} stroke="#cbd5e1" strokeWidth={1} strokeDasharray="3,3" />
      {/* Initial-loss line */}
      <line x1={0} y1={pad} x2={W} y2={pad} stroke="#fecaca" strokeWidth={1} strokeDasharray="3,3" />
      <polyline points={points} fill="none" stroke="#0d9488" strokeWidth={2.5} />
      <circle cx={lastX} cy={lastY} r={4} fill="#0d9488" />
    </svg>
  );
}

// ─── Main component ───────────────────────────────────────────
export default function LearnableFilters() {
  const [state, setState] = useState(() => initFresh());
  const [stepNum, setStepNum] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(40);

  const currentOutput = useMemo(() => conv2d(INPUT, state.kernel), [state.kernel]);
  const currentLoss = state.history[state.history.length - 1];
  const targetMaxAbs = useMemo(() => {
    let m = 0;
    TARGET.forEach((row) => row.forEach((v) => (m = Math.max(m, Math.abs(v)))));
    return m;
  }, []);

  const reset = useCallback(() => {
    setState(initFresh());
    setStepNum(0);
    setPlaying(false);
  }, []);

  const doStep = useCallback(() => {
    setState((cur) => {
      const grad = computeGradient(cur.kernel, INPUT, TARGET);
      const newK = gradStep(cur.kernel, grad, LR);
      const newOut = conv2d(INPUT, newK);
      const newLoss = computeLoss(newOut, TARGET);
      return {
        kernel: newK,
        history: [...cur.history, newLoss],
        initialLoss: cur.initialLoss,
      };
    });
    setStepNum((s) => s + 1);
  }, []);

  useEffect(() => {
    if (!playing) return;
    if (stepNum >= MAX_STEPS) {
      setPlaying(false);
      return;
    }
    const id = setTimeout(doStep, speed);
    return () => clearTimeout(id);
  }, [playing, stepNum, speed, doStep]);

  const isConverged = currentLoss < 0.02;

  return (
    <div className="not-prose my-6 overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/60">
        <p className="m-0 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Interactive · A filter learning by gradient descent
        </p>
        <p className="m-0 mt-1 text-xs text-slate-600 dark:text-slate-400">
          A 3×3 kernel starts at <strong>random noise</strong>. Each step computes{' '}
          <span className="font-mono">∂L/∂w</span> and applies{' '}
          <span className="font-mono">w ← w − η · ∂L/∂w</span>. Watch the values evolve into a
          vertical-edge detector — without anyone designing them.
        </p>
      </div>

      <div className="space-y-5 p-4 md:p-6">
        <div className="grid items-start gap-4 md:grid-cols-4">
          <div className="flex flex-col items-center gap-2">
            <p className="m-0 text-[11px] font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300">
              Input (16 × 16)
            </p>
            <Grid data={INPUT} cellSize={12} mode="gray" />
            <p className="m-0 text-[10px] italic text-slate-500 dark:text-slate-400">
              vertical edge
            </p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <p className="m-0 text-[11px] font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300">
              Learned kernel (3 × 3)
            </p>
            <KernelDisplay kernel={state.kernel} />
            <p className="m-0 text-[10px] italic text-slate-500 dark:text-slate-400">
              {stepNum === 0 ? 'random init' : `after ${stepNum} update${stepNum === 1 ? '' : 's'}`}
            </p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <p className="m-0 text-[11px] font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300">
              Current output
            </p>
            <Grid data={currentOutput} cellSize={12} mode="signed" maxAbs={targetMaxAbs} />
            <p className="m-0 text-[10px] italic text-slate-500 dark:text-slate-400">
              kernel applied to input
            </p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <p className="m-0 text-[11px] font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300">
              Target output
            </p>
            <Grid data={TARGET} cellSize={12} mode="signed" maxAbs={targetMaxAbs} />
            <p className="m-0 text-[10px] italic text-slate-500 dark:text-slate-400">
              what we&apos;d like to see
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-700 dark:bg-slate-800/30">
          <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
            <p className="m-0 text-[11px] font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300">
              Loss curve (MSE vs. target)
            </p>
            <p className="m-0 font-mono text-[11px] text-slate-700 dark:text-slate-300">
              step <strong>{stepNum}</strong> / {MAX_STEPS} · loss{' '}
              <strong className={isConverged ? 'text-emerald-700 dark:text-emerald-400' : ''}>
                {currentLoss.toFixed(3)}
              </strong>
              {isConverged && (
                <span className="ml-2 rounded bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  converged
                </span>
              )}
            </p>
          </div>
          <LossCurve
            history={state.history}
            maxLoss={state.initialLoss}
            totalSteps={MAX_STEPS}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/30">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              disabled={stepNum >= MAX_STEPS}
              className="rounded-md bg-teal-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {playing ? '❚❚ Pause' : stepNum >= MAX_STEPS ? '✓ Done' : '▶ Play'}
            </button>
            <button
              type="button"
              onClick={() => {
                setPlaying(false);
                doStep();
              }}
              disabled={stepNum >= MAX_STEPS}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Step ▶
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Reset (re-randomize)
            </button>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400">
            <label htmlFor="learn-speed">Speed</label>
            <input
              id="learn-speed"
              type="range"
              min={10}
              max={200}
              step={10}
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
