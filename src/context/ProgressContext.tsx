import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import { recordActivity } from '@site/src/lib/streakMemory';

function humanizeLessonId(lessonId: string): string {
  const slug = lessonId.split('/').pop() ?? lessonId;
  return slug
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export type ProgressStatus = 'IN_PROGRESS' | 'READ' | 'MASTERED';

type ProgressMap = Record<string, ProgressStatus>;

interface ProgressContextValue {
  progress: ProgressMap;
  markInProgress: (lessonId: string) => void;
  markRead: (lessonId: string) => void;
}

const ProgressContext = createContext<ProgressContextValue>({
  progress: {},
  markInProgress: () => {},
  markRead: () => {},
});

const STORAGE_KEY = 'prof_progress';

function getStoredProgress(): ProgressMap {
  if (!ExecutionEnvironment.canUseDOM) return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveProgress(map: ProgressMap) {
  if (!ExecutionEnvironment.canUseDOM) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {}
}

function getJwt(): string | null {
  if (!ExecutionEnvironment.canUseDOM) return null;
  return sessionStorage.getItem('lexai_access_token');
}

// Status priority — never downgrade
const RANK: Record<ProgressStatus, number> = {
  IN_PROGRESS: 1,
  READ: 2,
  MASTERED: 3,
};

function higher(a: ProgressStatus | undefined, b: ProgressStatus): ProgressStatus {
  if (!a) return b;
  return RANK[a] >= RANK[b] ? a : b;
}

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const { siteConfig } = useDocusaurusContext();
  const apiUrl = (siteConfig.customFields?.apiUrl as string) ?? '';
  const [progress, setProgress] = useState<ProgressMap>(getStoredProgress);
  const syncedCourses = useRef<Set<string>>(new Set());

  // Hydrate from backend for the current course on first load
  useEffect(() => {
    if (!ExecutionEnvironment.canUseDOM) return;
    const jwt = getJwt();
    if (!jwt) return;

    const path = window.location.pathname;
    // Extract courseId — e.g. "ai-for-engineering/deep-neural-networks"
    const match = path.match(/\/courses\/([\w-]+\/[\w-]+)\//);
    if (!match) return;
    const courseId = match[1];
    if (syncedCourses.current.has(courseId)) return;
    syncedCourses.current.add(courseId);

    fetch(`${apiUrl}/progress/course/${encodeURIComponent(courseId)}`, {
      headers: { Authorization: `Bearer ${jwt}` },
    })
      .then((r) => r.json())
      .then(({ progress: records }) => {
        if (!Array.isArray(records)) return;
        setProgress((prev) => {
          const next = { ...prev };
          for (const { lessonId, status } of records) {
            next[lessonId] = higher(next[lessonId], status as ProgressStatus);
          }
          saveProgress(next);
          return next;
        });
      })
      .catch(() => {});
  }, [apiUrl]);

  function postToBackend(endpoint: string, lessonId: string) {
    const jwt = getJwt();
    if (!jwt) return;
    fetch(`${apiUrl}/progress/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({ lessonId }),
    }).catch(() => {});
  }

  function markInProgress(lessonId: string) {
    setProgress((prev) => {
      if (prev[lessonId]) return prev; // already has a status — don't downgrade
      const next = { ...prev, [lessonId]: 'IN_PROGRESS' as ProgressStatus };
      saveProgress(next);
      return next;
    });
    postToBackend('in-progress', lessonId);
  }

  function markRead(lessonId: string) {
    setProgress((prev) => {
      const current = prev[lessonId];
      if (current === 'READ' || current === 'MASTERED') return prev;
      const next = { ...prev, [lessonId]: 'READ' as ProgressStatus };
      saveProgress(next);
      // Fire streak update only on the *first* transition to READ for
      // this lesson — re-reading shouldn't keep extending the streak.
      recordActivity('lesson', humanizeLessonId(lessonId));
      return next;
    });
    postToBackend('read', lessonId);
  }

  return (
    <ProgressContext.Provider value={{ progress, markInProgress, markRead }}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  return useContext(ProgressContext);
}
