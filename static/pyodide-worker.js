/* Pyodide Web Worker — runs Python entirely client-side, no backend needed */
importScripts("https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js");

let pyodide = null;
let bufferedRun = null; // holds { code, id } if a run arrives before init completes

// Python wrapper: captures stdout, stderr, and matplotlib figures
const WRAPPER = `
import io, base64, sys, traceback
from contextlib import redirect_stdout, redirect_stderr

_out = io.StringIO()
_err = io.StringIO()

try:
    with redirect_stdout(_out), redirect_stderr(_err):
        exec(compile(_code, '<playground>', 'exec'), {'__name__': '__main__'})
except Exception:
    _err.write(traceback.format_exc())

_figs = []
try:
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as _plt
    for _n in _plt.get_fignums():
        _buf = io.BytesIO()
        _plt.figure(_n).savefig(_buf, format='png', bbox_inches='tight', dpi=120)
        _buf.seek(0)
        _figs.append(base64.b64encode(_buf.read()).decode())
    _plt.close('all')
except Exception:
    pass

[_out.getvalue(), _err.getvalue(), _figs]
`;

async function executeRun(code, id) {
  try {
    self.postMessage({ type: "status", id, message: "Installing packages…" });
    await pyodide.loadPackagesFromImports(code);

    self.postMessage({ type: "status", id, message: "Running…" });
    pyodide.globals.set("_code", code);

    const raw = await pyodide.runPythonAsync(WRAPPER);
    const arr = raw.toJs ? raw.toJs() : raw;
    const stdout  = arr[0] || "";
    const stderr  = arr[1] || "";
    const figProxy = arr[2];
    const figures = figProxy ? Array.from(figProxy) : [];

    self.postMessage({ type: "result", id, stdout, stderr, figures });
  } catch (err) {
    self.postMessage({ type: "error", id, message: String(err) });
  }
}

async function init() {
  try {
    pyodide = await loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/"
    });
    self.postMessage({ type: "ready" });
    // Execute any run request that arrived while init was in progress
    if (bufferedRun) {
      const { code, id } = bufferedRun;
      bufferedRun = null;
      await executeRun(code, id);
    }
  } catch (e) {
    self.postMessage({ type: "init_error", message: String(e) });
  }
}

self.onmessage = async function (e) {
  const { type, code, id } = e.data;
  if (type !== "run") return;

  if (!pyodide) {
    // Init still in progress — buffer the request; init() will run it when ready
    bufferedRun = { code, id };
    return;
  }

  await executeRun(code, id);
};

init();
