import React, { useState } from 'react';

/**
 * TokenStrip — color-coded token boxes laid out inline.
 *
 * Each token can carry an `id`, `score`, and optional `color` override. Hovering
 * a token reveals its metadata in a small popover.
 */

export interface TokenItem {
  text: string;
  id?: number;
  /** Score / probability / activation magnitude — drives color when no color given. */
  score?: number;
  /** Override CSS color. */
  color?: string;
  /** Custom hover label. */
  detail?: string;
}

interface Props {
  tokens: TokenItem[];
  /** Color ramp — 'heat' (red-yellow), 'cool' (blue-cyan), 'mono' (slate) — default 'heat'. */
  ramp?: 'heat' | 'cool' | 'mono';
  /** Optional click handler — receives the token index. */
  onTokenClick?: (idx: number) => void;
  /** Show numeric ID below each box. */
  showIds?: boolean;
}

function rampColor(v: number, ramp: 'heat' | 'cool' | 'mono'): string {
  const t = Math.max(0, Math.min(1, v));
  if (ramp === 'cool') {
    const r = Math.round(15 + t * 40);
    const g = Math.round(40 + t * 140);
    const b = Math.round(100 + t * 155);
    return `rgb(${r},${g},${b})`;
  }
  if (ramp === 'mono') {
    const c = Math.round(40 + t * 180);
    return `rgb(${c},${c},${c + 20})`;
  }
  // heat
  const r = Math.round(60 + t * 195);
  const g = Math.round(20 + t * 120);
  const b = Math.round(40 + t * 30);
  return `rgb(${r},${g},${b})`;
}

export default function TokenStrip({ tokens, ramp = 'heat', onTokenClick, showIds = false }: Props) {
  const [hover, setHover] = useState<number | null>(null);

  // Replace whitespace tokens with a visible glyph so empty boxes don't appear.
  function renderText(t: string): string {
    if (t === ' ' || t === '') return '␣';
    if (t === '\n') return '↵';
    if (t === '\t') return '⇥';
    return t;
  }

  return (
    <div className="not-prose flex flex-wrap items-end gap-1 p-3 bg-slate-950 rounded-lg">
      {tokens.map((tok, i) => {
        const bg = tok.color ?? (tok.score != null ? rampColor(tok.score, ramp) : '#1e293b');
        const isHover = hover === i;
        return (
          <div
            key={i}
            className="relative flex flex-col items-center"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            onClick={() => onTokenClick?.(i)}
            style={{ cursor: onTokenClick ? 'pointer' : 'default' }}
          >
            <span
              className="px-2 py-1 rounded text-xs font-mono text-slate-100 whitespace-pre"
              style={{
                background: bg,
                outline: isHover ? '2px solid #fbbf24' : 'none',
                outlineOffset: '1px',
              }}
            >
              {renderText(tok.text)}
            </span>
            {showIds && tok.id != null && (
              <span className="text-[9px] text-slate-500 font-mono mt-0.5">{tok.id}</span>
            )}
            {isHover && (tok.detail || tok.id != null || tok.score != null) && (
              <div className="absolute z-10 bottom-full mb-1 px-2 py-1 rounded bg-slate-800 text-[10px] text-slate-200 font-sans whitespace-nowrap shadow-lg border border-slate-700">
                {tok.detail ?? (
                  <>
                    {tok.id != null && <span>id: {tok.id}</span>}
                    {tok.id != null && tok.score != null && <span> · </span>}
                    {tok.score != null && <span>score: {tok.score.toFixed(4)}</span>}
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
