import React, {useCallback, useEffect, useMemo, useState} from 'react';

type KernelId = 'vertical-edge' | 'horizontal-edge' | 'blur' | 'sharpen';

interface KernelDef {
  name: string;
  description: string;
  matrix: number[][];
}

const KERNELS: Record<KernelId, KernelDef> = {
  'vertical-edge': {
    name: 'Vertical edge',
    description: 'Highlights vertical edges — left/right brightness change.',
    matrix: [
      [-1, 0, 1],
      [-1, 0, 1],
      [-1, 0, 1],
    ],
  },
  'horizontal-edge': {
    name: 'Horizontal edge',
    description: 'Highlights horizontal edges — top/bottom brightness change.',
    matrix: [
      [-1, -1, -1],
      [0, 0, 0],
      [1, 1, 1],
    ],
  },
  blur: {
    name: 'Blur',
    description: 'Box blur — averages a 3×3 neighborhood.',
    matrix: [
      [1 / 9, 1 / 9, 1 / 9],
      [1 / 9, 1 / 9, 1 / 9],
      [1 / 9, 1 / 9, 1 / 9],
    ],
  },
  sharpen: {
    name: 'Sharpen',
    description: 'Boosts the center pixel relative to its 4-neighbors.',
    matrix: [
      [0, -1, 0],
      [-1, 5, -1],
      [0, -1, 0],
    ],
  },
};

// 12×12 grayscale image — a plus / cross shape with soft anti-alias edges.
// Values in [0,1]: 0 = black, 1 = white.
const IMAGE: number[][] = [
  [0.1, 0.1, 0.1, 0.1, 0.2, 0.9, 0.9, 0.2, 0.1, 0.1, 0.1, 0.1],
  [0.1, 0.1, 0.1, 0.1, 0.2, 0.9, 0.9, 0.2, 0.1, 0.1, 0.1, 0.1],
  [0.1, 0.1, 0.1, 0.1, 0.2, 0.9, 0.9, 0.2, 0.1, 0.1, 0.1, 0.1],
  [0.1, 0.1, 0.1, 0.1, 0.2, 0.9, 0.9, 0.2, 0.1, 0.1, 0.1, 0.1],
  [0.2, 0.2, 0.2, 0.2, 0.2, 0.9, 0.9, 0.2, 0.2, 0.2, 0.2, 0.2],
  [0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9],
  [0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9],
  [0.2, 0.2, 0.2, 0.2, 0.2, 0.9, 0.9, 0.2, 0.2, 0.2, 0.2, 0.2],
  [0.1, 0.1, 0.1, 0.1, 0.2, 0.9, 0.9, 0.2, 0.1, 0.1, 0.1, 0.1],
  [0.1, 0.1, 0.1, 0.1, 0.2, 0.9, 0.9, 0.2, 0.1, 0.1, 0.1, 0.1],
  [0.1, 0.1, 0.1, 0.1, 0.2, 0.9, 0.9, 0.2, 0.1, 0.1, 0.1, 0.1],
  [0.1, 0.1, 0.1, 0.1, 0.2, 0.9, 0.9, 0.2, 0.1, 0.1, 0.1, 0.1],
];

const IMG_H = IMAGE.length;
const IMG_W = IMAGE[0].length;
const K_SIZE = 3;
const OUT_H = IMG_H - K_SIZE + 1;
const OUT_W = IMG_W - K_SIZE + 1;

function conv2dAt(row: number, col: number, kernel: number[][]): number {
  let sum = 0;
  for (let i = 0; i < K_SIZE; i++) {
    for (let j = 0; j < K_SIZE; j++) {
      sum += IMAGE[row + i][col + j] * kernel[i][j];
    }
  }
  return sum;
}

