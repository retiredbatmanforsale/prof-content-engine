import React, { useState } from 'react';
import styles from './styles.module.css';

type Mode = 'bare' | 'designed';

const PARTS = [
  {
    key: 'role',
    label: 'Role',
    accent: 'role',
    text: 'You are a senior engineer at a large tech company.',
  },
  {
    key: 'context',
    label: 'Context',
    accent: 'context',
    text: 'We sell B2B SaaS, $50/user/mo, annual contract.',
  },
  {
    key: 'task',
    label: 'Task',
    accent: 'task',
    text: 'Review this function for bugs and naming.',
  },
  {
    key: 'format',
    label: 'Format',
    accent: 'format',
    text: 'Return 3 bullets, max 15 words each — decisions only.',
  },
] as const;

export default function PromptAnatomy() {
  const [mode, setMode] = useState<Mode>('designed');

  return (
    <div className={styles.wrap} aria-label="Anatomy of a prompt">
      <div className={styles.toggle} role="tablist">
        <button
          role="tab"
          aria-selected={mode === 'bare'}
          className={mode === 'bare' ? styles.tabActive : styles.tab}
          onClick={() => setMode('bare')}
        >
          Bare task
        </button>
        <button
          role="tab"
          aria-selected={mode === 'designed'}
          className={mode === 'designed' ? styles.tabActive : styles.tab}
          onClick={() => setMode('designed')}
        >
          Designed prompt
        </button>
      </div>

      <div className={styles.stage} key={mode}>
        {mode === 'bare' ? (
          <div className={styles.bareBox}>
            <span className={styles.bareLabel}>Prompt</span>
            <p>Fix my code.</p>
            <span className={styles.bareWarn}>The model has to guess: who, what context, which output shape.</span>
          </div>
        ) : (
          <div className={styles.promptBox}>
            <span className={styles.promptLabel}>Prompt</span>
            {PARTS.map((p, i) => (
              <div
                key={p.key}
                className={`${styles.chunk} ${styles[p.accent]}`}
                style={{ animationDelay: `${0.15 + i * 0.18}s` }}
              >
                <span className={styles.chunkTag}>{p.label}</span>
                <span className={styles.chunkText}>{p.text}</span>
              </div>
            ))}
            <div className={styles.glow} aria-hidden />
          </div>
        )}
      </div>

      <div className={styles.legend}>
        <strong>Recipe:</strong> Role · Context · Task · Format. Add measurable constraints (length, count, audience) wherever you can.
      </div>
    </div>
  );
}
