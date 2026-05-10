import React, {useState, useMemo} from 'react';
import styles from './styles.module.css';

// Synthetic fraud / non-fraud score distributions:
// non-fraud scores: Beta(2, 8) (low scores)
// fraud scores: Beta(8, 2) (high scores)
// We compute FPR/FNR analytically over a discretised threshold range.

function betaPdf(x: number, a: number, b: number): number {
  // unnormalised — fine for our needs since we sum and normalise
  return Math.pow(x, a - 1) * Math.pow(1 - x, b - 1);
}

function survivalAbove(threshold: number, a: number, b: number): number {
  // Approx integral of Beta(a,b) from threshold to 1, via Riemann sum
  const N = 200;
  let sum = 0;
  let totalSum = 0;
  const dx = 1 / N;
  for (let i = 0; i < N; i++) {
    const x = (i + 0.5) * dx;
    const p = betaPdf(x, a, b);
    totalSum += p * dx;
    if (x >= threshold) sum += p * dx;
  }
  return sum / totalSum;
}

export default function FraudThresholdOptimizer() {
  const [costRatio, setCostRatio] = useState(10);  // c_FN / c_FP
  const [threshold, setThreshold] = useState(0.5);
  const [prevalence, setPrevalence] = useState(0.001);

  // FPR = P(score >= threshold | non-fraud)
  // FNR = P(score < threshold | fraud) = 1 - P(score >= threshold | fraud)
  const fpr = useMemo(() => survivalAbove(threshold, 2, 8), [threshold]);
  const fnr = useMemo(() => 1 - survivalAbove(threshold, 8, 2), [threshold]);
  const recall = 1 - fnr;
  const precision = useMemo(() => {
    const tp = (1 - fnr) * prevalence;
    const fp = fpr * (1 - prevalence);
    return tp / Math.max(tp + fp, 1e-9);
  }, [fpr, fnr, prevalence]);

  // Expected cost per transaction
  // Cost = FPR × c_FP × (1 - prevalence) + FNR × c_FN × prevalence
  const cFP = 20;
  const cFN = cFP * costRatio;
  const expectedCost = fpr * cFP * (1 - prevalence) + fnr * cFN * prevalence;

  // Find cost-optimal threshold by sweeping
  const costOptimum = useMemo(() => {
    let bestT = 0.5, bestCost = Infinity;
    for (let i = 0; i < 100; i++) {
      const t = i / 100;
      const f = survivalAbove(t, 2, 8);
      const fn = 1 - survivalAbove(t, 8, 2);
      const c = f * cFP * (1 - prevalence) + fn * cFN * prevalence;
      if (c < bestCost) { bestCost = c; bestT = t; }
    }
    return {threshold: bestT, cost: bestCost};
  }, [cFP, cFN, prevalence]);

  // Build cost curve viz
  const points: Array<{t: number; cost: number}> = [];
  for (let i = 0; i < 100; i++) {
    const t = i / 100;
    const f = survivalAbove(t, 2, 8);
    const fn = 1 - survivalAbove(t, 8, 2);
    const c = f * cFP * (1 - prevalence) + fn * cFN * prevalence;
    points.push({t, cost: c});
  }
  const maxCost = Math.max(...points.map(p => p.cost));
  const W = 400, H = 100;
  const path = points.map((p, i) =>
    `${i === 0 ? 'M' : 'L'} ${(p.t * W).toFixed(1)} ${(H - (p.cost / maxCost) * H * 0.9 - 5).toFixed(1)}`
  ).join(' ');

  return (
    <div className={styles.playground}>
      <p className={styles.tag}>Interactive · Fraud cost curve</p>
      <p className={styles.heading}>Where do you set the threshold? It's a product decision.</p>
      <p className={styles.subheading}>
        Adjust the cost ratio (false-negative cost vs false-positive cost) and watch the cost-optimal threshold shift. Default: c<sub>FN</sub> = 10× c<sub>FP</sub> (\$200 fraud loss vs \$20 customer-trust cost).
      </p>

      <div className={styles.controls}>
        <div className={styles.controlRow}>
          <label className={styles.controlLabel}>Cost ratio (c<sub>FN</sub> / c<sub>FP</sub>)</label>
          <input type="range" min={1} max={50} step={1}
            value={costRatio}
            onChange={(e) => setCostRatio(parseFloat(e.target.value))}
            className={styles.slider}
          />
          <span className={styles.controlValue}>{costRatio.toFixed(0)}×</span>
        </div>
        <div className={styles.controlRow}>
          <label className={styles.controlLabel}>Threshold</label>
          <input type="range" min={0.01} max={0.99} step={0.01}
            value={threshold}
            onChange={(e) => setThreshold(parseFloat(e.target.value))}
            className={styles.slider}
          />
          <span className={styles.controlValue}>{threshold.toFixed(2)}</span>
        </div>
        <div className={styles.controlRow}>
          <label className={styles.controlLabel}>Fraud prevalence</label>
          <input type="range" min={0.0001} max={0.05} step={0.0001}
            value={prevalence}
            onChange={(e) => setPrevalence(parseFloat(e.target.value))}
            className={styles.slider}
          />
          <span className={styles.controlValue}>{(prevalence * 100).toFixed(2)}%</span>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className={styles.chart} preserveAspectRatio="none">
        <text x={4} y={12} fontSize={9} fill="#64748b" fontFamily="Menlo, monospace">expected cost / txn</text>
        <path d={path} stroke="#fb6f5d" strokeWidth={2} fill="none" />
        {/* current threshold marker */}
        <line x1={threshold * W} y1={5} x2={threshold * W} y2={H - 2} stroke="#0f172a" strokeWidth={1} />
        <text x={threshold * W + 3} y={H - 4} fontSize={9} fill="#0f172a" fontFamily="Menlo, monospace">your threshold</text>
        {/* optimum marker */}
        <line x1={costOptimum.threshold * W} y1={5} x2={costOptimum.threshold * W} y2={H - 2} stroke="#10b981" strokeWidth={1} strokeDasharray="3 2" />
        <text x={costOptimum.threshold * W + 3} y={18} fontSize={9} fill="#10b981" fontFamily="Menlo, monospace">cost-optimal</text>
      </svg>

      <div className={styles.outputs} style={{marginTop: '0.85rem'}}>
        <div className={styles.outputItem}>
          <p className={styles.outputLabel}>FPR</p>
          <p className={styles.outputValue}>{(fpr * 100).toFixed(2)}%</p>
          <p className={styles.outputSubtext}>Legitimate blocked</p>
        </div>
        <div className={styles.outputItem}>
          <p className={styles.outputLabel}>FNR</p>
          <p className={styles.outputValue}>{(fnr * 100).toFixed(2)}%</p>
          <p className={styles.outputSubtext}>Fraud missed</p>
        </div>
        <div className={styles.outputItem}>
          <p className={styles.outputLabel}>Expected cost / txn</p>
          <p className={styles.outputValue}>${expectedCost.toFixed(3)}</p>
          <p className={styles.outputSubtext}>at current threshold</p>
        </div>
        <div className={styles.outputItem}>
          <p className={styles.outputLabel}>Cost-optimal threshold</p>
          <p className={styles.outputValue}>{costOptimum.threshold.toFixed(2)}</p>
          <p className={styles.outputSubtext}>${costOptimum.cost.toFixed(3)} / txn at optimum</p>
        </div>
      </div>

      <p className={styles.commentary}>
        Notice how the cost-optimal threshold shifts left (toward lower scores) as the cost ratio grows. At 1× costs are symmetric and you sit at the score midpoint; at 50× a single missed fraud costs more than 50 false positives, so you block aggressively. This is exactly why threshold optimisation is a product decision — not an accuracy hyperparameter.
      </p>
    </div>
  );
}
