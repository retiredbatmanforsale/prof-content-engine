import React, { useRef, useEffect, useState, useMemo } from 'react';

// Fixed weights for a 3→4→2 network
const W1 = [
  [ 0.5, -0.3,  0.8],
  [-0.6,  0.7, -0.2],
  [ 0.3,  0.5,  0.6],
  [-0.4, -0.7,  0.5],
];
const B1 = [0.1, -0.2, 0.3, -0.1];
const W2 = [
  [ 0.6,  0.3, -0.5,  0.8],
  [-0.4,  0.7,  0.6, -0.3],
];
const B2 = [0.2, -0.1];

const MAX_W = 0.8; // for edge opacity normalisation
const RATIO = 0.52;

function sigmoid(x: number) { return 1 / (1 + Math.exp(-x)); }

function forward(x: number[]) {
  const z1 = W1.map((row, i) => row.reduce((s, w, j) => s + w * x[j], 0) + B1[i]);
  const a1 = z1.map(sigmoid);
  const z2 = W2.map((row, i) => row.reduce((s, w, j) => s + w * a1[j], 0) + B2[i]);
  const a2 = z2.map(sigmoid);
  return { z1, a1, z2, a2 };
}

function lerpColor(
  from: [number, number, number],
  to: [number, number, number],
  t: number
): string {
  const r = Math.round(from[0] + (to[0] - from[0]) * t);
  const g = Math.round(from[1] + (to[1] - from[1]) * t);
  const b = Math.round(from[2] + (to[2] - from[2]) * t);
  return `rgb(${r},${g},${b})`;
}

const DARK: [number, number, number] = [15, 23, 42];
const INPUT_C: [number, number, number] = [14, 165, 233];   // sky
const HIDDEN_C: [number, number, number] = [139, 92, 246];  // violet
const OUTPUT_C: [number, number, number] = [16, 185, 129];  // emerald

