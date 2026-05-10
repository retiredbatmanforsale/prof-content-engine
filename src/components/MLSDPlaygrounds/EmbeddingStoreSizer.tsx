import React, {useState, useMemo} from 'react';
import styles from './styles.module.css';

const PRECISIONS = [
  {label: 'float32', bytes: 4},
  {label: 'float16', bytes: 2},
  {label: 'int8',    bytes: 1},
  {label: 'int4',    bytes: 0.5},
];

function fmtItems(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(n >= 10e9 ? 0 : 1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(0)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return `${n}`;
}

function fmtBytes(b: number): string {
  if (b >= 1e12) return `${(b / 1e12).toFixed(2)} TB`;
  if (b >= 1e9)  return `${(b / 1e9).toFixed(b >= 100e9 ? 0 : 1)} GB`;
  if (b >= 1e6)  return `${(b / 1e6).toFixed(0)} MB`;
  return `${b.toFixed(0)} B`;
}

export default function EmbeddingStoreSizer() {
  const [logItems, setLogItems] = useState(9);   // 10^9 = 1B default
  const [dim, setDim]           = useState(128);
  const [precIdx, setPrecIdx]   = useState(0);   // float32 default

  const items = Math.round(Math.pow(10, logItems));
  const bytesPerItem = PRECISIONS[precIdx].bytes;
  const totalBytes = items * dim * bytesPerItem;
  const shardsNeeded = Math.max(1, Math.ceil(totalBytes / (80e9))); // 80 GB / shard
  const fitsOneMachine = totalBytes <= 80e9;

  const recallHit = useMemo(() => {
    // Approx recall@100 hit from quantisation; rule-of-thumb deltas vs float32
    if (precIdx === 0) return 0;       // float32: no loss
    if (precIdx === 1) return -0.5;    // float16
    if (precIdx === 2) return -2;      // int8
    return -5;                          // int4
  }, [precIdx]);

  return (
    <div className={styles.playground}>
      <p className={styles.tag}>Interactive · Embedding store sizing</p>
      <p className={styles.heading}>How big is your ANN index, really?</p>
      <p className={styles.subheading}>
        Drag the sliders. Numbers update live. The 80 GB / shard threshold corresponds to a single H100's HBM budget.
      </p>

      <div className={styles.controls}>
        <div className={styles.controlRow}>
          <label className={styles.controlLabel}>Number of items</label>
          <input
            type="range" min={6} max={10} step={0.1}
            value={logItems}
            onChange={(e) => setLogItems(parseFloat(e.target.value))}
            className={styles.slider}
          />
          <span className={styles.controlValue}>{fmtItems(items)}</span>
        </div>
        <div className={styles.controlRow}>
          <label className={styles.controlLabel}>Embedding dimension</label>
          <input
            type="range" min={64} max={2048} step={64}
            value={dim}
            onChange={(e) => setDim(parseInt(e.target.value, 10))}
            className={styles.slider}
          />
          <span className={styles.controlValue}>{dim}</span>
        </div>
        <div className={styles.controlRow}>
          <label className={styles.controlLabel}>Precision</label>
          <div className={styles.toggleGroup}>
            {PRECISIONS.map((p, i) => (
              <button
                key={p.label}
                className={`${styles.toggleButton} ${i === precIdx ? styles.toggleButtonActive : ''}`}
                onClick={() => setPrecIdx(i)}
              >
                {p.label}
              </button>
            ))}
          </div>
          <span className={styles.controlValue}>{bytesPerItem} B / dim</span>
        </div>
      </div>

      <div className={styles.outputs}>
        <div className={`${styles.outputItem} ${fitsOneMachine ? styles.outputItemOk : styles.outputItemAlert}`}>
          <p className={styles.outputLabel}>Total store</p>
          <p className={styles.outputValue}>{fmtBytes(totalBytes)}</p>
          <p className={styles.outputSubtext}>{items.toLocaleString()} × {dim} × {bytesPerItem} B</p>
        </div>
        <div className={`${styles.outputItem} ${fitsOneMachine ? styles.outputItemOk : styles.outputItemAlert}`}>
          <p className={styles.outputLabel}>Shards needed</p>
          <p className={styles.outputValue}>{shardsNeeded}</p>
          <p className={styles.outputSubtext}>Assuming 80 GB / shard</p>
        </div>
        <div className={styles.outputItem}>
          <p className={styles.outputLabel}>Recall hit</p>
          <p className={styles.outputValue}>{recallHit === 0 ? 'baseline' : `${recallHit} pts`}</p>
          <p className={styles.outputSubtext}>vs float32 (rule of thumb)</p>
        </div>
      </div>

      <p className={styles.commentary}>
        {fitsOneMachine
          ? `Fits on a single beefy node. ${precIdx === 0 ? 'You can probably skip the sharding discussion in the interview.' : 'Quantisation already brought you under one machine — name the recall-cost tradeoff.'}`
          : `Sharded across ${shardsNeeded} nodes. In the interview: name the fan-out merge step ("query goes to all shards, top-K results are merged") — and consider quantising to int8 to bring this back to ${fmtBytes(items * dim * 1)}.`}
      </p>
    </div>
  );
}
