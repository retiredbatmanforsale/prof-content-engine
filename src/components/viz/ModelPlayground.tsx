import React, { useEffect, useRef, useState, useCallback, ReactNode } from 'react';

// ---------- Types ----------

export type Phase = 'idle' | 'booting' | 'loading' | 'ready' | 'running' | 'error';

export interface Progress {
  file: string | null;
  loaded: number;
  total: number;
  fraction: number; // 0..1
  stage: string;    // 'initiate' | 'download' | 'progress' | 'done' | 'ready' | ''
}

export type Device = 'webgpu' | 'wasm' | 'unknown';

export type WorkerMessage =
  | { type: 'ready'; device: Device }
  | { type: 'progress'; id: number; stage: string; file: string | null; loaded: number; total: number; progress: number | null }
  | { type: 'status'; id: number; message: string }
  | { type: 'token'; id: number; step: number; tokenId: number; token: string; topK: { id: number; token: string; p: number }[] }
  | { type: 'result'; id: number; [k: string]: any }
  | { type: 'error'; id: number; message: string }
  | { type: 'init_error'; message: string };

export type RunRequest =
  | { task: 'tokenize'; modelId: string; text: string }
  | { task: 'embed'; modelId: string; texts: string | string[] }
  | { task: 'forward'; modelId: string; text: string; kind?: 'causal' | 'encoder'; returnAttentions?: boolean; returnHiddenStates?: boolean }
  | { task: 'generate'; modelId: string; text: string; maxNewTokens?: number; temperature?: number; topK?: number; topP?: number; streamTopK?: number }
  | { task: 'lens'; modelId: string; text: string; topK?: number }
  | { task: 'classify'; modelId: string; image: any; candidateLabels?: string[] }
  | { task: 'vit-forward'; modelId: string; image: any; returnAttentions?: boolean }
  | { task: 'compare'; modelId: string; text: string; topK?: number; variants: Array<{ modelId?: string; dtype: string; label?: string }> };

export interface RunHandlers {
  onToken?: (t: { step: number; tokenId: number; token: string; topK: { id: number; token: string; p: number }[] }) => void;
  onProgress?: (p: Progress) => void;
}

// ---------- Hook ----------

let runIdCounter = 0;

export function useTransformers(opts: { preload?: boolean } = {}) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [device, setDevice] = useState<Device>('unknown');
  const [progress, setProgress] = useState<Progress>({ file: null, loaded: 0, total: 0, fraction: 0, stage: '' });
  const [error, setError] = useState<string | null>(null);

  const workerRef = useRef<Worker | null>(null);
  const readyRef = useRef(false);
  const pendingRef = useRef(new Map<number, {
    resolve: (v: any) => void;
    reject: (e: Error) => void;
    handlers?: RunHandlers;
  }>());

  const ensureWorker = useCallback((): Worker => {
    if (workerRef.current) return workerRef.current;
    setPhase('booting');
    const w = new Worker('/transformers-worker.js', { type: 'module' });
    w.onmessage = (e: MessageEvent<WorkerMessage>) => {
      const msg = e.data;
      switch (msg.type) {
        case 'ready':
          readyRef.current = true;
          setDevice(msg.device);
          setPhase('ready');
          break;
        case 'progress': {
          const total = msg.total || 0;
          const loaded = msg.loaded || 0;
          const fraction = msg.progress != null
            ? msg.progress / 100
            : total > 0 ? loaded / total : 0;
          const next: Progress = { file: msg.file, loaded, total, fraction, stage: msg.stage };
          setProgress(next);
          // 'progress' messages from transformers.js arrive during pipe load.
          if (msg.stage === 'download' || msg.stage === 'progress' || msg.stage === 'initiate') {
            setPhase('loading');
          }
          const entry = pendingRef.current.get(msg.id);
          entry?.handlers?.onProgress?.(next);
          break;
        }
        case 'token': {
          const entry = pendingRef.current.get(msg.id);
          entry?.handlers?.onToken?.({ step: msg.step, tokenId: msg.tokenId, token: msg.token, topK: msg.topK });
          break;
        }
        case 'result': {
          const entry = pendingRef.current.get(msg.id);
          if (entry) {
            pendingRef.current.delete(msg.id);
            entry.resolve(msg);
          }
          if (pendingRef.current.size === 0) setPhase('ready');
          break;
        }
        case 'error': {
          const entry = pendingRef.current.get(msg.id);
          if (entry) {
            pendingRef.current.delete(msg.id);
            entry.reject(new Error(msg.message));
          }
          setError(msg.message);
          setPhase('error');
          break;
        }
        case 'init_error':
          setError(msg.message);
          setPhase('error');
          break;
      }
    };
    w.onerror = (e) => {
      setError(e.message || 'Worker error');
      setPhase('error');
    };
    workerRef.current = w;
    return w;
  }, []);

  // Pre-warm: spin up the worker on mount so the WASM/WebGPU runtime is ready
  // before the user clicks Run.
  useEffect(() => {
    if (opts.preload) ensureWorker();
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
      readyRef.current = false;
      pendingRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.preload]);

  const run = useCallback(<T = any,>(req: RunRequest, handlers?: RunHandlers): Promise<T> => {
    const w = ensureWorker();
    const id = ++runIdCounter;
    setPhase((p) => (p === 'error' ? 'running' : p === 'ready' || p === 'booting' || p === 'loading' ? 'running' : 'running'));
    setError(null);
    return new Promise<T>((resolve, reject) => {
      pendingRef.current.set(id, { resolve, reject, handlers });
      w.postMessage({ type: 'run', id, ...req });
    });
  }, [ensureWorker]);

  return { phase, device, progress, error, run, ensureWorker };
}

