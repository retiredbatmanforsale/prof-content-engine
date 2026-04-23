import React, { useRef, useEffect, useState, useMemo } from 'react';

// Seeded LCG random number generator
function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

const RATIO = 0.56;
const RANGE = 3.0;

interface Point { x: number; y: number; label: 0 | 1; }

interface Props {
  nPoints?: number;
  seed?: number;
}

export default function DecisionBoundaryViz({ nPoints = 80, seed = 42 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [angle, setAngle] = useState(45);

  const points = useMemo<Point[]>(() => {
    const r = makeRng(seed);
    const pts: Point[] = [];
    for (let i = 0; i < nPoints; i++) {
      const label = (i < nPoints / 2 ? 0 : 1) as 0 | 1;
      const cx = label === 0 ? -1.3 : 1.3;
      const cy = label === 0 ? -1.3 : 1.3;
      const u1 = Math.max(1e-9, r()), u2 = r();
      const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      const z1 = Math.sqrt(-2 * Math.log(u1)) * Math.sin(2 * Math.PI * u2);
      pts.push({ x: cx + z0 * 0.7, y: cy + z1 * 0.7, label });
    }
    return pts;
  }, [nPoints, seed]);

  function classify(p: Point, deg: number): 0 | 1 {
    const rad = (deg * Math.PI) / 180;
    return Math.cos(rad) * p.x + Math.sin(rad) * p.y >= 0 ? 1 : 0;
  }

  const accuracy = useMemo(
    () => points.filter(p => classify(p, angle) === p.label).length / points.length,
    [points, angle]
  );

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.offsetWidth;
    if (!cssW) return;
    const cssH = Math.round(cssW * RATIO);

    if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      canvas.style.height = cssH + 'px';
    }

    const ctx = canvas.getContext('2d')!;
    ctx.save();
    ctx.scale(dpr, dpr);
    const W = cssW, H = cssH;
    const PAD = 28;
    const pw = W - 2 * PAD, ph = H - 2 * PAD;

    const px = (v: number) => PAD + ((v + RANGE) / (2 * RANGE)) * pw;
    const py = (v: number) => PAD + ph - ((v + RANGE) / (2 * RANGE)) * ph;

    // Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, W, H);

    // Soft half-plane shading
    const rad = (angle * Math.PI) / 180;
    const nx = Math.cos(rad), ny = Math.sin(rad);
    const step = 5;
    for (let xi = 0; xi < pw; xi += step) {
      for (let yi = 0; yi < ph; yi += step) {
        const dataX = -RANGE + (xi / pw) * 2 * RANGE;
        const dataY = RANGE - (yi / ph) * 2 * RANGE;
        const side = nx * dataX + ny * dataY >= 0;
        ctx.fillStyle = side ? 'rgba(52,211,153,0.05)' : 'rgba(251,146,60,0.05)';
        ctx.fillRect(PAD + xi, PAD + yi, step, step);
      }
    }

    // Grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAD, py(0)); ctx.lineTo(PAD + pw, py(0));
    ctx.moveTo(px(0), PAD); ctx.lineTo(px(0), PAD + ph);
    ctx.stroke();

    // Decision boundary
    const ext = RANGE * 1.6;
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 2;
    ctx.setLineDash([7, 5]);
    ctx.beginPath();
    ctx.moveTo(px(-ny * ext), py(nx * ext));
    ctx.lineTo(px(ny * ext),  py(-nx * ext));
    ctx.stroke();
    ctx.setLineDash([]);

    // Normal vector arrow
    const cx = W / 2, cy = H / 2;
    const aLen = Math.min(pw, ph) * 0.16;
    const ax = cx + nx * aLen, ay = cy - ny * aLen;
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(ax, ay);
    ctx.stroke();
    const angH = Math.atan2(cy - ay, ax - cx);
    ctx.fillStyle = '#818cf8';
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(ax - 9 * Math.cos(angH - 0.45), ay + 9 * Math.sin(angH - 0.45));
    ctx.lineTo(ax - 9 * Math.cos(angH + 0.45), ay + 9 * Math.sin(angH + 0.45));
    ctx.closePath();
    ctx.fill();

    // Data points
    const dotR = Math.max(3.5, Math.min(6, W * 0.009));
    for (const p of points) {
      const predicted = classify(p, angle);
      const correct = predicted === p.label;
      const x = px(p.x), y = py(p.y);

      ctx.beginPath();
      if (p.label === 1) {
        ctx.arc(x, y, dotR, 0, Math.PI * 2);
      } else {
        const s = dotR * 0.9;
        ctx.rect(x - s, y - s, s * 2, s * 2);
      }
      ctx.fillStyle = correct
        ? (p.label === 1 ? '#34d399' : '#fb923c')
        : '#f87171';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    // Stats overlay
    const fs = Math.round(W * 0.018);
    const bw = 148, bh = 44;
    ctx.fillStyle = 'rgba(2,6,23,0.88)';
    ctx.beginPath();
    ctx.roundRect(W - PAD - bw, PAD + 4, bw, bh, 6);
    ctx.fill();
    ctx.font = `${fs}px monospace`;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#64748b';
    ctx.fillText(`angle     ${angle}°`, W - PAD - bw + 10, PAD + fs + 8);
    ctx.fillStyle = accuracy >= 0.85 ? '#34d399' : accuracy >= 0.65 ? '#fb923c' : '#f87171';
    ctx.fillText(`accuracy  ${(accuracy * 100).toFixed(0)}%`, W - PAD - bw + 10, PAD + fs * 2 + 12);

    // Legend
    const lx = PAD + 6, lfs = Math.round(fs * 0.85);
    ctx.fillStyle = '#34d399'; ctx.beginPath(); ctx.arc(lx + 5, PAD + 10, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#475569'; ctx.font = `${lfs}px system-ui`; ctx.textAlign = 'left';
    ctx.fillText('class 1  ●', lx + 14, PAD + 14);
    ctx.fillStyle = '#fb923c'; ctx.fillRect(lx + 1, PAD + 22, 8, 8);
    ctx.fillStyle = '#475569'; ctx.fillText('class 0  ■', lx + 14, PAD + 30);
    ctx.fillStyle = '#f87171'; ctx.beginPath(); ctx.arc(lx + 5, PAD + 44, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#475569'; ctx.fillText('misclassified', lx + 14, PAD + 48);

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

  useEffect(() => { draw(); }, [angle, points]);

  return (
    <div className="not-prose my-8">
      <div className="rounded-2xl overflow-hidden border border-slate-700/50 bg-slate-950">
        <canvas ref={canvasRef} style={{ width: '100%', display: 'block' }} />
        <div className="px-5 py-4 border-t border-slate-800/80">
          <div className="flex justify-between items-baseline mb-1.5">
            <span className="text-xs text-slate-400 font-mono">boundary angle</span>
            <span className="text-xs font-mono text-slate-200">{angle}°</span>
          </div>
          <input
            type="range" min="0" max="179" step="1"
            value={angle}
            onChange={e => setAngle(parseInt(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
            style={{ accentColor: '#f8fafc' }}
          />
          <div className="flex justify-between mt-0.5 text-[10px] text-slate-600 font-mono">
            <span>horizontal</span><span>diagonal</span><span>vertical</span>
          </div>
        </div>
      </div>
    </div>
  );
}
