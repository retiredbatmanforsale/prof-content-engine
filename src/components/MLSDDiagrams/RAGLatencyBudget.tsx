import React from 'react';
import styles from './styles.module.css';

interface Segment {
  name: string;
  ms: number;
  fill: string;
  textColor: string;
}

const SEGMENTS: Segment[] = [
  { name: 'Retrieval', ms: 50, fill: '#cbd5e1', textColor: '#0f172a' },
  { name: 'Rerank', ms: 200, fill: '#94a3b8', textColor: '#ffffff' },
  { name: 'Prefill', ms: 200, fill: '#7dd3fc', textColor: '#0f172a' },
  { name: 'Generation (streamed)', ms: 1500, fill: '#FF7F50', textColor: '#ffffff' },
  { name: 'Network', ms: 50, fill: '#cbd5e1', textColor: '#0f172a' },
];

export default function RAGLatencyBudget() {
  const W = 720;
  const H = 320;
  const padL = 60;
  const padR = 30;
  const padT = 80;
  const barH = 64;
  const innerW = W - padL - padR;
  const totalMs = 2000;

  const elements: React.ReactNode[] = [];

  for (let t = 0; t <= 2000; t += 250) {
    const x = padL + (t / totalMs) * innerW;
    elements.push(
      <line
        key={`tick-${t}`}
        x1={x}
        y1={padT - 6}
        x2={x}
        y2={padT + barH + 6}
        stroke="#e2e8f0"
        strokeWidth={1}
      />
    );
    elements.push(
      <text
        key={`tickL-${t}`}
        x={x}
        y={padT + barH + 22}
        textAnchor="middle"
        fontSize={10}
        fill="#64748b"
      >
        {t} ms
      </text>
    );
  }

  let cumMs = 0;
  let ttftCumMs = 0;
  SEGMENTS.forEach((s, i) => {
    const x = padL + (cumMs / totalMs) * innerW;
    const w = (s.ms / totalMs) * innerW;
    elements.push(
      <rect
        key={`seg-${i}`}
        x={x}
        y={padT}
        width={w}
        height={barH}
        fill={s.fill}
        stroke="#ffffff"
        strokeWidth={1}
      />
    );
    if (w >= 50) {
      elements.push(
        <text
          key={`segL-${i}`}
          x={x + w / 2}
          y={padT + barH / 2 - 4}
          textAnchor="middle"
          fontSize={11}
          fontWeight={700}
          fill={s.textColor}
          fontFamily="Plus Jakarta Sans, system-ui, sans-serif"
        >
          {s.name}
        </text>
      );
      elements.push(
        <text
          key={`segMs-${i}`}
          x={x + w / 2}
          y={padT + barH / 2 + 14}
          textAnchor="middle"
          fontSize={11}
          fill={s.textColor}
          fontFamily="Menlo, Monaco, monospace"
        >
          {s.ms}ms
        </text>
      );
    } else {
      elements.push(
        <text
          key={`segLs-${i}`}
          x={x + w / 2}
          y={padT - 8}
          textAnchor="middle"
          fontSize={10}
          fontWeight={600}
          fill="#475569"
        >
          {s.name} · {s.ms}ms
        </text>
      );
    }
    cumMs += s.ms;
    if (i === 2) {
      ttftCumMs = cumMs;
    }
  });

  const ttftX = padL + (ttftCumMs / totalMs) * innerW;
  elements.push(
    <line
      key="ttft"
      x1={ttftX}
      y1={padT - 30}
      x2={ttftX}
      y2={padT + barH + 6}
      stroke="#FF7F50"
      strokeWidth={2}
      strokeDasharray="3 2"
    />
  );
  elements.push(
    <text
      key="ttftLbl"
      x={ttftX - 6}
      y={padT - 38}
      textAnchor="end"
      fontSize={11}
      fontWeight={700}
      fill="#c2410c"
      letterSpacing="0.04em"
    >
      ↓ TTFT · 450 ms
    </text>
  );
  elements.push(
    <text
      key="ttftLbl2"
      x={ttftX - 6}
      y={padT - 22}
      textAnchor="end"
      fontSize={10}
      fill="#475569"
      fontStyle="italic"
    >
      user sees first token
    </text>
  );

  const totalX = padL + innerW;
  elements.push(
    <line
      key="total"
      x1={totalX}
      y1={padT - 30}
      x2={totalX}
      y2={padT + barH + 6}
      stroke="#0f172a"
      strokeWidth={1.5}
      strokeDasharray="3 2"
    />
  );
  elements.push(
    <text
      key="totalLbl"
      x={totalX - 6}
      y={padT - 38}
      textAnchor="end"
      fontSize={11}
      fontWeight={700}
      fill="#0f172a"
      letterSpacing="0.04em"
    >
      ↓ END · 2,000 ms
    </text>
  );
  elements.push(
    <text
      key="totalLbl2"
      x={totalX - 6}
      y={padT - 22}
      textAnchor="end"
      fontSize={10}
      fill="#475569"
      fontStyle="italic"
    >
      last token
    </text>
  );

  const noteY = padT + barH + 60;
  elements.push(
    <rect
      key="noteBg"
      x={padL}
      y={noteY}
      width={innerW}
      height={70}
      rx={6}
      fill="#fafbfc"
      stroke="#e2e8f0"
    />
  );
  elements.push(
    <text key="note1" x={padL + 14} y={noteY + 22} fontSize={11} fontWeight={700} fill="#0f172a">
      The streamed gap is what the user feels.
    </text>
  );
  elements.push(
    <text key="note2" x={padL + 14} y={noteY + 40} fontSize={11} fill="#475569">
      Streaming converts a 2,000 ms total into a 450 ms perceived latency. Without streaming, a
    </text>
  );
  elements.push(
    <text key="note3" x={padL + 14} y={noteY + 56} fontSize={11} fill="#475569">
      blank screen for 2 seconds — the same total time, dramatically worse experience.
    </text>
  );

  return (
    <div className={styles.diagram}>
      <p className={styles.tag}>Diagram · End-to-end RAG latency budget</p>
      <h4 className={styles.heading}>2,000 ms total · 450 ms time-to-first-token</h4>
      <p className={styles.subheading}>
        The generation step (coral) dominates the budget. Streaming converts the 1.5-second
        generation into a 450 ms perceived latency by emitting tokens as they're produced.
        Time-to-first-token is the metric users actually feel; total latency matters for cost.
      </p>
      <svg
        className={styles.svg}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="RAG end-to-end latency budget showing retrieval, rerank, prefill, generation, and network components"
      >
        {elements}
      </svg>
    </div>
  );
}
