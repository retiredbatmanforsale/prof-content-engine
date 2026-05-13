import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import Link from '@docusaurus/Link';
import { PREVIEW_STATUS } from '@site/src/lib/preview-status';
import styles from './styles.module.css';

function formatMonthDay(iso: string): string {
  const d = new Date(iso);
  const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  return `${month} ${d.getDate()}`;
}

export default function EarlyAccessPill() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [open]);

  const lastShippedDate = formatMonthDay(PREVIEW_STATUS.lastShipped.date);

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={styles.pill}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Product status"
      >
        <span className={styles.dot} aria-hidden="true">
          <span className={styles.dotPing} />
          <span className={styles.dotCore} />
        </span>
        <span className={styles.label}>EARLY ACCESS</span>
        <ChevronDown
          size={10}
          strokeWidth={2.5}
          className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}
          aria-hidden="true"
        />
      </button>

      <div
        className={`${styles.popover} ${open ? styles.popoverOpen : ''}`}
        role="dialog"
        aria-label="Product status details"
      >
        <div className={styles.section}>
          <div className={styles.eyebrowRow}>
            <span className={styles.dotSmall} aria-hidden="true" />
            <span className={styles.eyebrow}>EARLY ACCESS</span>
          </div>
          <p className={styles.statusLine}>Shipping daily.</p>
          <p className={styles.gaLine}>{PREVIEW_STATUS.gaPromise}</p>
        </div>

        <div className={styles.divider} />

        <div className={styles.section}>
          <div className={styles.eyebrow}>LAST SHIPPED · {lastShippedDate}</div>
          <p className={styles.entryTitle}>{PREVIEW_STATUS.lastShipped.title}</p>
          <Link href={PREVIEW_STATUS.lastShipped.href} className={styles.link}>
            View what&rsquo;s new
            <span aria-hidden="true" className={styles.arrow}>→</span>
          </Link>
        </div>

        <div className={styles.divider} />

        <div className={styles.section}>
          <div className={styles.eyebrow}>COMING NEXT</div>
          <ul className={styles.list}>
            {PREVIEW_STATUS.comingNext.map((item) => (
              <li key={item} className={styles.listItem}>
                <span className={styles.listBullet} aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.divider} />

        <a href={PREVIEW_STATUS.bugReportHref} className={styles.footerLink}>
          Found a bug? Tell Puru
          <span aria-hidden="true" className={styles.arrow}>→</span>
        </a>
      </div>
    </div>
  );
}
