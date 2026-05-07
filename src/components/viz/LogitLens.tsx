import React, { useState, useCallback } from 'react';
import { useTransformers, ModelPlayground } from './ModelPlayground';

/**
 * LogitLens — for each (layer, position), decode the hidden state through the
 * LM head and show the top-1 predicted token. Surfaces how the model's
 * "best guess" sharpens with depth — Karpathy gestures at this; we ship it.
 */

const MODELS = [
  { id: 'Xenova/distilgpt2', label: 'DistilGPT-2', size: '~80 MB' },
  { id: 'Xenova/gpt2',       label: 'GPT-2',       size: '~125 MB' },
] as const;

const EXAMPLES = [
  'The capital of France is',
  'When she opened the box, she found a',
  '2 + 2 =',
  'The Eiffel Tower is in',
];

interface LensCell { id: number; token: string; p: number }
interface LensResult {
  tokens: string[];
  ids: number[];
  lens: LensCell[][][]; // [layer][position][topK]
}

function clean(t: string): string {
  return t.replace(/^Ġ/, '·').replace(/Ċ/g, '↵').replace(/^ /, '·');
}

/** Color cell by certainty (top-1 probability). */
function certaintyColor(p: number): string {
  // p ∈ [0,1]; map to slate→violet ramp
  const t = Math.max(0, Math.min(1, p));
  const r = Math.round(30 + t * 122);
  const g = Math.round(41 + t * 91);
  const b = Math.round(59 + t * 196);
  return `rgb(${r},${g},${b})`;
}

export default function LogitLens() {
  const [modelId, setModelId] = useState<string>(MODELS[0].id);
  const config = MODELS.find((m) => m.id === modelId)!;
  const { run, phase, device, progress, error } = useTransformers({ preload: false });
  const [input, setInput] = useState(EXAMPLES[0]);
  const [data, setData] = useState<LensResult | null>(null);
  const [hover, setHover] = useState<{ layer: number; pos: number } | null>(null);

  const handleRun = useCallback(async () => {
    setData(null);
    try {
      const res = await run<LensResult>({
        task: 'lens',
        modelId,
        text: input,
        topK: 5,
      });
      setData(res);
    } catch (_) { /* surfaced */ }
  }, [run, modelId, input]);

  const numLayers = data?.lens.length ?? 0;

  return (
    <ModelPlayground
      title="Logit Lens"
      modelLabel={`${config.label} · ${config.size}${data ? ` · ${numLayers} layers` : ''}`}
      state={{ phase, device, progress, error }}
      onRun={handleRun}
      runLabel="▶ Decode"
    >
      <div className="p-4 space-y-4">

        {/* Header controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex rounded-lg overflow-hidden border border-slate-800">
            {MODELS.map((m) => (
              <button
                key={m.id}
                onClick={() => setModelId(m.id)}
                className={`px-3 py-1 text-[11px] font-sans ${
                  modelId === m.id ? 'bg-violet-600 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => setInput(ex)}
                className="text-[10px] font-sans px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                {ex.length > 24 ? ex.slice(0, 24) + '…' : ex}
              </button>
            ))}
          </div>
        </div>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          spellCheck={false}
          rows={Math.min(4, Math.max(2, input.split('\n').length))}
          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-slate-200 font-mono text-xs leading-6 outline-none focus:border-violet-700 resize-y"
        />

        {/* Lens table */}
        {data && <LensTable data={data} hover={hover} setHover={setHover} />}

        {!data && phase === 'idle' && (
          <div className="rounded-lg border border-dashed border-slate-700 p-6 text-center text-[11px] text-slate-500 font-sans">
            Press Decode to project the hidden state at each layer through the LM head.
          </div>
        )}

        {data && (
          <p className="text-[10px] text-slate-600 font-sans leading-snug">
            Each cell shows what the model would predict if you stopped at that depth and decoded immediately. Saturation = top-1 probability.
            Layer 0 = embedding lookup; the final layer matches the model's actual prediction. Final layer norm not applied — this is the "raw" lens (Nostalgebraist 2020).
          </p>
        )}
      </div>
    </ModelPlayground>
  );
}

interface TableProps {
  data: LensResult;
  hover: { layer: number; pos: number } | null;
  setHover: (h: { layer: number; pos: number } | null) => void;
}

function LensTable({ data, hover, setHover }: TableProps) {
  const T = data.tokens.length;
  const L = data.lens.length;

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-900/50">
      <table className="text-[11px] font-mono border-collapse w-full">
        <thead>
          <tr>
            <th className="sticky left-0 bg-slate-900 px-2 py-1 text-right font-sans font-semibold text-slate-500 text-[10px] z-10">layer ↓</th>
            {data.tokens.map((tok, i) => (
              <th key={i} className="px-1 py-1 text-center font-sans font-semibold text-slate-400 text-[10px] border-b border-slate-800 min-w-[64px]">
                <div className="text-violet-300">{clean(tok)}</div>
                <div className="text-slate-600 text-[9px]">pos {i}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Render top-down: last layer first */}
          {[...Array(L)].map((_, idx) => {
            const layer = L - 1 - idx;
            const isLast = idx === 0;
            return (
              <tr key={layer}>
                <th className={`sticky left-0 bg-slate-900 px-2 py-1 text-right font-sans text-[10px] z-10 ${
                  isLast ? 'text-violet-300 font-semibold' : 'text-slate-500'
                }`}>
                  L{layer}{isLast ? ' (out)' : ''}
                </th>
                {data.lens[layer].map((cell, pos) => {
                  const top = cell[0];
                  const isHover = hover?.layer === layer && hover?.pos === pos;
                  return (
                    <td
                      key={pos}
                      className="px-0.5 py-0.5 align-middle text-center relative"
                      onMouseEnter={() => setHover({ layer, pos })}
                      onMouseLeave={() => setHover(null)}
                    >
                      <div
                        className={`rounded px-1 py-0.5 truncate text-[10px] ${isHover ? 'ring-2 ring-amber-400' : ''}`}
                        style={{
                          background: certaintyColor(top.p),
                          color: top.p > 0.4 ? '#fff' : '#cbd5e1',
                          maxWidth: 80,
                        }}
                      >
                        {clean(top.token)}
                      </div>
                      {isHover && (
                        <div className="absolute z-20 top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 rounded bg-slate-800 text-[10px] text-slate-200 font-sans whitespace-nowrap shadow-lg border border-slate-700 text-left">
                          <div className="text-slate-500 mb-0.5">L{layer} · pos {pos}</div>
                          {cell.map((c, i) => (
                            <div key={i} className="flex justify-between gap-3">
                              <span className={i === 0 ? 'text-violet-300' : 'text-slate-300'}>
                                {clean(c.token)}
                              </span>
                              <span className="text-slate-500 tabular-nums">
                                {(c.p * 100).toFixed(1)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
