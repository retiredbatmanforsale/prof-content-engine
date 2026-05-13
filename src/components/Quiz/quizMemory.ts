/**
 * Client-side localStorage memory for quiz attempts.
 * Stand-in until the backend exposes a /quiz/stats GET endpoint —
 * persists per device, no cross-device sync.
 */

const KEY = 'prof_quiz_memory_v1';
const WEAK_CONCEPT_THRESHOLD = 0.7;

type AttemptRecord = {
  correct: number;
  wrong: number;
  lastSeen: number;
};

type QuizMemory = {
  attempts: Record<string, AttemptRecord>;
  concepts: Record<string, AttemptRecord>;
};

function emptyMemory(): QuizMemory {
  return { attempts: {}, concepts: {} };
}

function load(): QuizMemory {
  if (typeof window === 'undefined') return emptyMemory();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyMemory();
    const parsed = JSON.parse(raw);
    return {
      attempts: parsed.attempts ?? {},
      concepts: parsed.concepts ?? {},
    };
  } catch {
    return emptyMemory();
  }
}

function save(memory: QuizMemory): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(memory));
  } catch {
    /* quota exceeded, private mode, etc — silently drop */
  }
}

function bumpRecord(rec: AttemptRecord | undefined, isCorrect: boolean): AttemptRecord {
  const next: AttemptRecord = rec
    ? { ...rec }
    : { correct: 0, wrong: 0, lastSeen: 0 };
  if (isCorrect) next.correct += 1;
  else next.wrong += 1;
  next.lastSeen = Date.now();
  return next;
}

export function recordAttempt(
  questionId: string,
  isCorrect: boolean,
  concept?: string,
): void {
  const memory = load();
  memory.attempts[questionId] = bumpRecord(memory.attempts[questionId], isCorrect);
  if (concept) {
    memory.concepts[concept] = bumpRecord(memory.concepts[concept], isCorrect);
  }
  save(memory);
}

/** Question IDs the user has gotten wrong more often than right. */
export function getMissedQuestions(): Set<string> {
  const memory = load();
  const missed = new Set<string>();
  for (const [id, rec] of Object.entries(memory.attempts)) {
    if (rec.wrong > rec.correct) missed.add(id);
  }
  return missed;
}

/** Concept → accuracy (0-1). Concepts the user hasn't seen are absent. */
export function getConceptAccuracy(): Record<string, number> {
  const memory = load();
  const out: Record<string, number> = {};
  for (const [concept, rec] of Object.entries(memory.concepts)) {
    const total = rec.correct + rec.wrong;
    out[concept] = total > 0 ? rec.correct / total : 0;
  }
  return out;
}

export function isWeakConcept(concept: string, accuracy: Record<string, number>): boolean {
  if (!(concept in accuracy)) return false;
  return accuracy[concept] < WEAK_CONCEPT_THRESHOLD;
}
