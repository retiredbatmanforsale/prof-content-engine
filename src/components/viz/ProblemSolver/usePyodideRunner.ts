import { useCallback, useEffect, useRef, useState } from 'react';

export type Phase = 'idle' | 'loading' | 'running' | 'done' | 'error';

export interface TestResult {
  name: string;
  status: 'pass' | 'fail';
  message: string | null;
  ms: number;
}

interface RunnerState {
  phase: Phase;
  statusMsg: string;
  results: TestResult[] | null;
  stdout: string;
  stderr: string;
  workerReady: boolean;
}

let runIdCounter = 0;

export function usePyodideRunner() {
  const [state, setState] = useState<RunnerState>({
    phase: 'idle',
    statusMsg: '',
    results: null,
    stdout: '',
    stderr: '',
    workerReady: false,
  });

  const workerRef = useRef<Worker | null>(null);
  const pendingIdRef = useRef<number>(-1);

  useEffect(() => {
    return () => { workerRef.current?.terminate(); };
  }, []);

  const getOrCreateWorker = useCallback((): Worker => {
    if (workerRef.current) return workerRef.current;
    const w = new Worker('/pyodide-worker.js');
    w.onmessage = (e) => {
      const { type, id, message, stdout, stderr, testResults } = e.data;
      if (id !== undefined && id !== pendingIdRef.current) return;
      switch (type) {
        case 'ready':
          setState((s) => ({ ...s, workerReady: true, statusMsg: 'Running tests…' }));
          break;
        case 'status':
          setState((s) => ({ ...s, statusMsg: message }));
          break;
        case 'result':
          setState((s) => ({
            ...s,
            stdout: stdout || '',
            stderr: stderr || '',
            results: testResults || [],
            phase: 'done',
            statusMsg: '',
          }));
          pendingIdRef.current = -1;
          break;
        case 'error':
        case 'init_error':
          setState((s) => ({
            ...s,
            stdout: '',
            stderr: message || 'unknown error',
            results: null,
            phase: 'error',
            statusMsg: '',
          }));
          pendingIdRef.current = -1;
          break;
      }
    };
    workerRef.current = w;
    return w;
  }, []);

  const runTests = useCallback((code: string, tests: string) => {
    setState((s) => ({
      ...s,
      results: null,
      stdout: '',
      stderr: '',
      phase: 'loading',
      statusMsg: 'Loading Python runtime…',
    }));
    const w = getOrCreateWorker();
    const reqId = ++runIdCounter;
    pendingIdRef.current = reqId;
    w.postMessage({ type: 'run_with_tests', code, tests, id: reqId });
  }, [getOrCreateWorker]);

  const reset = useCallback(() => {
    setState({
      phase: 'idle',
      statusMsg: '',
      results: null,
      stdout: '',
      stderr: '',
      workerReady: state.workerReady,
    });
  }, [state.workerReady]);

  return { ...state, runTests, reset };
}
