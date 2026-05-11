import React, {useCallback, useEffect, useMemo, useState} from 'react';

// ─── Trajectory definition ────────────────────────────────────
const OMEGA = 0.32;
const N_STEPS = 40;

function truePosition(t: number): [number, number] {
  return [Math.cos(OMEGA * t), Math.sin(OMEGA * t)];
}

// Pre-compute the full reference circle (for dim background)
const FULL_TRAJECTORY: Array<[number, number]> = (() => {
  const arr: Array<[number, number]> = [];
  for (let i = 0; i <= N_STEPS; i++) arr.push(truePosition(i));
  return arr;
})();

// FFN: memoryless. Scatters predictions across the canvas because (x,y)
// alone doesn't say anything about direction of motion. We sample
// deterministically from sin/cos of large primes so play is reproducible.
function ffnPredict(t: number): [number, number] {
  const rx = Math.sin(t * 12.917 + 0.7) * 0.85;
  const ry = Math.cos(t * 7.331 + 1.3) * 0.85;
  return [rx, ry];
}

// RNN: hidden state carries direction → predictions track the curve.
function rnnPredict(t: number): [number, number] {
  const [tx, ty] = truePosition(t + 1);
  const noise = Math.sin(t * 7.3) * 0.035;
  return [tx + noise, ty + noise * 0.5];
}

function rmse(pairs: Array<[[number, number], [number, number]]>): number {
  if (pairs.length === 0) return 0;
  let s = 0;
  pairs.forEach(([[px, py], [tx, ty]]) => {
    const dx = px - tx;
    const dy = py - ty;
    s += dx * dx + dy * dy;
  });
  return Math.sqrt(s / pairs.length);
}

// ─── Canvas ───────────────────────────────────────────────────
interface CanvasProps {
  title: string;
  description: string;
  tone: 'rose' | 'teal';
  predTrail: Array<[number, number]>;
  trueTrail: Array<[number, number]>;
  currentPred: [number, number];
  currentTrue: [number, number];
  rmseValue: number;
}

