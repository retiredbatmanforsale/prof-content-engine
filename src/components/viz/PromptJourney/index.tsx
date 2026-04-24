import React, { useState, useMemo, useCallback, type CSSProperties } from 'react';
import styles from './styles.module.css';

// ── Types ─────────────────────────────────────────────────────────────────────

type TokenDef  = { text: string; id: number; color: string };
type Candidate = { text: string; id: number; logit: number };

// ── Data ──────────────────────────────────────────────────────────────────────

const INITIAL_TOKENS: TokenDef[] = [
  { text: 'The',  id: 464,  color: '#3B82F6' },
  { text: ' cat', id: 3797, color: '#10B981' },
  { text: ' sat', id: 3332, color: '#F59E0B' },
  { text: ' on',  id: 319,  color: '#8B5CF6' },
  { text: ' the', id: 262,  color: '#FF7F50' },
];

const GEN_COLORS = ['#EC4899','#06B6D4','#84CC16','#F97316','#A78BFA','#34D399','#FB923C','#22D3EE'];

const CANDIDATES_0: Candidate[] = [
  { text: ' mat',      id: 16850, logit: 4.8 },
  { text: ' floor',    id: 4910,  logit: 4.1 },
  { text: ' couch',    id: 23651, logit: 3.6 },
  { text: ' ground',   id: 3288,  logit: 3.2 },
  { text: ' roof',     id: 9015,  logit: 2.7 },
  { text: ' table',    id: 3084,  logit: 2.4 },
  { text: ' chair',    id: 5118,  logit: 2.0 },
  { text: ' window',   id: 4324,  logit: 1.6 },
  { text: ' dog',      id: 3290,  logit: 1.1 },
  { text: ' way',      id: 835,   logit: 0.5 },
];

const CANDIDATES_1: Candidate[] = [
  { text: '.',        id: 13,    logit: 4.5 },
  { text: ',',        id: 11,    logit: 3.8 },
  { text: ' and',     id: 290,   logit: 3.3 },
  { text: ' in',      id: 287,   logit: 2.9 },
  { text: ' the',     id: 262,   logit: 2.5 },
  { text: ' while',   id: 981,   logit: 2.0 },
  { text: ' like',    id: 588,   logit: 1.6 },
  { text: ' before',  id: 878,   logit: 1.2 },
  { text: ' next',    id: 1306,  logit: 0.8 },
  { text: ' often',   id: 1690,  logit: 0.3 },
];

const CAND_SETS = [CANDIDATES_0, CANDIDATES_1];

const STAGE_NAMES = [
  'Tokenization',
  'Embedding Lookup',
  'Positional Encoding',
  'Attention (×12)',
  'Logit Projection',
  'Temperature + Softmax',
  'Sample → Loop',
];

// ── Math ──────────────────────────────────────────────────────────────────────

function softmaxT(logits: number[], temp: number): number[] {
  const t = Math.max(temp, 0.05);
  const sc = logits.map(l => l / t);
  const mx = Math.max(...sc);
  const ex = sc.map(l => Math.exp(l - mx));
  const s  = ex.reduce((a, b) => a + b, 0);
  return ex.map(e => e / s);
}

function seededRand(seed: number): () => number {
  let s = seed >>> 0;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
}

function hexRgb(hex: string): string {
  const c = hex.replace('#', '');
  return `${parseInt(c.slice(0,2),16)},${parseInt(c.slice(2,4),16)},${parseInt(c.slice(4,6),16)}`;
}

function buildAttn(n: number): number[][] {
  const rand = seededRand(n * 137);
  return Array.from({ length: n }, (_, i) => {
    const raw = Array.from({ length: n }, (_, j) => {
      if (j > i) return -Infinity;
      return (rand() * 3 - 1.5) + (i === j ? 2.5 : 0) + (j === i - 1 ? 1.2 : 0);
    });
    const fin = raw.filter(isFinite);
    if (!fin.length) return raw.map(() => 0);
    const mx  = Math.max(...fin);
    const ex  = raw.map(v => isFinite(v) ? Math.exp(v - mx) : 0);
    const sum = ex.reduce((a, b) => a + b, 0);
    return sum ? ex.map(e => e / sum) : ex;
  });
}

