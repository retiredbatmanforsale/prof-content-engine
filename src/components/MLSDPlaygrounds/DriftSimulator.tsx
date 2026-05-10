import React, {useState, useEffect, useMemo, useRef} from 'react';
import styles from './styles.module.css';

const DAYS = 60;

// 10 bins; the training distribution is uniform-ish, the serving distribution drifts
const N_BINS = 10;

function generateBaseline(): number[] {
  // Hand-crafted "training" distribution that resembles a real categorical feature
  return [0.05, 0.10, 0.18, 0.22, 0.18, 0.12, 0.08, 0.04, 0.02, 0.01];
}

// Drift the distribution: gradual shift + a sudden jump on day 25
function driftedAtDay(day: number, driftRate: number, baseline: number[]): number[] {
  const drift = (day / DAYS) * driftRate;          // slow drift
  const shockMag = day >= 25 ? driftRate * 0.6 : 0; // sudden shift
  const shifted = baseline.map((p, i) => {
    // shift mass from low-index bins to high-index bins
    const shiftFactor = (i - N_BINS / 2) / N_BINS;
    return Math.max(0.001, p + shiftFactor * (drift + shockMag));
  });
  // Renormalise
  const sum = shifted.reduce((a, b) => a + b, 0);
  return shifted.map((p) => p / sum);
}

function psi(p: number[], q: number[]): number {
  let total = 0;
  for (let i = 0; i < p.length; i++) {
    const pi = Math.max(p[i], 1e-6);
    const qi = Math.max(q[i], 1e-6);
    total += (qi - pi) * Math.log(qi / pi);
  }
  return total;
}

interface RetrainEvent {
  day: number;
  trigger: 'calendar' | 'psi';
}

