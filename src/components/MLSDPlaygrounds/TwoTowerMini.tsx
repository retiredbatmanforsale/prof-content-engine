import React, {useState, useRef, useEffect, useMemo} from 'react';
import styles from './styles.module.css';

type Status = 'idle' | 'loading' | 'training' | 'done' | 'error';

interface Result {
  user_topics: number[];
  item_topics: number[];
  item_2d: number[][];
  user_2d: number[][];
  user_emb: number[][];
  item_emb: number[][];
  loss_history: number[];
  recall_at_10: number;
  recall_at_10_random: number;
  epochs: number;
}

const TOPIC_COLORS = ['#ef4444', '#f97316', '#10b981', '#3b82f6', '#a855f7'];

function pythonCode(epochs: number, lr: number, embDim: number): string {
  return `
import numpy as np
import json
np.random.seed(42)

NUM_USERS = 60
NUM_ITEMS = 240
NUM_TOPICS = 5
EMB_DIM = ${embDim}
EPOCHS = ${epochs}
LR = ${lr}

# --- Synthetic ground truth -----------------------------------
# Each user has a "true" topic preference. Items belong to topics.
# Ground truth: user likes items of the same topic (with noise).
user_topics = np.random.randint(0, NUM_TOPICS, NUM_USERS)
item_topics = np.random.randint(0, NUM_TOPICS, NUM_ITEMS)

def true_match(u, i):
    return user_topics[u] == item_topics[i]

# --- Sample positive (user, item) pairs -----------------------
positives = []
for u in range(NUM_USERS):
    matching = [i for i in range(NUM_ITEMS) if true_match(u, i)]
    # Each user generates 6 positive interactions (sample with replacement)
    samples = np.random.choice(matching, size=min(6, len(matching)), replace=False)
    for i in samples:
        positives.append((u, i))
positives = np.array(positives)

# --- Initialise embeddings ------------------------------------
user_emb = np.random.randn(NUM_USERS, EMB_DIM) * 0.1
item_emb = np.random.randn(NUM_ITEMS, EMB_DIM) * 0.1

# --- Train with in-batch sampled softmax ----------------------
BATCH = 16
loss_history = []
for epoch in range(EPOCHS):
    np.random.shuffle(positives)
    epoch_loss = 0.0
    n_batches = 0

    for s in range(0, len(positives), BATCH):
        batch = positives[s:s + BATCH]
        if len(batch) < 2:
            continue
        u_idx = batch[:, 0]
        i_idx = batch[:, 1]
        u_vec = user_emb[u_idx]                  # (B, D)
        i_vec = item_emb[i_idx]                  # (B, D)

        # Logits: dot product of every user with every item in the batch
        logits = u_vec @ i_vec.T                  # (B, B)
        # Stable softmax
        logits -= logits.max(axis=1, keepdims=True)
        exp = np.exp(logits)
        probs = exp / exp.sum(axis=1, keepdims=True)

        # Cross-entropy: each user should match its corresponding item
        diag = np.arange(len(batch))
        loss = -np.mean(np.log(probs[diag, diag] + 1e-9))
        epoch_loss += loss
        n_batches += 1

        # Gradient w.r.t. logits
        labels = np.eye(len(batch))
        grad_logits = (probs - labels) / len(batch)

        # Backprop to embeddings
        grad_u = grad_logits @ i_vec
        grad_i = grad_logits.T @ u_vec

        for k, ui in enumerate(u_idx):
            user_emb[ui] -= LR * grad_u[k]
        for k, ii in enumerate(i_idx):
            item_emb[ii] -= LR * grad_i[k]

    loss_history.append(float(epoch_loss / max(n_batches, 1)))

# --- Evaluation: recall@10 vs random baseline -----------------
def recall_at_k(emb_u, emb_i, k=10):
    hits, total = 0, 0
    for u in range(NUM_USERS):
        scores = emb_i @ emb_u[u]
        top = np.argsort(-scores)[:k]
        truth = set([i for i in range(NUM_ITEMS) if true_match(u, i)])
        if not truth:
            continue
        hits += int(len(set(top.tolist()) & truth) > 0)
        total += 1
    return hits / max(total, 1)

recall_trained = recall_at_k(user_emb, item_emb, k=10)

# Random baseline
random_user_emb = np.random.randn(NUM_USERS, EMB_DIM) * 0.1
random_item_emb = np.random.randn(NUM_ITEMS, EMB_DIM) * 0.1
recall_random = recall_at_k(random_user_emb, random_item_emb, k=10)

# --- 2D PCA projection of the joint embedding space -----------
combined = np.vstack([user_emb, item_emb])
centered = combined - combined.mean(axis=0)
U, S, Vt = np.linalg.svd(centered, full_matrices=False)
combined_2d = centered @ Vt[:2].T
user_2d = combined_2d[:NUM_USERS].tolist()
item_2d = combined_2d[NUM_USERS:].tolist()

print("RESULT_JSON_START")
print(json.dumps({
    'user_topics': user_topics.tolist(),
    'item_topics': item_topics.tolist(),
    'item_2d': item_2d,
    'user_2d': user_2d,
    'user_emb': user_emb.tolist(),
    'item_emb': item_emb.tolist(),
    'loss_history': loss_history,
    'recall_at_10': float(recall_trained),
    'recall_at_10_random': float(recall_random),
    'epochs': EPOCHS,
}))
print("RESULT_JSON_END")
`;
}

