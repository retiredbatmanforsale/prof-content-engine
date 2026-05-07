import React, { useEffect, useRef, useState, useCallback, ReactNode } from 'react';

/**
 * PracticeProblem — LeetCode-style ML practice problem with a Pyodide-backed
 * test runner. The problem statement is the children prop; the editor + test
 * panel render below.
 *
 * Tests are written in Python using the @__test__("Name") decorator that the
 * worker injects:
 *
 *     @__test__("Sums to 1")
 *     def t():
 *         x = np.array([0.5, 1.5, -2.0])
 *         assert np.isclose(softmax(x).sum(), 1.0)
 *
 * Each decorated function runs once; failures are caught per-test.
 */

type Phase = 'idle' | 'loading' | 'running' | 'done' | 'error';
type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface TestResult {
  name: string;
  status: 'pass' | 'fail';
  message: string | null;
  ms: number;
}

interface LinkedLesson { url: string; title: string }

interface Props {
  id: string;
  title: string;
  difficulty: Difficulty;
  tags?: string[];
  /** Lessons that introduce the underlying concept — rendered as backlinks. */
  linkedLessons?: LinkedLesson[];
  /** Starter code (visible to the user). */
  starter: string;
  /** Hidden test harness — Python code using @__test__ decorators. */
  tests: string;
  /** Reference solution, revealed on demand. */
  solution: string;
  /** Optional progressive hints. */
  hints?: string[];
  /** Problem statement / description as MDX children. */
  children: ReactNode;
  minLines?: number;
}

let runIdCounter = 0;

