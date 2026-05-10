import React from 'react';
import styles from './styles.module.css';

export default function ModelDecayCurve() {
  const W = 720;
  const H = 340;
  const padL = 60;
  const padR = 30;
  const padT = 50;
  const padB = 56;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const days = 90;
  const yMin = 0.55;
  const yMax = 0.85;
  const baseline = 0.80;
  const driftDay = 45;
  const recoveryDay = 50;

  const ndcg: number[] = [];
  for (let d = 0; d < days; d++) {
    let v: number;
    if (d < 30) {
      v = baseline - 0.0008 * d;
    } else if (d < driftDay) {
      v = baseline - 0.0008 * 30 - 0.0014 * (d - 30);
    } else if (d < recoveryDay) {
      v = baseline - 0.0008 * 30 - 0.0014 * (driftDay - 30) - 0.025 * (d - driftDay + 1);
    } else if (d < recoveryDay + 4) {
      const frac = (d - recoveryDay) / 4;
      v = (baseline - 0.105) + frac * (baseline - 0.02 - (baseline - 0.105));
    } else if (d < 75) {
      v = baseline - 0.02 - 0.0006 * (d - recoveryDay - 4);
    } else if (d < 80) {
      const frac = (d - 75) / 5;
      v = baseline - 0.04 + frac * 0.025;
    } else {
      v = baseline - 0.015 - 0.0008 * (d - 80);
    }
    v += (Math.sin(d * 0.7) + Math.sin(d * 1.3)) * 0.003;
    ndcg.push(Math.max(yMin, Math.min(yMax, v)));
  }

  const xPx = (d: number) => padL + (d / (days - 1)) * innerW;
  const yPx = (v: number) => padT + (1 - (v - yMin) / (yMax - yMin)) * innerH;

  const elements: React.ReactNode[] = [];

  for (let g = 0; g <= 5; g++) {
    const v = yMin + (g / 5) * (yMax - yMin);
    elements.push(
      <line
        key={`gy-${g}`}
        x1={padL}
        y1={yPx(v)}
        x2={padL + innerW}
        y2={yPx(v)}
        stroke="#f1f5f9"
        strokeWidth={1}
      />
    );
    elements.push(
      <text
        key={`gyl-${g}`}
        x={padL - 8}
        y={yPx(v) + 3}
        textAnchor="end"
        fontSize={10}
        fill="#64748b"
      >
        {v.toFixed(2)}
      </text>
    );
  }

  elements.push(
    <line
      key="baseline"
      x1={padL}
      y1={yPx(baseline)}
      x2={padL + innerW}
      y2={yPx(baseline)}
      stroke="#0369a1"
      strokeDasharray="4 3"
      strokeWidth={1.2}
    />
  );
  elements.push(
    <text
      key="basetxt"
      x={padL + innerW - 6}
      y={yPx(baseline) - 6}
      textAnchor="end"
      fontSize={10}
      fill="#0369a1"
      fontStyle="italic"
    >
      baseline NDCG
    </text>
  );

  [0, 30, 60, 89].forEach((d) => {
    elements.push(
      <text
        key={`xt-${d}`}
        x={xPx(d)}
        y={padT + innerH + 18}
        textAnchor="middle"
        fontSize={10}
        fill="#475569"
      >
        day {d + 1}
      </text>
    );
  });

  const events = [
    { day: 30, color: '#cbd5e1', label: 'scheduled retrain', dashed: true },
    { day: driftDay, color: '#ef4444', label: 'drift event', dashed: false },
    { day: recoveryDay, color: '#10b981', label: 'auto-retrain triggered', dashed: false },
    { day: 75, color: '#f59e0b', label: 'shadow + canary', dashed: false },
    { day: 80, color: '#10b981', label: '100% promotion', dashed: false },
  ];

  events.forEach((ev, i) => {
    const x = xPx(ev.day);
    elements.push(
      <line
        key={`ev-${i}`}
        x1={x}
        y1={padT - 12}
        x2={x}
        y2={padT + innerH}
        stroke={ev.color}
        strokeWidth={1.5}
        strokeDasharray={ev.dashed ? '3 2' : undefined}
      />
    );
  });

  const path = ndcg
    .map((v, d) => `${d === 0 ? 'M' : 'L'} ${xPx(d)} ${yPx(v)}`)
    .join(' ');
  elements.push(
    <path
      key="line"
      d={path}
      stroke="#FF7F50"
      strokeWidth={2.2}
      fill="none"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  );

  elements.push(
    <text
      key="anDrift"
      x={xPx(driftDay) - 4}
      y={padT - 16}
      textAnchor="end"
      fontSize={10}
      fontWeight={700}
      fill="#b91c1c"
    >
      ↓ PSI &gt; 0.25
    </text>
  );
  elements.push(
    <text
      key="anRetrain"
      x={xPx(recoveryDay) + 4}
      y={padT - 16}
      fontSize={10}
      fontWeight={700}
      fill="#047857"
    >
      auto-retrain
    </text>
  );
  elements.push(
    <text
      key="anShadow"
      x={xPx(75)}
      y={padT - 30}
      textAnchor="middle"
      fontSize={10}
      fontWeight={700}
      fill="#b45309"
    >
      shadow → canary
    </text>
  );
  elements.push(
    <text
      key="anPromote"
      x={xPx(80)}
      y={padT - 16}
      textAnchor="middle"
      fontSize={10}
      fontWeight={700}
      fill="#047857"
    >
      promote 100%
    </text>
  );

  elements.push(
    <text
      key="ylbl"
      transform={`rotate(-90, 18, ${padT + innerH / 2})`}
      x={18}
      y={padT + innerH / 2}
      textAnchor="middle"
      fontSize={11}
      fill="#475569"
    >
      NDCG @ 10
    </text>
  );

  elements.push(
    <text
      key="xlbl"
      x={padL + innerW / 2}
      y={H - 8}
      textAnchor="middle"
      fontSize={11}
      fill="#475569"
    >
      90-day production timeline
    </text>
  );

  return (
    <div className={styles.diagram}>
      <p className={styles.tag}>Diagram · Drift detection + retraining cadence</p>
      <h4 className={styles.heading}>How a model decays — and how the system catches it</h4>
      <p className={styles.subheading}>
        Performance drifts gradually under distribution shift; calendar retrains hold the line for
        a while. Around day 45 a real drift event (a holiday, a viral content shift, a feature
        outage) pushes PSI past the 0.25 threshold, triggering an auto-retrain. The new model
        ramps via shadow → canary → 100% promotion, and the metric returns to baseline.
      </p>
      <svg
        className={styles.svg}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="90-day model decay curve with drift event and auto-retrain recovery"
      >
        {elements}
      </svg>
    </div>
  );
}
