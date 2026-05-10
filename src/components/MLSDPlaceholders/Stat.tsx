import React from 'react';
import styles from './styles.module.css';

interface StatProps {
  value: string;
  caption: string;
  source?: string;
}

export default function Stat({value, caption, source}: StatProps) {
  return (
    <div className={styles.stat}>
      <p className={styles.statValue}>{value}</p>
      <p className={styles.statCaption}>{caption}</p>
      {source && <p className={styles.statSource}>{source}</p>}
    </div>
  );
}
