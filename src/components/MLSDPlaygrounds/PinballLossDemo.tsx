import React, {useState, useMemo} from 'react';
import styles from './styles.module.css';

// Mulberry32 — small deterministic PRNG so the dataset is stable across renders.
function mulberry32(seed: number) {
  return function() {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Point { x: number; y: number; }

// Generate synthetic ETA data: y ≈ 10 + 2x with right-skewed noise (occasional long delays)
function generateData(n: number, skew: number, seed = 42): Point[] {
  const rng = mulberry32(seed);
  const data: Point[] = [];
  for (let i = 0; i < n; i++) {
    const x = 0.5 + rng() * 9.5;        // distance 0.5–10 km
    const baseline = 10 + 2 * x;
    // Right-skewed noise: 75% small +/- noise, 25% large positive (delay)
    const r = rng();
    let noise: number;
    if (r < 0.75) {
      noise = (rng() - 0.5) * 3;        // symmetric small
    } else {
      noise = Math.pow(rng(), 0.3) * skew * 6;  // right-skewed long tail
    }
    data.push({x, y: Math.max(0, baseline + noise)});
  }
  return data;
}

// Train a 2-param linear model (intercept + slope) under pinball loss at quantile tau, via SGD.
interface Model { alpha: number; beta: number; }
function trainQuantile(data: Point[], tau: number, epochs = 600, lr = 0.01): Model {
  let alpha = 10, beta = 2;
  const n = data.length;
  for (let e = 0; e < epochs; e++) {
    let gradA = 0, gradB = 0;
    for (const {x, y} of data) {
      const yhat = alpha + beta * x;
      const r = y - yhat;
      // d loss / d yhat: -tau if r > 0 (under-pred), (1-tau) if r < 0 (over-pred), 0 at r=0
      const d = r > 0 ? -tau : (1 - tau);
      gradA += d;
      gradB += d * x;
    }
    alpha -= lr * gradA / n;
    beta  -= lr * gradB / n;
    // Decay learning rate slightly
    if (e === 200) lr *= 0.5;
    if (e === 400) lr *= 0.5;
  }
  return {alpha, beta};
}

// Train an MSE (mean squared error) baseline via closed-form OLS
function trainMSE(data: Point[]): Model {
  const n = data.length;
  const sumX = data.reduce((s, p) => s + p.x, 0);
  const sumY = data.reduce((s, p) => s + p.y, 0);
  const sumXY = data.reduce((s, p) => s + p.x * p.y, 0);
  const sumX2 = data.reduce((s, p) => s + p.x * p.x, 0);
  const meanX = sumX / n, meanY = sumY / n;
  const beta = (sumXY - n * meanX * meanY) / (sumX2 - n * meanX * meanX);
  const alpha = meanY - beta * meanX;
  return {alpha, beta};
}

function pinballLoss(data: Point[], model: Model, tau: number): number {
  return data.reduce((s, p) => {
    const yhat = model.alpha + model.beta * p.x;
    const r = p.y - yhat;
    return s + Math.max(tau * r, (tau - 1) * r);
  }, 0) / data.length;
}

function mae(data: Point[], model: Model): number {
  return data.reduce((s, p) => s + Math.abs(p.y - (model.alpha + model.beta * p.x)), 0) / data.length;
}

// Fraction of actuals BELOW the prediction line (the "covered below" rate)
function coverageBelow(data: Point[], model: Model): number {
  return data.filter((p) => p.y <= model.alpha + model.beta * p.x).length / data.length;
}

export default function PinballLossDemo() {
  const [tauUser, setTauUser] = useState(0.9);
  const [skew, setSkew]       = useState(1.5);
  const [nPoints, setNPoints] = useState(60);

  const data   = useMemo(() => generateData(nPoints, skew), [nPoints, skew]);
  const m10    = useMemo(() => trainQuantile(data, 0.1), [data]);
  const m50    = useMemo(() => trainQuantile(data, 0.5), [data]);
  const m90    = useMemo(() => trainQuantile(data, 0.9), [data]);
  const mUser  = useMemo(() => trainQuantile(data, tauUser), [data, tauUser]);
  const mseModel = useMemo(() => trainMSE(data), [data]);

  // Display stats for the user's τ model
  const userPinball = pinballLoss(data, mUser, tauUser);
  const userMae     = mae(data, mUser);
  const userCov     = coverageBelow(data, mUser);

  // For the symmetric MSE baseline, what's the coverage and the under-shoot rate
  const mseCov = coverageBelow(data, mseModel);
  const undershootRate = 1 - mseCov;  // fraction of actuals ABOVE MSE prediction

  // SVG plot dimensions
  const W = 520, H = 300;
  const xMin = 0, xMax = 11;
  const yMin = 0;
  const yMax = Math.max(40, ...data.map((p) => p.y) ) + 2;
  const px = (x: number) => 30 + ((x - xMin) / (xMax - xMin)) * (W - 40);
  const py = (y: number) => H - 30 - ((y - yMin) / (yMax - yMin)) * (H - 50);

  function lineCoords(m: Model) {
    return {
      x1: px(0), y1: py(m.alpha),
      x2: px(xMax), y2: py(m.alpha + m.beta * xMax),
    };
  }

  // Residuals histogram for user's τ
  const residuals = data.map((p) => p.y - (mUser.alpha + mUser.beta * p.x));
  const resMin = Math.min(...residuals), resMax = Math.max(...residuals);
  const N_BINS = 14;
  const binW = (resMax - resMin) / N_BINS;
  const bins = new Array(N_BINS).fill(0);
  for (const r of residuals) {
    const idx = Math.min(N_BINS - 1, Math.floor((r - resMin) / binW));
    bins[idx] += 1;
  }
  const binMax = Math.max(...bins);

  return (
    <div className={styles.playground}>
      <p className={styles.tag}>Interactive · Quantile regression · Pinball loss</p>
      <p className={styles.heading}>Why ETA shouldn't be predicted with MSE</p>
      <p className={styles.subheading}>
        Synthetic ETA data: y ≈ 10 + 2x with right-skewed noise (most trips ~baseline, some delayed). MSE finds the conditional mean — which under-shoots half the trips. Quantile regression with pinball loss at τ = 0.9 finds a P90 line that <em>deliberately over-shoots</em>, exactly what you display as "up to N minutes" in the rider's UI.
      </p>

      <div className={styles.controls}>
        <div className={styles.controlRow}>
          <label className={styles.controlLabel}>Your τ</label>
          <input type="range" min={0.05} max={0.95} step={0.05}
            value={tauUser}
            onChange={(e) => setTauUser(parseFloat(e.target.value))}
            className={styles.slider}
          />
          <span className={styles.controlValue}>{tauUser.toFixed(2)}</span>
        </div>
        <div className={styles.controlRow}>
          <label className={styles.controlLabel}>Noise skew</label>
          <input type="range" min={0.5} max={3} step={0.1}
            value={skew}
            onChange={(e) => setSkew(parseFloat(e.target.value))}
            className={styles.slider}
          />
          <span className={styles.controlValue}>{skew.toFixed(1)}×</span>
        </div>
        <div className={styles.controlRow}>
          <label className={styles.controlLabel}>Dataset size</label>
          <input type="range" min={20} max={120} step={10}
            value={nPoints}
            onChange={(e) => setNPoints(parseInt(e.target.value, 10))}
            className={styles.slider}
          />
          <span className={styles.controlValue}>{nPoints}</span>
        </div>
      </div>

      {/* Main plot: scatter + 4 quantile lines + MSE line */}
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.chart} preserveAspectRatio="xMidYMid meet" style={{height: 300}}>
        {/* Axes */}
        <line x1={30} y1={py(0)} x2={W - 10} y2={py(0)} stroke="#cbd5e1" strokeWidth={1} />
        <line x1={30} y1={py(0)} x2={30} y2={20} stroke="#cbd5e1" strokeWidth={1} />
        <text x={W - 14} y={py(0) + 14} fontSize={10} fill="#64748b" textAnchor="end" fontFamily="Menlo, monospace">distance (km) →</text>
        <text x={6} y={18} fontSize={10} fill="#64748b" fontFamily="Menlo, monospace">ETA (min) ↑</text>

        {/* Data points */}
        {data.map((p, i) => (
          <circle key={i} cx={px(p.x)} cy={py(p.y)} r={2.5} fill="#64748b" opacity={0.6} />
        ))}

        {/* P10 line (blue) */}
        {(() => { const c = lineCoords(m10); return <line x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2} stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="3 3" />; })()}
        {/* P50 line (black) */}
        {(() => { const c = lineCoords(m50); return <line x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2} stroke="#0f172a" strokeWidth={1.5} />; })()}
        {/* P90 line (red) */}
        {(() => { const c = lineCoords(m90); return <line x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2} stroke="#dc2626" strokeWidth={1.5} strokeDasharray="3 3" />; })()}
        {/* MSE line (gray) */}
        {(() => { const c = lineCoords(mseModel); return <line x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2} stroke="#94a3b8" strokeWidth={1} strokeDasharray="2 4" />; })()}
        {/* User τ line (coral, prominent) */}
        {(() => { const c = lineCoords(mUser); return <line x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2} stroke="#fb6f5d" strokeWidth={3} />; })()}

        {/* Legend */}
        <g transform={`translate(${W - 130}, 30)`}>
          <rect x={-6} y={-12} width={130} height={92} fill="#ffffff" stroke="#e2e8f0" />
          <g transform="translate(0, 0)"><line x1={0} y1={0} x2={20} y2={0} stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="3 3" /><text x={26} y={3} fontSize={10} fontFamily="Menlo, monospace" fill="#334155">P10 (τ=0.1)</text></g>
          <g transform="translate(0, 14)"><line x1={0} y1={0} x2={20} y2={0} stroke="#0f172a" strokeWidth={1.5} /><text x={26} y={3} fontSize={10} fontFamily="Menlo, monospace" fill="#334155">P50 (τ=0.5)</text></g>
          <g transform="translate(0, 28)"><line x1={0} y1={0} x2={20} y2={0} stroke="#dc2626" strokeWidth={1.5} strokeDasharray="3 3" /><text x={26} y={3} fontSize={10} fontFamily="Menlo, monospace" fill="#334155">P90 (τ=0.9)</text></g>
          <g transform="translate(0, 42)"><line x1={0} y1={0} x2={20} y2={0} stroke="#94a3b8" strokeWidth={1} strokeDasharray="2 4" /><text x={26} y={3} fontSize={10} fontFamily="Menlo, monospace" fill="#334155">MSE (mean)</text></g>
          <g transform="translate(0, 60)"><line x1={0} y1={0} x2={20} y2={0} stroke="#fb6f5d" strokeWidth={3} /><text x={26} y={3} fontSize={10} fontFamily="Menlo, monospace" fill="#334155" fontWeight={700}>your τ</text></g>
        </g>
      </svg>

      {/* KPI cards */}
      <div className={styles.outputs} style={{marginTop: '0.85rem'}}>
        <div className={styles.outputItem}>
          <p className={styles.outputLabel}>Pinball loss at τ</p>
          <p className={styles.outputValue}>{userPinball.toFixed(2)}</p>
          <p className={styles.outputSubtext}>min, lower is better</p>
        </div>
        <div className={`${styles.outputItem} ${Math.abs(userCov - tauUser) < 0.1 ? styles.outputItemOk : ''}`}>
          <p className={styles.outputLabel}>Coverage below</p>
          <p className={styles.outputValue}>{(userCov * 100).toFixed(0)}%</p>
          <p className={styles.outputSubtext}>Should be ≈ {(tauUser * 100).toFixed(0)}% (τ × 100)</p>
        </div>
        <div className={styles.outputItem}>
          <p className={styles.outputLabel}>MAE at this line</p>
          <p className={styles.outputValue}>{userMae.toFixed(2)}</p>
          <p className={styles.outputSubtext}>min, mean abs error</p>
        </div>
        <div className={`${styles.outputItem} ${undershootRate > 0.5 ? styles.outputItemAlert : ''}`}>
          <p className={styles.outputLabel}>MSE undershoot rate</p>
          <p className={styles.outputValue}>{(undershootRate * 100).toFixed(0)}%</p>
          <p className={styles.outputSubtext}>Trips arriving later than MSE prediction</p>
        </div>
      </div>

      {/* Residuals histogram */}
      <p className={styles.outputLabel} style={{marginTop: '1rem', marginBottom: '0.4rem'}}>
        Residuals (y − ŷ) at τ = {tauUser.toFixed(2)} — left of zero = over-prediction, right of zero = under-prediction
      </p>
      <svg viewBox="0 0 480 80" className={styles.chart} preserveAspectRatio="none" style={{height: 80}}>
        {/* Zero line */}
        {(() => {
          const zeroX = 8 + ((0 - resMin) / (resMax - resMin)) * 464;
          return <line x1={zeroX} y1={5} x2={zeroX} y2={75} stroke="#0f172a" strokeWidth={1} strokeDasharray="3 2" />;
        })()}
        {bins.map((c, i) => {
          const binStart = resMin + i * binW;
          const isPositive = binStart + binW / 2 > 0;
          const x = 8 + (i / N_BINS) * 464;
          const w = 464 / N_BINS - 1;
          const h = (c / Math.max(binMax, 1)) * 60;
          return (
            <rect
              key={i}
              x={x}
              y={75 - h}
              width={w}
              height={h}
              fill={isPositive ? '#dc2626' : '#10b981'}
              opacity={0.55}
            />
          );
        })}
        <text x={4} y={75} fontSize={9} fill="#64748b" fontFamily="Menlo, monospace">over-pred</text>
        <text x={476} y={75} fontSize={9} fill="#64748b" textAnchor="end" fontFamily="Menlo, monospace">under-pred</text>
      </svg>

      {/* Adaptive commentary */}
      <p className={styles.commentary}>
        {tauUser < 0.25
          ? `At τ = ${tauUser.toFixed(2)}, the line under-shoots — most actuals land above it. Useful for "lower bound" estimates (e.g., minimum delivery time), useless for ETAs the rider sees.`
          : tauUser <= 0.6
            ? `At τ ≈ 0.5 you have the median (MAE-optimal). Half of trips arrive before the displayed time, half after. For ETA, that means 50% of riders feel "later than promised" — the canonical L4 ceiling.`
            : tauUser >= 0.85
              ? `At τ = ${tauUser.toFixed(2)} the line over-shoots — only ~${((1 - tauUser) * 100).toFixed(0)}% of trips run longer than displayed. This is the "up to N minutes" buffer the rider sees. Pinball loss penalises under-prediction ${(tauUser / (1 - tauUser)).toFixed(1)}× more than over-prediction at this τ.`
              : `At τ = ${tauUser.toFixed(2)} you're between median and P90. Notice the residual histogram — green (over-pred) cluster left of zero is gradually getting bigger as τ grows, exactly because pinball loss is asymmetric.`}
        <br /><br />
        <strong>The MSE line</strong> (gray dashed) finds the conditional <em>mean</em>, which is pulled UP by the long-tail delays — yet it still leaves <strong>{(undershootRate * 100).toFixed(0)}%</strong> of trips arriving later than predicted. For ride-hailing this is the wrong objective: the rider sees the displayed ETA, then arrives <em>later</em> than promised one trip in every <em>{Math.round(1 / Math.max(undershootRate, 0.01))}</em>. P90 makes that fraction ~10%.
      </p>
    </div>
  );
}
