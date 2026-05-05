import React from 'react';
import styles from './styles.module.css';

interface Item {
  href: string;
  label: string;
}

interface Props {
  items: Item[];
  title?: string;
}

export default function GuideTOC({ items, title = 'On this page' }: Props) {
  return (
    <nav aria-label={title} className={styles.toc}>
      <div className={styles.tocTitle}>{title}</div>
      <ol className={styles.tocList}>
        {items.map((item, i) => (
          <li key={item.href} className={styles.tocItem}>
            <span className={styles.tocNum}>{String(i + 1).padStart(2, '0')}</span>
            <a href={item.href} className={styles.tocLink}>
              {item.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
