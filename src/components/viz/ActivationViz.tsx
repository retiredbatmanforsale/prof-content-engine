import React, { useRef, useEffect, useState } from 'react';

type Fn = 'sigmoid' | 'relu' | 'tanh';

const FN_META: Record<Fn, { label: string; color: string; formula: string }> = {
  sigmoid: { label: 'σ(z)',  color: '#818cf8', formula: 'σ(z) = 1 / (1 + e⁻ᶻ)' },
  relu:    { label: 'ReLU(z)', color: '#34d399', formula: 'ReLU(z) = max(0, z)' },
  tanh:    { label: 'tanh(z)', color: '#fb923c', formula: 'tanh(z) = (eᶻ − e⁻ᶻ) / (eᶻ + e⁻ᶻ)' },
};

function apply(fn: Fn, z: number): number {
  switch (fn) {
    case 'sigmoid': return 1 / (1 + Math.exp(-z));
    case 'relu':    return Math.max(0, z);
    case 'tanh':    return Math.tanh(z);
  }
}

function derivative(fn: Fn, z: number): number {
  switch (fn) {
    case 'sigmoid': { const s = apply('sigmoid', z); return s * (1 - s); }
    case 'relu':    return z > 0 ? 1 : 0;
    case 'tanh':    { const t = Math.tanh(z); return 1 - t * t; }
  }
}

const Z_MIN = -5;
const Z_MAX = 5;
const RATIO = 0.46;

interface Props {
  fn?: Fn;
}

