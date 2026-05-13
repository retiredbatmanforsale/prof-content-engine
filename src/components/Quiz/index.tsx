import React, {
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { Check, X, ArrowRight, RotateCcw, BookOpen, Sparkles } from 'lucide-react';
import {
  recordAttempt,
  getMissedQuestions,
  getConceptAccuracy,
  isWeakConcept,
} from './quizMemory';
import { recordActivity as recordStreakActivity } from '@site/src/lib/streakMemory';
import styles from './styles.module.css';

const TOKEN_KEY = 'lexai_access_token';
const SCORE_ANIM_MS = 800;
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export type QuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  concept?: string;
};

export type QuizProps = {
  lessonId: string;
  questions: QuizQuestion[];
  quizId?: string;
  userId?: string;
  mode?: 'stepped' | 'all';
  drillMode?: boolean;
};

type Phase = 'answering' | 'results' | 'review';

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function useAnimatedScore(target: number, run: boolean): number {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!run) {
      setDisplay(0);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / SCORE_ANIM_MS);
      setDisplay(Math.round(easeOutCubic(t) * target));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, target]);
  return display;
}

export default function Quiz({
  lessonId,
  questions,
  mode = 'stepped',
  drillMode = false,
}: QuizProps): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  const apiUrl = (siteConfig.customFields?.apiUrl as string) || '';

  // Tier 3: filter to weak concepts if drillMode is on
  const effectiveQuestions = useMemo(() => {
    if (!drillMode) return questions;
    const accuracy = getConceptAccuracy();
    const weak = questions.filter(
      (q) => q.concept && isWeakConcept(q.concept, accuracy),
    );
    return weak.length > 0 ? weak : questions;
  }, [questions, drillMode]);

  const missedPriorAttempts = useMemo(() => getMissedQuestions(), [lessonId]);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [phase, setPhase] = useState<Phase>('answering');
  const [shakeId, setShakeId] = useState<string | null>(null);
  const submittedRef = useRef(false);

  const total = effectiveQuestions.length;
  const score = useMemo(
    () =>
      effectiveQuestions.reduce(
        (s, q) => (answers[q.id] === q.correctIndex ? s + 1 : s),
        0,
      ),
    [effectiveQuestions, answers],
  );

  const displayScore = useAnimatedScore(score, phase === 'results');

  function handleSelect(question: QuizQuestion, optionIdx: number) {
    if (revealed[question.id]) return;
    const isCorrect = optionIdx === question.correctIndex;
    setAnswers((prev) => ({ ...prev, [question.id]: optionIdx }));
    setRevealed((prev) => ({ ...prev, [question.id]: true }));
    if (!isCorrect) {
      setShakeId(question.id);
      setTimeout(() => setShakeId(null), 450);
    }
    // Tier 3: record this attempt
    recordAttempt(question.id, isCorrect, question.concept);
  }

  function handleNext() {
    if (currentIdx < total - 1) {
      setCurrentIdx((i) => i + 1);
    } else {
      finishQuiz();
    }
  }

  async function finishQuiz() {
    setPhase('results');
    if (submittedRef.current) return;
    submittedRef.current = true;

    // Streak signal — quiz completion counts as a qualifying activity.
    const quizLabel = lessonId.split('/').pop()?.replace(/[-_]/g, ' ') ?? 'Quiz';
    recordStreakActivity('quiz', `Quiz · ${quizLabel}`);

    // Fire-and-forget API submit (preserves existing /quiz/attempts behavior)
    try {
      const token =
        typeof sessionStorage !== 'undefined'
          ? sessionStorage.getItem(TOKEN_KEY)
          : null;
      const answerRecords = effectiveQuestions.map((q) => {
        const selectedIndex = answers[q.id];
        return {
          questionId: q.id,
          selectedIndex,
          correctIndex: q.correctIndex,
          isCorrect: selectedIndex === q.correctIndex,
        };
      });
      if (apiUrl) {
        await fetch(`${apiUrl}/quiz/attempts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            lessonId,
            score,
            total,
            answers: answerRecords,
          }),
        });
      }
    } catch {
      /* silent — quiz UX shouldn't break on API errors */
    }
  }

  function handleReset() {
    setCurrentIdx(0);
    setAnswers({});
    setRevealed({});
    setPhase('answering');
    setShakeId(null);
    submittedRef.current = false;
  }

  if (!Array.isArray(effectiveQuestions) || effectiveQuestions.length === 0) {
    return (
      <div className={styles.emptyNotice}>
        Quiz configuration is empty. Add at least one question.
      </div>
    );
  }

  // ── Render: Results phase ────────────────────────────────────────────────
  if (phase === 'results') {
    const pct = total > 0 ? Math.round((score / total) * 100) : 0;
    const verdict =
      pct === 100
        ? 'Perfect.'
        : pct >= 80
          ? 'Strong work.'
          : pct >= 60
            ? "You're getting it."
            : 'Worth another pass.';

    return (
      <section className={styles.quiz}>
        <div className={styles.results}>
          <div className={styles.resultBadge}>
            <Sparkles size={18} strokeWidth={1.75} />
            <span>Quiz complete</span>
          </div>
          <div className={styles.scoreBig}>
            <span className={styles.scoreNumber}>{displayScore}</span>
            <span className={styles.scoreDivider}>/</span>
            <span className={styles.scoreTotal}>{total}</span>
          </div>
          <p className={styles.verdict}>{verdict}</p>
          <div className={styles.resultActions}>
            <button
              type="button"
              onClick={() => setPhase('review')}
              className={styles.btnSecondary}
            >
              <BookOpen size={14} strokeWidth={2} />
              Review answers
            </button>
            <button
              type="button"
              onClick={handleReset}
              className={styles.btnPrimary}
            >
              <RotateCcw size={14} strokeWidth={2} />
              Try again
            </button>
          </div>
        </div>
      </section>
    );
  }

  // ── Render: Review phase ─────────────────────────────────────────────────
  if (phase === 'review') {
    return (
      <section className={styles.quiz}>
        <header className={styles.reviewHeader}>
          <h3 className={styles.title}>Review</h3>
          <button
            type="button"
            onClick={() => setPhase('results')}
            className={styles.btnGhost}
          >
            ← Back to score
          </button>
        </header>
        <ol className={styles.reviewList}>
          {effectiveQuestions.map((q, idx) => {
            const userIdx = answers[q.id];
            const wasCorrect = userIdx === q.correctIndex;
            return (
              <li key={q.id} className={styles.reviewItem}>
                <div className={styles.reviewItemHead}>
                  <span
                    className={
                      wasCorrect ? styles.reviewBadgeOk : styles.reviewBadgeBad
                    }
                  >
                    {wasCorrect ? (
                      <Check size={12} strokeWidth={3} />
                    ) : (
                      <X size={12} strokeWidth={3} />
                    )}
                  </span>
                  <span className={styles.reviewQNum}>Q{idx + 1}</span>
                  {q.concept && (
                    <span className={styles.reviewConcept}>{q.concept}</span>
                  )}
                </div>
                <p className={styles.reviewPrompt}>{q.prompt}</p>
                <ul className={styles.reviewOptions}>
                  {q.options.map((opt, oIdx) => {
                    const isCorrect = oIdx === q.correctIndex;
                    const isUserPick = oIdx === userIdx;
                    return (
                      <li
                        key={oIdx}
                        className={
                          isCorrect
                            ? styles.reviewOptionCorrect
                            : isUserPick
                              ? styles.reviewOptionWrong
                              : styles.reviewOption
                        }
                      >
                        <span className={styles.reviewOptionLetter}>
                          {LETTERS[oIdx]}
                        </span>
                        <span>{opt}</span>
                        {isCorrect && (
                          <Check
                            size={14}
                            strokeWidth={2.5}
                            className={styles.reviewOptionIcon}
                          />
                        )}
                        {isUserPick && !isCorrect && (
                          <X
                            size={14}
                            strokeWidth={2.5}
                            className={styles.reviewOptionIcon}
                          />
                        )}
                      </li>
                    );
                  })}
                </ul>
                {q.explanation && (
                  <div className={styles.reviewExplanation}>
                    <span className={styles.reviewExplanationLabel}>Why:</span>{' '}
                    {q.explanation}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </section>
    );
  }

  // ── Render: Answering phase ──────────────────────────────────────────────
  if (mode === 'stepped') {
    const q = effectiveQuestions[currentIdx];
    const userIdx = answers[q.id];
    const isRevealed = !!revealed[q.id];
    const wasMissedBefore = missedPriorAttempts.has(q.id);

    return (
      <section className={styles.quiz}>
        <header className={styles.head}>
          <div className={styles.titleRow}>
            <h3 className={styles.title}>Check your understanding</h3>
            <span className={styles.qCount}>
              {currentIdx + 1} <span className={styles.qCountMuted}>/ {total}</span>
            </span>
          </div>
          <div className={styles.dots} role="presentation">
            {effectiveQuestions.map((dq, i) => {
              const ans = answers[dq.id];
              let cls = styles.dot;
              if (ans !== undefined) {
                cls = ans === dq.correctIndex ? styles.dotOk : styles.dotBad;
              } else if (i === currentIdx) {
                cls = styles.dotActive;
              }
              return <span key={dq.id} className={cls} aria-hidden="true" />;
            })}
          </div>
        </header>

        <article key={q.id} className={styles.card}>
          <div className={styles.cardMetaRow}>
            {q.concept && <span className={styles.conceptTag}>{q.concept}</span>}
            {wasMissedBefore && !isRevealed && (
              <span className={styles.missedBadge}>Previously missed</span>
            )}
          </div>
          <p className={styles.prompt}>{q.prompt}</p>

          <div className={styles.options}>
            {q.options.map((opt, oIdx) => {
              const isUserPick = userIdx === oIdx;
              const isCorrect = oIdx === q.correctIndex;
              const showCorrect = isRevealed && isCorrect;
              const showWrong = isRevealed && isUserPick && !isCorrect;
              const showDimmed = isRevealed && !isCorrect && !isUserPick;
              const shouldShake = shakeId === q.id && isUserPick && !isCorrect;

              const classes = [styles.option];
              if (isUserPick && !isRevealed) classes.push(styles.optionSelected);
              if (showCorrect) classes.push(styles.optionCorrect);
              if (showWrong) classes.push(styles.optionWrong);
              if (showDimmed) classes.push(styles.optionDimmed);
              if (shouldShake) classes.push(styles.optionShake);

              return (
                <button
                  type="button"
                  key={oIdx}
                  className={classes.join(' ')}
                  onClick={() => handleSelect(q, oIdx)}
                  disabled={isRevealed}
                >
                  <span className={styles.optionLetter}>{LETTERS[oIdx]}</span>
                  <span className={styles.optionText}>{opt}</span>
                  {showCorrect && (
                    <Check
                      size={16}
                      strokeWidth={2.5}
                      className={styles.optionIcon}
                    />
                  )}
                  {showWrong && (
                    <X
                      size={16}
                      strokeWidth={2.5}
                      className={styles.optionIcon}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {isRevealed && q.explanation && (
            <div className={styles.explanation}>
              <span className={styles.explanationLabel}>
                {userIdx === q.correctIndex ? 'Right —' : 'Why:'}
              </span>{' '}
              {q.explanation}
            </div>
          )}

          {isRevealed && (
            <div className={styles.cardActions}>
              <button
                type="button"
                onClick={handleNext}
                className={styles.btnPrimary}
              >
                {currentIdx < total - 1 ? 'Next' : 'See score'}
                <ArrowRight size={14} strokeWidth={2.5} />
              </button>
            </div>
          )}
        </article>
      </section>
    );
  }

  // ── Render: All-at-once mode (legacy-compatible) ─────────────────────────
  const allAnswered = effectiveQuestions.every((q) => answers[q.id] !== undefined);
  return (
    <section className={styles.quiz}>
      <header className={styles.head}>
        <div className={styles.titleRow}>
          <h3 className={styles.title}>Check your understanding</h3>
          <span className={styles.qCount}>
            {Object.keys(answers).length}{' '}
            <span className={styles.qCountMuted}>/ {total} answered</span>
          </span>
        </div>
      </header>
      {effectiveQuestions.map((q, idx) => {
        const userIdx = answers[q.id];
        const isRevealed = !!revealed[q.id];
        return (
          <article key={q.id} className={styles.card}>
            <div className={styles.cardMetaRow}>
              <span className={styles.qNum}>Q{idx + 1}</span>
              {q.concept && <span className={styles.conceptTag}>{q.concept}</span>}
            </div>
            <p className={styles.prompt}>{q.prompt}</p>
            <div className={styles.options}>
              {q.options.map((opt, oIdx) => {
                const isUserPick = userIdx === oIdx;
                const isCorrect = oIdx === q.correctIndex;
                const showCorrect = isRevealed && isCorrect;
                const showWrong = isRevealed && isUserPick && !isCorrect;
                const showDimmed = isRevealed && !isCorrect && !isUserPick;
                const shouldShake = shakeId === q.id && isUserPick && !isCorrect;

                const classes = [styles.option];
                if (isUserPick && !isRevealed) classes.push(styles.optionSelected);
                if (showCorrect) classes.push(styles.optionCorrect);
                if (showWrong) classes.push(styles.optionWrong);
                if (showDimmed) classes.push(styles.optionDimmed);
                if (shouldShake) classes.push(styles.optionShake);

                return (
                  <button
                    type="button"
                    key={oIdx}
                    className={classes.join(' ')}
                    onClick={() => handleSelect(q, oIdx)}
                    disabled={isRevealed}
                  >
                    <span className={styles.optionLetter}>{LETTERS[oIdx]}</span>
                    <span className={styles.optionText}>{opt}</span>
                  </button>
                );
              })}
            </div>
            {isRevealed && q.explanation && (
              <div className={styles.explanation}>
                <span className={styles.explanationLabel}>
                  {userIdx === q.correctIndex ? 'Right —' : 'Why:'}
                </span>{' '}
                {q.explanation}
              </div>
            )}
          </article>
        );
      })}
      <div className={styles.allActions}>
        <button
          type="button"
          onClick={finishQuiz}
          disabled={!allAnswered}
          className={styles.btnPrimary}
        >
          See score
          <ArrowRight size={14} strokeWidth={2.5} />
        </button>
      </div>
    </section>
  );
}
