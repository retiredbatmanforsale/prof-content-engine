import React from 'react';
import styles from './styles.module.css';

export interface Criterion {
  name: string;
  detail: string;
  strong?: string;
}

interface Props {
  title?: string;
  criteria: Criterion[];
}

export default function EvalCriteria({
  title = 'Evaluation criteria',
  criteria,
}: Props) {
  return (
    <div className={styles.eval}>
      <h3 className={styles.evalTitle}>{title}</h3>
      <ul className={styles.evalList}>
        {criteria.map((c) => (
          <li key={c.name} className={styles.evalItem}>
            <div className={styles.evalName}>{c.name}</div>
            <p className={styles.evalDetail}>{c.detail}</p>
            {c.strong && (
              <p className={styles.evalStrong}>
                <span className={styles.evalStrongLabel}>Strong signal:</span>{' '}
                {c.strong}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
