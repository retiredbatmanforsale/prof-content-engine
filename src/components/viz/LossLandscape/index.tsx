import React, { useState, useEffect, useRef, useMemo } from 'react';
import styles from './styles.module.css';

// ── Constants ─────────────────────────────────────────────────────────────────

const WORLD  = 1.9;   // world coords: -WORLD … +WORLD on both axes
const GRID   = 26;    // grid resolution (GRID × GRID cells)
const AZ     = 0.65;  // camera azimuth in radians (~37°)
const V_COMP = 0.38;  // depth-axis compression for the oblique projection

type Mode = 'convex' | 'nonconvex';

// ── Surface definitions ───────────────────────────────────────────────────────

interface SurfaceDef {
  fn:      (x: number, y: number) => number;
  grad:    (x: number, y: number) => [number, number];
  start:   [number, number];
  lr:      number;
  steps:   number;
  formula: string;
  minima:  string;
  insight: string;
}

const SURFACES: Record<Mode, SurfaceDef> = {
  convex: {
    fn:      (x, y) => x * x + 2 * y * y,
    grad:    (x, y) => [2 * x, 4 * y],
    start:   [-1.5, 0.9],
    lr:      0.09,
    steps:   60,
    formula: 'L = x² + 2y²   ∇L = (2x, 4y)',
    minima:  'One global minimum at (0, 0)',
    insight:
      'Convex loss surfaces — MSE for linear regression, cross-entropy for logistic — have exactly one global minimum. Gradient descent always converges, regardless of starting point. The path spirals inward because the y-axis (steeper curvature) contracts faster than x. Non-convex surfaces like those of deep networks are a completely different story.',
  },
  nonconvex: {
    fn:      (x, y) => (x * x - 1) ** 2 + 0.5 * y * y,
    grad:    (x, y) => [4 * x * (x * x - 1), y],
    start:   [0.15, 1.3],
    lr:      0.07,
    steps:   90,
    formula: 'L = (x²−1)² + ½y²   ∇L = (4x(x²−1), y)',
    minima:  'Two minima at (±1, 0)  ·  saddle at (0, 0)',
    insight:
      'Deep network loss surfaces are non-convex. This double-well shows two equally valid minima and a saddle point at (0, 0). Starting near the saddle, gradient descent must choose a valley — a tiny perturbation in initialization can flip which minimum is reached. This is why random seed, learning rate, and batch noise all influence which solution a DNN finds, and why flat vs sharp minima matter for generalization.',
  },
};

// ── Grid ──────────────────────────────────────────────────────────────────────

interface GridData {
  pts:  [number, number, number][][]; // pts[i][j] = [x, y, z]
  zMin: number;
  zMax: number;
}

function computeGrid(mode: Mode): GridData {
  const { fn } = SURFACES[mode];
  const step = (2 * WORLD) / GRID;
  const pts: [number, number, number][][] = [];
  let zMin = Infinity, zMax = -Infinity;

  for (let i = 0; i <= GRID; i++) {
    pts[i] = [];
    for (let j = 0; j <= GRID; j++) {
      const x = -WORLD + i * step;
      const y = -WORLD + j * step;
      const z = fn(x, y);
      pts[i][j] = [x, y, z];
      if (z < zMin) zMin = z;
      if (z > zMax) zMax = z;
    }
  }
  return { pts, zMin, zMax };
}

// ── Trajectory ────────────────────────────────────────────────────────────────

function computeTrajectory(mode: Mode): [number, number][] {
  const { grad, start, lr, steps } = SURFACES[mode];
  const path: [number, number][] = [[...start]];
  let [x, y] = start;

  for (let i = 0; i < steps; i++) {
    const [gx, gy] = grad(x, y);
    x = Math.max(-WORLD, Math.min(WORLD, x - lr * gx));
    y = Math.max(-WORLD, Math.min(WORLD, y - lr * gy));
    path.push([x, y]);
  }
  return path;
}

// ── Drawing ───────────────────────────────────────────────────────────────────

