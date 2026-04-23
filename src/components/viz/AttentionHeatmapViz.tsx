import React, { useRef, useEffect, useState } from 'react';

const DEFAULT_TOKENS = ['The', 'cat', 'sat', 'on', 'the', 'mat'];

// Handcrafted attention matrix — each row sums to 1
// Rows = query (attending FROM), cols = key (attending TO)
const DEFAULT_SCORES = [
  [0.15, 0.25, 0.10, 0.10, 0.15, 0.25],  // The   → spread
  [0.05, 0.40, 0.25, 0.08, 0.08, 0.14],  // cat   → itself + sat
  [0.05, 0.30, 0.12, 0.10, 0.05, 0.38],  // sat   → cat + mat
  [0.05, 0.10, 0.22, 0.18, 0.08, 0.37],  // on    → sat + mat
  [0.10, 0.08, 0.08, 0.08, 0.18, 0.48],  // the   → mat
  [0.08, 0.15, 0.30, 0.10, 0.05, 0.32],  // mat   → sat
];

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

function cellColor(val: number, selected: boolean): string {
  if (selected) {
    const r = Math.round(lerp(30, 192, val));
    const g = Math.round(lerp(15, 132, val));
    const b = Math.round(lerp(60, 252, val));
    return `rgb(${r},${g},${b})`;
  }
  const r = Math.round(lerp(15, 129, val));
  const g = Math.round(lerp(23, 140, val));
  const b = Math.round(lerp(42, 248, val));
  return `rgb(${r},${g},${b})`;
}

interface Props {
  tokens?: string[];
  scores?: number[][];
}

export default function AttentionHeatmapViz({ tokens = DEFAULT_TOKENS, scores = DEFAULT_SCORES }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedRow, setSelectedRow] = useState<number>(1); // default: "cat"
  const n = tokens.length;

  const LABEL_L = 64;
  const LABEL_T = 48;
  const PAD_R = 16;
  const PAD_B = 16;

  function getCellSize(cssW: number) {
    const gridW = Math.min(cssW - LABEL_L - PAD_R, cssW * 0.80);
    return gridW / n;
  }

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.offsetWidth;
    if (!cssW) return;

    const cell = getCellSize(cssW);
    const gridSize = cell * n;
    const cssH = LABEL_T + gridSize + PAD_B;

    if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      canvas.style.height = cssH + 'px';
    }

    const ctx = canvas.getContext('2d')!;
    ctx.save();
    ctx.scale(dpr, dpr);
    const W = cssW;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, W, cssH);

    const fs = Math.max(10, Math.round(cell * 0.24));

    // Cells
    for (let row = 0; row < n; row++) {
      for (let col = 0; col < n; col++) {
        const x = LABEL_L + col * cell;
        const y = LABEL_T + row * cell;
        const val = scores[row]?.[col] ?? 0;
        const isSelected = selectedRow === row;

        ctx.fillStyle = cellColor(val, isSelected);
        ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2);

        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 1, y + 1, cell - 2, cell - 2);

        if (isSelected && cell > 40) {
          ctx.fillStyle = val > 0.35 ? '#fff' : '#94a3b8';
          ctx.font = `bold ${Math.round(cell * 0.24)}px monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${Math.round(val * 100)}%`, x + cell / 2, y + cell / 2);
        }
      }
    }

    // Row labels (query)
    for (let row = 0; row < n; row++) {
      const y = LABEL_T + row * cell + cell / 2;
      const isSel = selectedRow === row;
      ctx.fillStyle = isSel ? '#c084fc' : '#475569';
      ctx.font = `${isSel ? 'bold ' : ''}${fs}px system-ui`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(tokens[row], LABEL_L - 10, y);
    }

    // Column labels (key) — angled
    for (let col = 0; col < n; col++) {
      const x = LABEL_L + col * cell + cell / 2;
      ctx.save();
      ctx.translate(x, LABEL_T - 10);
      ctx.rotate(-Math.PI / 5);
      ctx.fillStyle = '#475569';
      ctx.font = `${fs}px system-ui`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText(tokens[col], 0, 0);
      ctx.restore();
    }

    // Axis labels
    ctx.fillStyle = '#1e293b';
    ctx.font = `${Math.round(fs * 0.85)}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('key (attending to →)', LABEL_L + gridSize / 2, 4);

    ctx.save();
    ctx.translate(10, LABEL_T + gridSize / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('query (from ↓)', 0, 0);
    ctx.restore();

    ctx.restore();
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => draw());
    ro.observe(canvas.parentElement!);
    draw();
    return () => ro.disconnect();
  }, []);

  useEffect(() => { draw(); }, [selectedRow, tokens, scores]);

  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cssY = e.clientY - rect.top;
    const cell = getCellSize(canvas.offsetWidth);
    const row = Math.floor((cssY - LABEL_T) / cell);
    if (row >= 0 && row < n) setSelectedRow(row);
  }

  return (
    <div className="not-prose my-8">
      <div className="rounded-2xl overflow-hidden border border-slate-700/50 bg-slate-950">
        <canvas
          ref={canvasRef}
          style={{ width: '100%', display: 'block', cursor: 'pointer' }}
          onClick={handleClick}
        />
        <div className="px-5 py-3 border-t border-slate-800/80">
          <div className="flex flex-wrap gap-2 mb-2">
            {tokens.map((tok, i) => (
              <button
                key={i}
                onClick={() => setSelectedRow(i)}
                className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors ${
                  selectedRow === i
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {tok}
              </button>
            ))}
          </div>
          <p className="m-0 text-[11px] text-slate-500">
            <span className="text-purple-400 font-mono">"{tokens[selectedRow]}"</span>
            {' '}distributes its attention across all tokens — brighter cell = more attention. Click any token to switch.
          </p>
        </div>
      </div>
    </div>
  );
}
