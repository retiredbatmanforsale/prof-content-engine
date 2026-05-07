/* Transformers.js Web Worker — runs ONNX models entirely client-side.
 *
 * Mirrors the pyodide-worker.js shape: an `init` phase that posts {type:"ready"}
 * once the runtime is up, then `run` messages that execute a task and post back
 * one or more {type:"result"|"progress"|"status"|"error"} messages.
 *
 * Loaded as a module worker:  new Worker('/transformers-worker.js', {type:'module'})
 *
 * Tasks supported (passed in message.task):
 *   - "tokenize"    → {tokens, ids, offsets}                     (no model inference)
 *   - "embed"       → {embedding|embeddings}                     (mean-pooled sentence vector)
 *   - "generate"    → streams {type:"token"} per step then {type:"result"}
 *                     with full {text, tokens, perStepTopK}
 *   - "forward"     → single forward pass, returns
 *                     {logits, attentions[L][H][T][T]?, hidden_states[L][T][D]?}
 *   - "classify"    → image classification → {labels:[{label,score}]}
 *   - "vision"      → ViT/CLIP feature/attention extraction
 *
 * One worker instance owns one loaded pipeline. To switch models, dispose this
 * worker and spin up a new one (cheap — IndexedDB cache means the model is
 * already on disk).
 */

import {
  pipeline,
  AutoTokenizer,
  AutoModel,
  AutoModelForCausalLM,
  AutoProcessor,
  RawImage,
  env,
} from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1';

// Force model + WASM downloads to come from the HF CDN (default), not local /static.
env.allowLocalModels = false;
env.allowRemoteModels = true;
// Pin onnxruntime-web's WASM artifact location to the same CDN bundle so it
// doesn't try to fetch from our origin (which 404s in dev).
if (env.backends?.onnx?.wasm) {
  env.backends.onnx.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/';
}

let pipe = null;             // cached pipeline / model instance
let tokenizer = null;        // cached tokenizer for forward/generate paths
let model = null;            // raw model when we need intermediate tensors
let processor = null;        // image processor (ViT / CLIP)
let currentModelId = null;   // which model is loaded
let currentTask = null;      // 'text-generation' | 'feature-extraction' | ...
let device = 'wasm';         // 'webgpu' | 'wasm' — what we actually got

// Tokenizers are tiny and cheap — keep a per-modelId cache so the tokenizer
// playground (and similar demos) can compare 3+ tokenizers without thrashing.
const tokenizerCache = new Map();

// Multi-variant cache for the compare task. Keyed by `${modelId}|${dtype}`.
// Each entry holds a fully-loaded {tokenizer, model} so we can run side-by-side
// inference without swapping. Tokenizer is shared across dtypes of the same modelId.
const compareCache = new Map();

let bufferedRun = null;      // request that arrived during init
let initPromise = null;

// ---------- WebGPU detection ----------
async function detectDevice() {
  if (typeof navigator !== 'undefined' && navigator.gpu) {
    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (adapter) return 'webgpu';
    } catch (_) {}
  }
  return 'wasm';
}

