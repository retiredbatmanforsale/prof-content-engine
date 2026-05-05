import React, { useEffect, useState } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import styles from './styles.module.css';

const STORAGE_KEY = 'prof:interview-guides:read';

function readSet(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function writeSet(s: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...s]));
  } catch {
    /* ignore quota errors */
  }
}

export function isRead(slug: string): boolean {
  if (typeof window === 'undefined') return false;
  return readSet().has(slug);
}

interface Props {
  slug: string;
}

function Inner({ slug }: Props) {
  const [read, setRead] = useState(false);

  useEffect(() => {
    setRead(readSet().has(slug));
  }, [slug]);

  const toggle = () => {
    const s = readSet();
    if (s.has(slug)) s.delete(slug);
    else s.add(slug);
    writeSet(s);
    setRead(s.has(slug));
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={`${styles.markBtn} ${read ? styles.markBtnDone : ''}`}
      aria-pressed={read}
    >
      <span className={styles.markCheck} aria-hidden>
        {read ? '✓' : ''}
      </span>
      {read ? 'Marked as read' : 'Mark as read'}
    </button>
  );
}

export default function MarkAsRead(props: Props) {
  return (
    <BrowserOnly fallback={<div className={styles.markPlaceholder} />}>
      {() => <Inner {...props} />}
    </BrowserOnly>
  );
}
