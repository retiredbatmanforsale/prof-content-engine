import React, { useRef, useEffect, useState, useMemo } from 'react';

/**
 * ScatterPlot2D — 2D scatter for word-vector / embedding projections.
 *
 * Auto-scales to data extent. Supports labels, hover detail, click, and
 * (optionally) drag-to-move points (used for the word-arithmetic viz where
 * users explore the neighborhood of `king - man + woman`).
 */

export interface Point2D {
  x: number;
  y: number;
  label?: string;
  /** Color override. */
  color?: string;
  /** Group/cluster id — used for default coloring when no `color` is set. */
  group?: number | string;
  /** Make this point visually emphasized (e.g. the query result). */
  emphasized?: boolean;
}

interface Props {
  points: Point2D[];
  /** Aspect ratio (h/w). Default 0.6. */
  aspectRatio?: number;
  /** Show labels next to points. */
  showLabels?: boolean;
  /** Allow dragging individual points; receives the new (x, y). */
  onPointDrag?: (idx: number, x: number, y: number) => void;
  /** Click handler. */
  onPointClick?: (idx: number) => void;
  /** Optional title/legend caption. */
  caption?: string;
}

const GROUP_COLORS = ['#7c3aed', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899', '#14b8a6', '#a855f7'];

function colorFor(p: Point2D): string {
  if (p.color) return p.color;
  if (p.group != null) {
    const k = typeof p.group === 'number' ? p.group : Math.abs(hash(String(p.group)));
    return GROUP_COLORS[k % GROUP_COLORS.length];
  }
  return '#94a3b8';
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return h;
}

export default function ScatterPlot2D({
  points,
  aspectRatio = 0.6,
  showLabels = true,
  onPointDrag,
  onPointClick,
  caption,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);

  const extent = useMemo(() => {
    if (!points.length) return { minX: -1, maxX: 1, minY: -1, maxY: 1 };
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of points) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
    // pad by 8%
    const padX = (maxX - minX) * 0.08 + 1e-3;
    const padY = (maxY - minY) * 0.08 + 1e-3;
    return { minX: minX - padX, maxX: maxX + padX, minY: minY - padY, maxY: maxY + padY };
  }, [points]);

  function project(p: Point2D, cssW: number, cssH: number): [number, number] {
    const x = ((p.x - extent.minX) / (extent.maxX - extent.minX)) * cssW;
    const y = cssH - ((p.y - extent.minY) / (extent.maxY - extent.minY)) * cssH;
    return [x, y];
  }

  function unproject(px: number, py: number, cssW: number, cssH: number): [number, number] {
    const x = (px / cssW) * (extent.maxX - extent.minX) + extent.minX;
    const y = ((cssH - py) / cssH) * (extent.maxY - extent.minY) + extent.minY;
    return [x, y];
  }

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.offsetWidth;
    if (!cssW) return;
    const cssH = Math.round(cssW * aspectRatio);
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

    // gridlines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let i = 1; i < 5; i++) {
      const x = (cssW * i) / 5, y = (cssH * i) / 5;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, cssH); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cssW, y); ctx.stroke();
    }

    // points
    points.forEach((p, i) => {
      const [x, y] = project(p, cssW, cssH);
      const r = p.emphasized ? 7 : 4;
      ctx.fillStyle = colorFor(p);
      ctx.globalAlpha = hover === i || dragging === i ? 1 : 0.85;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      if (p.emphasized || hover === i) {
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      if (showLabels && p.label) {
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '11px ui-sans-serif, system-ui, sans-serif';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.label, x + r + 4, y);
      }
    });
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  useEffect(draw);

  function pickPoint(e: React.MouseEvent): number | null {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    let best = -1, bestD = 12; // 12px hit radius
    for (let i = 0; i < points.length; i++) {
      const [px, py] = project(points[i], canvas.offsetWidth, Math.round(canvas.offsetWidth * aspectRatio));
      const d = Math.hypot(px - x, py - y);
      if (d < bestD) { best = i; bestD = d; }
    }
    return best === -1 ? null : best;
  }

  return (
    <div className="not-prose">
      <canvas
        ref={canvasRef}
        style={{ width: '100%', display: 'block', cursor: dragging != null ? 'grabbing' : hover != null ? 'pointer' : 'default' }}
        onMouseMove={(e) => {
          if (dragging != null && onPointDrag) {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            const cssW = canvas.offsetWidth, cssH = Math.round(cssW * aspectRatio);
            const [nx, ny] = unproject(e.clientX - rect.left, e.clientY - rect.top, cssW, cssH);
            onPointDrag(dragging, nx, ny);
            return;
          }
          setHover(pickPoint(e));
        }}
        onMouseLeave={() => setHover(null)}
        onMouseDown={(e) => { const i = pickPoint(e); if (i != null && onPointDrag) setDragging(i); }}
        onMouseUp={() => setDragging(null)}
        onClick={(e) => { const i = pickPoint(e); if (i != null) onPointClick?.(i); }}
      />
      {caption && <div className="text-[11px] text-slate-500 font-sans mt-1">{caption}</div>}
    </div>
  );
}
