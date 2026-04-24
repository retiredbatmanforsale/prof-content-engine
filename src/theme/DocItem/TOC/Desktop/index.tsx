import React, { useEffect, useState, type ReactNode } from 'react';
import clsx from 'clsx';
import { ThemeClassNames } from '@docusaurus/theme-common';
import { useDoc } from '@docusaurus/plugin-content-docs/client';
import TOCItems from '@theme/TOCItems';
import { useProgress } from '@site/src/context/ProgressContext';

import styles from './styles.module.css';

const LINK_CLASS_NAME = 'table-of-contents__link toc-highlight';
const LINK_ACTIVE_CLASS_NAME = 'table-of-contents__link--active';

function BookIcon({ complete }: { complete: boolean }) {
  return complete ? (
    <svg className={styles.bookIcon} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.25a.75.75 0 001 .707A8.237 8.237 0 016 18.75c1.995 0 3.823.707 5.25 1.886V4.533zM12.75 20.636A8.214 8.214 0 0118 18.75c.966 0 1.89.166 2.75.47a.75.75 0 001-.708V4.262a.75.75 0 00-.5-.707A9.735 9.735 0 0018 3a9.707 9.707 0 00-5.25 1.533v16.103z" />
    </svg>
  ) : (
    <svg className={styles.bookIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}

function ReadingProgressBar(): ReactNode {
  const [pct, setPct] = useState(0);
  const { progress } = useProgress();
  const { metadata } = useDoc();
  const status = progress[metadata.id];
  const isComplete = status === 'READ' || status === 'MASTERED';

  useEffect(() => {
    function onScroll() {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setPct(total > 0 ? Math.min(100, Math.round((window.scrollY / total) * 100)) : 0);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const displayPct = isComplete ? 100 : pct;

  return (
    <div className={styles.progressWrap}>
      <div className={styles.progressHeader}>
        <span className={styles.progressLabel}>Reading Progress</span>
        <span className={isComplete ? styles.iconComplete : styles.iconDefault}>
          <BookIcon complete={isComplete} />
        </span>
      </div>
      <div className={styles.track}>
        <div
          className={styles.fill}
          style={{ width: `${displayPct}%` }}
          role="progressbar"
          aria-valuenow={displayPct}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}

export default function DocItemTOCDesktop(): ReactNode {
  const { toc, frontMatter } = useDoc();

  return (
    <div
      className={clsx(
        styles.tocContainer,
        'thin-scrollbar',
        ThemeClassNames.docs.docTocDesktop,
      )}
    >
      {/* Sticky progress bar — pins to top of the scroll container */}
      <ReadingProgressBar />

      {/* TOC links scroll normally within the container */}
      <TOCItems
        toc={toc}
        minHeadingLevel={frontMatter.toc_min_heading_level}
        maxHeadingLevel={frontMatter.toc_max_heading_level}
        linkClassName={LINK_CLASS_NAME}
        linkActiveClassName={LINK_ACTIVE_CLASS_NAME}
      />
    </div>
  );
}
