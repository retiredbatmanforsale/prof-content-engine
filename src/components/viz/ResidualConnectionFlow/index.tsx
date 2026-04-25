import React, { useState, useMemo } from 'react';
import styles from './styles.module.css';

// ── Constants ─────────────────────────────────────────────────────────────────

const NUM_LAYERS = 6;

// Sublayer Jacobian magnitudes (fixed per block). ~0.20 ≈ a partially saturating
// sigmoid-like nonlinearity — realistic, gives dramatic contrast between modes.
const JACOBIANS = [0.18, 0.22, 0.20, 0.19, 0.21, 0.20];

type Mode = 'no-skip' | 'with-skip';

// ── Math ──────────────────────────────────────────────────────────────────────

// grads[i] = gradient block i transmits to its left neighbour during backprop.
// Gradient starts at 1.0 leaving the output; each block multiplies by its factor.
//   no-skip:   factor = Jₗ           (only sublayer path, easily small)
//   with-skip: factor = 1 + Jₗ       (+1 from identity path — the highway)
function computeGradients(mode: Mode): number[] {
  const factor = (i: number) =>
    mode === 'no-skip' ? JACOBIANS[i] : 1 + JACOBIANS[i];

  const g = new Array<number>(NUM_LAYERS);
  g[NUM_LAYERS - 1] = 1.0 * factor(NUM_LAYERS - 1);
  for (let i = NUM_LAYERS - 2; i >= 0; i--) {
    g[i] = g[i + 1] * factor(i);
  }
  return g;
}

// ── Visual helpers ────────────────────────────────────────────────────────────

function gradColor(g: number): string {
  if (g >= 0.1) return '#10B981';
  if (g >= 0.01) return '#F59E0B';
  if (g >= 0.001) return '#F97316';
  return '#EF4444';
}

function gradHealthLabel(g: number): string {
  if (g >= 0.1) return 'Healthy';
  if (g >= 0.01) return 'Fading';
  if (g >= 0.001) return 'Weak';
  return 'Vanished';
}

function fmtGrad(g: number): string {
  if (g >= 0.01) return g.toFixed(3);
  if (g >= 1e-6) return g.toExponential(2);
  return '≈ 0';
}

// Log scale: maps [10⁻⁵ … 10¹] → [2% … 100%]
const L_MIN = -5, L_MAX = 1;
function barPct(g: number): number {
  const v = Math.max(L_MIN, Math.min(L_MAX, Math.log10(Math.max(g, 1e-8))));
  return Math.max(2, ((v - L_MIN) / (L_MAX - L_MIN)) * 100);
}

// ── Insight text ──────────────────────────────────────────────────────────────

