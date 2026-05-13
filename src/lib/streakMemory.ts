/**
 * Streak tracking — localStorage-backed, no backend.
 *
 * A streak is a count of consecutive days the user did at least one
 * qualifying activity (lesson read, quiz completed, practice submitted,
 * Prof chat started). Days are calculated in the user's local timezone.
 *
 * Designed to be called from React components on key actions, with a
 * tiny subscribe() API so the navbar pill can re-render reactively.
 */

const KEY = 'prof_streak_v1';
const MAX_FREEZES = 3;
const MILESTONE_DAYS = new Set([1, 7, 21, 30, 40, 50, 60, 70, 80, 90, 100, 150, 200, 365]);
// After day 60 we also auto-add every multiple of 10 as a milestone.

export type ActivitySource = 'lesson' | 'quiz' | 'practice' | 'tutor';

export type TodayActivity = {
  source: ActivitySource;
  label: string;       // human-readable, e.g. "Self-attention"
  timestamp: number;   // ms
};

export type StreakState = {
  currentStreak: number;
  longestStreak: number;
  lastActiveDay: string;          // 'YYYY-MM-DD'
  totalActiveDays: number;
  freezesAvailable: number;
  history: Record<string, true>;  // day → active
  todayActivities: TodayActivity[];
};

export type RecordResult = {
  state: StreakState;
  /** True only for the FIRST qualifying activity of the day. */
  isFirstActivityToday: boolean;
  /** True if today's first activity hit a milestone day (1/7/21/30/40/50/60/...) */
  hitMilestone: boolean;
  /** True if a streak freeze was just consumed to keep the streak alive. */
  freezeConsumed: boolean;
};

// ── Helpers ──────────────────────────────────────────────────────────────

function todayKey(): string {
  // 'YYYY-MM-DD' in the user's local timezone — en-CA gives ISO order.
  return new Date().toLocaleDateString('en-CA');
}

function dayKey(d: Date): string {
  return d.toLocaleDateString('en-CA');
}

function addDays(iso: string, n: number): string {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return dayKey(d);
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00').getTime();
  const db = new Date(b + 'T00:00:00').getTime();
  return Math.round((db - da) / 86_400_000);
}

function isMilestone(streak: number): boolean {
  if (MILESTONE_DAYS.has(streak)) return true;
  // After 60, every multiple of 10 counts.
  if (streak > 60 && streak % 10 === 0) return true;
  return false;
}

function emptyState(): StreakState {
  return {
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDay: '',
    totalActiveDays: 0,
    freezesAvailable: 0,
    history: {},
    todayActivities: [],
  };
}

function load(): StreakState {
  if (typeof window === 'undefined') return emptyState();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw);
    return { ...emptyState(), ...parsed };
  } catch {
    return emptyState();
  }
}

function save(s: StreakState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* quota / private mode — silently drop */
  }
}

// ── Subscribers (so the navbar pill can react to activity) ──────────────

type Listener = (s: StreakState) => void;
const listeners = new Set<Listener>();

function notify(s: StreakState): void {
  listeners.forEach((cb) => {
    try {
      cb(s);
    } catch {
      /* swallow listener errors */
    }
  });
}

export function subscribe(cb: Listener): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

// ── Core API ────────────────────────────────────────────────────────────

export function getStreakState(): StreakState {
  return load();
}

/**
 * Record a qualifying activity. Returns the new state plus signals the
 * UI uses for celebration toasts.
 */
export function recordActivity(
  source: ActivitySource,
  label: string,
): RecordResult {
  const state = load();
  const today = todayKey();

  const activity: TodayActivity = {
    source,
    label,
    timestamp: Date.now(),
  };

  // Already counted today — append to today's activity list, no streak change
  if (state.history[today]) {
    if (state.lastActiveDay === today) {
      state.todayActivities = [...state.todayActivities, activity];
    } else {
      // History says yes, lastActiveDay says no — reconcile.
      state.lastActiveDay = today;
      state.todayActivities = [activity];
    }
    save(state);
    notify(state);
    return {
      state,
      isFirstActivityToday: false,
      hitMilestone: false,
      freezeConsumed: false,
    };
  }

  // New day for this user. Figure out streak continuation.
  let freezeConsumed = false;

  if (!state.lastActiveDay) {
    // First activity ever
    state.currentStreak = 1;
  } else {
    const gap = daysBetween(state.lastActiveDay, today);
    if (gap === 1) {
      // Consecutive day — extend
      state.currentStreak += 1;
    } else if (gap === 2 && state.freezesAvailable > 0) {
      // Used one missed day + had a freeze — keep streak alive
      // (yesterday gets back-filled as active via the freeze)
      const yesterday = addDays(today, -1);
      state.history[yesterday] = true;
      state.freezesAvailable -= 1;
      state.currentStreak += 1;
      freezeConsumed = true;
    } else {
      // Gap too large — streak resets
      state.currentStreak = 1;
    }
  }

  // Mark today active
  state.history[today] = true;
  state.lastActiveDay = today;
  state.totalActiveDays += 1;
  state.longestStreak = Math.max(state.longestStreak, state.currentStreak);
  state.todayActivities = [activity];

  // Earn a freeze every 7 days (capped)
  if (state.currentStreak > 0 && state.currentStreak % 7 === 0) {
    state.freezesAvailable = Math.min(MAX_FREEZES, state.freezesAvailable + 1);
  }

  save(state);
  notify(state);

  return {
    state,
    isFirstActivityToday: true,
    hitMilestone: isMilestone(state.currentStreak),
    freezeConsumed,
  };
}

/**
 * Returns the last `daysBack` days as ordered array — for the popover heatmap.
 */
export function getRecentHistory(daysBack: number): Array<{ date: string; active: boolean }> {
  const state = load();
  const today = todayKey();
  const out: Array<{ date: string; active: boolean }> = [];
  for (let i = daysBack - 1; i >= 0; i--) {
    const d = addDays(today, -i);
    out.push({ date: d, active: !!state.history[d] });
  }
  return out;
}

/**
 * For the inactivity-return nudge — true if the user had a streak worth
 * preserving (7+) but has been gone long enough that it's already broken.
 */
export function shouldShowReturnNudge(): { show: boolean; previousStreak: number } {
  const state = load();
  if (state.currentStreak >= 7) {
    // Active streak — nothing to nudge
    return { show: false, previousStreak: state.currentStreak };
  }
  if (state.longestStreak >= 7 && state.lastActiveDay) {
    const gap = daysBetween(state.lastActiveDay, todayKey());
    if (gap >= 2 && gap <= 7) {
      return { show: true, previousStreak: state.longestStreak };
    }
  }
  return { show: false, previousStreak: 0 };
}

/**
 * Tier the visual treatment based on streak length.
 */
export type StreakTier =
  | 'starter'    // 0
  | 'warm'       // 1-6
  | 'committed'  // 7-20
  | 'habit'      // 21-29
  | 'disciplined' // 30-39
  | 'serious'    // 40-49
  | 'ironclad'   // 50-59
  | 'legend';    // 60+

export function tierForStreak(s: number): StreakTier {
  if (s <= 0) return 'starter';
  if (s < 7) return 'warm';
  if (s < 21) return 'committed';
  if (s < 30) return 'habit';
  if (s < 40) return 'disciplined';
  if (s < 50) return 'serious';
  if (s < 60) return 'ironclad';
  return 'legend';
}