// ---------- Loader ----------
// Load (or reuse) the right pipeline / tokenizer / model for a task.
async function ensureLoaded({ modelId, task, opts = {} }, runId) {
  // Already loaded the right thing?
  if (currentModelId === modelId && currentTask === task) return;

  // New model — reset state.
  pipe = null;
  tokenizer = null;
  model = null;
  processor = null;
  currentModelId = modelId;
  currentTask = task;

  const onProgress = (p) => {
    // p: {status, name, file, progress, loaded, total} from transformers.js
    self.postMessage({
      type: 'progress',
      id: runId,
      stage: p.status,        // 'initiate' | 'download' | 'progress' | 'done' | 'ready'
      file: p.file || null,
      loaded: p.loaded || 0,
      total: p.total || 0,
      progress: typeof p.progress === 'number' ? p.progress : null,
    });
  };

  const baseOpts = {
    device,
    progress_callback: onProgress,
    ...opts,
  };

  if (task === 'tokenize-only') {
    if (!tokenizerCache.has(modelId)) {
      const tk = await AutoTokenizer.from_pretrained(modelId, { progress_callback: onProgress });
      tokenizerCache.set(modelId, tk);
    }
    tokenizer = tokenizerCache.get(modelId);
    return;
  }

  if (task === 'forward-causal') {
    // Need raw model + tokenizer to access attentions / hidden_states.
    tokenizer = await AutoTokenizer.from_pretrained(modelId, { progress_callback: onProgress });
    model = await AutoModelForCausalLM.from_pretrained(modelId, baseOpts);
    return;
  }

  if (task === 'forward-encoder') {
    tokenizer = await AutoTokenizer.from_pretrained(modelId, { progress_callback: onProgress });
    model = await AutoModel.from_pretrained(modelId, baseOpts);
    return;
  }

  if (task === 'vit-forward') {
    processor = await AutoProcessor.from_pretrained(modelId, { progress_callback: onProgress });
    model = await AutoModel.from_pretrained(modelId, baseOpts);
    return;
  }

  // Default: high-level pipeline (covers feature-extraction, image-classification,
  // zero-shot-image-classification, image-feature-extraction, text-generation, etc.)
  pipe = await pipeline(task, modelId, baseOpts);
}

// ---------- Task handlers ----------

async function handleTokenize({ modelId, text }, id) {
  await ensureLoaded({ modelId, task: 'tokenize-only' }, id);
  const enc = tokenizer(text, { return_offsets: true });
  // Map IDs back to display strings.
  const ids = idsToNumbers(enc.input_ids);
  const tokens = ids.map((i) => tokenizer.decode([i], { skip_special_tokens: false }));
  self.postMessage({ type: 'result', id, tokens, ids, count: ids.length });
}

async function handleEmbed({ modelId, texts }, id) {
  await ensureLoaded({ modelId, task: 'feature-extraction' }, id);
  const inputs = Array.isArray(texts) ? texts : [texts];
  const out = await pipe(inputs, { pooling: 'mean', normalize: true });
  // out is a Tensor; .tolist() gives nested JS arrays.
  const embeddings = out.tolist();
  self.postMessage({
    type: 'result',
    id,
    embeddings,
    dim: embeddings[0]?.length ?? 0,
  });
}

async function handleForward({ modelId, text, returnAttentions, returnHiddenStates, kind = 'causal' }, id) {
  const task = kind === 'causal' ? 'forward-causal' : 'forward-encoder';
  await ensureLoaded({ modelId, task }, id);
  const enc = await tokenizer(text);
  // transformers.js v3 honours output_attentions / output_hidden_states only
  // when set on the model config. Pass them in the input dict too — belt + braces.
  if (model.config) {
    if (returnAttentions)    model.config.output_attentions    = true;
    if (returnHiddenStates)  model.config.output_hidden_states = true;
  }
  const out = await model({
    input_ids: enc.input_ids,
    attention_mask: enc.attention_mask,
    output_attentions: !!returnAttentions,
    output_hidden_states: !!returnHiddenStates,
  });
  const ids = idsToNumbers(enc.input_ids);
  const tokens = ids.map((i) => tokenizer.decode([i], { skip_special_tokens: false }));

  const payload = { type: 'result', id, tokens, ids };
  if (out.logits) payload.logits = tensorToList(out.logits);
  if (returnAttentions && out.attentions) payload.attentions = out.attentions.map(tensorToList);
  if (returnHiddenStates && out.hidden_states) payload.hidden_states = out.hidden_states.map(tensorToList);
  if (returnAttentions && !out.attentions) {
    throw new Error('Forward pass did not return attentions. The architecture may not export them through transformers.js. Check model.config.output_attentions support.');
  }
  if (returnHiddenStates && !out.hidden_states) {
    throw new Error('Forward pass did not return hidden_states. The architecture may not export them through transformers.js. Check model.config.output_hidden_states support.');
  }
  self.postMessage(payload);
}

