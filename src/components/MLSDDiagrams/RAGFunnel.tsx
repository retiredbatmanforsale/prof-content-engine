import React from 'react';
import styles from './styles.module.css';

interface Layer {
  name: string;
  count: string;
  technique: string;
  latency: string;
  width: number;
  stroke: string;
  highlight?: boolean;
}

const LAYERS: Layer[] = [
  {
    name: 'Corpus',
    count: '~10M chunks',
    technique: 'Indexed offline · refreshed on doc updates',
    latency: '—',
    width: 620,
    stroke: '#cbd5e1',
  },
  {
    name: 'Retrieval',
    count: '10M → top-50',
    technique: 'BM25 + dense bi-encoder + ANN (Lesson 9)',
    latency: '~250 ms',
    width: 520,
    stroke: '#cbd5e1',
  },
  {
    name: 'Reranking',
    count: 'top-50 → top-K=5-10',
    technique: 'Cross-encoder (Lesson 9)',
    latency: '~200 ms',
    width: 410,
    stroke: '#cbd5e1',
  },
  {
    name: 'Generation',
    count: 'top-K + query → answer',
    technique: 'LLM · streamed · cited (Lesson 10)',
    latency: '~1,500 ms',
    width: 290,
    stroke: '#FF7F50',
    highlight: true,
  },
];

export default function RAGFunnel() {
  const W = 720;
  const H = 380;
  const layerH = 56;
  const gap = 18;
  const startY = 30;
  const cx = W / 2;

  const elements: React.ReactNode[] = [];

  LAYERS.forEach((layer, i) => {
    const y = startY + i * (layerH + gap);
    const x = cx - layer.width / 2;

    elements.push(
      <rect
        key={`box-${i}`}
        x={x}
        y={y}
        width={layer.width}
        height={layerH}
        rx={8}
        fill={i === 0 ? '#f8fafc' : '#ffffff'}
        stroke={layer.stroke}
        strokeWidth={layer.highlight ? 2 : 1.5}
      />
    );

    elements.push(
      <text
        key={`name-${i}`}
        x={x + 18}
        y={y + 22}
        fontSize={13}
        fontWeight={700}
        fill="#0f172a"
        fontFamily="Plus Jakarta Sans, system-ui, sans-serif"
        letterSpacing="0.02em"
      >
        {layer.name}
      </text>
    );
    elements.push(
      <text key={`tech-${i}`} x={x + 18} y={y + 41} fontSize={11} fill="#475569">
        {layer.technique}
      </text>
    );

    elements.push(
      <text
        key={`count-${i}`}
        x={x + layer.width - 18}
        y={y + 22}
        textAnchor="end"
        fontSize={12}
        fontWeight={600}
        fill="#0f172a"
        fontFamily="Menlo, Monaco, monospace"
      >
        {layer.count}
      </text>
    );
    if (layer.latency !== '—') {
      elements.push(
        <text
          key={`lat-${i}`}
          x={x + layer.width - 18}
          y={y + 41}
          textAnchor="end"
          fontSize={11}
          fill={layer.highlight ? '#c2410c' : '#64748b'}
          fontWeight={layer.highlight ? 600 : 400}
        >
          {layer.latency}
        </text>
      );
    }

    if (i < LAYERS.length - 1) {
      const arrowY1 = y + layerH;
      const arrowY2 = arrowY1 + gap - 2;
      elements.push(
        <line
          key={`arr-${i}`}
          x1={cx}
          y1={arrowY1}
          x2={cx}
          y2={arrowY2}
          stroke="#94a3b8"
          strokeWidth={1.5}
        />
      );
      elements.push(
        <polygon
          key={`tip-${i}`}
          points={`${cx - 4},${arrowY2 - 1} ${cx + 4},${arrowY2 - 1} ${cx},${arrowY2 + 5}`}
          fill="#94a3b8"
        />
      );
    }
  });

  const lastY = startY + (LAYERS.length - 1) * (layerH + gap) + layerH;

  elements.push(
    <path
      key="citationFlow"
      d={`M ${cx + LAYERS[3].width / 2 + 6} ${lastY - layerH / 2} L ${
        cx + LAYERS[1].width / 2 + 30
      } ${lastY - layerH / 2} L ${cx + LAYERS[1].width / 2 + 30} ${
        startY + (layerH + gap) + layerH / 2
      } L ${cx + LAYERS[1].width / 2 + 6} ${startY + (layerH + gap) + layerH / 2}`}
      fill="none"
      stroke="#0369a1"
      strokeDasharray="4 3"
      strokeWidth={1.4}
    />
  );
  elements.push(
    <polygon
      key="citTip"
      points={`${cx + LAYERS[1].width / 2 + 6},${startY + (layerH + gap) + layerH / 2 - 4} ${
        cx + LAYERS[1].width / 2 + 6
      },${startY + (layerH + gap) + layerH / 2 + 4} ${
        cx + LAYERS[1].width / 2
      },${startY + (layerH + gap) + layerH / 2}`}
      fill="#0369a1"
    />
  );
  elements.push(
    <text
      key="citLbl"
      x={cx + LAYERS[1].width / 2 + 36}
      y={
        (startY + (layerH + gap) + layerH / 2 + (lastY - layerH / 2)) / 2
      }
      fontSize={10}
      fill="#0369a1"
      fontWeight={600}
      letterSpacing="0.04em"
    >
      [doc-N]
    </text>
  );
  elements.push(
    <text
      key="citLbl2"
      x={cx + LAYERS[1].width / 2 + 36}
      y={(startY + (layerH + gap) + layerH / 2 + (lastY - layerH / 2)) / 2 + 14}
      fontSize={10}
      fill="#0369a1"
    >
      citations
    </text>
  );

  const totalY = startY + LAYERS.length * (layerH + gap) + 6;
  elements.push(
    <line
      key="totline"
      x1={cx - 230}
      y1={totalY + 14}
      x2={cx + 230}
      y2={totalY + 14}
      stroke="#FF7F50"
      strokeWidth={1}
      strokeDasharray="3 3"
    />
  );
  elements.push(
    <text
      key="total"
      x={cx}
      y={totalY + 38}
      textAnchor="middle"
      fontSize={13}
      fontWeight={700}
      fill="#c2410c"
      fontFamily="Plus Jakarta Sans, system-ui, sans-serif"
      letterSpacing="0.04em"
    >
      End-to-end · ~2,000 ms · TTFT &lt; 500 ms with streaming
    </text>
  );

  return (
    <div className={styles.diagram}>
      <p className={styles.tag}>Diagram · Three-stage RAG funnel</p>
      <h4 className={styles.heading}>10M chunks → cited answer, in ~2 seconds</h4>
      <p className={styles.subheading}>
        Retrieval narrows the corpus, the cross-encoder sharpens the shortlist, the LLM generates
        a grounded answer with inline citations. The generation step (coral) dominates the budget
        — which is why streaming, batching, and prompt design carry so much weight in Lesson 10.
        The dotted blue arrow is the citation feedback loop: passages flow down, citations refer
        back up.
      </p>
      <svg
        className={styles.svg}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Three-stage RAG funnel"
      >
        {elements}
      </svg>
    </div>
  );
}
