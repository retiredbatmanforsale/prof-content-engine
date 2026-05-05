import React from 'react';
import styles from './styles.module.css';

interface Props {
  company: string;
  level: string;
  title?: string;
  subtitle?: string;
}

export default function GuideHero({ company, level, title, subtitle }: Props) {
  return (
    <header className={styles.hero}>
      <div className={styles.eyebrow}>
        <span className={styles.eyebrowCompany}>{company}</span>
        <span className={styles.eyebrowDot}>·</span>
        <span className={styles.eyebrowLevel}>{level}</span>
      </div>
      <h1 className={styles.title}>
        {title ?? `${company} ${level} Interview Guide`}
      </h1>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
    </header>
  );
}
