import React from 'react';
import styles from './styles.module.css';

export default function RankerArchitecture() {
  const W = 720;
  const H = 520;

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
    titleSize,
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
    titleSize?: number;
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
        y={y + (subtitle ? 19 : h / 2 + 4)}
        textAnchor="middle"
        fontSize={titleSize || 12}
        fontWeight={700}
        fill={titleColor || '#0f172a'}
        fontFamily="Plus Jakarta Sans, system-ui, sans-serif"
      >
        {title}
      </text>
      {subtitle && (
        <text
          x={x + w / 2}
          y={y + h - 9}
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
        <line x1={x1} y1={y1} x2={tipX} y2={tipY} stroke={color} strokeWidth={1.4} />
        <polygon
          points={`${tipX + px},${tipY + py} ${tipX - px},${tipY - py} ${x2},${y2}`}
          fill={color}
        />
      </g>
    );
  };

  const elements: React.ReactNode[] = [];

  const featNames = [
    { title: 'User features', subtitle: 'id · history · demo' },
    { title: 'Item features', subtitle: 'id · channel · topic' },
    { title: 'Context features', subtitle: 'time · device · slot' },
    { title: 'Cross features', subtitle: 'user × item interactions' },
  ];
  const featW = 156;
  const featH = 48;
  const featGap = 12;
  const featTotal = 4 * featW + 3 * featGap;
  const featStartX = (W - featTotal) / 2;
  const featY = 30;

  featNames.forEach((f, i) => {
    elements.push(
      <Box
        key={`feat-${i}`}
        x={featStartX + i * (featW + featGap)}
        y={featY}
        w={featW}
        h={featH}
        title={f.title}
        subtitle={f.subtitle}
      />
    );
  });

  const concatY = featY + featH + 30;
  const concatX = featStartX;
  const concatW = featTotal;
  elements.push(
    <Box
      key="concat"
      x={concatX}
      y={concatY}
      w={concatW}
      h={42}
      title="Embedding lookups + dense feature concat"
      fill="#fafbfc"
      stroke="#94a3b8"
    />
  );

  featNames.forEach((_, i) => {
    const fromX = featStartX + i * (featW + featGap) + featW / 2;
    elements.push(
      <Arrow key={`fa-${i}`} x1={fromX} y1={featY + featH} x2={fromX} y2={concatY} />
    );
  });

  const splitY = concatY + 42 + 28;
  const wideX = featStartX + 30;
  const wideW = 200;
  const deepX = featStartX + featTotal - 30 - 200;
  const deepW = 200;

  elements.push(
    <Box
      key="wide"
      x={wideX}
      y={splitY}
      w={wideW}
      h={56}
      title="Wide"
      subtitle="linear · memorises crosses"
    />
  );

  const deepY = splitY;
  const deepH = 156;
  elements.push(
    <Box
      key="deepBox"
      x={deepX}
      y={deepY}
      w={deepW}
      h={deepH}
      title="Deep MLP backbone"
      subtitle=""
      fill="#ffffff"
      stroke="#FF7F50"
      strokeWidth={2}
    />
  );

  ['Layer 1 · ReLU', 'Layer 2 · ReLU', 'Layer 3 · ReLU', 'Layer 4 · ReLU'].forEach((lbl, i) => {
    elements.push(
      <rect
        key={`l${i}`}
        x={deepX + 16}
        y={deepY + 28 + i * 26}
        width={deepW - 32}
        height={20}
        rx={3}
        fill={i === 3 ? '#fef3c7' : '#fff7ed'}
        stroke="#fdba74"
        strokeWidth={1}
      />
    );
    elements.push(
      <text
        key={`lt${i}`}
        x={deepX + deepW / 2}
        y={deepY + 28 + i * 26 + 14}
        textAnchor="middle"
        fontSize={10}
        fill="#9a3412"
        fontFamily="Menlo, Monaco, monospace"
      >
        {lbl}
      </text>
    );
  });

  const concatCenterX = featStartX + featTotal / 2;
  elements.push(
    <Arrow
      key="cf-wide"
      x1={concatCenterX}
      y1={concatY + 42}
      x2={wideX + wideW / 2}
      y2={splitY}
    />
  );
  elements.push(
    <Arrow
      key="cf-deep"
      x1={concatCenterX}
      y1={concatY + 42}
      x2={deepX + deepW / 2}
      y2={splitY}
    />
  );

  const mergeY = deepY + deepH + 24;
  elements.push(
    <Box
      key="merge"
      x={featStartX + 60}
      y={mergeY}
      w={featTotal - 120}
      h={36}
      title="Shared backbone representation"
      fill="#fafbfc"
      stroke="#94a3b8"
    />
  );
  elements.push(
    <Arrow
      key="ma1"
      x1={wideX + wideW / 2}
      y1={splitY + 56}
      x2={featStartX + featTotal / 2 - 60}
      y2={mergeY}
    />
  );
  elements.push(
    <Arrow
      key="ma2"
      x1={deepX + deepW / 2}
      y1={deepY + deepH}
      x2={featStartX + featTotal / 2 + 60}
      y2={mergeY}
    />
  );

  const headY = mergeY + 36 + 24;
  const heads = [
    { name: 'Watch time', subtitle: 'quantile / MSE', color: '#FF7F50' },
    { name: 'Click', subtitle: 'BCE · calibration', color: '#cbd5e1' },
    { name: 'Completion', subtitle: 'BCE · quality', color: '#cbd5e1' },
    { name: 'Like', subtitle: 'BCE · explicit', color: '#cbd5e1' },
  ];
  const headW = 132;
  const headGap = 14;
  const headTotal = 4 * headW + 3 * headGap;
  const headStartX = (W - headTotal) / 2;

  heads.forEach((h, i) => {
    const x = headStartX + i * (headW + headGap);
    elements.push(
      <Box
        key={`hd-${i}`}
        x={x}
        y={headY}
        w={headW}
        h={48}
        title={h.name}
        subtitle={h.subtitle}
        stroke={h.color}
        strokeWidth={h.color === '#FF7F50' ? 2 : 1.5}
      />
    );
    elements.push(
      <Arrow
        key={`ha-${i}`}
        x1={featStartX + featTotal / 2}
        y1={mergeY + 36}
        x2={x + headW / 2}
        y2={headY}
      />
    );
  });

  const scoreY = headY + 48 + 22;
  elements.push(
    <Box
      key="score"
      x={featStartX + 100}
      y={scoreY}
      w={featTotal - 200}
      h={42}
      title={'score = t̂^α · p̂_c^β · p̂_comp^γ · p̂_like^δ'}
      subtitle="weights tuned online (Lesson 6) — not learned"
      titleSize={13}
      fill="#fff7ed"
      stroke="#FF7F50"
      strokeWidth={2}
    />
  );

  heads.forEach((_, i) => {
    const fromX = headStartX + i * (headW + headGap) + headW / 2;
    elements.push(
      <Arrow
        key={`sa-${i}`}
        x1={fromX}
        y1={headY + 48}
        x2={featStartX + featTotal / 2}
        y2={scoreY}
      />
    );
  });

  return (
    <div className={styles.diagram}>
      <p className={styles.tag}>Diagram · Wide-and-deep multi-task ranker</p>
      <h4 className={styles.heading}>Wide for memorisation, deep for generalisation, multi-task for the metric tree</h4>
      <p className={styles.subheading}>
        The canonical ranker shape (Cheng et al., 2016): a wide linear arm captures memorised
        feature crosses while a 4-layer MLP backbone (coral) generalises across high-cardinality
        embeddings. Multi-task heads share the backbone but specialise on different objectives;
        their weighted geometric combination is the final ranking score, with combination weights{' '}
        <strong>tuned online via A/B test</strong>, not learned.
      </p>
      <svg
        className={styles.svg}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Wide-and-deep multi-task ranker architecture"
      >
        {elements}
      </svg>
    </div>
  );
}
