import React, {useCallback, useEffect, useMemo, useState} from 'react';

// ─── Vocabulary (16 words — keeps one-hot legible) ────────────
const VOCAB: string[] = [
  '<UNK>', 'the',  'cat', 'dog',
  'mouse', 'bird', 'sat', 'lay',
  'ran',   'on',   'in',  'at',
  'mat',   'big',  'small', 'good',
];
const VOCAB_SIZE = VOCAB.length;
const EMBED_DIM = 4;

// Hand-designed 4-D embeddings — semantic axes baked in.
// Dim 0: animal · Dim 1: action verb · Dim 2: preposition · Dim 3: descriptor
const EMBED_TABLE: Record<string, number[]> = {
  '<UNK>': [0.0,  0.0,  0.0,  0.0],
  'the':   [0.04, 0.04, 0.04, 0.04],
  'cat':   [0.92, -0.05, 0.0, 0.1],
  'dog':   [0.88, -0.05, 0.0, 0.12],
  'mouse': [0.78, -0.05, 0.0, -0.08],
  'bird':  [0.75, -0.05, 0.05, 0.05],
  'sat':   [-0.05, 0.92, 0.0, 0.0],
  'lay':   [-0.05, 0.88, 0.0, 0.0],
  'ran':   [-0.05, 0.85, 0.0, 0.25],
  'on':    [0.0, 0.0, 0.92, 0.0],
  'in':    [0.0, 0.0, 0.88, 0.0],
  'at':    [0.0, 0.0, 0.78, 0.0],
  'mat':   [0.22, 0.0, 0.0, 0.0],
  'big':   [0.0, 0.0, 0.0, 0.88],
  'small': [0.0, 0.0, 0.0, -0.88],
  'good':  [0.0, 0.0, 0.0, 0.92],
};

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 0);
}

function vocabIndex(token: string): number {
  const i = VOCAB.indexOf(token);
  return i === -1 ? 0 : i; // UNK fallback
}

function oneHot(idx: number): number[] {
  const v = new Array(VOCAB_SIZE).fill(0);
  v[idx] = 1;
  return v;
}

function embed(token: string): number[] {
  return EMBED_TABLE[token] ?? EMBED_TABLE['<UNK>'];
}

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

// ─── Color helpers ────────────────────────────────────────────
function signedFill(v: number, maxAbs: number): string {
  if (maxAbs === 0) return '#f1f5f9';
  const t = Math.min(1, Math.abs(v) / maxAbs);
  if (v > 0) return `rgb(${Math.round(255 - t * 200)}, ${Math.round(255 - t * 80)}, ${Math.round(255 - t * 80)})`;
  if (v < 0) return `rgb(255, ${Math.round(255 - t * 200)}, ${Math.round(255 - t * 200)})`;
  return '#f1f5f9';
}

// ─── Main component ───────────────────────────────────────────
const DEFAULT_TEXT = 'the cat sat on the mat';

