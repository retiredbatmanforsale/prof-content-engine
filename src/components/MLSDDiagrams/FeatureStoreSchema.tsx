import React from 'react';
import styles from './styles.module.css';

export default function FeatureStoreSchema() {
  const W = 720;
  const H = 460;

  const Arrow = ({
    x1,
    y1,
    x2,
    y2,
    color = '#94a3b8',
    label,
    labelSide = 'right',
  }: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    color?: string;
    label?: string;
    labelSide?: 'left' | 'right' | 'center';
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
            x={(x1 + x2) / 2 + (labelSide === 'left' ? -8 : labelSide === 'right' ? 8 : 0)}
            y={(y1 + y2) / 2 + 3}
            textAnchor={labelSide === 'center' ? 'middle' : labelSide === 'left' ? 'end' : 'start'}
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

  const defX = 200;
  const defY = 26;
  const defW = 320;
  const defH = 100;
  elements.push(
    <rect
      key="defBox"
      x={defX}
      y={defY}
      width={defW}
      height={defH}
      rx={8}
      fill="#fff7ed"
      stroke="#FF7F50"
      strokeWidth={2}
    />
  );
  elements.push(
    <text
      key="defTitle"
      x={defX + defW / 2}
      y={defY + 18}
      textAnchor="middle"
      fontSize={11}
      fontWeight={800}
      fill="#c2410c"
      letterSpacing="0.08em"
    >
      SINGLE FEATURE DEFINITION
    </text>
  );
  const codeLines = [
    'name: user_clicks_24h',
    'entity: user_id',
    'dtype: int32',
    'transform: count(clicks WHERE ts > now() - 24h)',
    'freshness: streaming · sub-second',
  ];
  codeLines.forEach((line, i) => {
    elements.push(
      <text
        key={`code-${i}`}
        x={defX + 16}
        y={defY + 36 + i * 13}
        fontSize={10}
        fill="#0f172a"
        fontFamily="Menlo, Monaco, monospace"
      >
        {line}
      </text>
    );
  });

  const storeY = 170;
  const storeH = 110;
  const onlineX = 50;
  const onlineW = 280;
  const offlineX = W - 50 - 280;
  const offlineW = 280;

  const renderStore = (
    x: number,
    title: string,
    backend: string,
    color: string,
    bg: string,
    rowKey: string,
    rowVal: string,
    accent: string,
    rowSubtitle: string
  ) => {
    elements.push(
      <rect
        key={`store-${title}`}
        x={x}
        y={storeY}
        width={onlineW}
        height={storeH}
        rx={8}
        fill={bg}
        stroke={color}
        strokeWidth={2}
      />
    );
    elements.push(
      <text
        key={`storeT-${title}`}
        x={x + onlineW / 2}
        y={storeY + 18}
        textAnchor="middle"
        fontSize={11}
        fontWeight={800}
        fill={accent}
        letterSpacing="0.08em"
      >
        {title}
      </text>
    );
    elements.push(
      <text
        key={`storeB-${title}`}
        x={x + onlineW / 2}
        y={storeY + 34}
        textAnchor="middle"
        fontSize={11}
        fill="#475569"
      >
        {backend}
      </text>
    );

    elements.push(
      <rect
        key={`row-${title}`}
        x={x + 16}
        y={storeY + 50}
        width={onlineW - 32}
        height={42}
        rx={4}
        fill="#ffffff"
        stroke="#e2e8f0"
      />
    );
    elements.push(
      <text
        key={`rowK-${title}`}
        x={x + 26}
        y={storeY + 67}
        fontSize={10}
        fill="#64748b"
        fontFamily="Menlo, Monaco, monospace"
      >
        {rowKey}
      </text>
    );
    elements.push(
      <text
        key={`rowV-${title}`}
        x={x + 26}
        y={storeY + 82}
        fontSize={10}
        fill="#0f172a"
        fontFamily="Menlo, Monaco, monospace"
        fontWeight={700}
      >
        {rowVal}
      </text>
    );
    elements.push(
      <text
        key={`rowSub-${title}`}
        x={x + onlineW - 26}
        y={storeY + 82}
        textAnchor="end"
        fontSize={9}
        fill="#94a3b8"
        fontStyle="italic"
      >
        {rowSubtitle}
      </text>
    );
  };

  renderStore(
    onlineX,
    'ONLINE STORE',
    'Redis · sub-ms · sharded',
    '#FF7F50',
    '#fff7ed',
    'user_clicks_24h[u=482]',
    '17',
    '#c2410c',
    'current value · ts = now()'
  );
  renderStore(
    offlineX,
    'OFFLINE STORE',
    'Iceberg / Parquet on lake',
    '#0369a1',
    '#e0f2fe',
    'user_clicks_24h[u=482, ts=2026-04-12]',
    '11',
    '#0369a1',
    'point-in-time · historical'
  );

  elements.push(
    <Arrow
      key="defOn"
      x1={defX + 80}
      y1={defY + defH}
      x2={onlineX + onlineW / 2}
      y2={storeY}
      label="streaming"
      labelSide="left"
    />
  );
  elements.push(
    <Arrow
      key="defOff"
      x1={defX + defW - 80}
      y1={defY + defH}
      x2={offlineX + offlineW / 2}
      y2={storeY}
      label="batch backfill"
      labelSide="right"
    />
  );

  const consumerY = 320;
  elements.push(
    <rect
      key="onlineCons"
      x={onlineX + 30}
      y={consumerY}
      width={onlineW - 60}
      height={48}
      rx={6}
      fill="#ffffff"
      stroke="#cbd5e1"
      strokeWidth={1.5}
    />
  );
  elements.push(
    <text
      key="onlineConsT"
      x={onlineX + onlineW / 2}
      y={consumerY + 21}
      textAnchor="middle"
      fontSize={12}
      fontWeight={700}
      fill="#0f172a"
    >
      Online inference
    </text>
  );
  elements.push(
    <text
      key="onlineConsS"
      x={onlineX + onlineW / 2}
      y={consumerY + 38}
      textAnchor="middle"
      fontSize={10}
      fill="#475569"
    >
      ranker reads at request time
    </text>
  );

  elements.push(
    <rect
      key="offlineCons"
      x={offlineX + 30}
      y={consumerY}
      width={offlineW - 60}
      height={48}
      rx={6}
      fill="#ffffff"
      stroke="#cbd5e1"
      strokeWidth={1.5}
    />
  );
  elements.push(
    <text
      key="offlineConsT"
      x={offlineX + offlineW / 2}
      y={consumerY + 21}
      textAnchor="middle"
      fontSize={12}
      fontWeight={700}
      fill="#0f172a"
    >
      Training pipeline
    </text>
  );
  elements.push(
    <text
      key="offlineConsS"
      x={offlineX + offlineW / 2}
      y={consumerY + 38}
      textAnchor="middle"
      fontSize={10}
      fill="#475569"
    >
      point-in-time joins on history
    </text>
  );

  elements.push(
    <Arrow
      key="onCons"
      x1={onlineX + onlineW / 2}
      y1={storeY + storeH}
      x2={onlineX + onlineW / 2}
      y2={consumerY}
    />
  );
  elements.push(
    <Arrow
      key="offCons"
      x1={offlineX + offlineW / 2}
      y1={storeY + storeH}
      x2={offlineX + offlineW / 2}
      y2={consumerY}
    />
  );

  const noteY = 400;
  elements.push(
    <rect
      key="noteBg"
      x={50}
      y={noteY}
      width={W - 100}
      height={48}
      rx={6}
      fill="#fafbfc"
      stroke="#e2e8f0"
    />
  );
  elements.push(
    <text
      key="note1"
      x={W / 2}
      y={noteY + 20}
      textAnchor="middle"
      fontSize={11}
      fontWeight={700}
      fill="#0f172a"
    >
      Same logical schema · same value at time T · training-serving skew impossible by construction
    </text>
  );
  elements.push(
    <text
      key="note2"
      x={W / 2}
      y={noteY + 36}
      textAnchor="middle"
      fontSize={10}
      fill="#94a3b8"
      fontStyle="italic"
    >
      Feast · Tecton · in-house equivalents at FAANG scale all enforce this contract
    </text>
  );

  return (
    <div className={styles.diagram}>
      <p className={styles.tag}>Diagram · Feature store schema</p>
      <h4 className={styles.heading}>One definition, two stores, zero training-serving skew</h4>
      <p className={styles.subheading}>
        A feature is written once as a single declarative definition. Streaming materialises it
        into the online store (Redis · sub-ms · current value); batch backfill materialises the
        same logical schema into the offline store (Iceberg · point-in-time historicals). Both
        downstream consumers — online inference and training — see the same value at time T.
      </p>
      <svg
        className={styles.svg}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Feature store schema with online and offline stores derived from a single definition"
      >
        {elements}
      </svg>
    </div>
  );
}
