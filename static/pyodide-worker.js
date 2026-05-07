/* Pyodide Web Worker — runs Python entirely client-side, no backend needed.
 *
 * Two message types:
 *   - { type: "run", code, id }
 *       → free playground execution; returns { stdout, stderr, figures }.
 *   - { type: "run_with_tests", code, tests, id }
 *       → runs `code` in a global namespace, then runs `tests` (a Python script
 *         using @__test__ decorators) in the same namespace, returns
 *         { stdout, stderr, figures, testResults: [{name, status, message, ms}] }.
 */
importScripts("https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js");

let pyodide = null;
let bufferedRun = null; // holds the next message if init is still running

// ---- Free-run wrapper (existing PythonPlayground) ----
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

// ---- Test-harness wrapper (new) ----
//
// The test code is executed AFTER user code in the same namespace.
// It is expected to register tests via the @__test__("name") decorator we
// inject below. Each decorated function is invoked once; assertion failures
// (and any other exceptions) are captured per-test.
const TEST_WRAPPER = `
import io, base64, sys, time, traceback
from contextlib import redirect_stdout, redirect_stderr
import json

_out = io.StringIO()
_err = io.StringIO()
_results = []

def __test__(name):
    def decorator(fn):
        t0 = time.perf_counter()
        try:
            fn()
            _results.append({
                'name': name, 'status': 'pass', 'message': None,
                'ms': (time.perf_counter() - t0) * 1000,
            })
        except AssertionError as e:
            _results.append({
                'name': name, 'status': 'fail',
                'message': str(e) or 'assertion failed',
                'ms': (time.perf_counter() - t0) * 1000,
            })
        except Exception as e:
            _results.append({
                'name': name, 'status': 'fail',
                'message': f'{type(e).__name__}: {e}',
                'ms': (time.perf_counter() - t0) * 1000,
            })
        return fn
    return decorator

_ns = {'__name__': '__main__', '__test__': __test__}

# 1) Run user code. Errors here propagate into _err and abort tests.
_user_failed = False
try:
    with redirect_stdout(_out), redirect_stderr(_err):
        exec(compile(_user_code, '<user>', 'exec'), _ns)
except Exception:
    _user_failed = True
    _err.write('--- error in your code ---\\n')
    _err.write(traceback.format_exc())

# 2) Run tests in the same namespace (so they see user-defined functions).
if not _user_failed:
    _ns['__test__'] = __test__
    _ns['_results'] = _results
    try:
        with redirect_stdout(_out), redirect_stderr(_err):
            exec(compile(_test_code, '<tests>', 'exec'), _ns)
    except Exception:
        _err.write('--- error in test harness (likely a bug in your code triggered at module level) ---\\n')
        _err.write(traceback.format_exc())
    _results = _ns.get('_results', _results)

# Diagnostic: if no tests registered, surface why so the UI can show it.
if not _user_failed and len(_results) == 0:
    _msg = (
        '[harness] 0 tests registered. test_code length = '
        + str(len(_test_code or ''))
        + ' chars. Are your tests using @__test__("name") decorators?'
    )
    _err.write(_msg + '\\n')

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

[_out.getvalue(), _err.getvalue(), _figs, json.dumps(_results)]
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

async function executeRunWithTests(userCode, testCode, id) {
  try {
    self.postMessage({ type: "status", id, message: "Installing packages…" });
    // Install packages from BOTH the user code and the test harness.
    await pyodide.loadPackagesFromImports(userCode + "\n" + testCode);

    self.postMessage({ type: "status", id, message: "Running tests…" });
    pyodide.globals.set("_user_code", userCode);
    pyodide.globals.set("_test_code", testCode);

    const raw = await pyodide.runPythonAsync(TEST_WRAPPER);
    const arr = raw.toJs ? raw.toJs() : raw;
    const stdout  = arr[0] || "";
    const stderr  = arr[1] || "";
    const figProxy = arr[2];
    const figures = figProxy ? Array.from(figProxy) : [];
    const resultsJson = arr[3] || "[]";

    let testResults = [];
    try { testResults = JSON.parse(resultsJson); } catch (_) { /* swallow */ }

    self.postMessage({ type: "result", id, stdout, stderr, figures, testResults });
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
    if (bufferedRun) {
      const m = bufferedRun;
      bufferedRun = null;
      if (m.type === 'run') await executeRun(m.code, m.id);
      else if (m.type === 'run_with_tests') await executeRunWithTests(m.code, m.tests, m.id);
    }
  } catch (e) {
    self.postMessage({ type: "init_error", message: String(e) });
  }
}

self.onmessage = async function (e) {
  const msg = e.data;
  if (msg?.type !== "run" && msg?.type !== "run_with_tests") return;

  if (!pyodide) {
    bufferedRun = msg;
    return;
  }

  if (msg.type === 'run') await executeRun(msg.code, msg.id);
  else await executeRunWithTests(msg.code, msg.tests, msg.id);
};

init();