function drawScene(
  canvas: HTMLCanvasElement,
  grid:   GridData,
  traj:   [number, number][],
  step:   number,
  mode:   Mode,
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const W = canvas.offsetWidth;
  const H = canvas.offsetHeight;
  if (!W || !H) return;

  const dpr = window.devicePixelRatio || 1;
  ctx.resetTransform();
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, W, H);

  const { fn } = SURFACES[mode];
  const { pts, zMin, zMax } = grid;
  const zRange = Math.max(zMax - zMin, 0.001);

  // Responsive projection parameters
  const scaleH = Math.min(W, H * 1.8) / 5;
  const scaleZ = H / 4.2;
  const cx     = W * 0.50;
  const cy     = H * 0.63;

  const cosAZ = Math.cos(AZ);
  const sinAZ = Math.sin(AZ);

  // Project world (wx, wy, wz_raw) → screen (x, y)
  // extraNorm lifts the point above the surface by that fraction of zRange
  function project(wx: number, wy: number, wzRaw: number, extraNorm = 0) {
    const rx    = wx * cosAZ + wy * sinAZ;
    const ry    = -wx * sinAZ + wy * cosAZ;
    const znorm = (wzRaw - zMin) / zRange * 2 + extraNorm;
    return {
      x: cx + rx * scaleH,
      y: cy + ry * V_COMP * scaleH - znorm * scaleZ,
    };
  }

  // Height → color (blue-teal → yellow → orange-red)
  function heightColor(z: number, alpha = 1): string {
    const t = (z - zMin) / zRange;
    let r: number, g: number, b: number;
    if (t < 0.5) {
      const u = t * 2;
      r = Math.round(59  + u * (250 - 59));   // 59→250
      g = Math.round(130 + u * (204 - 130));  // 130→204
      b = Math.round(246 - u * (246 - 21));   // 246→21
    } else {
      const u = (t - 0.5) * 2;
      r = Math.round(250 + u * (239 - 250));  // 250→239
      g = Math.round(204 - u * (204 - 68));   // 204→68
      b = Math.round(21  + u * (68  - 21));   // 21→68
    }
    return `rgba(${r},${g},${b},${alpha})`;
  }

  // ── Background ────────────────────────────────────────────────────────────
  ctx.fillStyle = '#f8f9fa';
  ctx.fillRect(0, 0, W, H);

  // ── Sort cells back-to-front (painter's algorithm) ────────────────────────
  const cells: Array<{ i: number; j: number; depth: number }> = [];
  for (let i = 0; i < GRID; i++) {
    for (let j = 0; j < GRID; j++) {
      const mx    = (pts[i][j][0] + pts[i + 1][j + 1][0]) / 2;
      const my    = (pts[i][j][1] + pts[i + 1][j + 1][1]) / 2;
      const depth = -mx * sinAZ + my * cosAZ;
      cells.push({ i, j, depth });
    }
  }
  cells.sort((a, b) => b.depth - a.depth);

  // ── Draw surface cells ────────────────────────────────────────────────────
  for (const { i, j } of cells) {
    const corners: [number, number, number][] = [
      pts[i][j], pts[i + 1][j], pts[i + 1][j + 1], pts[i][j + 1],
    ];
    const avgZ = corners.reduce((s, c) => s + c[2], 0) / 4;
    const proj = corners.map(([x, y, z]) => project(x, y, z));

    ctx.beginPath();
    ctx.moveTo(proj[0].x, proj[0].y);
    for (let k = 1; k < 4; k++) ctx.lineTo(proj[k].x, proj[k].y);
    ctx.closePath();

    ctx.fillStyle   = heightColor(avgZ, 0.9);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth   = 0.5;
    ctx.stroke();
  }

  // ── Trajectory trail ──────────────────────────────────────────────────────
  const visible = Math.min(step + 1, traj.length);
  if (visible > 1) {
    ctx.lineCap = 'round';
    for (let s = 1; s < visible; s++) {
      const [x0, y0] = traj[s - 1];
      const [x1, y1] = traj[s];
      const p0 = project(x0, y0, fn(x0, y0), 0.10);
      const p1 = project(x1, y1, fn(x1, y1), 0.10);
      // Newer segments are brighter
      const age   = (visible - s) / visible;
      const alpha = Math.max(0.1, 1 - age * 0.85);

      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.strokeStyle = `rgba(255, 230, 50, ${alpha})`;
      ctx.lineWidth   = 2.5;
      ctx.stroke();
    }
  }

  // ── Ball at current step ──────────────────────────────────────────────────
  if (step < traj.length) {
    const [bx, by] = traj[step];
    const bp = project(bx, by, fn(bx, by), 0.18);

    // Glow
    const grd = ctx.createRadialGradient(bp.x, bp.y, 1, bp.x, bp.y, 15);
    grd.addColorStop(0,   'rgba(255, 255, 160, 0.95)');
    grd.addColorStop(0.5, 'rgba(255, 200, 30,  0.4)');
    grd.addColorStop(1,   'rgba(255, 170, 0,   0)');
    ctx.beginPath();
    ctx.arc(bp.x, bp.y, 15, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();

    // Ball body
    ctx.beginPath();
    ctx.arc(bp.x, bp.y, 5.5, 0, Math.PI * 2);
    ctx.fillStyle   = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth   = 2;
    ctx.stroke();
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function LossLandscapeViz({ mode: initialMode = 'nonconvex' }: { mode?: Mode }) {
  const [mode,    setMode]    = useState<Mode>(initialMode);
  const [step,    setStep]    = useState(0);
  const [playing, setPlaying] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stepRef   = useRef(0);

  const grid = useMemo(() => computeGrid(mode), [mode]);
  const traj = useMemo(() => computeTrajectory(mode), [mode]);

  // Keep stepRef in sync for the resize observer
  useEffect(() => { stepRef.current = step; }, [step]);

  // Reset when mode changes
  useEffect(() => {
    setStep(0);
    setPlaying(false);
  }, [mode]);

  // Redraw when step or mode changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) drawScene(canvas, grid, traj, step, mode);
  }, [step, grid, traj, mode]);

  // Resize observer — set up once per grid/mode change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w   = canvas.clientWidth;
      const h   = canvas.clientHeight;
      if (!w || !h) return;
      canvas.width  = w * dpr;
      canvas.height = h * dpr;
      drawScene(canvas, grid, traj, stepRef.current, mode);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [grid, traj, mode]);

  // Animation loop
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setStep(s => {
        if (s >= traj.length - 1) { setPlaying(false); return s; }
        return s + 1;
      });
    }, 100);
    return () => clearInterval(id);
  }, [playing, traj.length]);

  const surf = SURFACES[mode];

  return (
    <div className={styles.root}>

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <span className={styles.titleIcon} aria-hidden>▲</span>
          <span className={styles.title}>Loss Landscape</span>
        </div>
        <p className={styles.subtitle}>
          Pseudo-3D loss surface with gradient descent path. Toggle convex vs non-convex — watch how the geometry changes what gradient descent can do.
        </p>
      </div>

      {/* ── Mode tabs ────────────────────────────────────────────── */}
      <div className={styles.tabRow}>
        <button
          className={styles.tab}
          style={mode === 'convex'
            ? { background: '#3B82F6', borderColor: '#3B82F6', color: '#fff' }
            : undefined}
          onClick={() => setMode('convex')}
        >
          Convex  ·  linear / logistic
        </button>
        <button
          className={styles.tab}
          style={mode === 'nonconvex'
            ? { background: '#8B5CF6', borderColor: '#8B5CF6', color: '#fff' }
            : undefined}
          onClick={() => setMode('nonconvex')}
        >
          Non-convex  ·  DNN
        </button>
        <span className={styles.minimaTag}>{surf.minima}</span>
      </div>

      {/* ── Canvas ───────────────────────────────────────────────── */}
      <div className={styles.canvasWrap}>
        <canvas ref={canvasRef} className={styles.canvas} />
      </div>

      {/* ── Playback controls ────────────────────────────────────── */}
      <div className={styles.controls}>
        <button
          className={styles.playBtn}
          onClick={() => {
            if (step >= traj.length - 1) setStep(0);
            setPlaying(p => !p);
          }}
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? '⏸' : '▶'}
        </button>
        <button
          className={styles.resetBtn}
          onClick={() => { setStep(0); setPlaying(false); }}
          aria-label="Reset"
        >
          ↺
        </button>
        <input
          type="range"
          min={0}
          max={traj.length - 1}
          value={step}
          className={styles.slider}
          onChange={e => { setPlaying(false); setStep(Number(e.target.value)); }}
        />
        <span className={styles.stepLabel}>
          Step {step} / {traj.length - 1}
        </span>
      </div>

      {/* ── Formula strip ────────────────────────────────────────── */}
      <div className={styles.formulaRow}>
        <code className={styles.formula}>{surf.formula}</code>
        <span className={styles.formulaNote}>
          lr = {surf.lr}  ·  yellow path = gradient descent  ·  ⬤ = current position
        </span>
      </div>

      {/* ── Insight card ─────────────────────────────────────────── */}
      <div
        className={styles.insight}
        style={{ borderLeftColor: mode === 'convex' ? '#3B82F6' : '#8B5CF6' }}
      >
        <span className={styles.insightBulb} aria-hidden>💡</span>
        <p className={styles.insightText}>{surf.insight}</p>
      </div>

    </div>
  );
}
