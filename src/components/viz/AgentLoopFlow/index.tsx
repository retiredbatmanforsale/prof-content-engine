import React, { useState } from 'react';
import styles from './styles.module.css';

type Mode = 'good' | 'bad';

const STAGES = [
  { key: 'q', label: 'Question', icon: '?' },
  { key: 'a', label: 'Agent', icon: '⚙' },
  { key: 'l', label: 'LLM', icon: '✨' },
  { key: 'r', label: 'Response', icon: '↵' },
] as const;

const SCRIPTS: Record<Mode, { prompt: string; response: string; verdict: string; verdictTone: 'ok' | 'warn' }> = {
  good: {
    prompt: 'What is reinforcement learning?',
    response:
      'Reinforcement learning is a paradigm where an agent learns by interacting with an environment, receiving rewards…',
    verdict: 'Generic — plausible & correct',
    verdictTone: 'ok',
  },
  bad: {
    prompt: 'What did the AlphaCode paper report for HumanEval pass@1?',
    response: 'AlphaCode (DeepMind, 2022) reported a pass@1 of 45.7% on HumanEval for Python.',
    verdict: 'Specific — confident & fabricated',
    verdictTone: 'warn',
  },
};

export default function AgentLoopFlow() {
  const [mode, setMode] = useState<Mode>('good');
  const script = SCRIPTS[mode];

  return (
    <div className={styles.wrap} aria-label="Bare LLM loop animation">
      <div className={styles.toggle} role="tablist">
        <button
          role="tab"
          aria-selected={mode === 'good'}
          className={mode === 'good' ? styles.tabActive : styles.tab}
          onClick={() => setMode('good')}
        >
          Generic question
        </button>
        <button
          role="tab"
          aria-selected={mode === 'bad'}
          className={mode === 'bad' ? styles.tabActive : styles.tab}
          onClick={() => setMode('bad')}
        >
          Specific question
        </button>
      </div>

      <div className={styles.flow} key={mode}>
        {STAGES.map((s, i) => (
          <React.Fragment key={s.key}>
            <div
              className={styles.node}
              style={{ animationDelay: `${i * 0.6}s` }}
            >
              <span className={styles.icon} aria-hidden>{s.icon}</span>
              <span className={styles.label}>{s.label}</span>
            </div>
            {i < STAGES.length - 1 && (
              <div
                className={styles.arrow}
                style={{ animationDelay: `${i * 0.6 + 0.3}s` }}
              >
                <span className={styles.dot} />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      <div className={styles.bubbles}>
        <div className={styles.bubbleIn}>
          <span className={styles.bubbleEyebrow}>You ask</span>
          <p>{script.prompt}</p>
        </div>
        <div className={styles.bubbleOut}>
          <span className={styles.bubbleEyebrow}>Agent returns</span>
          <p>{script.response}</p>
        </div>
      </div>

      <div className={script.verdictTone === 'ok' ? styles.verdictOk : styles.verdictWarn}>
        {script.verdict}
      </div>
    </div>
  );
}