/**
 * handleLens — logit lens. Forward pass with hidden_states from every layer,
 * then project each layer's hidden state through the LM head and return the
 * top-k predicted tokens at every (layer, position).
 *
 * Returns lens shape: [L+1][T][topK] of {id, token, p}.
 */
async function handleLens({ modelId, text, topK = 5 }, id) {
  await ensureLoaded({ modelId, task: 'forward-causal' }, id);
  const enc = await tokenizer(text);
  if (model.config) model.config.output_hidden_states = true;
  const out = await model({
    input_ids: enc.input_ids,
    attention_mask: enc.attention_mask,
    output_hidden_states: true,
  });
  const ids = idsToNumbers(enc.input_ids);
  const tokens = ids.map((i) => tokenizer.decode([i], { skip_special_tokens: false }));

  if (!out.hidden_states) {
    throw new Error('Model did not return hidden_states; check that output_hidden_states is supported.');
  }
  // Resolve a callable LM head. Transformers.js v3 exposes either model.lm_head
  // (callable) or model.lm_head.forward, depending on the build/architecture.
  let callLM = null;
  if (model.lm_head) {
    if (typeof model.lm_head === 'function') {
      callLM = (hs) => model.lm_head(hs);
    } else if (typeof model.lm_head.forward === 'function') {
      callLM = (hs) => model.lm_head.forward(hs);
    } else if (typeof model.lm_head._call === 'function') {
      callLM = (hs) => model.lm_head._call(hs);
    }
  }
  if (!callLM) {
    throw new Error('model.lm_head is not directly callable on this architecture.');
  }

  // For best results we'd apply the final layer norm before unembedding, but
  // approximate the lens for v1: project raw hidden states. Document this.
  const lens = [];
  for (let L = 0; L < out.hidden_states.length; L++) {
    const hs = out.hidden_states[L];
    const logits = await callLM(hs); // expected dims [1, T, V]
    const T = logits.dims[1];
    const V = logits.dims[2];
    const data = logits.data;
    const layer = [];
    for (let t = 0; t < T; t++) {
      const slice = data.subarray(t * V, (t + 1) * V);
      const top = topKFromTypedArray(slice, topK);
      layer.push(top.map(({ idx, score }) => ({
        id: idx,
        token: tokenizer.decode([idx], { skip_special_tokens: false }),
        // Convert raw logit to a comparable softmax over just the top-k
        // (cheaper than full softmax over 50k vocab; reasonable for visual cue).
        score,
      })));
    }
    // Renormalize the per-position top-k scores into probabilities for display.
    for (const positionTopK of layer) {
      const max = Math.max(...positionTopK.map((x) => x.score));
      const exps = positionTopK.map((x) => Math.exp(x.score - max));
      const sum = exps.reduce((a, b) => a + b, 0);
      positionTopK.forEach((x, i) => { x.p = exps[i] / sum; });
    }
    lens.push(layer);
  }
  self.postMessage({ type: 'result', id, tokens, ids, lens });
}

async function handleGenerate({ modelId, text, maxNewTokens = 32, temperature = 1.0, topK = 50, topP = 1.0, streamTopK = 10 }, id) {
  await ensureLoaded({ modelId, task: 'forward-causal' }, id);
  // Manual streaming generation so we can post per-step top-k distributions.
  const enc = await tokenizer(text);
  let inputIds = enc.input_ids;
  let attentionMask = enc.attention_mask;
  const generatedIds = [];
  const perStepTopK = [];

  for (let step = 0; step < maxNewTokens; step++) {
    const out = await model({ input_ids: inputIds, attention_mask: attentionMask });
    // out.logits shape: [1, seq, vocab]
    const logits = out.logits;
    const lastLogits = sliceLastStep(logits);     // [vocab]
    const scaled = lastLogits.map((l) => l / Math.max(1e-6, temperature));
    const probs = softmax(scaled);
    const top = topKIndices(probs, streamTopK);

    perStepTopK.push(top.map(({ idx, p }) => ({
      id: idx,
      token: tokenizer.decode([idx], { skip_special_tokens: false }),
      p,
    })));

    // Sample with top-k / top-p
    const nextId = sampleTopKTopP(probs, topK, topP);
    generatedIds.push(nextId);

    self.postMessage({
      type: 'token',
      id,
      step,
      tokenId: nextId,
      token: tokenizer.decode([nextId], { skip_special_tokens: false }),
      topK: perStepTopK[perStepTopK.length - 1],
    });

    if (tokenizer.eos_token_id != null && nextId === tokenizer.eos_token_id) break;

    // Append the new id and continue. Mirror the same growth on attention_mask.
    inputIds = appendTokenToInputIds(inputIds, nextId);
    attentionMask = appendTokenToInputIds(attentionMask, 1);
  }

  const text_out = tokenizer.decode(generatedIds, { skip_special_tokens: true });
  self.postMessage({ type: 'result', id, text: text_out, ids: generatedIds, perStepTopK });
}