function PredictorCanvas({title, description, tone, predTrail, trueTrail, currentPred, currentTrue, rmseValue}: CanvasProps) {
  const SIZE = 280;
  const PAD = 26;
  const inner = SIZE - PAD * 2;
  const range = 1.4;
  const toX = (x: number) => PAD + ((x + range) / (2 * range)) * inner;
  const toY = (y: number) => PAD + ((range - y) / (2 * range)) * inner;

  const palette = tone === 'rose'
    ? {predFill: '#e11d48', predFaded: 'rgba(225,29,72,0.45)', accent: '#f43f5e', ring: 'border-rose-400 bg-rose-50/60 dark:border-rose-700 dark:bg-rose-950/30', title: 'text-rose-900 dark:text-rose-200', rmsePill: 'bg-rose-100 text-rose-900 dark:bg-rose-900/50 dark:text-rose-100'}
    : {predFill: '#0d9488', predFaded: 'rgba(13,148,136,0.45)', accent: '#14b8a6', ring: 'border-teal-400 bg-teal-50/60 dark:border-teal-700 dark:bg-teal-950/30', title: 'text-teal-900 dark:text-teal-200', rmsePill: 'bg-teal-100 text-teal-900 dark:bg-teal-900/50 dark:text-teal-100'};

  return (
    <div className={`rounded-2xl border-2 p-5 ${palette.ring}`}>
      <p className={`m-0 text-base font-bold ${palette.title}`}>{title}</p>
      <p className="m-0 mt-1.5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{description}</p>
      <div className="mt-4 flex justify-center">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          width="100%"
          style={{maxWidth: SIZE, aspectRatio: '1 / 1'}}
          className="block rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
        >
          {/* Reference axes */}
          <line x1={PAD} y1={SIZE / 2} x2={SIZE - PAD} y2={SIZE / 2} stroke="#e2e8f0" strokeWidth={0.5} />
          <line x1={SIZE / 2} y1={PAD} x2={SIZE / 2} y2={SIZE - PAD} stroke="#e2e8f0" strokeWidth={0.5} />
          {/* Full true trajectory (dim reference circle) */}
          <polyline
            points={FULL_TRAJECTORY.map(([x, y]) => `${toX(x)},${toY(y)}`).join(' ')}
            fill="none"
            stroke="#94a3b8"
            strokeDasharray="3,3"
            strokeWidth={1}
            strokeOpacity={0.45}
          />
          {/* Past true points so far (filled in blue) */}
          {trueTrail.map(([tx, ty], i) => (
            <circle key={`true-${i}`} cx={toX(tx)} cy={toY(ty)} r={2.4} fill="#1d4ed8" fillOpacity={0.45} />
          ))}
          {/* Past predictions (faded) */}
          {predTrail.map(([px, py], i) => (
            <circle key={`pred-${i}`} cx={toX(px)} cy={toY(py)} r={3} fill={palette.predFaded} />
          ))}
          {/* Error line */}
          <line
            x1={toX(currentPred[0])}
            y1={toY(currentPred[1])}
            x2={toX(currentTrue[0])}
            y2={toY(currentTrue[1])}
            stroke={palette.accent}
            strokeWidth={2}
            strokeDasharray="4,3"
            opacity={0.8}
          />
          {/* Current true */}
          <circle cx={toX(currentTrue[0])} cy={toY(currentTrue[1])} r={7} fill="#1d4ed8" stroke="white" strokeWidth={2} />
          {/* Current prediction */}
          <circle cx={toX(currentPred[0])} cy={toY(currentPred[1])} r={7} fill={palette.predFill} stroke="white" strokeWidth={2} />
        </svg>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 shadow-sm dark:bg-slate-800">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Cumulative RMSE
        </span>
        <span className={`rounded-lg px-3 py-1.5 font-mono text-2xl font-bold tabular-nums ${palette.rmsePill}`}>
          {rmseValue.toFixed(3)}
        </span>
      </div>
    </div>
  );
}

// ─── Buttons ─────────────────────────────────────────────────
function PrimaryBtn({onClick, children, className = ''}: {onClick: () => void; children: React.ReactNode; className?: string}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-teal-700 hover:shadow-md active:scale-[0.97] active:shadow-sm ${className}`}
    >
      {children}
    </button>
  );
}

function GhostBtn({onClick, children, ariaLabel, className = ''}: {onClick: () => void; children: React.ReactNode; ariaLabel?: string; className?: string}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-150 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md active:scale-[0.97] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-700 ${className}`}
    >
      {children}
    </button>
  );
}

