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
const relu = (z: number) => (z > 0 ? z : 0);
const reluD = (z: number) => (z > 0 ? 1 : 0);

function randn(rng: () => number) {
  const u = 1 - rng();
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

interface Example {
  x: number[];
  y: number;
}

function makeData(N: number, seed: number): Example[] {
  const rng = mulberry32(seed);
  const data: Example[] = [];
  for (let i = 0; i < N; i++) {
    const x1 = rng() * 2 - 1;
    const x2 = rng() * 2 - 1;
    const x3 = x1 * x2;
    const x4 = randn(rng) * 0.5;
    const trueLogit = 2.0 * x1 + 1.5 * x2 + 1.5 * x3 + 0.3 * x4 - 1.5;
    const trueP = sigmoid(trueLogit);
    const y = rng() < trueP ? 1 : 0;
    data.push({ x: [x1, x2, x3, x4], y });
  }
  return data;
}

function downsample(data: Example[], keepNegRatio: number, seed: number): Example[] {
  const rng = mulberry32(seed + 999);
  return data.filter((d) => d.y === 1 || rng() < keepNegRatio);
}

interface Model {
  ww: number[];
  bw: number;
  w1: number[][];
  b1: number[];
  w2: number[];
  b2: number;
}

function initModel(H: number, seed: number): Model {
  const rng = mulberry32(seed + 7777);
  const r = () => randn(rng) * 0.3;
  return {
    ww: [r(), r(), r(), r()],
    bw: 0,
    w1: Array.from({ length: H }, () => [r(), r(), r(), r()]),
    b1: Array.from({ length: H }, () => 0),
    w2: Array.from({ length: H }, () => r()),
    b2: 0,
  };
}

function forward(model: Model, x: number[]) {
  let wideLogit = model.bw;
  for (let i = 0; i < 4; i++) wideLogit += model.ww[i] * x[i];

  const H = model.w1.length;
  const z = new Array<number>(H);
  const h = new Array<number>(H);
  for (let j = 0; j < H; j++) {
    let s = model.b1[j];
    for (let i = 0; i < 4; i++) s += model.w1[j][i] * x[i];
    z[j] = s;
    h[j] = relu(s);
  }
  let deepLogit = model.b2;
  for (let j = 0; j < H; j++) deepLogit += model.w2[j] * h[j];

  const logit = wideLogit + deepLogit;
  return { p: sigmoid(logit), logit, h, z };
}

function trainModel(data: Example[], H: number, epochs: number, lr: number, seed: number): Model {
  const model = initModel(H, seed);
  const N = data.length;
  if (N === 0) return model;
  for (let ep = 0; ep < epochs; ep++) {
    const gww = [0, 0, 0, 0];
    let gbw = 0;
    const gw1 = Array.from({ length: H }, () => [0, 0, 0, 0]);
    const gb1 = new Array(H).fill(0);
    const gw2 = new Array(H).fill(0);
    let gb2 = 0;

    for (const ex of data) {
      const f = forward(model, ex.x);
      const dlogit = f.p - ex.y;

      for (let i = 0; i < 4; i++) gww[i] += dlogit * ex.x[i];
      gbw += dlogit;

      for (let j = 0; j < H; j++) gw2[j] += dlogit * f.h[j];
      gb2 += dlogit;

      for (let j = 0; j < H; j++) {
        const dh = dlogit * model.w2[j];
        const dz = dh * reluD(f.z[j]);
        for (let i = 0; i < 4; i++) gw1[j][i] += dz * ex.x[i];
        gb1[j] += dz;
      }
    }

    const scale = lr / N;
    for (let i = 0; i < 4; i++) model.ww[i] -= gww[i] * scale;
    model.bw -= gbw * scale;
    for (let j = 0; j < H; j++) {
      for (let i = 0; i < 4; i++) model.w1[j][i] -= gw1[j][i] * scale;
      model.b1[j] -= gb1[j] * scale;
      model.w2[j] -= gw2[j] * scale;
    }
    model.b2 -= gb2 * scale;
  }
  return model;
}

function fitPlatt(rawLogits: number[], labels: number[]) {
  let a = 1,
    b = 0;
  const N = rawLogits.length;
  if (N === 0) return { a, b };
  const lr = 0.5;
  for (let ep = 0; ep < 400; ep++) {
    let ga = 0,
      gb = 0;
    for (let i = 0; i < N; i++) {
      const z = a * rawLogits[i] + b;
      const p = sigmoid(z);
      const dz = p - labels[i];
      ga += dz * rawLogits[i];
      gb += dz;
    }
    a -= (lr * ga) / N;
    b -= (lr * gb) / N;
  }
  return { a, b };
}

function ece(probs: number[], labels: number[], nBins = 10): number {
  const sumP = new Array(nBins).fill(0);
  const sumY = new Array(nBins).fill(0);
  const n = new Array(nBins).fill(0);
  for (let i = 0; i < probs.length; i++) {
    let bi = Math.min(nBins - 1, Math.floor(probs[i] * nBins));
    if (bi < 0) bi = 0;
    sumP[bi] += probs[i];
    sumY[bi] += labels[i];
    n[bi]++;
  }
  let total = 0;
  for (let i = 0; i < nBins; i++) {
    if (n[i] === 0) continue;
    const conf = sumP[i] / n[i];
    const acc = sumY[i] / n[i];
    total += (n[i] / probs.length) * Math.abs(conf - acc);
  }
  return total;
}

function aucScore(scores: number[], labels: number[]): number {
  const pos: number[] = [],
    neg: number[] = [];
  for (let i = 0; i < scores.length; i++) (labels[i] === 1 ? pos : neg).push(scores[i]);
  if (pos.length === 0 || neg.length === 0) return 0.5;
  let count = 0;
  let total = 0;
  for (const p of pos)
    for (const n of neg) {
      total++;
      if (p > n) count++;
      else if (p === n) count += 0.5;
    }
  return count / total;
}

interface Bins {
  conf: number[];
  acc: number[];
  count: number[];
}
function bin(probs: number[], labels: number[], nBins = 10): Bins {
  const sumP = new Array(nBins).fill(0);
  const sumY = new Array(nBins).fill(0);
  const n = new Array(nBins).fill(0);
  for (let i = 0; i < probs.length; i++) {
    let bi = Math.min(nBins - 1, Math.floor(probs[i] * nBins));
    if (bi < 0) bi = 0;
    sumP[bi] += probs[i];
    sumY[bi] += labels[i];
    n[bi]++;
  }
  const conf: number[] = [],
    acc: number[] = [],
    count: number[] = [];
  for (let i = 0; i < nBins; i++) {
    if (n[i] === 0) {
      conf.push(NaN);
      acc.push(NaN);
      count.push(0);
    } else {
      conf.push(sumP[i] / n[i]);
      acc.push(sumY[i] / n[i]);
      count.push(n[i]);
    }
  }
  return { conf, acc, count };
}

export default function RankerMini() {
  const [keepNeg, setKeepNeg] = useState(0.15);
  const [hidden, setHidden] = useState(8);
  const [seed, setSeed] = useState(42);

  const result = useMemo(() => {
    const N = 1000;
    const all = makeData(N, seed);
    const trainPool = all.slice(0, 600);
    const calSet = all.slice(600, 800);
    const testSet = all.slice(800, 1000);

    const trainSet = downsample(trainPool, keepNeg, seed);
    const model = trainModel(trainSet, hidden, 300, 0.4, seed);

    const calLogits = calSet.map((ex) => forward(model, ex.x).logit);
    const calLabels = calSet.map((ex) => ex.y);
    const testLogits = testSet.map((ex) => forward(model, ex.x).logit);
    const testProbsRaw = testLogits.map(sigmoid);
    const testLabels = testSet.map((ex) => ex.y);

    const { a, b } = fitPlatt(calLogits, calLabels);
    const testProbsCal = testLogits.map((z) => sigmoid(a * z + b));

    const eceBefore = ece(testProbsRaw, testLabels);
    const eceAfter = ece(testProbsCal, testLabels);
    const aucBefore = aucScore(testProbsRaw, testLabels);
    const aucAfter = aucScore(testProbsCal, testLabels);

    const binsBefore = bin(testProbsRaw, testLabels);
    const binsAfter = bin(testProbsCal, testLabels);

    const naturalPosRate = trainPool.filter((d) => d.y === 1).length / trainPool.length;
    const trainPosRate =
      trainSet.length > 0 ? trainSet.filter((d) => d.y === 1).length / trainSet.length : 0;

    return {
      eceBefore,
      eceAfter,
      aucBefore,
      aucAfter,
      binsBefore,
      binsAfter,
      naturalPosRate,
      trainPosRate,
      trainSize: trainSet.length,
      a,
      b,
    };
  }, [keepNeg, hidden, seed]);

  const W = 720;
  const Hgt = 300;
  const padL = 50;
  const padR = 20;
  const padT = 28;
  const padB = 44;
  const gap = 40;
  const subW = (W - padL * 2 - padR - gap) / 2;
  const innerH = Hgt - padT - padB;

  const renderReliability = (xOffset: number, bins: Bins, title: string) => {
    const x = (v: number) => xOffset + v * subW;
    const y = (v: number) => padT + (1 - v) * innerH;
    const elements: React.ReactNode[] = [];
    elements.push(
      <line
        key="diag"
        x1={x(0)}
        y1={y(0)}
        x2={x(1)}
        y2={y(1)}
        stroke="#cbd5e1"
        strokeDasharray="4 3"
        strokeWidth={1.5}
      />
    );
    elements.push(<line key="xa" x1={x(0)} y1={y(0)} x2={x(1)} y2={y(0)} stroke="#94a3b8" />);
    elements.push(<line key="ya" x1={x(0)} y1={y(0)} x2={x(0)} y2={y(1)} stroke="#94a3b8" />);
    [0, 0.5, 1].forEach((tv) => {
      elements.push(
        <text
          key={`xt-${tv}`}
          x={x(tv)}
          y={y(0) + 14}
          textAnchor="middle"
          fontSize={10}
          fill="#64748b"
        >
          {tv.toFixed(1)}
        </text>
      );
      elements.push(
        <text
          key={`yt-${tv}`}
          x={x(0) - 6}
          y={y(tv) + 3}
          textAnchor="end"
          fontSize={10}
          fill="#64748b"
        >
          {tv.toFixed(1)}
        </text>
      );
    });
    const valid: Array<{ cx: number; cy: number; r: number }> = [];
    for (let i = 0; i < bins.count.length; i++) {
      if (bins.count[i] === 0) continue;
      const cx = x(bins.conf[i]);
      const cy = y(bins.acc[i]);
      const r = 3 + Math.min(7, bins.count[i] / 6);
      valid.push({ cx, cy, r });
    }
    for (let i = 1; i < valid.length; i++) {
      elements.push(
        <line
          key={`seg${i}`}
          x1={valid[i - 1].cx}
          y1={valid[i - 1].cy}
          x2={valid[i].cx}
          y2={valid[i].cy}
          stroke="#FF7F50"
          strokeWidth={2}
        />
      );
    }
    for (let i = 0; i < valid.length; i++) {
      elements.push(
        <circle
          key={`p${i}`}
          cx={valid[i].cx}
          cy={valid[i].cy}
          r={valid[i].r}
          fill="#FF7F50"
          stroke="#fff"
          strokeWidth={1.5}
        />
      );
    }
    elements.push(
      <text
        key="title"
        x={xOffset}
        y={padT - 10}
        textAnchor="start"
        fontSize={11}
        fontWeight={700}
        fill="#0f172a"
        letterSpacing="0.06em"
      >
        {title}
      </text>
    );
    elements.push(
      <text
        key="xlbl"
        x={xOffset + subW / 2}
        y={Hgt - 8}
        textAnchor="middle"
        fontSize={11}
        fill="#475569"
      >
        predicted probability
      </text>
    );
    return <g key={title}>{elements}</g>;
  };

  const commentary = (() => {
    const improvement =
      result.eceBefore > 0.001
        ? ((result.eceBefore - result.eceAfter) / result.eceBefore) * 100
        : 0;
    const aucDelta = Math.abs(result.aucBefore - result.aucAfter);
    if (result.eceBefore < 0.04) {
      return (
        <>
          Down-sampling is mild — the raw model is already near-calibrated. Pull{' '}
          <strong>negatives kept</strong> below 20% to reproduce the production calibration trap
          that L4 candidates miss.
        </>
      );
    }
    if (improvement > 25) {
      return (
        <>
          Platt fixed {improvement.toFixed(0)}% of the calibration error while AUC moved by only{' '}
          {aucDelta.toFixed(4)}.{' '}
          <strong>Calibration is rank-invariant</strong> — that's why AUC barely budged. Production
          rankers re-fit the calibrator every retrain (Lesson 7).
        </>
      );
    }
    return (
      <>
        Platt closed part of the gap; isotonic regression would close more (non-parametric, more
        flexible, ~10× the calibration data).
      </>
    );
  })();

  return (
    <div className={styles.playground}>
      <p className={styles.tag}>Interactive · Wide-and-deep ranker + Platt scaling</p>
      <h4 className={styles.heading}>Calibration: rank-preserving, probability-fixing</h4>
      <p className={styles.subheading}>
        Train a wide-and-deep ranker on synthetic click data, then watch what down-sampling
        negatives does to its probabilities. Platt scaling fits a one-parameter sigmoid on a
        held-out set to reverse the bias. AUC barely moves — calibration changes calibration, not
        ordering.
      </p>

      <div className={styles.controls}>
        <div className={styles.controlRow}>
          <label className={styles.controlLabel}>Negatives kept (training)</label>
          <input
            className={styles.slider}
            type="range"
            min={0.05}
            max={1}
            step={0.05}
            value={keepNeg}
            onChange={(e) => setKeepNeg(parseFloat(e.target.value))}
          />
          <span className={styles.controlValue}>{(keepNeg * 100).toFixed(0)}%</span>
        </div>
        <div className={styles.controlRow}>
          <label className={styles.controlLabel}>Deep MLP hidden units</label>
          <input
            className={styles.slider}
            type="range"
            min={4}
            max={32}
            step={4}
            value={hidden}
            onChange={(e) => setHidden(parseInt(e.target.value))}
          />
          <span className={styles.controlValue}>{hidden}</span>
        </div>
        <div className={styles.controlRow}>
          <label className={styles.controlLabel}>Synthetic data seed</label>
          <input
            className={styles.slider}
            type="range"
            min={1}
            max={200}
            step={1}
            value={seed}
            onChange={(e) => setSeed(parseInt(e.target.value))}
          />
          <span className={styles.controlValue}>{seed}</span>
        </div>
      </div>

      <div className={styles.outputs}>
        <div
          className={`${styles.outputItem} ${
            result.eceBefore > 0.07 ? styles.outputItemAlert : ''
          }`}
        >
          <p className={styles.outputLabel}>ECE Before</p>
          <p className={styles.outputValue}>{result.eceBefore.toFixed(3)}</p>
          <p className={styles.outputSubtext}>raw model · 10 bins</p>
        </div>
        <div
          className={`${styles.outputItem} ${
            result.eceAfter < 0.04 ? styles.outputItemOk : ''
          }`}
        >
          <p className={styles.outputLabel}>ECE After Platt</p>
          <p className={styles.outputValue}>{result.eceAfter.toFixed(3)}</p>
          <p className={styles.outputSubtext}>0 = perfect</p>
        </div>
        <div className={styles.outputItem}>
          <p className={styles.outputLabel}>AUC Before</p>
          <p className={styles.outputValue}>{result.aucBefore.toFixed(3)}</p>
          <p className={styles.outputSubtext}>ranking quality</p>
        </div>
        <div className={styles.outputItem}>
          <p className={styles.outputLabel}>AUC After</p>
          <p className={styles.outputValue}>{result.aucAfter.toFixed(3)}</p>
          <p className={styles.outputSubtext}>≈ unchanged</p>
        </div>
        <div className={styles.outputItem}>
          <p className={styles.outputLabel}>Train pos-rate</p>
          <p className={styles.outputValue}>{(result.trainPosRate * 100).toFixed(0)}%</p>
          <p className={styles.outputSubtext}>natural {(result.naturalPosRate * 100).toFixed(0)}%</p>
        </div>
      </div>

      <svg
        className={styles.chart}
        viewBox={`0 0 ${W} ${Hgt}`}
        role="img"
        aria-label="Reliability diagrams before and after Platt scaling"
      >
        {renderReliability(padL, result.binsBefore, 'BEFORE PLATT')}
        {renderReliability(padL + subW + gap, result.binsAfter, 'AFTER PLATT')}
        <text
          transform={`rotate(-90, ${padL - 38}, ${padT + innerH / 2})`}
          x={padL - 38}
          y={padT + innerH / 2}
          textAnchor="middle"
          fontSize={11}
          fill="#475569"
        >
          observed click rate
        </text>
      </svg>

      <p className={styles.commentary}>
        {commentary}
        <br />
        <span style={{ fontSize: '0.82rem', opacity: 0.85 }}>
          Marker size ∝ bin count. Diagonal = perfect calibration. Trained on {result.trainSize}{' '}
          examples (wide + 4-{hidden}-1 deep), 300 epochs of full-batch SGD. Platt sigmoid:{' '}
          σ({result.a.toFixed(2)}·z + {result.b.toFixed(2)}).
        </span>
      </p>
    </div>
  );
}