export default function ConvolutionAnimation() {
  const [kernelId, setKernelId] = useState<KernelId>('vertical-edge');
  const [pos, setPos] = useState({row: 0, col: 0});
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(280);
  const [filled, setFilled] = useState<Set<string>>(new Set(['0,0']));

  const kernel = KERNELS[kernelId];

  const fullOutputs = useMemo(() => {
    const m: number[][] = [];
    let min = Infinity;
    let max = -Infinity;
    for (let r = 0; r < OUT_H; r++) {
      m[r] = [];
      for (let c = 0; c < OUT_W; c++) {
        const v = conv2dAt(r, c, kernel.matrix);
        m[r][c] = v;
        if (v < min) min = v;
        if (v > max) max = v;
      }
    }
    return {m, min, max};
  }, [kernel.matrix]);

  const displayedOutput = useMemo(() => {
    const o: Record<string, number> = {};
    filled.forEach((key) => {
      const [r, c] = key.split(',').map(Number);
      o[key] = fullOutputs.m[r][c];
    });
    return o;
  }, [filled, fullOutputs]);

  const reset = useCallback(() => {
    setPos({row: 0, col: 0});
    setFilled(new Set(['0,0']));
    setPlaying(false);
  }, []);

  // Reset when kernel changes
  useEffect(() => {
    reset();
  }, [kernelId, reset]);

  const advance = useCallback(() => {
    setPos((cur) => {
      let nc = cur.col + 1;
      let nr = cur.row;
      if (nc > OUT_W - 1) {
        nc = 0;
        nr = cur.row + 1;
      }
      if (nr > OUT_H - 1) {
        return {row: 0, col: 0};
      }
      setFilled((prev) => {
        const next = new Set(prev);
        next.add(`${nr},${nc}`);
        return next;
      });
      return {row: nr, col: nc};
    });
  }, []);

  const stepBack = useCallback(() => {
    setPos((cur) => {
      let nc = cur.col - 1;
      let nr = cur.row;
      if (nc < 0) {
        nc = OUT_W - 1;
        nr = cur.row - 1;
      }
      if (nr < 0) {
        nr = OUT_H - 1;
        nc = OUT_W - 1;
      }
      return {row: nr, col: nc};
    });
  }, []);

  // Auto-play loop — stops once the kernel reaches the bottom-right cell
  useEffect(() => {
    if (!playing) return;
    if (pos.row === OUT_H - 1 && pos.col === OUT_W - 1) {
      setPlaying(false);
      return;
    }
    const id = setTimeout(advance, speed);
    return () => clearTimeout(id);
  }, [playing, pos.row, pos.col, speed, advance]);

  const currentValue = conv2dAt(pos.row, pos.col, kernel.matrix);
  const currentPatch = useMemo(() => {
    const p: number[][] = [];
    for (let i = 0; i < K_SIZE; i++) {
      p[i] = [];
      for (let j = 0; j < K_SIZE; j++) {
        p[i][j] = IMAGE[pos.row + i][pos.col + j];
      }
    }
    return p;
  }, [pos]);

  return (
    <div className="not-prose my-6 overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/60">
        <p className="m-0 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Interactive · Convolution animation
        </p>
        <div className="ml-auto flex flex-wrap items-center gap-1">
          <span className="mr-1 text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Kernel
          </span>
          {(Object.keys(KERNELS) as KernelId[]).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setKernelId(id)}
              className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                kernelId === id
                  ? 'bg-teal-600 text-white'
                  : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {KERNELS[id].name}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 md:p-6">
        <p className="m-0 mb-4 text-sm text-slate-700 dark:text-slate-300">
          <strong>{kernel.name}</strong> — {kernel.description} Press <strong>Play</strong> to
          slide the kernel across the image, or click a pixel to jump.
        </p>

        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr_1.2fr]">
          <div className="rounded-xl border-2 border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/40">
            <p className="m-0 mb-3 text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300">
              Input image ({IMG_H} × {IMG_W})
            </p>
            <InputImage
              image={IMAGE}
              kernelRow={pos.row}
              kernelCol={pos.col}
              onClick={(r, c) => {
                const maxR = OUT_H - 1;
                const maxC = OUT_W - 1;
                const nr = Math.min(r, maxR);
                const nc = Math.min(c, maxC);
                setPos({row: nr, col: nc});
                setFilled((prev) => {
                  const next = new Set(prev);
                  next.add(`${nr},${nc}`);
                  return next;
                });
                setPlaying(false);
              }}
            />
            <p className="m-0 mt-3 text-[11px] text-slate-500 dark:text-slate-400">
              Filter at <span className="font-mono">({pos.row}, {pos.col})</span> · click any pixel
              to jump
            </p>
          </div>

          <div className="rounded-xl border-2 border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
            <p className="m-0 mb-3 text-xs font-bold uppercase tracking-wide text-amber-900 dark:text-amber-200">
              Patch × kernel → sum
            </p>
            <Computation
              patch={currentPatch}
              kernel={kernel.matrix}
              sum={currentValue}
            />
          </div>

          <div className="rounded-xl border-2 border-teal-200 bg-teal-50/60 p-4 dark:border-teal-900/50 dark:bg-teal-950/20">
            <p className="m-0 mb-3 text-xs font-bold uppercase tracking-wide text-teal-900 dark:text-teal-200">
              Feature map ({OUT_H} × {OUT_W})
            </p>
            <FeatureMap
              displayed={displayedOutput}
              currentRow={pos.row}
              currentCol={pos.col}
              min={fullOutputs.min}
              max={fullOutputs.max}
            />
            <p className="m-0 mt-3 text-[11px] text-teal-800 dark:text-teal-300">
              Current = <span className="font-mono font-bold">{currentValue.toFixed(2)}</span>
              <span className="opacity-70">
                {' '} · filled {filled.size}/{OUT_H * OUT_W}
              </span>
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/30">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setPlaying(false);
                stepBack();
              }}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              aria-label="Step backward"
            >
              ◀
            </button>
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              className="rounded-md bg-teal-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-teal-700"
            >
              {playing ? '❚❚ Pause' : '▶ Play'}
            </button>
            <button
              type="button"
              onClick={() => {
                setPlaying(false);
                advance();
              }}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              aria-label="Step forward"
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
            <label htmlFor="conv-anim-speed">Speed</label>
            <input
              id="conv-anim-speed"
              type="range"
              min={80}
              max={800}
              step={20}
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

