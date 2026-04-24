import React, { useState, useMemo, Fragment, type CSSProperties } from 'react';
import styles from './styles.module.css';

// ── Math ─────────────────────────────────────────────────────────────────────

function softmax(xs: number[]): number[] {
  const finite = xs.filter(isFinite);
  if (finite.length === 0) return xs.map(() => 0);
  const max = Math.max(...finite);
  const exp = xs.map(x => (isFinite(x) ? Math.exp(x - max) : 0));
  const sum = exp.reduce((a, b) => a + b, 0);
  return sum === 0 ? exp : exp.map(e => e / sum);
}

function seededRand(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function tokenSeed(tokens: string[]): number {
  return (
    tokens
      .join('|')
      .split('')
      .reduce((h, c) => (Math.imul(31, h) + c.charCodeAt(0)) | 0, 0) >>> 0
  );
}

interface Scores {
  masked: number[][];
  full: number[][];
}

function buildScores(tokens: string[]): Scores {
  const n = tokens.length;
  const rand = seededRand(tokenSeed(tokens));

  // Logits: slight self-attention and previous-token bias for realism
  const logits: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => {
      const base = rand() * 4 - 2;
      const self = i === j ? 2.2 : 0;
      const prev = j === i - 1 ? 1.1 : 0;
      return base + self + prev;
    })
  );

  // Full attention — no mask, softmax over all n positions per row
  const full: number[][] = logits.map(row => softmax(row));

  // Causal (masked) attention — upper triangle → −∞, then softmax
  const masked: number[][] = logits.map((row, i) => {
    const clamped = row.map((v, j) => (j > i ? -Infinity : v));
    const sm = softmax(clamped);
    return sm.map((v, j) => (j > i ? 0 : v)); // enforce hard 0 for masked
  });

  return { masked, full };
}

// ── Colour ───────────────────────────────────────────────────────────────────

function allowedCellStyle(score: number, ring: boolean): CSSProperties {
  // Map score to coral opacity: 0 → 0.07, 1 → 0.93
  const alpha = score * 0.86 + 0.07;
  return {
    backgroundColor: `rgba(255, 107, 107, ${alpha.toFixed(3)})`,
    color: score >= 0.32 ? '#fff' : '#9b1c1c',
    outline: ring ? '2.5px solid #FF6B6B' : undefined,
    outlineOffset: ring ? '-2.5px' : undefined,
  };
}

// ── Presets ───────────────────────────────────────────────────────────────────

