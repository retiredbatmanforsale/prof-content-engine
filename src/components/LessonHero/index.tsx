import React from 'react';
import styles from './styles.module.css';

interface LessonHeroProps {
  number?: string | number;
  title: string;
  subtitle?: string;
  course?: string;
}

export default function LessonHero({
  number,
  title,
  subtitle,
  course = 'Deep Neural Networks',
}: LessonHeroProps) {
  return (
    <div className={styles.hero}>
      <p className={styles.course}>{course}</p>
      {number != null && (
        <span className={styles.badge}>Lesson {number}</span>
      )}
      <h1 className={styles.title}>{title}</h1>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
    </div>
  );
}
