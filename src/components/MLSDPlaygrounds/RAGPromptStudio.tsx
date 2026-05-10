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

interface Doc {
  id: number;
  text: string;
  topics: string[];
}

interface Query {
  id: number;
  text: string;
  goldDocs: number[];
  answerable: boolean;
  groundedAnswer: string;
  hallucinatedAnswer: string;
}

const CORPUS: Doc[] = [
  { id: 1, text: 'Acme Robotics was founded in 2015 in Boston by Jane Mira and Sam Lo.', topics: ['founders', 'location', 'founded'] },
  { id: 2, text: 'The flagship product Pulse-X uses a 96-channel LIDAR with 200m range.', topics: ['lidar', 'pulse-x', 'range'] },
  { id: 3, text: 'Pulse-X retails for $24,000 and ships in 4-6 weeks from order.', topics: ['price', 'pulse-x', 'shipping'] },
  { id: 4, text: 'Acme employs 340 people across Boston, Munich, and Singapore.', topics: ['employees', 'offices', 'location'] },
  { id: 5, text: 'The company raised $80M Series C in March 2024 led by Sequoia.', topics: ['funding', 'investors'] },
  { id: 6, text: 'Pulse-X is rated IP67 for dust and water resistance.', topics: ['pulse-x', 'durability', 'water'] },
  { id: 7, text: "Acme's open-source SDK supports Python 3.9+ and ROS2.", topics: ['sdk', 'software', 'ros'] },
  { id: 8, text: 'The 2025 model Pulse-X Pro adds 4D radar and a 50% lower price tier.', topics: ['pulse-x-pro', 'radar', 'price'] },
];

const QUERIES: Query[] = [
  {
    id: 1,
    text: 'Where is Acme Robotics based?',
    goldDocs: [1, 4],
    answerable: true,
    groundedAnswer: 'Acme Robotics is headquartered in Boston, with additional offices in Munich and Singapore.',
    hallucinatedAnswer: 'Acme Robotics is based in Palo Alto, California.',
  },
  {
    id: 2,
    text: 'How much does Pulse-X cost?',
    goldDocs: [3],
    answerable: true,
    groundedAnswer: 'Pulse-X retails for $24,000.',
    hallucinatedAnswer: 'Pulse-X costs around $40,000 in standard configurations.',
  },
  {
    id: 3,
    text: 'What is the Pulse-X LIDAR range?',
    goldDocs: [2],
    answerable: true,
    groundedAnswer: 'The Pulse-X LIDAR has a 200m range with 96 channels.',
    hallucinatedAnswer: 'The Pulse-X LIDAR has a 350m range with 128 channels.',
  },
  {
    id: 4,
    text: 'Does Pulse-X work in the rain?',
    goldDocs: [6],
    answerable: true,
    groundedAnswer: 'Yes — Pulse-X is rated IP67, meaning it is dust- and water-resistant.',
    hallucinatedAnswer: 'Yes, Pulse-X is fully waterproof for underwater use up to 30 meters.',
  },
  {
    id: 5,
    text: 'What ROS version is supported by the SDK?',
    goldDocs: [7],
    answerable: true,
    groundedAnswer: "Acme's SDK supports ROS2 and Python 3.9+.",
    hallucinatedAnswer: 'The SDK supports ROS1 Noetic and Python 2.7+.',
  },
  {
    id: 6,
    text: 'What is Acme Robotics annual revenue?',
    goldDocs: [],
    answerable: false,
    groundedAnswer: '',
    hallucinatedAnswer: 'Acme Robotics generated approximately $120 million in revenue last year.',
  },
  {
    id: 7,
    text: 'Who is the current CEO of Acme?',
    goldDocs: [],
    answerable: false,
    groundedAnswer: '',
    hallucinatedAnswer: 'Acme Robotics is led by CEO Jane Mira, the company founder.',
  },
  {
    id: 8,
    text: 'Does Acme make satellite navigation hardware?',
    goldDocs: [],
    answerable: false,
    groundedAnswer: '',
    hallucinatedAnswer: 'Yes — Acme produces a satellite-grade GNSS module called Acme-Star.',
  },
];

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

