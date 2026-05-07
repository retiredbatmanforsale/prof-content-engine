import React, { useState, useCallback } from 'react';
import { useTransformers, ModelPlayground } from './ModelPlayground';
import Distribution from './tensors/Distribution';

/**
 * QuantizationCompare — load multiple dtype variants of GPT-2 / DistilGPT-2 in
 * the same browser tab, send the same prompt through each, and visualize the
 * quality vs. latency tradeoff.
 *
 * Each variant shows: predicted next token, top-k distribution, latency.
 * Footer shows pairwise KL divergence between variants' full next-token
 * distributions and a top-1 agreement matrix — quick read for "where does
 * quantization actually hurt?"
 */

const MODELS = [
  { id: 'Xenova/distilgpt2', label: 'DistilGPT-2' },
  { id: 'Xenova/gpt2',       label: 'GPT-2' },
] as const;

const VARIANTS = [
  { dtype: 'fp32', label: 'FP32',  weight: '~330 / ~500 MB' },
  { dtype: 'q8',   label: 'INT8',  weight: '~80 / ~125 MB' },
  { dtype: 'q4',   label: 'INT4',  weight: '~50 / ~80 MB' },
] as const;

const PROMPTS = [
  'The capital of France is',
  'Once upon a time, there was a',
  'def fibonacci(n):',
  '2 + 2 = 4. 3 + 3 =',
  'In 1969, Neil Armstrong became the first',
];

interface VariantResult {
  dtype: string;
  label: string;
  latencyMs: number;
  topK: { id: number; token: string; p: number }[];
  top1: { id: number; token: string; p: number };
}

interface CompareResult {
  tokens: string[];
  variants: VariantResult[];
  klPairs: { from: string; to: string; kl: number }[];
}

