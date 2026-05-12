import React, {useMemo, useState} from 'react';

// ─── Vocab (hand-picked for cluster demo) ─────────────────────
const VOCAB: string[] = [
  'cat', 'dog', 'mouse', 'bird',
  'sat', 'lay', 'ran',
  'on', 'in', 'at',
  'big', 'small', 'good',
  'mat', 'the',
];
const VOCAB_SIZE = VOCAB.length;
const EMBED_DIM = 4;

// Embeddings — semantic axes baked in.
// Dim 0: animal · Dim 1: action · Dim 2: preposition · Dim 3: descriptor
const EMBED_TABLE: Record<string, number[]> = {
  cat:   [0.92, -0.05, 0.0, 0.1],
  dog:   [0.88, -0.05, 0.0, 0.12],
  mouse: [0.78, -0.05, 0.0, -0.08],
  bird:  [0.75, -0.05, 0.05, 0.05],
  sat:   [-0.05, 0.92, 0.0, 0.0],
  lay:   [-0.05, 0.88, 0.0, 0.0],
  ran:   [-0.05, 0.85, 0.0, 0.25],
  on:    [0.0, 0.0, 0.92, 0.0],
  in:    [0.0, 0.0, 0.88, 0.0],
  at:    [0.0, 0.0, 0.78, 0.0],
  big:   [0.0, 0.0, 0.0, 0.88],
  small: [0.0, 0.0, 0.0, -0.88],
  good:  [0.0, 0.0, 0.0, 0.92],
  mat:   [0.22, 0.0, 0.0, 0.0],
  the:   [0.04, 0.04, 0.04, 0.04],
};

function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / Math.sqrt(na * nb);
}

function signedFill(v: number, maxAbs: number): string {
  if (maxAbs === 0) return '#f1f5f9';
  const t = Math.min(1, Math.abs(v) / maxAbs);
  if (v > 0) return `rgb(${Math.round(255 - t * 200)}, ${Math.round(255 - t * 80)}, ${Math.round(255 - t * 80)})`;
  if (v < 0) return `rgb(255, ${Math.round(255 - t * 200)}, ${Math.round(255 - t * 200)})`;
  return '#f1f5f9';
}