// ─── Sub-components ───────────────────────────────────────────

function valueToGray(v: number): string {
  const x = Math.round(255 * Math.max(0, Math.min(1, v)));
  return `rgb(${x},${x},${x})`;
}

interface InputImageProps {
  image: number[][];
  kernelRow: number;
  kernelCol: number;
  onClick: (r: number, c: number) => void;
}

function InputImage({image, kernelRow, kernelCol, onClick}: InputImageProps) {
  const cell = 22;
  const h = image.length;
  const w = image[0].length;
  return (
    <svg
      viewBox={`0 0 ${w * cell} ${h * cell}`}
      width="100%"
      style={{maxWidth: w * cell, height: 'auto', display: 'block'}}
      role="img"
      aria-label="Input image with kernel overlay"
    >
      {image.map((row, r) =>
        row.map((v, c) => {
          const inKernel =
            r >= kernelRow &&
            r < kernelRow + K_SIZE &&
            c >= kernelCol &&
            c < kernelCol + K_SIZE;
          return (
            <rect
              key={`${r}-${c}`}
              x={c * cell}
              y={r * cell}
              width={cell}
              height={cell}
              fill={valueToGray(v)}
              stroke={inKernel ? '#f59e0b' : '#cbd5e1'}
              strokeWidth={inKernel ? 1.5 : 0.5}
              onClick={() => onClick(r, c)}
              style={{cursor: 'pointer'}}
            />
          );
        })
      )}
      <rect
        x={kernelCol * cell}
        y={kernelRow * cell}
        width={cell * K_SIZE}
        height={cell * K_SIZE}
        fill="none"
        stroke="#f59e0b"
        strokeWidth={3}
        pointerEvents="none"
      />
    </svg>
  );
}

