import React, { useState, useMemo } from 'react';
import styles from './styles.module.css';

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

function randn(rng: () => number) {
  const u = 1 - rng();
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function dot(a: number[], b: number[]) {
  let s = 0;
  for (let k = 0; k < a.length; k++) s += a[k] * b[k];
  return s;
}

interface DataSet {
  N_users: number;
  N_items: number;
  d: number;
  U_true: number[][];
  V_true: number[][];
  impressions: number[][];
  clicked: Array<Set<number>>;
  catalogueClicks: Array<Set<number>>;
}

function makeData(N_users: number, N_items: number, d: number, K_imp: number, seed: number): DataSet {
  const rng = mulberry32(seed);
  const U_true = Array.from({ length: N_users }, () =>
    Array.from({ length: d }, () => randn(rng) * 0.6)
  );
  const V_true = Array.from({ length: N_items }, () =>
    Array.from({ length: d }, () => randn(rng) * 0.6)
  );

  const impressions: number[][] = [];
  const clicked: Array<Set<number>> = [];
  const catalogueClicks: Array<Set<number>> = [];

  for (let u = 0; u < N_users; u++) {
    const scores = new Array(N_items);
    for (let i = 0; i < N_items; i++) {
      scores[i] = dot(U_true[u], V_true[i]) + randn(rng) * 0.25;
    }
    const idx = Array.from({ length: N_items }, (_, i) => i);
    idx.sort((a, b) => scores[b] - scores[a]);
    const imp = idx.slice(0, K_imp);
    impressions.push(imp);

    const userClicks = new Set<number>();
    for (const i of imp) {
      const trueP = sigmoid(dot(U_true[u], V_true[i]) - 0.6);
      if (rng() < trueP) userClicks.add(i);
    }
    clicked.push(userClicks);

    const catSet = new Set<number>();
    for (const i of userClicks) catSet.add(i);
    catalogueClicks.push(catSet);
  }
  return { N_users, N_items, d, U_true, V_true, impressions, clicked, catalogueClicks };
}

interface TrainPair {
  u: number;
  i: number;
  y: number;
}

function buildTrainSet(
  strategy: 'random' | 'impressed' | 'hard',
  data: DataSet,
  negPerPos: number,
  hardness: number,
  seed: number
): TrainPair[] {
  const rng = mulberry32(seed + 4242);
  const out: TrainPair[] = [];
  for (let u = 0; u < data.N_users; u++) {
    const positives = Array.from(data.clicked[u]);
    if (positives.length === 0) continue;
    const userImpSet = new Set(data.impressions[u]);
    const impressedNotClicked = data.impressions[u].filter((i) => !data.clicked[u].has(i));

    for (const i of positives) {
      out.push({ u, i, y: 1 });

      const negs: number[] = [];
      if (strategy === 'random') {
        let tries = 0;
        while (negs.length < negPerPos && tries < negPerPos * 6) {
          const j = Math.floor(rng() * data.N_items);
          if (!data.clicked[u].has(j)) negs.push(j);
          tries++;
        }
      } else if (strategy === 'impressed') {
        if (impressedNotClicked.length === 0) continue;
        for (let k = 0; k < negPerPos; k++) {
          negs.push(impressedNotClicked[Math.floor(rng() * impressedNotClicked.length)]);
        }
      } else {
        if (impressedNotClicked.length === 0) continue;
        const sims = impressedNotClicked.map((j) => {
          let s = 0;
          for (const c of positives) s += dot(data.V_true[j], data.V_true[c]);
          return s / positives.length;
        });
        const minS = Math.min(...sims);
        const shifted = sims.map((s) => Math.exp(hardness * (s - minS)));
        const sum = shifted.reduce((a, b) => a + b, 0);
        const probs = shifted.map((s) => s / sum);
        for (let k = 0; k < negPerPos; k++) {
          let r = rng();
          let acc = 0;
          let chosen = impressedNotClicked[impressedNotClicked.length - 1];
          for (let m = 0; m < probs.length; m++) {
            acc += probs[m];
            if (r < acc) {
              chosen = impressedNotClicked[m];
              break;
            }
          }
          negs.push(chosen);
        }
      }
      for (const j of negs) out.push({ u, i: j, y: 0 });
    }
  }
  return out;
}

interface Model {
  U: number[][];
  V: number[][];
  d: number;
}

function trainModel(
  trainSet: TrainPair[],
  N_users: number,
  N_items: number,
  d: number,
  epochs: number,
  lr: number,
  seed: number
): Model {
  const rng = mulberry32(seed + 8888);
  const U = Array.from({ length: N_users }, () =>
    Array.from({ length: d }, () => randn(rng) * 0.1)
  );
  const V = Array.from({ length: N_items }, () =>
    Array.from({ length: d }, () => randn(rng) * 0.1)
  );
  const reg = 0.01;

  const order = trainSet.map((_, k) => k);
  for (let ep = 0; ep < epochs; ep++) {
    for (let k = order.length - 1; k > 0; k--) {
      const j = Math.floor(rng() * (k + 1));
      const tmp = order[k];
      order[k] = order[j];
      order[j] = tmp;
    }
    for (const idx of order) {
      const { u, i, y } = trainSet[idx];
      const score = dot(U[u], V[i]);
      const dscore = sigmoid(score) - y;
      for (let k = 0; k < d; k++) {
        const gu = dscore * V[i][k] + reg * U[u][k];
        const gv = dscore * U[u][k] + reg * V[i][k];
        U[u][k] -= lr * gu;
        V[i][k] -= lr * gv;
      }
    }
  }
  return { U, V, d };
}

function inImpressionAUC(model: Model, data: DataSet): number {
  let sumAUC = 0;
  let nUsers = 0;
  for (let u = 0; u < data.N_users; u++) {
    const pos: number[] = [];
    const neg: number[] = [];
    for (const i of data.impressions[u]) {
      const s = dot(model.U[u], model.V[i]);
      if (data.clicked[u].has(i)) pos.push(s);
      else neg.push(s);
    }
    if (pos.length === 0 || neg.length === 0) continue;
    let count = 0;
    let total = 0;
    for (const p of pos)
      for (const n of neg) {
        total++;
        if (p > n) count++;
        else if (p === n) count += 0.5;
      }
    sumAUC += count / total;
    nUsers++;
  }
  return nUsers > 0 ? sumAUC / nUsers : 0.5;
}

function catalogueAUC(model: Model, data: DataSet, samplesPerUser: number, seed: number): number {
  const rng = mulberry32(seed + 1111);
  let sumAUC = 0;
  let nUsers = 0;
  for (let u = 0; u < data.N_users; u++) {
    const positives = Array.from(data.clicked[u]);
    if (positives.length === 0) continue;
    const negSamples: number[] = [];
    let tries = 0;
    while (negSamples.length < samplesPerUser && tries < samplesPerUser * 6) {
      const j = Math.floor(rng() * data.N_items);
      if (!data.clicked[u].has(j)) negSamples.push(j);
      tries++;
    }
    const pos = positives.map((i) => dot(model.U[u], model.V[i]));
    const neg = negSamples.map((i) => dot(model.U[u], model.V[i]));
    if (pos.length === 0 || neg.length === 0) continue;
    let count = 0;
    let total = 0;
    for (const p of pos)
      for (const n of neg) {
        total++;
        if (p > n) count++;
        else if (p === n) count += 0.5;
      }
    sumAUC += count / total;
    nUsers++;
  }
  return nUsers > 0 ? sumAUC / nUsers : 0.5;
}

interface StrategyResult {
  name: string;
  catAUC: number;
  prodAUC: number;
  trainSize: number;
}

export default function NegativeSampler() {
  const [hardness, setHardness] = useState(2.5);
  const [negRatio, setNegRatio] = useState(4);
  const [seed, setSeed] = useState(7);

  const result = useMemo(() => {
    const N_users = 80;
    const N_items = 100;
    const d = 6;
    const K_imp = 18;
    const epochs = 60;
    const lr = 0.05;

    const data = makeData(N_users, N_items, d, K_imp, seed);

    const strategies: Array<'random' | 'impressed' | 'hard'> = ['random', 'impressed', 'hard'];
    const results: StrategyResult[] = strategies.map((strategy) => {
      const trainSet = buildTrainSet(strategy, data, negRatio, hardness, seed);
      const model = trainModel(trainSet, N_users, N_items, d, epochs, lr, seed);
      const prodAUC = inImpressionAUC(model, data);
      const catAUC = catalogueAUC(model, data, 30, seed);
      return {
        name: strategy.charAt(0).toUpperCase() + strategy.slice(1),
        catAUC,
        prodAUC,
        trainSize: trainSet.length,
      };
    });

    let totalImpressions = 0;
    let totalClicks = 0;
    for (let u = 0; u < N_users; u++) {
      totalImpressions += data.impressions[u].length;
      totalClicks += data.clicked[u].size;
    }
    const ctr = totalClicks / totalImpressions;
    return { results, ctr, N_users, N_items };
  }, [hardness, negRatio, seed]);

  const W = 720;
  const Hgt = 300;
  const padL = 60;
  const padR = 24;
  const padT = 36;
  const padB = 64;
  const innerW = W - padL - padR;
  const innerH = Hgt - padT - padB;
  const yMin = 0.5;
  const yMax = 1.0;
  const yToPx = (v: number) => padT + (1 - (v - yMin) / (yMax - yMin)) * innerH;

  const groupCount = result.results.length;
  const groupW = innerW / groupCount;
  const barW = (groupW - 24) / 2;

  const renderBars = () => {
    const elements: React.ReactNode[] = [];
    [0.5, 0.6, 0.7, 0.8, 0.9, 1.0].forEach((tv) => {
      elements.push(
        <line
          key={`grid-${tv}`}
          x1={padL}
          y1={yToPx(tv)}
          x2={padL + innerW}
          y2={yToPx(tv)}
          stroke="#e2e8f0"
          strokeWidth={1}
        />
      );
      elements.push(
        <text
          key={`gridtxt-${tv}`}
          x={padL - 8}
          y={yToPx(tv) + 3}
          textAnchor="end"
          fontSize={10}
          fill="#64748b"
        >
          {tv.toFixed(1)}
        </text>
      );
    });

    result.results.forEach((r, gi) => {
      const groupX = padL + gi * groupW + 12;

      const catH = (yToPx(yMin) - yToPx(r.catAUC));
      elements.push(
        <rect
          key={`cat-${gi}`}
          x={groupX}
          y={yToPx(r.catAUC)}
          width={barW}
          height={catH}
          fill="#94a3b8"
          rx={3}
        />
      );
      elements.push(
        <text
          key={`catv-${gi}`}
          x={groupX + barW / 2}
          y={yToPx(r.catAUC) - 4}
          textAnchor="middle"
          fontSize={11}
          fontWeight={600}
          fill="#475569"
        >
          {r.catAUC.toFixed(3)}
        </text>
      );

      const prodH = (yToPx(yMin) - yToPx(r.prodAUC));
      elements.push(
        <rect
          key={`prod-${gi}`}
          x={groupX + barW + 4}
          y={yToPx(r.prodAUC)}
          width={barW}
          height={prodH}
          fill="#FF7F50"
          rx={3}
        />
      );
      elements.push(
        <text
          key={`prodv-${gi}`}
          x={groupX + barW + 4 + barW / 2}
          y={yToPx(r.prodAUC) - 4}
          textAnchor="middle"
          fontSize={11}
          fontWeight={600}
          fill="#c2410c"
        >
          {r.prodAUC.toFixed(3)}
        </text>
      );

      elements.push(
        <text
          key={`label-${gi}`}
          x={groupX + barW + 2}
          y={Hgt - 38}
          textAnchor="middle"
          fontSize={12}
          fontWeight={700}
          fill="#0f172a"
        >
          {r.name}
        </text>
      );
      elements.push(
        <text
          key={`sub-${gi}`}
          x={groupX + barW + 2}
          y={Hgt - 22}
          textAnchor="middle"
          fontSize={10}
          fill="#64748b"
        >
          {r.trainSize.toLocaleString()} train pairs
        </text>
      );
    });

    elements.push(
      <line
        key="xaxis"
        x1={padL}
        y1={yToPx(yMin)}
        x2={padL + innerW}
        y2={yToPx(yMin)}
        stroke="#94a3b8"
      />
    );
    elements.push(
      <text
        key="ylbl"
        transform={`rotate(-90, ${padL - 42}, ${padT + innerH / 2})`}
        x={padL - 42}
        y={padT + innerH / 2}
        textAnchor="middle"
        fontSize={11}
        fill="#475569"
      >
        AUC
      </text>
    );

    elements.push(
      <g key="legend" transform={`translate(${padL}, 12)`}>
        <rect x={0} y={0} width={12} height={12} fill="#94a3b8" rx={2} />
        <text x={18} y={10} fontSize={11} fill="#475569">
          Catalogue AUC (positives vs random items)
        </text>
        <rect x={300} y={0} width={12} height={12} fill="#FF7F50" rx={2} />
        <text x={318} y={10} fontSize={11} fill="#475569">
          Production AUC (within-impression ranking)
        </text>
      </g>
    );

    return elements;
  };

  const commentary = (() => {
    const random = result.results[0];
    const impressed = result.results[1];
    const hard = result.results[2];
    const gap = random.catAUC - random.prodAUC;
    if (gap > 0.07 && impressed.prodAUC > random.prodAUC + 0.02) {
      return (
        <>
          The <strong>random</strong> strategy looks great offline (catalogue AUC ={' '}
          {random.catAUC.toFixed(3)}) but its production AUC ={' '}
          <strong>{random.prodAUC.toFixed(3)}</strong> — a {gap.toFixed(3)} gap. The model learned
          a trivial decision boundary against random noise instead of the real production task.{' '}
          <strong>Impressed-not-clicked</strong> closes the gap; <strong>hard negatives</strong>{' '}
          push it further by sharpening the boundary.
        </>
      );
    }
    return (
      <>
        Catalogue AUC overstates ranker quality whenever the offline negative pool differs from
        the production candidate set. Production AUC is the metric that correlates with online
        lift. Drop <strong>negatives per positive</strong> or change the seed to see the gap
        widen.
      </>
    );
  })();

  return (
    <div className={styles.playground}>
      <p className={styles.tag}>Interactive · Negative sampling strategy comparison</p>
      <h4 className={styles.heading}>Random vs impressed vs hard negatives</h4>
      <p className={styles.subheading}>
        Synthetic click logs from {result.N_users} users × {result.N_items} items (CTR ≈{' '}
        {(result.ctr * 100).toFixed(0)}%). Three trained rankers, one per sampling strategy.
        Catalogue AUC (grey) is what naive offline eval reports. Production AUC (coral) is what
        the online A/B test actually measures.
      </p>

      <div className={styles.controls}>
        <div className={styles.controlRow}>
          <label className={styles.controlLabel}>Hard-negative aggressiveness</label>
          <input
            className={styles.slider}
            type="range"
            min={0}
            max={6}
            step={0.5}
            value={hardness}
            onChange={(e) => setHardness(parseFloat(e.target.value))}
          />
          <span className={styles.controlValue}>{hardness.toFixed(1)}</span>
        </div>
        <div className={styles.controlRow}>
          <label className={styles.controlLabel}>Negatives per positive</label>
          <input
            className={styles.slider}
            type="range"
            min={1}
            max={8}
            step={1}
            value={negRatio}
            onChange={(e) => setNegRatio(parseInt(e.target.value))}
          />
          <span className={styles.controlValue}>{negRatio}</span>
        </div>
        <div className={styles.controlRow}>
          <label className={styles.controlLabel}>Synthetic data seed</label>
          <input
            className={styles.slider}
            type="range"
            min={1}
            max={50}
            step={1}
            value={seed}
            onChange={(e) => setSeed(parseInt(e.target.value))}
          />
          <span className={styles.controlValue}>{seed}</span>
        </div>
      </div>

      <div className={styles.outputs}>
        {result.results.map((r) => {
          const gap = r.catAUC - r.prodAUC;
          const goodClass = r.prodAUC > 0.78 ? styles.outputItemOk : '';
          const badClass = gap > 0.08 ? styles.outputItemAlert : '';
          return (
            <div key={r.name} className={`${styles.outputItem} ${goodClass} ${badClass}`}>
              <p className={styles.outputLabel}>{r.name}</p>
              <p className={styles.outputValue}>{r.prodAUC.toFixed(3)}</p>
              <p className={styles.outputSubtext}>
                cat {r.catAUC.toFixed(3)} · gap {gap >= 0 ? '+' : ''}
                {gap.toFixed(3)}
              </p>
            </div>
          );
        })}
      </div>

      <svg
        className={styles.chart}
        viewBox={`0 0 ${W} ${Hgt}`}
        role="img"
        aria-label="Bar chart comparing catalogue and production AUC across negative sampling strategies"
      >
        {renderBars()}
      </svg>

      <p className={styles.commentary}>
        {commentary}
        <br />
        <span style={{ fontSize: '0.82rem', opacity: 0.85 }}>
          Each strategy trains a 6-dim user/item embedding model (60 epochs SGD, BCE loss).
          Production AUC averages within-impression ranking AUC across {result.N_users} users.
          Hard sampling weights impressed-not-clicked items by softmax(hardness × similarity to
          positives).
        </span>
      </p>
    </div>
  );
}
