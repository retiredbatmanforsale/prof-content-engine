import React, { useState, useMemo } from 'react';
import styles from './styles.module.css';

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface QueryEval {
  recall: boolean;
  faithfulness: number;
  answerQuality: number;
}

interface RagConfig {
  retrievalQuality: number;
  generationFaithfulness: number;
  answerAlignment: number;
}

function evalOne(config: RagConfig, qSeed: number): QueryEval {
  const rng = mulberry32(qSeed);
  const recall = rng() < config.retrievalQuality;
  let faith: number;
  if (!recall) {
    faith = 0.1 + rng() * 0.3;
  } else {
    const center = config.generationFaithfulness;
    faith = Math.max(0, Math.min(1, center + (rng() - 0.5) * 0.25));
  }
  let aq: number;
  if (!recall) {
    aq = 1 + rng() * 1.5;
  } else if (faith < 0.4) {
    aq = 1.5 + rng() * 1.5;
  } else {
    aq = config.answerAlignment * 5 - 0.5 + rng() * 1.0;
    aq = Math.max(1, Math.min(5, aq));
  }
  return { recall, faithfulness: faith, answerQuality: aq };
}

function evalConfig(config: RagConfig, N: number, seed: number): {
  recall: number;
  faithfulness: number;
  answerQuality: number;
  raw: QueryEval[];
} {
  const raw: QueryEval[] = [];
  for (let i = 0; i < N; i++) raw.push(evalOne(config, seed * 10000 + i * 17 + 1));
  let r = 0,
    f = 0,
    a = 0;
  for (const e of raw) {
    r += e.recall ? 1 : 0;
    f += e.faithfulness;
    a += e.answerQuality;
  }
  return { recall: r / N, faithfulness: f / N, answerQuality: a / N, raw };
}

const PRESETS: Array<{ name: string; subtitle: string; config: RagConfig; diagnosis: string }> = [
  {
    name: 'A · Bad retrieval',
    subtitle: 'recall@5 = 0.40',
    config: { retrievalQuality: 0.4, generationFaithfulness: 0.85, answerAlignment: 0.85 },
    diagnosis:
      'Recall is the bottleneck — generation faithfulness looks fine because the model refuses or guesses on missing context, but the answer rarely addresses the question. Fix: Lesson 9 (retrieval).',
  },
  {
    name: 'B · Bad generation',
    subtitle: 'hallucinates in-context',
    config: { retrievalQuality: 0.95, generationFaithfulness: 0.55, answerAlignment: 0.85 },
    diagnosis:
      'High recall, low faithfulness — passages are in-context but the model is hallucinating around them. Fix: Lesson 10 (prompt design + grounding directive).',
  },
  {
    name: 'C · Bad alignment',
    subtitle: 'on-topic but shallow',
    config: { retrievalQuality: 0.92, generationFaithfulness: 0.92, answerAlignment: 0.5 },
    diagnosis:
      'High recall and faithfulness, low answer-quality — model grounds correctly but the answer does not match what the user is actually asking. Fix: Lesson 8 (metric tree, query rewriting).',
  },
  {
    name: 'D · Production target',
    subtitle: 'all three healthy',
    config: { retrievalQuality: 0.93, generationFaithfulness: 0.93, answerAlignment: 0.85 },
    diagnosis:
      'All three components in target range. This is the configuration that ships — and that the human-eval cadence (~100 q/week) defends against drift.',
  },
];

