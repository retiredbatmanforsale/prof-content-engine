import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTransformers, ModelPlayground } from './ModelPlayground';
import AttentionGrid from './tensors/AttentionGrid';

/**
 * AttentionVisualizer — input a sentence, see all 12 heads × 12 layers light up.
 *
 * Layout:
 *   - Top:    input textarea + Run
 *   - Middle: L × H grid of mini attention heatmaps (single canvas for perf)
 *   - Bottom: full-size view of the selected (layer, head)
 *
 * Ablation is deliberately deferred to a follow-up — viewing alone is the high
 * leverage demo and ships in days, not weeks.
 */

const MODELS = [
  { id: 'Xenova/distilgpt2', label: 'DistilGPT-2', size: '~80 MB',  layers: 6,  heads: 12 },
  { id: 'Xenova/gpt2',       label: 'GPT-2',       size: '~125 MB', layers: 12, heads: 12 },
] as const;

const EXAMPLES = [
  'The cat sat on the mat.',
  'When Mary visited Paris, she ate a croissant.',
  'def add(a, b):\n    return a + b',
  'Time flies like an arrow; fruit flies like a banana.',
];

// attentions[L][batch=1, heads, T, T]  → simplified to attentions[L][H][T][T]
function pickHead(attLayer: number[][][][], head: number): number[][] {
  // attLayer shape: [batch=1, heads, T, T]
  return attLayer[0][head];
}

interface ForwardResult {
  tokens: string[];
  ids: number[];
  attentions: number[][][][][]; // [L][1][H][T][T]
}

export default function AttentionVisualizer() {
  const [modelId, setModelId] = useState<string>(MODELS[0].id);
  const config = MODELS.find((m) => m.id === modelId)!;
  const { run, phase, device, progress, error } = useTransformers({ preload: false });
  const [input, setInput] = useState(EXAMPLES[0]);
  const [data, setData] = useState<ForwardResult | null>(null);
  const [selected, setSelected] = useState<{ l: number; h: number }>({ l: 0, h: 0 });

  const handleRun = useCallback(async () => {
    setData(null);
    try {
      const res = await run<ForwardResult>({
        task: 'forward',
        modelId,
        text: input,
        kind: 'causal',
        returnAttentions: true,
      });
      setData(res);
      setSelected({ l: 0, h: 0 });
    } catch (_) { /* surfaced via state.error */ }
  }, [run, modelId, input]);

  const numLayers = data?.attentions.length ?? config.layers;
  const numHeads = data?.attentions[0]?.[0]?.length ?? config.heads;

  return (
    <ModelPlayground
      title="GPT-2 Attention Heads"
      modelLabel={`${config.label} · ${config.size} · ${numLayers}L × ${numHeads}H`}
      state={{ phase, device, progress, error }}
      onRun={handleRun}
      runLabel="▶ Run"
    >
      <div className="p-4 space-y-4">

        {/* Model picker + examples */}
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
                {ex.length > 20 ? ex.slice(0, 20) + '…' : ex}
              </button>
            ))}
          </div>
        </div>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          spellCheck={false}
          rows={Math.min(6, Math.max(2, input.split('\n').length))}
          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-slate-200 font-mono text-xs leading-6 outline-none focus:border-violet-700 resize-y"
        />

        {/* L × H grid */}
        {data && (
          <>
            <MiniGrid
              attentions={data.attentions}
              selected={selected}
              onSelect={(l, h) => setSelected({ l, h })}
            />

            {/* Expanded view */}
            <div className="rounded-lg bg-slate-900 border border-slate-800 p-3">
              <div className="flex items-baseline justify-between mb-2">
                <div className="text-[11px] font-sans text-slate-400">
                  Layer <span className="text-violet-300 font-semibold">{selected.l}</span>
                  {' · '}
                  Head <span className="text-violet-300 font-semibold">{selected.h}</span>
                </div>
                <div className="text-[10px] font-sans text-slate-600">
                  rows = query (attending FROM) · cols = key (attending TO)
                </div>
              </div>
              <AttentionGrid
                scores={pickHead(data.attentions[selected.l], selected.h)}
                tokens={data.tokens.map(cleanToken)}
              />
            </div>
          </>
        )}

        {!data && phase === 'idle' && (
          <div className="rounded-lg border border-dashed border-slate-700 p-6 text-center text-[11px] text-slate-500 font-sans">
            Press Run to forward the sentence through {config.label} and visualize all {numLayers}×{numHeads} attention heads.
          </div>
        )}
      </div>
    </ModelPlayground>
  );
}

