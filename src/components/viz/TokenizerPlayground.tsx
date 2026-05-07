import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useTransformers } from './ModelPlayground';
import TokenStrip, { TokenItem } from './tensors/TokenStrip';

/**
 * TokenizerPlayground — type text once, see how three tokenizers carve it up.
 *
 * GPT-2 (byte-level BPE) vs BERT-uncased (WordPiece) vs Llama (SentencePiece).
 * Tokenizers are tiny (~5-10 MB each) and the worker keeps a per-model cache,
 * so the second time a tokenizer is needed it loads instantly from IndexedDB.
 */

const TOKENIZERS = [
  { id: 'Xenova/gpt2',                label: 'GPT-2',           kind: 'BPE (byte-level)' },
  { id: 'Xenova/bert-base-uncased',   label: 'BERT-uncased',    kind: 'WordPiece' },
  { id: 'Xenova/llama-tokenizer',     label: 'Llama',           kind: 'SentencePiece (BPE)' },
] as const;

const EXAMPLES = [
  { name: 'plain English',   text: 'The quick brown fox jumps over the lazy dog.' },
  { name: 'SolidGoldMagikarp', text: 'SolidGoldMagikarp is a glitch token from GPT-2.' },
  { name: 'indented code',   text: 'def fib(n):\n    if n < 2:\n        return n\n    return fib(n-1) + fib(n-2)' },
  { name: 'numbers',         text: 'Pi is 3.14159265358979 and 1234567890 is ten digits.' },
  { name: 'emoji',           text: 'I ❤️  tokens 🤖 — but not all of them 😅' },
  { name: 'Hindi',           text: 'मुझे टोकनाइज़ेशन समझना है।' },
  { name: 'Mandarin',        text: '让我们一起学习分词器。' },
  { name: 'mixed case',      text: 'CamelCase, snake_case, kebab-case, SCREAMING_SNAKE.' },
];

/** Stable color from token ID — keeps the same token the same color across tokenizers. */
function colorForId(id: number): string {
  // golden-ratio hue spread for visually-distinct neighbors
  const hue = (id * 137.508) % 360;
  return `hsl(${hue}, 65%, 38%)`;
}

interface ColumnState {
  loading: boolean;
  ready: boolean;
  error: string | null;
  tokens: TokenItem[];
  count: number;
  tookMs: number | null;
}

const EMPTY_COL: ColumnState = { loading: false, ready: false, error: null, tokens: [], count: 0, tookMs: null };

export default function TokenizerPlayground() {
  const { run, device } = useTransformers({ preload: true });
  const [text, setText] = useState(EXAMPLES[0].text);
  const [columns, setColumns] = useState<Record<string, ColumnState>>(() => {
    const c: Record<string, ColumnState> = {};
    TOKENIZERS.forEach((t) => { c[t.id] = { ...EMPTY_COL }; });
    return c;
  });
  const debounceRef = useRef<number | null>(null);

  // Re-tokenize on text change (debounced).
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      tokenizeAll(text);
    }, 120);
    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  function tokenizeAll(input: string) {
    if (!input) {
      const empty: Record<string, ColumnState> = {};
      TOKENIZERS.forEach((t) => { empty[t.id] = { ...EMPTY_COL }; });
      setColumns(empty);
      return;
    }
    TOKENIZERS.forEach((t) => {
      const t0 = performance.now();
      setColumns((prev) => ({ ...prev, [t.id]: { ...prev[t.id], loading: true, error: null } }));
      run<{ tokens: string[]; ids: number[]; count: number }>(
        { task: 'tokenize', modelId: t.id, text: input },
      ).then((res) => {
        const items: TokenItem[] = res.tokens.map((tok, i) => ({
          text: tok,
          id: res.ids[i],
          color: colorForId(res.ids[i]),
        }));
        setColumns((prev) => ({
          ...prev,
          [t.id]: {
            loading: false, ready: true, error: null,
            tokens: items, count: res.count,
            tookMs: performance.now() - t0,
          },
        }));
      }).catch((err: Error) => {
        setColumns((prev) => ({
          ...prev,
          [t.id]: { ...prev[t.id], loading: false, error: err.message },
        }));
      });
    });
  }

  return (
    <div className="not-prose my-8">
      <div className="rounded-2xl overflow-hidden border border-slate-700/50 bg-slate-950 font-mono text-sm">

        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-800 bg-slate-900/60 flex-wrap">
          <span className="flex items-center gap-1.5 text-xs text-violet-400 font-sans font-semibold">
            <span className="inline-block w-2 h-2 rounded-full bg-violet-400" />
            Tokenizer Playground
          </span>
          {device !== 'unknown' && (
            <span className={`text-[10px] font-sans px-2 py-0.5 rounded ${
              device === 'webgpu' ? 'bg-emerald-900/40 text-emerald-400' : 'bg-amber-900/40 text-amber-400'
            }`}>
              {device === 'webgpu' ? 'WebGPU' : 'WASM'}
            </span>
          )}
        </div>

        {/* Examples */}
        <div className="px-4 pt-3 pb-2 flex flex-wrap gap-1.5">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.name}
              onClick={() => setText(ex.text)}
              className="text-[11px] font-sans px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/50"
            >
              {ex.name}
            </button>
          ))}
        </div>

        {/* Textarea */}
        <div className="px-4 pb-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
            rows={Math.min(10, Math.max(2, text.split('\n').length + 1))}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-slate-200 font-mono text-xs leading-6 outline-none focus:border-violet-700 resize-y"
            placeholder="Type something to see how each tokenizer splits it…"
          />
        </div>

        {/* Three columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 px-4 pb-4">
          {TOKENIZERS.map((t) => {
            const col = columns[t.id];
            return (
              <div key={t.id} className="rounded-lg border border-slate-800 bg-slate-900/40 overflow-hidden">
                <div className="flex items-baseline justify-between px-3 py-2 border-b border-slate-800 bg-slate-900/80">
                  <div>
                    <div className="text-xs font-sans font-semibold text-slate-200">{t.label}</div>
                    <div className="text-[10px] font-sans text-slate-500">{t.kind}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono text-violet-300 tabular-nums">
                      {col.ready ? col.count : col.loading ? '…' : '—'} tokens
                    </div>
                    {col.tookMs != null && col.ready && (
                      <div className="text-[10px] font-sans text-slate-500">{col.tookMs.toFixed(0)} ms</div>
                    )}
                  </div>
                </div>
                <div className="p-2 min-h-[80px]">
                  {col.loading && !col.tokens.length && (
                    <div className="flex items-center gap-2 px-2 py-3 text-[11px] font-sans text-slate-500">
                      <span className="inline-block w-3 h-3 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                      Loading tokenizer…
                    </div>
                  )}
                  {col.error && (
                    <div className="px-2 py-2 text-[11px] font-mono text-red-400 break-all">
                      {col.error}
                    </div>
                  )}
                  {col.tokens.length > 0 && (
                    <TokenStrip tokens={col.tokens} showIds />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-4 pb-3 text-[11px] text-slate-500 font-sans">
          Each tokenizer downloads once (~5–10 MB), then runs entirely in your browser. Same color = same token ID across runs.
        </div>
      </div>
    </div>
  );
}
