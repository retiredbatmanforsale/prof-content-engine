import React from 'react';
import styles from './styles.module.css';

export default function HybridRetrievalFlow() {
  const W = 720;
  const H = 380;

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
    subColor,
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
    subColor?: string;
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
        y={y + (subtitle ? 20 : h / 2 + 4)}
        textAnchor="middle"
        fontSize={12}
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
          fill={subColor || '#475569'}
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
    label,
    labelOffset = -6,
  }: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    color?: string;
    label?: string;
    labelOffset?: number;
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
        {label && (
          <text
            x={(x1 + x2) / 2}
            y={(y1 + y2) / 2 + labelOffset}
            textAnchor="middle"
            fontSize={10}
            fill={color === '#94a3b8' ? '#64748b' : color}
            fontFamily="Menlo, Monaco, monospace"
          >
            {label}
          </text>
        )}
      </g>
    );
  };

  const elements: React.ReactNode[] = [];

  const cx = W / 2;
  const queryY = 30;
  elements.push(
    <Box
      key="query"
      x={cx - 90}
      y={queryY}
      w={180}
      h={42}
      title="User query"
      subtitle="natural language"
    />
  );

  const splitY = queryY + 42 + 24;
  const sparseX = 80;
  const denseX = W - 80 - 220;
  const lateralW = 220;

  elements.push(
    <Box
      key="sparse"
      x={sparseX}
      y={splitY}
      w={lateralW}
      h={56}
      title="BM25 · sparse"
      subtitle="inverted index → top-50"
    />
  );
  elements.push(
    <Box
      key="dense"
      x={denseX}
      y={splitY}
      w={lateralW}
      h={56}
      title="Dense bi-encoder + ANN"
      subtitle="embedding ANN → top-50"
    />
  );

  elements.push(
    <Arrow
      key="qs"
      x1={cx - 18}
      y1={queryY + 42}
      x2={sparseX + lateralW / 2}
      y2={splitY}
    />
  );
  elements.push(
    <Arrow
      key="qd"
      x1={cx + 18}
      y1={queryY + 42}
      x2={denseX + lateralW / 2}
      y2={splitY}
    />
  );

  elements.push(
    <text
      key="sparseHint"
      x={sparseX + lateralW / 2}
      y={splitY - 12}
      textAnchor="middle"
      fontSize={10}
      fill="#64748b"
      fontStyle="italic"
    >
      catches rare entities · numerics · IDs
    </text>
  );
  elements.push(
    <text
      key="denseHint"
      x={denseX + lateralW / 2}
      y={splitY - 12}
      textAnchor="middle"
      fontSize={10}
      fill="#64748b"
      fontStyle="italic"
    >
      catches semantic / paraphrase queries
    </text>
  );

  const fuseY = splitY + 56 + 30;
  elements.push(
    <Box
      key="rrf"
      x={cx - 130}
      y={fuseY}
      w={260}
      h={52}
      title="RRF fusion"
      subtitle="rrf(d) = Σ 1 / (k + rank_q(d))"
      fill="#fff7ed"
      stroke="#FF7F50"
      strokeWidth={2}
    />
  );

  elements.push(
    <Arrow
      key="sf"
      x1={sparseX + lateralW / 2}
      y1={splitY + 56}
      x2={cx - 50}
      y2={fuseY}
      label="ranks"
    />
  );
  elements.push(
    <Arrow
      key="df"
      x1={denseX + lateralW / 2}
      y1={splitY + 56}
      x2={cx + 50}
      y2={fuseY}
      label="ranks"
    />
  );

  const candY = fuseY + 52 + 22;
  elements.push(
    <Box
      key="cand"
      x={cx - 100}
      y={candY}
      w={200}
      h={36}
      title="Top-50 fused candidates"
      fill="#fafbfc"
      stroke="#94a3b8"
    />
  );
  elements.push(<Arrow key="rc" x1={cx} y1={fuseY + 52} x2={cx} y2={candY} />);

  const rerankY = candY + 36 + 22;
  elements.push(
    <Box
      key="rerank"
      x={cx - 130}
      y={rerankY}
      w={260}
      h={42}
      title="Cross-encoder rerank"
      subtitle="(query, passage) joint scoring"
      fill="#ffffff"
      stroke="#FF7F50"
      strokeWidth={2}
    />
  );
  elements.push(<Arrow key="cr" x1={cx} y1={candY + 36} x2={cx} y2={rerankY} />);

  const outY = rerankY + 42 + 22;
  elements.push(
    <Box
      key="out"
      x={cx - 100}
      y={outY}
      w={200}
      h={36}
      title="Top-K (5–10) → Generation"
      titleColor="#c2410c"
    />
  );
  elements.push(<Arrow key="ro" x1={cx} y1={rerankY + 42} x2={cx} y2={outY} />);

  return (
    <div className={styles.diagram}>
      <p className={styles.tag}>Diagram · Hybrid retrieval + RRF + cross-encoder rerank</p>
      <h4 className={styles.heading}>Why hybrid retrieval is the production default</h4>
      <p className={styles.subheading}>
        BM25 catches rare-entity queries that dense retrieval misses; dense catches the semantic
        and paraphrase queries that BM25 misses. Reciprocal Rank Fusion is the score-agnostic
        merge step (no calibration required), and the cross-encoder reranker takes the joint
        (query, passage) view that the bi-encoder structurally cannot. Top-K=5-10 passages flow
        to generation.
      </p>
      <svg
        className={styles.svg}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Hybrid retrieval flow with BM25, dense ANN, RRF fusion, and cross-encoder rerank"
      >
        {elements}
      </svg>
    </div>
  );
}
