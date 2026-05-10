import React, {useState} from 'react';
import styles from './styles.module.css';

interface Component {
  name: string;
  p50: number;
  p99: number;
  color: string;
}

const DEFAULTS: Component[] = [
  {name: 'Network in',         p50: 5,  p99: 10, color: '#94a3b8'},
  {name: 'Auth + session',     p50: 3,  p99: 5,  color: '#cbd5e1'},
  {name: 'User feature fetch', p50: 8,  p99: 15, color: '#fb923c'},
  {name: 'User tower forward', p50: 3,  p99: 5,  color: '#fdba74'},
  {name: 'ANN query',          p50: 6,  p99: 10, color: '#fde68a'},
  {name: 'Item feature fetch', p50: 14, p99: 25, color: '#a3e635'},
  {name: 'Ranker forward',     p50: 60, p99: 80, color: '#34d399'},
  {name: 'Re-rank',            p50: 8,  p99: 15, color: '#67e8f9'},
  {name: 'Network out',        p50: 12, p99: 25, color: '#94a3b8'},
];

const BUDGET_MS = 200;

export default function LatencySimulator() {
  const [components, setComponents] = useState<Component[]>(DEFAULTS);
  const [cacheHitRate, setCacheHitRate] = useState(0.9);

  function setP99(idx: number, value: number) {
    setComponents((prev) =>
      prev.map((c, i) => (i === idx ? {...c, p99: value} : c)),
    );
  }

  // Cache effect on item feature fetch (component index 5)
  const itemFetchIdx = 5;
  const baseItemP99 = components[itemFetchIdx].p99;
  const effectiveItemP99 =
    (1 - cacheHitRate) * baseItemP99 + cacheHitRate * (baseItemP99 * 0.05);

  const totalP99 = components.reduce((sum, c, i) => {
    if (i === itemFetchIdx) return sum + effectiveItemP99;
    return sum + c.p99;
  }, 0);

  const totalP50 = components.reduce((sum, c, i) => {
    const eff = i === itemFetchIdx ? c.p50 * (1 - cacheHitRate * 0.95) : c.p50;
    return sum + eff;
  }, 0);

  const overBudget = totalP99 > BUDGET_MS;
  const slack = BUDGET_MS - totalP99;

  // Build the bar viz
  const totalForViz = Math.max(totalP99, BUDGET_MS);
  let cursor = 0;
  const segments = components.map((c, i) => {
    const width = i === itemFetchIdx ? effectiveItemP99 : c.p99;
    const seg = {x: cursor, w: width, ...c};
    cursor += width;
    return seg;
  });

  return (
    <div className={styles.playground}>
      <p className={styles.tag}>Interactive · Latency stack</p>
      <p className={styles.heading}>Where does the 200ms p99 budget go?</p>
      <p className={styles.subheading}>
        Each slider tweaks one component's p99. The cache slider models per-item caching effect on item feature fetch. Watch the total turn red when you exceed budget.
      </p>

      <div className={styles.controls}>
        {components.map((c, i) => (
          <div key={c.name} className={styles.controlRow}>
            <label className={styles.controlLabel}>{c.name} p99</label>
            <input
              type="range"
              min={1} max={i === 6 ? 200 : 60} step={1}
              value={c.p99}
              onChange={(e) => setP99(i, parseInt(e.target.value, 10))}
              className={styles.slider}
            />
            <span className={styles.controlValue}>{c.p99} ms</span>
          </div>
        ))}
        <div className={styles.controlRow}>
          <label className={styles.controlLabel}>Item-cache hit rate</label>
          <input
            type="range" min={0} max={1} step={0.01}
            value={cacheHitRate}
            onChange={(e) => setCacheHitRate(parseFloat(e.target.value))}
            className={styles.slider}
          />
          <span className={styles.controlValue}>{(cacheHitRate * 100).toFixed(0)}%</span>
        </div>
      </div>

      <svg viewBox={`0 0 ${totalForViz} 80`} className={styles.chart} preserveAspectRatio="none">
        {/* Budget marker */}
        <line x1={BUDGET_MS} y1={0} x2={BUDGET_MS} y2={80} stroke="#dc2626" strokeWidth={1} strokeDasharray="4 3" />
        <text x={BUDGET_MS - 2} y={12} textAnchor="end" fontSize={9} fill="#dc2626" fontFamily="Menlo, monospace">200ms budget</text>
        {/* Segments */}
        {segments.map((s) => (
          <g key={s.name}>
            <rect x={s.x} y={20} width={s.w} height={36} fill={s.color} />
          </g>
        ))}
        {/* Total marker */}
        <line x1={totalP99} y1={20} x2={totalP99} y2={56} stroke="#0f172a" strokeWidth={1.5} />
      </svg>

      <div className={styles.outputs} style={{marginTop: '0.85rem'}}>
        <div className={`${styles.outputItem} ${overBudget ? styles.outputItemAlert : styles.outputItemOk}`}>
          <p className={styles.outputLabel}>Total p99</p>
          <p className={styles.outputValue}>{totalP99.toFixed(0)} ms</p>
          <p className={styles.outputSubtext}>{overBudget ? `Over budget by ${(-slack).toFixed(0)} ms` : `${slack.toFixed(0)} ms slack`}</p>
        </div>
        <div className={styles.outputItem}>
          <p className={styles.outputLabel}>Total p50</p>
          <p className={styles.outputValue}>{totalP50.toFixed(0)} ms</p>
          <p className={styles.outputSubtext}>With cache effect</p>
        </div>
        <div className={styles.outputItem}>
          <p className={styles.outputLabel}>Effective item-fetch p99</p>
          <p className={styles.outputValue}>{effectiveItemP99.toFixed(1)} ms</p>
          <p className={styles.outputSubtext}>{(cacheHitRate * 100).toFixed(0)}% cache hit applied</p>
        </div>
      </div>

      <p className={styles.commentary}>
        {overBudget
          ? `Over budget. The two largest components are usually item feature fetch and the ranker — both have engineering levers (caching, batching, distillation). Cut feature fetch first; it usually dominates the tail.`
          : cacheHitRate < 0.5
            ? `Under budget, but cache hit rate is low. With 100 candidates per request, every 10% of cache rate cuts effective fetch latency by ~10× on hits — and the tail is usually dominated by misses anyway.`
            : `Budget healthy. Notice that p50 is much smaller than p99 — production systems are graded on the tail, not the average.`}
      </p>
    </div>
  );
}
