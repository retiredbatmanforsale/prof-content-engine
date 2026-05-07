import React, { useState, useRef, useCallback, useMemo } from 'react';
import { useTransformers, ModelPlayground } from './ModelPlayground';
import Heatmap2D from './tensors/Heatmap2D';

/**
 * ViTAttention — upload an image, see what the vision transformer "looks at"
 * via attention rollout (Abnar & Zuidema, 2020).
 *
 * Algorithm:
 *   1. For each layer l, average attention across heads.
 *   2. Add identity (residual): A' = 0.5 * (A + I), then row-normalize.
 *   3. Roll out from `fromLayer` upward: M = A_L · A_{L-1} · … · A_{fromLayer}.
 *   4. Take the CLS row (row 0), drop the CLS column → P patches.
 *   5. Reshape P into a √P × √P grid → overlay on the image via Heatmap2D.
 *
 * Model: Xenova/vit-base-patch16-224 (~85 MB Q8). Patches = 14×14 = 196,
 * tokens = 197 (incl. CLS).
 */

const MODEL_ID = 'Xenova/vit-base-patch16-224';

const PRESETS = [
  { label: 'cats',   url: 'https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/cats.jpg' },
  { label: 'tiger',  url: 'https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/tiger.jpg' },
  { label: 'chefs',  url: 'https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/chefs.jpg' },
];

interface ForwardResult {
  attentions: number[][][][][]; // [L][1][H][T][T]
  numHeads: number;
  numTokens: number;
  numLayers: number;
}

// ---------- Math helpers ----------

function identity(n: number): number[][] {
  const I: number[][] = Array.from({ length: n }, (_, i) => Array(n).fill(0));
  for (let i = 0; i < n; i++) I[i][i] = 1;
  return I;
}

function avgHeads(headed: number[][][]): number[][] {
  // headed[H][T][T] → [T][T] via mean
  const H = headed.length;
  const T = headed[0].length;
  const out: number[][] = Array.from({ length: T }, () => Array(T).fill(0));
  for (let h = 0; h < H; h++) {
    for (let r = 0; r < T; r++) {
      for (let c = 0; c < T; c++) {
        out[r][c] += headed[h][r][c] / H;
      }
    }
  }
  return out;
}

function addIdentityAndRenorm(M: number[][]): number[][] {
  const T = M.length;
  const out: number[][] = Array.from({ length: T }, () => Array(T).fill(0));
  for (let r = 0; r < T; r++) {
    let sum = 0;
    for (let c = 0; c < T; c++) {
      out[r][c] = 0.5 * (M[r][c] + (r === c ? 1 : 0));
      sum += out[r][c];
    }
    if (sum > 0) for (let c = 0; c < T; c++) out[r][c] /= sum;
  }
  return out;
}

function matMul(A: number[][], B: number[][]): number[][] {
  // A[T][T] · B[T][T]
  const T = A.length;
  const out: number[][] = Array.from({ length: T }, () => Array(T).fill(0));
  for (let i = 0; i < T; i++) {
    for (let k = 0; k < T; k++) {
      const a = A[i][k];
      if (a === 0) continue;
      for (let j = 0; j < T; j++) out[i][j] += a * B[k][j];
    }
  }
  return out;
}

function rollout(attentions: number[][][][][], fromLayer: number): number[][] {
  const L = attentions.length;
  const T = attentions[0][0][0].length;
  let M = identity(T);
  for (let l = fromLayer; l < L; l++) {
    const headed = attentions[l][0]; // [H][T][T]
    const avg = avgHeads(headed);
    const renorm = addIdentityAndRenorm(avg);
    M = matMul(renorm, M);
  }
  return M;
}

function clsToPatchGrid(rolloutMatrix: number[][]): number[][] {
  // Row 0 = CLS attending to others. Drop the CLS column.
  const row = rolloutMatrix[0].slice(1);
  const P = row.length;
  const side = Math.round(Math.sqrt(P));
  if (side * side !== P) {
    // Not a square — just return a 1xP strip
    return [row];
  }
  const grid: number[][] = [];
  for (let r = 0; r < side; r++) grid.push(row.slice(r * side, (r + 1) * side));
  return grid;
}

