/**
 * URAAN AI — safe code execution (client-side).
 * - JavaScript: runs in a sandboxed Web Worker with timeout, no DOM access.
 * - Python: Pyodide (opt-in, ~12MB download once, cached).
 * Never executes untrusted code on any server.
 */

export interface RunResult {
  ok: boolean
  output: string
  error?: string
  timedOut?: boolean
}

/** Run JavaScript safely in a Worker with a 5s timeout. */
export function runJavaScript(code: string): Promise<RunResult> {
  return new Promise((resolve) => {
    const logs: string[] = []
    const workerSrc = `
      const logs = [];
      const console = {
        log: (...a) => logs.push(a.map(String).join(' ')),
        error: (...a) => logs.push('ERROR: ' + a.map(String).join(' ')),
        warn: (...a) => logs.push('WARN: ' + a.map(String).join(' ')),
      };
      self.onmessage = (e) => {
        try {
          const fn = new Function('console', '"use strict";\\n' + e.data);
          const ret = fn(console);
          if (ret !== undefined) logs.push('=> ' + String(ret));
          self.postMessage({ ok: true, output: logs.join('\\n') || '(koi output nahi)' });
        } catch (err) {
          self.postMessage({ ok: false, output: logs.join('\\n'), error: String(err && err.message || err) });
        }
      };
    `
    let worker: Worker | null = null
    const timer = setTimeout(() => {
      worker?.terminate()
      resolve({ ok: false, output: logs.join('\n'), error: 'Time limit (5s) khatam — infinite loop ho sakta hai.', timedOut: true })
    }, 5000)
    try {
      worker = new Worker(URL.createObjectURL(new Blob([workerSrc], { type: 'text/javascript' })))
      worker.onmessage = (e) => {
        clearTimeout(timer)
        worker?.terminate()
        resolve(e.data as RunResult)
      }
      worker.onerror = (e) => {
        clearTimeout(timer)
        worker?.terminate()
        resolve({ ok: false, output: '', error: e.message || 'Worker error' })
      }
      worker.postMessage(code)
    } catch (e) {
      clearTimeout(timer)
      resolve({ ok: false, output: '', error: e instanceof Error ? e.message : 'Run failed' })
    }
  })
}

let pyodide: unknown = null
let pyLoading: Promise<void> | null = null

export function isPythonReady(): boolean { return pyodide !== null }

/** Load Pyodide (~12MB, once, cached). */
export function loadPython(onProgress?: (pct: number) => void): Promise<void> {
  if (pyodide || pyLoading) return pyLoading ?? Promise.resolve()
  pyLoading = (async () => {
    const { loadPyodide } = await import('pyodide')
    pyodide = await loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/',
    })
    onProgress?.(100)
  })()
  return pyLoading
}

/** Run Python via Pyodide with output capture. */
export async function runPython(code: string): Promise<RunResult> {
  if (!pyodide) throw new Error('Python runtime load nahi hua.')
  const py = pyodide as {
    runPythonAsync: (c: string) => Promise<unknown>
    setStdout: (o: { batched: (s: string) => void }) => void
    setStderr: (o: { batched: (s: string) => void }) => void
  }
  const logs: string[] = []
  py.setStdout({ batched: (s) => logs.push(s) })
  py.setStderr({ batched: (s) => logs.push(s) })
  try {
    const ret = await py.runPythonAsync(code)
    if (ret !== undefined && ret !== null) logs.push(`=> ${String(ret)}`)
    return { ok: true, output: logs.join('\n') || '(koi output nahi)' }
  } catch (e) {
    return { ok: false, output: logs.join('\n'), error: String(e).split('\n').slice(0, 4).join('\n') }
  }
}

/** Detect "run this code" intent + extract code blocks. */
export function detectRunRequest(q: string): { lang: 'js' | 'py'; code: string } | null {
  const m = q.match(/```(python|py|javascript|js)\n([\s\S]*?)```/)
  if (!m) return null
  const lang = m[1].startsWith('py') ? 'py' : 'js'
  const runWords = /\b(run|chalao|execute|test|output|result)\b/i
  if (runWords.test(q) || q.trim().startsWith('```')) {
    return { lang, code: m[2].trim() }
  }
  return null
}