function retrieve(query: Query, K: number): number[] {
  const qTokens = tokenize(query.text);
  const scores = CORPUS.map((doc) => {
    const dTokens = tokenize(doc.text);
    let s = 0;
    for (const qt of qTokens) {
      if (dTokens.includes(qt)) s += 1;
      for (const topic of doc.topics) {
        if (qt === topic || topic.includes(qt) || qt.includes(topic)) s += 0.6;
      }
    }
    return { id: doc.id, s };
  });
  scores.sort((a, b) => b.s - a.s);
  return scores.slice(0, K).map((x) => x.id);
}

interface PromptConfig {
  grounding: boolean;
  citation: boolean;
  refusal: boolean;
}

type Outcome = 'faithful' | 'hallucinated' | 'refused' | 'false_refusal';

interface QResult {
  query: Query;
  retrieved: number[];
  recallHit: boolean;
  outcome: Outcome;
  answer: string;
  citation: string | null;
  citationCorrect: boolean | null;
}

function runQuery(query: Query, config: PromptConfig, seed: number): QResult {
  const rng = mulberry32(seed * 1000 + query.id);
  const retrieved = retrieve(query, 3);
  const recallHit = query.goldDocs.length === 0 || query.goldDocs.some((d) => retrieved.includes(d));

  let pHallucinate: number;
  let pRefuse: number;

  if (query.answerable && recallHit) {
    pHallucinate = config.grounding ? 0.05 : 0.25;
    pRefuse = config.refusal && config.grounding ? 0.06 : 0.02;
  } else {
    pHallucinate = config.grounding ? 0.15 : 0.7;
    pRefuse = config.refusal && config.grounding ? 0.85 : 0.18;
  }

  let outcome: Outcome;
  const r = rng();
  if (r < pRefuse) {
    outcome = query.answerable ? 'false_refusal' : 'refused';
  } else if (r < pRefuse + pHallucinate) {
    outcome = 'hallucinated';
  } else {
    outcome = query.answerable && recallHit ? 'faithful' : 'hallucinated';
  }

  let answer: string;
  let citation: string | null = null;
  let citationCorrect: boolean | null = null;

  if (outcome === 'refused' || outcome === 'false_refusal') {
    answer = "I cannot answer that confidently from the provided passages.";
  } else if (outcome === 'faithful') {
    answer = query.groundedAnswer;
  } else {
    answer = query.hallucinatedAnswer;
  }

  if (outcome === 'faithful' || outcome === 'hallucinated') {
    const pCite = config.citation ? 0.9 : 0.1;
    if (rng() < pCite) {
      if (outcome === 'faithful' && query.goldDocs.length > 0) {
        const gold = query.goldDocs[0];
        const cited = retrieved.includes(gold) ? gold : retrieved[0];
        citation = `[doc-${cited}]`;
        citationCorrect = cited === gold;
      } else {
        const cited = retrieved[0];
        citation = `[doc-${cited}]`;
        citationCorrect = false;
      }
    }
  }

  return { query, retrieved, recallHit, outcome, answer, citation, citationCorrect };
}