const PRESETS: { label: string; tokens: string[] }[] = [
  { label: 'The cat sat on mat', tokens: ['The', 'cat', 'sat', 'on', 'mat'] },
  { label: 'The paper title',    tokens: ['Attention', 'is', 'all', 'you', 'need'] },
  { label: 'GPT reads left→right', tokens: ['GPT', 'reads', 'left', 'to', 'right'] },
  { label: '4 tokens',           tokens: ['I', 'love', 'deep', 'learning'] },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function CausalMask() {
  const [presetIdx, setPresetIdx] = useState(0);
  const [masked, setMasked] = useState(true);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  const { tokens } = PRESETS[presetIdx];
  const n = tokens.length;
  const scores = useMemo(() => buildScores(tokens), [tokens]);
  const grid = masked ? scores.masked : scores.full;

  return (
    <div className={styles.root}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <div>
          <div className={styles.titleRow}>
            <span className={styles.titleIcon}>▦</span>
            <span className={styles.title}>Causal Self-Attention Mask</span>
          </div>
          <p className={styles.subtitle}>
            Each <strong>row</strong> is a query token. Coloured cells = positions it can attend to.
            Dark cells = future tokens, blocked.
          </p>
        </div>
        <div className={styles.presets}>
          {PRESETS.map((p, i) => (
            <button
              key={i}
              className={`${styles.presetBtn} ${presetIdx === i ? styles.presetActive : ''}`}
              onClick={() => { setPresetIdx(i); setHoveredRow(null); }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Body: matrix + info panel ── */}
      <div className={styles.body}>
        {/* Matrix */}
        <div className={styles.matrixSection}>
          <div className={styles.axisLabel}>Keys →</div>
          <div
            className={styles.grid}
            style={{ '--n': n, '--cols': `64px repeat(${n}, 1fr)` } as CSSProperties}
          >
            {/* Column header row */}
            <div className={styles.corner}>Q \ K</div>
            {tokens.map((tok, j) => (
              <div
                key={j}
                className={`${styles.colHeader} ${hoveredRow !== null && j <= hoveredRow ? styles.colHeaderLit : ''}`}
              >
                {tok}
              </div>
            ))}

            {/* Data rows */}
            {tokens.map((tok, i) => (
              <Fragment key={i}>
                <div
                  className={`${styles.rowLabel} ${hoveredRow === i ? styles.rowLabelActive : ''}`}
                  onMouseEnter={() => setHoveredRow(i)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  {tok}
                </div>
                {tokens.map((_, j) => {
                  const isMaskedCell = masked && j > i;
                  const score = grid[i]?.[j] ?? 0;
                  const isRowHovered = hoveredRow === i;
                  const isSelf = i === j;

                  return (
                    <div
                      key={j}
                      className={`${styles.cell}
                        ${isMaskedCell ? styles.cellMasked : styles.cellAllowed}
                        ${isRowHovered && !isMaskedCell ? styles.cellRowHovered : ''}
                        ${isSelf && !isMaskedCell ? styles.cellSelf : ''}`}
                      style={isMaskedCell ? undefined : allowedCellStyle(score, isSelf && isRowHovered)}
                      onMouseEnter={() => setHoveredRow(i)}
                      onMouseLeave={() => setHoveredRow(null)}
                    >
                      {isMaskedCell ? (
                        <span className={styles.infSymbol}>−∞</span>
                      ) : (
                        <span className={styles.scoreText}>
                          {score < 0.005 ? '0%' : `${Math.round(score * 100)}%`}
                        </span>
                      )}
                    </div>
                  );
                })}
              </Fragment>
            ))}
          </div>
        </div>

        {/* Info panel */}
        <div className={styles.infoPanel}>
          {hoveredRow === null ? (
            <div className={styles.placeholder}>
              <div className={styles.placeholderArrow}>↖</div>
              <p className={styles.placeholderText}>
                Hover any row to see which tokens it can attend to.
              </p>
            </div>
          ) : (
            <InfoPanel
              token={tokens[hoveredRow]}
              position={hoveredRow}
              tokens={tokens}
              rowScores={grid[hoveredRow]}
              masked={masked}
            />
          )}
        </div>
      </div>

      {/* ── Footer: legend + toggle ── */}
      <div className={styles.footer}>
        <div className={styles.legend}>
          <span className={styles.legendDotAllowed} />
          <span className={styles.legendText}>Can attend</span>
          <span className={styles.legendDotMasked} />
          <span className={styles.legendText}>Blocked (future)</span>
        </div>

        <div className={styles.toggle}>
          <button
            className={`${styles.toggleBtn} ${!masked ? styles.toggleActive : ''}`}
            onClick={() => setMasked(false)}
          >
            Without mask
          </button>
          <button
            className={`${styles.toggleBtn} ${masked ? styles.toggleActive : ''}`}
            onClick={() => setMasked(true)}
          >
            With mask
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Info Panel ────────────────────────────────────────────────────────────────

interface InfoPanelProps {
  token: string;
  position: number;
  tokens: string[];
  rowScores: number[];
  masked: boolean;
}

function InfoPanel({ token, position, tokens, rowScores, masked }: InfoPanelProps) {
  const n = tokens.length;
  const attending = tokens.slice(0, position + 1);
  const blocked = tokens.slice(position + 1);
  const maxScore = Math.max(...rowScores.slice(0, position + 1), 0.001);

  return (
    <div className={styles.infoContent}>
      {/* Token badge */}
      <div className={styles.infoBadgeRow}>
        <span className={styles.infoPos}>{position + 1}</span>
        <span className={styles.infoTokenName}>"{token}"</span>
      </div>

      {/* Attending tokens with bar chart */}
      <div className={styles.infoSection}>
        <div className={styles.infoSectionHead}>
          Attends to — {attending.length} of {n}
        </div>
        {attending.map((tok, idx) => {
          const score = rowScores[idx] ?? 0;
          const barPct = (score / maxScore) * 100;
          return (
            <div key={idx} className={styles.infoRow}>
              <span className={styles.infoRowTok}>{tok}</span>
              <div className={styles.infoBarTrack}>
                <div className={styles.infoBarFill} style={{ width: `${barPct.toFixed(1)}%` }} />
              </div>
              <span className={styles.infoRowPct}>
                {score < 0.005 ? '0%' : `${Math.round(score * 100)}%`}
              </span>
            </div>
          );
        })}
      </div>

      {/* Blocked tokens */}
      {blocked.length > 0 && (
        <div className={styles.infoSection}>
          <div className={`${styles.infoSectionHead} ${styles.infoSectionHeadBlocked}`}>
            Blocked — {blocked.length} future token{blocked.length > 1 ? 's' : ''}
          </div>
          {blocked.map((tok, idx) => (
            <div key={idx} className={styles.infoRowBlocked}>
              <span className={styles.blockedX}>✕</span>
              <span className={styles.infoRowTok}>{tok}</span>
              <span className={`${styles.infoRowPct} ${styles.infoRowPctZero}`}>
                {masked ? '0%' : `${Math.round((rowScores[position + 1 + idx] ?? 0) * 100)}%`}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Context note */}
      <div className={styles.infoNote}>
        {masked
          ? position === 0
            ? `At position 1, "${token}" can only see itself.`
            : `"${token}" predicts the next token using only positions 1–${position + 1}.`
          : blocked.length > 0
            ? `⚠ Without masking, "${token}" leaks ${blocked.length} future token${blocked.length > 1 ? 's' : ''} — invalid for training.`
            : `"${token}" is the last position — masking has no effect here.`
        }
      </div>
    </div>
  );
}
