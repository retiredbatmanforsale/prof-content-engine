import React, { useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { PREVIEW_STATUS } from '@site/src/lib/preview-status';
import { useDismissible } from '@site/src/lib/useDismissible';
import styles from './styles.module.css';

function formatMonthDay(iso: string): string {
  const d = new Date(iso);
  const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  return `${month} ${d.getDate()}`;
}

export default function EarlyAccessPill() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const { siteConfig } = useDocusaurusContext();
  const mainPlatformUrl =
    (siteConfig.customFields?.mainPlatformUrl as string) ||
    'https://prof.lexailabs.com';

  // Lift the relative href to an absolute URL pointing at prof-frontend so
  // the link resolves in both dev and prod (the /whats-new page lives in
  // prof-frontend, not the docs site).
  const whatsNewHref = PREVIEW_STATUS.lastShipped.href.startsWith('/')
    ? `${mainPlatformUrl}${PREVIEW_STATUS.lastShipped.href}`
    : PREVIEW_STATUS.lastShipped.href;

  useDismissible(wrapRef, open, () => setOpen(false));

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
        </div>

        <div className={styles.divider} />

        <div className={styles.section}>
          <div className={styles.eyebrowRow}>
            <span className={styles.eyebrow}>Last shipped</span>
            <span className={styles.dateChip}>{lastShippedDate}</span>
          </div>
          <p className={styles.entryTitle}>{PREVIEW_STATUS.lastShipped.title}</p>
          <a
            href={whatsNewHref}
            className={styles.link}
            target="_blank"
            rel="noopener noreferrer"
          >
            View what&rsquo;s new
            <span aria-hidden="true" className={styles.arrow}>→</span>
          </a>
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
          {PREVIEW_STATUS.bugReportLabel}
          <span aria-hidden="true" className={styles.arrow}>→</span>
        </a>
      </div>
    </div>
  );
}
