import React, {useEffect, useMemo, useRef, useState} from 'react';

// ── Scene definition: a tiny stylized cityscape ───────────────
type CellKind = 'sky' | 'bldg' | 'road' | 'window';

const SCENE: CellKind[][] = [
  ['sky',  'sky',  'sky',  'sky',  'sky',  'sky',  'sky',  'sky' ],
  ['sky',  'sky',  'sky',  'sky',  'sky',  'sky',  'sky',  'sky' ],
  ['sky',  'sky',  'sky',  'bldg', 'sky',  'sky',  'sky',  'sky' ],
  ['sky',  'sky',  'sky',  'window','sky', 'sky',  'sky',  'sky' ],
  ['sky',  'sky',  'sky',  'bldg', 'sky',  'sky',  'sky',  'sky' ],
  ['sky',  'bldg', 'window','bldg','window','bldg','sky', 'sky' ],
  ['road', 'bldg', 'bldg', 'bldg', 'bldg', 'bldg', 'road', 'road'],
  ['road', 'road', 'road', 'road', 'road', 'road', 'road', 'road'],
];

const H = SCENE.length;
const W = SCENE[0].length;
const TOTAL = H * W;

const PALETTE: Record<CellKind, string> = {
  sky:    '#bae6fd',
  bldg:   '#64748b',
  window: '#fbbf24',
  road:   '#1f2937',
};

const LABELS: Record<CellKind, string> = {
  sky:    'Sky',
  bldg:   'Building',
  window: 'Window',
  road:   'Road',
};

// ── Preset highlight selections ───────────────────────────────
type PresetId = 'sky-row' | 'bldg-tower' | 'patch';

interface Preset {
  id: PresetId;
  label: string;
  caption: React.ReactNode;
  tone: 'good' | 'bad';
  cells: [number, number][]; // (row, col) pairs
}

const PRESETS: Preset[] = [
  {
    id: 'sky-row',
    label: 'Sky row (horizontal)',
    tone: 'good',
    cells: Array.from({length: W}, (_, c) => [0, c]),
    caption: (
      <>
        Row 0 is all sky. In the flat vector, these 8 pixels sit at <strong>positions 0–7</strong> — adjacent. An MLP can <em>almost</em> tell they're related, by lucky accident of indexing.
      </>
    ),
  },
  {
    id: 'bldg-tower',
    label: 'Building tower (vertical)',
    tone: 'bad',
    cells: [[2, 3], [3, 3], [4, 3], [5, 3], [6, 3]],
    caption: (
      <>
        A vertical building edge. In 2D these 5 pixels are <strong>stacked on top of each other</strong>. In the flat vector they land at positions <span className="font-mono">19, 27, 35, 43, 51</span> — <strong>8 positions apart each</strong>, with 7 unrelated pixels in between. The MLP sees no relationship.
      </>
    ),
  },
  {
    id: 'patch',
    label: '3 × 3 patch (neighborhood)',
    tone: 'bad',
    cells: [
      [4, 2], [4, 3], [4, 4],
      [5, 2], [5, 3], [5, 4],
      [6, 2], [6, 3], [6, 4],
    ],
    caption: (
      <>
        A tight 3 × 3 neighborhood. In 2D it's a single contiguous patch. In the flat vector it becomes <strong>three little clumps of 3</strong>, each separated by 5 unrelated pixels. Convolution recovers this; flattening cannot.
      </>
    ),
  },
];

// ── Component ─────────────────────────────────────────────────
type Stage = 'before' | 'animating' | 'after';

