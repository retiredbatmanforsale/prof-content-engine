import React from 'react';
import styles from './styles.module.css';
import { Question, TYPE_LABEL } from './types';

interface Props {
  questions: Question[];
  title?: string;
}

export default function CommonQuestions({
  questions,
  title = 'Most commonly asked questions',
}: Props) {
  return (
    <section className={styles.questions}>
      <h3 className={styles.questionsTitle}>{title}</h3>
      <ul className={styles.questionList}>
        {questions.map((q, i) => {
          const Tag: any = q.href ? 'a' : 'div';
          const tagProps = q.href
            ? { href: q.href, target: '_blank', rel: 'noopener noreferrer' }
            : {};
          return (
            <li key={i} className={styles.questionItem}>
              <Tag {...tagProps} className={styles.questionRow}>
                <div className={styles.questionTags}>
                  {q.type && (
                    <span className={`${styles.qTag} ${styles[`qTag_${q.type}`]}`}>
                      {TYPE_LABEL[q.type]}
                    </span>
                  )}
                  {q.difficulty && (
                    <span className={`${styles.qDiff} ${styles[`qDiff_${q.difficulty}`]}`}>
                      {q.difficulty}
                    </span>
                  )}
                </div>
                <span className={styles.questionPrompt}>{q.prompt}</span>
                {q.source && (
                  <span className={styles.questionSource}>{q.source}</span>
                )}
              </Tag>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
