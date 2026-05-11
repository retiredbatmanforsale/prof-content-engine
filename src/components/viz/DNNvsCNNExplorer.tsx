import React, {useMemo, useState} from 'react';

type Tab = 'params' | 'sharing';

const IMG_SIZE_OPTIONS = [28, 64, 128, 224, 512, 1024];
const HIDDEN_OPTIONS = [10, 100, 500, 1000, 2048, 4096];
const FILTER_SIZE_OPTIONS = [3, 5, 7];
const NUM_FILTERS_OPTIONS = [8, 16, 32, 64];

function abbreviate(n: number): string {
  if (n >= 1e12) return (n / 1e12).toFixed(2) + 'T';
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toLocaleString();
}

function fmtFull(n: number): string {
  return n.toLocaleString();
}

export default function DNNvsCNNExplorer() {
  const [tab, setTab] = useState<Tab>('params');

  return (
    <div className="not-prose my-6 overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/60">
        <p className="m-0 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Interactive · DNN vs CNN
        </p>
        <div className="ml-auto flex gap-1 rounded-lg bg-white p-1 shadow-sm dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setTab('params')}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              tab === 'params'
                ? 'bg-teal-600 text-white'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            1. Parameter explosion
          </button>
          <button
            type="button"
            onClick={() => setTab('sharing')}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              tab === 'sharing'
                ? 'bg-teal-600 text-white'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            2. Weight sharing
          </button>
        </div>
      </div>
      <div className="p-4 md:p-6">
        {tab === 'params' ? <ParamsCalculator /> : <WeightSharing />}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TAB 1 — Parameter Explosion Calculator
// ─────────────────────────────────────────────────────────────

function ParamsCalculator() {
  const [imgSize, setImgSize] = useState(224);
  const [channels, setChannels] = useState<1 | 3>(3);
  const [hidden, setHidden] = useState(1000);
  const [filterSize, setFilterSize] = useState<3 | 5 | 7>(3);
  const [numFilters, setNumFilters] = useState(32);

  const fcParams = imgSize * imgSize * channels * hidden;
  const convParams = filterSize * filterSize * channels * numFilters;
  const ratio = fcParams / convParams;

  // bar widths (log-ish scale so the CNN bar is visible)
  const maxBar = Math.max(fcParams, convParams);
  const fcBarPct = 100;
  const convBarPct = Math.max(1.5, (convParams / maxBar) * 100);

  const ratioColor =
    ratio >= 100000
      ? 'bg-rose-600 text-white'
      : ratio >= 10000
      ? 'bg-rose-500 text-white'
      : ratio >= 1000
      ? 'bg-amber-500 text-white'
      : 'bg-amber-300 text-amber-950';

  return (
    <div className="space-y-6">
      <p className="m-0 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        Adjust the sliders to feed an image into <strong>a single fully-connected layer</strong> on the
        left, or <strong>a single convolutional layer</strong> on the right. Watch the parameter counts
        diverge.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        {/* ── FC side ── */}
        <div className="rounded-xl border-2 border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
          <div className="flex items-center justify-between">
            <p className="m-0 text-xs font-bold uppercase tracking-wide text-amber-900 dark:text-amber-200">
              Dense / FC layer
            </p>
            <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-900 dark:bg-amber-900/50 dark:text-amber-200">
              DNN
            </span>
          </div>

          <SliderRow
            label="Image size"
            value={imgSize}
            options={IMG_SIZE_OPTIONS}
            onChange={setImgSize}
            suffix={`× ${imgSize}`}
            tone="amber"
          />
          <SegmentedRow
            label="Channels"
            value={channels}
            options={[1, 3]}
            optionLabels={['1 (gray)', '3 (RGB)']}
            onChange={(v) => setChannels(v as 1 | 3)}
            tone="amber"
          />
          <SliderRow
            label="Hidden units"
            value={hidden}
            options={HIDDEN_OPTIONS}
            onChange={setHidden}
            tone="amber"
          />

          <div className="mt-4 rounded-lg bg-white p-3 shadow-inner dark:bg-slate-900">
            <p className="m-0 font-mono text-[11px] text-slate-500 dark:text-slate-400">
              H × W × C × hidden
            </p>
            <p className="m-0 mt-1 font-mono text-[11px] text-slate-700 dark:text-slate-300">
              {imgSize} × {imgSize} × {channels} × {hidden}
            </p>
            <p className="m-0 mt-2 text-3xl font-bold text-amber-700 dark:text-amber-300">
              {abbreviate(fcParams)}
            </p>
            <p className="m-0 text-[11px] text-slate-500 dark:text-slate-400">
              = {fmtFull(fcParams)} parameters
            </p>
          </div>
        </div>

        {/* ── CNN side ── */}
        <div className="rounded-xl border-2 border-teal-200 bg-teal-50/60 p-4 dark:border-teal-900/50 dark:bg-teal-950/20">
          <div className="flex items-center justify-between">
            <p className="m-0 text-xs font-bold uppercase tracking-wide text-teal-900 dark:text-teal-200">
              Convolutional layer
            </p>
            <span className="rounded-full bg-teal-200 px-2 py-0.5 text-[10px] font-bold text-teal-900 dark:bg-teal-900/50 dark:text-teal-200">
              CNN
            </span>
          </div>

          <div className="mt-3 rounded-md bg-teal-100/60 p-2 text-[11px] text-teal-900 dark:bg-teal-900/30 dark:text-teal-200">
            <strong>Same image, same channels.</strong> Conv params don't depend on image size — only on filter shape.
          </div>

          <SegmentedRow
            label="Filter size"
            value={filterSize}
            options={FILTER_SIZE_OPTIONS}
            optionLabels={['3 × 3', '5 × 5', '7 × 7']}
            onChange={(v) => setFilterSize(v as 3 | 5 | 7)}
            tone="teal"
          />
          <SliderRow
            label="# of filters"
            value={numFilters}
            options={NUM_FILTERS_OPTIONS}
            onChange={setNumFilters}
            tone="teal"
          />

          <div className="mt-4 rounded-lg bg-white p-3 shadow-inner dark:bg-slate-900">
            <p className="m-0 font-mono text-[11px] text-slate-500 dark:text-slate-400">
              K × K × C × filters
            </p>
            <p className="m-0 mt-1 font-mono text-[11px] text-slate-700 dark:text-slate-300">
              {filterSize} × {filterSize} × {channels} × {numFilters}
            </p>
            <p className="m-0 mt-2 text-3xl font-bold text-teal-700 dark:text-teal-300">
              {abbreviate(convParams)}
            </p>
            <p className="m-0 text-[11px] text-slate-500 dark:text-slate-400">
              = {fmtFull(convParams)} parameters
            </p>
          </div>
        </div>
      </div>

      {/* ── Comparison bar ── */}
      <div>
        <p className="m-0 mb-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Side-by-side
        </p>
        <div className="space-y-2">
          <div>
            <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
              <span>FC</span>
              <span className="font-mono">{abbreviate(fcParams)}</span>
            </div>
            <div className="h-6 w-full overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-rose-500"
                style={{width: `${fcBarPct}%`}}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
              <span>Conv</span>
              <span className="font-mono">{abbreviate(convParams)}</span>
            </div>
            <div className="h-6 w-full overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full bg-gradient-to-r from-teal-400 to-teal-600"
                style={{width: `${convBarPct}%`}}
              />
            </div>
          </div>
        </div>
      </div>

      <div
        className={`flex flex-wrap items-center justify-between gap-3 rounded-xl p-4 ${ratioColor}`}
      >
        <div>
          <p className="m-0 text-xs font-bold uppercase tracking-wider opacity-80">
            FC needs this many times more parameters than Conv
          </p>
          <p className="m-0 mt-1 text-3xl font-bold">
            {ratio >= 1
              ? `${abbreviate(Math.round(ratio))}×`
              : `${ratio.toFixed(2)}×`}
          </p>
        </div>
        <div className="text-right text-xs opacity-90">
          {ratio >= 1000 ? (
            <p className="m-0">
              And FC is for <strong>one image</strong>. You'd repeat this overhead for every layer.
            </p>
          ) : (
            <p className="m-0">Try cranking up image size or hidden units…</p>
          )}
        </div>
      </div>
    </div>
  );
}

interface SliderRowProps {
  label: string;
  value: number;
  options: number[];
  onChange: (v: number) => void;
  suffix?: string;
  tone: 'amber' | 'teal';
}

function SliderRow({label, value, options, onChange, suffix, tone}: SliderRowProps) {
  const idx = options.indexOf(value);
  const safeIdx = idx >= 0 ? idx : 0;
  const accent = tone === 'amber' ? 'accent-amber-600' : 'accent-teal-600';
  return (
    <div className="mt-3">
      <div className="flex items-baseline justify-between">
        <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">{label}</label>
        <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400">
          {suffix ?? value}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={options.length - 1}
        step={1}
        value={safeIdx}
        onChange={(e) => onChange(options[parseInt(e.target.value, 10)])}
        className={`mt-1 w-full ${accent}`}
        aria-label={label}
      />
    </div>
  );
}

interface SegmentedRowProps {
  label: string;
  value: number;
  options: number[];
  optionLabels?: string[];
  onChange: (v: number) => void;
  tone: 'amber' | 'teal';
}

function SegmentedRow({label, value, options, optionLabels, onChange, tone}: SegmentedRowProps) {
  const activeClasses =
    tone === 'amber'
      ? 'bg-amber-600 text-white'
      : 'bg-teal-600 text-white';
  return (
    <div className="mt-3">
      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">{label}</label>
      <div className="mt-1 flex gap-1 rounded-md bg-slate-100 p-1 dark:bg-slate-800">
        {options.map((opt, i) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`flex-1 rounded px-2 py-1 text-[11px] font-semibold transition-colors ${
              value === opt
                ? activeClasses
                : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            {optionLabels?.[i] ?? opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TAB 2 — Weight-sharing visualizer
// ─────────────────────────────────────────────────────────────

// 8×8 input image: diagonal stripe
const IMG: number[][] = [
  [0, 0, 0, 0, 0, 0, 1, 1],
  [0, 0, 0, 0, 0, 1, 1, 0],
  [0, 0, 0, 0, 1, 1, 0, 0],
  [0, 0, 0, 1, 1, 0, 0, 0],
  [0, 0, 1, 1, 0, 0, 0, 0],
  [0, 1, 1, 0, 0, 0, 0, 0],
  [1, 1, 0, 0, 0, 0, 0, 0],
  [1, 0, 0, 0, 0, 0, 0, 0],
];

// Vertical-edge detector
const KERNEL: number[][] = [
  [-1, 0, 1],
  [-1, 0, 1],
  [-1, 0, 1],
];

const IMG_H = IMG.length;
const IMG_W = IMG[0].length;
const K = KERNEL.length;
const OUT_H = IMG_H - K + 1;
const OUT_W = IMG_W - K + 1;
const TOTAL_POSITIONS = OUT_H * OUT_W;

function conv2dAt(row: number, col: number): number {
  let sum = 0;
  for (let i = 0; i < K; i++) {
    for (let j = 0; j < K; j++) {
      sum += IMG[row + i][col + j] * KERNEL[i][j];
    }
  }
  return sum;
}

export function WeightSharing() {
  const [row, setRow] = useState(0);
  const [col, setCol] = useState(0);
  const [visited, setVisited] = useState<Set<string>>(new Set(['0,0']));

  function setPos(r: number, c: number) {
    setRow(r);
    setCol(c);
    setVisited((prev) => {
      const next = new Set(prev);
      next.add(`${r},${c}`);
      return next;
    });
  }

  function step() {
    let nc = col + 1;
    let nr = row;
    if (nc > OUT_W - 1) {
      nc = 0;
      nr = row + 1;
    }
    if (nr > OUT_H - 1) {
      nr = 0;
      nc = 0;
    }
    setPos(nr, nc);
  }

  function stepBack() {
    let nc = col - 1;
    let nr = row;
    if (nc < 0) {
      nc = OUT_W - 1;
      nr = row - 1;
    }
    if (nr < 0) {
      nr = OUT_H - 1;
      nc = OUT_W - 1;
    }
    setPos(nr, nc);
  }

  function reset() {
    setRow(0);
    setCol(0);
    setVisited(new Set(['0,0']));
  }

  // CNN weight count is fixed; FC equivalent grows
  const cnnWeights = K * K; // 9
  // FC equivalent: each output unit needs IMG_H*IMG_W weights; we count for visited outputs
  const fcWeights = visited.size * IMG_H * IMG_W;
  const visitedFraction = visited.size / TOTAL_POSITIONS;

  // output values map (only filled for visited positions)
  const outputValues = useMemo(() => {
    const m: Record<string, number> = {};
    visited.forEach((key) => {
      const [r, c] = key.split(',').map(Number);
      m[key] = conv2dAt(r, c);
    });
    return m;
  }, [visited]);

  const currentOutput = conv2dAt(row, col);

  return (
    <div className="space-y-5">
      <p className="m-0 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        Step the <strong>3 × 3 filter</strong> across an 8 × 8 image. CNN keeps reusing the same 9
        weights — FC would need a fresh set for every output position.
      </p>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* ── Input image with filter overlay ── */}
        <div className="rounded-xl border-2 border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
          <p className="m-0 mb-3 text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300">
            Input image
          </p>
          <ImageGrid
            data={IMG}
            litRow={row}
            litCol={col}
            kernelSize={K}
            onCellClick={(r, c) => {
              const maxR = OUT_H - 1;
              const maxC = OUT_W - 1;
              setPos(Math.min(r, maxR), Math.min(c, maxC));
            }}
          />
          <p className="m-0 mt-3 text-[11px] text-slate-500 dark:text-slate-400">
            Filter position: <span className="font-mono">({row}, {col})</span> · click any cell to jump.
          </p>
        </div>

        {/* ── CNN side ── */}
        <div className="rounded-xl border-2 border-teal-200 bg-teal-50/60 p-4 dark:border-teal-900/50 dark:bg-teal-950/20">
          <p className="m-0 mb-3 text-xs font-bold uppercase tracking-wide text-teal-900 dark:text-teal-200">
            CNN — 1 kernel, reused
          </p>
          <p className="m-0 mb-2 text-[11px] text-slate-600 dark:text-slate-400">The 9 weights:</p>
          <KernelDisplay kernel={KERNEL} />
          <p className="m-0 mt-3 mb-2 text-[11px] text-slate-600 dark:text-slate-400">
            Output feature map ({OUT_H} × {OUT_W}):
          </p>
          <OutputGrid
            values={outputValues}
            currentRow={row}
            currentCol={col}
            currentValue={currentOutput}
          />
          <p className="m-0 mt-3 text-[11px] text-teal-800 dark:text-teal-300">
            <strong>Weights used:</strong>{' '}
            <span className="font-mono font-bold">{cnnWeights}</span>
            <span className="opacity-70"> — stays at 9 no matter how far you step.</span>
          </p>
        </div>

        {/* ── FC equivalent side ── */}
        <div className="rounded-xl border-2 border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
          <p className="m-0 mb-3 text-xs font-bold uppercase tracking-wide text-amber-900 dark:text-amber-200">
            FC equivalent — fresh weights everywhere
          </p>
          <p className="m-0 mb-2 text-[11px] text-slate-600 dark:text-slate-400">
            For the same output volume, FC would need a separate {IMG_H * IMG_W}-weight set per output
            position:
          </p>
          <FCWeightGrid visited={visited} currentRow={row} currentCol={col} />
          <p className="m-0 mt-3 text-[11px] text-amber-900 dark:text-amber-200">
            <strong>Weights used so far:</strong>{' '}
            <span className="font-mono font-bold">{fmtFull(fcWeights)}</span>
            <span className="opacity-70">
              {' '}/ {fmtFull(IMG_H * IMG_W * TOTAL_POSITIONS)} if fully covered
            </span>
          </p>
        </div>
      </div>

      {/* ── Controls + counter ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={stepBack}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            aria-label="Step backward"
          >
            ◀
          </button>
          <button
            type="button"
            onClick={step}
            className="rounded-md bg-teal-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-teal-700"
            aria-label="Step forward"
          >
            Step ▶
          </button>
          <button
            type="button"
            onClick={reset}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Reset
          </button>
        </div>
        <div className="text-right text-[11px] text-slate-600 dark:text-slate-400">
          Visited <span className="font-mono font-bold">{visited.size}</span> / {TOTAL_POSITIONS}{' '}
          positions ({Math.round(visitedFraction * 100)}%)
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300">
        <strong>What this shows.</strong> The CNN reuses one tiny set of 9 weights at every position —
        that's <em>weight sharing</em>. An FC layer producing the same feature map would need a
        fresh 64-weight slice per output position ({IMG_H * IMG_W * TOTAL_POSITIONS} total). Same
        receptive geometry, two completely different parameter budgets.
      </div>
    </div>
  );
}

// ─── Small grid components ──────────────────────────────────

interface ImageGridProps {
  data: number[][];
  litRow: number;
  litCol: number;
  kernelSize: number;
  onCellClick: (r: number, c: number) => void;
}

function ImageGrid({data, litRow, litCol, kernelSize, onCellClick}: ImageGridProps) {
  const cellSize = 28;
  const w = data[0].length * cellSize;
  const h = data.length * cellSize;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="block h-auto w-full max-w-[280px]"
      style={{aspectRatio: `${w} / ${h}`}}
    >
      {data.map((row, r) =>
        row.map((v, c) => {
          const inKernel =
            r >= litRow && r < litRow + kernelSize && c >= litCol && c < litCol + kernelSize;
          const fill = v === 1 ? '#1e293b' : '#f8fafc';
          const stroke = inKernel ? '#f59e0b' : '#cbd5e1';
          return (
            <rect
              key={`${r}-${c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize}
              height={cellSize}
              fill={fill}
              stroke={stroke}
              strokeWidth={inKernel ? 2 : 0.5}
              onClick={() => onCellClick(r, c)}
              style={{cursor: 'pointer'}}
            />
          );
        })
      )}
      {/* Kernel outline */}
      <rect
        x={litCol * cellSize}
        y={litRow * cellSize}
        width={cellSize * kernelSize}
        height={cellSize * kernelSize}
        fill="none"
        stroke="#f59e0b"
        strokeWidth={3}
        pointerEvents="none"
      />
    </svg>
  );
}

