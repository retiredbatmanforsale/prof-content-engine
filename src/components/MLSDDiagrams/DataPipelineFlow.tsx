import React from 'react';
import styles from './styles.module.css';

export default function DataPipelineFlow() {
  const W = 720;
  const H = 440;

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
    label,
    labelSide = 'right',
    dashed,
  }: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    color?: string;
    label?: string;
    labelSide?: 'left' | 'right' | 'center';
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
    const labelX =
      labelSide === 'left'
        ? (x1 + x2) / 2 - 8
        : labelSide === 'right'
        ? (x1 + x2) / 2 + 8
        : (x1 + x2) / 2;
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
            x={labelX}
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

  const eventX = 30;
  const eventY = 30;
  elements.push(
    <Box
      key="events"
      x={eventX}
      y={eventY}
      w={170}
      h={48}
      title="Browser / app events"
      subtitle="clicks · impressions · dwell"
    />
  );

  const kafkaX = 280;
  const kafkaY = eventY;
  elements.push(
    <Box
      key="kafka"
      x={kafkaX}
      y={kafkaY}
      w={170}
      h={48}
      title="Kafka"
      subtitle="event log · append-only"
      fill="#fff7ed"
      stroke="#FF7F50"
      strokeWidth={2}
    />
  );

  elements.push(
    <Arrow
      key="ek"
      x1={eventX + 170}
      y1={eventY + 24}
      x2={kafkaX}
      y2={kafkaY + 24}
      label="~50 ms"
      labelSide="center"
    />
  );

  const splitY = kafkaY + 48 + 30;
  const lcx = 200;
  const rcx = 540;

  elements.push(
    <Box
      key="streaming"
      x={lcx - 110}
      y={splitY}
      w={220}
      h={42}
      title="Streaming worker"
      subtitle="Flink · Spark Streaming"
    />
  );
  elements.push(
    <Box
      key="batch"
      x={rcx - 110}
      y={splitY}
      w={220}
      h={42}
      title="Batch ETL"
      subtitle="Spark / Beam · daily"
    />
  );

  elements.push(
    <Arrow
      key="ks"
      x1={kafkaX + 50}
      y1={kafkaY + 48}
      x2={lcx}
      y2={splitY}
      label="seconds"
      labelSide="left"
    />
  );
  elements.push(
    <Arrow
      key="kb"
      x1={kafkaX + 120}
      y1={kafkaY + 48}
      x2={rcx}
      y2={splitY}
      label="hours – 1 day"
      labelSide="right"
    />
  );

  const fsY = splitY + 42 + 26;
  elements.push(
    <Box
      key="onlinefs"
      x={lcx - 130}
      y={fsY}
      w={260}
      h={56}
      title="Online feature store"
      subtitle="Redis · sub-ms reads · sharded"
      fill="#fff7ed"
      stroke="#FF7F50"
      strokeWidth={2}
    />
  );
  elements.push(
    <Box
      key="offlinefs"
      x={rcx - 130}
      y={fsY}
      w={260}
      h={56}
      title="Offline feature store"
      subtitle="Iceberg · point-in-time snapshots"
      fill="#fff7ed"
      stroke="#FF7F50"
      strokeWidth={2}
    />
  );

  elements.push(<Arrow key="sf" x1={lcx} y1={splitY + 42} x2={lcx} y2={fsY} />);
  elements.push(<Arrow key="bf" x1={rcx} y1={splitY + 42} x2={rcx} y2={fsY} />);

  elements.push(
    <line
      key="syncline"
      x1={lcx + 130}
      y1={fsY + 28}
      x2={rcx - 130}
      y2={fsY + 28}
      stroke="#0369a1"
      strokeWidth={1.4}
      strokeDasharray="4 3"
    />
  );
  elements.push(
    <text
      key="syncLbl"
      x={(lcx + rcx) / 2}
      y={fsY + 22}
      textAnchor="middle"
      fontSize={10}
      fill="#0369a1"
      fontWeight={600}
      letterSpacing="0.04em"
    >
      single feature definition
    </text>
  );
  elements.push(
    <text
      key="syncLbl2"
      x={(lcx + rcx) / 2}
      y={fsY + 42}
      textAnchor="middle"
      fontSize={10}
      fill="#0369a1"
      fontStyle="italic"
    >
      training-serving consistency
    </text>
  );

  const consumerY = fsY + 56 + 26;
  elements.push(
    <Box
      key="online"
      x={lcx - 130}
      y={consumerY}
      w={260}
      h={48}
      title="Online inference"
      subtitle="ranker scores at request time"
    />
  );
  elements.push(
    <Box
      key="training"
      x={rcx - 130}
      y={consumerY}
      w={260}
      h={48}
      title="Training job"
      subtitle="reads historical snapshots"
    />
  );

  elements.push(
    <Arrow
      key="oo"
      x1={lcx}
      y1={fsY + 56}
      x2={lcx}
      y2={consumerY}
      label="< 1 ms"
      labelSide="right"
    />
  );
  elements.push(
    <Arrow
      key="tt"
      x1={rcx}
      y1={fsY + 56}
      x2={rcx}
      y2={consumerY}
      label="point-in-time"
      labelSide="right"
    />
  );

  const noteY = consumerY + 48 + 22;
  elements.push(
    <text
      key="note"
      x={W / 2}
      y={noteY + 6}
      textAnchor="middle"
      fontSize={11}
      fontWeight={700}
      fill="#c2410c"
      letterSpacing="0.04em"
    >
      Same feature value at time T, online and offline — by construction.
    </text>
  );
  elements.push(
    <text
      key="note2"
      x={W / 2}
      y={noteY + 24}
      textAnchor="middle"
      fontSize={10}
      fill="#94a3b8"
    >
      Feast / Tecton / in-house equivalents at FAANG scale all enforce this contract.
    </text>
  );

  return (
    <div className={styles.diagram}>
      <p className={styles.tag}>Diagram · Data pipeline + feature store</p>
      <h4 className={styles.heading}>How training-serving skew is eliminated by construction</h4>
      <p className={styles.subheading}>
        Events stream into Kafka, then fan out to a streaming path (sub-second freshness, online
        feature store, request-time scoring) and a batch path (hours-to-day lag, offline feature
        store, training reads historical snapshots). Both stores are populated from a{' '}
        <strong>single feature definition</strong> — the same feature value at time T, on both
        sides.
      </p>
      <svg
        className={styles.svg}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Recsys data pipeline with online and offline feature stores"
      >
        {elements}
      </svg>
    </div>
  );
}
