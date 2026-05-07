import React from 'react';

/**
 * Distribution — horizontal bar chart for a top-k probability or logit distribution.
 *
 * Each row: token label (truncated) + bar + probability. The highlighted index
 * is drawn with an accent color (used to indicate the sampled token).
 */

export interface DistributionItem {
  label: string;
  value: number;
  /** Optional id to render alongside the label. */
  id?: number;
}

interface Props {
  items: DistributionItem[];
  /** Index of the row to highlight (e.g. the token actually sampled). */
  highlightedIndex?: number;
  /** Auto-truncate labels longer than this to keep the chart compact. Default 16. */
  maxLabelLen?: number;
  /** Cap rows displayed. Default = items.length. */
  maxRows?: number;
  /** Render values as percentages (multiply by 100, append %). */
  asPercent?: boolean;
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n - 1) + '…';
}

function escapeWS(s: string): string {
  return s.replace(/ /g, '·').replace(/\n/g, '↵').replace(/\t/g, '⇥');
}

export default function Distribution({
  items,
  highlightedIndex,
  maxLabelLen = 16,
  maxRows,
  asPercent = false,
}: Props) {
  const rows = maxRows ? items.slice(0, maxRows) : items;
  const max = Math.max(1e-9, ...rows.map((r) => r.value));

  return (
    <div className="not-prose flex flex-col gap-1 p-3 bg-slate-950 rounded-lg">
      {rows.map((row, i) => {
        const w = (row.value / max) * 100;
        const isHi = i === highlightedIndex;
        return (
          <div key={i} className="flex items-center gap-2 text-xs font-mono">
            <span
              className={`w-32 truncate text-right ${isHi ? 'text-violet-300' : 'text-slate-300'}`}
              title={row.label}
            >
              {truncate(escapeWS(row.label), maxLabelLen)}
              {row.id != null && <span className="text-slate-600 ml-1">·{row.id}</span>}
            </span>
            <div className="flex-1 h-4 bg-slate-900 rounded overflow-hidden relative">
              <div
                className={`h-full transition-[width] duration-150 ${isHi ? 'bg-violet-500' : 'bg-slate-600'}`}
                style={{ width: `${w}%` }}
              />
            </div>
            <span className={`w-14 text-right tabular-nums ${isHi ? 'text-violet-300' : 'text-slate-400'}`}>
              {asPercent ? (row.value * 100).toFixed(1) + '%' : row.value.toFixed(3)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
