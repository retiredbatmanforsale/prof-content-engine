import React, {useState} from 'react';
import styles from './styles.module.css';

interface UseCase {
  label: string;
  business: string;
  product: string[];
  ml: string[];
  guardrails: string[];
}

const USE_CASES: Record<string, UseCase> = {
  feed: {
    label: 'Feed / recsys (YouTube, TikTok, Reels)',
    business: 'Long-term retention; daily active sessions',
    product: ['Watch time per user per day', 'Day-7 retention', 'Session length'],
    ml: ['Calibrated multi-task: watch-time regression (primary)', 'CTR (calibration head)', 'Completion rate (calibration head)'],
    guardrails: ['Diversity within slate', 'Creator fairness (Gini)', 'Latency p99'],
  },
  search: {
    label: 'Search / RAG (Perplexity, Glean, Bing)',
    business: 'Trustworthy answers; user satisfaction',
    product: ['Answer-acceptance rate (thumbs up/down)', 'Citation-click rate', 'Time-to-resolution'],
    ml: ['Faithfulness (per-claim entailment) — PRIMARY', 'Answer quality (LLM-as-judge calibrated)', 'Citation accuracy'],
    guardrails: ['Latency (TTFT < 500ms)', 'Cost per request', 'Refusal rate (false-refusal cap)'],
  },
  ads: {
    label: 'Ads ranking (Google, Meta)',
    business: 'Revenue per query subject to advertiser ROI',
    product: ['RPM (revenue per mille)', 'CTR', 'Post-click conversion rate'],
    ml: ['Calibrated pCTR (primary — auction depends on it)', 'Calibrated pConversion (secondary)', 'Score = pCTR × bid × quality'],
    guardrails: ['Ad-quality score', 'Landing-page experience', 'User-perceived ad load'],
  },
  fraud: {
    label: 'Fraud / risk (Stripe, banks)',
    business: 'Net fraud loss subject to legitimate-throughput',
    product: ['Fraud loss rate (bps of GMV)', 'False-positive rate per segment', 'Manual-review queue volume'],
    ml: ['Calibrated P(fraud) per transaction', 'Threshold = arg min expected cost'],
    guardrails: ['Customer complaint rate', 'Re-auth rate', 'Latency p99 (in payment flow)'],
  },
  eta: {
    label: 'ETA / logistics (Uber, Lyft, DoorDash)',
    business: 'Rider satisfaction; driver utilisation',
    product: ['Mean absolute error of displayed-vs-actual ETA', 'Cancellation rate post-booking', 'Complaint rate'],
    ml: ['P50 quantile (displayed ETA — primary)', 'P90 quantile (buffer for "up to N minutes")', 'Pinball loss (asymmetric)'],
    guardrails: ['Spatial coverage (per-city MAE)', 'Online-learning lag for road incidents'],
  },
};

export default function MetricTreeBuilder() {
  const [selected, setSelected] = useState('feed');
  const useCase = USE_CASES[selected];

  return (
    <div className={styles.playground}>
      <p className={styles.tag}>Interactive · Metric tree</p>
      <p className={styles.heading}>Pick a use case — see how the metric tree reweights</p>
      <p className={styles.subheading}>
        The framework is the same; the metric stack flips. Faithfulness moves to primary in RAG; calibration of pCTR is non-negotiable in ads; quantile outputs replace point estimates in ETA.
      </p>

      <div className={styles.controls}>
        <div className={styles.controlRow}>
          <label className={styles.controlLabel}>Use case</label>
          <select
            className={styles.select}
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            style={{gridColumn: 'span 2'}}
          >
            {Object.entries(USE_CASES).map(([key, uc]) => (
              <option key={key} value={key}>{uc.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.outputs}>
        <div className={styles.outputItem}>
          <p className={styles.outputLabel}>Business goal</p>
          <p className={styles.outputValue} style={{fontSize: '1.1rem', fontFamily: 'Plus Jakarta Sans, sans-serif'}}>{useCase.business}</p>
        </div>
      </div>

      <div style={{display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem', marginTop: '0.85rem'}}>
        <div style={{padding: '0.85rem 1rem', background: 'rgba(59, 130, 246, 0.06)', borderRadius: 8, borderLeft: '3px solid #3b82f6'}}>
          <p style={{fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1d4ed8', margin: '0 0 0.4rem 0'}}>Product metrics</p>
          <ul style={{margin: 0, paddingLeft: '1.1rem', fontSize: '0.92rem', color: '#1e293b'}}>
            {useCase.product.map((m) => <li key={m}>{m}</li>)}
          </ul>
        </div>
        <div style={{padding: '0.85rem 1rem', background: 'rgba(255, 127, 80, 0.06)', borderRadius: 8, borderLeft: '3px solid #ff7f50'}}>
          <p style={{fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#c2410c', margin: '0 0 0.4rem 0'}}>ML objectives</p>
          <ul style={{margin: 0, paddingLeft: '1.1rem', fontSize: '0.92rem', color: '#1e293b'}}>
            {useCase.ml.map((m) => <li key={m}>{m}</li>)}
          </ul>
        </div>
        <div style={{padding: '0.85rem 1rem', background: 'rgba(100, 116, 139, 0.06)', borderRadius: 8, borderLeft: '3px solid #64748b'}}>
          <p style={{fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#475569', margin: '0 0 0.4rem 0'}}>Guardrails</p>
          <ul style={{margin: 0, paddingLeft: '1.1rem', fontSize: '0.92rem', color: '#1e293b'}}>
            {useCase.guardrails.map((m) => <li key={m}>{m}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}