// ── Sequence Strip ─────────────────────────────────────────────────────────────

function SequenceStrip({ tokens, flashIdx }: { tokens: TokenDef[]; flashIdx: number }) {
  return (
    <div className={styles.strip}>
      <span className={styles.stripLbl}>Sequence</span>
      <div className={styles.stripTokens}>
        {tokens.map((t, i) => (
          <span
            key={i}
            className={`${styles.stripTok} ${i === flashIdx ? styles.stripTokNew : ''}`}
            style={{ color: t.color, background: `rgba(${hexRgb(t.color)},0.12)`, border: `1px solid rgba(${hexRgb(t.color)},0.35)` }}
          >
            {t.text}
          </span>
        ))}
      </div>
      <span className={styles.stripCnt}>{tokens.length} tok</span>
    </div>
  );
}

// ── Stage Nav ─────────────────────────────────────────────────────────────────

function StageNav({ stage, onPrev, onNext }: { stage: number; onPrev: () => void; onNext: () => void }) {
  return (
    <div className={styles.nav}>
      <button className={styles.navBtn} onClick={onPrev} disabled={stage === 1}>←</button>
      <div className={styles.navMid}>
        <div className={styles.navDots}>
          {STAGE_NAMES.map((_, i) => (
            <div key={i} className={`${styles.dot} ${stage === i + 1 ? styles.dotOn : ''}`} />
          ))}
        </div>
        <span className={styles.navNum}>Stage {stage} / 7</span>
        <span className={styles.navName}>{STAGE_NAMES[stage - 1]}</span>
      </div>
      <button className={styles.navBtn} onClick={onNext} disabled={stage === 7}>→</button>
    </div>
  );
}

// ── Stage 1: Tokenization ─────────────────────────────────────────────────────