// ---------- Component ----------

export interface ModelPlaygroundProps {
  title?: string;
  /** Friendly model name to show in the header, e.g. "GPT-2 (125 MB)". */
  modelLabel?: string;
  /** When true, the worker boots on mount instead of on first Run click. */
  preload?: boolean;
  /** State from useTransformers, threaded through so the wrapper can show banners. */
  state: {
    phase: Phase;
    device: Device;
    progress: Progress;
    error: string | null;
  };
  /** Optional run trigger to render in the header. */
  onRun?: () => void;
  runLabel?: string;
  runDisabled?: boolean;
  children: ReactNode;
}

export function ModelPlayground({
  title,
  modelLabel,
  state,
  onRun,
  runLabel = '▶ Run',
  runDisabled,
  children,
}: ModelPlaygroundProps) {
  const { phase, device, progress, error } = state;
  const isWorking = phase === 'booting' || phase === 'loading' || phase === 'running';
  const showColdStart = phase === 'booting' || phase === 'loading';

  const buttonLabel =
    phase === 'booting' ? 'Starting…'
    : phase === 'loading' ? `Downloading model… ${Math.round(progress.fraction * 100)}%`
    : phase === 'running' ? 'Running…'
    : runLabel;

  return (
    <div className="not-prose my-8">
      <div className="rounded-2xl overflow-hidden border border-slate-700/50 bg-slate-950 font-mono text-sm">

        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-800 bg-slate-900/60">
          <span className="flex items-center gap-1.5 text-xs text-violet-400 font-sans font-semibold">
            <span className="inline-block w-2 h-2 rounded-full bg-violet-400" />
            {title ?? 'Model'}
          </span>
          {modelLabel && (
            <span className="text-[10px] font-sans text-slate-500 px-2 py-0.5 rounded bg-slate-800/80">
              {modelLabel}
            </span>
          )}
          {device !== 'unknown' && (
            <span className={`text-[10px] font-sans px-2 py-0.5 rounded ${
              device === 'webgpu' ? 'bg-emerald-900/40 text-emerald-400' : 'bg-amber-900/40 text-amber-400'
            }`}>
              {device === 'webgpu' ? 'WebGPU' : 'WASM'}
            </span>
          )}
          <span className="flex-1" />
          {onRun && (
            <button
              onClick={onRun}
              disabled={isWorking || runDisabled}
              className={`px-4 py-1 rounded-lg text-xs font-sans font-semibold transition-colors flex items-center gap-1.5 ${
                isWorking || runDisabled
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-violet-600 text-white hover:bg-violet-500'
              }`}
            >
              {isWorking && (
                <span className="inline-block w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              )}
              {buttonLabel}
            </button>
          )}
        </div>

        {/* Children: the demo's own UI */}
        <div>{children}</div>

        {/* Cold-start / download banner */}
        {showColdStart && (
          <div className="border-t border-slate-800 px-4 py-3 flex items-start gap-3">
            <span className="mt-0.5 flex-shrink-0 inline-block w-3.5 h-3.5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            <div className="font-sans flex-1 min-w-0">
              <p className="text-xs text-slate-300 leading-snug">
                {phase === 'booting' ? 'Booting the inference runtime…' : 'Downloading model weights…'}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug truncate">
                {progress.file ? `${progress.file} — ` : ''}
                Cached after the first load. Future runs are instant.
              </p>
              {progress.fraction > 0 && (
                <div className="mt-2 h-1 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-violet-500 transition-all"
                    style={{ width: `${Math.min(100, Math.max(0, progress.fraction * 100))}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error banner */}
        {phase === 'error' && error && (
          <div className="border-t border-red-900/50 px-4 py-3 bg-red-950/30">
            <p className="text-xs text-red-300 font-sans leading-snug">Something went wrong</p>
            <p className="text-[11px] text-red-400/80 font-mono mt-1 whitespace-pre-wrap break-all max-h-32 overflow-y-auto">
              {error}
            </p>
          </div>
        )}

        {/* Idle hint (only for non-preloaded demos) */}
        {phase === 'idle' && (
          <div className="px-4 py-2 border-t border-slate-800/50 text-[11px] text-slate-600 font-sans">
            First run downloads the model — happens once, then cached in your browser.
          </div>
        )}
      </div>
    </div>
  );
}

export default ModelPlayground;
