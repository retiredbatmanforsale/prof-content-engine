import React from 'react';
import styles from './styles.module.css';

export default function NoveltyEffect() {
  const W = 720;
  const H = 320;
  const padL = 60;
  const padR = 30;
  const padT = 50;
  const padB = 50;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const days = 28;
  const yMin = -0.5;
  const yMax = 4.5;

  const deltas: number[] = [];
  for (let d = 0; d < days; d++) {
    let val: number;
    if (d < 7) {
      val = 4.0 - 0.06 * (d - 0);
    } else if (d < 14) {
      val = 3.6 - 0.32 * (d - 7);
    } else {
      val = 1.4 - 0.04 * (d - 14) + Math.sin(d * 0.6) * 0.1;
    }
    deltas.push(val);
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
        {v >= 0 ? '+' : ''}
        {v.toFixed(1)}%
      </text>
    );
  }

  elements.push(
    <line
      key="zero"
      x1={padL}
      y1={yPx(0)}
      x2={padL + innerW}
      y2={yPx(0)}
      stroke="#94a3b8"
      strokeWidth={1.2}
    />
  );

  ['Week 1', 'Week 2', 'Week 3', 'Week 4'].forEach((label, w) => {
    const x = xPx(w * 7 + 3);
    elements.push(
      <text
        key={`wk-${w}`}
        x={x}
        y={padT + innerH + 18}
        textAnchor="middle"
        fontSize={11}
        fontWeight={600}
        fill="#475569"
      >
        {label}
      </text>
    );
    if (w > 0) {
      elements.push(
        <line
          key={`wkdiv-${w}`}
          x1={xPx(w * 7 - 0.5)}
          y1={padT}
          x2={xPx(w * 7 - 0.5)}
          y2={padT + innerH}
          stroke="#e2e8f0"
          strokeDasharray="2 3"
          strokeWidth={1}
        />
      );
    }
  });

  for (let d = 0; d < days; d++) {
    if (d % 7 === 0 || d === days - 1) {
      elements.push(
        <text
          key={`xt-${d}`}
          x={xPx(d)}
          y={padT + innerH + 32}
          textAnchor="middle"
          fontSize={9}
          fill="#94a3b8"
        >
          d{d + 1}
        </text>
      );
    }
  }

  const week1End = xPx(6.5);
  elements.push(
    <rect
      key="dangerZone"
      x={padL}
      y={padT}
      width={week1End - padL}
      height={innerH}
      fill="#fee2e2"
      fillOpacity={0.4}
    />
  );

  const steadyStart = xPx(13.5);
  elements.push(
    <rect
      key="steadyZone"
      x={steadyStart}
      y={padT}
      width={padL + innerW - steadyStart}
      height={innerH}
      fill="#d1fae5"
      fillOpacity={0.35}
    />
  );

  const path = deltas
    .map((v, d) => `${d === 0 ? 'M' : 'L'} ${xPx(d)} ${yPx(v)}`)
    .join(' ');
  elements.push(
    <path key="line" d={path} stroke="#FF7F50" strokeWidth={2.2} fill="none" strokeLinejoin="round" />
  );

  deltas.forEach((v, d) => {
    elements.push(
      <circle key={`pt-${d}`} cx={xPx(d)} cy={yPx(v)} r={2.2} fill="#FF7F50" />
    );
  });

  elements.push(
    <text
      key="dangerLbl"
      x={padL + (week1End - padL) / 2}
      y={padT - 8}
      textAnchor="middle"
      fontSize={10}
      fontWeight={700}
      fill="#b91c1c"
      letterSpacing="0.06em"
    >
      DON'T SHIP HERE
    </text>
  );
  elements.push(
    <text
      key="steadyLbl"
      x={steadyStart + (padL + innerW - steadyStart) / 2}
      y={padT - 8}
      textAnchor="middle"
      fontSize={10}
      fontWeight={700}
      fill="#047857"
      letterSpacing="0.06em"
    >
      STEADY-STATE READOUT
    </text>
  );

  elements.push(
    <text
      key="ann1"
      x={xPx(2)}
      y={yPx(3.6) - 12}
      fontSize={10}
      fill="#475569"
      fontStyle="italic"
    >
      novelty spike (~+4%)
    </text>
  );
  elements.push(
    <text
      key="ann2"
      x={xPx(15)}
      y={yPx(1.0) - 12}
      fontSize={10}
      fill="#475569"
      fontStyle="italic"
    >
      true effect ≈ +1%
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
      Treatment − Control delta
    </text>
  );

  return (
    <div className={styles.diagram}>
      <p className={styles.tag}>Diagram · Novelty effects in A/B tests</p>
      <h4 className={styles.heading}>Why minimum two weeks · why report week-2 as steady-state</h4>
      <p className={styles.subheading}>
        New recommendations spike CTR in the first week as users explore — that lift is novelty,
        not the model's true contribution. By week 2 the delta has decayed substantially; weeks 3
        and 4 reveal the real effect. The L4 ceiling is shipping on the week-1 number; the L5
        habit is reading the steady-state.
      </p>
      <svg
        className={styles.svg}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="28-day novelty-effect time series with week-1 spike and steady-state readout"
      >
        {elements}
      </svg>
    </div>
  );
}