export default function TokenToVector() {
  const [selected, setSelected] = useState('cat');
  const idx = VOCAB.indexOf(selected);
  const em = EMBED_TABLE[selected] ?? new Array(EMBED_DIM).fill(0);

  const similarities = useMemo(() => {
    return VOCAB.filter((w) => w !== selected)
      .map((w) => ({word: w, sim: cosine(em, EMBED_TABLE[w])}))
      .sort((a, b) => b.sim - a.sim)
      .slice(0, 4);
  }, [em, selected]);

  return (
    <div className="not-prose my-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-900">
      <div className="border-b border-slate-200 bg-gradient-to-br from-slate-50 to-white px-6 py-5 dark:border-slate-700 dark:from-slate-800 dark:to-slate-900">
        <p className="m-0 text-xl font-bold text-slate-900 dark:text-slate-100">
          From token ID to vector
        </p>
        <p className="m-0 mt-2 max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          After tokenization (above), each token is just an integer. The RNN can't consume an
          integer — it needs a vector. Compare the two ways to make that integer-to-vector jump:{' '}
          <strong className="text-rose-700 dark:text-rose-400">one-hot</strong> (sparse,
          high-dim, no semantics) vs{' '}
          <strong className="text-teal-700 dark:text-teal-400">learned embedding</strong> (dense,
          low-dim, semantically clustered).
        </p>
        <p className="m-0 mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          ⚠️ <strong>Hand-picked 15-word vocab</strong> below. Real tokenizers handle arbitrary
          text (try the playground above) — but to keep the cosine-similarity demo legible we
          curate a tiny vocab and hand-tune embeddings into 4 semantic groups.
        </p>
      </div>

      <div className="space-y-5 p-6">
        {/* Word picker */}
        <div>
          <p className="m-0 mb-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Pick a token
          </p>
          <div className="flex flex-wrap gap-1.5">
            {VOCAB.map((w) => {
              const isSelected = w === selected;
              return (
                <button
                  key={w}
                  type="button"
                  onClick={() => setSelected(w)}
                  className={`rounded-lg border-2 px-3 py-1.5 font-mono text-sm font-semibold transition-all ${
                    isSelected
                      ? 'border-teal-500 bg-teal-50 text-teal-900 shadow-sm dark:border-teal-500 dark:bg-teal-950/40 dark:text-teal-100'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {w}
                </button>
              );
            })}
          </div>
          <p className="m-0 mt-2 text-xs text-slate-500 dark:text-slate-400">
            Selected: <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{selected}</span>{' '}
            → vocab index{' '}
            <span className="rounded bg-violet-100 px-1.5 py-0.5 font-mono text-xs font-bold text-violet-900 dark:bg-violet-900/40 dark:text-violet-200">
              {idx}
            </span>
          </p>
        </div>

        {/* Side-by-side: one-hot vs embedding */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* One-hot */}
          <div className="rounded-2xl border-2 border-rose-200 bg-rose-50/40 p-5 dark:border-rose-800 dark:bg-rose-950/20">
            <p className="m-0 text-base font-bold text-rose-900 dark:text-rose-200">One-hot encoding</p>
            <p className="m-0 mt-1 text-xs text-slate-600 dark:text-slate-400">
              ℝ<sup>{VOCAB_SIZE}</sup> · all zeros, single 1 at index {idx}
            </p>
            <div className="mt-3 overflow-x-auto">
              <svg
                viewBox={`0 0 ${VOCAB_SIZE * 28} 38`}
                width="100%"
                height="38"
                style={{maxWidth: VOCAB_SIZE * 28}}
                className="block"
              >
                {VOCAB.map((_, i) => {
                  const isHot = i === idx;
                  return (
                    <g key={i}>
                      <rect
                        x={i * 28}
                        y={0}
                        width={28}
                        height={38}
                        fill={isHot ? '#e11d48' : '#f1f5f9'}
                        stroke="#94a3b8"
                        strokeWidth={0.5}
                        rx={3}
                      />
                      <text
                        x={i * 28 + 14}
                        y={24}
                        fontSize={12}
                        textAnchor="middle"
                        fill={isHot ? '#ffffff' : '#475569'}
                        fontFamily="ui-monospace, monospace"
                        fontWeight={isHot ? 700 : 400}
                      >
                        {isHot ? 1 : 0}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
            <p className="m-0 mt-3 text-xs italic text-slate-600 dark:text-slate-400">
              Scales to <strong>|V|</strong> per token. No semantic relationship between any two tokens.
            </p>
          </div>

          {/* Embedding */}
          <div className="rounded-2xl border-2 border-teal-200 bg-teal-50/40 p-5 dark:border-teal-800 dark:bg-teal-950/20">
            <p className="m-0 text-base font-bold text-teal-900 dark:text-teal-200">Learned embedding</p>
            <p className="m-0 mt-1 text-xs text-slate-600 dark:text-slate-400">
              ℝ<sup>{EMBED_DIM}</sup> · dense values · E[{idx}]
            </p>
            <div className="mt-3 flex justify-center">
              <svg viewBox={`0 0 ${EMBED_DIM * 64} 72`} width={EMBED_DIM * 64} height={72} className="block">
                {em.map((v, i) => (
                  <g key={i}>
                    <rect
                      x={i * 64}
                      y={0}
                      width={64}
                      height={64}
                      fill={signedFill(v, 1)}
                      stroke="#94a3b8"
                      strokeWidth={1}
                      rx={5}
                    />
                    <text
                      x={i * 64 + 32}
                      y={38}
                      fontSize={16}
                      textAnchor="middle"
                      fill="#0f172a"
                      fontFamily="ui-monospace, monospace"
                      fontWeight={700}
                    >
                      {v.toFixed(2)}
                    </text>
                    <text
                      x={i * 64 + 32}
                      y={55}
                      fontSize={10}
                      textAnchor="middle"
                      fill="#64748b"
                      fontFamily="ui-monospace, monospace"
                    >
                      dim {i}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
            <p className="m-0 mt-3 text-xs italic text-slate-600 dark:text-slate-400">
              Stays <strong>d ≪ |V|</strong> regardless of vocabulary size. Encodes meaning along each dim.
            </p>
          </div>
        </div>

        {/* Semantic neighbours */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-800/30">
          <div className="flex items-baseline justify-between">
            <p className="m-0 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Nearest neighbours by cosine similarity
            </p>
            <p className="m-0 text-[11px] italic text-slate-500 dark:text-slate-400">
              Only embeddings cluster like this — one-hot vectors have cosine similarity 0 between every pair.
            </p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {similarities.map(({word, sim}) => (
              <div
                key={word}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 shadow-sm dark:border-slate-700 dark:bg-slate-800"
              >
                <span className="font-mono text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {word}
                </span>
                <span
                  className={`rounded px-2 py-0.5 font-mono text-xs font-bold tabular-nums ${
                    sim > 0.5
                      ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-100'
                      : sim > 0.05
                        ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                        : 'bg-rose-200 text-rose-900 dark:bg-rose-900/60 dark:text-rose-100'
                  }`}
                >
                  {sim.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Math */}
        <div className="rounded-2xl bg-slate-50 px-5 py-4 dark:bg-slate-800/40">
          <div className="grid gap-1.5 text-center font-mono text-sm text-slate-900 dark:text-slate-100 sm:grid-cols-2">
            <p className="m-0">
              one-hot(i) = e<sub>i</sub> ∈ {'{'} 0, 1 {'}'}<sup>|V|</sup>
            </p>
            <p className="m-0">
              embed(i) = E[i] ∈ ℝ<sup>d</sup>, d ≪ |V|
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
