import React, { useEffect, useState, useCallback, ReactNode, lazy, Suspense } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from 'react-resizable-panels';

import { usePyodideRunner } from './usePyodideRunner';

function useInPracticePage(): boolean {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { useDoc } = require('@docusaurus/plugin-content-docs/client');
    const doc = useDoc();
    return !!doc?.frontMatter?.practice_mode;
  } catch {
    return false;
  }
}

const MonacoEditor = lazy(() =>
  import('@monaco-editor/react').then((m) => ({ default: m.default }))
);

type Difficulty = 'Easy' | 'Medium' | 'Hard';

interface LinkedLesson { url: string; title: string }

interface Props {
  id: string;
  title: string;
  difficulty: Difficulty;
  tags?: string[];
  linkedLessons?: LinkedLesson[];
  starter: string;
  tests: string;
  solution: string;
  hints?: string[];
  children: ReactNode;
}

type LeftTab = 'description' | 'editorial' | 'solution' | 'hint';
type BottomTab = 'testcase' | 'result';

const DIFFICULTY_STYLE: Record<Difficulty, string> = {
  Easy: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  Medium: 'text-amber-700 bg-amber-50 border-amber-200',
  Hard: 'text-red-700 bg-red-50 border-red-200',
};

export default function PracticeProblemPro(props: Props) {
  return (
    <BrowserOnly fallback={<div className="text-slate-500 text-sm">Loading practice runner…</div>}>
      {() => <PracticeProblemProInner {...props} />}
    </BrowserOnly>
  );
}

