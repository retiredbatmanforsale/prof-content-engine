import React, { useRef, useState, useEffect } from 'react';

type Status = 'idle' | 'loading' | 'running' | 'done' | 'error';

interface RunResult {
  stdout: string;
  stderr: string;
  figures: string[];
}

let runIdCounter = 0;

interface Props {
  starter?: string;
  minLines?: number;
}

export default function PythonPlayground({ starter = '', minLines = 12 }: Props) {
  const [code, setCode] = useState(starter.trimStart());
  const [status, setStatus] = useState<Status>('idle');
  const [statusMsg, setStatusMsg] = useState('');
  const [result, setResult] = useState<RunResult | null>(null);
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
      const { type, id, message, stdout, stderr, figures } = e.data;
      if (id !== undefined && id !== pendingIdRef.current) return;
      switch (type) {
        case 'ready':
          workerReadyRef.current = true;
          setStatusMsg('Running…');
          break;
        case 'status':
          setStatusMsg(message);
          break;
        case 'result':
          setResult({ stdout, stderr, figures });
          setStatus('done');
          setStatusMsg('');
          pendingIdRef.current = -1;
          break;
        case 'error':
        case 'init_error':
          setResult({ stdout: '', stderr: message, figures: [] });
          setStatus('error');
          setStatusMsg('');
          pendingIdRef.current = -1;
          break;
      }
    };
    workerRef.current = w;
    return w;
  }

  function handleRun() {
    setResult(null);
    setStatus('loading');
    setStatusMsg('Loading Python runtime…');
    const w = getOrCreateWorker();
    const id = ++runIdCounter;
    pendingIdRef.current = id;
    // Post the run message — the worker buffers it if init is still in progress,
    // or runs immediately if already ready (second+ run).
    w.postMessage({ type: 'run', code, id });
  }

  function handleReset() {
    setCode(starter.trimStart());
    setResult(null);
    setStatus('idle');
    setStatusMsg('');
    textareaRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== 'Tab') return;
    e.preventDefault();
    const el = e.currentTarget;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = code.slice(0, start) + '    ' + code.slice(end);
    setCode(next);
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = start + 4;
    });
  }

  const lineCount = Math.max(minLines, code.split('\n').length + 1);
  const isWorking = status === 'loading' || status === 'running';
  const isColdStart = isWorking && !workerReadyRef.current;
  const hasOutput = result && (result.stdout || result.stderr || result.figures.length > 0);

  // Human-readable label for the Run button while working
  const buttonLabel = statusMsg === 'Loading Python runtime…'
    ? 'Starting up…'
    : statusMsg === 'Installing packages…'
    ? 'Loading packages…'
    : statusMsg === 'Running…'
    ? 'Running…'
    : statusMsg || 'Working…';

  return (
    <div className="not-prose my-8">
      <div className="rounded-2xl overflow-hidden border border-slate-700/50 bg-slate-950 font-mono text-sm">

        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-800 bg-slate-900/60">
          <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-sans font-semibold">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
            Python
          </span>
          <span className="flex-1" />
          <button
            onClick={handleReset}
            className="px-3 py-1 rounded-lg text-xs font-sans text-slate-400 bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            Reset
          </button>
          <button
            onClick={handleRun}
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
              <>▶ Run</>
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
            onChange={e => setCode(e.target.value)}
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

        {/* Cold-start loading banner */}
        {isColdStart && (
          <div className="border-t border-slate-800 px-4 py-3 flex items-start gap-3">
            <span className="mt-0.5 flex-shrink-0 inline-block w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <div className="font-sans">
              <p className="text-xs text-slate-300 leading-snug">Setting up your Python environment…</p>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                The Python runtime loads once per session directly in your browser — no server involved.
                This takes about 5–10 seconds on first run. After that, execution is instant.
              </p>
            </div>
          </div>
        )}

        {/* Output */}
        {hasOutput && (
          <div className="border-t border-slate-800">
            {(result.stdout || result.stderr) && (
              <div className="px-4 py-3 text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap max-h-64 overflow-y-auto">
                {result.stdout && (
                  <span className="text-emerald-300">{result.stdout}</span>
                )}
                {result.stderr && (
                  <span className="text-red-400">{result.stdout ? '\n' : ''}{result.stderr}</span>
                )}
              </div>
            )}
            {result.figures.length > 0 && (
              <div className="px-4 pb-4 flex flex-wrap gap-3">
                {result.figures.map((fig, i) => (
                  <img
                    key={i}
                    src={`data:image/png;base64,${fig}`}
                    alt={`Figure ${i + 1}`}
                    className="max-w-full rounded-lg border border-slate-700"
                    style={{ imageRendering: 'auto' }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Idle hint */}
        {status === 'idle' && (
          <div className="px-4 py-2 border-t border-slate-800/50 text-[11px] text-slate-600 font-sans">
            First run loads the Python runtime (~10 MB) — takes ~5–10 seconds. Subsequent runs are instant.
          </div>
        )}
      </div>
    </div>
  );
}
