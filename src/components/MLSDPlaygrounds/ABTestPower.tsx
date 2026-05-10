import React, {useState, useMemo} from 'react';
import styles from './styles.module.css';

// Sample size formula: n = 16 σ² / δ² for α=0.05 two-sided, β=0.2 (80% power)
// More precisely n = 2 * (z_α/2 + z_β)² σ² / δ²; with z_0.025 = 1.96 and z_0.2 = 0.84,
// the constant is 2 × (1.96 + 0.84)² = 2 × 7.84 ≈ 15.68 ≈ 16

function powerAtN(n: number, sigma: number, delta: number): number {
  // Approx power calculation using normal approx
  const seDiff = Math.sqrt(2 * sigma * sigma / n);
  const zCrit = 1.96;
  const zPower = (Math.abs(delta) / seDiff) - zCrit;
  // CDF approximation (Hastings 7.1.26)
  function phi(x: number) {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return x > 0 ? 1 - p : p;
  }
  return Math.max(0, Math.min(1, phi(zPower)));
}

function fmtN(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return `${Math.round(n)}`;
}

export default function ABTestPower() {
  const [sigma, setSigma]   = useState(60);   // minutes (watch time σ)
  const [delta, setDelta]   = useState(0.6);  // 1% of 60 min mean
  const [logN, setLogN]     = useState(5.5);  // 10^5.5 ≈ 316K per arm
  const [cuped, setCuped]   = useState(false);
  const [rho, setRho]       = useState(0.7);  // pre-experiment correlation

  const effSigma = cuped ? sigma * Math.sqrt(1 - rho * rho) : sigma;
  const n = Math.round(Math.pow(10, logN));
  const power = powerAtN(n, effSigma, delta);

  const requiredN80 = Math.ceil((16 * effSigma * effSigma) / (delta * delta));
  const cupedSavings = cuped ? Math.round((1 - (effSigma * effSigma) / (sigma * sigma)) * 100) : 0;

  // Days to accumulate at 100K DAU per arm
  const dailyEnrolment = 100000;
  const daysNeeded = Math.ceil(requiredN80 / dailyEnrolment);

  return (
    <div className={styles.playground}>
      <p className={styles.tag}>Interactive · A/B test power</p>
      <p className={styles.heading}>Sample size, MDE, and CUPED variance reduction</p>
      <p className={styles.subheading}>
        Default values are watch time at σ = 60 min, MDE = 0.6 min (1% of mean). Toggle CUPED to see how pre-experiment data buys you statistical power for free.
      </p>

      <div className={styles.controls}>
        <div className={styles.controlRow}>
          <label className={styles.controlLabel}>σ (std dev)</label>
          <input type="range" min={5} max={120} step={1}
            value={sigma}
            onChange={(e) => setSigma(parseFloat(e.target.value))}
            className={styles.slider}
          />
          <span className={styles.controlValue}>{sigma.toFixed(0)} min</span>
        </div>
        <div className={styles.controlRow}>
          <label className={styles.controlLabel}>MDE (δ)</label>
          <input type="range" min={0.1} max={5} step={0.1}
            value={delta}
            onChange={(e) => setDelta(parseFloat(e.target.value))}
            className={styles.slider}
          />
          <span className={styles.controlValue}>{delta.toFixed(1)} min</span>
        </div>
        <div className={styles.controlRow}>
          <label className={styles.controlLabel}>n per arm</label>
          <input type="range" min={3} max={7} step={0.1}
            value={logN}
            onChange={(e) => setLogN(parseFloat(e.target.value))}
            className={styles.slider}
          />
          <span className={styles.controlValue}>{fmtN(n)}</span>
        </div>
        <div className={styles.controlRow}>
          <label className={styles.controlLabel}>CUPED variance reduction</label>
          <div className={styles.toggleGroup}>
            <button
              className={`${styles.toggleButton} ${!cuped ? styles.toggleButtonActive : ''}`}
              onClick={() => setCuped(false)}
            >Off</button>
            <button
              className={`${styles.toggleButton} ${cuped ? styles.toggleButtonActive : ''}`}
              onClick={() => setCuped(true)}
            >On</button>
          </div>
          <span className={styles.controlValue}>
            {cuped ? `ρ = ${rho.toFixed(2)}` : '—'}
          </span>
        </div>
        {cuped && (
          <div className={styles.controlRow}>
            <label className={styles.controlLabel}>Pre-exp correlation ρ</label>
            <input type="range" min={0} max={0.95} step={0.05}
              value={rho}
              onChange={(e) => setRho(parseFloat(e.target.value))}
              className={styles.slider}
            />
            <span className={styles.controlValue}>{rho.toFixed(2)}</span>
          </div>
        )}
      </div>

      <div className={styles.outputs}>
        <div className={`${styles.outputItem} ${power >= 0.8 ? styles.outputItemOk : styles.outputItemAlert}`}>
          <p className={styles.outputLabel}>Power</p>
          <p className={styles.outputValue}>{(power * 100).toFixed(0)}%</p>
          <p className={styles.outputSubtext}>{power >= 0.8 ? 'Adequate (≥80%)' : 'Underpowered'}</p>
        </div>
        <div className={styles.outputItem}>
          <p className={styles.outputLabel}>Required n / arm</p>
          <p className={styles.outputValue}>{fmtN(requiredN80)}</p>
          <p className={styles.outputSubtext}>For 80% power</p>
        </div>
        <div className={styles.outputItem}>
          <p className={styles.outputLabel}>Days to ship</p>
          <p className={styles.outputValue}>{daysNeeded}</p>
          <p className={styles.outputSubtext}>At 100K DAU / arm</p>
        </div>
        {cuped && (
          <div className={styles.outputItem}>
            <p className={styles.outputLabel}>CUPED savings</p>
            <p className={styles.outputValue}>{cupedSavings}%</p>
            <p className={styles.outputSubtext}>Variance reduction</p>
          </div>
        )}
      </div>

      <p className={styles.commentary}>
        {power >= 0.8
          ? `At n = ${fmtN(n)} per arm you have ${(power * 100).toFixed(0)}% power to detect a ${delta.toFixed(1)}-min lift. Add the 2-week novelty buffer when you ship — never decide on week 1.`
          : `n = ${fmtN(n)} is underpowered. You'd need ${fmtN(requiredN80)} per arm at 80% power. ${!cuped ? 'Try toggling CUPED on — pre-experiment covariates often cut σ by 30-50%.' : 'Either run longer or accept a larger MDE.'}`}
      </p>
    </div>
  );
}