export default function FlatteningDestroysMeaning() {
  const [stage, setStage] = useState<Stage>('before');
  const [rowsRevealed, setRowsRevealed] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);
  const [preset, setPreset] = useState<PresetId | null>(null);
  const intervalRef = useRef<number | null>(null);

  // cleanup interval on unmount
  useEffect(() => () => {
    if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
  }, []);

  function flatten() {
    if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
    setStage('animating');
    setRowsRevealed(0);
    setHovered(null);
    setPreset(null);
    let r = 0;
    intervalRef.current = window.setInterval(() => {
      r += 1;
      setRowsRevealed(r);
      if (r >= H) {
        if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
        intervalRef.current = null;
        setStage('after');
      }
    }, 180);
  }

  function reset() {
    if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
    intervalRef.current = null;
    setStage('before');
    setRowsRevealed(0);
    setHovered(null);
    setPreset(null);
  }

  // active highlighted flat indices (from hover OR preset)
  const highlighted = useMemo(() => {
    const s = new Set<number>();
    if (preset) {
      const p = PRESETS.find((x) => x.id === preset);
      if (p) p.cells.forEach(([r, c]) => s.add(r * W + c));
    } else if (hovered !== null) {
      s.add(hovered);
    }
    return s;
  }, [preset, hovered]);

  const activePreset = preset ? PRESETS.find((p) => p.id === preset) : null;

  const flatVisible = stage !== 'before';
  const flatCellCount = stage === 'animating' ? rowsRevealed * W : TOTAL;

  return (
    <div className="not-prose my-6 overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/60">
        <p className="m-0 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Animation · Flattening Destroys Underlying Spatial Information
        </p>
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={flatten}
            disabled={stage === 'animating'}
            className="rounded-md bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {stage === 'before' ? 'Flatten ▶' : stage === 'animating' ? 'Flattening…' : 'Flatten again'}
          </button>
          <button
            type="button"
            onClick={reset}
            disabled={stage === 'before'}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="space-y-5 p-4 md:p-6">
        {/* ── 2D image ── */}
        <div className="flex flex-col items-center gap-3">
          <p className="m-0 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            2D image (8 × 8) — a tiny cityscape
          </p>
          <SceneGrid highlighted={highlighted} onHover={setHovered} disabled={stage === 'animating'} />
          <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
            {(['sky', 'bldg', 'window', 'road'] as CellKind[]).map((k) => (
              <span key={k} className="inline-flex items-center gap-1.5">
                <span
                  className="inline-block h-3 w-3 rounded-sm border border-slate-300 dark:border-slate-600"
                  style={{background: PALETTE[k]}}
                />
                {LABELS[k]}
              </span>
            ))}
          </div>
        </div>

        {/* ── Unrolling visualization ── */}
        {flatVisible && (
          <div className="flex flex-col items-center gap-3">
            <p className="m-0 text-center text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Flattened vector ({TOTAL} positions) — what the MLP actually sees
            </p>
            <FlatStrip
              count={flatCellCount}
              highlighted={highlighted}
              onHover={setHovered}
              disabled={stage === 'animating'}
            />
            {stage === 'animating' && (
              <p className="m-0 text-[11px] italic text-slate-500 dark:text-slate-400">
                Unrolling row {rowsRevealed} of {H}…
              </p>
            )}
          </div>
        )}

        {/* ── Before-state hint ── */}
        {stage === 'before' && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300">
            👆 Hover any cell to see its 2D position. Click <strong>Flatten ▶</strong> to unroll the image
            into the long vector an MLP would consume.
          </div>
        )}

        {/* ── Stark statement after flattening ── */}
        {stage === 'after' && (
          <div className="rounded-xl border-2 border-slate-900 bg-white p-5 text-center dark:border-slate-100 dark:bg-slate-900">
            <p className="m-0 text-base font-bold text-black dark:text-white md:text-lg">
              To the neural network… these pixels are now just numbers.
            </p>
            <p className="m-0 mt-2 text-base font-bold text-black dark:text-white md:text-lg">
              The fact that two pixels were neighbors in space is gone.
            </p>
          </div>
        )}

        {/* ── Preset comparison ── */}
        {stage === 'after' && (
          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/40">
            <p className="m-0 text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
              Compare: same selection, two layouts
            </p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => {
                const active = preset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPreset(active ? null : p.id)}
                    className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      active
                        ? p.tone === 'good'
                          ? 'border-teal-600 bg-teal-600 text-white'
                          : 'border-amber-600 bg-amber-600 text-white'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
              {(hovered !== null || preset !== null) && (
                <button
                  type="button"
                  onClick={() => {
                    setHovered(null);
                    setPreset(null);
                  }}
                  className="ml-auto rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Clear
                </button>
              )}
            </div>
            {activePreset ? (
              <div
                className={`rounded-md p-3 text-sm ${
                  activePreset.tone === 'good'
                    ? 'bg-teal-50 text-teal-900 dark:bg-teal-950/40 dark:text-teal-200'
                    : 'bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200'
                }`}
              >
                {activePreset.caption}
              </div>
            ) : (
              <p className="m-0 text-xs text-slate-500 dark:text-slate-400">
                Pick a preset above — or hover any cell in the image / vector to see where it lands.
              </p>
            )}
          </div>
        )}

        {/* ── Takeaway ── */}
        {stage === 'after' && (
          <div className="rounded-xl border-2 border-rose-200 bg-rose-50/70 p-4 text-sm leading-relaxed text-rose-950 dark:border-rose-900/45 dark:bg-rose-950/25 dark:text-rose-100">
            <strong>The point.</strong> An MLP sees the 64 numbers in that strip and has{' '}
            <em>no idea</em> which ones were neighbours in 2D. Adjacent in the strip ≠ adjacent in the
            image. That's why <strong>flattening destroys spatial meaning</strong> — and why we need an
            architecture (CNNs) that respects 2D layout.
          </div>
        )}
      </div>
    </div>
  );
}