// ---------- Component ----------

export default function ViTAttention() {
  const { run, phase, device, progress, error } = useTransformers({ preload: false });
  const [imageUrl, setImageUrl] = useState<string | null>(PRESETS[0].url);
  const [data, setData] = useState<ForwardResult | null>(null);
  const [fromLayer, setFromLayer] = useState(0);
  const [tookMs, setTookMs] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result;
      if (typeof url === 'string') {
        setImageUrl(url);
        setData(null);
      }
    };
    reader.readAsDataURL(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }

  const handleRun = useCallback(async () => {
    if (!imageUrl) return;
    setData(null);
    const t0 = performance.now();
    try {
      const res = await run<ForwardResult>({
        task: 'vit-forward',
        modelId: MODEL_ID,
        image: imageUrl,
        returnAttentions: true,
      });
      setData(res);
      setFromLayer(0);
      setTookMs(performance.now() - t0);
    } catch (_) { /* surfaced */ }
  }, [run, imageUrl]);

  const grid = useMemo(() => {
    if (!data) return null;
    const r = rollout(data.attentions, fromLayer);
    return clsToPatchGrid(r);
  }, [data, fromLayer]);

  return (
    <ModelPlayground
      title="ViT Attention Rollout"
      modelLabel="vit-base-patch16-224 · ~85 MB"
      state={{ phase, device, progress, error }}
      onRun={handleRun}
      runLabel="▶ Run rollout"
      runDisabled={!imageUrl}
    >
      <div className="p-4 space-y-3">

        {/* Preset buttons + upload */}
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.url}
              onClick={() => { setImageUrl(p.url); setData(null); }}
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
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
          {tookMs != null && (
            <span className="ml-auto text-[10px] font-sans text-emerald-400 self-center">
              {tookMs.toFixed(0)} ms
            </span>
          )}
        </div>

        {/* Image + heatmap stacks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
            className="rounded-lg border border-slate-800 bg-slate-900/40 overflow-hidden flex items-center justify-center min-h-[240px]"
          >
            {imageUrl ? (
              <img src={imageUrl} alt="" className="max-h-[320px] max-w-full object-contain" />
            ) : (
              <div className="text-[11px] text-slate-500 font-sans p-6 text-center">
                Drop an image, click upload…, or pick a preset.
              </div>
            )}
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900/40 overflow-hidden">
            {grid && imageUrl ? (
              <Heatmap2D
                values={grid}
                backgroundUrl={imageUrl}
                ramp="plasma"
                overlayOpacity={0.55}
                aspectRatio={1}
              />
            ) : (
              <div className="text-[11px] text-slate-500 font-sans p-6 text-center min-h-[240px] flex items-center justify-center">
                Press <span className="text-violet-400 mx-1">Run rollout</span> to compute attention.
              </div>
            )}
          </div>
        </div>

        {/* Layer slider */}
        {data && (
          <div className="flex items-center gap-3 text-[11px] font-sans">
            <span className="text-slate-400 w-28">rollout from layer</span>
            <input
              type="range"
              min={0}
              max={data.numLayers - 1}
              value={fromLayer}
              onChange={(e) => setFromLayer(Number(e.target.value))}
              className="flex-1 accent-violet-500"
            />
            <span className="w-8 text-right tabular-nums text-violet-300 font-mono">
              {fromLayer}
            </span>
            <span className="text-slate-600">/ {data.numLayers - 1}</span>
          </div>
        )}

        {data && (
          <p className="text-[10px] text-slate-600 font-sans leading-snug">
            Rollout multiplies the per-layer attention matrices (averaged over heads, with residual identity, row-renormalized) from the chosen layer up to the final layer. The resulting CLS-token row tells you how much information from each image patch the classifier ultimately drew on. Lower starting layers integrate more of the network's processing.
          </p>
        )}
      </div>
    </ModelPlayground>
  );
}
