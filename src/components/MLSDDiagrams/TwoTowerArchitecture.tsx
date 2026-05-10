import React from 'react';
import styles from './styles.module.css';

export default function TwoTowerArchitecture() {
  const W = 720;
  const H = 420;
  const colW = 320;
  const gap = 40;
  const leftX = 30;
  const rightX = leftX + colW + gap;

  const Box = ({
    x,
    y,
    w,
    h,
    title,
    subtitle,
    highlight,
    fill,
  }: {
    x: number;
    y: number;
    w: number;
    h: number;
    title: string;
    subtitle?: string;
    highlight?: boolean;
    fill?: string;
  }) => (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={6}
        fill={fill || '#ffffff'}
        stroke={highlight ? '#FF7F50' : '#cbd5e1'}
        strokeWidth={highlight ? 2 : 1.5}
      />
      <text
        x={x + w / 2}
        y={y + (subtitle ? 21 : h / 2 + 4)}
        textAnchor="middle"
        fontSize={12}
        fontWeight={700}
        fill="#0f172a"
        fontFamily="Plus Jakarta Sans, system-ui, sans-serif"
      >
        {title}
      </text>
      {subtitle && (
        <text
          x={x + w / 2}
          y={y + h - 10}
          textAnchor="middle"
          fontSize={10}
          fill="#475569"
        >
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
    label,
    dashed,
  }: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    label?: string;
    dashed?: boolean;
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
        <line
          x1={x1}
          y1={y1}
          x2={tipX}
          y2={tipY}
          stroke="#94a3b8"
          strokeWidth={1.5}
          strokeDasharray={dashed ? '4 3' : undefined}
        />
        <polygon
          points={`${tipX + px},${tipY + py} ${tipX - px},${tipY - py} ${x2},${y2}`}
          fill="#94a3b8"
        />
        {label && (
          <text
            x={(x1 + x2) / 2 + 8}
            y={(y1 + y2) / 2 + 3}
            fontSize={10}
            fill="#64748b"
            fontStyle="italic"
          >
            {label}
          </text>
        )}
      </g>
    );
  };

  const elements: React.ReactNode[] = [];

  elements.push(
    <text
      key="leftTitle"
      x={leftX + colW / 2}
      y={20}
      textAnchor="middle"
      fontSize={12}
      fontWeight={800}
      fill="#475569"
      letterSpacing="0.1em"
    >
      NAIVE · BRUTE-FORCE
    </text>
  );
  elements.push(
    <text
      key="rightTitle"
      x={rightX + colW / 2}
      y={20}
      textAnchor="middle"
      fontSize={12}
      fontWeight={800}
      fill="#c2410c"
      letterSpacing="0.1em"
    >
      MOTIVATED · TWO-TOWER + ANN
    </text>
  );

  elements.push(
    <rect
      key="leftBg"
      x={leftX - 6}
      y={36}
      width={colW + 12}
      height={H - 60}
      rx={10}
      fill="#fafbfc"
      stroke="#e2e8f0"
    />
  );

  elements.push(
    <Box
      key="lUser"
      x={leftX + 30}
      y={60}
      w={120}
      h={42}
      title="User"
      subtitle="request"
    />
  );
  elements.push(
    <Box
      key="lItems"
      x={leftX + 170}
      y={60}
      w={120}
      h={42}
      title="1B items"
      subtitle="(catalogue)"
    />
  );
  elements.push(
    <Box
      key="lScore"
      x={leftX + 30}
      y={150}
      w={260}
      h={56}
      title="Score every (user, item) pair"
      subtitle="forward pass over 1 billion items"
    />
  );
  elements.push(
    <Arrow key="la1" x1={leftX + 90} y1={102} x2={leftX + 90} y2={148} />
  );
  elements.push(
    <Arrow key="la2" x1={leftX + 230} y1={102} x2={leftX + 230} y2={148} />
  );

  elements.push(
    <Box
      key="lTopK"
      x={leftX + 80}
      y={245}
      w={160}
      h={42}
      title="Top-K"
      subtitle="ordered candidates"
    />
  );
  elements.push(
    <Arrow key="la3" x1={leftX + 160} y1={206} x2={leftX + 160} y2={243} />
  );

  elements.push(
    <text
      key="lLat1"
      x={leftX + colW / 2}
      y={313}
      textAnchor="middle"
      fontSize={11}
      fontWeight={700}
      fill="#b91c1c"
      letterSpacing="0.04em"
    >
      O(N) · 1000s of seconds at 1B
    </text>
  );
  elements.push(
    <text
      key="lLat2"
      x={leftX + colW / 2}
      y={331}
      textAnchor="middle"
      fontSize={10}
      fill="#94a3b8"
    >
      not viable in production
    </text>
  );

  elements.push(
    <line
      key="rDivider"
      x1={rightX}
      y1={140}
      x2={rightX + colW}
      y2={140}
      stroke="#cbd5e1"
      strokeDasharray="2 4"
      strokeWidth={1}
    />
  );
  elements.push(
    <text
      key="rOffline"
      x={rightX + 8}
      y={50}
      fontSize={10}
      fontWeight={700}
      fill="#0369a1"
      letterSpacing="0.1em"
    >
      OFFLINE · NIGHTLY
    </text>
  );
  elements.push(
    <text
      key="rOnline"
      x={rightX + 8}
      y={155}
      fontSize={10}
      fontWeight={700}
      fill="#c2410c"
      letterSpacing="0.1em"
    >
      ONLINE · &lt;10 MS
    </text>
  );

  elements.push(
    <Box
      key="rItemTower"
      x={rightX + 20}
      y={62}
      w={130}
      h={42}
      title="Item tower"
      subtitle="batch forward"
    />
  );
  elements.push(
    <Box
      key="rIndex"
      x={rightX + 170}
      y={62}
      w={130}
      h={42}
      title="ANN index"
      subtitle="HNSW · ScaNN"
      highlight
    />
  );
  elements.push(<Arrow key="ra1" x1={rightX + 150} y1={83} x2={rightX + 168} y2={83} />);
  elements.push(
    <Box
      key="rEmbStore"
      x={rightX + 20}
      y={114}
      w={280}
      h={20}
      title="1B precomputed item embeddings"
    />
  );

  elements.push(
    <Box
      key="rUser"
      x={rightX + 20}
      y={170}
      w={130}
      h={42}
      title="User"
      subtitle="request"
    />
  );
  elements.push(
    <Box
      key="rUserTower"
      x={rightX + 20}
      y={222}
      w={130}
      h={42}
      title="User tower"
      subtitle="~5 ms forward"
      highlight
    />
  );
  elements.push(<Arrow key="ra2" x1={rightX + 85} y1={212} x2={rightX + 85} y2={220} />);

  elements.push(
    <Box
      key="rQuery"
      x={rightX + 170}
      y={222}
      w={130}
      h={42}
      title="ANN lookup"
      subtitle="~5 ms"
      highlight
    />
  );
  elements.push(<Arrow key="ra3" x1={rightX + 150} y1={243} x2={rightX + 168} y2={243} />);

  elements.push(
    <Arrow
      key="ra4"
      x1={rightX + 235}
      y1={104}
      x2={rightX + 235}
      y2={220}
      dashed
      label="lookup"
    />
  );

  elements.push(
    <Box
      key="rTopK"
      x={rightX + 90}
      y={290}
      w={140}
      h={42}
      title="Top-K"
      subtitle="ordered candidates"
    />
  );
  elements.push(<Arrow key="ra5" x1={rightX + 235} y1={264} x2={rightX + 200} y2={290} />);

  elements.push(
    <text
      key="rLat1"
      x={rightX + colW / 2}
      y={355}
      textAnchor="middle"
      fontSize={12}
      fontWeight={700}
      fill="#047857"
      letterSpacing="0.04em"
    >
      ~10 ms / query · 1B catalogue
    </text>
  );
  elements.push(
    <text
      key="rLat2"
      x={rightX + colW / 2}
      y={373}
      textAnchor="middle"
      fontSize={10}
      fill="#64748b"
    >
      offline / online split is the unlock
    </text>
  );

  return (
    <div className={styles.diagram}>
      <p className={styles.tag}>Diagram · Two-tower retrieval architecture</p>
      <h4 className={styles.heading}>Why retrieval works at 1B-item scale</h4>
      <p className={styles.subheading}>
        The naive answer scores every (user, item) pair at request time — 1B forward passes per
        query. The motivated answer splits the model into two towers and pre-computes all item
        embeddings offline; only the user tower runs online, against a sub-millisecond ANN index.
        The offline / online split is the architecture unlock.
      </p>
      <svg
        className={styles.svg}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Two-tower retrieval architecture compared to brute-force scoring"
      >
        {elements}
      </svg>
    </div>
  );
}
