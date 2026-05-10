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

function randn(rng: () => number) {
  const u = 1 - rng();
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

const N_PAIRS = 100;
const SEM_DIM = 4;
const RAW_DIM = 12;
const SHARED_DIM = 6;

interface Data {
  semantics: number[][];
  textRaw: number[][];
  imageRaw: number[][];
}

function makeData(seed: number): Data {
  const rng = mulberry32(seed);
  const semantics: number[][] = [];
  for (let i = 0; i < N_PAIRS; i++) {
    semantics.push(Array.from({ length: SEM_DIM }, () => randn(rng)));
  }
  const T_text = Array.from({ length: RAW_DIM }, () =>
    Array.from({ length: SEM_DIM }, () => randn(rng) * 0.7)
  );
  const T_image = Array.from({ length: RAW_DIM }, () =>
    Array.from({ length: SEM_DIM }, () => randn(rng) * 0.7)
  );

  const project = (T: number[][], c: number[], noiseScale: number) => {
    const out = new Array(RAW_DIM);
    for (let r = 0; r < RAW_DIM; r++) {
      let s = randn(rng) * noiseScale;
      for (let k = 0; k < SEM_DIM; k++) s += T[r][k] * c[k];
      out[r] = s;
    }
    return out;
  };

  const textRaw = semantics.map((c) => project(T_text, c, 0.4));
  const imageRaw = semantics.map((c) => project(T_image, c, 0.4));
  return { semantics, textRaw, imageRaw };
}

function matVec(M: number[][], v: number[]): number[] {
  const out = new Array(M.length);
  for (let i = 0; i < M.length; i++) {
    let s = 0;
    for (let j = 0; j < v.length; j++) s += M[i][j] * v[j];
    out[i] = s;
  }
  return out;
}

function dot(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

function softmaxRow(logits: number[]): number[] {
  const maxL = Math.max(...logits);
  const exps = logits.map((l) => Math.exp(l - maxL));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

interface Model {
  Wt: number[][];
  Wv: number[][];
}

function initModel(seed: number): Model {
  const rng = mulberry32(seed + 333);
  const init = () =>
    Array.from({ length: SHARED_DIM }, () =>
      Array.from({ length: RAW_DIM }, () => randn(rng) * 0.1)
    );
  return { Wt: init(), Wv: init() };
}

function trainCLIP(
  data: Data,
  batchSize: number,
  temperature: number,
  epochs: number,
  lr: number,
  seed: number
): Model {
  const model = initModel(seed);
  const N = N_PAIRS;
  const order = Array.from({ length: N }, (_, i) => i);
  const rng = mulberry32(seed + 42);

  for (let ep = 0; ep < epochs; ep++) {
    for (let k = N - 1; k > 0; k--) {
      const j = Math.floor(rng() * (k + 1));
      [order[k], order[j]] = [order[j], order[k]];
    }

    for (let bStart = 0; bStart < N; bStart += batchSize) {
      const bIdx = order.slice(bStart, bStart + batchSize);
      const B = bIdx.length;
      if (B < 2) continue;

      const u: number[][] = bIdx.map((i) => matVec(model.Wt, data.textRaw[i]));
      const z: number[][] = bIdx.map((j) => matVec(model.Wv, data.imageRaw[j]));

      const logits: number[][] = [];
      for (let i = 0; i < B; i++) {
        const row = new Array(B);
        for (let j = 0; j < B; j++) row[j] = dot(u[i], z[j]) / temperature;
        logits.push(row);
      }

      const pTI = logits.map((r) => softmaxRow(r));
      const cols: number[][] = [];
      for (let j = 0; j < B; j++) {
        const col = new Array(B);
        for (let i = 0; i < B; i++) col[i] = logits[i][j];
        cols.push(softmaxRow(col));
      }

      const dLogits: number[][] = [];
      for (let i = 0; i < B; i++) {
        const row = new Array(B);
        for (let j = 0; j < B; j++) {
          const dTI = pTI[i][j] - (i === j ? 1 : 0);
          const dIT = cols[j][i] - (i === j ? 1 : 0);
          row[j] = (dTI + dIT) / (2 * B * temperature);
        }
        dLogits.push(row);
      }

      const du: number[][] = Array.from({ length: B }, () => new Array(SHARED_DIM).fill(0));
      const dz: number[][] = Array.from({ length: B }, () => new Array(SHARED_DIM).fill(0));
      for (let i = 0; i < B; i++) {
        for (let j = 0; j < B; j++) {
          const g = dLogits[i][j];
          for (let k = 0; k < SHARED_DIM; k++) {
            du[i][k] += g * z[j][k];
            dz[j][k] += g * u[i][k];
          }
        }
      }

      const dWt: number[][] = Array.from({ length: SHARED_DIM }, () =>
        new Array(RAW_DIM).fill(0)
      );
      const dWv: number[][] = Array.from({ length: SHARED_DIM }, () =>
        new Array(RAW_DIM).fill(0)
      );
      for (let i = 0; i < B; i++) {
        const t = data.textRaw[bIdx[i]];
        const v = data.imageRaw[bIdx[i]];
        for (let k = 0; k < SHARED_DIM; k++) {
          for (let m = 0; m < RAW_DIM; m++) {
            dWt[k][m] += du[i][k] * t[m];
            dWv[k][m] += dz[i][k] * v[m];
          }
        }
      }

      for (let k = 0; k < SHARED_DIM; k++) {
        for (let m = 0; m < RAW_DIM; m++) {
          model.Wt[k][m] -= lr * dWt[k][m];
          model.Wv[k][m] -= lr * dWv[k][m];
        }
      }
    }
  }
  return model;
}

function embedAll(model: Model, data: Data) {
  const t = data.textRaw.map((x) => matVec(model.Wt, x));
  const v = data.imageRaw.map((x) => matVec(model.Wv, x));
  return { t, v };
}

function recallAtK(
  embeds: { t: number[][]; v: number[][] },
  K: number,
  direction: 'text-to-image' | 'image-to-text'
): number {
  const N = embeds.t.length;
  let hits = 0;
  for (let i = 0; i < N; i++) {
    const queryEmb = direction === 'text-to-image' ? embeds.t[i] : embeds.v[i];
    const candEmbs = direction === 'text-to-image' ? embeds.v : embeds.t;
    const scores = candEmbs.map((c, j) => ({ j, s: dot(queryEmb, c) }));
    scores.sort((a, b) => b.s - a.s);
    for (let k = 0; k < K; k++) {
      if (scores[k].j === i) {
        hits++;
        break;
      }
    }
  }
  return hits / N;
}

function pca2D(vectors: number[][]): number[][] {
  const N = vectors.length;
  if (N === 0) return [];
  const d = vectors[0].length;
  const mean = new Array(d).fill(0);
  for (const v of vectors) for (let i = 0; i < d; i++) mean[i] += v[i];
  for (let i = 0; i < d; i++) mean[i] /= N;
  const centered = vectors.map((v) => v.map((x, i) => x - mean[i]));

  const cov: number[][] = Array.from({ length: d }, () => new Array(d).fill(0));
  for (const v of centered) {
    for (let i = 0; i < d; i++)
      for (let j = 0; j < d; j++) cov[i][j] += (v[i] * v[j]) / N;
  }

  const powerIter = (mat: number[][], v0: number[], iters: number) => {
    let v = v0.slice();
    for (let it = 0; it < iters; it++) {
      const nv = new Array(d).fill(0);
      for (let i = 0; i < d; i++) for (let j = 0; j < d; j++) nv[i] += mat[i][j] * v[j];
      let norm = 0;
      for (let i = 0; i < d; i++) norm += nv[i] * nv[i];
      norm = Math.sqrt(norm) || 1;
      v = nv.map((x) => x / norm);
    }
    return v;
  };

  const rng = mulberry32(7);
  const v1Init = Array.from({ length: d }, () => randn(rng));
  const v1 = powerIter(cov, v1Init, 50);

  const cov2: number[][] = Array.from({ length: d }, () => new Array(d).fill(0));
  for (let i = 0; i < d; i++)
    for (let j = 0; j < d; j++) cov2[i][j] = cov[i][j] - 0;
  let lambda1 = 0;
  for (let i = 0; i < d; i++) for (let j = 0; j < d; j++) lambda1 += v1[i] * cov[i][j] * v1[j];
  for (let i = 0; i < d; i++) for (let j = 0; j < d; j++) cov2[i][j] -= lambda1 * v1[i] * v1[j];
  const v2Init = Array.from({ length: d }, () => randn(rng));
  const v2 = powerIter(cov2, v2Init, 50);

  return centered.map((v) => [
    v.reduce((s, x, i) => s + x * v1[i], 0),
    v.reduce((s, x, i) => s + x * v2[i], 0),
  ]);
}

export default function CLIPMini() {
  const [batchSize, setBatchSize] = useState(32);
  const [temperature, setTemperature] = useState(0.1);
  const [epochs, setEpochs] = useState(60);
  const [seed, setSeed] = useState(5);

  const result = useMemo(() => {
    const data = makeData(seed);
    const trained = trainCLIP(data, batchSize, temperature, epochs, 0.05, seed);
    const trainedEmb = embedAll(trained, data);

    const identity: Model = {
      Wt: Array.from({ length: SHARED_DIM }, (_, i) =>
        Array.from({ length: RAW_DIM }, (_, j) => (j === i ? 1 : 0))
      ),
      Wv: Array.from({ length: SHARED_DIM }, (_, i) =>
        Array.from({ length: RAW_DIM }, (_, j) => (j === i ? 1 : 0))
      ),
    };
    const baselineEmb = embedAll(identity, data);

    const t2i_pre = recallAtK(baselineEmb, 1, 'text-to-image');
    const i2t_pre = recallAtK(baselineEmb, 1, 'image-to-text');
    const t2i_post = recallAtK(trainedEmb, 1, 'text-to-image');
    const i2t_post = recallAtK(trainedEmb, 1, 'image-to-text');
    const t2i_post_5 = recallAtK(trainedEmb, 5, 'text-to-image');
    const i2t_post_5 = recallAtK(trainedEmb, 5, 'image-to-text');

    const Nshow = 30;
    const allEmb: number[][] = [];
    for (let i = 0; i < Nshow; i++) allEmb.push(trainedEmb.t[i]);
    for (let i = 0; i < Nshow; i++) allEmb.push(trainedEmb.v[i]);
    const proj = pca2D(allEmb);
    const textProj = proj.slice(0, Nshow);
    const imageProj = proj.slice(Nshow, 2 * Nshow);

    return {
      t2i_pre,
      i2t_pre,
      t2i_post,
      i2t_post,
      t2i_post_5,
      i2t_post_5,
      textProj,
      imageProj,
      asymmetry: t2i_post - i2t_post,
    };
  }, [batchSize, temperature, epochs, seed]);

  const W = 720;
  const Hgt = 320;
  const padL = 40;
  const padR = 40;
  const padT = 30;
  const padB = 40;
  const innerW = W - padL - padR;
  const innerH = Hgt - padT - padB;

  const allX = [...result.textProj.map((p) => p[0]), ...result.imageProj.map((p) => p[0])];
  const allY = [...result.textProj.map((p) => p[1]), ...result.imageProj.map((p) => p[1])];
  const xMin = Math.min(...allX);
  const xMax = Math.max(...allX);
  const yMin = Math.min(...allY);
  const yMax = Math.max(...allY);
  const xRange = xMax - xMin || 1;
  const yRange = yMax - yMin || 1;
  const xPx = (v: number) => padL + ((v - xMin) / xRange) * innerW;
  const yPx = (v: number) => padT + (1 - (v - yMin) / yRange) * innerH;

  const renderScatter = () => {
    const elements: React.ReactNode[] = [];

    elements.push(
      <rect
        key="bg"
        x={padL}
        y={padT}
        width={innerW}
        height={innerH}
        fill="#fafbfc"
        stroke="#e2e8f0"
      />
    );

    for (let i = 0; i < result.textProj.length; i++) {
      const tp = result.textProj[i];
      const ip = result.imageProj[i];
      const dist = Math.sqrt((tp[0] - ip[0]) ** 2 + (tp[1] - ip[1]) ** 2);
      const normDist = dist / Math.max(xRange, yRange);
      const color = normDist < 0.05 ? '#10b981' : normDist < 0.15 ? '#f59e0b' : '#cbd5e1';
      elements.push(
        <line
          key={`ln${i}`}
          x1={xPx(tp[0])}
          y1={yPx(tp[1])}
          x2={xPx(ip[0])}
          y2={yPx(ip[1])}
          stroke={color}
          strokeWidth={normDist < 0.05 ? 1.5 : 1}
          strokeOpacity={0.7}
        />
      );
    }

    result.textProj.forEach((p, i) => {
      elements.push(
        <circle key={`t${i}`} cx={xPx(p[0])} cy={yPx(p[1])} r={4} fill="#FF7F50" stroke="#fff" strokeWidth={1} />
      );
    });
    result.imageProj.forEach((p, i) => {
      elements.push(
        <rect
          key={`i${i}`}
          x={xPx(p[0]) - 4}
          y={yPx(p[1]) - 4}
          width={8}
          height={8}
          fill="#0369a1"
          stroke="#fff"
          strokeWidth={1}
          rx={1}
        />
      );
    });

    elements.push(
      <g key="legend" transform={`translate(${padL + 10}, ${padT + 10})`}>
        <circle cx={5} cy={6} r={5} fill="#FF7F50" stroke="#fff" strokeWidth={1} />
        <text x={16} y={9} fontSize={11} fill="#475569">
          text embedding
        </text>
        <rect x={120} y={2} width={9} height={9} fill="#0369a1" stroke="#fff" strokeWidth={1} rx={1} />
        <text x={134} y={9} fontSize={11} fill="#475569">
          image embedding
        </text>
        <line x1={250} y1={6} x2={266} y2={6} stroke="#10b981" strokeWidth={2} />
        <text x={272} y={9} fontSize={11} fill="#475569">
          paired (line)
        </text>
      </g>
    );

    elements.push(
      <text
        key="title"
        x={padL + innerW / 2}
        y={Hgt - 10}
        textAnchor="middle"
        fontSize={11}
        fill="#475569"
      >
        2D PCA of joint embedding space (30 of {N_PAIRS} pairs shown · short lines = aligned)
      </text>
    );

    return elements;
  };

  const commentary = (() => {
    const t2i = result.t2i_post;
    const i2t = result.i2t_post;
    const asym = Math.abs(t2i - i2t);
    if (t2i < 0.15 && i2t < 0.15) {
      return (
        <>
          The contrastive loss has not produced alignment yet — try a larger{' '}
          <strong>batch size</strong> (more in-batch negatives) or more <strong>epochs</strong>.
          Recall@1 close to {(1 / N_PAIRS * 100).toFixed(1)}% (random) is the sign of an under-trained joint
          space.
        </>
      );
    }
    if (asym > 0.15) {
      return (
        <>
          Asymmetric recall: text→image at {(t2i * 100).toFixed(0)}% vs image→text at{' '}
          {(i2t * 100).toFixed(0)}%. This is the <strong>modality dominance</strong> signal — one
          tower's space is dictating the joint geometry. Production fixes: per-modality temperature
          tuning, balanced batch construction, or a symmetry regulariser. Naming this is L5+.
        </>
      );
    }
    return (
      <>
        Symmetric recall after training: text→image{' '}
        <strong>{(t2i * 100).toFixed(0)}%</strong>, image→text{' '}
        <strong>{(i2t * 100).toFixed(0)}%</strong> (recall@1). The joint space is aligned. Drop
        batch size to 4 or 8 to see how the contrastive signal collapses without enough in-batch
        negatives — this is why CLIP-class training uses 16K-32K batches.
      </>
    );
  })();

  return (
    <div className={styles.playground}>
      <p className={styles.tag}>Interactive · Symmetric InfoNCE on synthetic image-text pairs</p>
      <h4 className={styles.heading}>Contrastive joint training, in-browser</h4>
      <p className={styles.subheading}>
        {N_PAIRS} synthetic (text, image) pairs share a hidden 4-dim semantic concept but live in
        different 12-dim raw spaces. The model learns two projection matrices (text and image) into
        a shared 6-dim space using symmetric InfoNCE with in-batch negatives. Watch how cross-modal
        recall depends on batch size and temperature.
      </p>

      <div className={styles.controls}>
        <div className={styles.controlRow}>
          <label className={styles.controlLabel}>Batch size (in-batch negatives)</label>
          <input
            className={styles.slider}
            type="range"
            min={4}
            max={64}
            step={4}
            value={batchSize}
            onChange={(e) => setBatchSize(parseInt(e.target.value))}
          />
          <span className={styles.controlValue}>{batchSize}</span>
        </div>
        <div className={styles.controlRow}>
          <label className={styles.controlLabel}>Temperature τ</label>
          <input
            className={styles.slider}
            type="range"
            min={0.03}
            max={0.5}
            step={0.01}
            value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value))}
          />
          <span className={styles.controlValue}>{temperature.toFixed(2)}</span>
        </div>
        <div className={styles.controlRow}>
          <label className={styles.controlLabel}>Training epochs</label>
          <input
            className={styles.slider}
            type="range"
            min={10}
            max={120}
            step={10}
            value={epochs}
            onChange={(e) => setEpochs(parseInt(e.target.value))}
          />
          <span className={styles.controlValue}>{epochs}</span>
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
        <div
          className={`${styles.outputItem} ${
            result.t2i_post > 0.5 ? styles.outputItemOk : ''
          }`}
        >
          <p className={styles.outputLabel}>T → I recall@1</p>
          <p className={styles.outputValue}>{(result.t2i_post * 100).toFixed(0)}%</p>
          <p className={styles.outputSubtext}>
            pre {(result.t2i_pre * 100).toFixed(0)}% · @5 {(result.t2i_post_5 * 100).toFixed(0)}%
          </p>
        </div>
        <div
          className={`${styles.outputItem} ${
            result.i2t_post > 0.5 ? styles.outputItemOk : ''
          }`}
        >
          <p className={styles.outputLabel}>I → T recall@1</p>
          <p className={styles.outputValue}>{(result.i2t_post * 100).toFixed(0)}%</p>
          <p className={styles.outputSubtext}>
            pre {(result.i2t_pre * 100).toFixed(0)}% · @5 {(result.i2t_post_5 * 100).toFixed(0)}%
          </p>
        </div>
        <div
          className={`${styles.outputItem} ${
            Math.abs(result.asymmetry) > 0.15 ? styles.outputItemAlert : ''
          }`}
        >
          <p className={styles.outputLabel}>Asymmetry</p>
          <p className={styles.outputValue}>
            {result.asymmetry >= 0 ? '+' : ''}
            {(result.asymmetry * 100).toFixed(0)}%
          </p>
          <p className={styles.outputSubtext}>modality dominance signal</p>
        </div>
        <div className={styles.outputItem}>
          <p className={styles.outputLabel}>Random baseline</p>
          <p className={styles.outputValue}>{(100 / N_PAIRS).toFixed(1)}%</p>
          <p className={styles.outputSubtext}>1 / {N_PAIRS} pairs</p>
        </div>
      </div>

      <svg
        className={styles.chart}
        viewBox={`0 0 ${W} ${Hgt}`}
        role="img"
        aria-label="2D PCA scatter of trained joint embeddings"
      >
        {renderScatter()}
      </svg>

      <p className={styles.commentary}>{commentary}</p>

      <div
        style={{
          marginTop: '0.8rem',
          padding: '0.7rem 0.95rem',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 8,
          fontSize: '0.82rem',
          color: '#475569',
          lineHeight: 1.55,
        }}
      >
        <strong style={{ color: '#0f172a' }}>Symmetric InfoNCE:</strong>{' '}
        <code>
          L = -½ Σᵢ [log softmax_j(uᵢ·zⱼ/τ)[i] + log softmax_i(uᵢ·zⱼ/τ)[j]]
        </code>{' '}
        — both directions get a loss term, which is why the joint space tends toward symmetry. The
        sliders here cover the three production levers: batch size (number of effective negatives),
        temperature (contrast sharpness vs gradient flow), and training duration.
      </div>
    </div>
  );
}
