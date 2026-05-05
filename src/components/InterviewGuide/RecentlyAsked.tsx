import React from 'react';
import styles from './styles.module.css';
import { RecentQuestion, TYPE_LABEL } from './types';

interface Props {
  questions: RecentQuestion[];
  title?: string;
  lastUpdated?: string;
  emptyState?: string;
}

export default function RecentlyAsked({
  questions,
  title = 'Recently asked (community-sourced)',
  lastUpdated,
  emptyState = 'No recent reports found yet. Submit yours at puru@lexailabs.com.',
}: Props) {
  if (!questions || questions.length === 0) {
    return (
      <section className={styles.recent}>
        <h3 className={styles.recentTitle}>{title}</h3>
        <p className={styles.recentEmpty}>{emptyState}</p>
      </section>
    );
  }

  return (
    <section className={styles.recent}>
      <h3 className={styles.recentTitle}>{title}</h3>
      <p className={styles.recentDisclaimer}>
        Sourced from public interview reports (Reddit, Medium, Substack, Glassdoor).
        Each question links to its source. Dates are when the question was reportedly asked.
      </p>
      <ul className={styles.recentList}>
        {questions.map((q, i) => {
          const Tag: any = q.href ? 'a' : 'div';
          const tagProps = q.href
            ? { href: q.href, target: '_blank', rel: 'noopener noreferrer' }
            : {};
          return (
            <li key={i} className={styles.recentItem}>
              <Tag {...tagProps} className={styles.recentRow}>
                <div className={styles.recentTopRow}>
                  <div className={styles.recentTags}>
                    {q.type && (
                      <span
                        className={`${styles.qTag} ${styles[`qTag_${q.type}`]}`}
                      >
                        {TYPE_LABEL[q.type]}
                      </span>
                    )}
                    {q.difficulty && (
                      <span
                        className={`${styles.qDiff} ${styles[`qDiff_${q.difficulty}`]}`}
                      >
                        {q.difficulty}
                      </span>
                    )}
                    {q.confidence && q.confidence !== 'high' && (
                      <span
                        className={`${styles.confTag} ${styles[`conf_${q.confidence}`]}`}
                        title="Confidence in this report"
                      >
                        {q.confidence === 'medium' ? 'unverified' : 'low confidence'}
                      </span>
                    )}
                  </div>
                  {q.dateObserved && (
                    <span className={styles.recentDate}>{q.dateObserved}</span>
                  )}
                </div>
                <span className={styles.recentPrompt}>{q.prompt}</span>
                {q.source && (
                  <span className={styles.recentSource}>via {q.source}</span>
                )}
              </Tag>
            </li>
          );
        })}
      </ul>
      {lastUpdated && (
        <p className={styles.recentFooter}>
          Last updated: <strong>{lastUpdated}</strong>. Spotted a fresher report?
          Email puru@lexailabs.com.
        </p>
      )}
    </section>
  );
}