function PracticeProblemProInner({
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
}: Props) {
  const [code, setCode] = useState(starter.replace(/^\n/, ''));
  const [fullscreen, setFullscreen] = useState(false);
  const [leftTab, setLeftTab] = useState<LeftTab>('description');
  const [bottomTab, setBottomTab] = useState<BottomTab>('testcase');
  const [revealedHints, setRevealedHints] = useState(0);
  const [showSolution, setShowSolution] = useState(false);

  const runner = usePyodideRunner();
  const { phase, statusMsg, results, stdout, stderr, workerReady, runTests, reset: resetRunner } = runner;

  const isWorking = phase === 'loading' || phase === 'running';
  const isColdStart = isWorking && !workerReady;
  const passCount = results?.filter((r) => r.status === 'pass').length ?? 0;
  const totalCount = results?.length ?? 0;
  const allPass = totalCount > 0 && passCount === totalCount;
  const ranButEmpty = results !== null && totalCount === 0;

  useEffect(() => {
    if (results !== null) setBottomTab('result');
  }, [results]);

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setFullscreen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullscreen]);

  useEffect(() => {
    if (!fullscreen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [fullscreen]);

  const onRun = useCallback(() => runTests(code, tests), [code, tests, runTests]);

  const onReset = useCallback(() => {
    setCode(starter.replace(/^\n/, ''));
    setShowSolution(false);
    resetRunner();
  }, [starter, resetRunner]);

  const onRevealSolution = useCallback(() => {
    setCode(solution.replace(/^\n/, ''));
    setShowSolution(true);
    setLeftTab('solution');
  }, [solution]);

  const inPracticePage = useInPracticePage();

  const containerCls = fullscreen
    ? 'fixed inset-0 z-50 bg-white text-slate-800 flex flex-col'
    : inPracticePage
    ? 'bg-white text-slate-800 flex flex-col h-full'
    : 'not-prose my-6 rounded-xl overflow-hidden border border-slate-200 bg-white text-slate-800 flex flex-col shadow-sm';

  const containerStyle: React.CSSProperties = fullscreen || inPracticePage
    ? { fontFamily: 'system-ui, -apple-system, sans-serif' }
    : { height: '720px', fontFamily: 'system-ui, -apple-system, sans-serif' };

  return (
    <div className={containerCls} style={containerStyle}>
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-slate-200 bg-slate-50 flex-shrink-0">
        <span className="text-sm font-semibold text-slate-900">{title}</span>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${DIFFICULTY_STYLE[difficulty]}`}>
          {difficulty}
        </span>
        {tags.map((t) => (
          <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
            {t}
          </span>
        ))}
        <span className="flex-1" />
        <button
          onClick={() => setFullscreen((v) => !v)}
          className="text-[11px] font-medium text-slate-600 hover:text-slate-900 px-2 py-1 rounded hover:bg-slate-100 transition-colors"
          title={fullscreen ? 'Exit fullscreen (Esc)' : 'Enter fullscreen'}
        >
          {fullscreen ? '⤓ Exit fullscreen' : '⤢ Fullscreen'}
        </button>
      </div>

      {/* Body — resizable split */}
      <div className="flex-1 min-h-0">
        <PanelGroup orientation="horizontal" className="h-full">
          {/* Left pane */}
          <Panel defaultSize={45} minSize={25}>
            <div className="h-full flex flex-col bg-white">
              <TabBar
                tabs={[
                  { id: 'description', label: 'Description' },
                  { id: 'editorial', label: 'Editorial', disabled: linkedLessons.length === 0 },
                  { id: 'solution', label: 'Solution' },
                  { id: 'hint', label: `Hint${hints.length ? ` (${hints.length})` : ''}`, disabled: hints.length === 0 },
                ] as const}
                active={leftTab}
                onChange={(t) => setLeftTab(t as LeftTab)}
              />
              <div className="flex-1 overflow-auto px-6 py-5">
                {leftTab === 'description' && (
                  <div className="markdown text-slate-800 max-w-none">
                    <h2 className="text-xl font-bold m-0 mb-4 text-slate-900">{title}</h2>
                    {children}
                  </div>
                )}
                {leftTab === 'editorial' && (
                  <div className="text-slate-800">
                    <h3 className="text-base font-semibold mb-3 text-slate-900">Concept lessons</h3>
                    <p className="text-xs text-slate-600 mb-4">
                      The course lessons that introduce the underlying mechanism. Open in a new tab.
                    </p>
                    <ul className="space-y-2">
                      {linkedLessons.map((l, i) => (
                        <li key={i}>
                          <a
                            href={l.url}
                            target="_blank"
                            rel="noopener"
                            className="text-violet-600 hover:underline text-sm"
                          >
                            → {l.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {leftTab === 'solution' && (
                  <SolutionTab
                    solution={solution}
                    revealed={showSolution}
                    onReveal={onRevealSolution}
                  />
                )}
                {leftTab === 'hint' && (
                  <HintTab
                    hints={hints}
                    revealed={revealedHints}
                    onRevealNext={() => setRevealedHints((n) => n + 1)}
                  />
                )}
              </div>
            </div>
          </Panel>

          <PanelResizeHandle className="w-1 bg-slate-200 hover:bg-violet-500 transition-colors" />

          {/* Right pane */}
          <Panel defaultSize={55} minSize={30}>
            <PanelGroup orientation="vertical" className="h-full">
              {/* Editor */}
              <Panel defaultSize={62} minSize={20}>
                <div className="h-full flex flex-col bg-white">
                  <div className="flex items-center gap-3 px-4 py-2 border-b border-slate-200 bg-slate-50 flex-shrink-0">
                    <span className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                      Python · numpy
                    </span>
                    <span className="flex-1" />
                    <button
                      onClick={onReset}
                      className="px-2.5 py-1 rounded text-xs text-slate-700 bg-white hover:bg-slate-100 border border-slate-200"
                    >
                      Reset
                    </button>
                    <button
                      onClick={onRun}
                      disabled={isWorking}
                      className={`px-3.5 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                        isWorking
                          ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                          : 'bg-emerald-600 text-white hover:bg-emerald-500'
                      }`}
                    >
                      {isWorking ? (
                        <>
                          <span className="inline-block w-3 h-3 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                          {statusMsg || 'Working…'}
                        </>
                      ) : (
                        <>▶ Run tests</>
                      )}
                    </button>
                  </div>
                  <div className="flex-1 min-h-0">
                    <Suspense fallback={<EditorFallback code={code} onChange={setCode} />}>
                      <MonacoEditor
                        height="100%"
                        defaultLanguage="python"
                        value={code}
                        onChange={(v) => setCode(v ?? '')}
                        theme="vs"
                        options={{
                          fontSize: 13,
                          minimap: { enabled: false },
                          scrollBeyondLastLine: false,
                          tabSize: 4,
                          insertSpaces: true,
                          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                          renderLineHighlight: 'gutter',
                          padding: { top: 12, bottom: 12 },
                        }}
                      />
                    </Suspense>
                  </div>
                </div>
              </Panel>

              <PanelResizeHandle className="h-1 bg-slate-200 hover:bg-violet-500 transition-colors" />

              {/* Bottom: Testcase / Result tabs */}
              <Panel defaultSize={38} minSize={15}>
                <div className="h-full flex flex-col bg-white">
                  <TabBar
                    tabs={[
                      { id: 'testcase', label: 'Testcase' },
                      { id: 'result', label: results ? `Test Result · ${passCount}/${totalCount}` : 'Test Result' },
                    ] as const}
                    active={bottomTab}
                    onChange={(t) => setBottomTab(t as BottomTab)}
                  />
                  <div className="flex-1 overflow-auto">
                    {bottomTab === 'testcase' && <TestcaseTab tests={tests} />}
                    {bottomTab === 'result' && (
                      <ResultTab
                        results={results}
                        ranButEmpty={ranButEmpty}
                        allPass={allPass}
                        passCount={passCount}
                        totalCount={totalCount}
                        isColdStart={isColdStart}
                        statusMsg={statusMsg}
                        stdout={stdout}
                        stderr={stderr}
                        phase={phase}
                      />
                    )}
                  </div>
                </div>
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}

// ---------- subcomponents ----------

function TabBar<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: ReadonlyArray<{ id: T; label: string; disabled?: boolean }>;
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex border-b border-slate-200 bg-slate-50 flex-shrink-0">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => !t.disabled && onChange(t.id)}
          disabled={t.disabled}
          className={`px-4 py-2 text-xs font-medium transition-colors border-b-2 ${
            active === t.id
              ? 'text-slate-900 border-violet-600 bg-white'
              : t.disabled
              ? 'text-slate-400 border-transparent cursor-not-allowed'
              : 'text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function HintTab({
  hints,
  revealed,
  onRevealNext,
}: {
  hints: string[];
  revealed: number;
  onRevealNext: () => void;
}) {
  return (
    <div className="space-y-3">
      {hints.slice(0, revealed).map((h, i) => (
        <div key={i} className="text-sm text-amber-900 leading-relaxed">
          <span className="text-amber-700 font-semibold mr-1">Hint {i + 1}:</span> {h}
        </div>
      ))}
      {revealed < hints.length ? (
        <button
          onClick={onRevealNext}
          className="text-xs px-3 py-1.5 rounded bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
        >
          Show hint {revealed + 1} of {hints.length}
        </button>
      ) : (
        <p className="text-xs text-slate-500">All hints revealed.</p>
      )}
    </div>
  );
}

function SolutionTab({
  solution,
  revealed,
  onReveal,
}: {
  solution: string;
  revealed: boolean;
  onReveal: () => void;
}) {
  if (!revealed) {
    return (
      <div>
        <p className="text-sm text-slate-700 mb-4 leading-relaxed">
          The reference solution is hidden until you ask. Working through hints + tests first usually teaches more.
        </p>
        <button
          onClick={onReveal}
          className="text-xs px-3 py-1.5 rounded bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200"
        >
          Reveal solution
        </button>
      </div>
    );
  }
  return (
    <div>
      <p className="text-xs text-violet-700 mb-3">
        Solution loaded into the editor. Press Run to verify it passes every test.
      </p>
      <pre className="text-[11px] text-slate-800 font-mono whitespace-pre-wrap bg-slate-50 p-3 rounded border border-slate-200">
        {solution.replace(/^\n/, '')}
      </pre>
    </div>
  );
}

function TestcaseTab({ tests }: { tests: string }) {
  const testNames = (tests.match(/@__test__\("([^"]+)"\)/g) || [])
    .map((s) => s.match(/"([^"]+)"/)?.[1])
    .filter(Boolean) as string[];

  return (
    <div className="px-4 py-4 text-xs text-slate-700">
      <p className="text-slate-600 mb-3 leading-relaxed">
        This problem ships {testNames.length} hidden test{testNames.length === 1 ? '' : 's'}. They run in your browser via Pyodide — no backend, no submission queue. Press <span className="text-emerald-700 font-semibold">▶ Run tests</span> to execute.
      </p>
      <ul className="space-y-1.5">
        {testNames.map((n, i) => (
          <li key={i} className="flex items-start gap-2 text-slate-700">
            <span className="text-slate-400 mt-0.5">•</span>
            <span>{n}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ResultTab({
  results,
  ranButEmpty,
  allPass,
  passCount,
  totalCount,
  isColdStart,
  statusMsg,
  stdout,
  stderr,
  phase,
}: {
  results: ReturnType<typeof usePyodideRunner>['results'];
  ranButEmpty: boolean;
  allPass: boolean;
  passCount: number;
  totalCount: number;
  isColdStart: boolean;
  statusMsg: string;
  stdout: string;
  stderr: string;
  phase: string;
}) {
  if (isColdStart) {
    return (
      <div className="px-4 py-4 flex items-start gap-3">
        <span className="mt-0.5 inline-block w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <div>
          <p className="text-xs text-slate-700">Setting up Python environment…</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            ~5–10 seconds on first run, then instant for the rest of the session.
          </p>
        </div>
      </div>
    );
  }

  if (results === null) {
    return (
      <div className="px-4 py-4 text-xs text-slate-500">
        Run the tests to see results here.
      </div>
    );
  }

  if (ranButEmpty) {
    return (
      <div className="px-4 py-4 bg-amber-50">
        <p className="text-xs text-amber-700">
          The harness ran but no tests registered. Check stderr below.
        </p>
        {stderr && (
          <pre className="mt-2 text-[11px] text-red-700 font-mono whitespace-pre-wrap">{stderr}</pre>
        )}
      </div>
    );
  }

  return (
    <div>
      {allPass && (
        <div className="px-4 py-2.5 bg-emerald-50 border-b border-emerald-200 text-xs text-emerald-700">
          🎉 All {totalCount} tests passing.
        </div>
      )}
      <ul className="divide-y divide-slate-200">
        {results.map((r, i) => (
          <li key={i} className="flex items-start gap-3 px-4 py-2.5">
            <span className={`mt-0.5 flex-shrink-0 inline-flex w-4 h-4 rounded text-[10px] items-center justify-center font-bold ${
              r.status === 'pass' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
            }`}>
              {r.status === 'pass' ? '✓' : '✗'}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-slate-800">{r.name}</span>
                <span className="text-[10px] text-slate-400 font-mono">{r.ms.toFixed(1)} ms</span>
              </div>
              {r.message && (
                <pre className="text-[11px] text-red-700 font-mono mt-1 whitespace-pre-wrap break-words leading-relaxed">{r.message}</pre>
              )}
            </div>
          </li>
        ))}
      </ul>
      {stderr && phase === 'done' && (
        <div className="px-4 py-2.5 bg-red-50 border-t border-red-200">
          <p className="text-[10px] uppercase tracking-wider text-red-700 mb-1">stderr</p>
          <pre className="text-[11px] text-red-700 font-mono whitespace-pre-wrap break-words">{stderr}</pre>
        </div>
      )}
      {stdout && (
        <details className="border-t border-slate-200">
          <summary className="px-4 py-2 cursor-pointer text-[11px] text-slate-500 hover:text-slate-800">
            stdout
          </summary>
          <pre className="px-4 pb-3 text-[11px] text-slate-700 font-mono whitespace-pre-wrap">{stdout}</pre>
        </details>
      )}
    </div>
  );
}

function EditorFallback({ code, onChange }: { code: string; onChange: (s: string) => void }) {
  return (
    <textarea
      value={code}
      onChange={(e) => onChange(e.target.value)}
      spellCheck={false}
      className="w-full h-full bg-white text-slate-800 font-mono text-xs p-3 outline-none resize-none"
    />
  );
}
