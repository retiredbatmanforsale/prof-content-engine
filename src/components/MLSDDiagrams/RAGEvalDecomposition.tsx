import React from 'react';
import styles from './styles.module.css';

export default function RAGEvalDecomposition() {
  const W = 720;
  const H = 420;

  const Box = ({
    x,
    y,
    w,
    h,
    title,
    subtitle,
    fill,
    stroke,
    strokeWidth,
    titleColor,
  }: {
    x: number;
    y: number;
    w: number;
    h: number;
    title: string;
    subtitle?: string;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    titleColor?: string;
  }) => (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={6}
        fill={fill || '#ffffff'}
        stroke={stroke || '#cbd5e1'}
        strokeWidth={strokeWidth || 1.5}
      />
      <text
        x={x + w / 2}
        y={y + (subtitle ? 21 : h / 2 + 4)}
        textAnchor="middle"
        fontSize={12}
        fontWeight={700}
        fill={titleColor || '#0f172a'}
        fontFamily="Plus Jakarta Sans, system-ui, sans-serif"
      >
        {title}
      </text>
      {subtitle && (
        <text x={x + w / 2} y={y + h - 9} textAnchor="middle" fontSize={10} fill="#475569">
          {subtitle}
        </text>
      )}
    </g>
  );

  const Arrow = ({
    x1,
    y1,
    x2,
    y2,
    color = '#94a3b8',
  }: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    color?: string;
  }) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    const ux = dx / len;
    const uy = dy / len;
    const tipX = x2 - ux * 6;
    const tipY = y2 - uy * 6;
    const px = -uy * 4;
    const py = ux * 4;
    return (
      <g>
        <line x1={x1} y1={y1} x2={tipX} y2={tipY} stroke={color} strokeWidth={1.5} />
        <polygon
          points={`${tipX + px},${tipY + py} ${tipX - px},${tipY - py} ${x2},${y2}`}
          fill={color}
        />
      </g>
    );
  };

  const elements: React.ReactNode[] = [];

  const cx = W / 2;
  const respY = 30;
  const respW = 460;
  const respH = 60;
  elements.push(
    <Box
      key="resp"
      x={cx - respW / 2}
      y={respY}
      w={respW}
      h={respH}
      title="Shipped response"
      subtitle="query · retrieved passages · cited answer"
      fill="#fafbfc"
      stroke="#94a3b8"
    />
  );

  const evY = respY + respH + 50;
  const evW = 200;
  const evH = 88;
  const evGap = 20;
  const evTotalW = 3 * evW + 2 * evGap;
  const evStartX = (W - evTotalW) / 2;

  const evaluators = [
    {
      name: 'Retrieval recall',
      sub: 'recall@K vs gold passages',
      isolates: 'isolates Lesson 9',
      color: '#0369a1',
      bg: '#e0f2fe',
    },
    {
      name: 'Faithfulness',
      sub: 'per-claim entailment · citation accuracy',
      isolates: 'isolates Lesson 10',
      color: '#FF7F50',
      bg: '#fff7ed',
    },
    {
      name: 'Answer quality',
      sub: 'LLM-judge · calibrated to humans',
      isolates: 'isolates Lesson 8',
      color: '#10b981',
      bg: '#ecfdf5',
    },
  ];

  evaluators.forEach((e, i) => {
    const x = evStartX + i * (evW + evGap);
    elements.push(
      <Box
        key={`ev-${i}`}
        x={x}
        y={evY}
        w={evW}
        h={evH}
        title={e.name}
        fill={e.bg}
        stroke={e.color}
        strokeWidth={2}
        titleColor="#0f172a"
      />
    );
    elements.push(
      <text
        key={`evs-${i}`}
        x={x + evW / 2}
        y={evY + 44}
        textAnchor="middle"
        fontSize={10}
        fill="#475569"
      >
        {e.sub}
      </text>
    );
    elements.push(
      <text
        key={`evi-${i}`}
        x={x + evW / 2}
        y={evY + evH - 14}
        textAnchor="middle"
        fontSize={10}
        fontWeight={700}
        fill={e.color}
        letterSpacing="0.05em"
      >
        {e.isolates}
      </text>
    );

    const arrowFromX = cx - 80 + (i - 1) * 30;
    elements.push(
      <Arrow
        key={`ea-${i}`}
        x1={arrowFromX}
        y1={respY + respH}
        x2={x + evW / 2}
        y2={evY}
      />
    );
  });

  const metricY = evY + evH + 40;
  elements.push(
    <Box
      key="metricBox"
      x={evStartX}
      y={metricY}
      w={evTotalW}
      h={64}
      title="Component-wise dashboard"
      subtitle="three independent metrics, three independently fixable failures"
      fill="#ffffff"
      stroke="#cbd5e1"
    />
  );

  evaluators.forEach((e, i) => {
    const x = evStartX + i * (evW + evGap) + evW / 2;
    elements.push(<Arrow key={`ma-${i}`} x1={x} y1={evY + evH} x2={x} y2={metricY} color={e.color} />);
  });

  const noteY = metricY + 64 + 26;
  elements.push(
    <text
      key="noteHdr"
      x={W / 2}
      y={noteY}
      textAnchor="middle"
      fontSize={11}
      fontWeight={700}
      fill="#c2410c"
      letterSpacing="0.04em"
    >
      You cannot fix what you cannot localise.
    </text>
  );
  elements.push(
    <text
      key="note2"
      x={W / 2}
      y={noteY + 18}
      textAnchor="middle"
      fontSize={10}
      fill="#475569"
    >
      A single end-to-end "answer quality" number cannot tell you which layer broke. Three independent scores can.
    </text>
  );
  elements.push(
    <text
      key="note3"
      x={W / 2}
      y={noteY + 34}
      textAnchor="middle"
      fontSize={10}
      fill="#94a3b8"
    >
      Ragas · TruLens · DeepEval bundle these primitives.
    </text>
  );

  return (
    <div className={styles.diagram}>
      <p className={styles.tag}>Diagram · Component-wise RAG eval</p>
      <h4 className={styles.heading}>Three axes, three independently fixable failures</h4>
      <p className={styles.subheading}>
        Every shipped response is scored on three independent axes — retrieval recall (Lesson 9
        failure mode), generation faithfulness (Lesson 10), and end-to-end answer quality
        (Lesson 8). The colour-coded arrows from each evaluator into the dashboard make the
        localisation visible: a regression in one axis points at exactly one layer to fix.
      </p>
      <svg
        className={styles.svg}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="RAG evaluation decomposition into three independent axes"
      >
        {elements}
      </svg>
    </div>
  );
}
