import React from 'react';
import styles from './styles.module.css';

interface Props {
  name: string;
  duration?: string;
  format?: string;
  weight?: 'gate' | 'signal' | 'level' | 'veto';
  children: React.ReactNode;
}

const WEIGHT_LABELS: Record<NonNullable<Props['weight']>, string> = {
  gate: 'Gate',
  signal: 'Signal',
  level: 'Decides level',
  veto: 'Can veto',
};

export default function Round({
  name,
  duration,
  format,
  weight,
  children,
}: Props) {
  return (
    <section className={styles.round}>
      <div className={styles.roundHeader}>
        <h2 className={styles.roundName}>{name}</h2>
        <div className={styles.roundMeta}>
          {duration && <span className={styles.metaItem}>{duration}</span>}
          {format && <span className={styles.metaItem}>{format}</span>}
          {weight && (
            <span
              className={`${styles.metaPill} ${styles[`pill_${weight}`]}`}
            >
              {WEIGHT_LABELS[weight]}
            </span>
          )}
        </div>
      </div>
      <div className={styles.roundBody}>{children}</div>
    </section>
  );
}
