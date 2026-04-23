import React, { useRef, useEffect, useState, useCallback } from 'react';

// y = 2x dataset — true optimum at w = 2
const DATA = [
  { x: 1, y: 2.0 },
  { x: 2, y: 4.0 },
  { x: 3, y: 6.0 },
];

const W_MIN = -1.5;
const W_MAX = 5.5;
const W_START = -0.8;
const LOSS_RATIO = 0.48; // canvas height / width

function loss(w: number): number {
  return DATA.reduce((s, p) => s + (p.y - w * p.x) ** 2, 0) / DATA.length;
}

function grad(w: number): number {
  return DATA.reduce((s, p) => s + -2 * p.x * (p.y - w * p.x), 0) / DATA.length;
}

interface Props {
  label?: string;
}

export default function GradientDescentViz({ label = 'weight  w' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wRef = useRef(W_START);
  const historyRef = useRef<{ w: number; loss: number }[]>([{ w: W_START, loss: loss(W_START) }]);
  const stepRef = useRef(0);
  const lrRef = useRef(0.06);
  const runningRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef(0);

  const [lr, setLr] = useState(0.06);
  const [step, setStep] = useState(0);
  const [currentW, setCurrentW] = useState(W_START);
  const [running, setRunning] = useState(false);

  // Precompute loss curve
  const lossCurve = React.useMemo(() => {
    const pts: { w: number; l: number }[] = [];
    for (let i = 0; i <= 300; i++) {
      const w = W_MIN + (i / 300) * (W_MAX - W_MIN);
      pts.push({ w, l: loss(w) });
    }
    return pts;
  }, []);

  const maxL = lossCurve[0].l; // loss is highest at edges

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.offsetWidth;
    if (!cssW) return;
    const cssH = Math.round(cssW * LOSS_RATIO);

    if (canvas.width !== cssW * dpr || canvas.height !== cssH * dpr) {
      canvas.width = cssW * dpr;
      canvas.height = cssH * dpr;
      canvas.style.height = cssH + 'px';
    }

    const ctx = canvas.getContext('2d')!;
    ctx.save();
    ctx.scale(dpr, dpr);
    const W = cssW;
    const H = cssH;

    const PL = 52, PR = 18, PT = 26, PB = 42;
    const pw = W - PL - PR;
    const ph = H - PT - PB;

    // w-value → canvas x
    const wx = (v: number) => PL + ((v - W_MIN) / (W_MAX - W_MIN)) * pw;
    // loss-value → canvas y (clamp so runaway ball stays visible)
    const ly = (v: number) => PT + ph - Math.min((v / maxL), 1.05) * ph;

    // background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, W, H);

    // subtle grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let i = 1; i < 5; i++) {
      const x = PL + (i / 5) * pw;
      ctx.beginPath(); ctx.moveTo(x, PT); ctx.lineTo(x, PT + ph); ctx.stroke();
    }
    for (let i = 1; i < 4; i++) {
      const y = PT + (i / 4) * ph;
      ctx.beginPath(); ctx.moveTo(PL, y); ctx.lineTo(PL + pw, y); ctx.stroke();
    }

    // axes
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(PL, PT);
    ctx.lineTo(PL, PT + ph);
    ctx.lineTo(PL + pw, PT + ph);
    ctx.stroke();

    // axis labels
    ctx.fillStyle = '#475569';
    ctx.font = `${Math.round(W * 0.018)}px system-ui`;
    ctx.textAlign = 'center';
    ctx.fillText(label, PL + pw / 2, H - 6);
    ctx.save();
    ctx.translate(13, PT + ph / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('loss  J(w)', 0, 0);
    ctx.restore();

    // w tick labels
    const ticks = [-1, 0, 1, 2, 3, 4, 5];
    ticks.forEach(v => {
      if (v < W_MIN || v > W_MAX) return;
      ctx.fillStyle = '#334155';
      ctx.font = `${Math.round(W * 0.016)}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(String(v), wx(v), PT + ph + 14);
    });

    // optimum marker
    const optW = 2;
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(wx(optW), PT + 4);
    ctx.lineTo(wx(optW), PT + ph);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#22c55e';
    ctx.font = `${Math.round(W * 0.016)}px system-ui`;
    ctx.textAlign = 'center';
    ctx.fillText('minimum', wx(optW), PT - 8);

    // trail
    const hist = historyRef.current;
    if (hist.length > 1) {
      ctx.strokeStyle = 'rgba(129,140,248,0.5)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      hist.forEach((h, i) => {
        const x = wx(h.w);
        const y = ly(h.loss);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // loss curve
    const grad2 = ctx.createLinearGradient(PL, 0, PL + pw, 0);
    grad2.addColorStop(0, '#38bdf8');
    grad2.addColorStop(0.5, '#818cf8');
    grad2.addColorStop(1, '#38bdf8');
    ctx.strokeStyle = grad2;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    lossCurve.forEach((p, i) => {
      const x = wx(p.w);
      const y = ly(p.l);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // gradient arrow at ball
    const curW = wRef.current;
    const curL = loss(curW);
    const curG = grad(curW);
    const bx = wx(curW);
    const by = ly(curL);
    const arrowLen = Math.min(Math.abs(curG) * 3, 60);
    const arrowDir = curG > 0 ? -1 : 1; // negative gradient = step direction
    if (arrowLen > 4) {
      ctx.strokeStyle = 'rgba(248,113,113,0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + arrowDir * arrowLen, by);
      ctx.stroke();
      // arrowhead
      const tip = bx + arrowDir * arrowLen;
      ctx.fillStyle = 'rgba(248,113,113,0.7)';
      ctx.beginPath();
      ctx.moveTo(tip, by);
      ctx.lineTo(tip - arrowDir * 8, by - 5);
      ctx.lineTo(tip - arrowDir * 8, by + 5);
      ctx.closePath();
      ctx.fill();
    }

    // ball glow
    const grd = ctx.createRadialGradient(bx, by, 0, bx, by, 22);
    grd.addColorStop(0, 'rgba(251,146,60,0.5)');
    grd.addColorStop(1, 'rgba(251,146,60,0)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(bx, Math.max(PT + 8, Math.min(PT + ph - 4, by)), 22, 0, Math.PI * 2);
    ctx.fill();

    // ball
    ctx.fillStyle = '#fb923c';
    ctx.strokeStyle = '#fff8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(bx, Math.max(PT + 8, Math.min(PT + ph - 4, by)), 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // stats overlay
    const fs = Math.round(W * 0.017);
    const boxW = 138, boxH = 54;
    const box = W - PR - boxW, boy = PT + 4;
    ctx.fillStyle = 'rgba(2,6,23,0.82)';
    ctx.beginPath();
    ctx.roundRect(box, boy, boxW, boxH, 6);
    ctx.fill();
    ctx.font = `${fs}px monospace`;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#64748b';
    ctx.fillText(`step  ${stepRef.current}`, box + 10, boy + fs + 4);
    ctx.fillStyle = '#7dd3fc';
    ctx.fillText(`loss  ${curL.toFixed(3)}`, box + 10, boy + fs * 2 + 8);
    ctx.fillStyle = '#fb923c';
    ctx.fillText(`w     ${curW.toFixed(3)}`, box + 10, boy + fs * 3 + 12);

    ctx.restore();
  }

  // Resize observer for responsive canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => draw());
    ro.observe(canvas.parentElement!);
    draw();
    return () => ro.disconnect();
  }, []);

  // Redraw whenever state changes
  useEffect(() => { draw(); }, [currentW, step]);

  const doStep = useCallback(() => {
    const g = grad(wRef.current);
    const next = wRef.current - lrRef.current * g;
    wRef.current = next;
    stepRef.current += 1;
    historyRef.current = [...historyRef.current, { w: next, loss: loss(next) }];
    setCurrentW(next);
    setStep(s => s + 1);
  }, []);

  // Run loop
  useEffect(() => {
    if (!running) {
      cancelAnimationFrame(rafRef.current!);
      return;
    }
    lastTickRef.current = 0;
    const tick = (ts: number) => {
      if (ts - lastTickRef.current > 100) {
        doStep();
        lastTickRef.current = ts;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current!);
  }, [running, doStep]);

  function reset() {
    cancelAnimationFrame(rafRef.current!);
    runningRef.current = false;
    setRunning(false);
    wRef.current = W_START;
    stepRef.current = 0;
    historyRef.current = [{ w: W_START, loss: loss(W_START) }];
    setCurrentW(W_START);
    setStep(0);
  }

  const converged = Math.abs(grad(currentW)) < 0.01 && step > 0;

  return (
    <div className="not-prose my-8">
      <div className="rounded-2xl overflow-hidden border border-slate-700/50 bg-slate-950">
        <canvas ref={canvasRef} style={{ width: '100%', display: 'block' }} />

        <div className="px-5 py-4 border-t border-slate-800/80 flex flex-wrap items-center gap-5">
          {/* Learning rate slider */}
          <div className="flex-1 min-w-[200px]">
            <div className="flex justify-between items-baseline mb-1.5">
              <span className="text-xs text-slate-400 font-mono tracking-wide">learning rate  η</span>
              <span className="text-xs font-mono text-orange-400">{lr.toFixed(3)}</span>
            </div>
            <input
              type="range" min="0.005" max="0.30" step="0.005"
              value={lr}
              onChange={e => {
                const v = parseFloat(e.target.value);
                lrRef.current = v;
                setLr(v);
                reset();
              }}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
              style={{ accentColor: '#fb923c' }}
            />
            <div className="flex justify-between mt-1 text-[10px] text-slate-600 font-mono">
              <span>too slow</span>
              <span>converges</span>
              <span>overshoots</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => { runningRef.current = !running; setRunning(r => !r); }}
              disabled={converged}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                running
                  ? 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                  : converged
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-500'
              }`}
            >
              {running ? 'Pause' : converged ? 'Converged ✓' : 'Run'}
            </button>
            <button
              onClick={doStep}
              disabled={running || converged}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Step
            </button>
            <button
              onClick={reset}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-400 hover:bg-slate-700 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