export default function RAGEvalHarness() {
  const [retrievalQuality, setRetrievalQuality] = useState(0.93);
  const [generationFaithfulness, setGenerationFaithfulness] = useState(0.93);
  const [answerAlignment, setAnswerAlignment] = useState(0.85);
  const [seed, setSeed] = useState(7);
  const [activePreset, setActivePreset] = useState<number | null>(3);

  const config: RagConfig = { retrievalQuality, generationFaithfulness, answerAlignment };

  const result = useMemo(() => {
    const N = 200;
    const main = evalConfig(config, N, seed);
    const presets = PRESETS.map((p) => evalConfig(p.config, N, seed));
    return { main, presets };
  }, [retrievalQuality, generationFaithfulness, answerAlignment, seed]);

  const applyPreset = (idx: number) => {
    setActivePreset(idx);
    setRetrievalQuality(PRESETS[idx].config.retrievalQuality);
    setGenerationFaithfulness(PRESETS[idx].config.generationFaithfulness);
    setAnswerAlignment(PRESETS[idx].config.answerAlignment);
  };

  const onSlider = (setter: (v: number) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(parseFloat(e.target.value));
    setActivePreset(null);
  };

  const W = 720;
  const Hgt = 230;
  const padL = 100;
  const padR = 30;
  const padT = 30;
  const padB = 30;
  const innerW = W - padL - padR;
  const innerH = Hgt - padT - padB;
  const rows = 3;
  const rowH = innerH / rows;

  const renderBars = () => {
    const labels = [
      { name: 'Recall@5', value: result.main.recall, target: 0.85, max: 1 },
      { name: 'Faithfulness', value: result.main.faithfulness, target: 0.9, max: 1 },
      {
        name: 'Answer quality',
        value: result.main.answerQuality / 5,
        target: 0.8,
        max: 1,
        rawValue: result.main.answerQuality,
      },
    ];
    const elements: React.ReactNode[] = [];
    labels.forEach((m, i) => {
      const y = padT + rowH * i + rowH / 2;
      const xStart = padL;
      const xEnd = padL + innerW;
      const barTop = y - 14;
      const barH = 22;

      elements.push(
        <text key={`lbl-${i}`} x={padL - 12} y={y + 4} textAnchor="end" fontSize={12} fontWeight={600} fill="#1e293b">
          {m.name}
        </text>
      );

      elements.push(
        <rect
          key={`bg-${i}`}
          x={xStart}
          y={barTop}
          width={innerW}
          height={barH}
          fill="#f1f5f9"
          rx={4}
        />
      );

      const targetX = xStart + m.target * innerW;
      elements.push(
        <line
          key={`tg-${i}`}
          x1={targetX}
          y1={barTop - 4}
          x2={targetX}
          y2={barTop + barH + 4}
          stroke="#0369a1"
          strokeDasharray="3 2"
          strokeWidth={1.5}
        />
      );

      const w = m.value * innerW;
      const passing = m.value >= m.target;
      const fill = passing ? '#10b981' : m.value > m.target * 0.7 ? '#f59e0b' : '#ef4444';
      elements.push(
        <rect
          key={`bar-${i}`}
          x={xStart}
          y={barTop}
          width={w}
          height={barH}
          fill={fill}
          rx={4}
        />
      );

      const display =
        m.name === 'Answer quality' && m.rawValue !== undefined
          ? m.rawValue.toFixed(2) + ' / 5'
          : m.value.toFixed(2);
      elements.push(
        <text
          key={`val-${i}`}
          x={xStart + w + 8}
          y={y + 4}
          fontSize={12}
          fontWeight={700}
          fill={passing ? '#047857' : '#b45309'}
        >
          {display}
        </text>
      );

      if (i === 0) {
        elements.push(
          <text
            key="targetLbl"
            x={targetX}
            y={padT - 14}
            textAnchor="middle"
            fontSize={10}
            fill="#0369a1"
            fontWeight={600}
          >
            production target
          </text>
        );
      }
    });
    return elements;
  };

  const diagnosis = (() => {
    const r = result.main.recall;
    const f = result.main.faithfulness;
    const a = result.main.answerQuality / 5;
    const issues: string[] = [];
    if (r < 0.75) issues.push('Lesson 9 (retrieval)');
    if (f < 0.85 && r >= 0.75) issues.push('Lesson 10 (prompt + grounding)');
    if (a < 0.7 && r >= 0.75 && f >= 0.85) issues.push('Lesson 8 (metric tree / query rewriting)');
    if (issues.length === 0) {
      return (
        <>
          All three components above their production thresholds. Ship — and run a rotating
          ~100-query weekly human eval to defend against drift.
        </>
      );
    }
    return (
      <>
        Localised failure: <strong>{issues.join(' + ')}</strong>. The component-wise eval points
        directly at the broken layer instead of giving you one ambiguous "answer quality" number.
      </>
    );
  })();

  return (
    <div className={styles.playground}>
      <p className={styles.tag}>Interactive · Component-wise RAG eval</p>
      <h4 className={styles.heading}>Localising failure: recall + faithfulness + answer quality</h4>
      <p className={styles.subheading}>
        200 synthetic queries scored on three independent axes. Drag the sliders to simulate a
        broken retrieval layer, a hallucinating generator, or shallow answers — and watch which
        metric flags it. Or click a preset to load a canonical failure mode.
      </p>

      <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', marginBottom: '0.85rem' }}>
        {PRESETS.map((p, i) => (
          <button
            key={i}
            className={`${styles.toggleButton} ${
              activePreset === i ? styles.toggleButtonActive : ''
            }`}
            onClick={() => applyPreset(i)}
            style={{ padding: '0.45rem 0.7rem', fontSize: '0.78rem' }}
          >
            <div style={{ fontWeight: 700, marginBottom: 2 }}>{p.name}</div>
            <div style={{ fontSize: '0.7rem', opacity: 0.85 }}>{p.subtitle}</div>
          </button>
        ))}
      </div>

      <div className={styles.controls}>
        <div className={styles.controlRow}>
          <label className={styles.controlLabel}>Retrieval quality</label>
          <input
            className={styles.slider}
            type="range"
            min={0.2}
            max={1.0}
            step={0.01}
            value={retrievalQuality}
            onChange={onSlider(setRetrievalQuality)}
          />
          <span className={styles.controlValue}>{retrievalQuality.toFixed(2)}</span>
        </div>
        <div className={styles.controlRow}>
          <label className={styles.controlLabel}>Generation faithfulness</label>
          <input
            className={styles.slider}
            type="range"
            min={0.3}
            max={1.0}
            step={0.01}
            value={generationFaithfulness}
            onChange={onSlider(setGenerationFaithfulness)}
          />
          <span className={styles.controlValue}>{generationFaithfulness.toFixed(2)}</span>
        </div>
        <div className={styles.controlRow}>
          <label className={styles.controlLabel}>Answer alignment</label>
          <input
            className={styles.slider}
            type="range"
            min={0.3}
            max={1.0}
            step={0.01}
            value={answerAlignment}
            onChange={onSlider(setAnswerAlignment)}
          />
          <span className={styles.controlValue}>{answerAlignment.toFixed(2)}</span>
        </div>
        <div className={styles.controlRow}>
          <label className={styles.controlLabel}>Eval seed</label>
          <input
            className={styles.slider}
            type="range"
            min={1}
            max={50}
            step={1}
            value={seed}
            onChange={(e) => setSeed(parseInt(e.target.value))}
          />
          <span className={styles.controlValue}>{seed}</span>
        </div>
      </div>

      <div className={styles.outputs}>
        <div
          className={`${styles.outputItem} ${
            result.main.recall >= 0.85 ? styles.outputItemOk : styles.outputItemAlert
          }`}
        >
          <p className={styles.outputLabel}>Retrieval Recall@5</p>
          <p className={styles.outputValue}>{result.main.recall.toFixed(2)}</p>
          <p className={styles.outputSubtext}>target ≥ 0.85</p>
        </div>
        <div
          className={`${styles.outputItem} ${
            result.main.faithfulness >= 0.9 ? styles.outputItemOk : styles.outputItemAlert
          }`}
        >
          <p className={styles.outputLabel}>Faithfulness</p>
          <p className={styles.outputValue}>{result.main.faithfulness.toFixed(2)}</p>
          <p className={styles.outputSubtext}>target ≥ 0.90</p>
        </div>
        <div
          className={`${styles.outputItem} ${
            result.main.answerQuality >= 4.0 ? styles.outputItemOk : styles.outputItemAlert
          }`}
        >
          <p className={styles.outputLabel}>Answer quality</p>
          <p className={styles.outputValue}>{result.main.answerQuality.toFixed(2)}</p>
          <p className={styles.outputSubtext}>LLM-judge · target ≥ 4.0</p>
        </div>
        <div className={styles.outputItem}>
          <p className={styles.outputLabel}>Pass all three?</p>
          <p
            className={styles.outputValue}
            style={{
              color:
                result.main.recall >= 0.85 &&
                result.main.faithfulness >= 0.9 &&
                result.main.answerQuality >= 4.0
                  ? '#047857'
                  : '#b91c1c',
            }}
          >
            {result.main.recall >= 0.85 &&
            result.main.faithfulness >= 0.9 &&
            result.main.answerQuality >= 4.0
              ? 'ship'
              : 'block'}
          </p>
          <p className={styles.outputSubtext}>component AND</p>
        </div>
      </div>

      <svg
        className={styles.chart}
        viewBox={`0 0 ${W} ${Hgt}`}
        role="img"
        aria-label="Component-wise RAG eval bar chart"
      >
        {renderBars()}
      </svg>

      <p className={styles.commentary}>{diagnosis}</p>

      <div
        style={{
          marginTop: '0.75rem',
          padding: '0.7rem 0.95rem',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 8,
          fontSize: '0.82rem',
          color: '#475569',
          lineHeight: 1.55,
        }}
      >
        <strong style={{ color: '#0f172a' }}>Why component-wise?</strong> A single end-to-end
        score (e.g. answer quality alone) cannot tell you whether the system failed at retrieval,
        generation, or alignment — and you cannot fix what you cannot localise. Ragas, TruLens,
        and DeepEval all bundle these primitives. Production teams pair them with a calibrated
        LLM-judge (Spearman ρ &gt; 0.8 vs human gold set) and a rotating ~100-query weekly human
        eval for shipping decisions.
      </div>
    </div>
  );
}
