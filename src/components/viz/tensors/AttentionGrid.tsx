import React, { useRef, useEffect, useState } from 'react';

/**
 * AttentionGrid — heatmap of an attention matrix.
 *
 * Rows = query position (attending FROM), cols = key position (attending TO).
 * Click a cell to invoke `onCellClick` (used by demos for ablation / drill-in).
 */
interface Props {
  /** Square attention matrix [T x T], rows-from-cols. Values typically 0..1 (row-stochastic) but any range works. */
  scores: number[][];
  /** Optional token labels for axes; if missing, indices are shown. */
  tokens?: string[];
  /** Highlighted (selected) row, drawn with a brighter ramp. */
  selectedRow?: number;
  /** Cell click handler — receives (row, col). */
  onCellClick?: (row: number, col: number) => void;
  /** Cell hover handler — receives (row, col, value) or null on leave. */
  onCellHover?: (info: { row: number; col: number; value: number } | null) => void;
  /** Pixel height per cell; the grid auto-sizes to fit. Default 24. */
  cellSize?: number;
  /** Compact mode — no axis labels, useful for the L×H grid-of-grids overview. */
  compact?: boolean;
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

function cellColor(val: number, selected: boolean): string {
  const v = Math.max(0, Math.min(1, val));
  if (selected) {
    return `rgb(${Math.round(lerp(30, 192, v))},${Math.round(lerp(15, 132, v))},${Math.round(lerp(60, 252, v))})`;
  }
  return `rgb(${Math.round(lerp(15, 129, v))},${Math.round(lerp(23, 140, v))},${Math.round(lerp(42, 248, v))})`;
}

export default function AttentionGrid({
  scores,
  tokens,
  selectedRow,
  onCellClick,
  onCellHover,
  cellSize,
  compact = false,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hover, setHover] = useState<{ row: number; col: number } | null>(null);

  const n = scores.length;
  const PAD_L = compact ? 4 : 64;
  const PAD_T = compact ? 4 : 48;
  const PAD_R = compact ? 4 : 16;
  const PAD_B = compact ? 4 : 16;

  function geometry(cssW: number) {
    const cell = cellSize ?? Math.max(8, Math.min(36, (cssW - PAD_L - PAD_R) / Math.max(1, n)));
    return { cell, gridSize: cell * n };
  }

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.offsetWidth;
    if (!cssW) return;

    const { cell, gridSize } = geometry(cssW);
    const cssH = PAD_T + gridSize + PAD_B;

    if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      canvas.style.height = cssH + 'px';
    }
    const ctx = canvas.getContext('2d')!;
    ctx.save();
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, cssW, cssH);

    // Cells
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const v = scores[r][c];
        ctx.fillStyle = cellColor(v, selectedRow === r);
        ctx.fillRect(PAD_L + c * cell, PAD_T + r * cell, cell, cell);
      }
    }

    // Hover ring
    if (hover) {
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.strokeRect(PAD_L + hover.col * cell + 1, PAD_T + hover.row * cell + 1, cell - 2, cell - 2);
    }

    if (!compact && tokens) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = `${Math.max(10, Math.round(cell * 0.32))}px ui-monospace, monospace`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      for (let r = 0; r < n; r++) {
        ctx.fillText(tokens[r] ?? String(r), PAD_L - 6, PAD_T + r * cell + cell / 2);
      }
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      for (let c = 0; c < n; c++) {
        ctx.save();
        ctx.translate(PAD_L + c * cell + cell / 2, PAD_T - 6);
        ctx.rotate(-Math.PI / 4);
        ctx.fillText(tokens[c] ?? String(c), 0, 0);
        ctx.restore();
      }
    }

    ctx.restore();
  }

  useEffect(draw);

  function locate(e: React.MouseEvent): { row: number; col: number } | null {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    const { cell } = geometry(canvas.offsetWidth);
    const c = Math.floor((x - PAD_L) / cell);
    const r = Math.floor((y - PAD_T) / cell);
    if (r < 0 || r >= n || c < 0 || c >= n) return null;
    return { row: r, col: c };
  }

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', display: 'block', cursor: onCellClick ? 'pointer' : 'crosshair' }}
      onMouseMove={(e) => {
        const cell = locate(e);
        setHover(cell);
        if (cell && onCellHover) onCellHover({ ...cell, value: scores[cell.row][cell.col] });
        else if (!cell && onCellHover) onCellHover(null);
      }}
      onMouseLeave={() => { setHover(null); onCellHover?.(null); }}
      onClick={(e) => {
        const cell = locate(e);
        if (cell && onCellClick) onCellClick(cell.row, cell.col);
      }}
    />
  );
}
