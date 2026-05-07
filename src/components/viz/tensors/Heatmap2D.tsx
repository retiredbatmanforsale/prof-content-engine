import React, { useRef, useEffect, useState } from 'react';

/**
 * Heatmap2D — generic rectangular heatmap. Used for vision attention rollout,
 * embedding similarity matrices, decision-boundary fields, etc.
 *
 * Differs from AttentionGrid: no token-axis labels by default, supports
 * non-square data, and an optional background image overlay (blended) for the
 * vision-attention-rollout use case.
 */

interface Props {
  /** 2D values matrix [rows][cols]. */
  values: number[][];
  /** Min/max for color normalization. If omitted, auto-derived from values. */
  vmin?: number;
  vmax?: number;
  /** Color ramp. */
  ramp?: 'viridis' | 'plasma' | 'mono';
  /** Optional background image URL — drawn behind the heatmap, useful for ViT attention overlays. */
  backgroundUrl?: string;
  /** Heatmap opacity when a background is present. Default 0.65. */
  overlayOpacity?: number;
  /** Aspect ratio (h/w) of the rendered canvas. Default = rows/cols. */
  aspectRatio?: number;
  /** Hover handler. */
  onCellHover?: (info: { row: number; col: number; value: number } | null) => void;
}

function clamp01(x: number) { return Math.max(0, Math.min(1, x)); }

function rampColor(v: number, ramp: 'viridis' | 'plasma' | 'mono'): [number, number, number] {
  const t = clamp01(v);
  if (ramp === 'mono') {
    const c = Math.round(t * 255);
    return [c, c, c];
  }
  if (ramp === 'plasma') {
    const r = Math.round(13 + t * 240);
    const g = Math.round(8 + t * 130);
    const b = Math.round(135 - t * 90);
    return [r, g, b];
  }
  // viridis-ish
  const r = Math.round(68 + t * 187);
  const g = Math.round(1 + t * 230);
  const b = Math.round(84 + (1 - Math.abs(t - 0.5) * 2) * 100);
  return [r, g, b];
}

export default function Heatmap2D({
  values,
  vmin,
  vmax,
  ramp = 'viridis',
  backgroundUrl,
  overlayOpacity = 0.65,
  aspectRatio,
  onCellHover,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgRef = useRef<HTMLImageElement | null>(null);
  const [, force] = useState(0);

  const rows = values.length;
  const cols = values[0]?.length ?? 0;

  // Compute min/max if not provided
  let minV = vmin, maxV = vmax;
  if (minV == null || maxV == null) {
    let mi = Infinity, ma = -Infinity;
    for (const r of values) for (const v of r) {
      if (v < mi) mi = v;
      if (v > ma) ma = v;
    }
    if (minV == null) minV = mi;
    if (maxV == null) maxV = ma;
  }
  const range = Math.max(1e-9, maxV - minV);

  // Load background once
  useEffect(() => {
    if (!backgroundUrl) { bgRef.current = null; return; }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { bgRef.current = img; force((n) => n + 1); };
    img.src = backgroundUrl;
  }, [backgroundUrl]);

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas || rows === 0 || cols === 0) return;
    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.offsetWidth;
    if (!cssW) return;
    const ar = aspectRatio ?? rows / cols;
    const cssH = Math.round(cssW * ar);

    if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      canvas.style.height = cssH + 'px';
    }
    const ctx = canvas.getContext('2d')!;
    ctx.save();
    ctx.scale(dpr, dpr);

    if (bgRef.current) {
      ctx.drawImage(bgRef.current, 0, 0, cssW, cssH);
      ctx.globalAlpha = overlayOpacity;
    } else {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, cssW, cssH);
    }

    const cw = cssW / cols, ch = cssH / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const norm = (values[r][c] - minV!) / range;
        const [R, G, B] = rampColor(clamp01(norm), ramp);
        ctx.fillStyle = `rgb(${R},${G},${B})`;
        ctx.fillRect(c * cw, r * ch, Math.ceil(cw) + 1, Math.ceil(ch) + 1);
      }
    }
    ctx.restore();
  }

  useEffect(draw);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', display: 'block', cursor: onCellHover ? 'crosshair' : 'default' }}
      onMouseMove={(e) => {
        if (!onCellHover) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left, y = e.clientY - rect.top;
        const c = Math.floor((x / rect.width) * cols);
        const r = Math.floor((y / rect.height) * rows);
        if (r >= 0 && r < rows && c >= 0 && c < cols) {
          onCellHover({ row: r, col: c, value: values[r][c] });
        }
      }}
      onMouseLeave={() => onCellHover?.(null)}
    />
  );
}