let runIdCounter = 0;

export default function TwoTowerMini() {
  const [status, setStatus] = useState<Status>('idle');
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [epochs, setEpochs] = useState(30);
  const [lr, setLr] = useState(0.05);
  const [embDim, setEmbDim] = useState(16);
  const [result, setResult] = useState<Result | null>(null);
  const [selectedUser, setSelectedUser] = useState(0);
  const workerRef = useRef<Worker | null>(null);
  const pendingIdRef = useRef<number>(-1);

  useEffect(() => () => { workerRef.current?.terminate(); }, []);

  function getOrCreateWorker(): Worker {
    if (workerRef.current) return workerRef.current;
    const w = new Worker('/pyodide-worker.js');
    w.onmessage = (e) => {
      const {type, id, message, stdout, stderr} = e.data;
      if (id !== undefined && id !== pendingIdRef.current) return;
      switch (type) {
        case 'ready':
          setStatusMsg('Pyodide ready · running training…');
          break;
        case 'status':
          setStatusMsg(message);
          break;
        case 'result': {
          // Parse RESULT_JSON_START/END from stdout
          const out: string = stdout || '';
          const startIdx = out.indexOf('RESULT_JSON_START');
          const endIdx = out.indexOf('RESULT_JSON_END');
          if (startIdx < 0 || endIdx < 0) {
            setErrorMsg('Training finished but output could not be parsed.\n\nstderr:\n' + stderr);
            setStatus('error');
            setStatusMsg('');
            return;
          }
          const jsonStr = out.substring(startIdx + 'RESULT_JSON_START'.length, endIdx).trim();
          try {
            const parsed: Result = JSON.parse(jsonStr);
            setResult(parsed);
            setStatus('done');
            setStatusMsg('');
            pendingIdRef.current = -1;
          } catch (err) {
            setErrorMsg(`JSON parse failed: ${String(err)}`);
            setStatus('error');
            setStatusMsg('');
          }
          break;
        }
        case 'error':
        case 'init_error':
          setErrorMsg(message || 'Unknown error');
          setStatus('error');
          setStatusMsg('');
          pendingIdRef.current = -1;
          break;
      }
    };
    workerRef.current = w;
    return w;
  }

  function handleTrain() {
    setErrorMsg('');
    setResult(null);
    setStatus('loading');
    setStatusMsg('Loading Pyodide runtime (first run only ~6s)…');
    const w = getOrCreateWorker();
    const id = ++runIdCounter;
    pendingIdRef.current = id;
    setStatus('training');
    w.postMessage({type: 'run', code: pythonCode(epochs, lr, embDim), id});
  }

  // --- Top-K retrieval for the selected user (computed in JS over the full embedding space) ---
  const topKForSelected = useMemo<number[]>(() => {
    if (!result) return [];
    const user = result.user_emb[selectedUser];
    const scores = result.item_emb.map(
      (iv) => iv.reduce((s, v, k) => s + v * user[k], 0),
    );
    return scores
      .map((s, i) => ({s, i}))
      .sort((a, b) => b.s - a.s)
      .slice(0, 10)
      .map((x) => x.i);
  }, [result, selectedUser]);

  // --- Layout helpers ---
  const W = 480, H = 280;
  const itemRender = useMemo(() => {
    if (!result) return null;
    const all2d = [...result.item_2d, ...result.user_2d];
    const xs = all2d.map((p) => p[0]);
    const ys = all2d.map((p) => p[1]);
    const xMin = Math.min(...xs), xMax = Math.max(...xs);
    const yMin = Math.min(...ys), yMax = Math.max(...ys);
    const px = (x: number) => 20 + ((x - xMin) / (xMax - xMin || 1)) * (W - 40);
    const py = (y: number) => 20 + ((y - yMin) / (yMax - yMin || 1)) * (H - 40);
    return {px, py};
  }, [result]);

  const lossPath = useMemo(() => {
    if (!result || result.loss_history.length === 0) return '';
    const w = 480, h = 80;
    const lh = result.loss_history;
    const max = Math.max(...lh);
    const min = Math.min(...lh);
    return lh.map((v, i) => {
      const x = (i / Math.max(lh.length - 1, 1)) * w;
      const y = h - ((v - min) / (max - min || 1)) * (h - 10) - 5;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' ');
  }, [result]);

  return (
    <div className={styles.playground}>
      <p className={styles.tag}>Interactive · Train a two-tower model in your browser</p>
      <p className={styles.heading}>The flagship retrieval architecture, end-to-end in the page</p>
      <p className={styles.subheading}>
        60 users, 240 items, 5 topics. Ground-truth: each user "likes" items of their own topic. The two-tower model has no idea about topics — it only sees positive (user, item) interactions and uses in-batch sampled softmax to align matched pairs and push apart mismatched ones. Watch the loss drop and the embeddings cluster by topic.
      </p>

      <div className={styles.controls}>
        <div className={styles.controlRow}>
          <label className={styles.controlLabel}>Epochs</label>
          <input type="range" min={5} max={80} step={5}
            value={epochs}
            onChange={(e) => setEpochs(parseInt(e.target.value, 10))}
            className={styles.slider}
            disabled={status === 'training' || status === 'loading'}
          />
          <span className={styles.controlValue}>{epochs}</span>
        </div>
        <div className={styles.controlRow}>
          <label className={styles.controlLabel}>Learning rate</label>
          <input type="range" min={0.005} max={0.2} step={0.005}
            value={lr}
            onChange={(e) => setLr(parseFloat(e.target.value))}
            className={styles.slider}
            disabled={status === 'training' || status === 'loading'}
          />
          <span className={styles.controlValue}>{lr.toFixed(3)}</span>
        </div>
        <div className={styles.controlRow}>
          <label className={styles.controlLabel}>Embedding dimension</label>
          <input type="range" min={4} max={64} step={4}
            value={embDim}
            onChange={(e) => setEmbDim(parseInt(e.target.value, 10))}
            className={styles.slider}
            disabled={status === 'training' || status === 'loading'}
          />
          <span className={styles.controlValue}>{embDim}</span>
        </div>
        <div className={styles.controlRow}>
          <label className={styles.controlLabel}>Action</label>
          <button
            onClick={handleTrain}
            disabled={status === 'training' || status === 'loading'}
            className={styles.toggleButton}
            style={{
              gridColumn: 'span 2',
              padding: '0.55rem 1rem',
              background: status === 'training' || status === 'loading' ? '#cbd5e1' : 'var(--lexai-coral-500)',
              color: '#fff',
              border: 0,
              borderRadius: 6,
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: status === 'training' || status === 'loading' ? 'wait' : 'pointer',
            }}
          >
            {status === 'training' || status === 'loading' ? statusMsg || 'Training…' : (result ? 'Re-train' : 'Train two-tower')}
          </button>
        </div>
      </div>

      {status === 'error' && (
        <div className={styles.commentary} style={{borderLeftColor: '#dc2626', background: 'rgba(220, 38, 38, 0.05)'}}>
          <strong>Error:</strong> <pre style={{whiteSpace: 'pre-wrap', margin: 0, fontSize: '0.82rem'}}>{errorMsg}</pre>
        </div>
      )}

      {status === 'idle' && !result && (
        <p className={styles.commentary}>
          Click <strong>Train two-tower</strong> to load Pyodide and train the model end-to-end. First run downloads ~6 MB of Python runtime; subsequent runs are instant.
        </p>
      )}

      {result && (
        <>
          {/* Loss curve */}
          <p className={styles.outputLabel} style={{marginTop: '1.25rem', marginBottom: '0.4rem'}}>Training loss over {result.epochs} epochs</p>
          <svg viewBox="0 0 480 80" className={styles.chart} preserveAspectRatio="none" style={{height: 80}}>
            <path d={lossPath} stroke="#0f172a" strokeWidth={1.5} fill="none" />
            <text x={4} y={12} fontSize={9} fill="#64748b" fontFamily="Menlo, monospace">cross-entropy ↓</text>
            <text x={476} y={75} fontSize={9} fill="#64748b" textAnchor="end" fontFamily="Menlo, monospace">epochs →</text>
          </svg>

          {/* Outputs */}
          <div className={styles.outputs} style={{marginTop: '0.85rem'}}>
            <div className={styles.outputItem}>
              <p className={styles.outputLabel}>Final loss</p>
              <p className={styles.outputValue}>{result.loss_history[result.loss_history.length - 1].toFixed(3)}</p>
              <p className={styles.outputSubtext}>Started at {result.loss_history[0].toFixed(3)}</p>
            </div>
            <div className={styles.outputItem + ' ' + styles.outputItemOk}>
              <p className={styles.outputLabel}>Recall@10 (trained)</p>
              <p className={styles.outputValue}>{(result.recall_at_10 * 100).toFixed(0)}%</p>
              <p className={styles.outputSubtext}>Of users find ≥1 true-topic item in top 10</p>
            </div>
            <div className={styles.outputItem}>
              <p className={styles.outputLabel}>Recall@10 (random)</p>
              <p className={styles.outputValue}>{(result.recall_at_10_random * 100).toFixed(0)}%</p>
              <p className={styles.outputSubtext}>Untrained baseline</p>
            </div>
          </div>

          {/* Embedding scatter */}
          <p className={styles.outputLabel} style={{marginTop: '1.25rem', marginBottom: '0.4rem'}}>Joint embedding space (2D PCA projection)</p>
          <svg viewBox={`0 0 ${W} ${H}`} className={styles.chart} preserveAspectRatio="xMidYMid meet" style={{height: 280}}>
            {/* Items */}
            {itemRender && result.item_2d.map((p, i) => {
              const isTopK = topKForSelected.includes(i);
              const isTrueMatch = result.item_topics[i] === result.user_topics[selectedUser];
              return (
                <circle
                  key={`item-${i}`}
                  cx={itemRender.px(p[0])}
                  cy={itemRender.py(p[1])}
                  r={isTopK ? 5 : 3}
                  fill={TOPIC_COLORS[result.item_topics[i]]}
                  stroke={isTopK ? '#0f172a' : 'none'}
                  strokeWidth={isTopK ? 1.5 : 0}
                  opacity={isTopK || isTrueMatch ? 1.0 : 0.35}
                />
              );
            })}
            {/* Users (diamonds) */}
            {itemRender && result.user_2d.map((p, u) => {
              const x = itemRender.px(p[0]);
              const y = itemRender.py(p[1]);
              const isSelected = u === selectedUser;
              return (
                <g key={`user-${u}`}>
                  <rect
                    x={x - (isSelected ? 6 : 3)}
                    y={y - (isSelected ? 6 : 3)}
                    width={isSelected ? 12 : 6}
                    height={isSelected ? 12 : 6}
                    fill={TOPIC_COLORS[result.user_topics[u]]}
                    stroke={isSelected ? '#0f172a' : '#ffffff'}
                    strokeWidth={isSelected ? 2 : 1}
                    transform={`rotate(45 ${x} ${y})`}
                    opacity={isSelected ? 1 : 0.25}
                  />
                </g>
              );
            })}
            {/* Legend */}
            <g transform={`translate(${W - 110}, 18)`}>
              <rect x={-6} y={-12} width={106} height={NUM_TOPIC_LABELS_HEIGHT(5)} fill="#ffffff" stroke="#e2e8f0" />
              {[0, 1, 2, 3, 4].map((t) => (
                <g key={t} transform={`translate(0, ${t * 14})`}>
                  <circle cx={4} cy={0} r={4} fill={TOPIC_COLORS[t]} />
                  <text x={14} y={3} fontSize={10} fill="#334155" fontFamily="Menlo, monospace">topic {t}</text>
                </g>
              ))}
            </g>
          </svg>

          {/* User selector */}
          <div className={styles.controls} style={{marginTop: '0.6rem'}}>
            <div className={styles.controlRow}>
              <label className={styles.controlLabel}>Selected user</label>
              <input
                type="range" min={0} max={result.user_topics.length - 1} step={1}
                value={selectedUser}
                onChange={(e) => setSelectedUser(parseInt(e.target.value, 10))}
                className={styles.slider}
              />
              <span className={styles.controlValue}>
                #{selectedUser} (topic {result.user_topics[selectedUser]})
              </span>
            </div>
          </div>

          <p className={styles.commentary}>
            Diamonds are users (large = selected); circles are items (large + outlined = top-10 retrieved by dot product). Items of the user's true topic are at full opacity; off-topic items are dimmed. As training converges, the selected user's diamond ends up <em>inside</em> the cluster of items in their topic — that's what "alignment in the joint embedding space" means in concrete pixels.
            <br /><br />
            <strong>Reading the numbers:</strong> recall@10 jumped from {(result.recall_at_10_random * 100).toFixed(0)}% (random init) to {(result.recall_at_10 * 100).toFixed(0)}% (trained) — the model never saw topic labels, only positive interactions, and recovered the topic structure entirely from the contrastive signal. Try {epochs <= 15 ? 'increasing' : 'decreasing'} epochs to see how it changes.
          </p>
        </>
      )}
    </div>
  );
}

function NUM_TOPIC_LABELS_HEIGHT(n: number) {
  return n * 14 + 8;
}
