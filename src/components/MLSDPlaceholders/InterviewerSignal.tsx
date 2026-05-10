import React from 'react';
import styles from './styles.module.css';

interface InterviewerSignalProps {
  level: 'L4' | 'L5';
  message: string;
}

export default function InterviewerSignal({level, message}: InterviewerSignalProps) {
  const isL4 = level === 'L4';
  const tag = isL4 ? 'Mid-senior (L4) · ceiling signal' : 'Senior (L5) · promote signal';
  const variant = isL4 ? styles.signalL4 : styles.signalL5;

  return (
    <div className={`${styles.signal} ${variant}`}>
      <p className={styles.signalTag}>{tag}</p>
      <p className={styles.signalMessage}>{message}</p>
    </div>
  );
}
