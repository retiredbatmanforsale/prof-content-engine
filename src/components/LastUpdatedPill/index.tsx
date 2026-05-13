import React, { type ReactNode } from 'react';
import { Clock } from 'lucide-react';
import styles from './styles.module.css';

type Props = {
  /** Either an ISO string or a unix-timestamp number (seconds or ms). */
  date: string | number | undefined | null;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function toDate(input: string | number): Date | null {
  if (typeof input === 'number') {
    // Docusaurus emits seconds; normalize to ms if needed.
    const ms = input < 1e12 ? input * 1000 : input;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(input);
  return isNaN(d.getTime()) ? null : d;
}

function formatRelative(d: Date): string {
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / MS_PER_DAY);

  if (days < 0) return formatAbsolute(d); // future date — show absolute
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  return formatAbsolute(d);
}

function formatAbsolute(d: Date): string {
  const now = new Date();
  const sameYear = d.getFullYear() === now.getFullYear();
  const month = d.toLocaleString('en-US', { month: 'short' });
  const day = d.getDate();
  return sameYear ? `${day} ${month}` : `${day} ${month} ${d.getFullYear()}`;
}

function formatFull(d: Date): string {
  // For the hover tooltip — full ISO-ish readable timestamp.
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

export default function LastUpdatedPill({ date }: Props): ReactNode {
  if (date === undefined || date === null) return null;
  const d = toDate(date);
  if (!d) return null;

  const label = formatRelative(d);
  const full = formatFull(d);

  return (
    <span className={styles.pill} title={`Last updated ${full}`}>
      <Clock size={11} strokeWidth={1.75} className={styles.icon} aria-hidden="true" />
      <span className={styles.text}>Updated {label}</span>
    </span>
  );
}
