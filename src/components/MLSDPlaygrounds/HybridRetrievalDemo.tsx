import React, {useState, useMemo} from 'react';
import styles from './styles.module.css';

// --- Synthetic corpus -----------------------------------------------------
// Each document has a text + a topic vector across 6 topics.
// Topics: 0=cancel/refund · 1=error/troubleshoot · 2=auth/login · 3=pricing · 4=setup/integration · 5=company

interface Doc {
  id: number;
  text: string;
  topics: number[];
}

const CORPUS: Doc[] = [
  {id: 1,  text: 'How do I cancel my Acme Pro subscription? Open Settings → Billing → "Cancel plan".',                topics: [1.0, 0,   0,   0.2, 0,   0  ]},
  {id: 2,  text: 'To discontinue your service plan, navigate to your account preferences and click "end membership".', topics: [0.95, 0,   0,   0,   0.2, 0  ]},
  {id: 3,  text: 'Acme Pro v3.7.2 release notes: new CSV export, bug fix for the ABC-9000 timeout error.',             topics: [0,   0.6, 0,   0,   0,   0.6]},
  {id: 4,  text: 'Refund policy: full refund within 30 days of purchase, no questions asked. Pro-rated for annual.',  topics: [0.85, 0,   0,   0.4, 0,   0  ]},
  {id: 5,  text: 'Login error: if you see ERROR_AUTH_403, clear your browser cookies and re-authenticate.',            topics: [0,   1.0, 0.6, 0,   0,   0  ]},
  {id: 6,  text: 'How do I reset my password? A recovery email is sent within five minutes — check your inbox.',       topics: [0,   0.2, 1.0, 0,   0,   0  ]},
  {id: 7,  text: 'I forgot my login credentials and cannot access my account anymore — what should I try?',            topics: [0,   0.2, 1.0, 0,   0,   0  ]},
  {id: 8,  text: 'Pricing tiers: Free, Pro ($29/mo), Enterprise (contact sales). Pro includes 100 GB of storage.',     topics: [0,   0,   0,   1.0, 0,   0.2]},
  {id: 9,  text: 'ABC-9000 error code: this is a server-side timeout. Wait 5 minutes and retry the operation.',        topics: [0,   1.0, 0,   0,   0,   0  ]},
  {id: 10, text: "What does it cost? Subscription plans start at $29/month for Pro; volume discounts above 50 seats.", topics: [0.2, 0,   0,   1.0, 0,   0  ]},
  {id: 11, text: 'Acme Corporation, founded 2015, is a leading provider of cloud productivity software.',              topics: [0,   0,   0,   0,   0,   1.0]},
  {id: 12, text: 'How to integrate Acme with Slack: open the Integrations panel and authorize the bot via OAuth.',     topics: [0,   0,   0,   0,   1.0, 0.2]},
];

// --- Sample queries -------------------------------------------------------
interface SampleQuery {
  label: string;
  text: string;
  topics: number[];
  hint: string;
}

const SAMPLE_QUERIES: SampleQuery[] = [
  {
    label: 'BM25 strength · rare entity',
    text: 'ABC-9000 error code',
    topics: [0, 1.0, 0, 0, 0, 0],
    hint: 'Rare entity ("ABC-9000") that BM25 matches via exact term overlap. Dense embeddings without the entity in their vocabulary may underperform.',
  },
  {
    label: 'Dense strength · paraphrase',
    text: 'how to remove my account',
    topics: [1.0, 0, 0, 0, 0, 0],
    hint: 'No documents share the words "remove" or "account" with the cancel/discontinue docs — pure BM25 misses them. Dense matches semantically.',
  },
  {
    label: 'Both strong',
    text: 'how do I cancel my subscription',
    topics: [1.0, 0, 0, 0.3, 0, 0],
    hint: '"Cancel" and "subscription" are tokens that match BM25 directly; topic affinity also matches the cancel cluster. Hybrid is similar to either alone.',
  },
  {
    label: 'Auth paraphrase',
    text: 'I cannot log in to my account',
    topics: [0, 0.3, 1.0, 0, 0, 0],
    hint: 'Mixed: the word "log" partially matches "login"; topic affinity for the auth cluster is strong. Hybrid catches the right doc cleanly.',
  },
  {
    label: 'Pricing question',
    text: 'what is the pricing plan',
    topics: [0, 0, 0, 1.0, 0, 0],
    hint: 'Both methods do well. Hybrid converges on the same answer with higher confidence (RRF rewards consensus across retrievers).',
  },
];