function KernelDisplay({kernel}: {kernel: number[][]}) {
  const cellSize = 36;
  const w = kernel[0].length * cellSize;
  const h = kernel.length * cellSize;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="block h-auto w-[140px]">
      {kernel.map((row, r) =>
        row.map((v, c) => {
          const fill = v > 0 ? '#0d9488' : v < 0 ? '#dc2626' : '#e2e8f0';
          const textColor = v === 0 ? '#475569' : '#ffffff';
          return (
            <g key={`${r}-${c}`}>
              <rect
                x={c * cellSize}
                y={r * cellSize}
                width={cellSize}
                height={cellSize}
                fill={fill}
                stroke="#94a3b8"
                strokeWidth={0.75}
              />
              <text
                x={c * cellSize + cellSize / 2}
                y={r * cellSize + cellSize / 2}
                fill={textColor}
                fontSize={14}
                fontWeight={700}
                fontFamily="ui-monospace, monospace"
                textAnchor="middle"
                dominantBaseline="central"
              >
                {v}
              </text>
            </g>
          );
        })
      )}
    </svg>
  );
}

interface OutputGridProps {
  values: Record<string, number>;
  currentRow: number;
  currentCol: number;
  currentValue: number;
}

function OutputGrid({values, currentRow, currentCol, currentValue}: OutputGridProps) {
  const cellSize = 26;
  const w = OUT_W * cellSize;
  const h = OUT_H * cellSize;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="block h-auto w-full max-w-[200px]">
      {Array.from({length: OUT_H}).map((_, r) =>
        Array.from({length: OUT_W}).map((__, c) => {
          const key = `${r},${c}`;
          const hasValue = key in values;
          const isCurrent = r === currentRow && c === currentCol;
          const v = hasValue ? values[key] : null;
          // map v from [-3, 3] to a blue/red palette
          let fill = '#f1f5f9';
          if (v !== null) {
            if (v > 0) fill = '#14b8a6';
            else if (v < 0) fill = '#fb7185';
            else fill = '#e2e8f0';
          }
          return (
            <g key={key}>
              <rect
                x={c * cellSize}
                y={r * cellSize}
                width={cellSize}
                height={cellSize}
                fill={fill}
                stroke={isCurrent ? '#f59e0b' : '#cbd5e1'}
                strokeWidth={isCurrent ? 2.5 : 0.5}
              />
              {hasValue && (
                <text
                  x={c * cellSize + cellSize / 2}
                  y={r * cellSize + cellSize / 2}
                  fill={v !== 0 ? '#ffffff' : '#475569'}
                  fontSize={11}
                  fontWeight={700}
                  fontFamily="ui-monospace, monospace"
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {v}
                </text>
              )}
            </g>
          );
        })
      )}
    </svg>
  );
}

