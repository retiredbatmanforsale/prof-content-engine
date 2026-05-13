import React, { useEffect, useState } from 'react';
import { Flame, Shield } from 'lucide-react';
import { subscribe, getStreakState, tierForStreak, type StreakState } from '@site/src/lib/streakMemory';
import styles from './styles.module.css';

type ToastPayload = {
  kind: 'first-of-day' | 'milestone' | 'freeze-saved';
  streak: number;
  freezesNow: number;
};

const MILESTONE_HEADLINES: Record<number, string> = {
  1: 'Day one.',
  7: 'One week strong.',
  21: '21 days — habit-formed.',
  30: '30 days. Disciplined.',
  40: '40-day streak.',
  50: '50 days. Ironclad.',
  60: 'Legend tier unlocked.',
  100: '100 days. You earned this.',
};

function milestoneCopy(streak: number): string {
  if (MILESTONE_HEADLINES[streak]) return MILESTONE_HEADLINES[streak];
  if (streak > 60 && streak % 10 === 0) return `${streak} days. Still going.`;
  return `Day ${streak}. You're on a roll.`;
}

// Track previous state across renders to detect transitions.
let lastSeenState: StreakState | null = null;

export default function StreakToast() {
  const [toast, setToast] = useState<ToastPayload | null>(null);

  useEffect(() => {
    // Seed on mount
    lastSeenState = getStreakState();

    const unsubscribe = subscribe((next) => {
      const prev = lastSeenState;
      lastSeenState = next;
      if (!prev) return;

      // Detect: did currentStreak just increase? Did the user just have their
      // first qualifying activity today?
      const becameFirstActivityToday =
        prev.lastActiveDay !== next.lastActiveDay;
      const streakIncreased = next.currentStreak > prev.currentStreak;
      const freezeJustConsumed =
        next.freezesAvailable < prev.freezesAvailable;

      if (becameFirstActivityToday || streakIncreased) {
        const isMilestoneDay =
          next.currentStreak === 1 ||
          next.currentStreak === 7 ||
          next.currentStreak === 21 ||
          next.currentStreak === 30 ||
          next.currentStreak === 40 ||
          next.currentStreak === 50 ||
          next.currentStreak === 60 ||
          next.currentStreak === 100 ||
          (next.currentStreak > 60 && next.currentStreak % 10 === 0);

        setToast({
          kind: freezeJustConsumed
            ? 'freeze-saved'
            : isMilestoneDay
              ? 'milestone'
              : 'first-of-day',
          streak: next.currentStreak,
          freezesNow: next.freezesAvailable,
        });
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!toast) return null;

  const tier = tierForStreak(toast.streak);
  const isHotTier =
    tier === 'disciplined' ||
    tier === 'serious' ||
    tier === 'ironclad' ||
    tier === 'legend';

  return (
    <div
      className={`${styles.toast} ${isHotTier ? styles.toastHot : ''}`}
      role="status"
      aria-live="polite"
    >
      <button
        type="button"
        className={styles.dismiss}
        onClick={() => setToast(null)}
        aria-label="Dismiss"
      >
        ×
      </button>

      <div className={styles.iconWrap}>
        {toast.kind === 'freeze-saved' ? (
          <Shield size={18} strokeWidth={1.75} />
        ) : (
          <Flame size={18} strokeWidth={1.75} />
        )}
      </div>

      <div className={styles.content}>
        {toast.kind === 'freeze-saved' ? (
          <>
            <div className={styles.headline}>Streak saved.</div>
            <div className={styles.body}>
              A streak freeze covered yesterday. {toast.freezesNow} left.
            </div>
          </>
        ) : toast.kind === 'milestone' ? (
          <>
            <div className={styles.headline}>{milestoneCopy(toast.streak)}</div>
            <div className={styles.body}>
              {toast.streak % 7 === 0 && toast.streak > 0
                ? `+1 streak freeze unlocked.`
                : 'Keep going.'}
            </div>
          </>
        ) : (
          <>
            <div className={styles.headline}>Day {toast.streak}.</div>
            <div className={styles.body}>You&rsquo;re on a roll.</div>
          </>
        )}
      </div>
    </div>
  );
}