// --- BM25 -----------------------------------------------------------------
function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[^\w\s-]/g, ' ').split(/\s+/).filter((t) => t.length > 1);
}

function bm25Scores(query: string, corpus: Doc[]): number[] {
  const k1 = 1.5, b = 0.75;
  const queryTokens = tokenize(query);
  const docTokens = corpus.map((d) => tokenize(d.text));
  const N = corpus.length;
  const avgLen = docTokens.reduce((s, t) => s + t.length, 0) / N;

  // Document frequency per query term
  const dfMap = new Map<string, number>();
  for (const term of new Set(queryTokens)) {
    let df = 0;
    for (const dt of docTokens) if (dt.includes(term)) df += 1;
    dfMap.set(term, df);
  }

  return docTokens.map((dt) => {
    let score = 0;
    for (const term of queryTokens) {
      const tf = dt.filter((t) => t === term).length;
      if (tf === 0) continue;
      const df = dfMap.get(term) || 0;
      const idf = Math.log(((N - df + 0.5) / (df + 0.5)) + 1);
      const tfNorm = (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (dt.length / avgLen)));
      score += idf * tfNorm;
    }
    return score;
  });
}

// --- Dense (cosine of topic vectors) -------------------------------------
function denseScores(queryTopics: number[], corpus: Doc[]): number[] {
  function cosine(a: number[], b: number[]): number {
    let dot = 0, na = 0, nb = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      na += a[i] * a[i];
      nb += b[i] * b[i];
    }
    return dot / (Math.sqrt(na * nb) || 1);
  }
  return corpus.map((d) => cosine(queryTopics, d.topics));
}

// --- Rank from scores -----------------------------------------------------
function ranksFromScores(scores: number[]): Array<{id: number; score: number; rank: number}> {
  return scores
    .map((s, i) => ({id: CORPUS[i].id, score: s}))
    .sort((a, b) => b.score - a.score)
    .map((r, idx) => ({...r, rank: idx + 1}));
}

// --- RRF ------------------------------------------------------------------
function rrfFusion(
  bmRanks: Array<{id: number; rank: number}>,
  dnRanks: Array<{id: number; rank: number}>,
  k: number,
): Array<{id: number; rank: number; rrf: number; bmRank: number; dnRank: number}> {
  const ids = new Set([...bmRanks.map((r) => r.id), ...dnRanks.map((r) => r.id)]);
  const fused = [...ids].map((id) => {
    const bmRank = bmRanks.find((r) => r.id === id)?.rank ?? 0;
    const dnRank = dnRanks.find((r) => r.id === id)?.rank ?? 0;
    const bmContribution = bmRank > 0 ? 1 / (k + bmRank) : 0;
    const dnContribution = dnRank > 0 ? 1 / (k + dnRank) : 0;
    return {id, rrf: bmContribution + dnContribution, bmRank, dnRank};
  });
  fused.sort((a, b) => b.rrf - a.rrf);
  return fused.map((f, idx) => ({...f, rank: idx + 1}));
}

// --- Component ------------------------------------------------------------
const TOP_K = 5;