export default function TokenToVector() {
  const [text, setText] = useState(DEFAULT_TEXT);
  const [selectedIdx, setSelectedIdx] = useState(1); // index into tokens

  const tokens = useMemo(() => tokenize(text), [text]);
  const indices = useMemo(() => tokens.map(vocabIndex), [tokens]);

  // Clamp selectedIdx to a valid token (or 0 if no tokens)
  useEffect(() => {
    if (tokens.length === 0) {
      setSelectedIdx(0);
    } else if (selectedIdx >= tokens.length) {
      setSelectedIdx(tokens.length - 1);
    }
  }, [tokens, selectedIdx]);

  const selectedToken = tokens[selectedIdx] ?? '<UNK>';
  const selectedVocabIdx = indices[selectedIdx] ?? 0;
  const oh = useMemo(() => oneHot(selectedVocabIdx), [selectedVocabIdx]);
  const em = useMemo(() => embed(selectedToken), [selectedToken]);

  // Cosine similarities of selected embedding vs every other vocab embedding
  const similarities = useMemo(() => {
    return VOCAB.map((w) => ({word: w, sim: cosine(em, embed(w))}))
      .filter((x) => x.word !== selectedToken && x.word !== '<UNK>')
      .sort((a, b) => b.sim - a.sim)
      .slice(0, 4);
  }, [em, selectedToken]);

  return (
    <div className="not-prose my-6 overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="border-b border-slate-200 bg-gradient-to-br from-slate-50 to-white px-6 py-5 dark:border-slate-700 dark:from-slate-800 dark:to-slate-900">
        <p className="m-0 text-xl font-bold text-slate-900 dark:text-slate-100">
          Tokens to vectors
        </p>
        <p className="m-0 mt-2 max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          Type a sentence (try the default or your own — uses a 16-word vocab). Each token becomes an
          integer, then a vector. Click any token to compare its <strong>one-hot</strong> and{' '}
          <strong>learned-embedding</strong> representations side by side.
        </p>
      </div>

      <div className="space-y-4 p-4 md:p-6">
        {/* Text input */}
        <div>
          <label htmlFor="ttv-input" className="m-0 text-[11px] font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300">
            Stage 0 · Input text
          </label>
          <input
            id="ttv-input"
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="mt-1 w-full rounded-lg border-2 border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            placeholder="type a sentence…"
          />
          <p className="m-0 mt-1 text-[10px] italic text-slate-500 dark:text-slate-400">
            Vocab: {VOCAB.slice(1).join(', ')} (anything else → &lt;UNK&gt;)
          </p>
        </div>

        {/* Stage 1: tokens */}
        <div className="rounded-xl border-2 border-sky-300 bg-sky-50/40 p-4 dark:border-sky-700 dark:bg-sky-950/20">
          <p className="m-0 text-[11px] font-bold uppercase tracking-wide text-sky-800 dark:text-sky-300">
            Stage 1 · Tokenize → {tokens.length} tokens
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {tokens.length === 0 && (
              <span className="text-xs italic text-slate-500 dark:text-slate-400">(no tokens)</span>
            )}
            {tokens.map((tok, i) => {
              const isSelected = i === selectedIdx;
              const isUnk = vocabIndex(tok) === 0;
              return (
                <button
                  key={`${tok}-${i}`}
                  type="button"
                  onClick={() => setSelectedIdx(i)}
                  className={`rounded-full border-2 px-3 py-1 font-mono text-xs font-semibold transition-all ${
                    isSelected
                      ? 'border-teal-500 bg-teal-100 text-teal-900 shadow-md dark:border-teal-500 dark:bg-teal-950/60 dark:text-teal-100'
                      : isUnk
                        ? 'border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100 dark:border-rose-700 dark:bg-rose-950/30 dark:text-rose-200'
                        : 'border-sky-300 bg-white text-sky-900 hover:bg-sky-100 dark:border-sky-700 dark:bg-slate-800 dark:text-sky-200 dark:hover:bg-sky-950/40'
                  }`}
                >
                  {tok}
                </button>
              );
            })}
          </div>
        </div>

        {/* Stage 2: vocab indices */}
        <div className="rounded-xl border-2 border-violet-300 bg-violet-50/40 p-4 dark:border-violet-700 dark:bg-violet-950/20">
          <p className="m-0 text-[11px] font-bold uppercase tracking-wide text-violet-800 dark:text-violet-300">
            Stage 2 · Vocab lookup → integer indices
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {tokens.map((tok, i) => {
              const idx = indices[i];
              const isSelected = i === selectedIdx;
              return (
                <button
                  key={`vocab-${i}`}
                  type="button"
                  onClick={() => setSelectedIdx(i)}
                  className={`flex items-center gap-1.5 rounded-md border-2 px-2.5 py-1 transition-all ${
                    isSelected
                      ? 'border-teal-500 bg-teal-50 shadow-sm dark:border-teal-500 dark:bg-teal-950/40'
                      : 'border-violet-300 bg-white hover:bg-violet-50 dark:border-violet-700 dark:bg-slate-800 dark:hover:bg-violet-950/30'
                  }`}
                >
                  <span className="font-mono text-xs text-slate-700 dark:text-slate-300">{tok}</span>
                  <span className="text-slate-300 dark:text-slate-600">→</span>
                  <span className="rounded bg-violet-200 px-1.5 py-0.5 font-mono text-xs font-bold text-violet-900 dark:bg-violet-900/60 dark:text-violet-200">
                    {idx}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Stage 3: selected token's vector representations */}
        <div className="rounded-xl border-2 border-amber-300 bg-amber-50/40 p-4 dark:border-amber-700 dark:bg-amber-950/20">
          <p className="m-0 text-[11px] font-bold uppercase tracking-wide text-amber-800 dark:text-amber-300">
            Stage 3 · Vector for{' '}
            <span className="rounded bg-amber-200 px-1.5 py-0.5 font-mono text-amber-950 dark:bg-amber-900/60 dark:text-amber-100">
              {selectedToken}
            </span>{' '}
            (index {selectedVocabIdx})
          </p>

          {/* One-hot */}
          <div className="mt-3">
            <p className="m-0 text-[10px] font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
              One-hot encoding · ℝ<sup>{VOCAB_SIZE}</sup> (sparse)
            </p>
            <div className="mt-1 overflow-x-auto">
              <svg
                viewBox={`0 0 ${VOCAB_SIZE * 24} 32`}
                width="100%"
                height="32"
                style={{maxWidth: VOCAB_SIZE * 24}}
                className="block"
              >
                {oh.map((v, i) => (
                  <g key={i}>
                    <rect
                      x={i * 24}
                      y={0}
                      width={24}
                      height={32}
                      fill={v === 1 ? '#0d9488' : '#f1f5f9'}
                      stroke="#94a3b8"
                      strokeWidth={0.5}
                    />
                    <text
                      x={i * 24 + 12}
                      y={20}
                      fontSize={11}
                      textAnchor="middle"
                      fill={v === 1 ? '#ffffff' : '#475569'}
                      fontFamily="ui-monospace, monospace"
                      fontWeight={v === 1 ? 700 : 400}
                    >
                      {v}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
            <p className="m-0 mt-1 text-[10px] italic text-slate-500 dark:text-slate-400">
              {VOCAB_SIZE - 1} zeros, one 1 at index {selectedVocabIdx}. Scales to{' '}
              <strong>|V|</strong> dimensions per token — wasteful for any realistic vocabulary.
            </p>
          </div>

          {/* Embedding */}
          <div className="mt-4">
            <p className="m-0 text-[10px] font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
              Learned embedding · ℝ<sup>{EMBED_DIM}</sup> (dense)
            </p>
            <div className="mt-1 flex items-center gap-2">
              <svg viewBox={`0 0 ${EMBED_DIM * 56} 56`} width={EMBED_DIM * 56} height={56} className="block">
                {em.map((v, i) => (
                  <g key={i}>
                    <rect
                      x={i * 56}
                      y={0}
                      width={56}
                      height={56}
                      fill={signedFill(v, 1)}
                      stroke="#94a3b8"
                      strokeWidth={1}
                    />
                    <text
                      x={i * 56 + 28}
                      y={32}
                      fontSize={14}
                      textAnchor="middle"
                      fill="#0f172a"
                      fontFamily="ui-monospace, monospace"
                      fontWeight={700}
                    >
                      {v.toFixed(2)}
                    </text>
                    <text
                      x={i * 56 + 28}
                      y={48}
                      fontSize={9}
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
            <p className="m-0 mt-1 text-[10px] italic text-slate-500 dark:text-slate-400">
              Lookup{' '}
              <span className="font-mono">E[{selectedVocabIdx}]</span>{' '}
              in an embedding matrix{' '}
              <span className="font-mono">E ∈ ℝ<sup>|V|×d</sup></span>. Here d = {EMBED_DIM} ≪ |V| = {VOCAB_SIZE}.
            </p>
          </div>

          {/* Similar embeddings */}
          {similarities.length > 0 && (
            <div className="mt-4 border-t border-amber-200 pt-3 dark:border-amber-800/50">
              <p className="m-0 text-[10px] font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                Nearest neighbours by cosine similarity (because embeddings encode meaning)
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {similarities.map(({word, sim}) => (
                  <div
                    key={word}
                    className="flex items-center gap-1.5 rounded-md border border-amber-300 bg-white/90 px-2.5 py-1 dark:border-amber-700 dark:bg-slate-800/80"
                  >
                    <span className="font-mono text-xs text-slate-800 dark:text-slate-200">{word}</span>
                    <span
                      className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                        sim > 0.5
                          ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-100'
                          : sim > 0
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
          )}
        </div>

        {/* Math */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-800/30">
          <div className="grid gap-1 text-center font-mono text-[12px] text-slate-900 dark:text-slate-100 sm:grid-cols-2">
            <p className="m-0">
              one-hot(i) = e<sub>i</sub> ∈ {'{'} 0, 1 {'}'}<sup>|V|</sup>
            </p>
            <p className="m-0">
              embed(i) = E[i] ∈ ℝ<sup>d</sup>, where E ∈ ℝ<sup>|V|×d</sup>
            </p>
          </div>
          <p className="m-0 mt-3 text-center text-[11px] italic text-slate-600 dark:text-slate-400">
            Embeddings are <strong>learned during training</strong> — semantically similar tokens
            (cat ↔ dog, on ↔ in) end up with similar vectors. That's the whole point of replacing one-hot.
          </p>
        </div>
      </div>
    </div>
  );
}
