import React from 'react';
import styles from './styles.module.css';

interface PlaygroundPlaceholderProps {
  name: string;
  description: string;
}

export default function PlaygroundPlaceholder({name, description}: PlaygroundPlaceholderProps) {
  return (
    <div className={`${styles.placeholder} ${styles.playground}`}>
      <p className={styles.tag}>Interactive build · pending wire-up</p>
      <p className={styles.componentName}>&lt;{name} /&gt;</p>
      <p className={styles.description}>{description}</p>
    </div>
  );
}