export default function QuantizationCompare() {
  const { run, phase, device, progress, error } = useTransformers({ preload: false });
  const [modelId, setModelId] = useState<string>(MODELS[0].id);
  const [enabled, setEnabled] = useState<Record<string, boolean>>({ fp32: true, q8: true, q4: false });
  const [prompt, setPrompt] = useState(PROMPTS[0]);
  const [data, setData] = useState<CompareResult | null>(null);

  const handleRun = useCallback(async () => {
    setData(null);
    const variants = VARIANTS.filter((v) => enabled[v.dtype]).map((v) => ({
      dtype: v.dtype,
      label: v.label,
    }));
    if (variants.length === 0) return;
    try {
      const res = await run<CompareResult>({
        task: 'compare',
        modelId,
        text: prompt,
        topK: 10,
        variants,
      });
      setData(res);
    } catch (_) { /* surfaced via state.error */ }
  }, [run, modelId, enabled, prompt]);

  const enabledCount = Object.values(enabled).filter(Boolean).length;
  const sizeNote = MODELS.find((m) => m.id === modelId)?.label.includes('DistilGPT')
    ? VARIANTS.map((v) => v.weight.split(' / ')[0]).join(' · ')
    : VARIANTS.map((v) => v.weight.split(' / ')[1]).join(' · ');

  return (
    <ModelPlayground
      title="Quantization Compare"
      modelLabel={`${MODELS.find((m) => m.id === modelId)?.label} · ${enabledCount} variant${enabledCount === 1 ? '' : 's'}`}
      state={{ phase, device, progress, error }}
      onRun={handleRun}
      runLabel="▶ Compare"
      runDisabled={enabledCount === 0}
    >
      <div className="p-4 space-y-3">

        {/* Header controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex rounded-lg overflow-hidden border border-slate-800">
            {MODELS.map((m) => (
              <button
                key={m.id}
                onClick={() => { setModelId(m.id); setData(null); }}
                className={`px-3 py-1 text-[11px] font-sans ${
                  modelId === m.id ? 'bg-violet-600 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="flex rounded-lg overflow-hidden border border-slate-800">
            {VARIANTS.map((v, i) => (
              <button
                key={v.dtype}
                onClick={() => setEnabled((e) => ({ ...e, [v.dtype]: !e[v.dtype] }))}
                className={`px-3 py-1 text-[11px] font-sans ${
                  enabled[v.dtype]
                    ? 'bg-violet-700/70 text-white'
                    : 'bg-slate-900 text-slate-500 hover:bg-slate-800'
                } ${i > 0 ? 'border-l border-slate-800' : ''}`}
                title={`weight: ${v.weight}`}
              >
                {v.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => setPrompt(p)}
                className="text-[10px] font-sans px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                {p.length > 26 ? p.slice(0, 26) + '…' : p}
              </button>
            ))}
          </div>
        </div>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          spellCheck={false}
          rows={Math.min(4, Math.max(2, prompt.split('\n').length))}
          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-slate-200 font-mono text-xs leading-6 outline-none focus:border-violet-700 resize-y"
        />

        {/* Variant columns */}
        {data && (
          <div className={`grid grid-cols-1 ${data.variants.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-3`}>
            {data.variants.map((v) => (
              <div key={v.label} className="rounded-lg border border-slate-800 bg-slate-900/40 overflow-hidden">
                <div className="flex items-baseline justify-between px-3 py-2 border-b border-slate-800 bg-slate-900/80">
                  <div>
                    <div className="text-xs font-sans font-semibold text-slate-200">{v.label}</div>
                    <div className="text-[10px] font-sans text-slate-500">dtype: {v.dtype}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono text-emerald-400 tabular-nums">{v.latencyMs.toFixed(0)} ms</div>
                    <div className="text-[10px] font-sans text-slate-500">forward</div>
                  </div>
                </div>
                <div className="p-3 space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[10px] font-sans text-slate-500">argmax</span>
                    <span className="text-2xl font-bold text-violet-300 font-mono">
                      "{v.top1.token.replace(/^Ġ/, '·').replace(/Ċ/g, '↵').replace(/^ /, '·')}"
                    </span>
                    <span className="text-[10px] font-sans text-slate-500 ml-auto">
                      {(v.top1.p * 100).toFixed(1)}%
                    </span>
                  </div>
                  <Distribution
                    items={v.topK.map((c) => ({ label: c.token, value: c.p, id: c.id }))}
                    highlightedIndex={0}
                    asPercent
                    maxLabelLen={14}
                    maxRows={8}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pairwise KL + agreement */}
        {data && data.klPairs.length > 0 && (
          <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
            <div className="text-[11px] font-sans text-slate-400 mb-2">divergence vs. reference</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] font-mono">
              {data.klPairs.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-slate-500 w-12">{p.from} →</span>
                  <span className="text-slate-300 w-12">{p.to}</span>
                  <span className="text-slate-500">KL</span>
                  <span className={`tabular-nums ml-auto ${
                    p.kl < 0.01 ? 'text-emerald-400'
                    : p.kl < 0.05 ? 'text-amber-400'
                    : 'text-red-400'
                  }`}>
                    {p.kl.toFixed(4)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-2 pt-2 border-t border-slate-800/60 text-[10px] text-slate-500 font-sans leading-snug">
              KL is in nats over the full 50,257-token vocab. Lower = the quantized model's distribution is closer to the FP32 reference. Above ~0.05 means meaningful disagreement on what the next token should be.
            </div>
            <div className="mt-2 text-[11px] font-sans text-slate-400">
              top-1 agreement:{' '}
              {data.variants.every((v) => v.top1.id === data.variants[0].top1.id) ? (
                <span className="text-emerald-400">all variants agree on "{data.variants[0].top1.token.replace(/^Ġ/, '·')}"</span>
              ) : (
                <span className="text-amber-400">variants disagree</span>
              )}
            </div>
          </div>
        )}

        {!data && phase === 'idle' && (
          <div className="rounded-lg border border-dashed border-slate-700 p-6 text-center text-[11px] text-slate-500 font-sans">
            Select 2 or 3 dtype variants and press <span className="text-violet-400">Compare</span>. Each variant downloads independently the first time (~{sizeNote}).
          </div>
        )}
      </div>
    </ModelPlayground>
  );
}