const INSIGHTS: Record<Mode, string> = {
  'no-skip':
    'Without skip connections, ∂L/∂xₗ = ∂L/∂xₗ₊₁ · Jₗ. Each sublayer here attenuates by ~5×. Across six blocks that compounds to 0.2⁶ ≈ 0.000064 — the input-side layers receive almost zero gradient and stop learning. This is the vanishing gradient problem applied directly to a transformer stack.',
  'with-skip':
    'With skip connections, ∂L/∂xₗ = ∂L/∂xₗ₊₁ · (1 + Jₗ). The identity path contributes +1 to the Jacobian — even if the sublayer saturates (Jₗ → 0), the gradient is still ≈ ∂L/∂xₗ₊₁. Here it grows gently (~1.2× per block), meaning early layers receive the strongest signal. Layer normalization (next lesson) bounds this growth and together they make 12-, 24-, even 96-layer transformers reliably trainable.',
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function ResidualConnectionFlow() {
  const [mode, setMode]     = useState<Mode>('no-skip');
  const [hovered, setHover] = useState<number | null>(null);
  const grads   = useMemo(() => computeGradients(mode), [mode]);
  const withSkip = mode === 'with-skip';

  return (
    <div className={styles.root}>

      {/* ── Header ────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <span className={styles.titleIcon} aria-hidden>⊕</span>
          <span className={styles.title}>Residual Connection Flow</span>
        </div>
        <p className={styles.subtitle}>
          Toggle the skip connection and watch how the gradient magnitude changes
          at each transformer block during backpropagation.
        </p>
      </div>

      {/* ── Mode toggle ───────────────────────────────────────────── */}
      <div className={styles.tabRow}>
        <button
          className={styles.tab}
          style={!withSkip ? { background: '#EF4444', borderColor: '#EF4444', color: '#fff' } : undefined}
          onClick={() => setMode('no-skip')}
        >
          Without skip connections
        </button>
        <button
          className={styles.tab}
          style={withSkip ? { background: '#10B981', borderColor: '#10B981', color: '#fff' } : undefined}
          onClick={() => setMode('with-skip')}
        >
          With skip connections
        </button>
      </div>

      {/* ── Skip path visual strip ────────────────────────────────── */}
      <div className={`${styles.skipStrip} ${withSkip ? styles.skipOn : styles.skipOff}`}>
        <span aria-hidden>→</span>
        <span className={styles.skipText}>
          {withSkip
            ? 'identity path  ·  x bypasses each sublayer  ·  added at ⊕'
            : 'no skip — gradient must thread through every sublayer Jacobian'}
        </span>
        <span aria-hidden>→</span>
      </div>

      {/* ── Scrollable block row ──────────────────────────────────── */}
      <div className={styles.scroll}>
        <div className={styles.row}>

          {/* Input node */}
          <div className={styles.endpoint}>
            <div className={styles.endCircle} style={{ borderColor: gradColor(grads[0]) }}>x</div>
            <div className={styles.endLbl}>Input</div>
          </div>

          {grads.map((g, i) => (
            <React.Fragment key={i}>

              {/* Arrow connector */}
              <div className={styles.arrow} aria-hidden>›</div>

              {/* Block column */}
              <div
                className={styles.block}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              >
                {/* Hover card */}
                {hovered === i && (
                  <div className={styles.hoverCard}>
                    <span className={styles.hoverVal} style={{ color: gradColor(g) }}>{fmtGrad(g)}</span>
                    <span className={styles.hoverStatus} style={{ color: gradColor(g) }}>{gradHealthLabel(g)}</span>
                    <span className={styles.hoverJ}>J = {JACOBIANS[i].toFixed(2)}</span>
                  </div>
                )}

                {/* Add gate */}
                <div
                  className={styles.gate}
                  style={{
                    borderColor: withSkip ? '#10B981' : '#d4d4d4',
                    color:       withSkip ? '#10B981' : '#a3a3a3',
                  }}
                >
                  ⊕
                </div>

                {/* Sublayer box */}
                <div className={styles.sublayer}>
                  <span className={styles.sublayerLbl}>Sublayer</span>
                  <span className={styles.sublayerJ}>J = {JACOBIANS[i].toFixed(2)}</span>
                </div>

                {/* Gradient bar */}
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{ height: `${barPct(g).toFixed(1)}%`, backgroundColor: gradColor(g) }}
                  />
                </div>

                <div className={styles.gradVal} style={{ color: gradColor(g) }}>{fmtGrad(g)}</div>
                <div className={styles.gradStatus} style={{ color: gradColor(g) }}>{gradHealthLabel(g)}</div>
                <div className={styles.layerLbl}>L{i + 1}</div>
              </div>

            </React.Fragment>
          ))}

          {/* Arrow to output */}
          <div className={styles.arrow} aria-hidden>›</div>

          {/* Output node */}
          <div className={styles.endpoint}>
            <div className={styles.endCircle} style={{ borderColor: '#10B981' }}>y</div>
            <div className={styles.endLbl}>Output</div>
            <div className={styles.outGrad}>∂L = 1.0</div>
          </div>

        </div>
      </div>

      {/* ── Direction label ───────────────────────────────────────── */}
      <div className={styles.bwdDir}>← Gradient backpropagates this way</div>

      {/* ── Formula strip ─────────────────────────────────────────── */}
      <div className={styles.formulaRow}>
        <code className={styles.formula}>
          {withSkip
            ? '∂L/∂xₗ  =  ∂L/∂xₗ₊₁  ·  (1 + Jₗ)'
            : '∂L/∂xₗ  =  ∂L/∂xₗ₊₁  ·  Jₗ'}
        </code>
        <span className={styles.formulaNote}>
          {withSkip
            ? '← +1 from identity = gradient highway'
            : '← small Jₗ → vanishing gradient'}
        </span>
      </div>

      {/* ── Insight card ──────────────────────────────────────────── */}
      <div
        className={styles.insight}
        style={{ borderLeftColor: withSkip ? '#10B981' : '#EF4444' }}
      >
        <span className={styles.insightBulb} aria-hidden>💡</span>
        <p className={styles.insightText}>{INSIGHTS[mode]}</p>
      </div>

    </div>
  );
}
