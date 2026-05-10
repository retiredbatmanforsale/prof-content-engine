import React from 'react';
import styles from './styles.module.css';

interface AnimationPlaceholderProps {
  name: string;
  description: string;
}

export default function AnimationPlaceholder({name, description}: AnimationPlaceholderProps) {
  return (
    <div className={`${styles.placeholder} ${styles.animation}`}>
      <p className={styles.tag}>Animation · pending wire-up</p>
      <p className={styles.componentName}>&lt;{name} /&gt;</p>
      <p className={styles.description}>{description}</p>
    </div>
  );
}
