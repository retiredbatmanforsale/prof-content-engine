import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './styles.module.css';

// ── Constants ─────────────────────────────────────────────────────────────────

const X_INPUT  = 1.5;   // fixed input value (shown in context pills)
const Y_TARGET = 0.8;   // fixed target output
const W_MIN    = -3;
const W_MAX    = 3;

// ── Math ──────────────────────────────────────────────────────────────────────

const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

function gradColor(mag: number): string {
  if (mag >= 0.05)  return '#10B981';
  if (mag >= 0.01)  return '#F59E0B';
  if (mag >= 0.002) return '#F97316';
  return '#EF4444';
}

function gradLabel(mag: number): string {
  if (mag >= 0.05)  return 'Healthy';
  if (mag >= 0.01)  return 'Fading';
  if (mag >= 0.002) return 'Weak';
  return 'Vanished';
}

function fmt(v: number): string {
  const a = Math.abs(v);
  if (a < 0.0001) return '≈ 0';
  if (a < 0.01)   return v.toExponential(2);
  return v.toFixed(4);
}

// ── Panel drawing ─────────────────────────────────────────────────────────────

interface PanelSpec {
  xMin: number; xMax: number;
  yMin: number; yMax: number;
  fn:   (x: number) => number;
  dotX: number;
  slope: number;
  color: string;
  title: string;
  derivLabel: string;
  showDragHint?:   boolean;
  showSaturation?: boolean;
}

