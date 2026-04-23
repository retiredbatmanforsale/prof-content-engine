import React, {useState} from 'react';

const DIFFICULTY_STYLES = {
  Conceptual: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  Math: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300',
  'System Design': 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
};

const COMPANY_STYLES = {
  Google: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  Amazon: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  Meta: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  Microsoft: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
  Apple: 'bg-slate-100 text-slate-700 dark:bg-slate-700/40 dark:text-slate-300',
  Netflix: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
};

export default function InterviewQuestion({number, difficulty, company, question, children}) {
  const [revealed, setRevealed] = useState(false);

  const companies = Array.isArray(company) ? company : company ? [company] : [];

  return (
    <div className="my-6 rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500">Q{number}</span>
          {difficulty && (
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${DIFFICULTY_STYLES[difficulty] ?? DIFFICULTY_STYLES.Conceptual}`}
            >
              {difficulty}
            </span>
          )}
          {companies.map((c) => (
            <span
              key={c}
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${COMPANY_STYLES[c] ?? 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}`}
            >
              {c}
            </span>
          ))}
        </div>
        <p className="m-0 text-base font-semibold text-slate-900 dark:text-slate-100">{question}</p>
      </div>

      <div className="border-t border-slate-100 px-5 py-3 dark:border-slate-800">
        <button
          onClick={() => setRevealed((r) => !r)}
          className="flex cursor-pointer items-center gap-1.5 border-none bg-transparent p-0 text-sm font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
        >
          {revealed ? '▲ Hide answer' : '▼ Reveal answer'}
        </button>
      </div>

      {revealed && (
        <div className="prose prose-sm max-w-none border-t border-slate-100 px-5 py-4 dark:prose-invert dark:border-slate-800">
          {children}
        </div>
      )}
    </div>
  );
}
