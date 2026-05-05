import React from 'react';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

interface Guide {
  href: string;
  company: string;
  level: string;
  blurb?: string;
}

interface Props {
  guides: Guide[];
  title?: string;
}

export default function RelatedGuides({
  guides,
  title = 'Related guides',
}: Props) {
  return (
    <section className={styles.related}>
      <h3 className={styles.relatedTitle}>{title}</h3>
      <div className={styles.relatedGrid}>
        {guides.map((g) => (
          <Link key={g.href} to={g.href} className={styles.relatedCard}>
            <div className={styles.relatedTop}>
              <span className={styles.relatedCompany}>{g.company}</span>
              <span className={styles.relatedLevel}>{g.level}</span>
            </div>
            {g.blurb && <p className={styles.relatedBlurb}>{g.blurb}</p>}
          </Link>
        ))}
      </div>
    </section>
  );
}