/**
 * handleCompare — load multiple dtype variants of a causal LM and forward the
 * same prompt through each. Returns per-variant top-k + latency so callers
 * can render a side-by-side quantization comparison.
 *
 * Variants: [{ modelId, dtype, label }] — each becomes a column in the UI.
 */
async function handleCompare({ modelId, variants, text, topK = 10 }, id) {
  // Variants share a tokenizer per modelId.
  if (!tokenizerCache.has(modelId)) {
    self.postMessage({ type: 'progress', id, stage: 'initiate', file: `${modelId} tokenizer`, loaded: 0, total: 0, progress: 0 });
    const tk = await AutoTokenizer.from_pretrained(modelId, {
      progress_callback: (p) => self.postMessage({
        type: 'progress', id,
        stage: p.status, file: p.file || null,
        loaded: p.loaded || 0, total: p.total || 0,
        progress: typeof p.progress === 'number' ? p.progress : null,
      }),
    });
    tokenizerCache.set(modelId, tk);
  }
  const tk = tokenizerCache.get(modelId);

  // Load each variant once, lazily.
  for (const v of variants) {
    const key = `${v.modelId ?? modelId}|${v.dtype}`;
    if (compareCache.has(key)) continue;
    self.postMessage({
      type: 'progress', id,
      stage: 'initiate', file: `${v.label || v.dtype}`,
      loaded: 0, total: 0, progress: 0,
    });
    const m = await AutoModelForCausalLM.from_pretrained(v.modelId ?? modelId, {
      device,
      dtype: v.dtype,
      progress_callback: (p) => self.postMessage({
        type: 'progress', id,
        stage: p.status, file: p.file || null,
        loaded: p.loaded || 0, total: p.total || 0,
        progress: typeof p.progress === 'number' ? p.progress : null,
      }),
    });
    compareCache.set(key, m);
  }

  // Tokenize once, reuse across variants.
  const enc = await tk(text);
  const tokens = idsToNumbers(enc.input_ids).map((i) =>
    tk.decode([i], { skip_special_tokens: false })
  );

  const results = [];
  for (const v of variants) {
    const key = `${v.modelId ?? modelId}|${v.dtype}`;
    const m = compareCache.get(key);
    const t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const out = await m({
      input_ids: enc.input_ids,
      attention_mask: enc.attention_mask,
    });
    const ms = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0;
    const lastLogits = sliceLastStep(out.logits);
    const probs = softmax(lastLogits);
    const top = probs
      .map((p, idx) => ({ p, idx }))
      .sort((a, b) => b.p - a.p)
      .slice(0, topK)
      .map(({ p, idx }) => ({
        id: idx,
        token: tk.decode([idx], { skip_special_tokens: false }),
        p,
      }));
    results.push({
      dtype: v.dtype,
      label: v.label || v.dtype,
      latencyMs: ms,
      topK: top,
      top1: top[0],
      _probs: probs, // private, used only for KL below; not posted out
    });
  }

  // Pairwise KL divergence in nats (full vocab).
  const kl = [];
  for (let i = 0; i < results.length; i++) {
    for (let j = 0; j < results.length; j++) {
      if (i === j) continue;
      const P = results[i]._probs;
      const Q = results[j]._probs;
      let s = 0;
      for (let k = 0; k < P.length; k++) {
        if (P[k] > 0) s += P[k] * Math.log((P[k] + 1e-12) / (Q[k] + 1e-12));
      }
      kl.push({ from: results[i].label, to: results[j].label, kl: s });
    }
  }

  // Strip private fields before posting.
  const out = results.map(({ _probs, ...rest }) => rest);
  self.postMessage({
    type: 'result',
    id,
    tokens,
    variants: out,
    klPairs: kl,
  });
}

