import React, { useEffect, useRef, useState } from 'react';
import { Flame, Shield } from 'lucide-react';
import {
  getStreakState,
  subscribe,
  getRecentHistory,
  tierForStreak,
  type StreakState,
  type StreakTier,
} from '@site/src/lib/streakMemory';
import styles from './styles.module.css';

const TIER_DESCRIPTORS: Record<StreakTier, string> = {
  starter: 'Start your streak',
  warm: 'Warming up',
  committed: 'Committed',
  habit: 'Habit-formed',
  disciplined: 'Disciplined',
  serious: 'Serious',
  ironclad: 'Ironclad',
  legend: 'Legend',
};

function formatActivityIcon(source: string): string {
  switch (source) {
    case 'lesson': return 'Read';
    case 'quiz': return 'Quiz';
    case 'practice': return 'Solved';
    case 'tutor': return 'Asked Prof';
    default: return '';
  }
}

export default function StreakPill() {
  const [state, setState] = useState<StreakState>(() => getStreakState());
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Re-render on activity from anywhere
  useEffect(() => subscribe(setState), []);

  // Hydration safety — only render after mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Click-outside + Escape close
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

  if (!mounted) {
    // Render a neutral placeholder of the same width to avoid layout shift
    return <div className={styles.placeholder} aria-hidden="true" />;
  }

  const tier = tierForStreak(state.currentStreak);
  const showPill = state.currentStreak > 0 || state.totalActiveDays > 0;

  if (!showPill) {
    // Don't show the pill until the user has had at least one activity ever.
    return null;
  }

  const recentDays = getRecentHistory(28);
  const tierClass = styles[`tier_${tier}`] ?? '';

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`${styles.pill} ${tierClass}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`${state.currentStreak}-day streak — click for details`}
      >
        <span className={styles.flameWrap}>
          <Flame
            size={13}
            strokeWidth={2}
            className={styles.flame}
            aria-hidden="true"
          />
        </span>
        <span className={styles.count}>{state.currentStreak}</span>
      </button>

      <div
        className={`${styles.popover} ${open ? styles.popoverOpen : ''}`}
        role="dialog"
        aria-label="Streak details"
      >
        {/* Hero block — big number + tier label */}
        <div className={styles.section}>
          <div className={styles.heroRow}>
            <span className={`${styles.heroFlame} ${tierClass}`}>
              <Flame size={22} strokeWidth={1.75} />
            </span>
            <div>
              <div className={styles.heroNumber}>
                {state.currentStreak}
                <span className={styles.heroNumberSuffix}>
                  {state.currentStreak === 1 ? ' day' : ' days'}
                </span>
              </div>
              <div className={styles.heroSub}>{TIER_DESCRIPTORS[tier]}</div>
            </div>
          </div>
          <div className={styles.heroMeta}>
            Personal best: {state.longestStreak} {state.longestStreak === 1 ? 'day' : 'days'}
            {' · '}
            {state.totalActiveDays} active {state.totalActiveDays === 1 ? 'day' : 'days'} total
          </div>
        </div>

        <div className={styles.divider} />

        {/* Calendar heatmap — last 28 days */}
        <div className={styles.section}>
          <div className={styles.eyebrow}>Last 4 weeks</div>
          <div className={styles.heatmap} role="presentation">
            {recentDays.map(({ date, active }) => (
              <span
                key={date}
                className={`${styles.heatCell} ${active ? styles.heatCellActive : ''}`}
                title={date}
                aria-hidden="true"
              />
            ))}
          </div>
        </div>

        <div className={styles.divider} />

        {/* Freezes */}
        <div className={styles.section}>
          <div className={styles.freezeRow}>
            <span className={styles.freezeIcon} aria-hidden="true">
              <Shield size={14} strokeWidth={1.75} />
            </span>
            <div className={styles.freezeText}>
              <div className={styles.freezeCount}>
                {state.freezesAvailable} streak{' '}
                {state.freezesAvailable === 1 ? 'freeze' : 'freezes'} available
              </div>
              <div className={styles.freezeNote}>
                Saves your streak if you miss a day. Earn one every 7-day streak.
              </div>
            </div>
          </div>
        </div>

        {state.todayActivities.length > 0 && (
          <>
            <div className={styles.divider} />
            <div className={styles.section}>
              <div className={styles.eyebrow}>Today</div>
              <ul className={styles.activityList}>
                {state.todayActivities.slice(-4).reverse().map((a, i) => (
                  <li key={i} className={styles.activityItem}>
                    <span className={styles.activityKind}>
                      {formatActivityIcon(a.source)}
                    </span>
                    <span className={styles.activityLabel}>{a.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
