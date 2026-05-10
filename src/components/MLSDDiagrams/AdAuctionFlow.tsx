import React from 'react';
import styles from './styles.module.css';

export default function AdAuctionFlow() {
  const W = 720;
  const H = 480;

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
        y={y + (subtitle ? 21 : h / 2 + 4)}
        textAnchor="middle"
        fontSize={titleSize || 12}
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
    dashed,
    label,
  }: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    color?: string;
    dashed?: boolean;
    label?: string;
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
          stroke={color}
          strokeWidth={1.5}
          strokeDasharray={dashed ? '4 3' : undefined}
        />
        <polygon
          points={`${tipX + px},${tipY + py} ${tipX - px},${tipY - py} ${x2},${y2}`}
          fill={color}
        />
        {label && (
          <text
            x={(x1 + x2) / 2 + 6}
            y={(y1 + y2) / 2 + 3}
            fontSize={10}
            fill={color === '#0369a1' ? '#0369a1' : '#64748b'}
            fontStyle="italic"
          >
            {label}
          </text>
        )}
      </g>
    );
  };

  const elements: React.ReactNode[] = [];
  const cx = W / 2 - 100;
  const colW = 260;

  const queryY = 26;
  elements.push(
    <Box
      key="query"
      x={cx - colW / 2}
      y={queryY}
      w={colW}
      h={42}
      title="Search query"
      subtitle="user · context"
    />
  );

  const filterY = queryY + 42 + 22;
  elements.push(
    <Box
      key="filter"
      x={cx - colW / 2}
      y={filterY}
      w={colW}
      h={56}
      title="Eligibility filter"
      subtitle="budget · targeting · freq cap"
    />
  );
  elements.push(<Arrow key="qf" x1={cx} y1={queryY + 42} x2={cx} y2={filterY} />);

  const shortlistY = filterY + 56 + 22;
  elements.push(
    <Box
      key="shortlist"
      x={cx - colW / 2}
      y={shortlistY}
      w={colW}
      h={42}
      title="Top-N eligible ads"
    />
  );
  elements.push(<Arrow key="fs" x1={cx} y1={filterY + 56} x2={cx} y2={shortlistY} />);

  const scoreY = shortlistY + 42 + 22;
  elements.push(
    <Box
      key="score"
      x={cx - colW / 2}
      y={scoreY}
      w={colW}
      h={56}
      title="score = pCTR × bid × quality"
      subtitle="calibrated pCTR is mandatory"
      titleSize={12}
      fill="#fff7ed"
      stroke="#FF7F50"
      strokeWidth={2}
    />
  );
  elements.push(<Arrow key="ss" x1={cx} y1={shortlistY + 42} x2={cx} y2={scoreY} />);

  const auctionY = scoreY + 56 + 22;
  elements.push(
    <Box
      key="auction"
      x={cx - colW / 2}
      y={auctionY}
      w={colW}
      h={56}
      title="GSP slot allocation"
      subtitle="price = score_next / pCTR_winner"
      titleSize={12}
      fill="#fff7ed"
      stroke="#FF7F50"
      strokeWidth={2}
    />
  );
  elements.push(<Arrow key="sa" x1={cx} y1={scoreY + 56} x2={cx} y2={auctionY} />);

  const slotsY = auctionY + 56 + 26;
  const slotW = 80;
  const slotH = 56;
  const slotGap = 10;
  const slotsTotal = 3 * slotW + 2 * slotGap;
  const slotsStart = cx - slotsTotal / 2;
  ['Slot 1', 'Slot 2', 'Slot 3'].forEach((label, i) => {
    const sx = slotsStart + i * (slotW + slotGap);
    elements.push(
      <Box
        key={`slot-${i}`}
        x={sx}
        y={slotsY}
        w={slotW}
        h={slotH}
        title={label}
        subtitle={i === 0 ? '$0.92' : i === 1 ? '$0.71' : '$0.48'}
        titleSize={11}
        stroke={i === 0 ? '#FF7F50' : '#cbd5e1'}
        strokeWidth={i === 0 ? 2 : 1.5}
      />
    );
  });
  elements.push(<Arrow key="as" x1={cx} y1={auctionY + 56} x2={cx} y2={slotsY} />);

  const sideX = cx + colW / 2 + 50;
  const sideY = scoreY + 30;
  const sideW = 180;
  const sideH = 100;
  elements.push(
    <rect
      key="propBox"
      x={sideX}
      y={sideY}
      width={sideW}
      height={sideH}
      rx={8}
      fill="#e0f2fe"
      stroke="#0369a1"
      strokeWidth={2}
    />
  );
  elements.push(
    <text
      key="propTitle"
      x={sideX + sideW / 2}
      y={sideY + 18}
      textAnchor="middle"
      fontSize={11}
      fontWeight={800}
      fill="#0369a1"
      letterSpacing="0.06em"
    >
      PROPENSITY LOG
    </text>
  );
  ['ad_id, slot, π(ad|req)', 'logged per impression', '→ IPW off-policy eval', 'release gate (Lesson 12)'].forEach(
    (line, i) => {
      elements.push(
        <text
          key={`prop-${i}`}
          x={sideX + sideW / 2}
          y={sideY + 36 + i * 14}
          textAnchor="middle"
          fontSize={10}
          fill={i === 2 ? '#0369a1' : '#475569'}
          fontStyle={i === 2 ? 'italic' : 'normal'}
          fontWeight={i === 2 ? 600 : 400}
          fontFamily={i === 0 ? 'Menlo, Monaco, monospace' : 'inherit'}
        >
          {line}
        </text>
      );
    }
  );
  elements.push(
    <Arrow
      key="aProp"
      x1={cx + colW / 2}
      y1={auctionY + 28}
      x2={sideX}
      y2={sideY + sideH / 2}
      color="#0369a1"
      dashed
    />
  );

  return (
    <div className={styles.diagram}>
      <p className={styles.tag}>Diagram · GSP ad auction flow</p>
      <h4 className={styles.heading}>Calibration is what makes the auction work</h4>
      <p className={styles.subheading}>
        Eligibility-filtered ads are scored by{' '}
        <code style={{ fontSize: '0.85em' }}>pCTR × bid × quality</code> and allocated via a
        generalised second-price auction; winners pay the next-place score divided by their pCTR.
        Every impression's propensity is logged in parallel — that's what enables IPW off-policy
        revenue estimation as a release gate before any A/B test.
      </p>
      <svg
        className={styles.svg}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Ad auction flow with eligibility, scoring, GSP allocation, and propensity logging"
      >
        {elements}
      </svg>
    </div>
  );
}