export default function NeuralNetForwardViz() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [inputs, setInputs] = useState([0.5, 0.5, 0.5]);

  const { a1, a2, z1, z2 } = useMemo(() => forward(inputs), [inputs]);

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

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, W, H);

    const R = Math.min(W * 0.045, H * 0.085, 26);
    const fs = Math.round(R * 0.52);

    // Layer x positions
    const lx = [W * 0.13, W * 0.50, W * 0.87];

    // Neuron y positions
    function neuronY(layer: number, idx: number): number {
      const counts = [3, 4, 2];
      const n = counts[layer];
      const spacing = Math.min(H * 0.22, (H - R * 4) / (n - 1 + 1));
      const totalH = spacing * (n - 1);
      return H / 2 - totalH / 2 + idx * spacing;
    }

    // Layer labels
    const layerLabels = ['Input', 'Hidden', 'Output'];
    const layerColors = [INPUT_C, HIDDEN_C, OUTPUT_C];
    layerLabels.forEach((label, li) => {
      ctx.fillStyle = `rgb(${layerColors[li].join(',')})`;
      ctx.font = `bold ${Math.round(fs * 0.85)}px system-ui`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.globalAlpha = 0.7;
      ctx.fillText(label, lx[li], 10);
      ctx.globalAlpha = 1;
    });

    // Layer→layer arrows label
    const arrowY = H - 14;
    ctx.fillStyle = '#1e293b';
    ctx.font = `${Math.round(fs * 0.8)}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('W₁x + b₁ → σ', (lx[0] + lx[1]) / 2, arrowY);
    ctx.fillText('W₂a + b₂ → σ', (lx[1] + lx[2]) / 2, arrowY);

    // Draw edges (W1: input→hidden)
    for (let h = 0; h < 4; h++) {
      for (let i = 0; i < 3; i++) {
        const w = W1[h][i];
        const opacity = 0.1 + (Math.abs(w) / MAX_W) * 0.6;
        const col = w >= 0
          ? `rgba(56,189,248,${opacity})`   // positive: sky
          : `rgba(248,113,113,${opacity})`;  // negative: red
        ctx.strokeStyle = col;
        ctx.lineWidth = 0.5 + (Math.abs(w) / MAX_W) * 2;
        ctx.beginPath();
        ctx.moveTo(lx[0], neuronY(0, i));
        ctx.lineTo(lx[1], neuronY(1, h));
        ctx.stroke();
      }
    }

    // Draw edges (W2: hidden→output)
    for (let o = 0; o < 2; o++) {
      for (let h = 0; h < 4; h++) {
        const w = W2[o][h];
        const opacity = 0.1 + (Math.abs(w) / MAX_W) * 0.6;
        const col = w >= 0
          ? `rgba(56,189,248,${opacity})`
          : `rgba(248,113,113,${opacity})`;
        ctx.strokeStyle = col;
        ctx.lineWidth = 0.5 + (Math.abs(w) / MAX_W) * 2;
        ctx.beginPath();
        ctx.moveTo(lx[1], neuronY(1, h));
        ctx.lineTo(lx[2], neuronY(2, o));
        ctx.stroke();
      }
    }

    // Draw neurons helper
    function drawNeuron(
      x: number, y: number, val: number,
      colorBase: [number, number, number],
      labelTop: string, labelBot: string
    ) {
      // Fill: interpolate from dark to color
      ctx.fillStyle = lerpColor(DARK, colorBase, val);
      ctx.strokeStyle = `rgba(${colorBase.join(',')}, 0.6)`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, y, R, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Value inside
      ctx.fillStyle = val > 0.45 ? '#fff' : `rgba(${colorBase.join(',')},0.8)`;
      ctx.font = `bold ${fs}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(val.toFixed(2), x, y);

      // Label above/below
      ctx.fillStyle = `rgba(${colorBase.join(',')}, 0.6)`;
      ctx.font = `${Math.round(fs * 0.85)}px system-ui`;
      ctx.textBaseline = 'bottom';
      ctx.fillText(labelTop, x, y - R - 3);
      ctx.textBaseline = 'top';
      ctx.fillStyle = '#334155';
      ctx.font = `${Math.round(fs * 0.75)}px monospace`;
      ctx.fillText(labelBot, x, y + R + 3);
    }

    // Input neurons
    inputs.forEach((v, i) => {
      drawNeuron(lx[0], neuronY(0, i), v, INPUT_C, `x${i + 1}`, v.toFixed(2));
    });

    // Hidden neurons
    a1.forEach((v, i) => {
      drawNeuron(lx[1], neuronY(1, i), v, HIDDEN_C, `a${i + 1}`, `z=${z1[i].toFixed(2)}`);
    });

    // Output neurons
    a2.forEach((v, i) => {
      drawNeuron(lx[2], neuronY(2, i), v, OUTPUT_C, `ŷ${i + 1}`, v.toFixed(2));
    });

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

  useEffect(() => { draw(); }, [inputs, a1, a2]);

  function setInput(i: number, v: number) {
    setInputs(prev => prev.map((x, j) => (j === i ? v : x)));
  }

  return (
    <div className="not-prose my-8">
      <div className="rounded-2xl overflow-hidden border border-slate-700/50 bg-slate-950">
        <canvas ref={canvasRef} style={{ width: '100%', display: 'block' }} />

        <div className="px-5 py-4 border-t border-slate-800/80 grid gap-3 sm:grid-cols-3">
          {inputs.map((v, i) => (
            <div key={i}>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs font-mono text-sky-400">x{i + 1}</span>
                <span className="text-xs font-mono text-slate-400">{v.toFixed(2)}</span>
              </div>
              <input
                type="range" min="0" max="1" step="0.01"
                value={v}
                onChange={e => setInput(i, parseFloat(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: '#0ea5e9' }}
              />
            </div>
          ))}
        </div>

        <div className="px-5 pb-3 grid grid-cols-2 gap-3 text-xs font-mono border-t border-slate-800/50">
          {a2.map((v, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-emerald-400">ŷ{i + 1}</span>
              <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-150"
                  style={{ width: `${v * 100}%` }}
                />
              </div>
              <span className="text-slate-400 w-10 text-right">{(v * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