async function handleClassify({ modelId, image, candidateLabels }, id) {
  // image: data URL string | Blob — RawImage.read accepts both.
  const img = typeof image === 'string'
    ? await RawImage.read(image)
    : await RawImage.fromBlob(image);
  if (candidateLabels && candidateLabels.length) {
    await ensureLoaded({ modelId, task: 'zero-shot-image-classification' }, id);
    const out = await pipe(img, candidateLabels);
    self.postMessage({ type: 'result', id, labels: out });
    return;
  }
  await ensureLoaded({ modelId, task: 'image-classification' }, id);
  const out = await pipe(img, { top_k: 5 });
  self.postMessage({ type: 'result', id, labels: out });
}

/**
 * handleVisionForward — vision transformer forward pass with optional attention
 * extraction. Returns attentions[L][1][H][T+1][T+1] where T+1 = patches + CLS.
 *
 * For ViT-base/16 on 224×224, patches = 14×14 = 196, so T = 197 (incl. CLS).
 * Attentions size ≈ L * H * 197² * 4B ≈ 12 * 12 * 38809 * 4 ≈ 22 MB → fine to post.
 */
async function handleVisionForward({ modelId, image, returnAttentions }, id) {
  await ensureLoaded({ modelId, task: 'vit-forward' }, id);
  const img = typeof image === 'string'
    ? await RawImage.read(image)
    : await RawImage.fromBlob(image);
  const inputs = await processor(img);
  if (model.config && returnAttentions) model.config.output_attentions = true;
  const out = await model({
    ...inputs,
    output_attentions: !!returnAttentions,
  });
  const payload = { type: 'result', id };
  if (out.logits)      payload.logits      = tensorToList(out.logits);
  if (returnAttentions && out.attentions) {
    payload.attentions = out.attentions.map(tensorToList);
  } else if (returnAttentions) {
    throw new Error('Vision forward did not return attentions; check model.config.output_attentions support.');
  }
  // Surface useful shape metadata for the UI.
  if (out.attentions && out.attentions[0]) {
    const dims = out.attentions[0].dims; // [1, H, T+1, T+1]
    payload.numHeads   = dims[1];
    payload.numTokens  = dims[2];
    payload.numLayers  = out.attentions.length;
  }
  self.postMessage(payload);
}

// ---------- Tensor helpers ----------

function tensorToList(t) {
  if (!t) return null;
  if (typeof t.tolist === 'function') return t.tolist();
  if (t.data && t.dims) return reshape(Array.from(t.data), t.dims);
  return t;
}

function reshape(flat, dims) {
  if (dims.length <= 1) return flat;
  const [head, ...rest] = dims;
  const stride = rest.reduce((a, b) => a * b, 1);
  const out = [];
  for (let i = 0; i < head; i++) out.push(reshape(flat.slice(i * stride, (i + 1) * stride), rest));
  return out;
}

function sliceLastStep(logits) {
  // logits.dims = [1, T, V]; return last step as flat array length V.
  const data = logits.data;
  const [, T, V] = logits.dims;
  const start = (T - 1) * V;
  return Array.from(data.slice(start, start + V));
}

