import React, { useState, useMemo, type CSSProperties } from 'react';
import styles from './styles.module.css';

// ── Types ─────────────────────────────────────────────────────────────────────

type Activation = 'sigmoid' | 'tanh' | 'relu' | 'leaky_relu';

// ── Math ──────────────────────────────────────────────────────────────────────

function seededRand(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function randn(rand: () => number): number {
  const u = Math.max(rand(), 1e-10);
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function deriv(act: Activation, z: number): number {
  switch (act) {
    case 'sigmoid': { const s = 1 / (1 + Math.exp(-z)); return s * (1 - s); }
    case 'tanh':    { const t = Math.tanh(z); return 1 - t * t; }
    case 'relu':    return z > 0 ? 1 : 0;
    case 'leaky_relu': return z > 0 ? 1 : 0.01;
  }
}

interface LayerData {
  gradient:   number;   // cumulative gradient magnitude at this layer
  multiplier: number;   // per-layer derivative average
}

function computeLayers(act: Activation, n: number): LayerData[] {
  const SAMPLE = 8;
  const seed = [...act].reduce((h, c) => (Math.imul(31, h) + c.charCodeAt(0)) | 0, 0) >>> 0;
  const rand  = seededRand((seed + n * 137) >>> 0);

  // Average |f'(z)| per layer, z sampled from N(0, 1.2)
  const mults = Array.from({ length: n }, () => {
    const zs = Array.from({ length: SAMPLE }, () => randn(rand) * 1.2);
    return zs.reduce((s, z) => s + deriv(act, z), 0) / SAMPLE;
  });

  // Gradient at output = 1.0; propagate backward
  const grads = new Array<number>(n);
  grads[n - 1] = 1.0;
  for (let i = n - 2; i >= 0; i--) grads[i] = grads[i + 1] * mults[i + 1];

  return mults.map((multiplier, i) => ({ gradient: grads[i], multiplier }));
}

// ── Visual helpers ────────────────────────────────────────────────────────────

function healthColor(g: number): string {
  if (g >= 0.1)   return '#10B981'; // green  — healthy
  if (g >= 0.01)  return '#F59E0B'; // amber  — fading
  if (g >= 0.001) return '#F97316'; // orange — weak
  return '#EF4444';                  // red    — vanished
}

function healthLabel(g: number): string {
  if (g >= 0.1)   return 'Healthy';
  if (g >= 0.01)  return 'Fading';
  if (g >= 0.001) return 'Weak';
  return 'Vanished';
}

function fmtGrad(g: number): string {
  if (g >= 0.01)     return g.toFixed(4);
  if (g >= 0.000001) return g.toExponential(2);
  return '≈ 0';
}

// Log-scale bar height: maps [10^-8 … 10^0] → [2% … 100%]
const LOG_MIN = -8;
const LOG_MAX =  0;
function logBarPct(g: number): number {
  const logG = Math.log10(Math.max(g, 1e-10));
  return Math.max(2, ((logG - LOG_MIN) / (LOG_MAX - LOG_MIN)) * 100);
}
function linBarPct(g: number): number {
  return Math.max(1, g * 100);
}

// ── Meta ──────────────────────────────────────────────────────────────────────

type ActivationMeta = {
  label:   string;
  formula: string;
  color:   string;
  insight: string;
};

const META: Record<Activation, ActivationMeta> = {
  sigmoid: {
    label:   'Sigmoid',
    formula: "σ'(z) = σ(z)(1−σ(z)) ≤ 0.25",
    color:   '#EF4444',
    insight: "Sigmoid clamps every derivative to at most 0.25. Across 10 layers that gives 0.25¹⁰ ≈ 0.000001 — one millionth of the original gradient. Early layers receive essentially zero signal and stop learning entirely. This is why sigmoids were abandoned for hidden layers.",
  },
  tanh: {
    label:   'Tanh',
    formula: "tanh'(z) = 1 − tanh²(z) ≤ 1.0",
    color:   '#F59E0B',
    insight: "Tanh is better than sigmoid — its derivative peaks at 1.0 at z = 0, so a centred network loses less gradient per layer. But for large |z|, tanh saturates just as badly. Deep tanh networks still vanish; the problem is deferred, not solved.",
  },
  relu: {
    label:   'ReLU',
    formula: "ReLU'(z) = 1  (z > 0),  0  (z ≤ 0)",
    color:   '#10B981',
    insight: "ReLU passes gradients through unchanged for every active neuron — derivative = 1, no saturation, no shrinking. This is why deep networks became reliably trainable after ~2012. The cost: neurons where z ≤ 0 permanently output 0 and receive no gradient update (dead neurons).",
  },
  leaky_relu: {
    label:   'Leaky ReLU',
    formula: "f'(z) = 1  (z > 0),  α = 0.01  (z ≤ 0)",
    color:   '#3B82F6',
    insight: "Leaky ReLU fixes the dead-neuron problem by giving negative inputs a tiny gradient (α = 0.01) instead of zero. Nearly perfect gradient flow in both directions. It is the preferred default in very deep architectures where dead neurons would be catastrophic.",
  },
};

const ACTIVATIONS = Object.keys(META) as Activation[];
const NODES_PER_LAYER = 3;

// ── Component ─────────────────────────────────────────────────────────────────

export default function VanishingGradient() {
  const [act,         setAct]         = useState<Activation>('sigmoid');
  const [numLayers,   setNumLayers]   = useState(8);
  const [logScale,    setLogScale]    = useState(true);
  const [hoveredIdx,  setHoveredIdx]  = useState<number | null>(null);

  const layers = useMemo(() => computeLayers(act, numLayers), [act, numLayers]);
  const meta   = META[act];

  return (
    <div className={styles.root}>

      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <span className={styles.titleIcon} aria-hidden="true">↩</span>
          <span className={styles.title}>Vanishing Gradient</span>
        </div>
        <p className={styles.subtitle}>
          During backpropagation every gradient is multiplied by the activation's derivative.
          See what that does layer by layer.
        </p>
      </div>

      {/* ── Activation selector ── */}
      <div className={styles.tabRow}>
        {ACTIVATIONS.map(a => (
          <button
            key={a}
            className={`${styles.tab} ${act === a ? styles.tabActive : ''}`}
            style={act === a ? { background: META[a].color, borderColor: META[a].color } : undefined}
            onClick={() => setAct(a)}
          >
            {META[a].label}
          </button>
        ))}
        <code className={styles.formula}>{meta.formula}</code>
      </div>

      {/* ── Direction strip ── */}
      <div className={styles.dirStrip}>
        <span className={styles.dirLeft}>← Backpropagation flows this way (input layers)</span>
        <span className={styles.dirRight} style={{ color: '#10B981' }}>Output ∇ = 1.0 →</span>
      </div>

      {/* ── Columns: nodes + bar + label ── */}
      <div
        className={styles.grid}
        style={{ '--n': numLayers } as CSSProperties}
      >
        {layers.map((layer, i) => {
          const { gradient: g, multiplier: m } = layer;
          const color   = healthColor(g);
          const barPct  = logScale ? logBarPct(g) : linBarPct(g);
          const isLast  = i === numLayers - 1;
          // Node opacity: map gradient to [0.06, 1.0]
          const nOpacity = Math.max(0.06, Math.min(1,
            g >= 0.1   ? 1 :
            g >= 0.01  ? 0.4 + g * 4 :
            g >= 0.001 ? 0.15 + g * 40 :
                         g * 150
          ));

          return (
            <div
              key={i}
              className={`${styles.col} ${hoveredIdx === i ? styles.colHovered : ''}`}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Hover card */}
              {hoveredIdx === i && (
                <div className={styles.hoverCard}>
                  <span className={styles.hoverVal} style={{ color }}>{fmtGrad(g)}</span>
                  <span className={styles.hoverStatus} style={{ color }}>{healthLabel(g)}</span>
                  <span className={styles.hoverMult}>×{m.toFixed(3)} / layer</span>
                </div>
              )}

              {/* Nodes */}
              <div className={styles.nodes}>
                {Array.from({ length: NODES_PER_LAYER }, (_, ni) => (
                  <div
                    key={ni}
                    className={styles.node}
                    style={{
                      backgroundColor: color,
                      opacity: nOpacity,
                      boxShadow: nOpacity > 0.45 ? `0 0 7px ${color}99` : 'none',
                    }}
                  />
                ))}
              </div>

              {/* Bar */}
              <div className={styles.barTrack}>
                <div
                  className={styles.barFill}
                  style={{ height: `${barPct.toFixed(1)}%`, backgroundColor: color }}
                />
              </div>

              {/* Label */}
              <div className={`${styles.lbl} ${isLast ? styles.lblOut : ''}`}>
                {isLast ? 'Out' : `L${i + 1}`}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Scale toggle + y-axis hint ── */}
      <div className={styles.scaleRow}>
        <span className={styles.scaleHint}>
          |∇| {logScale ? '(log scale — each step = ×10)' : '(linear scale)'}
        </span>
        <button className={styles.scaleBtn} onClick={() => setLogScale(s => !s)}>
          {logScale ? 'Linear scale' : 'Log scale'}
        </button>
      </div>

      {/* ── Layer slider ── */}
      <div className={styles.sliderRow}>
        <span className={styles.sliderLbl}>Depth</span>
        <input
          type="range"
          min={3}
          max={12}
          value={numLayers}
          className={styles.slider}
          onChange={e => setNumLayers(Number(e.target.value))}
        />
        <span className={styles.sliderVal}>{numLayers} layers</span>
      </div>

      {/* ── Insight card ── */}
      <div className={styles.insight} style={{ borderLeftColor: meta.color }}>
        <span className={styles.insightBulb} aria-hidden="true">💡</span>
        <p className={styles.insightText}>{meta.insight}</p>
      </div>

    </div>
  );
}