export default function ActivationViz({ fn: fnProp = 'sigmoid' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fn, setFn] = useState<Fn>(fnProp);
  const [z, setZ] = useState(0);

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.offsetWidth;
    if (!cssW) return;
    const cssH = Math.round(cssW * RATIO);

    if (canvas.width !== cssW * dpr || canvas.height !== cssH * dpr) {
      canvas.width = cssW * dpr;
      canvas.height = cssH * dpr;
      canvas.style.height = cssH + 'px';
    }

    const ctx = canvas.getContext('2d')!;
    ctx.save();
    ctx.scale(dpr, dpr);
    const W = cssW, H = cssH;

    const PL = 50, PR = 20, PT = 28, PB = 40;
    const pw = W - PL - PR;
    const ph = H - PT - PB;

    // Y range: sigmoid/relu 0..1, tanh -1..1, show with padding
    const yMin = fn === 'relu' ? -0.2 : fn === 'sigmoid' ? -0.15 : -1.3;
    const yMax = fn === 'relu' ? 1.2  : fn === 'sigmoid' ?  1.15 :  1.3;

    const zx = (v: number) => PL + ((v - Z_MIN) / (Z_MAX - Z_MIN)) * pw;
    const fy = (v: number) => PT + ph - ((v - yMin) / (yMax - yMin)) * ph;

    const meta = FN_META[fn];

    // Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let i = -4; i <= 4; i++) {
      const x = zx(i);
      if (x < PL || x > PL + pw) continue;
      ctx.beginPath(); ctx.moveTo(x, PT); ctx.lineTo(x, PT + ph); ctx.stroke();
    }
    [-1, -0.5, 0, 0.5, 1].forEach(v => {
      const y = fy(v);
      if (y < PT || y > PT + ph) return;
      ctx.beginPath(); ctx.moveTo(PL, y); ctx.lineTo(PL + pw, y); ctx.stroke();
    });

    // Axes
    const zeroY = fy(0);
    const zeroX = zx(0);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(PL, zeroY); ctx.lineTo(PL + pw, zeroY); // x-axis
    ctx.moveTo(zeroX, PT); ctx.lineTo(zeroX, PT + ph); // y-axis
    ctx.stroke();

    // axis labels
    const fs = Math.round(W * 0.018);
    ctx.fillStyle = '#475569';
    ctx.font = `${fs}px system-ui`;
    ctx.textAlign = 'center';
    ctx.fillText('input  z', PL + pw / 2, H - 6);
    ctx.save();
    ctx.translate(13, PT + ph / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(meta.label, 0, 0);
    ctx.restore();

    // z tick labels
    [-4, -2, 0, 2, 4].forEach(v => {
      ctx.fillStyle = '#334155';
      ctx.font = `${Math.round(W * 0.016)}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(String(v), zx(v), PT + ph + 14);
    });
    // y tick labels
    const yTicks = fn === 'tanh' ? [-1, 0, 1] : [0, 0.5, 1];
    yTicks.forEach(v => {
      const y = fy(v);
      if (y < PT || y > PT + ph) return;
      ctx.fillStyle = '#334155';
      ctx.font = `${Math.round(W * 0.016)}px monospace`;
      ctx.textAlign = 'right';
      ctx.fillText(String(v), PL - 6, y + 4);
    });

    // Tangent line at current z (shows gradient)
    const curZ = z;
    const curY = apply(fn, curZ);
    const curD = derivative(fn, curZ);
    const tangentHalf = 1.5;
    const tx1 = zx(curZ - tangentHalf);
    const ty1 = fy(curY - curD * tangentHalf);
    const tx2 = zx(curZ + tangentHalf);
    const ty2 = fy(curY + curD * tangentHalf);
    ctx.strokeStyle = 'rgba(251,146,60,0.35)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(tx1, ty1);
    ctx.lineTo(tx2, ty2);
    ctx.stroke();
    ctx.setLineDash([]);

    // drop lines from point to axes
    const px = zx(curZ);
    const py = fy(curY);
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(px, py); ctx.lineTo(px, fy(0));
    ctx.moveTo(px, py); ctx.lineTo(zx(Z_MIN), py);
    ctx.stroke();
    ctx.setLineDash([]);

    // function curve
    ctx.strokeStyle = meta.color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    const steps = 400;
    for (let i = 0; i <= steps; i++) {
      const zv = Z_MIN + (i / steps) * (Z_MAX - Z_MIN);
      const yv = apply(fn, zv);
      const x = zx(zv);
      const y = fy(yv);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // point glow
    const grd = ctx.createRadialGradient(px, py, 0, px, py, 20);
    grd.addColorStop(0, meta.color + '55');
    grd.addColorStop(1, meta.color + '00');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(px, py, 20, 0, Math.PI * 2);
    ctx.fill();

    // point
    ctx.fillStyle = meta.color;
    ctx.strokeStyle = '#ffffff99';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(px, py, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // stats overlay
    const boxW = 158, boxH = 66;
    const bx = W - PR - boxW, by = PT + 4;
    ctx.fillStyle = 'rgba(2,6,23,0.85)';
    ctx.beginPath();
    ctx.roundRect(bx, by, boxW, boxH, 6);
    ctx.fill();
    ctx.font = `${fs}px monospace`;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#64748b';
    ctx.fillText(`z       ${curZ.toFixed(2)}`, bx + 10, by + fs + 4);
    ctx.fillStyle = meta.color;
    ctx.fillText(`f(z)    ${curY.toFixed(4)}`, bx + 10, by + fs * 2 + 8);
    ctx.fillStyle = '#f472b6';
    ctx.fillText(`f ′(z)  ${curD.toFixed(4)}`, bx + 10, by + fs * 3 + 12);

    // gradient note for sigmoid (vanishing gradient story)
    if (fn === 'sigmoid' && (Math.abs(curZ) > 2.5)) {
      ctx.fillStyle = 'rgba(251,113,133,0.85)';
      ctx.font = `${Math.round(W * 0.015)}px system-ui`;
      ctx.textAlign = 'center';
      ctx.fillText('gradient ≈ 0  ←  vanishing', PL + pw / 2, PT + ph + 30);
    }

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

  useEffect(() => { draw(); }, [fn, z]);

  return (
    <div className="not-prose my-8">
      <div className="rounded-2xl overflow-hidden border border-slate-700/50 bg-slate-950">
        {/* Function selector */}
        <div className="flex gap-2 px-5 pt-4 pb-0">
          {(['sigmoid', 'relu', 'tanh'] as Fn[]).map(f => (
            <button
              key={f}
              onClick={() => setFn(f)}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-colors ${
                fn === f
                  ? 'text-slate-900'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
              style={fn === f ? { backgroundColor: FN_META[f].color } : {}}
            >
              {FN_META[f].label}
            </button>
          ))}
          <span className="ml-auto text-xs text-slate-600 font-mono self-center">
            {FN_META[fn].formula}
          </span>
        </div>

        <canvas ref={canvasRef} style={{ width: '100%', display: 'block', marginTop: 12 }} />

        {/* z slider */}
        <div className="px-5 pb-4 pt-3 border-t border-slate-800/80">
          <div className="flex justify-between items-baseline mb-1.5">
            <span className="text-xs text-slate-400 font-mono">input  z</span>
            <span className="text-xs font-mono" style={{ color: FN_META[fn].color }}>
              {z.toFixed(2)}  →  {apply(fn, z).toFixed(4)}
            </span>
          </div>
          <input
            type="range" min={Z_MIN} max={Z_MAX} step="0.05"
            value={z}
            onChange={e => setZ(parseFloat(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
            style={{ accentColor: FN_META[fn].color }}
          />
          <div className="flex justify-between mt-0.5 text-[10px] text-slate-600 font-mono">
            <span>−5</span><span>0</span><span>+5</span>
          </div>
        </div>
      </div>
    </div>
  );
}