function Stage1({ tokens }: { tokens: TokenDef[] }) {
  const full = tokens.map(t => t.text).join('');
  return (
    <div className={styles.stage}>
      <p className={styles.desc}>The raw string is split into <strong>subword tokens</strong>. Each token maps to an integer ID in GPT-2's 50,257-token vocabulary.</p>
      <div className={styles.s1Raw}>
        <span className={styles.s1RawLbl}>Input string</span>
        <span className={styles.s1RawTxt}>"{full}"</span>
      </div>
      <div className={styles.s1Arrow}>↓ &nbsp;GPT-2 BPE tokenizer</div>
      <div className={styles.s1Chips}>
        {tokens.map((t, i) => (
          <div key={i} className={styles.s1Chip}
            style={{ background: `rgba(${hexRgb(t.color)},0.1)`, border: `1.5px solid rgba(${hexRgb(t.color)},0.4)`, animationDelay: `${i * 0.07}s` }}>
            <span className={styles.s1ChipTxt} style={{ color: t.color }}>{t.text}</span>
            <span className={styles.s1ChipId} style={{ color: `rgba(${hexRgb(t.color)},0.7)` }}>id {t.id}</span>
          </div>
        ))}
      </div>
      <div className={styles.s1Stats}>
        {[
          [tokens.length, 'tokens'],
          ['50,257', 'vocab'],
          [full.length, 'chars'],
        ].map(([v, l], i) => (
          <React.Fragment key={i}>
            {i > 0 && <div className={styles.statDiv} />}
            <div className={styles.stat}><strong>{v}</strong>{l}</div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ── Stage 2: Embedding Lookup ─────────────────────────────────────────────────

function Stage2({ tokens, focus, setFocus }: { tokens: TokenDef[]; focus: number; setFocus: (i: number) => void }) {
  const t    = tokens[focus];
  const rand = seededRand(t.id);
  const dims = Array.from({ length: 64 }, () => rand() * 2 - 1);

  return (
    <div className={styles.stage}>
      <p className={styles.desc}>A learned <strong>50,257 × 768</strong> weight matrix W_e maps each token ID to a 768-dim vector.</p>
      <div className={styles.s2Row}>
        {/* Matrix schematic */}
        <div className={styles.s2MatWrap}>
          <div className={styles.s2MatLbl}>W_e  [50,257 × 768]</div>
          <div className={styles.s2Mat}>
            {Array.from({ length: 11 }, (_, row) => {
              const hi = row === 5;
              return (
                <div key={row} className={`${styles.s2MatRow} ${hi ? styles.s2MatRowHi : ''}`}
                  style={hi ? { background: `rgba(${hexRgb(t.color)},0.14)` } : undefined}>
                  {hi && <span className={styles.s2RowLbl} style={{ color: t.color }}>row {t.id} "{t.text.trim()}"</span>}
                  {Array.from({ length: 7 }, (_, c) => (
                    <div key={c} className={`${styles.s2Cell} ${hi ? styles.s2CellHi : ''}`}
                      style={hi ? { background: `rgba(${hexRgb(t.color)},0.5)` } : undefined} />
                  ))}
                  {hi && <span className={styles.s2Ellip}>… ×768</span>}
                </div>
              );
            })}
            <div className={styles.s2Dots}>⋮  50,257 rows total</div>
          </div>
        </div>

        <div className={styles.s2Arr}>→</div>

        {/* Embedding vector */}
        <div className={styles.s2VecWrap}>
          <div className={styles.s2MatLbl}>embed("{t.text.trim()}")  [768]</div>
          <div className={styles.s2Vec}>
            {dims.map((v, i) => (
              <div key={i} className={styles.s2Dim}
                style={{
                  height: `${Math.abs(v) * 100}%`,
                  minHeight: 2,
                  background: v > 0
                    ? `rgba(${hexRgb(t.color)},${Math.abs(v) * 0.85 + 0.1})`
                    : `rgba(30,40,70,${Math.abs(v) * 0.7 + 0.08})`,
                }}
                title={`dim[${i}] = ${v.toFixed(3)}`}
              />
            ))}
          </div>
          <div className={styles.s2VecHint}>64 of 768 dims · hover for values</div>
        </div>
      </div>

      <div className={styles.s2Sel}>
        <span className={styles.s2SelLbl}>Switch token:</span>
        {tokens.map((tk, i) => (
          <button key={i}
            className={`${styles.s2SelBtn} ${focus === i ? styles.s2SelBtnOn : ''}`}
            style={focus === i ? { color: tk.color, background: `rgba(${hexRgb(tk.color)},0.12)`, borderColor: `rgba(${hexRgb(tk.color)},0.4)` } : undefined}
            onClick={() => setFocus(i)}
          >
            {tk.text}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Stage 3: Positional Encoding ──────────────────────────────────────────────

const pe = (pos: number, dim: number): number => {
  const i = Math.floor(dim / 2);
  const a = pos / Math.pow(10000, (2 * i) / 768);
  return dim % 2 === 0 ? Math.sin(a) : Math.cos(a);
};

function Stage3({ tokens, focus }: { tokens: TokenDef[]; focus: number }) {
  const DIMS = 8;
  const tok  = tokens[focus];
  return (
    <div className={styles.stage}>
      <p className={styles.desc}>Position is injected via <strong>sine/cosine waves</strong> of different frequencies. The input to block 1 is token_embed + PE(position).</p>

      <div className={styles.s3HmWrap}>
        <div className={styles.s3HmLbl}>PE[pos, dim]  — first {DIMS} of 768 dims</div>
        <div className={styles.s3Hm} style={{ gridTemplateColumns: `70px repeat(${tokens.length}, 1fr)` }}>
          <div />
          {tokens.map((t, p) => (
            <div key={p} className={styles.s3ColHdr} style={p === focus ? { color: t.color, fontWeight: 700 } : undefined}>p{p}</div>
          ))}
          {Array.from({ length: DIMS }, (_, d) => (
            <React.Fragment key={d}>
              <div className={styles.s3RowHdr}>{d % 2 === 0 ? `sin(i${Math.floor(d/2)})` : `cos(i${Math.floor(d/2)})`}</div>
              {tokens.map((_, p) => {
                const v = pe(p, d);
                return (
                  <div key={p} className={styles.s3Cell}
                    style={{
                      background: v > 0 ? `rgba(255,127,80,${v * 0.8 + 0.06})` : `rgba(59,130,246,${-v * 0.8 + 0.06})`,
                      outline: p === focus ? '1.5px solid rgba(255,127,80,0.55)' : 'none',
                    }}
                    title={`PE[${p},${d}] = ${v.toFixed(3)}`}
                  />
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className={styles.s3Add}>
        <span className={styles.s3AddTitle}>At position {focus} ("{tok.text.trim()}"):</span>
        <div className={styles.s3AddRow}>
          {[
            { lbl: `embed("${tok.text.trim()}")`, dim: '768', color: tok.color },
            null,
            { lbl: `PE[${focus}]`, dim: '768', color: '#FF7F50' },
            null,
            { lbl: `x_${focus}`, dim: '→ block 1', color: '#e5e5e5' },
          ].map((item, i) =>
            item === null ? (
              <span key={i} className={styles.s3Op}>{i === 1 ? '+' : '='}</span>
            ) : (
              <div key={i} className={styles.s3Block}
                style={{ background: `rgba(${hexRgb(item.color)},0.1)`, borderColor: `rgba(${hexRgb(item.color)},0.35)` }}>
                <span className={styles.s3BlockLbl} style={{ color: item.color }}>{item.lbl}</span>
                <span className={styles.s3BlockDim}>{item.dim}</span>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

// ── Stage 4: Attention ────────────────────────────────────────────────────────

function Stage4({ tokens }: { tokens: TokenDef[] }) {
  const [activeRow, setActiveRow] = useState(tokens.length - 1);
  const [block, setBlock]         = useState(6);
  const weights = useMemo(() => buildAttn(tokens.length), [tokens.length]);

  const W = 480, H = 200, nodeR = 20;
  const n = tokens.length;
  const spacing = Math.min(80, (W - 80) / Math.max(n - 1, 1));
  const startX  = (W - spacing * (n - 1)) / 2;
  const cy = 100;
  const cx = (i: number) => startX + i * spacing;

  return (
    <div className={styles.stage}>
      <p className={styles.desc}>12 transformer blocks each run <strong>masked self-attention</strong> + FFN. Each token attends to itself and past tokens only (causal).</p>

      <div className={styles.s4BlockRow}>
        <span className={styles.s4BLbl}>Block:</span>
        {Array.from({ length: 12 }, (_, i) => (
          <button key={i} className={`${styles.s4BBtn} ${block === i+1 ? styles.s4BBtnOn : ''}`}
            onClick={() => setBlock(i + 1)}>{i + 1}</button>
        ))}
      </div>

      <div className={styles.s4SvgWrap}>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} className={styles.s4Svg}>
          {/* Attention arcs */}
          {weights[activeRow].map((w, j) => {
            if (w < 0.03) return null;
            const x1 = cx(activeRow), x2 = cx(j);
            const mx = (x1 + x2) / 2;
            const my = j === activeRow ? cy - 55 : cy - Math.max(18, Math.abs(x1 - x2) * 0.28);
            return (
              <path key={j}
                d={`M ${x1} ${cy} Q ${mx} ${my} ${x2} ${cy}`}
                fill="none"
                stroke={tokens[j].color}
                strokeOpacity={w * 0.85 + 0.08}
                strokeWidth={w * 9 + 0.5}
                strokeLinecap="round"
              />
            );
          })}

          {/* Weight % labels */}
          {weights[activeRow].map((w, j) => {
            if (w < 0.06 || j === activeRow) return null;
            const x1 = cx(activeRow), x2 = cx(j);
            const labelY = cy - Math.max(22, Math.abs(x1 - x2) * 0.28) - 7;
            return (
              <text key={j} x={(x1 + x2) / 2} y={labelY}
                textAnchor="middle" fill={tokens[j].color} fontSize={9} fontWeight="bold" opacity={0.8}>
                {(w * 100).toFixed(0)}%
              </text>
            );
          })}

          {/* Token nodes */}
          {tokens.map((t, i) => (
            <g key={i} onClick={() => setActiveRow(i)} style={{ cursor: 'pointer' }}>
              <circle cx={cx(i)} cy={cy} r={nodeR}
                fill={t.color}
                opacity={i === activeRow ? 1 : 0.55}
                style={{ filter: i === activeRow ? `drop-shadow(0 0 8px ${t.color})` : 'none', transition: 'all 0.2s' }}
              />
              {i === activeRow && (
                <circle cx={cx(i)} cy={cy} r={nodeR + 5}
                  fill="none" stroke={t.color} strokeWidth={1.5} strokeOpacity={0.35}
                  strokeDasharray="4 3"
                />
              )}
              <text x={cx(i)} y={cy} textAnchor="middle" dy="0.35em"
                fill="white" fontSize={8} fontWeight="bold" pointerEvents="none">
                {t.text.trim().slice(0, 4)}
              </text>
              <text x={cx(i)} y={cy + nodeR + 13} textAnchor="middle" fill="#555" fontSize={8}>
                pos {i}
              </text>
            </g>
          ))}
        </svg>
        <div className={styles.s4Hint}>Click a token to see its attention pattern (block {block}/12, 12 heads averaged)</div>
      </div>

      {/* Residual stream */}
      <div className={styles.s4Res}>
        <span className={styles.s4ResLbl}>Residual stream through 12 blocks</span>
        <div className={styles.s4ResRow}>
          {Array.from({ length: 12 }, (_, i) => (
            <React.Fragment key={i}>
              <div className={`${styles.s4ResBlk} ${i < block ? styles.s4ResBlkDone : i === block-1 ? styles.s4ResBlkOn : ''}`}>
                B{i+1}
              </div>
              {i < 11 && <div className={styles.s4ResArr}>›</div>}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Stage 5: Logit Projection ─────────────────────────────────────────────────

function Stage5({ tokens }: { tokens: TokenDef[] }) {
  const last = tokens[tokens.length - 1];
  const maxL = CANDIDATES_0[0].logit;
  const minL = CANDIDATES_0[CANDIDATES_0.length - 1].logit;

  return (
    <div className={styles.stage}>
      <p className={styles.desc}>The last token's 768-dim hidden state is projected by <strong>W_u [768 × 50,257]</strong> to produce one raw logit score per vocabulary entry.</p>
      <div className={styles.s5Layout}>

        <div className={styles.s5Col}>
          <div className={styles.s5Lbl}>h₁₂("{last.text.trim()}")</div>
          <div className={styles.s5HVec}>
            {Array.from({ length: 14 }, (_, i) => (
              <div key={i} className={styles.s5HCell}
                style={{ background: `rgba(${hexRgb(last.color)},${0.25 + (i % 3) * 0.18})` }} />
            ))}
            <div className={styles.s5HMore}>768 dims</div>
          </div>
        </div>

        <div className={styles.s5MatWrap}>
          <div className={styles.s5Lbl}>W_u [768 × 50,257]</div>
          <div className={styles.s5Mat}>
            {Array.from({ length: 5 }, (_, r) => (
              <div key={r} className={styles.s5MatRow}>
                {Array.from({ length: 5 }, (_, c) => <div key={c} className={styles.s5MatCell} />)}
              </div>
            ))}
            <div className={styles.s5MatNote}>50,257 rows →</div>
          </div>
        </div>

        <div className={styles.s5LogWrap}>
          <div className={styles.s5Lbl}>Top-10 logits</div>
          <div className={styles.s5Logs}>
            {CANDIDATES_0.map((c, i) => (
              <div key={i} className={styles.s5LogRow}>
                <span className={styles.s5LogTok}>{c.text}</span>
                <div className={styles.s5LogTrack}>
                  <div className={styles.s5LogFill}
                    style={{ width: `${((c.logit - minL) / (maxL - minL)) * 100}%`, background: last.color }} />
                </div>
                <span className={styles.s5LogVal}>{c.logit.toFixed(1)}</span>
              </div>
            ))}
            <div className={styles.s5LogMore}>… 50,247 more</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Stage 6: Temperature + Softmax ────────────────────────────────────────────

function Stage6({ cands, probs, temp, setTemp, sampledIdx }:
  { cands: Candidate[]; probs: number[]; temp: number; setTemp: (t: number) => void; sampledIdx: number | null }) {
  const maxP = Math.max(...probs);
  const badge = temp < 0.5 ? 'Greedy' : temp > 1.3 ? 'Creative' : 'Balanced';
  const badgeColor = temp < 0.5 ? '#3B82F6' : temp > 1.3 ? '#EF4444' : '#10B981';

  return (
    <div className={styles.stage}>
      <p className={styles.desc}>Divide logits by T, then softmax → probabilities. Low T: peaked. High T: uniform.</p>

      <div className={styles.s6Formula}>
        P(w) = exp(logit(w) / T) / Σ exp(logit(j) / T) &nbsp; · &nbsp; T =&nbsp;<strong style={{ color: '#FF7F50' }}>{temp.toFixed(2)}</strong>
      </div>

      <div className={styles.s6SlRow}>
        <span className={styles.s6SlEnd}>0.1</span>
        <input type="range" min={0.1} max={2.0} step={0.05} value={temp}
          className={styles.s6Sl} onChange={e => setTemp(parseFloat(e.target.value))} />
        <span className={styles.s6SlEnd}>2.0</span>
        <span className={styles.s6Badge} style={{ background: badgeColor }}>{badge}</span>
      </div>

      <div className={styles.s6Bars}>
        {cands.map((c, i) => (
          <div key={i} className={`${styles.s6BarRow} ${sampledIdx === i ? styles.s6BarRowOn : ''}`}>
            <span className={styles.s6BarTok}>{c.text}</span>
            <div className={styles.s6BarTrack}>
              <div className={styles.s6BarFill}
                style={{ width: `${(probs[i] / maxP) * 100}%`, background: sampledIdx === i ? '#FF7F50' : '#3B82F6' }} />
            </div>
            <span className={styles.s6BarVal}>{(probs[i] * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Roulette wheel ─────────────────────────────────────────────────────────────

const W_COLORS = ['#3B82F6','#10B981','#F59E0B','#8B5CF6','#FF7F50','#EC4899','#06B6D4','#84CC16','#F97316','#A78BFA'];

function Wheel({ probs, sampledIdx }: { probs: number[]; sampledIdx: number | null }) {
  const S = 130, cx = 65, cy = 65, r = 56;
  let angle = -Math.PI / 2;
  const segs = probs.map((p, i) => {
    const s = angle, e = angle + p * 2 * Math.PI;
    angle = e;
    const x1 = cx + r * Math.cos(s), y1 = cy + r * Math.sin(s);
    const x2 = cx + r * Math.cos(e), y2 = cy + r * Math.sin(e);
    const large = e - s > Math.PI ? 1 : 0;
    return { path: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`, color: W_COLORS[i % W_COLORS.length], i };
  });

  return (
    <svg width={S} height={S} viewBox={`0 0 ${S} ${S}`} style={{ filter: 'drop-shadow(0 0 20px rgba(255,127,80,0.2))' }}>
      {segs.map(seg => (
        <path key={seg.i} d={seg.path} fill={seg.color}
          opacity={sampledIdx === null ? 0.8 : seg.i === sampledIdx ? 1 : 0.22}
          stroke="#0D0D14" strokeWidth={1.5}
          style={{ transition: 'opacity 0.4s ease' }}
        />
      ))}
      <circle cx={cx} cy={cy} r={10} fill="#0D0D14" />
      {sampledIdx !== null && (
        <text x={cx} y={cy} textAnchor="middle" dy="0.35em" fill={W_COLORS[sampledIdx % W_COLORS.length]} fontSize={9} fontWeight="bold">✓</text>
      )}
    </svg>
  );
}

// ── Stage 7: Sampling + Loop ──────────────────────────────────────────────────

function Stage7({ cands, probs, sampledIdx, onSample, onGenNext, genCount }:
  { cands: Candidate[]; probs: number[]; sampledIdx: number | null; onSample: () => void; onGenNext: () => void; genCount: number }) {
  const sampled = sampledIdx !== null ? cands[sampledIdx] : null;
  const MAX = 6;

  return (
    <div className={styles.stage}>
      <p className={styles.desc}>Sample one token from the distribution. Append it to the sequence, then <strong>run the whole forward pass again</strong> — that loop is autoregressive generation.</p>

      <div className={styles.s7Row}>
        <Wheel probs={probs} sampledIdx={sampledIdx} />
        <div className={styles.s7Right}>
          {sampled ? (
            <div className={styles.s7Result}>
              <span className={styles.s7ResLbl}>Sampled:</span>
              <span className={styles.s7ResTok}>{sampled.text}</span>
              <span className={styles.s7ResId}>id {sampled.id}</span>
              <span className={styles.s7ResP}>{(probs[sampledIdx!] * 100).toFixed(1)}%</span>
            </div>
          ) : (
            <div className={styles.s7Hint}>Press "Sample" to draw one token</div>
          )}

          <div className={styles.s7BtnRow}>
            {!sampled && (
              <button className={styles.s7SBtn} onClick={onSample}>🎲&nbsp; Sample next token</button>
            )}
            {sampled && genCount < MAX && (
              <button className={styles.s7GBtn} onClick={onGenNext}>
                ↩&nbsp; Append &amp; generate again
                <span className={styles.s7GBtnSub}>token {genCount + 1} / {MAX}</span>
              </button>
            )}
            {sampled && genCount >= MAX && (
              <div className={styles.s7Done}>✨ {MAX} tokens generated — you&apos;ve seen the full loop!</div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.s7Loop}>
        <div className={styles.s7LoopTitle}>The autoregressive loop (repeats for every new token):</div>
        <div className={styles.s7LoopSteps}>
          {STAGE_NAMES.map((name, i) => (
            <div key={i} className={styles.s7LStep}>
              <div className={styles.s7LNum}>{i + 1}</div>
              <div className={styles.s7LName}>{name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Root Component ─────────────────────────────────────────────────────────────

export default function PromptJourney() {
  const [stage,    setStage]    = useState(1);
  const [tokens,   setTokens]   = useState<TokenDef[]>(INITIAL_TOKENS);
  const [temp,     setTemp]     = useState(0.8);
  const [sampled,  setSampled]  = useState<number | null>(null);
  const [focus,    setFocus]    = useState(0);
  const [genCount, setGenCount] = useState(0);
  const [flashIdx, setFlashIdx] = useState(-1);

  const candSet = useMemo(() => CAND_SETS[genCount % CAND_SETS.length], [genCount]);
  const probs   = useMemo(() => softmaxT(candSet.map(c => c.logit), temp), [candSet, temp]);

  const handleSample = useCallback(() => {
    if (sampled !== null) return;
    const rand = seededRand((tokens.length * 137 + genCount * 31) >>> 0);
    const r = rand();
    let cum = 0, idx = probs.length - 1;
    for (let i = 0; i < probs.length; i++) { cum += probs[i]; if (r < cum) { idx = i; break; } }
    setSampled(idx);
  }, [sampled, probs, tokens.length, genCount]);

  const handleGenNext = useCallback(() => {
    if (sampled === null) return;
    const picked = candSet[sampled];
    setTokens(prev => [
      ...prev,
      { text: picked.text, id: picked.id, color: GEN_COLORS[genCount % GEN_COLORS.length] },
    ]);
    setFlashIdx(tokens.length); // will point to new last token
    setSampled(null);
    setGenCount(g => g + 1);
    setFocus(0);
    setStage(1);
    setTimeout(() => setFlashIdx(-1), 800);
  }, [sampled, candSet, genCount, tokens.length]);

  return (
    <div className={styles.root}>
      {/* Header */}
      <div className={styles.hdr}>
        <span className={styles.hdrIcon}>⚡</span>
        <div>
          <div className={styles.hdrTitle}>Journey of a Prompt</div>
          <div className={styles.hdrSub}>Step through every stage GPT-2 runs — from raw text to generated output</div>
        </div>
      </div>

      <SequenceStrip tokens={tokens} flashIdx={flashIdx} />
      <StageNav stage={stage} onPrev={() => setStage(s => s - 1)} onNext={() => setStage(s => s + 1)} />

      <div className={styles.stageWrap} key={stage}>
        {stage === 1 && <Stage1 tokens={tokens} />}
        {stage === 2 && <Stage2 tokens={tokens} focus={focus} setFocus={setFocus} />}
        {stage === 3 && <Stage3 tokens={tokens} focus={focus} />}
        {stage === 4 && <Stage4 tokens={tokens} />}
        {stage === 5 && <Stage5 tokens={tokens} />}
        {stage === 6 && <Stage6 cands={candSet} probs={probs} temp={temp} setTemp={setTemp} sampledIdx={sampled} />}
        {stage === 7 && <Stage7 cands={candSet} probs={probs} sampledIdx={sampled} onSample={handleSample} onGenNext={handleGenNext} genCount={genCount} />}
      </div>
    </div>
  );
}
