import React from 'react';
import styles from './styles.module.css';

interface Layer {
  name: string;
  count: string;
  technique: string;
  latency: string;
  width: number;
  fill: string;
  stroke: string;
  textFill: string;
  subFill: string;
}

const LAYERS: Layer[] = [
  {
    name: 'Catalogue',
    count: '1B videos',
    technique: 'Index over the full corpus',
    latency: '—',
    width: 620,
    fill: '#f8fafc',
    stroke: '#cbd5e1',
    textFill: '#0f172a',
    subFill: '#64748b',
  },
  {
    name: 'Retrieval',
    count: '1B → ~1,000',
    technique: 'Two-tower + ANN (Lesson 3)',
    latency: '~50 ms',
    width: 520,
    fill: '#ffffff',
    stroke: '#cbd5e1',
    textFill: '#0f172a',
    subFill: '#475569',
  },
  {
    name: 'Ranking',
    count: '~1,000 → ~100',
    technique: 'Wide-and-deep multi-task (Lesson 4)',
    latency: '~80 ms',
    width: 400,
    fill: '#ffffff',
    stroke: '#FF7F50',
    textFill: '#0f172a',
    subFill: '#475569',
  },
  {
    name: 'Re-ranking',
    count: '~100 → top-K',
    technique: 'Diversity · freshness · rules',
    latency: '~30 ms',
    width: 280,
    fill: '#ffffff',
    stroke: '#cbd5e1',
    textFill: '#0f172a',
    subFill: '#475569',
  },
];

export default function RecsysFunnel() {
  const W = 720;
  const H = 360;
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
        fill={layer.fill}
        stroke={layer.stroke}
        strokeWidth={layer.stroke === '#FF7F50' ? 2 : 1.5}
      />
    );

    elements.push(
      <text
        key={`name-${i}`}
        x={x + 18}
        y={y + 22}
        fontSize={13}
        fontWeight={700}
        fill={layer.textFill}
        fontFamily="Plus Jakarta Sans, system-ui, sans-serif"
        letterSpacing="0.02em"
      >
        {layer.name}
      </text>
    );
    elements.push(
      <text
        key={`tech-${i}`}
        x={x + 18}
        y={y + 41}
        fontSize={11}
        fill={layer.subFill}
      >
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
        fill={layer.textFill}
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
          fill={layer.stroke === '#FF7F50' ? '#c2410c' : '#64748b'}
          fontWeight={layer.stroke === '#FF7F50' ? 600 : 400}
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

  const totalY = startY + LAYERS.length * (layerH + gap) + 6;
  elements.push(
    <line
      key="totline"
      x1={cx - 220}
      y1={totalY + 14}
      x2={cx + 220}
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
      Total p99 budget · ~200 ms · ~10 ms slack
    </text>
  );

  elements.push(
    <text
      key="leftLabel"
      transform={`rotate(-90, 24, ${startY + (LAYERS.length * (layerH + gap)) / 2})`}
      x={24}
      y={startY + (LAYERS.length * (layerH + gap)) / 2}
      textAnchor="middle"
      fontSize={11}
      fill="#94a3b8"
      letterSpacing="0.08em"
      textTransform="uppercase"
    >
      RECALL → PRECISION
    </text>
  );

  return (
    <div className={styles.diagram}>
      <p className={styles.tag}>Diagram · Candidate-generation funnel</p>
      <h4 className={styles.heading}>1 billion → top-K, in 200 ms</h4>
      <p className={styles.subheading}>
        Each layer trades recall for precision. Retrieval is cheap and recall-oriented; ranking is
        expensive and precision-oriented; re-ranking is set-aware. The ranker (coral) is the
        layer where most of the model complexity — and most of the latency budget — lives.
      </p>
      <svg className={styles.svg} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Recsys candidate-generation funnel">
        {elements}
      </svg>
    </div>
  );
}