export default function PracticeProblem({
  id,
  title,
  difficulty,
  tags = [],
  linkedLessons = [],
  starter,
  tests,
  solution,
  hints = [],
  children,
  minLines = 12,
}: Props) {
  const [code, setCode] = useState(starter.replace(/^\n/, ''));
  const [phase, setPhase] = useState<Phase>('idle');
  const [statusMsg, setStatusMsg] = useState('');
  const [results, setResults] = useState<TestResult[] | null>(null);
  const [stdout, setStdout] = useState('');
  const [stderr, setStderr] = useState('');
  const [revealedHints, setRevealedHints] = useState(0);
  const [showSolution, setShowSolution] = useState(false);

  const workerRef = useRef<Worker | null>(null);
  const workerReadyRef = useRef(false);
  const pendingIdRef = useRef<number>(-1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    return () => { workerRef.current?.terminate(); };
  }, []);

  function getOrCreateWorker(): Worker {
    if (workerRef.current) return workerRef.current;
    const w = new Worker('/pyodide-worker.js');
    w.onmessage = (e) => {
      const { type, id, message, stdout, stderr, testResults } = e.data;
      if (id !== undefined && id !== pendingIdRef.current) return;
      switch (type) {
        case 'ready':
          workerReadyRef.current = true;
          setStatusMsg('Running tests…');
          break;
        case 'status':
          setStatusMsg(message);
          break;
        case 'result':
          setStdout(stdout || '');
          setStderr(stderr || '');
          setResults(testResults || []);
          setPhase('done');
          setStatusMsg('');
          pendingIdRef.current = -1;
          break;
        case 'error':
        case 'init_error':
          setStdout('');
          setStderr(message || 'unknown error');
          setResults(null);
          setPhase('error');
          setStatusMsg('');
          pendingIdRef.current = -1;
          break;
      }
    };
    workerRef.current = w;
    return w;
  }

  const runTests = useCallback(() => {
    setResults(null);
    setStdout(''); setStderr('');
    setPhase('loading');
    setStatusMsg('Loading Python runtime…');
    const w = getOrCreateWorker();
    const reqId = ++runIdCounter;
    pendingIdRef.current = reqId;
    w.postMessage({ type: 'run_with_tests', code, tests, id: reqId });
  }, [code, tests]);

  function reset() {
    setCode(starter.replace(/^\n/, ''));
    setResults(null);
    setStdout(''); setStderr('');
    setPhase('idle');
    setStatusMsg('');
    textareaRef.current?.focus();
  }

  function applySolution() {
    setCode(solution.replace(/^\n/, ''));
    setShowSolution(true);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== 'Tab') return;
    e.preventDefault();
    const el = e.currentTarget;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = code.slice(0, start) + '    ' + code.slice(end);
    setCode(next);
    requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = start + 4; });
  }

  const lineCount = Math.max(minLines, code.split('\n').length + 1);
  const isWorking = phase === 'loading' || phase === 'running';
  const isColdStart = isWorking && !workerReadyRef.current;

  const passCount = results?.filter((r) => r.status === 'pass').length ?? 0;
  const totalCount = results?.length ?? 0;
  const allPass = totalCount > 0 && passCount === totalCount;
  const ranButEmpty = results !== null && totalCount === 0;

  const buttonLabel =
    statusMsg === 'Loading Python runtime…' ? 'Starting up…'
    : statusMsg === 'Installing packages…' ? 'Loading packages…'
    : statusMsg === 'Running tests…' ? 'Running…'
    : statusMsg || 'Working…';

  const difficultyColor: Record<Difficulty, string> = {
    Easy:   'bg-emerald-900/40 text-emerald-300 border-emerald-800/40',
    Medium: 'bg-amber-900/40 text-amber-300 border-amber-800/40',
    Hard:   'bg-red-900/40 text-red-300 border-red-800/40',
  };

  return (
    <div className="not-prose my-6">
      {/* Title row — full width, no card */}
      <div className="flex items-baseline flex-wrap gap-3 mb-5 pb-3 border-b border-slate-200/60 dark:border-slate-700/40">
        <h2 className="text-2xl font-bold m-0 text-slate-900 dark:text-slate-100">{title}</h2>
        <span className={`text-[10px] font-sans font-semibold px-2 py-0.5 rounded border ${difficultyColor[difficulty]}`}>
          {difficulty}
        </span>
        {tags.map((t) => (
          <span key={t} className="text-[10px] font-sans px-2 py-0.5 rounded bg-slate-200 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700/50">
            {t}
          </span>
        ))}
        <span className="flex-1" />
        {linkedLessons.length > 0 && (
          <div className="flex items-center gap-2 text-[11px] font-sans text-slate-500 dark:text-slate-500">
            <span>concept lesson:</span>
            {linkedLessons.map((l, i) => (
              <a key={i} href={l.url} className="text-violet-600 dark:text-violet-400 hover:underline">
                {l.title}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Two-pane body: statement (left) + editor (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-[5fr_6fr] gap-6 items-start">

        {/* Left pane — natural lesson prose, no card. Re-applies the markdown
            theme inside the not-prose wrapper. */}
        <div className="markdown">
          {children}
        </div>

        {/* Right pane — editor + tests in a sticky card */}
        <div className="rounded-2xl overflow-hidden border border-slate-700/50 bg-slate-950 font-mono text-sm lg:sticky lg:top-4">

        {/* Editor toolbar */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-800 bg-slate-900/60">
          <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-sans font-semibold">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
            Python · numpy
          </span>
          {results && !ranButEmpty && (
            <span className={`text-xs font-sans font-semibold px-2 py-0.5 rounded ${
              allPass ? 'bg-emerald-900/40 text-emerald-300' : 'bg-red-900/40 text-red-300'
            }`}>
              {passCount} / {totalCount} {allPass ? '✓ all passing' : 'tests'}
            </span>
          )}
          {ranButEmpty && (
            <span className="text-xs font-sans font-semibold px-2 py-0.5 rounded bg-amber-900/40 text-amber-300">
              no tests registered
            </span>
          )}
          <span className="flex-1" />
          <button
            onClick={reset}
            className="px-3 py-1 rounded-lg text-xs font-sans text-slate-400 bg-slate-800 hover:bg-slate-700"
          >
            Reset
          </button>
          <button
            onClick={runTests}
            disabled={isWorking}
            className={`px-4 py-1 rounded-lg text-xs font-sans font-semibold transition-colors flex items-center gap-1.5 ${
              isWorking
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                : 'bg-emerald-600 text-white hover:bg-emerald-500'
            }`}
          >
            {isWorking ? (
              <>
                <span className="inline-block w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                {buttonLabel}
              </>
            ) : (
              <>▶ Run tests</>
            )}
          </button>
        </div>

        {/* Code editor */}
        <div className="relative">
          <div
            aria-hidden
            className="absolute left-0 top-0 bottom-0 w-10 flex flex-col items-end pr-2 pt-3 pb-3 text-slate-700 select-none text-xs leading-6 overflow-hidden pointer-events-none"
            style={{ borderRight: '1px solid #1e293b' }}
          >
            {Array.from({ length: lineCount }, (_, i) => (
              <span key={i}>{i + 1}</span>
            ))}
          </div>
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            rows={lineCount}
            className="w-full bg-transparent text-slate-200 pl-12 pr-4 pt-3 pb-3 outline-none resize-y leading-6 text-xs"
            style={{ minHeight: `${minLines * 24 + 24}px` }}
          />
        </div>

        {/* Cold-start banner */}
        {isColdStart && (
          <div className="border-t border-slate-800 px-4 py-3 flex items-start gap-3">
            <span className="mt-0.5 flex-shrink-0 inline-block w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <div className="font-sans">
              <p className="text-xs text-slate-300 leading-snug">Setting up your Python environment…</p>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                The Python runtime loads once per session directly in your browser — no server involved. ~5–10 seconds on first run.
              </p>
            </div>
          </div>
        )}

        {/* Test results — only when tests actually registered */}
        {results && results.length > 0 && (
          <div className="border-t border-slate-800">
            <ul className="divide-y divide-slate-800/60">
              {results.map((r, i) => (
                <li key={i} className="flex items-start gap-3 px-4 py-2.5">
                  <span className={`mt-0.5 flex-shrink-0 inline-block w-4 h-4 rounded text-[10px] flex items-center justify-center font-bold ${
                    r.status === 'pass' ? 'bg-emerald-700 text-white' : 'bg-red-700 text-white'
                  }`}>
                    {r.status === 'pass' ? '✓' : '✗'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-sans text-slate-200">{r.name}</span>
                      <span className="text-[10px] text-slate-600 font-mono">{r.ms.toFixed(1)} ms</span>
                    </div>
                    {r.message && (
                      <pre className="text-[11px] text-red-300 font-mono mt-1 whitespace-pre-wrap break-words leading-relaxed">{r.message}</pre>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            {allPass && (
              <div className="px-4 py-3 bg-emerald-950/20 border-t border-emerald-900/30 text-xs font-sans text-emerald-300">
                🎉 All tests pass. Try thinking about edge cases the harness didn't cover, or peek at the reference solution to compare your approach.
              </div>
            )}
          </div>
        )}

        {/* Empty-results explainer */}
        {ranButEmpty && (
          <div className="border-t border-amber-900/40 px-4 py-3 bg-amber-950/20">
            <p className="text-xs font-sans text-amber-300 leading-snug">
              The test harness ran but didn't register any tests. Check stderr below for the diagnostic.
            </p>
          </div>
        )}

        {/* Stderr — surface always after a run, not just on error */}
        {stderr && phase === 'done' && (
          <div className="border-t border-red-900/40 px-4 py-3 bg-red-950/20">
            <p className="text-[10px] uppercase tracking-wider text-red-400 font-sans mb-1">stderr</p>
            <pre className="text-[11px] text-red-300 font-mono whitespace-pre-wrap break-words">{stderr}</pre>
          </div>
        )}

        {/* Stdout (only when present) */}
        {stdout && (
          <details className="border-t border-slate-800">
            <summary className="px-4 py-2 cursor-pointer text-[11px] font-sans text-slate-500 hover:text-slate-300">
              stdout ({stdout.split('\n').length - 1} line{stdout.split('\n').length === 2 ? '' : 's'})
            </summary>
            <pre className="px-4 pb-3 text-[11px] text-slate-300 font-mono whitespace-pre-wrap">{stdout}</pre>
          </details>
        )}

        {/* Hints + solution */}
        {(hints.length > 0 || solution) && (
          <div className="border-t border-slate-800 px-4 py-3 space-y-2">
            {hints.map((h, i) => (
              i < revealedHints ? (
                <div key={i} className="text-[11px] font-sans text-amber-300 leading-snug">
                  <span className="text-amber-500 font-semibold mr-1">Hint {i + 1}:</span> {h}
                </div>
              ) : null
            ))}
            <div className="flex flex-wrap gap-2">
              {revealedHints < hints.length && (
                <button
                  onClick={() => setRevealedHints((n) => n + 1)}
                  className="text-[11px] font-sans px-3 py-1 rounded bg-amber-900/30 text-amber-300 hover:bg-amber-900/50 border border-amber-900/40"
                >
                  Show hint {revealedHints + 1}
                </button>
              )}
              {!showSolution && (
                <button
                  onClick={applySolution}
                  className="text-[11px] font-sans px-3 py-1 rounded bg-violet-900/30 text-violet-300 hover:bg-violet-900/50 border border-violet-900/40"
                >
                  Reveal solution
                </button>
              )}
              {showSolution && (
                <span className="text-[11px] font-sans text-violet-400">
                  Solution loaded into the editor — press Run to verify.
                </span>
              )}
            </div>
          </div>
        )}
        </div>
        {/* end right pane */}
      </div>
      {/* end two-pane grid */}
    </div>
  );
}
