import React, {useMemo, useState} from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const TOKEN_KEY = 'lexai_access_token';

function decodeJwtPayload(token) {
  try {
    const base64 = token.split('.')[1];
    const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export default function Quiz({lessonId, questions = []}) {
  const {siteConfig} = useDocusaurusContext();
  const apiUrl = siteConfig.customFields?.apiUrl || '';

  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [result, setResult] = useState(null);

  const total = questions.length;
  const answeredCount = useMemo(
    () => Object.keys(answers).filter((id) => answers[id] !== undefined).length,
    [answers],
  );

  const allAnswered = total > 0 && answeredCount === total;

  function onSelect(questionId, selectedIndex) {
    setAnswers((prev) => ({...prev, [questionId]: selectedIndex}));
  }

  async function onSubmit(event) {
    event.preventDefault();

    if (!allAnswered) {
      setSubmitError('Please answer all questions before submitting.');
      return;
    }

    setSubmitError('');
    setIsSubmitting(true);

    try {
      let score = 0;
      const answerRecords = questions.map((question) => {
        const selectedIndex = answers[question.id];
        const isCorrect = selectedIndex === question.correctIndex;
        if (isCorrect) score += 1;
        return {
          questionId: question.id,
          selectedIndex,
          correctIndex: question.correctIndex,
          isCorrect,
        };
      });

      const token = typeof sessionStorage !== 'undefined'
        ? sessionStorage.getItem(TOKEN_KEY)
        : null;

      const res = await fetch(`${apiUrl}/quiz/attempts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? {Authorization: `Bearer ${token}`} : {}),
        },
        body: JSON.stringify({lessonId, score, total, answers: answerRecords}),
      });

      if (!res.ok) throw new Error('Failed to save quiz attempt.');
      const apiResult = await res.json();

      setResult({score, total, apiResult});
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit quiz attempt.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    return (
      <div className="my-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
        Quiz configuration is empty. Add at least one question.
      </div>
    );
  }

  return (
    <section className="my-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h3 className="mt-0 mb-2 text-xl font-semibold">Lesson Quiz</h3>
      <p className="mt-0 mb-4 text-sm text-slate-600 dark:text-slate-300">
        {answeredCount}/{total} answered
      </p>

      <form onSubmit={onSubmit}>
        {questions.map((question, qIndex) => (
          <fieldset
            key={question.id}
            className="mb-4 rounded-xl border border-slate-200 p-4 dark:border-slate-700"
          >
            <legend className="px-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
              Q{qIndex + 1}. {question.prompt}
            </legend>

            <div className="mt-2 space-y-2">
              {question.options.map((option, oIndex) => {
                const inputId = `${question.id}-${oIndex}`;
                return (
                  <label key={inputId} htmlFor={inputId} className="flex cursor-pointer items-center gap-2">
                    <input
                      id={inputId}
                      type="radio"
                      name={question.id}
                      value={oIndex}
                      checked={answers[question.id] === oIndex}
                      onChange={() => onSelect(question.id, oIndex)}
                    />
                    <span>{option}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}

        {submitError ? (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{submitError}</p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
        </button>
      </form>

      {result ? (
        <div className="mt-5 rounded-xl border border-emerald-300 bg-emerald-50 p-4 dark:border-emerald-700 dark:bg-emerald-950/30">
          <p className="m-0 text-sm font-semibold text-emerald-900 dark:text-emerald-200">
            Score: {result.score}/{result.total}
          </p>
        </div>
      ) : null}
    </section>
  );
}