interface ComputationProps {
  patch: number[][];
  kernel: number[][];
  sum: number;
}

function Computation({patch, kernel, sum}: ComputationProps) {
  const cell = 28;
  const size = kernel.length;
  return (
    <div className="flex flex-col items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
      <div className="flex flex-wrap items-center justify-center gap-3">
        <div>
          <p className="m-0 mb-1 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Patch
          </p>
          <svg
            viewBox={`0 0 ${size * cell} ${size * cell}`}
            width={size * cell}
            height={size * cell}
            className="block"
          >
            {patch.map((row, r) =>
              row.map((v, c) => (
                <g key={`${r}-${c}`}>
                  <rect
                    x={c * cell}
                    y={r * cell}
                    width={cell}
                    height={cell}
                    fill={valueToGray(v)}
                    stroke="#cbd5e1"
                    strokeWidth={0.5}
                  />
                  <text
                    x={c * cell + cell / 2}
                    y={r * cell + cell / 2 + 3}
                    fontSize={9}
                    textAnchor="middle"
                    fill={v > 0.5 ? '#0f172a' : '#f8fafc'}
                    fontFamily="ui-monospace, monospace"
                  >
                    {v.toFixed(1)}
                  </text>
                </g>
              ))
            )}
          </svg>
        </div>
        <span className="text-base font-bold text-slate-500 dark:text-slate-400">×</span>
        <div>
          <p className="m-0 mb-1 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Kernel
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
                    {Number.isInteger(v) ? v.toString() : v.toFixed(2)}
                  </text>
                </g>
              ))
            )}
          </svg>
        </div>
      </div>
      <p className="m-0 text-center font-mono text-[11px]">
        Σ (patch ⊙ kernel) = <strong>{sum.toFixed(3)}</strong>
      </p>
    </div>
  );
}

interface FeatureMapProps {
  displayed: Record<string, number>;
  currentRow: number;
  currentCol: number;
  min: number;
  max: number;
}

function FeatureMap({displayed, currentRow, currentCol, min, max}: FeatureMapProps) {
  const cell = 24;
  function colorFor(v: number): string {
    if (max === min) return '#f1f5f9';
    if (v >= 0) {
      const t = max > 0 ? v / max : 0;
      const r = Math.round(255 - t * 200);
      const g = Math.round(255 - t * 100);
      const b = Math.round(255 - t * 100);
      return `rgb(${r}, ${g}, ${b})`;
    }
    const t = min < 0 ? v / min : 0;
    return `rgb(255, ${Math.round(255 - t * 200)}, ${Math.round(255 - t * 200)})`;
  }
  return (
    <svg
      viewBox={`0 0 ${OUT_W * cell} ${OUT_H * cell}`}
      width="100%"
      style={{maxWidth: OUT_W * cell, height: 'auto', display: 'block'}}
      role="img"
      aria-label="Output feature map"
    >
      {Array.from({length: OUT_H}).map((_, r) =>
        Array.from({length: OUT_W}).map((__, c) => {
          const key = `${r},${c}`;
          const v = displayed[key];
          const isCurrent = r === currentRow && c === currentCol;
          return (
            <g key={key}>
              <rect
                x={c * cell}
                y={r * cell}
                width={cell}
                height={cell}
                fill={v === undefined ? '#f8fafc' : colorFor(v)}
                stroke={isCurrent ? '#0d9488' : '#cbd5e1'}
                strokeWidth={isCurrent ? 2.5 : 0.5}
              />
              {v !== undefined && (
                <text
                  x={c * cell + cell / 2}
                  y={r * cell + cell / 2 + 3}
                  fontSize={8}
                  textAnchor="middle"
                  fill="#0f172a"
                  fontFamily="ui-monospace, monospace"
                >
                  {v.toFixed(1)}
                </text>
              )}
            </g>
          );
        })
      )}
    </svg>
  );
}
