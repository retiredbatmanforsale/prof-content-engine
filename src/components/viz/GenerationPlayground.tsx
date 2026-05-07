import React, { useState, useRef, useCallback } from 'react';
import { useTransformers, ModelPlayground } from './ModelPlayground';
import Distribution from './tensors/Distribution';
import { TokenItem } from './tensors/TokenStrip';

/**
 * GenerationPlayground — type a prompt, watch GPT-2 generate one token at a
 * time. The live distribution panel shows the top-50 next-token probabilities
 * at every step, so sampling stops being abstract.
 *
 * Sliders: temperature (0–2), top-k (1–100), top-p (0–1).
 * Toggle: greedy vs sampled. In greedy mode every step picks argmax.
 */

const MODELS = [
  { id: 'Xenova/distilgpt2', label: 'DistilGPT-2', size: '~80 MB', layers: 6 },
  { id: 'Xenova/gpt2',       label: 'GPT-2',       size: '~125 MB', layers: 12 },
] as const;

const PROMPTS = [
  'Once upon a time, there was a',
  'The capital of France is',
  'def fibonacci(n):',
  'Q: What is the meaning of life?\nA:',
];

export default function GenerationPlayground() {
  const [modelId, setModelId] = useState<string>(MODELS[0].id);
  const { run, phase, device, progress, error } = useTransformers({ preload: false });

  const [prompt, setPrompt] = useState(PROMPTS[0]);
  const [temperature, setTemperature] = useState(0.8);
  const [topK, setTopK] = useState(40);
  const [topP, setTopP] = useState(0.95);
  const [greedy, setGreedy] = useState(false);
  const [maxNewTokens, setMaxNewTokens] = useState(24);

  const [tokens, setTokens] = useState<TokenItem[]>([]);
  const [currentDistribution, setCurrentDistribution] = useState<{ id: number; token: string; p: number }[]>([]);
  const [sampledIdx, setSampledIdx] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const [pausedStep, setPausedStep] = useState<{ resume: () => void } | null>(null);
  const cancelRef = useRef(false);

  function reset() {
    setTokens([]);
    setCurrentDistribution([]);
    setSampledIdx(null);
    setPausedStep(null);
    cancelRef.current = false;
  }

  const handleGenerate = useCallback(async () => {
    reset();
    setGenerating(true);
    cancelRef.current = false;
    try {
      // For greedy: temp ≈ 0 means argmax. Implement by setting top-k=1.
      const effTopK = greedy ? 1 : topK;
      const effTopP = greedy ? 1 : topP;
      const effTemp = greedy ? 1 : temperature;
      await run({
        task: 'generate',
        modelId,
        text: prompt,
        maxNewTokens,
        temperature: effTemp,
        topK: effTopK,
        topP: effTopP,
        streamTopK: 50,
      }, {
        onToken: (t) => {
          if (cancelRef.current) return;
          // Append the sampled token to the visible strip
          setTokens((prev) => [...prev, {
            text: t.token,
            id: t.tokenId,
            score: t.topK[0]?.p ?? 0.5,
            color: '#7c3aed',
          }]);
          // Update distribution panel
          setCurrentDistribution(t.topK);
          const idx = t.topK.findIndex((c) => c.id === t.tokenId);
          setSampledIdx(idx >= 0 ? idx : null);
        },
      });
    } catch (e) {
      // Surfaced via state.error already
    } finally {
      setGenerating(false);
    }
  }, [run, modelId, prompt, temperature, topK, topP, greedy, maxNewTokens]);

  function handleStop() {
    cancelRef.current = true;
    setGenerating(false);
  }

  return (
    <ModelPlayground
      title="GPT-2 Token-by-Token"
      modelLabel={`${MODELS.find((m) => m.id === modelId)?.label} · ${MODELS.find((m) => m.id === modelId)?.size}`}
      state={{ phase: generating && phase !== 'loading' && phase !== 'booting' ? 'running' : phase, device, progress, error }}
      onRun={generating ? handleStop : handleGenerate}
      runLabel={generating ? '■ Stop' : '▶ Generate'}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0">

        {/* Left: prompt + controls */}
        <div className="border-b md:border-b-0 md:border-r border-slate-800 p-4 space-y-3">
          {/* Model picker */}
          <div className="flex items-center gap-2 text-[11px] font-sans">
            <span className="text-slate-500">model</span>
            <div className="flex rounded-lg overflow-hidden border border-slate-800">
              {MODELS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setModelId(m.id)}
                  disabled={generating}
                  className={`px-3 py-1 ${
                    modelId === m.id ? 'bg-violet-600 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                  } ${generating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Example prompts */}
          <div className="flex flex-wrap gap-1.5">
            {PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => setPrompt(p)}
                disabled={generating}
                className="text-[10px] font-sans px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-50"
              >
                {p.length > 24 ? p.slice(0, 24) + '…' : p}
              </button>
            ))}
          </div>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={generating}
            spellCheck={false}
            rows={Math.min(6, Math.max(2, prompt.split('\n').length))}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-slate-200 font-mono text-xs leading-6 outline-none focus:border-violet-700 resize-y disabled:opacity-50"
          />

          {/* Sliders */}
          <div className="space-y-2">
            <SliderRow
              label="temperature"
              value={temperature}
              min={0} max={2} step={0.05}
              disabled={greedy || generating}
              onChange={setTemperature}
              hint={greedy ? 'disabled in greedy mode' : ''}
            />
            <SliderRow
              label="top-k"
              value={topK}
              min={1} max={100} step={1}
              disabled={greedy || generating}
              onChange={setTopK}
              format={(v) => v.toString()}
            />
            <SliderRow
              label="top-p"
              value={topP}
              min={0.1} max={1} step={0.01}
              disabled={greedy || generating}
              onChange={setTopP}
            />
            <SliderRow
              label="max tokens"
              value={maxNewTokens}
              min={4} max={64} step={1}
              disabled={generating}
              onChange={setMaxNewTokens}
              format={(v) => v.toString()}
            />
            <label className="flex items-center gap-2 text-[11px] font-sans text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={greedy}
                onChange={(e) => setGreedy(e.target.checked)}
                disabled={generating}
                className="accent-violet-500"
              />
              greedy mode (argmax every step)
            </label>
          </div>
        </div>

        {/* Right: live output */}
        <div className="p-4 space-y-3">
          <div>
            <div className="text-[11px] font-sans text-slate-500 mb-2">generated</div>
            <div className="rounded-lg bg-slate-900 border border-slate-800 p-3 min-h-[88px]">
              <span className="text-xs font-mono text-slate-500 whitespace-pre-wrap break-words">{prompt}</span>
              {tokens.length > 0 && (
                <span className="text-xs font-mono text-violet-300 whitespace-pre-wrap break-words">
                  {tokens.map((t) => t.text).join('')}
                </span>
              )}
              {generating && tokens.length === 0 && phase !== 'loading' && phase !== 'booting' && (
                <span className="ml-1 inline-block w-2 h-3 bg-violet-400 align-middle animate-pulse" />
              )}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-sans text-slate-500 mb-2">
              next-token distribution {tokens.length > 0 && `(after token #${tokens.length})`}
            </div>
            {currentDistribution.length > 0 ? (
              <Distribution
                items={currentDistribution.slice(0, 12).map((c) => ({ label: c.token, value: c.p, id: c.id }))}
                highlightedIndex={sampledIdx ?? -1}
                asPercent
                maxLabelLen={14}
              />
            ) : (
              <div className="rounded-lg bg-slate-900 border border-slate-800 p-3 text-[11px] text-slate-600 font-sans">
                Press Generate to see the per-step distribution.
              </div>
            )}
          </div>
        </div>
      </div>
    </ModelPlayground>
  );
}

// ---------- Slider helper ----------
interface SliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  disabled?: boolean;
  hint?: string;
  format?: (v: number) => string;
  onChange: (v: number) => void;
}

function SliderRow({ label, value, min, max, step, disabled, hint, format, onChange }: SliderRowProps) {
  return (
    <div className={`flex items-center gap-3 text-[11px] font-sans ${disabled ? 'opacity-50' : ''}`}>
      <span className="w-20 text-slate-400">{label}</span>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 accent-violet-500"
      />
      <span className="w-10 text-right tabular-nums text-violet-300 font-mono text-[11px]">
        {format ? format(value) : value.toFixed(2)}
      </span>
      {hint && <span className="text-[9px] text-slate-600 ml-2">{hint}</span>}
    </div>
  );
}