export default function RAGPromptStudio() {
  const [grounding, setGrounding] = useState(false);
  const [citation, setCitation] = useState(false);
  const [refusal, setRefusal] = useState(false);
  const [seed, setSeed] = useState(11);

  const result = useMemo(() => {
    const config: PromptConfig = { grounding, citation, refusal };
    const samples = 25;
    let faithful = 0;
    let hallucinated = 0;
    let refused = 0;
    let falseRefusal = 0;
    let answerableCount = 0;
    let unanswerableCount = 0;
    let citationsAttempted = 0;
    let citationsCorrect = 0;

    for (let s = 0; s < samples; s++) {
      for (const q of QUERIES) {
        const out = runQuery(q, config, seed + s * 97);
        if (q.answerable) answerableCount++;
        else unanswerableCount++;
        if (out.outcome === 'faithful') faithful++;
        else if (out.outcome === 'hallucinated') hallucinated++;
        else if (out.outcome === 'refused') refused++;
        else if (out.outcome === 'false_refusal') falseRefusal++;
        if (out.citation !== null) {
          citationsAttempted++;
          if (out.citationCorrect) citationsCorrect++;
        }
      }
    }

    const exemplars: QResult[] = QUERIES.map((q) => runQuery(q, config, seed));

    return {
      faithfulRate: faithful / (samples * QUERIES.length),
      hallucinatedRate: hallucinated / (samples * QUERIES.length),
      correctRefusalRate: unanswerableCount > 0 ? refused / unanswerableCount : 0,
      falseRefusalRate: answerableCount > 0 ? falseRefusal / answerableCount : 0,
      citationAccuracy: citationsAttempted > 0 ? citationsCorrect / citationsAttempted : 0,
      citationsAttempted,
      exemplars,
    };
  }, [grounding, citation, refusal, seed]);

  const renderToggle = (label: string, value: boolean, setter: (v: boolean) => void, hint: string) => (
    <div className={styles.controlRow}>
      <label className={styles.controlLabel}>{label}</label>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <button
          className={`${styles.toggleButton} ${value ? styles.toggleButtonActive : ''}`}
          onClick={() => setter(true)}
          style={{ minWidth: 50 }}
        >
          On
        </button>
        <button
          className={`${styles.toggleButton} ${!value ? styles.toggleButtonActive : ''}`}
          onClick={() => setter(false)}
          style={{ minWidth: 50 }}
        >
          Off
        </button>
        <span style={{ fontSize: '0.78rem', color: '#64748b', marginLeft: '0.5rem' }}>{hint}</span>
      </div>
      <span />
    </div>
  );

  const outcomeBadge = (outcome: Outcome) => {
    const map: Record<Outcome, { label: string; bg: string; fg: string }> = {
      faithful: { label: 'FAITHFUL', bg: '#d1fae5', fg: '#047857' },
      hallucinated: { label: 'HALLUCINATED', bg: '#fee2e2', fg: '#b91c1c' },
      refused: { label: 'REFUSED ✓', bg: '#e0f2fe', fg: '#0369a1' },
      false_refusal: { label: 'FALSE REFUSAL', bg: '#fef3c7', fg: '#b45309' },
    };
    const m = map[outcome];
    return (
      <span
        style={{
          background: m.bg,
          color: m.fg,
          padding: '2px 8px',
          borderRadius: 4,
          fontSize: '0.65rem',
          fontWeight: 700,
          letterSpacing: '0.05em',
        }}
      >
        {m.label}
      </span>
    );
  };

  const commentary = (() => {
    if (!grounding && !citation && !refusal) {
      return (
        <>
          With <strong>no prompt scaffolding</strong>, the mock model hallucinates roughly{' '}
          {(result.hallucinatedRate * 100).toFixed(0)}% of the time and refuses almost nothing —
          this is the L4 baseline. Toggle <strong>Grounding</strong> to halve hallucination, then{' '}
          <strong>Refusal</strong> to convert the residue into honest "I don't know."
        </>
      );
    }
    if (grounding && refusal && citation) {
      return (
        <>
          All three on. Hallucination dropped to {(result.hallucinatedRate * 100).toFixed(0)}%,
          refusal-on-unanswerable hit {(result.correctRefusalRate * 100).toFixed(0)}%, citation
          accuracy is {(result.citationAccuracy * 100).toFixed(0)}%. The cost is a{' '}
          {(result.falseRefusalRate * 100).toFixed(0)}% false-refusal rate on answerable queries —
          the production trade-off the L5 candidate names explicitly.
        </>
      );
    }
    if (grounding && !refusal) {
      return (
        <>
          Grounding alone reduces hallucination but the model still tries to answer unanswerable
          queries — the refusal pattern is what converts ungrounded uncertainty into an honest "I
          don't know."
        </>
      );
    }
    if (citation && !grounding) {
      return (
        <>
          Citations without grounding produce <strong>citation theatre</strong> — citation tags
          appear but they often point to passages that don't actually support the claim. Citation
          accuracy: {(result.citationAccuracy * 100).toFixed(0)}%. Add grounding to fix it.
        </>
      );
    }
    return (
      <>
        Each prompt directive moves a different metric. Combine all three for the production
        configuration; the cost of the safety apparatus is the false-refusal rate.
      </>
    );
  })();

  return (
    <div className={styles.playground}>
      <p className={styles.tag}>Interactive · Prompt directives × hallucination metrics</p>
      <h4 className={styles.heading}>Prompt design as system design</h4>
      <p className={styles.subheading}>
        A mock RAG over an 8-document corpus and 8 queries (5 answerable, 3 unanswerable). Toggle
        each prompt directive on or off and watch faithfulness, citation accuracy, correct
        refusals, and false refusals move. The model is deterministic and seed-driven; toggles
        change probabilities, not the corpus.
      </p>

      <div className={styles.controls}>
        {renderToggle(
          'Grounding directive',
          grounding,
          setGrounding,
          '"Answer only from the passages."'
        )}
        {renderToggle(
          'Citation directive',
          citation,
          setCitation,
          '"Cite every claim with [doc-N]."'
        )}
        {renderToggle(
          'Refusal pattern',
          refusal,
          setRefusal,
          '"If unsure, say you cannot answer."'
        )}
        <div className={styles.controlRow}>
          <label className={styles.controlLabel}>Run seed</label>
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
            result.hallucinatedRate < 0.15 ? styles.outputItemOk : ''
          } ${result.hallucinatedRate > 0.4 ? styles.outputItemAlert : ''}`}
        >
          <p className={styles.outputLabel}>Hallucination</p>
          <p className={styles.outputValue}>{(result.hallucinatedRate * 100).toFixed(0)}%</p>
          <p className={styles.outputSubtext}>across all queries</p>
        </div>
        <div
          className={`${styles.outputItem} ${
            result.correctRefusalRate > 0.6 ? styles.outputItemOk : ''
          }`}
        >
          <p className={styles.outputLabel}>Correct refusal</p>
          <p className={styles.outputValue}>{(result.correctRefusalRate * 100).toFixed(0)}%</p>
          <p className={styles.outputSubtext}>of unanswerable</p>
        </div>
        <div
          className={`${styles.outputItem} ${
            result.falseRefusalRate > 0.15 ? styles.outputItemAlert : ''
          }`}
        >
          <p className={styles.outputLabel}>False refusal</p>
          <p className={styles.outputValue}>{(result.falseRefusalRate * 100).toFixed(0)}%</p>
          <p className={styles.outputSubtext}>cost of safety</p>
        </div>
        <div
          className={`${styles.outputItem} ${
            result.citationAccuracy > 0.7 && result.citationsAttempted > 0
              ? styles.outputItemOk
              : ''
          }`}
        >
          <p className={styles.outputLabel}>Citation accuracy</p>
          <p className={styles.outputValue}>
            {result.citationsAttempted > 0
              ? (result.citationAccuracy * 100).toFixed(0) + '%'
              : '—'}
          </p>
          <p className={styles.outputSubtext}>
            {result.citationsAttempted > 0
              ? `${result.citationsAttempted} attempts`
              : 'no citations'}
          </p>
        </div>
      </div>

      <div
        style={{
          marginTop: '1.1rem',
          padding: '0.75rem 1rem',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 8,
        }}
      >
        <p
          style={{
            margin: '0 0 0.55rem 0',
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#475569',
          }}
        >
          Live sample (seed {seed})
        </p>
        {result.exemplars.slice(0, 5).map((ex) => (
          <div
            key={ex.query.id}
            style={{
              padding: '0.55rem 0',
              borderBottom: '1px dashed #e2e8f0',
              fontSize: '0.85rem',
              lineHeight: 1.5,
            }}
          >
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: 4 }}>
              {outcomeBadge(ex.outcome)}
              <span style={{ color: '#475569', fontWeight: 600 }}>Q: {ex.query.text}</span>
            </div>
            <div style={{ color: '#0f172a' }}>
              {ex.answer}{' '}
              {ex.citation && (
                <span
                  style={{
                    fontFamily: 'Menlo, monospace',
                    fontSize: '0.78rem',
                    color: ex.citationCorrect ? '#047857' : '#b91c1c',
                    fontWeight: 600,
                  }}
                >
                  {ex.citation} {ex.citationCorrect ? '✓' : '✗'}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className={styles.commentary}>{commentary}</p>
    </div>
  );
}