export default function HybridRetrievalDemo() {
  const [queryIdx, setQueryIdx] = useState(0);
  const [customQuery, setCustomQuery] = useState('');
  const [k, setK] = useState(60);
  const [useCustom, setUseCustom] = useState(false);

  const activeQuery = useCustom ? customQuery : SAMPLE_QUERIES[queryIdx].text;
  // For custom queries we approximate topics by zeroing — dense is degraded; this is honest.
  const activeTopics = useCustom
    ? (() => {
        // Naive: pick the topic that has the strongest token overlap with corpus topic-words.
        // Falls back to a "general" zero vector — dense will be flat.
        const t = [0, 0, 0, 0, 0, 0];
        const lc = customQuery.toLowerCase();
        if (/cancel|refund|discontinue|remove|end/.test(lc)) t[0] = 1;
        if (/error|fail|timeout|broken|bug/.test(lc))       t[1] = 1;
        if (/login|password|auth|access/.test(lc))          t[2] = 1;
        if (/cost|price|pricing|plan|tier/.test(lc))        t[3] = 1;
        if (/integrate|setup|install|connect/.test(lc))     t[4] = 1;
        if (/company|about|founded/.test(lc))               t[5] = 1;
        return t;
      })()
    : SAMPLE_QUERIES[queryIdx].topics;

  const bmScores = useMemo(() => bmScoresMemo(activeQuery), [activeQuery]);
  const dnScores = useMemo(() => denseScores(activeTopics, CORPUS), [activeTopics]);
  const bmRanks = useMemo(() => ranksFromScores(bmScores), [bmScores]);
  const dnRanks = useMemo(() => ranksFromScores(dnScores), [dnScores]);
  const rrfRanks = useMemo(() => rrfFusion(bmRanks, dnRanks, k), [bmRanks, dnRanks, k]);

  // Top-K for each
  const bmTop = bmRanks.slice(0, TOP_K);
  const dnTop = dnRanks.slice(0, TOP_K);
  const rrfTop = rrfRanks.slice(0, TOP_K);

  // Set memberships for badges
  const bmIds = new Set(bmTop.map((r) => r.id));
  const dnIds = new Set(dnTop.map((r) => r.id));
  const rrfIds = new Set(rrfTop.map((r) => r.id));

  function badge(id: number, currentSet: Set<number>) {
    const inAll3 = bmIds.has(id) && dnIds.has(id) && rrfIds.has(id);
    if (inAll3) return {label: '★', color: '#10b981', tip: 'Top-K in all three retrievers'};
    if (currentSet === bmIds) {
      if (dnIds.has(id) && !rrfIds.has(id)) return {label: 'D', color: '#3b82f6', tip: 'Also in dense top-K'};
      if (rrfIds.has(id)) return {label: 'H', color: '#fb923c', tip: 'Also in hybrid top-K'};
    }
    if (currentSet === dnIds) {
      if (bmIds.has(id) && !rrfIds.has(id)) return {label: 'B', color: '#8b5cf6', tip: 'Also in BM25 top-K'};
      if (rrfIds.has(id)) return {label: 'H', color: '#fb923c', tip: 'Also in hybrid top-K'};
    }
    return null;
  }

  return (
    <div className={styles.playground}>
      <p className={styles.tag}>Interactive · Hybrid retrieval (BM25 + dense + RRF)</p>
      <p className={styles.heading}>Side-by-side: how each retriever sees your query</p>
      <p className={styles.subheading}>
        12 customer-support documents. The same query is run through three retrievers — BM25 (sparse, exact-match), a dense topic-affinity model, and a hybrid that fuses both via Reciprocal Rank Fusion. Try the preset queries to feel each retriever's strengths and failure modes.
      </p>

      <div className={styles.controls}>
        <div className={styles.controlRow}>
          <label className={styles.controlLabel}>Query type</label>
          <div className={styles.toggleGroup}>
            <button
              className={`${styles.toggleButton} ${!useCustom ? styles.toggleButtonActive : ''}`}
              onClick={() => setUseCustom(false)}
            >Preset</button>
            <button
              className={`${styles.toggleButton} ${useCustom ? styles.toggleButtonActive : ''}`}
              onClick={() => setUseCustom(true)}
            >Custom</button>
          </div>
          <span />
        </div>

        {!useCustom ? (
          <div className={styles.controlRow}>
            <label className={styles.controlLabel}>Preset query</label>
            <select
              className={styles.select}
              value={queryIdx}
              onChange={(e) => setQueryIdx(parseInt(e.target.value, 10))}
              style={{gridColumn: 'span 2'}}
            >
              {SAMPLE_QUERIES.map((q, i) => (
                <option key={i} value={i}>{q.label} — "{q.text}"</option>
              ))}
            </select>
          </div>
        ) : (
          <div className={styles.controlRow}>
            <label className={styles.controlLabel}>Custom query</label>
            <input
              type="text"
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              placeholder="Type a query…"
              className={styles.select}
              style={{gridColumn: 'span 2'}}
            />
          </div>
        )}

        <div className={styles.controlRow}>
          <label className={styles.controlLabel}>RRF constant <code>k</code></label>
          <input type="range" min={5} max={100} step={5}
            value={k}
            onChange={(e) => setK(parseInt(e.target.value, 10))}
            className={styles.slider}
          />
          <span className={styles.controlValue}>{k}</span>
        </div>
      </div>

      {/* Three columns of results */}
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem', marginTop: '1rem'}}>
        <ResultColumn title="BM25 (sparse)" tone="#8b5cf6" results={bmTop} corpus={CORPUS} renderBadge={(id) => badge(id, bmIds)} formatScore={(s) => s.toFixed(2)} />
        <ResultColumn title="Dense (topic affinity)" tone="#3b82f6" results={dnTop} corpus={CORPUS} renderBadge={(id) => badge(id, dnIds)} formatScore={(s) => s.toFixed(3)} />
        <ResultColumn title={`Hybrid (RRF, k=${k})`} tone="#fb6f5d" results={rrfTop.map((r) => ({...r, score: r.rrf}))} corpus={CORPUS} renderBadge={(id) => null} formatScore={(s) => s.toFixed(4)} extraInfo={(id) => {
          const r = rrfTop.find((x) => x.id === id);
          if (!r) return '';
          return `BM25 rank ${r.bmRank || '—'} · dense rank ${r.dnRank || '—'}`;
        }} />
      </div>

      <p className={styles.commentary}>
        {useCustom
          ? `Custom query — note that dense scoring is approximated by detecting a few topic keywords; for a real production system the dense path would use a learned embedding model. Try the preset queries for the cleanest demonstration of each retriever's strengths.`
          : SAMPLE_QUERIES[queryIdx].hint
        }
        <br /><br />
        <strong>Reading the columns:</strong> a <span style={{color: '#10b981', fontWeight: 700}}>★</span> in BM25 or dense means the doc is also in the hybrid top-K (the consensus winners). RRF rewards documents that appear high in <em>both</em> retrievers — that's why hybrid retrieval is the production default.
      </p>
    </div>
  );
}