export default function DriftSimulator() {
  const [driftRate, setDriftRate]    = useState(0.5);     // 0.1 slow ... 1.0 fast
  const [psiThreshold, setPsiThresh] = useState(0.25);
  const [calendarDays, setCalendarDays] = useState(7);    // weekly retrain
  const [triggerMode, setTriggerMode]   = useState<'calendar' | 'psi' | 'both'>('both');
  const [day, setDay]                = useState(0);
  const [playing, setPlaying]        = useState(false);

  const baseline = useMemo(() => generateBaseline(), []);

  // Simulate the full timeline given current params; recompute when params change.
  const timeline = useMemo(() => {
    const psiSeries: number[] = [];
    const events: RetrainEvent[] = [];
    let trainBaseline = [...baseline];
    let lastCalendarRetrain = 0;

    for (let d = 0; d <= DAYS; d++) {
      const today = driftedAtDay(d, driftRate, baseline);
      const dailyPsi = psi(trainBaseline, today);
      psiSeries.push(dailyPsi);

      let retrained = false;
      // PSI-driven retrain
      if ((triggerMode === 'psi' || triggerMode === 'both') && dailyPsi > psiThreshold) {
        events.push({day: d, trigger: 'psi'});
        trainBaseline = [...today];
        lastCalendarRetrain = d;
        retrained = true;
      }
      // Calendar retrain
      if (!retrained && (triggerMode === 'calendar' || triggerMode === 'both')) {
        if (d - lastCalendarRetrain >= calendarDays && d > 0) {
          events.push({day: d, trigger: 'calendar'});
          trainBaseline = [...today];
          lastCalendarRetrain = d;
        }
      }
    }
    return {psiSeries, events};
  }, [baseline, driftRate, psiThreshold, calendarDays, triggerMode]);

  // Auto-play
  const intervalRef = useRef<number | null>(null);
  useEffect(() => {
    if (playing) {
      intervalRef.current = window.setInterval(() => {
        setDay((prev) => {
          if (prev >= DAYS) { setPlaying(false); return DAYS; }
          return prev + 1;
        });
      }, 100);
    }
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [playing]);

  const todaysDist = driftedAtDay(day, driftRate, baseline);
  const todaysPsi = timeline.psiSeries[day];
  const totalRetrains = timeline.events.filter((e) => e.day <= day).length;
  const psiRetrains = timeline.events.filter((e) => e.trigger === 'psi' && e.day <= day).length;
  const calendarRetrains = timeline.events.filter((e) => e.trigger === 'calendar' && e.day <= day).length;

  const W = 480, H = 140;
  const maxPsi = Math.max(0.6, ...timeline.psiSeries);

  // Build PSI line path — only up to the current day for the "trail"
  const visiblePoints = timeline.psiSeries.slice(0, day + 1);
  const pathD = visiblePoints.map((p, i) =>
    `${i === 0 ? 'M' : 'L'} ${(i / DAYS * W).toFixed(1)} ${(H - (p / maxPsi) * (H - 20) - 10).toFixed(1)}`,
  ).join(' ');

  // Threshold line y-coordinate
  const thresholdY = H - (psiThreshold / maxPsi) * (H - 20) - 10;

  return (
    <div className={styles.playground}>
      <p className={styles.tag}>Interactive · Drift simulator</p>
      <p className={styles.heading}>Watch PSI rise. See the auto-trigger fire.</p>
      <p className={styles.subheading}>
        A synthetic categorical feature drifts gradually and gets a sudden shock on day 25. The system retrains either on a calendar (weekly) or when PSI crosses your threshold. Try toggling trigger mode to see how event-driven beats calendar.
      </p>

      <div className={styles.controls}>
        <div className={styles.controlRow}>
          <label className={styles.controlLabel}>Drift rate</label>
          <input
            type="range" min={0.1} max={1.5} step={0.05}
            value={driftRate}
            onChange={(e) => setDriftRate(parseFloat(e.target.value))}
            className={styles.slider}
          />
          <span className={styles.controlValue}>{driftRate.toFixed(2)}</span>
        </div>
        <div className={styles.controlRow}>
          <label className={styles.controlLabel}>PSI threshold</label>
          <input
            type="range" min={0.05} max={0.5} step={0.01}
            value={psiThreshold}
            onChange={(e) => setPsiThresh(parseFloat(e.target.value))}
            className={styles.slider}
          />
          <span className={styles.controlValue}>{psiThreshold.toFixed(2)}</span>
        </div>
        <div className={styles.controlRow}>
          <label className={styles.controlLabel}>Calendar retrain (days)</label>
          <input
            type="range" min={3} max={30} step={1}
            value={calendarDays}
            onChange={(e) => setCalendarDays(parseInt(e.target.value, 10))}
            className={styles.slider}
          />
          <span className={styles.controlValue}>{calendarDays}d</span>
        </div>
        <div className={styles.controlRow}>
          <label className={styles.controlLabel}>Trigger mode</label>
          <div className={styles.toggleGroup}>
            {(['calendar', 'psi', 'both'] as const).map((m) => (
              <button
                key={m}
                className={`${styles.toggleButton} ${triggerMode === m ? styles.toggleButtonActive : ''}`}
                onClick={() => setTriggerMode(m)}
              >{m}</button>
            ))}
          </div>
          <span className={styles.controlValue}>{triggerMode}</span>
        </div>
        <div className={styles.controlRow}>
          <label className={styles.controlLabel}>Day {day} / {DAYS}</label>
          <input
            type="range" min={0} max={DAYS} step={1}
            value={day}
            onChange={(e) => { setPlaying(false); setDay(parseInt(e.target.value, 10)); }}
            className={styles.slider}
          />
          <button
            onClick={() => { if (day === DAYS) setDay(0); setPlaying((p) => !p); }}
            className={styles.toggleButton}
            style={{borderRadius: 6, border: '1px solid #cbd5e1', minWidth: 70}}
          >
            {playing ? '❚❚ Pause' : '▶ Play'}
          </button>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className={styles.chart} preserveAspectRatio="none">
        {/* PSI threshold band */}
        <line x1={0} y1={thresholdY} x2={W} y2={thresholdY} stroke="#dc2626" strokeWidth={1} strokeDasharray="4 3" />
        <text x={4} y={thresholdY - 3} fontSize={9} fill="#dc2626" fontFamily="Menlo, monospace">PSI threshold {psiThreshold.toFixed(2)}</text>

        {/* PSI line */}
        <path d={pathD} stroke="#0f172a" strokeWidth={1.5} fill="none" />

        {/* Retrain event markers (only those <= current day) */}
        {timeline.events.filter((e) => e.day <= day).map((e) => (
          <line
            key={`${e.day}-${e.trigger}`}
            x1={(e.day / DAYS) * W} y1={5}
            x2={(e.day / DAYS) * W} y2={H - 5}
            stroke={e.trigger === 'psi' ? '#10b981' : '#3b82f6'}
            strokeWidth={1}
            opacity={0.8}
          />
        ))}

        {/* Today marker */}
        {visiblePoints.length > 0 && (
          <circle
            cx={(day / DAYS) * W}
            cy={H - (todaysPsi / maxPsi) * (H - 20) - 10}
            r={4}
            fill="#ff7f50"
            stroke="#ffffff"
            strokeWidth={1.5}
          />
        )}

        {/* X-axis label */}
        <text x={W - 4} y={H - 4} fontSize={9} fill="#64748b" textAnchor="end" fontFamily="Menlo, monospace">days →</text>
        <text x={4} y={H - 4} fontSize={9} fill="#64748b" fontFamily="Menlo, monospace">PSI ↑</text>
      </svg>

      {/* Today's distribution mini-bar */}
      <svg viewBox={`0 0 ${W} 60`} className={styles.chart} preserveAspectRatio="none" style={{marginTop: '0.4rem'}}>
        <text x={4} y={12} fontSize={9} fill="#64748b" fontFamily="Menlo, monospace">today's distribution vs training baseline (each bin)</text>
        {baseline.map((p, i) => {
          const cx = (i + 0.5) * (W / N_BINS);
          const baselineH = p * 200;
          const todayH = todaysDist[i] * 200;
          return (
            <g key={i}>
              <rect x={cx - 16} y={55 - baselineH} width={14} height={baselineH} fill="#cbd5e1" />
              <rect x={cx + 2} y={55 - todayH} width={14} height={todayH} fill="#ff7f50" />
            </g>
          );
        })}
      </svg>

      <div className={styles.outputs} style={{marginTop: '0.85rem'}}>
        <div className={`${styles.outputItem} ${todaysPsi > psiThreshold ? styles.outputItemAlert : styles.outputItemOk}`}>
          <p className={styles.outputLabel}>Today's PSI</p>
          <p className={styles.outputValue}>{todaysPsi.toFixed(3)}</p>
          <p className={styles.outputSubtext}>{todaysPsi > psiThreshold ? 'Above threshold — retrain' : todaysPsi > 0.10 ? 'Moderate — investigate' : 'Stable'}</p>
        </div>
        <div className={styles.outputItem}>
          <p className={styles.outputLabel}>Retrains so far</p>
          <p className={styles.outputValue}>{totalRetrains}</p>
          <p className={styles.outputSubtext}>{psiRetrains} event-driven · {calendarRetrains} calendar</p>
        </div>
        <div className={styles.outputItem}>
          <p className={styles.outputLabel}>Days since last retrain</p>
          <p className={styles.outputValue}>{(() => {
            const last = [...timeline.events].filter((e) => e.day <= day).pop();
            return last ? day - last.day : day;
          })()}</p>
          <p className={styles.outputSubtext}>Retrain happens when this metric resets</p>
        </div>
      </div>

      <p className={styles.commentary}>
        {triggerMode === 'calendar'
          ? `Calendar-only retraining catches drift on a fixed schedule. Notice the PSI can spike well above your threshold between retrains — that's stale serving. Try switching to "psi" or "both" to see the difference.`
          : triggerMode === 'psi'
            ? `Event-driven retraining fires the moment PSI crosses ${psiThreshold.toFixed(2)}. This is what production fraud teams use — drift is goal-directed and demands fast response, not weekly cadence.`
            : `Both triggers active. Calendar provides a floor (regular refresh); PSI provides a ceiling (catches sudden drift). The day-25 shock should be caught by PSI well before the next calendar slot.`}
      </p>
    </div>
  );
}