interface FCWeightGridProps {
  visited: Set<string>;
  currentRow: number;
  currentCol: number;
}

// Show a stacked representation: each visited output gets its own "row" of 64 weight cells
function FCWeightGrid({visited, currentRow, currentCol}: FCWeightGridProps) {
  const visitedArr = Array.from(visited);
  const maxRowsShown = 8;
  const trimmed = visitedArr.slice(-maxRowsShown);
  const remaining = visitedArr.length - trimmed.length;
  const totalPerOutput = IMG_H * IMG_W;
  const cellSize = 8;
  const w = totalPerOutput * cellSize;

  return (
    <div className="space-y-1">
      <div
        className="space-y-1"
        style={{maxHeight: 220, overflowY: 'auto'}}
      >
        {remaining > 0 && (
          <p className="m-0 text-[10px] italic text-slate-400 dark:text-slate-500">
            … +{remaining} earlier output positions (hidden)
          </p>
        )}
        {trimmed.map((key) => {
          const [r, c] = key.split(',').map(Number);
          const isCurrent = r === currentRow && c === currentCol;
          return (
            <div key={key} className="flex items-center gap-1.5">
              <span
                className={`min-w-[42px] font-mono text-[10px] ${
                  isCurrent
                    ? 'font-bold text-amber-700 dark:text-amber-300'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                ({r},{c})
              </span>
              <svg viewBox={`0 0 ${w} ${cellSize}`} className="block h-2 flex-1">
                {Array.from({length: totalPerOutput}).map((_, i) => (
                  <rect
                    key={i}
                    x={i * cellSize}
                    y={0}
                    width={cellSize}
                    height={cellSize}
                    fill={isCurrent ? '#f59e0b' : '#fcd34d'}
                    opacity={isCurrent ? 1 : 0.55}
                  />
                ))}
              </svg>
            </div>
          );
        })}
      </div>
      <p className="m-0 text-[10px] text-slate-500 dark:text-slate-400">
        Each amber row = 64 fresh FC weights for that output position.
      </p>
    </div>
  );
}
