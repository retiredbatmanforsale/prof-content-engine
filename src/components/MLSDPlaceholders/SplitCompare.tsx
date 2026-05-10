import React from 'react';
import styles from './styles.module.css';

interface SplitCompareProps {
  children: React.ReactNode;
}

interface SplitColProps {
  title: string;
  children: React.ReactNode;
}

export default function SplitCompare({children}: SplitCompareProps) {
  return <div className={styles.splitCompare}>{children}</div>;
}

export function SplitLeft({title, children}: SplitColProps) {
  return (
    <div className={`${styles.splitSide} ${styles.splitLeft}`}>
      <p className={styles.splitTag}>{title}</p>
      <div className={styles.splitBody}>{children}</div>
    </div>
  );
}

export function SplitRight({title, children}: SplitColProps) {
  return (
    <div className={`${styles.splitSide} ${styles.splitRight}`}>
      <p className={styles.splitTag}>{title}</p>
      <div className={styles.splitBody}>{children}</div>
    </div>
  );
}