// ── 2D scene grid ─────────────────────────────────────────────
interface SceneGridProps {
  highlighted: Set<number>;
  onHover: (idx: number | null) => void;
  disabled: boolean;
}

function SceneGrid({highlighted, onHover, disabled}: SceneGridProps) {
  const cellSize = 36;
  const totalW = W * cellSize;
  const totalH = H * cellSize;

  return (
    <svg
      viewBox={`0 0 ${totalW} ${totalH}`}
      className="block h-auto w-full max-w-[320px]"
      role="img"
      aria-label="8 by 8 cityscape image"
    >
      {SCENE.flatMap((row, r) =>
        row.map((kind, c) => {
          const idx = r * W + c;
          const isLit = highlighted.has(idx);
          return (
            <g key={idx}>
              <rect
                x={c * cellSize}
                y={r * cellSize}
                width={cellSize}
                height={cellSize}
                fill={PALETTE[kind]}
                stroke={isLit ? '#f59e0b' : '#cbd5e1'}
                strokeWidth={isLit ? 3 : 0.5}
                onMouseEnter={() => !disabled && onHover(idx)}
                onMouseLeave={() => !disabled && onHover(null)}
                onFocus={() => !disabled && onHover(idx)}
                onBlur={() => !disabled && onHover(null)}
                tabIndex={disabled ? -1 : 0}
                style={{
                  cursor: disabled ? 'default' : 'pointer',
                  outline: 'none',
                }}
              >
                <title>{`${LABELS[kind]} · (${r}, ${c}) · flat index ${idx}`}</title>
              </rect>
            </g>
          );
        })
      )}
    </svg>
  );
}

// ── Flat vector strip ─────────────────────────────────────────
interface FlatStripProps {
  count: number;
  highlighted: Set<number>;
  onHover: (idx: number | null) => void;
  disabled: boolean;
}

function FlatStrip({count, highlighted, onHover, disabled}: FlatStripProps) {
  const cellSize = 18;
  const totalW = TOTAL * cellSize;
  const totalH = cellSize + 14; // extra room for tick labels

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        className="block h-auto"
        style={{minWidth: 480}}
        role="img"
        aria-label="Flattened 64-element vector"
      >
        {Array.from({length: TOTAL}).map((_, idx) => {
          const r = Math.floor(idx / W);
          const c = idx % W;
          const kind = SCENE[r][c];
          const visible = idx < count;
          const isLit = highlighted.has(idx);
          return (
            <g key={idx}>
              <rect
                x={idx * cellSize}
                y={0}
                width={cellSize}
                height={cellSize}
                fill={visible ? PALETTE[kind] : '#f1f5f9'}
                stroke={isLit ? '#f59e0b' : '#cbd5e1'}
                strokeWidth={isLit ? 2.5 : 0.5}
                opacity={visible ? 1 : 0.25}
                onMouseEnter={() => !disabled && visible && onHover(idx)}
                onMouseLeave={() => !disabled && onHover(null)}
                onFocus={() => !disabled && visible && onHover(idx)}
                onBlur={() => !disabled && onHover(null)}
                tabIndex={disabled || !visible ? -1 : 0}
                style={{
                  cursor: disabled || !visible ? 'default' : 'pointer',
                  outline: 'none',
                  transition: 'opacity 180ms ease, fill 180ms ease',
                }}
              >
                {visible && (
                  <title>{`flat index ${idx} · was (${r}, ${c}) · ${LABELS[kind]}`}</title>
                )}
              </rect>
              {idx % 8 === 0 && visible && (
                <text
                  x={idx * cellSize + cellSize / 2}
                  y={cellSize + 11}
                  fill="#94a3b8"
                  fontSize={9}
                  fontFamily="ui-monospace, monospace"
                  textAnchor="middle"
                >
                  {idx}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
