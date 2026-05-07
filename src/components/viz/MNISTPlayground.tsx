import React, { useEffect, useRef, useState, useCallback } from 'react';
import Distribution from './tensors/Distribution';

/**
 * MNISTPlayground — draw a digit on a 280×280 canvas, watch a tiny CNN classify
 * it live. Uses /static/mnist-worker.js (onnxruntime-web + mnist-12) so all
 * inference is client-side. ~30KB model, ~5MB ORT-WASM runtime.
 */

const SIZE = 280;        // drawing canvas size in CSS pixels
const GRID = 28;         // model input grid
const PEN_DEFAULT = 22;  // pen size in CSS pixels (white-on-black drawing)

type Phase = 'booting' | 'ready' | 'running' | 'error';

export default function MNISTPlayground() {
  const drawRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const drawingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const pendingPredictRef = useRef<number | null>(null);

  const [phase, setPhase] = useState<Phase>('booting');
  const [error, setError] = useState<string | null>(null);
  const [probs, setProbs] = useState<number[] | null>(null);
  const [pred, setPred] = useState<number | null>(null);
  const [pen, setPen] = useState(PEN_DEFAULT);
  const [autoPredict, setAutoPredict] = useState(true);
  const [inferenceMs, setInferenceMs] = useState<number | null>(null);

  // ---------- Worker setup ----------
  useEffect(() => {
    const w = new Worker('/mnist-worker.js', { type: 'module' });
    w.onmessage = (e) => {
      const msg = e.data;
      switch (msg.type) {
        case 'ready':
          setPhase('ready');
          break;
        case 'result':
          setProbs(msg.probs);
          setPred(msg.pred);
          setPhase('ready');
          break;
        case 'error':
        case 'init_error':
          setError(msg.message);
          setPhase('error');
          break;
      }
    };
    w.onerror = (ev) => { setError(ev.message || 'Worker error'); setPhase('error'); };
    workerRef.current = w;
    return () => { w.terminate(); workerRef.current = null; };
  }, []);

  // ---------- Canvas setup ----------
  useEffect(() => {
    const canvas = drawRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    canvas.style.width = SIZE + 'px';
    canvas.style.height = SIZE + 'px';
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#fff';
  }, []);

  // ---------- Drawing ----------
  function getPos(e: React.MouseEvent | React.TouchEvent): { x: number; y: number } {
    const canvas = drawRef.current!;
    const rect = canvas.getBoundingClientRect();
    const isTouch = 'touches' in e;
    const clientX = isTouch ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = isTouch ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    drawingRef.current = true;
    const { x, y } = getPos(e);
    lastPosRef.current = { x, y };
    const ctx = drawRef.current!.getContext('2d')!;
    ctx.beginPath();
    ctx.arc(x, y, pen / 2, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
  }

  function moveDraw(e: React.MouseEvent | React.TouchEvent) {
    if (!drawingRef.current) return;
    e.preventDefault();
    const { x, y } = getPos(e);
    const last = lastPosRef.current!;
    const ctx = drawRef.current!.getContext('2d')!;
    ctx.lineWidth = pen;
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    lastPosRef.current = { x, y };
    if (autoPredict) schedulePredict();
  }

  function endDraw() {
    drawingRef.current = false;
    lastPosRef.current = null;
    if (autoPredict) schedulePredict(true);
  }

  // ---------- Throttled prediction ----------
  const schedulePredict = useCallback((immediate = false) => {
    if (pendingPredictRef.current != null) return; // already queued
    const fire = () => {
      pendingPredictRef.current = null;
      runPredict();
    };
    pendingPredictRef.current = window.setTimeout(fire, immediate ? 0 : 80);
  }, []);

  const runPredict = useCallback(() => {
    const w = workerRef.current;
    if (!w || phase !== 'ready') return;
    const drawCanvas = drawRef.current!;
    const previewCanvas = previewRef.current!;
    const previewCtx = previewCanvas.getContext('2d')!;
    // Downsample 280×280 → 28×28 by drawing into the preview canvas with smoothing.
    previewCanvas.width = GRID;
    previewCanvas.height = GRID;
    previewCtx.imageSmoothingEnabled = true;
    previewCtx.imageSmoothingQuality = 'high';
    previewCtx.fillStyle = '#000';
    previewCtx.fillRect(0, 0, GRID, GRID);
    previewCtx.drawImage(drawCanvas, 0, 0, GRID, GRID);
    const img = previewCtx.getImageData(0, 0, GRID, GRID);
    const input = new Float32Array(GRID * GRID);
    let nonZero = 0;
    for (let i = 0; i < input.length; i++) {
      // Use the red channel — drawing is white on black, so R == G == B.
      const v = img.data[i * 4] / 255;
      input[i] = v;
      if (v > 0.05) nonZero++;
    }
    if (nonZero < 4) {
      setProbs(null);
      setPred(null);
      return;
    }
    setPhase('running');
    const t0 = performance.now();
    const id = Date.now();
    const onMessage = (e: MessageEvent) => {
      if (e.data?.id === id && e.data?.type === 'result') {
        setInferenceMs(performance.now() - t0);
        w.removeEventListener('message', onMessage);
      }
    };
    w.addEventListener('message', onMessage);
    w.postMessage({ type: 'run', id, input });
  }, [phase]);

  function clearCanvas() {
    const ctx = drawRef.current!.getContext('2d')!;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, SIZE, SIZE);
    setProbs(null);
    setPred(null);
    setInferenceMs(null);
  }

  const items = (probs ?? Array(10).fill(0)).map((p, i) => ({ label: String(i), value: p }));

  return (
    <div className="not-prose my-8">
      <div className="rounded-2xl overflow-hidden border border-slate-700/50 bg-slate-950 font-mono text-sm">

        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-800 bg-slate-900/60">
          <span className="flex items-center gap-1.5 text-xs text-violet-400 font-sans font-semibold">
            <span className="inline-block w-2 h-2 rounded-full bg-violet-400" />
            MNIST CNN
          </span>
          <span className="text-[10px] font-sans text-slate-500 px-2 py-0.5 rounded bg-slate-800/80">
            ~30KB model · onnxruntime-web
          </span>
          {inferenceMs != null && (
            <span className="text-[10px] font-sans text-emerald-400 px-2 py-0.5 rounded bg-emerald-900/30">
              {inferenceMs.toFixed(1)}ms
            </span>
          )}
          <span className="flex-1" />
          <label className="text-[11px] font-sans text-slate-400 flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={autoPredict}
              onChange={(e) => setAutoPredict(e.target.checked)}
              className="accent-violet-500"
            />
            auto-predict
          </label>
          <button
            onClick={runPredict}
            disabled={phase !== 'ready'}
            className={`px-3 py-1 rounded-lg text-xs font-sans font-semibold ${
              phase !== 'ready'
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                : 'bg-violet-600 text-white hover:bg-violet-500'
            }`}
          >
            Predict
          </button>
          <button
            onClick={clearCanvas}
            className="px-3 py-1 rounded-lg text-xs font-sans text-slate-400 bg-slate-800 hover:bg-slate-700"
          >
            Clear
          </button>
        </div>

        {/* Body: drawing + prediction */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
          <div className="flex flex-col items-center gap-3">
            <canvas
              ref={drawRef}
              onMouseDown={startDraw}
              onMouseMove={moveDraw}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
              onTouchStart={startDraw}
              onTouchMove={moveDraw}
              onTouchEnd={endDraw}
              className="rounded-lg border border-slate-700 cursor-crosshair touch-none"
              style={{ background: '#000', width: SIZE, height: SIZE }}
            />
            <div className="flex items-center gap-3 text-[11px] font-sans text-slate-400 w-full max-w-[280px]">
              <span>pen</span>
              <input
                type="range"
                min={6}
                max={36}
                value={pen}
                onChange={(e) => setPen(Number(e.target.value))}
                className="flex-1 accent-violet-500"
              />
              <span className="tabular-nums w-6 text-right">{pen}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 font-sans">28×28 input</span>
              <canvas
                ref={previewRef}
                width={GRID}
                height={GRID}
                className="rounded border border-slate-800"
                style={{
                  imageRendering: 'pixelated',
                  width: 56,
                  height: 56,
                  background: '#000',
                }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-baseline gap-3">
              <span className="text-xs font-sans text-slate-500">prediction</span>
              <span className="text-5xl font-bold text-violet-300 tabular-nums">
                {pred != null ? pred : '–'}
              </span>
              {pred != null && probs && (
                <span className="text-xs font-sans text-slate-400">
                  {(probs[pred] * 100).toFixed(1)}% confident
                </span>
              )}
            </div>
            <Distribution
              items={items}
              highlightedIndex={pred ?? -1}
              asPercent
              maxLabelLen={3}
            />
          </div>
        </div>

        {/* Cold-start banner */}
        {phase === 'booting' && (
          <div className="border-t border-slate-800 px-4 py-3 flex items-start gap-3">
            <span className="mt-0.5 flex-shrink-0 inline-block w-3.5 h-3.5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-300 font-sans leading-snug">
              Loading the CNN runtime… (~5 MB, cached after first load)
            </p>
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
      </div>
    </div>
  );
}