function drawPanel(
  ctx:     CanvasRenderingContext2D,
  offsetX: number,
  panelW:  number,
  H:       number,
  spec:    PanelSpec,
) {
  const { xMin, xMax, yMin, yMax, fn, dotX, slope, color } = spec;

  const PL = 34, PR = 10, PT = 24, PB = 32;
  const plotW = panelW - PL - PR;
  const plotH = H - PT - PB;

  const mx = (x: number) => offsetX + PL + ((x - xMin) / (xMax - xMin)) * plotW;
  const my = (y: number) => PT + (1 - (y - yMin) / (yMax - yMin)) * plotH;

  const dotY = fn(dotX);
  const sdx  = mx(dotX);
  const sdy  = my(Math.max(yMin, Math.min(yMax, dotY)));

  // ── Clip region for curve + tangent ──────────────────────────────────────
  ctx.save();
  ctx.beginPath();
  ctx.rect(offsetX + PL, PT, plotW, plotH);
  ctx.clip();

  // Function curve
  ctx.beginPath();
  let penDown = false;
  for (let i = 0; i <= 160; i++) {
    const x = xMin + (i / 160) * (xMax - xMin);
    const y = fn(x);
    if (y < yMin - 0.5 || y > yMax + 0.5) { penDown = false; continue; }
    const sx = mx(x), sy = my(y);
    if (!penDown) { ctx.moveTo(sx, sy); penDown = true; }
    else ctx.lineTo(sx, sy);
  }
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.8;
  ctx.stroke();

  // Tangent line (dashed, color)
  const hs    = (xMax - xMin) * 0.28;
  const tx1   = dotX - hs, ty1 = dotY + slope * (tx1 - dotX);
  const tx2   = dotX + hs, ty2 = dotY + slope * (tx2 - dotX);
  ctx.beginPath();
  ctx.moveTo(mx(tx1), my(ty1));
  ctx.lineTo(mx(tx2), my(ty2));
  ctx.strokeStyle = color;
  ctx.lineWidth   = 2;
  ctx.setLineDash([5, 3]);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.restore(); // end clip

  // ── Axes ──────────────────────────────────────────────────────────────────
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;

  const yAt0 = Math.max(yMin, Math.min(yMax, 0));
  ctx.beginPath();
  ctx.moveTo(offsetX + PL, my(yAt0));
  ctx.lineTo(offsetX + PL + plotW, my(yAt0));
  ctx.stroke();

  const xAt0 = Math.max(xMin, Math.min(xMax, 0));
  ctx.beginPath();
  ctx.moveTo(mx(xAt0), PT);
  ctx.lineTo(mx(xAt0), PT + plotH);
  ctx.stroke();

  // ── Axis tick labels ──────────────────────────────────────────────────────
  ctx.fillStyle = '#94a3b8';
  ctx.font      = '9px system-ui, sans-serif';
  ctx.textAlign = 'center';

  // x-axis: min, 0 (if visible), max
  const xTicks = Array.from(
    new Set([xMin, ...(xMin < 0 && xMax > 0 ? [0] : []), xMax])
  );
  xTicks.forEach(v =>
    ctx.fillText(
      Number.isInteger(v) ? String(v) : v.toFixed(1),
      mx(v),
      PT + plotH + 12
    )
  );

  // y-axis: min and max
  ctx.textAlign = 'right';
  [yMin, yMax].forEach(v =>
    ctx.fillText(v.toFixed(1), offsetX + PL - 5, my(v) + 3)
  );

  // ── Panel title ───────────────────────────────────────────────────────────
  ctx.fillStyle  = '#374151';
  ctx.font       = 'bold 10.5px system-ui, sans-serif';
  ctx.textAlign  = 'center';
  ctx.fillText(spec.title, offsetX + panelW / 2, 14);

  // ── Dot glow ──────────────────────────────────────────────────────────────
  ctx.save();
  ctx.globalAlpha = 0.2;
  ctx.beginPath();
  ctx.arc(sdx, sdy, 11, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();

  // Dot body
  ctx.beginPath();
  ctx.arc(sdx, sdy, 5, 0, Math.PI * 2);
  ctx.fillStyle   = color;
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth   = 1.5;
  ctx.stroke();

  // ── Drag hint arrows (first panel only) ───────────────────────────────────
  if (spec.showDragHint) {
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle   = color;
    const gap = 14, sz = 4.5;

    // ← left arrowhead
    ctx.beginPath();
    ctx.moveTo(sdx - gap,      sdy);
    ctx.lineTo(sdx - gap + sz, sdy - sz * 0.65);
    ctx.lineTo(sdx - gap + sz, sdy + sz * 0.65);
    ctx.fill();

    // → right arrowhead
    ctx.beginPath();
    ctx.moveTo(sdx + gap,      sdy);
    ctx.lineTo(sdx + gap - sz, sdy - sz * 0.65);
    ctx.lineTo(sdx + gap - sz, sdy + sz * 0.65);
    ctx.fill();

    ctx.restore();
  }

  // ── Saturation warning (sigmoid panel) ────────────────────────────────────
  if (spec.showSaturation && Math.abs(slope) < 0.04) {
    ctx.fillStyle  = '#EF4444';
    ctx.font       = 'bold 9px system-ui, sans-serif';
    ctx.textAlign  = 'center';
    ctx.fillText('saturated', sdx, sdy - 13);
  }

  // ── Derivative value at bottom ────────────────────────────────────────────
  const absSlope  = Math.abs(slope);
  const slopeStr  = absSlope < 0.0001 ? '≈ 0'
                  : absSlope < 0.01   ? slope.toExponential(1)
                  :                     slope.toFixed(3);
  ctx.fillStyle  = color;
  ctx.font       = 'bold 9.5px ui-monospace, monospace';
  ctx.textAlign  = 'center';
  ctx.fillText(`${spec.derivLabel} = ${slopeStr}`, offsetX + panelW / 2, PT + plotH + 26);
}

// ── Main scene draw ───────────────────────────────────────────────────────────

function drawScene(canvas: HTMLCanvasElement, w: number) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const W = canvas.offsetWidth;
  const H = canvas.offsetHeight;
  if (!W || !H) return;

  const dpr = window.devicePixelRatio || 1;
  ctx.resetTransform();
  ctx.scale(dpr, dpr);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  const z     = X_INPUT * w;
  const a     = sigmoid(z);
  const da_dz = a * (1 - a);
  const dL_da = 2 * (a - Y_TARGET);
  const panelW = W / 3;

  // Panel separators
  ctx.strokeStyle = '#e5e5e5';
  ctx.lineWidth   = 1;
  [panelW, 2 * panelW].forEach(x => {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  });

  // Panel 1 — z = wx  (linear, draggable)
  drawPanel(ctx, 0, panelW, H, {
    xMin: W_MIN, xMax: W_MAX,
    yMin: -4.8,  yMax: 4.8,
    fn:    ww => X_INPUT * ww,
    dotX:  w,    slope: X_INPUT,
    color: '#10B981',
    title: 'z = wx',
    derivLabel: '∂z/∂w',
    showDragHint: true,
  });

  // Panel 2 — a = σ(z)  (sigmoid)
  drawPanel(ctx, panelW, panelW, H, {
    xMin: -4.8, xMax: 4.8,
    yMin: -0.05, yMax: 1.05,
    fn:    sigmoid,
    dotX:  z,   slope: da_dz,
    color: '#3B82F6',
    title: 'a = σ(z)',
    derivLabel: '∂a/∂z',
    showSaturation: true,
  });

  // Panel 3 — L = (a − y)²
  drawPanel(ctx, 2 * panelW, panelW, H, {
    xMin: 0, xMax: 1,
    yMin: 0, yMax: 0.68,
    fn:    aa => (aa - Y_TARGET) ** 2,
    dotX:  a,   slope: dL_da,
    color: '#8B5CF6',
    title: 'L = (a − y)²',
    derivLabel: '∂L/∂a',
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ChainRuleViz() {
  const [w, setW] = useState(0.5);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragging  = useRef(false);
  const wRef      = useRef(w);

  // Derived values (for the DOM formula row)
  const z     = X_INPUT * w;
  const a     = sigmoid(z);
  const L     = (a - Y_TARGET) ** 2;
  const da_dz = a * (1 - a);
  const dL_da = 2 * (a - Y_TARGET);
  const dL_dw = dL_da * da_dz * X_INPUT;
  const mag   = Math.abs(dL_dw);

  // Keep wRef in sync for the resize observer
  useEffect(() => { wRef.current = w; }, [w]);

  // Redraw when w changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) drawScene(canvas, w);
  }, [w]);

  // Stable draw fn for ResizeObserver (uses ref, never stale)
  const redrawFromRef = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) drawScene(canvas, wRef.current);
  }, []);

  // Resize observer — set up once
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ro = new ResizeObserver(() => {
      const dpr = window.devicePixelRatio || 1;
      const cw = canvas.clientWidth;
      const ch = canvas.clientHeight;
      if (!cw || !ch) return;
      canvas.width  = cw * dpr;
      canvas.height = ch * dpr;
      redrawFromRef();
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [redrawFromRef]);

  // ── Pointer drag (Panel 1 only) ───────────────────────────────────────────
  const wFromPointer = (e: React.PointerEvent<HTMLCanvasElement>): number | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect   = canvas.getBoundingClientRect();
    const x      = e.clientX - rect.left;
    const panelW = rect.width / 3;
    if (x > panelW) return null;
    const PL    = 34, PR = 10;
    const plotW = panelW - PL - PR;
    const world = W_MIN + ((x - PL) / plotW) * (W_MAX - W_MIN);
    return Math.max(W_MIN, Math.min(W_MAX, world));
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const nw = wFromPointer(e);
    if (nw === null) return;
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    setW(nw);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // Update cursor based on hover region
    const rect   = e.currentTarget.getBoundingClientRect();
    const inP1   = (e.clientX - rect.left) <= rect.width / 3;
    e.currentTarget.style.cursor = inP1 ? 'ew-resize' : 'default';

    if (!dragging.current) return;
    const nw = wFromPointer(e);
    if (nw !== null) setW(nw);
  };

  const onPointerUp = () => { dragging.current = false; };

  return (
    <div className={styles.root}>

      {/* ── Header ────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <span className={styles.icon} aria-hidden>⛓</span>
          <span className={styles.title}>Chain Rule — Backpropagation</span>
        </div>
        <p className={styles.subtitle}>
          Drag <strong>w</strong> in the first panel (or use the slider) to see how three local
          derivatives multiply together to form ∂L/∂w. Watch the gradient collapse when the
          sigmoid saturates.
        </p>
      </div>

      {/* ── Context pills ─────────────────────────────────────────── */}
      <div className={styles.pillRow}>
        <span className={styles.pill}>x = {X_INPUT} (fixed input)</span>
        <span className={styles.pill}>y = {Y_TARGET} (fixed target)</span>
        <span className={styles.pillBlue}>z = {z.toFixed(3)}</span>
        <span className={styles.pillViolet}>a = {a.toFixed(3)}</span>
        <span className={styles.pillRed}>L = {L.toFixed(4)}</span>
      </div>

      {/* ── Canvas (three panels) ─────────────────────────────────── */}
      <div className={styles.canvasWrap}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        />
      </div>

      {/* ── w slider ──────────────────────────────────────────────── */}
      <div className={styles.sliderRow}>
        <span className={styles.sliderKey}>w</span>
        <input
          type="range"
          min={W_MIN} max={W_MAX} step={0.02}
          value={w}
          className={styles.slider}
          onChange={e => setW(Number(e.target.value))}
        />
        <span className={styles.sliderVal}>
          {w >= 0 ? '+' : ''}{w.toFixed(2)}
        </span>
      </div>

      {/* ── Chain rule formula ────────────────────────────────────── */}
      <div className={styles.chainRow}>
        <span className={styles.chainLhs}>∂L/∂w</span>
        <span className={styles.eq}>=</span>

        <div className={styles.term} style={{ borderColor: '#8B5CF6' }}>
          <span className={styles.termTop} style={{ color: '#8B5CF6' }}>∂L/∂a</span>
          <span className={styles.termVal} style={{ color: '#8B5CF6' }}>{fmt(dL_da)}</span>
        </div>
        <span className={styles.mul}>×</span>

        <div className={styles.term} style={{ borderColor: '#3B82F6' }}>
          <span className={styles.termTop} style={{ color: '#3B82F6' }}>∂a/∂z</span>
          <span className={styles.termVal} style={{ color: '#3B82F6' }}>{fmt(da_dz)}</span>
        </div>
        <span className={styles.mul}>×</span>

        <div className={styles.term} style={{ borderColor: '#10B981' }}>
          <span className={styles.termTop} style={{ color: '#10B981' }}>∂z/∂w</span>
          <span className={styles.termVal} style={{ color: '#10B981' }}>{fmt(X_INPUT)}</span>
        </div>

        <span className={styles.eq}>=</span>

        <div className={styles.result} style={{ borderColor: gradColor(mag), color: gradColor(mag) }}>
          <span className={styles.resultVal}>{fmt(dL_dw)}</span>
          <span className={styles.resultStatus}>{gradLabel(mag)}</span>
        </div>
      </div>

      {/* ── Insight ───────────────────────────────────────────────── */}
      <div className={styles.insight} style={{ borderLeftColor: gradColor(mag) }}>
        <span className={styles.bulb} aria-hidden>💡</span>
        <p className={styles.insightText}>
          {mag < 0.002
            ? `Sigmoid saturated at z = ${z.toFixed(2)}. The middle term ∂a/∂z = ${fmt(da_dz)} crushes the entire product — w gets essentially no gradient and stops learning. This is the vanishing gradient problem expressed through the chain rule.`
            : `∂L/∂w = ${fmt(dL_da)} × ${fmt(da_dz)} × ${fmt(X_INPUT)} = ${fmt(dL_dw)}. Gradient descent nudges w by −lr × ${fmt(dL_dw)}. Each node computed only its own local derivative — no node needed to know the full network. That's why backprop scales to millions of parameters.`
          }
        </p>
      </div>

    </div>
  );
}