function softmax(arr) {
  const max = Math.max(...arr);
  const exps = arr.map((v) => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((v) => v / sum);
}

function topKIndices(probs, k) {
  return probs
    .map((p, idx) => ({ p, idx }))
    .sort((a, b) => b.p - a.p)
    .slice(0, k);
}

/** O(V * k) top-k over a typed array. Faster than a full sort for V=50k, k≤10. */
function topKFromTypedArray(arr, k) {
  const top = []; // sorted descending by score
  for (let i = 0; i < arr.length; i++) {
    const v = arr[i];
    if (top.length < k) {
      // insertion sort
      let j = top.length - 1;
      top.push({ idx: i, score: v });
      while (j >= 0 && top[j].score < top[j + 1].score) {
        const tmp = top[j]; top[j] = top[j + 1]; top[j + 1] = tmp;
        j--;
      }
    } else if (v > top[k - 1].score) {
      top[k - 1] = { idx: i, score: v };
      let j = k - 2;
      while (j >= 0 && top[j].score < top[j + 1].score) {
        const tmp = top[j]; top[j] = top[j + 1]; top[j + 1] = tmp;
        j--;
      }
    }
  }
  return top;
}

function sampleTopKTopP(probs, topK, topP) {
  let candidates = probs.map((p, idx) => ({ p, idx })).sort((a, b) => b.p - a.p);
  if (topK > 0) candidates = candidates.slice(0, topK);
  if (topP < 1.0) {
    let cum = 0;
    const keep = [];
    for (const c of candidates) {
      keep.push(c);
      cum += c.p;
      if (cum >= topP) break;
    }
    candidates = keep;
  }
  const total = candidates.reduce((a, c) => a + c.p, 0);
  let r = Math.random() * total;
  for (const c of candidates) {
    r -= c.p;
    if (r <= 0) return c.idx;
  }
  return candidates[candidates.length - 1].idx;
}

function appendTokenToInputIds(inputIds, newId) {
  // inputIds is a Tensor with dims [1, T]; build new tensor [1, T+1].
  // input_ids / attention_mask are int64 → BigInt64Array. Number → BigInt
  // conversion is mandatory or "Cannot mix BigInt and other types" throws.
  const cls = inputIds.constructor;
  const data = inputIds.data;
  const T = inputIds.dims[1];
  const next = new data.constructor(T + 1);
  next.set(data, 0);
  const isBig = data instanceof BigInt64Array || data instanceof BigUint64Array;
  next[T] = isBig ? BigInt(newId) : newId;
  return new cls(inputIds.type ?? 'int64', next, [1, T + 1]);
}

/** Normalize a possibly-BigInt typed array of ids into Number[] for tokenizer.decode. */
function idsToNumbers(arrLike) {
  if (!arrLike) return [];
  const src = arrLike.data ?? arrLike;
  const out = new Array(src.length);
  for (let i = 0; i < src.length; i++) {
    out[i] = typeof src[i] === 'bigint' ? Number(src[i]) : src[i];
  }
  return out;
}

// ---------- Dispatch ----------

async function executeRun(msg) {
  const { task } = msg;
  try {
    switch (task) {
      case 'tokenize':  return await handleTokenize(msg, msg.id);
      case 'embed':     return await handleEmbed(msg, msg.id);
      case 'forward':   return await handleForward(msg, msg.id);
      case 'generate':  return await handleGenerate(msg, msg.id);
      case 'lens':      return await handleLens(msg, msg.id);
      case 'classify':  return await handleClassify(msg, msg.id);
      case 'vit-forward': return await handleVisionForward(msg, msg.id);
      case 'compare':   return await handleCompare(msg, msg.id);
      default:
        throw new Error(`Unknown task: ${task}`);
    }
  } catch (err) {
    self.postMessage({ type: 'error', id: msg.id, message: String(err?.stack || err) });
  }
}

async function init() {
  try {
    device = await detectDevice();
    self.postMessage({ type: 'ready', device });
    if (bufferedRun) {
      const m = bufferedRun;
      bufferedRun = null;
      await executeRun(m);
    }
  } catch (e) {
    self.postMessage({ type: 'init_error', message: String(e?.stack || e) });
  }
}

self.onmessage = async (e) => {
  const msg = e.data;
  if (msg?.type !== 'run') return;
  if (!initPromise) {
    bufferedRun = msg;
    return;
  }
  await initPromise;
  await executeRun(msg);
};

initPromise = init();
