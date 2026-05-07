import React, { useState, useRef, useCallback } from 'react';
import { useTransformers, ModelPlayground } from './ModelPlayground';
import Distribution from './tensors/Distribution';

/**
 * CLIPPlayground — upload (or pick) an image, type some candidate labels, and
 * see how CLIP scores each label as a description of the image. Zero-shot
 * image classification, no fine-tuning required.
 *
 * Model: Xenova/clip-vit-base-patch32 (~150 MB Q8). First load is slow; cached
 * after that.
 */

const MODEL_ID = 'Xenova/clip-vit-base-patch32';

const PRESETS = [
  { label: 'cats',   url: 'https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/cats.jpg' },
  { label: 'tiger',  url: 'https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/tiger.jpg' },
  { label: 'chefs',  url: 'https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/chefs.jpg' },
];

const LABEL_SETS = [
  { name: 'animals',  labels: 'a cat, a dog, a tiger, a giraffe, a fish' },
  { name: 'mood',     labels: 'a happy scene, a sad scene, a surprising scene, a peaceful scene' },
  { name: 'place',    labels: 'an indoor scene, an outdoor scene, a kitchen, a forest, a city street' },
  { name: 'activity', labels: 'people working, people playing, an animal resting, a vehicle in motion' },
];

interface ScoreRow { label: string; score: number }

export default function CLIPPlayground() {
  const { run, phase, device, progress, error } = useTransformers({ preload: false });
  const [imageUrl, setImageUrl] = useState<string | null>(PRESETS[0].url);
  const [labels, setLabels] = useState(LABEL_SETS[0].labels);
  const [scores, setScores] = useState<ScoreRow[] | null>(null);
  const [tookMs, setTookMs] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result;
      if (typeof url === 'string') {
        setImageUrl(url);
        setScores(null);
      }
    };
    reader.readAsDataURL(file);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }

  const handleRun = useCallback(async () => {
    if (!imageUrl) return;
    setScores(null);
    const candidates = labels.split(',').map((s) => s.trim()).filter(Boolean);
    if (!candidates.length) return;
    const t0 = performance.now();
    try {
      const res = await run<{ labels: { label: string; score: number }[] }>({
        task: 'classify',
        modelId: MODEL_ID,
        image: imageUrl,
        candidateLabels: candidates,
      });
      // res.labels is sorted by score descending.
      setScores(res.labels.map((r) => ({ label: r.label, score: r.score })));
      setTookMs(performance.now() - t0);
    } catch (_) { /* surfaced via state.error */ }
  }, [run, imageUrl, labels]);

  return (
    <ModelPlayground
      title="CLIP Zero-Shot Classification"
      modelLabel="clip-vit-base-patch32 · ~150 MB"
      state={{ phase, device, progress, error }}
      onRun={handleRun}
      runLabel="▶ Score labels"
      runDisabled={!imageUrl}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0">

        {/* Left: image */}
        <div className="border-b md:border-b-0 md:border-r border-slate-800 p-4 space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.url}
                onClick={() => { setImageUrl(p.url); setScores(null); }}
                className={`text-[10px] font-sans px-2 py-0.5 rounded ${
                  imageUrl === p.url
                    ? 'bg-violet-700 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                {p.label}
              </button>
            ))}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-[10px] font-sans px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-violet-300 border border-violet-800/40"
            >
              upload…
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={onFileChange}
            />
          </div>

          <div
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
            className="rounded-lg border border-dashed border-slate-700 bg-slate-900/40 overflow-hidden flex items-center justify-center min-h-[240px]"
          >
            {imageUrl ? (
              <img src={imageUrl} alt="" className="max-h-[320px] max-w-full object-contain" />
            ) : (
              <div className="text-[11px] text-slate-500 font-sans p-6 text-center">
                Drop an image here, click <span className="text-violet-400">upload…</span>, or pick a preset.
              </div>
            )}
          </div>
        </div>

        {/* Right: labels + scores */}
        <div className="p-4 space-y-3">
          <div>
            <div className="flex items-baseline justify-between mb-1">
              <label className="text-[11px] font-sans text-slate-400">candidate labels (comma-separated)</label>
              {tookMs != null && (
                <span className="text-[10px] font-sans text-emerald-400">{tookMs.toFixed(0)} ms</span>
              )}
            </div>
            <textarea
              value={labels}
              onChange={(e) => setLabels(e.target.value)}
              spellCheck={false}
              rows={3}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono text-xs leading-5 outline-none focus:border-violet-700 resize-y"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {LABEL_SETS.map((set) => (
                <button
                  key={set.name}
                  onClick={() => setLabels(set.labels)}
                  className="text-[10px] font-sans px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  {set.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-sans text-slate-500 mb-2">CLIP similarity</div>
            {scores ? (
              <Distribution
                items={scores.map((s) => ({ label: s.label, value: s.score }))}
                highlightedIndex={0}
                asPercent
                maxLabelLen={28}
              />
            ) : (
              <div className="rounded-lg bg-slate-900 border border-slate-800 p-3 text-[11px] text-slate-600 font-sans">
                Press <span className="text-violet-400">Score labels</span> to compute cosine similarities.
              </div>
            )}
          </div>
        </div>
      </div>
    </ModelPlayground>
  );
}
