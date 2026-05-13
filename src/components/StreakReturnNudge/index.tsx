import React, { useEffect, useState } from 'react';
import { Flame } from 'lucide-react';
import { shouldShowReturnNudge } from '@site/src/lib/streakMemory';
import styles from './styles.module.css';

const SESSION_DISMISS_KEY = 'prof_streak_nudge_dismissed_session';

export default function StreakReturnNudge() {
  const [visible, setVisible] = useState(false);
  const [previousStreak, setPreviousStreak] = useState(0);

  useEffect(() => {
    // Suppress for the rest of this tab/session if already dismissed
    if (
      typeof sessionStorage !== 'undefined' &&
      sessionStorage.getItem(SESSION_DISMISS_KEY) === '1'
    ) {
      return;
    }
    const result = shouldShowReturnNudge();
    if (result.show) {
      setPreviousStreak(result.previousStreak);
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  function handleDismiss() {
    setVisible(false);
    try {
      sessionStorage.setItem(SESSION_DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
  }

  return (
    <div className={styles.nudge} role="status">
      <span className={styles.icon} aria-hidden="true">
        <Flame size={14} strokeWidth={1.75} />
      </span>
      <span className={styles.text}>
        You had a {previousStreak}-day streak going. Do one thing today and we&rsquo;ll restart it.
      </span>
      <button
        type="button"
        onClick={handleDismiss}
        className={styles.dismiss}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