// Memoised wrapper to avoid recomputing tokenisation on every render
const _bmCache = new Map<string, number[]>();
function bmScoresMemo(query: string): number[] {
  if (_bmCache.has(query)) return _bmCache.get(query)!;
  const s = bm25Scores(query, CORPUS);
  _bmCache.set(query, s);
  return s;
}

// --- Sub-component for a result column -----------------------------------
interface ResultColumnProps {
  title: string;
  tone: string;
  results: Array<{id: number; rank: number; score: number}>;
  corpus: Doc[];
  renderBadge: (id: number) => {label: string; color: string; tip: string} | null;
  formatScore: (s: number) => string;
  extraInfo?: (id: number) => string;
}

function ResultColumn({title, tone, results, corpus, renderBadge, formatScore, extraInfo}: ResultColumnProps) {
  return (
    <div style={{
      padding: '0.85rem 0.95rem',
      borderRadius: 10,
      background: '#ffffff',
      border: `1px solid ${tone}33`,
      borderTop: `3px solid ${tone}`,
    }}>
      <p style={{margin: '0 0 0.6rem 0', fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: tone}}>{title}</p>
      <ol style={{margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
        {results.map((r) => {
          const doc = corpus.find((d) => d.id === r.id);
          if (!doc) return null;
          const b = renderBadge(r.id);
          return (
            <li key={r.id} style={{padding: '0.5rem 0.6rem', background: '#f8fafc', borderRadius: 6, fontSize: '0.86rem', lineHeight: 1.4}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem'}}>
                <span style={{
                  display: 'inline-block', width: 18, height: 18, borderRadius: '50%',
                  background: tone, color: '#fff', textAlign: 'center', lineHeight: '18px',
                  fontSize: '0.72rem', fontWeight: 700,
                }}>{r.rank}</span>
                <span style={{fontFamily: 'Menlo, monospace', fontSize: '0.74rem', color: '#64748b'}}>doc #{doc.id}</span>
                <span style={{fontFamily: 'Menlo, monospace', fontSize: '0.74rem', color: '#64748b', marginLeft: 'auto'}}>{formatScore(r.score)}</span>
                {b && (
                  <span title={b.tip} style={{
                    fontSize: '0.7rem', fontWeight: 700,
                    width: 18, height: 18, lineHeight: '18px', textAlign: 'center',
                    borderRadius: 4, background: b.color, color: '#fff',
                  }}>{b.label}</span>
                )}
              </div>
              <div style={{color: '#1e293b'}}>{doc.text}</div>
              {extraInfo && (
                <div style={{marginTop: '0.25rem', fontSize: '0.74rem', color: '#64748b', fontFamily: 'Menlo, monospace'}}>
                  {extraInfo(r.id)}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