// ─── Main ─────────────────────────────────────────────────────
export default function TimeAwarePredictor() {
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(200);

  const data = useMemo(() => {
    const trueTrail: Array<[number, number]> = [];
    const ffnTrail: Array<[number, number]> = [];
    const rnnTrail: Array<[number, number]> = [];
    for (let i = 0; i <= t; i++) {
      trueTrail.push(truePosition(i));
      ffnTrail.push(ffnPredict(i));
      rnnTrail.push(rnnPredict(i));
    }
    const ffnPairs: Array<[[number, number], [number, number]]> = [];
    const rnnPairs: Array<[[number, number], [number, number]]> = [];
    for (let i = 0; i < t; i++) {
      ffnPairs.push([ffnTrail[i], truePosition(i + 1)]);
      rnnPairs.push([rnnTrail[i], truePosition(i + 1)]);
    }
    return {
      trueTrail,
      ffnTrail,
      rnnTrail,
      ffnRMSE: rmse(ffnPairs),
      rnnRMSE: rmse(rnnPairs),
    };
  }, [t]);

  const reset = useCallback(() => {
    setT(0);
    setPlaying(false);
  }, []);

  useEffect(() => {
    if (!playing) return;
    if (t >= N_STEPS - 1) {
      setPlaying(false);
      return;
    }
    const id = setTimeout(() => setT((s) => s + 1), speed);
    return () => clearTimeout(id);
  }, [playing, t, speed]);

  const atEnd = t >= N_STEPS - 1;

  return (
    <div className="not-prose my-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-900">
      <div className="border-b border-slate-200 bg-gradient-to-br from-slate-50 to-white px-6 py-5 dark:border-slate-700 dark:from-slate-800 dark:to-slate-900">
        <p className="m-0 text-xl font-bold text-slate-900 dark:text-slate-100">
          Why memory matters
        </p>
        <p className="m-0 mt-2 max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          A ball traces a circular trajectory. Two predictors try to guess where it goes next.{' '}
          The <strong className="text-rose-700 dark:text-rose-400">memoryless FFN</strong> sees only the current point —
          no idea which way the ball is heading. The{' '}
          <strong className="text-teal-700 dark:text-teal-400">time-aware RNN</strong>{' '}
          carries a hidden state that remembers direction.
        </p>
      </div>

      <div className="space-y-6 p-6">
        <div className="grid gap-5 lg:grid-cols-2">
          <PredictorCanvas
            title="Memoryless FFN"
            description="Input is just (x_t, y_t). With no temporal context, predictions scatter across the canvas — the model has no way to recover direction."
            tone="rose"
            predTrail={data.ffnTrail.slice(0, -1)}
            trueTrail={data.trueTrail}
            currentPred={data.ffnTrail[data.ffnTrail.length - 1]}
            currentTrue={data.trueTrail[data.trueTrail.length - 1]}
            rmseValue={data.ffnRMSE}
          />
          <PredictorCanvas
            title="Time-aware RNN"
            description="Input is (x_t, y_t) + hidden state h_t. The hidden state encodes which way the ball is moving — predictions snap to the circle."
            tone="teal"
            predTrail={data.rnnTrail.slice(0, -1)}
            trueTrail={data.trueTrail}
            currentPred={data.rnnTrail[data.rnnTrail.length - 1]}
            currentTrue={data.trueTrail[data.trueTrail.length - 1]}
            rmseValue={data.rnnRMSE}
          />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 rounded-xl bg-slate-50 px-5 py-3 text-sm dark:bg-slate-800/50">
          <Legend dot="#1d4ed8" label="true position" />
          <Legend dot="#e11d48" label="FFN prediction" />
          <Legend dot="#0d9488" label="RNN prediction" />
          <span className="text-xs text-slate-500 dark:text-slate-400">
            dashed line = current error
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/40">
          <div className="flex flex-wrap items-center gap-2">
            <GhostBtn onClick={() => { setPlaying(false); setT(Math.max(0, t - 1)); }} ariaLabel="Previous">
              ◀
            </GhostBtn>
            <PrimaryBtn
              onClick={() => {
                if (atEnd) { setT(0); setPlaying(true); }
                else setPlaying((p) => !p);
              }}
              className="min-w-[120px]"
            >
              {playing ? '❚❚ Pause' : atEnd ? '↺ Replay' : '▶ Play'}
            </PrimaryBtn>
            <GhostBtn onClick={() => { setPlaying(false); setT(Math.min(N_STEPS - 1, t + 1)); }} ariaLabel="Next">
              ▶
            </GhostBtn>
            <GhostBtn onClick={reset}>Reset</GhostBtn>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
            <span className="font-mono font-semibold tabular-nums">
              t = {t} / {N_STEPS - 1}
            </span>
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <label htmlFor="taw-speed" className="text-xs font-medium uppercase tracking-wide">
              Speed
            </label>
            <input
              id="taw-speed"
              type="range"
              min={80}
              max={800}
              step={20}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="w-28 accent-teal-600"
            />
            <span className="font-mono text-xs tabular-nums">{speed}ms</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Legend({dot, label}: {dot: string; label: string}) {
  return (
    <span className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-300">
      <span className="inline-block h-3 w-3 rounded-full" style={{backgroundColor: dot}}></span>
      <span className="text-xs font-medium">{label}</span>
    </span>
  );
}