function cleanToken(t: string): string {
  // Make GPT-2 BPE tokens human-readable for axis labels.
  return t.replace(/^Ġ/, '·').replace(/Ċ/g, '↵').replace(/^ /, '·');
}

// ---------- Mini grid: one canvas with all L×H mini-heatmaps ----------

interface MiniProps {
  attentions: number[][][][][]; // [L][1][H][T][T]
  selected: { l: number; h: number };
  onSelect: (l: number, h: number) => void;
}

const MIN_CELL_PX = 4;
const PAD = 4;
const HEADER_H = 16;
const ROW_LABEL_W = 28;

function MiniGrid({ attentions, selected, onSelect }: MiniProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hover, setHover] = useState<{ l: number; h: number } | null>(null);

  const L = attentions.length;
  const H = attentions[0][0].length;
  const T = attentions[0][0][0].length;

  function geometry(cssW: number) {
    // available width for the H heatmaps in a row, minus row label gutter
    const available = cssW - ROW_LABEL_W - PAD * 2;
    const perCell = Math.max(MIN_CELL_PX * T, Math.floor(available / H));
    const totalW = ROW_LABEL_W + perCell * H + PAD * 2;
    const cssH = HEADER_H + perCell * L + PAD * 2;
    return { perCell, totalW, cssH };
  }

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.offsetWidth;
    if (!cssW) return;
    const { perCell, cssH } = geometry(cssW);

    if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      canvas.style.height = cssH + 'px';
    }
    const ctx = canvas.getContext('2d')!;
    ctx.save();
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, cssW, cssH);

    // Column headers (head index)
    ctx.font = '10px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#64748b';
    for (let h = 0; h < H; h++) {
      ctx.fillText(`H${h}`, ROW_LABEL_W + PAD + perCell * (h + 0.5), HEADER_H / 2);
    }

    // Row labels (layer index) + cells
    ctx.textAlign = 'right';
    for (let l = 0; l < L; l++) {
      const yOffset = HEADER_H + PAD + l * perCell;
      ctx.fillStyle = '#64748b';
      ctx.fillText(`L${l}`, ROW_LABEL_W - 4, yOffset + perCell / 2);

      for (let h = 0; h < H; h++) {
        const xOffset = ROW_LABEL_W + PAD + h * perCell;
        const matrix = attentions[l][0][h]; // [T][T]
        // Draw matrix scaled into a perCell × perCell box.
        const sub = perCell / T;
        for (let r = 0; r < T; r++) {
          for (let c = 0; c < T; c++) {
            const v = Math.max(0, Math.min(1, matrix[r][c]));
            // simple ramp
            const R = Math.round(15 + v * 114);
            const G = Math.round(23 + v * 117);
            const B = Math.round(42 + v * 206);
            ctx.fillStyle = `rgb(${R},${G},${B})`;
            ctx.fillRect(xOffset + c * sub, yOffset + r * sub, Math.ceil(sub) + 0.5, Math.ceil(sub) + 0.5);
          }
        }
        // Outline
        const isHover = hover?.l === l && hover?.h === h;
        const isSel = selected.l === l && selected.h === h;
        if (isSel) {
          ctx.strokeStyle = '#a78bfa';
          ctx.lineWidth = 2;
          ctx.strokeRect(xOffset + 0.5, yOffset + 0.5, perCell - 1, perCell - 1);
        } else if (isHover) {
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(xOffset + 0.5, yOffset + 0.5, perCell - 1, perCell - 1);
        } else {
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 1;
          ctx.strokeRect(xOffset + 0.5, yOffset + 0.5, perCell - 1, perCell - 1);
        }
      }
    }
    ctx.restore();
  }

  useEffect(draw);

  function locate(e: React.MouseEvent): { l: number; h: number } | null {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    const { perCell } = geometry(canvas.offsetWidth);
    const h = Math.floor((x - ROW_LABEL_W - PAD) / perCell);
    const l = Math.floor((y - HEADER_H - PAD) / perCell);
    if (l < 0 || l >= L || h < 0 || h >= H) return null;
    return { l, h };
  }

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        style={{ width: '100%', display: 'block', cursor: 'pointer' }}
        onMouseMove={(e) => setHover(locate(e))}
        onMouseLeave={() => setHover(null)}
        onClick={(e) => { const c = locate(e); if (c) onSelect(c.l, c.h); }}
      />
      {hover && (
        <div className="absolute top-1 right-2 text-[10px] font-mono text-slate-400 bg-slate-900/70 px-1.5 py-0.5 rounded">
          L{hover.l}·H{hover.h}
        </div>
      )}
    </div>
  );
}
