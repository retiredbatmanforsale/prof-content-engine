/* MNIST Web Worker — runs the ONNX MNIST CNN entirely client-side using
 * onnxruntime-web. Loaded as a module worker:
 *   new Worker('/mnist-worker.js', {type:'module'})
 *
 * Messages
 *   in  : {type:"run", id, input: Float32Array(28*28)}
 *   out : {type:"ready"} | {type:"result", id, probs:[10], pred} | {type:"error", id, message}
 *
 * Model: /models/mnist.onnx (mnist-12 from the ONNX model zoo).
 * Input  : float32[1,1,28,28], values 0..255 (or 0..1 — we accept either via the wrapper).
 * Output : float32[1,10] logits — we softmax in this worker.
 */

// Use the ESM bundle — `ort.min.js` is UMD and won't expose `env` through
// `import * as ort` in a module worker.
import * as ort from 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.19.2/dist/ort.bundle.min.mjs';

// Tell ORT where the WASM artifacts live (same CDN bundle).
ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.19.2/dist/';
// Single-threaded WASM is fine for a 26KB CNN.
ort.env.wasm.numThreads = 1;

let session = null;
let inputName = null;
let outputName = null;
let initPromise = null;
let bufferedRun = null;

function softmax(arr) {
  const max = Math.max(...arr);
  const exps = arr.map((v) => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((v) => v / sum);
}

async function init() {
  try {
    session = await ort.InferenceSession.create('/models/mnist.onnx', {
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all',
    });
    inputName = session.inputNames[0];
    outputName = session.outputNames[0];
    self.postMessage({ type: 'ready' });
    if (bufferedRun) {
      const m = bufferedRun;
      bufferedRun = null;
      await executeRun(m);
    }
  } catch (e) {
    self.postMessage({ type: 'init_error', message: String(e?.stack || e) });
  }
}

async function executeRun(msg) {
  try {
    const { id, input } = msg;
    if (!(input instanceof Float32Array) || input.length !== 28 * 28) {
      throw new Error(`Expected Float32Array(784); got length=${input?.length}`);
    }
    // The CNTK-exported MNIST model expects pixel values in 0..255.
    // We accept 0..1 too: if max is ≤1, scale up.
    let pixels = input;
    let max = 0;
    for (let i = 0; i < pixels.length; i++) if (pixels[i] > max) max = pixels[i];
    if (max <= 1.0001) {
      pixels = new Float32Array(input.length);
      for (let i = 0; i < input.length; i++) pixels[i] = input[i] * 255;
    }
    const tensor = new ort.Tensor('float32', pixels, [1, 1, 28, 28]);
    const feeds = { [inputName]: tensor };
    const out = await session.run(feeds);
    const logits = Array.from(out[outputName].data);
    const probs = softmax(logits);
    let pred = 0;
    for (let i = 1; i < probs.length; i++) if (probs[i] > probs[pred]) pred = i;
    self.postMessage({ type: 'result', id, probs, pred, logits });
  } catch (err) {
    self.postMessage({ type: 'error', id: msg.id, message: String(err?.stack || err) });
  }
}

self.onmessage = async (e) => {
  const msg = e.data;
  if (msg?.type !== 'run') return;
  if (!session) {
    bufferedRun = msg;
    return;
  }
  await executeRun(msg);
};

initPromise = init();
