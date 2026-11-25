/* DSA Lab · lab/runners.js — everything that actually runs code.
   In-browser: JavaScript (Web Worker), TypeScript (Monaco's compiler), HTML/CSS (preview iframe),
               Python (Pyodide), Ruby (ruby.wasm), R (webR), SQL (sql.js).
   Remote:     Wandbox (free, no key) with Compiler Explorer as a fallback for C, C++, Rust and Go,
               or your own Piston server. */
(function (g) {
  'use strict';
  const DSA = g.DSA;
  const CDN = (DSA.CDN = Object.assign({
    monaco: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs',
    pyodide: 'https://cdn.jsdelivr.net/npm/pyodide@314.0.8/',
    ruby: 'https://cdn.jsdelivr.net/npm/@ruby/3.4-wasm-wasi@2.10.1/dist/',
    webr: 'https://cdn.jsdelivr.net/npm/webr@0.6.1/dist/',
    sqljs: 'https://cdn.jsdelivr.net/npm/sql.js@1.17.0/dist/',
    wandbox: 'https://wandbox.org/api/',
    godbolt: 'https://godbolt.org/api/',
  }, DSA.CDN || {}));
  const R = (DSA.Runners = {});
  const blobURL = (src) => URL.createObjectURL(new Blob([src], { type: 'text/javascript' }));

  /* Load a UMD script without Monaco's AMD loader capturing it. */
  function loadUMD(src) {
    return new Promise((res, rej) => {
      const d = g.define; g.define = undefined;
      const s = document.createElement('script');
      s.src = src; s.async = true;
      s.onload = () => { g.define = d; res(); };
      s.onerror = () => { g.define = d; rej(new Error('Could not download ' + src)); };
      document.head.appendChild(s);
    });
  }

  /* ---------------- JavaScript (fresh worker per run, so Stop can kill infinite loops) ---------------- */
  const JS_WORKER = `
const send = (t, s) => postMessage({ t, s });
const fmt = (v) => {
  if (typeof v === 'string') return v;
  if (v instanceof Error) return v.name + ': ' + v.message;
  try { const s = JSON.stringify(v, (k, x) => (typeof x === 'bigint' ? x + 'n' : x)); return s === undefined ? String(v) : s; } catch (e) { return String(v); }
};
/* Keep the error message and the stack frames that point into the student's code
   (line numbers shifted by the two lines the Function constructor adds). */
const clean = (err, file) => {
  if (!err || typeof err !== 'object') return 'Uncaught ' + fmt(err);
  const lines = String(err.stack || err).split('\\n');
  const head = lines[0].startsWith(err.name || '~') ? lines[0] : (err.name || 'Error') + ': ' + err.message;
  const frames = lines.slice(1).map((l) => {
    const m = l.match(/<anonymous>:(\\d+):(\\d+)/); if (!m) return null;
    const fn = (l.match(/^\\s*at (?:async )?([\\w$.<>]+) \\(/) || [])[1];
    return '    at ' + (fn && fn !== 'eval' && fn !== 'anonymous' ? fn + ' ' : '') + '(' + file + ':' + (m[1] - 2) + ':' + m[2] + ')';
  }).filter(Boolean).slice(0, 6);
  return [head].concat(frames).join('\\n');
};
self.onmessage = async (e) => {
  const lines = String(e.data.stdin || '').split('\\n');
  if (lines.length && lines[lines.length - 1] === '') lines.pop();
  let li = 0;
  self.readline = () => (li < lines.length ? lines[li++] : null);
  self.prompt = (m) => { const v = self.readline(); send('out', (m == null ? '' : String(m) + ' ') + (v == null ? '' : v) + '\\n'); return v; };
  self.alert = (m) => send('out', String(m) + '\\n');
  const c = {};
  ['log', 'info', 'debug', 'dir', 'trace'].forEach((k) => (c[k] = (...a) => send('out', a.map(fmt).join(' ') + '\\n')));
  ['warn', 'error'].forEach((k) => (c[k] = (...a) => send('err', a.map(fmt).join(' ') + '\\n')));
  c.table = (d) => send('out', JSON.stringify(d, null, 2) + '\\n');
  self.console = c;
  try {
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    await new AsyncFunction(e.data.code)();
    send('done', 0);
  } catch (err) {
    send('err', clean(err, e.data.file || 'main.js') + '\\n');
    send('done', 1);
  }
};`;
  R.js = (code, stdin, io, file) => new Promise((resolve) => {
    const w = new Worker(blobURL(JS_WORKER));
    R._kill = () => { w.terminate(); resolve(137); };
    w.onmessage = (e) => {
      const { t, s } = e.data;
      if (t === 'out') io.out(s); else if (t === 'err') io.err(s);
      else if (t === 'done') { resolve(s); setTimeout(() => w.terminate(), 3000); }
    };
    w.onerror = (e) => { io.err((e.message || 'Script error') + '\n'); resolve(1); };
    w.postMessage({ code, stdin, file });
  });

  /* ---------------- TypeScript: compile with Monaco's TS worker, then run as JavaScript ---------------- */
  R.ts = async (file, code, stdin, io) => {
    const m = g.monaco;
    if (!m || !m.languages.typescript) return R.remote(DSA.LANG.typescript, file, code, stdin, io);
    const model = m.editor.getModels().find((x) => x.uri.path.endsWith('/' + encodeURIComponent(file)) || x.uri.path.endsWith('/' + file));
    if (!model) throw new Error('Open the file in the editor first.');
    const getWorker = await m.languages.typescript.getTypeScriptWorker();
    const client = await getWorker(model.uri);
    const diags = (await client.getSyntacticDiagnostics(model.uri.toString())).concat(await client.getSemanticDiagnostics(model.uri.toString()));
    diags.slice(0, 8).forEach((d) => {
      const pos = d.start != null ? model.getPositionAt(d.start) : null;
      const text = typeof d.messageText === 'string' ? d.messageText : d.messageText.messageText;
      io.warn(`${file}${pos ? ':' + pos.lineNumber + ':' + pos.column : ''} – ${text}\n`);
    });
    const out = await client.getEmitOutput(model.uri.toString());
    const js = (out.outputFiles[0] || { text: '' }).text.replace(/^export \{\};?\s*$/m, '');
    if (diags.length) io.info('(type errors above are warnings; running the JavaScript anyway)\n');
    return R.js(js, stdin, io, file.replace(/\.ts$/, '') + '.js');
  };

  /* ---------------- Python (Pyodide in a persistent worker) ---------------- */
  /* A module worker: Pyodide 314 no longer starts in classic workers. */
  const PY_WORKER = (base) => `
import { loadPyodide } from ${JSON.stringify(base + 'pyodide.mjs')};
let py = null;
const ready = loadPyodide({ indexURL: ${JSON.stringify(base)} })
  .then((p) => { py = p; postMessage({ t: 'ready', s: p.runPython('import sys; sys.version.split()[0]') }); })
  .catch((e) => postMessage({ t: 'fatal', s: String((e && e.message) || e) }));
self.onmessage = async (ev) => {
  await ready;
  if (!py) return;
  const { code, stdin } = ev.data;
  const dec = new TextDecoder();
  py.setStdout({ write: (b) => { postMessage({ t: 'out', s: dec.decode(b) }); return b.length; } });
  py.setStderr({ write: (b) => { postMessage({ t: 'err', s: dec.decode(b) }); return b.length; } });
  const data = new TextEncoder().encode(stdin || '');
  let pos = 0;
  py.setStdin({ read: (buf) => { const n = Math.min(buf.length, data.length - pos); buf.set(data.subarray(pos, pos + n)); pos += n; return n; } });
  let ns = null;
  try {
    if (!self.__inputPatched) {
      // input() echoes what it read, so the terminal looks like an interactive session.
      py.runPython('import builtins, sys\\n' +
        'def _lab_input(prompt=""):\\n' +
        '    sys.stdout.write(str(prompt)); sys.stdout.flush()\\n' +
        '    line = sys.stdin.readline()\\n' +
        '    if not line:\\n' +
        '        raise EOFError("EOF when reading a line (type the input in the Input box before you press Run)")\\n' +
        '    sys.stdout.write(line if line.endswith("\\\\n") else line + "\\\\n"); sys.stdout.flush()\\n' +
        '    return line[:-1] if line.endswith("\\\\n") else line\\n' +
        'builtins.input = _lab_input\\n');
      self.__inputPatched = true;
    }
    try { await py.loadPackagesFromImports(code, { messageCallback: (m) => postMessage({ t: 'info', s: m + '\\n' }), errorCallback: (m) => postMessage({ t: 'info', s: m + '\\n' }) }); }
    catch (e) { postMessage({ t: 'info', s: 'Some imported packages could not be loaded: ' + e.message + '\\n' }); }
    ns = py.globals.get('dict')();
    ns.set('__name__', '__main__');
    await py.runPythonAsync(code, { globals: ns, filename: 'main.py' });
    postMessage({ t: 'done', s: 0 });
  } catch (e) {
    const msg = String((e && e.message) || e).replace(/^  File "\\/lib\\/python[^\\n]*\\n(?:    [^\\n]*\\n)*/gm, '');
    postMessage({ t: 'err', s: msg.endsWith('\\n') ? msg : msg + '\\n' });
    postMessage({ t: 'done', s: 1 });
  } finally { if (ns) ns.destroy(); }
};`;
  let py = null;
  function pyWorker() {
    if (py) return py;
    const w = new Worker(blobURL(PY_WORKER(CDN.pyodide)), { type: 'module' });
    const me = (py = { w, ready: false, handlers: null });
    me.readyP = new Promise((res, rej) => { me.res = res; me.rej = rej; });
    me.readyP.catch(() => {});
    const fail = (msg) => {
      me.rej(new Error('Python could not start: ' + msg));
      if (py === me) py = null;
      w.terminate();
      if (R.onStatus) R.onStatus('python', 'failed');
      if (me.handlers) { me.handlers('err', 'Python stopped: ' + msg + '\n'); me.handlers('done', 1); }
    };
    w.onmessage = (e) => {
      const { t, s } = e.data;
      if (t === 'ready') { me.ready = true; me.version = s; me.res(); if (R.onStatus) R.onStatus('python', 'ready', s); return; }
      if (t === 'fatal') return fail(s);
      if (me.handlers) me.handlers(t, s);
    };
    w.onerror = (e) => { e.preventDefault(); fail(e.message || 'the Pyodide download failed'); };
    if (R.onStatus) R.onStatus('python', 'loading');
    return me;
  }
  R.preloadPython = () => { try { pyWorker(); } catch (e) { /* ignore */ } };
  R.python = async (code, stdin, io) => {
    const p = pyWorker();
    if (!p.ready) io.info('Starting Python (Pyodide, ~12 MB the first time, cached afterwards)…\n');
    await p.readyP;
    return new Promise((resolve) => {
      R._kill = () => { const q = py; py = null; if (q) q.w.terminate(); if (R.onStatus) R.onStatus('python', 'stopped'); resolve(137); };
      p.handlers = (t, s) => {
        if (t === 'out') io.out(s); else if (t === 'err') io.err(s); else if (t === 'info') io.info(s);
        else if (t === 'done') { p.handlers = null; resolve(s); }
      };
      p.w.postMessage({ code, stdin });
    });
  };

  /* ---------------- Ruby (ruby.wasm in a worker; a fresh VM per run) ---------------- */
  const RB_WORKER = (base) => `
importScripts(${JSON.stringify(base + 'browser.umd.js')});
let mod = null;
const ready = (async () => {
  const url = ${JSON.stringify(base + 'ruby+stdlib.wasm')};
  try { mod = await WebAssembly.compileStreaming(fetch(url)); }
  catch (e) { mod = await WebAssembly.compile(await (await fetch(url)).arrayBuffer()); }
  postMessage({ t: 'ready' });
})().catch((e) => postMessage({ t: 'fatal', s: String((e && e.message) || e) }));
const b64 = (s) => btoa(unescape(encodeURIComponent(s)));
self.onmessage = async (ev) => {
  await ready;
  if (!mod) return;
  try {
    const { vm } = await self['ruby-wasm-wasi'].DefaultRubyVM(mod, { consolePrint: false });
    const prog = [
      'require "stringio"',
      '$__out = StringIO.new; $__err = StringIO.new; $__ok = true',
      '__src = "' + b64(ev.data.code) + '".unpack1("m").force_encoding("UTF-8")',
      '__inp = "' + b64(ev.data.stdin || '') + '".unpack1("m").force_encoding("UTF-8")',
      '$stdout = $__out; $stderr = $__err; $stdin = StringIO.new(__inp)',
      'begin',
      '  TOPLEVEL_BINDING.eval(__src, "main.rb")',
      'rescue Exception => e',
      '  $__ok = false',
      '  $__err.puts "#{e.class}: #{e.message}"',
      '  (e.backtrace || []).first(4).each { |l| $__err.puts "  from #{l}" }',
      'ensure',
      '  $stdout = STDOUT; $stderr = STDERR; $stdin = STDIN',
      'end',
      'nil'].join('\\n');
    vm.eval(prog);
    postMessage({ t: 'out', s: vm.eval('$__out.string').toString() });
    const err = vm.eval('$__err.string').toString();
    if (err) postMessage({ t: 'err', s: err });
    postMessage({ t: 'done', s: vm.eval('$__ok').toString() === 'true' ? 0 : 1 });
  } catch (e) {
    postMessage({ t: 'err', s: String((e && e.message) || e) + '\\n' });
    postMessage({ t: 'done', s: 1 });
  }
};`;
  let rb = null;
  R.ruby = async (code, stdin, io) => {
    if (!rb) {
      const w = new Worker(blobURL(RB_WORKER(CDN.ruby)));
      const me = (rb = { w });
      me.readyP = new Promise((res, rej) => { me.res = res; me.rej = rej; });
      me.readyP.catch(() => {});
      const fail = (msg) => {
        me.rej(new Error('Ruby could not start: ' + msg));
        if (rb === me) rb = null;
        w.terminate();
        if (me.handlers) { me.handlers('err', 'Ruby stopped: ' + msg + '\n'); me.handlers('done', 1); }
      };
      w.onmessage = (e) => {
        const { t, s } = e.data;
        if (t === 'ready') { me.ready = true; me.res(); return; }
        if (t === 'fatal') return fail(s);
        if (me.handlers) me.handlers(t, s);
      };
      w.onerror = (e) => { e.preventDefault(); fail(e.message || 'the ruby.wasm download failed'); };
      io.info('Starting Ruby (ruby.wasm, ~30 MB the first time, cached afterwards)…\n');
    }
    const p = rb;
    await p.readyP;
    return new Promise((resolve) => {
      R._kill = () => { if (rb) { rb.w.terminate(); rb = null; } resolve(137); };
      p.handlers = (t, s) => { if (t === 'out') io.out(s); else if (t === 'err') io.err(s); else if (t === 'done') { p.handlers = null; resolve(s); } };
      p.w.postMessage({ code, stdin });
    });
  };

  /* ---------------- R (webR) ---------------- */
  let webR = null;
  R.r = async (code, stdin, io) => {
    if (!webR) {
      io.info('Starting R (webR, ~20 MB the first time, cached afterwards)…\n');
      const mod = await import(CDN.webr + 'webr.js'); // the browser build (webr.mjs in the npm package is for Node)
      const w = new mod.WebR({ baseUrl: CDN.webr });
      await w.init();
      webR = w;
    }
    R._kill = () => { try { webR.interrupt(); } catch (e) { /* ignore */ } };
    const shelter = await new webR.Shelter();
    try {
      const res = await shelter.captureR(code, { withAutoprint: true, captureStreams: true, captureConditions: false });
      for (const o of res.output) (o.type === 'stderr' ? io.err : io.out)(String(o.data) + '\n');
      return 0;
    } catch (e) { io.err(String((e && e.message) || e) + '\n'); return 1; }
    finally { shelter.purge(); }
  };

  /* ---------------- SQL (sql.js / SQLite) ---------------- */
  let SQLp = null;
  const table = (cols, rows) => {
    const cell = (v) => (v == null ? 'NULL' : v instanceof Uint8Array ? '<blob>' : String(v));
    const w = cols.map((c, i) => Math.max(String(c).length, ...rows.map((r) => cell(r[i]).length)));
    const line = '+' + w.map((n) => '-'.repeat(n + 2)).join('+') + '+';
    const fmtRow = (r) => '| ' + r.map((v, i) => (typeof v === 'number' ? cell(v).padStart(w[i]) : cell(v).padEnd(w[i]))).join(' | ') + ' |';
    return [line, fmtRow(cols), line, ...rows.map(fmtRow), line, `(${rows.length} row${rows.length === 1 ? '' : 's'})`].join('\n');
  };
  R.sql = async (code, stdin, io) => {
    if (!SQLp) SQLp = loadUMD(CDN.sqljs + 'sql-wasm.js').then(() => g.initSqlJs({ locateFile: (f) => CDN.sqljs + f })).catch((e) => { SQLp = null; throw e; });
    const SQL = await SQLp;
    const db = new SQL.Database();
    try {
      const res = db.exec(code);
      if (!res.length) io.info('Statements ran successfully; none of them returned rows.\n');
      res.forEach((r) => io.out(table(r.columns, r.values) + '\n\n'));
      return 0;
    } catch (e) { io.err('SQL error: ' + e.message + '\n'); return 1; }
    finally { db.close(); }
  };

  /* ---------------- Remote compilers ---------------- */
  const fetchJSON = async (url, opt, ms) => {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), ms || 60000);
    R._abort = () => ctl.abort();
    try {
      const r = await fetch(url, Object.assign({ signal: ctl.signal }, opt || {}));
      if (!r.ok) { const e = new Error(`${new URL(url).host} answered HTTP ${r.status}`); e.status = r.status; throw e; }
      return await r.json();
    } finally { clearTimeout(t); }
  };
  const verKey = (v) => String(v || '').split(/[^0-9]+/).filter(Boolean).map((x) => x.padStart(5, '0')).join('.');

  R.wandboxList = async () => {
    const c = DSA.U.store.get('wbList', null);
    if (c && Date.now() - c.t < 864e5 && c.list && c.list.length) return c.list;
    const list = await fetchJSON(CDN.wandbox + 'list.json', {}, 20000);
    const slim = list.map((x) => ({ name: x.name, version: x.version, language: x.language, display: x['display-name'] }));
    DSA.U.store.set('wbList', { t: Date.now(), list: slim });
    return slim;
  };
  R.compilersFor = async (lang) => {
    if (!lang.wandbox) return [];
    const list = await R.wandboxList();
    const want = lang.wandbox.map((s) => s.toLowerCase());
    let out = list.filter((x) => want.includes(String(x.language).toLowerCase()));
    const head = (x) => /head|dev|snapshot|nightly|trunk/i.test(x.name + ' ' + x.version);
    out.sort((a, b) => (head(a) - head(b)) || (lang.id === 'c' || lang.id === 'cpp' ? (/^gcc/.test(b.name) - /^gcc/.test(a.name)) : 0) || (verKey(b.version) < verKey(a.version) ? -1 : 1));
    return out;
  };

  /* Wandbox may compile Java as prog.java and launch a class called prog, Prog or Main (or use
     the single-file source launcher, which runs the first class in the file). Make every variant
     work without moving any line: drop "public" from top-level types, put a launcher class called
     prog on the last import line, and add Prog / Main launchers at the end. */
  R.prepJava = (code) => {
    let src = code.replace(/^(\s*)package\s+[\w.]+\s*;/m, '$1');
    const at = src.search(/\bstatic\s+void\s+main\s*\(/);
    const decl = [...src.slice(0, at < 0 ? src.length : at).matchAll(/\b(?:class|record|enum|interface)\s+(\w+)/g)];
    const main = decl.length ? decl[decl.length - 1][1] : 'Main';
    src = src.replace(/^(\s*)public\s+((?:final\s+|abstract\s+|sealed\s+)*(?:class|interface|enum|record)\b)/gm, '$1$2');
    const launcher = (name) => (name === main ? '' : `class ${name} { public static void main(String[] a) throws Exception { ${main}.main(a); } }`);
    const lines = src.split('\n');
    let imp = -1;
    lines.forEach((l, i) => { if (/^\s*import\s+(?:static\s+)?[\w.*]+\s*;\s*$/.test(l)) imp = i; });
    if (imp >= 0) lines[imp] += ' ' + launcher('prog');
    else lines[0] = launcher('prog') + ' ' + lines[0];
    return lines.join('\n') + '\n' + launcher('Prog') + '\n' + launcher('Main') + '\n';
  };

  R.wandbox = async (lang, file, code, stdin, io, compiler) => {
    let name = compiler;
    if (!name) {
      const cs = await R.compilersFor(lang);
      if (!cs.length) throw Object.assign(new Error(`Wandbox does not offer ${lang.name} at the moment.`), { fatal: true });
      name = cs[0].name;
    }
    io.info(`Compiling on wandbox.org with ${name}…\n`);
    const body = { compiler: name, code: lang.id === 'java' ? R.prepJava(code) : code, stdin: stdin || '', save: false };
    if (lang.id === 'c' || lang.id === 'cpp') { body.options = 'warning'; body['compiler-option-raw'] = '-O2\n-lm'; }
    const j = await fetchJSON(CDN.wandbox + 'compile.json', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }, 90000);
    const cmsg = (j.compiler_output || '') + (j.compiler_error || '');
    const fix = (t) => String(t).replace(/\bprog\.(?!exe\b)[A-Za-z]+\b/g, file);
    if (cmsg.trim()) (Number(j.status) && !j.program_output ? io.err : io.warn)(fix(cmsg) + (cmsg.endsWith('\n') ? '' : '\n'));
    if (j.program_output) io.out(j.program_output);
    if (j.program_error) io.err(fix(j.program_error));
    if (j.signal) io.err(`Terminated by signal ${j.signal}.\n`);
    return Number(j.status || 0);
  };

  R.godbolt = async (lang, file, code, stdin, io) => {
    const key = 'gb_' + lang.godbolt;
    let id = DSA.U.store.get(key, null);
    if (!id || Date.now() - id.t > 7 * 864e5) {
      const list = await fetchJSON(CDN.godbolt + 'compilers/' + encodeURIComponent(lang.godbolt) + '?fields=id,name,semver,instructionSet,supportsExecute', { headers: { Accept: 'application/json' } }, 20000);
      const pref = { c: /^x86-64 gcc \d/, 'c++': /^x86-64 gcc \d/, rust: /^rustc \d/, go: /^x86-64 gc \d|^amd64 gc/ }[lang.godbolt];
      const runnable = list.filter((c) => c.supportsExecute !== false && (!c.instructionSet || c.instructionSet === 'amd64') && !/trunk|nightly|beta|snapshot|\(assertions\)/i.test(c.name + ' ' + c.semver));
      let ok = runnable.filter((c) => !pref || pref.test(c.name));
      if (!ok.length) ok = runnable;
      ok.sort((a, b) => (verKey(b.semver) < verKey(a.semver) ? -1 : 1));
      if (!ok.length) throw new Error('Compiler Explorer has no runnable compiler for ' + lang.name);
      id = { t: Date.now(), id: ok[0].id, name: ok[0].name };
      DSA.U.store.set(key, id);
    }
    io.info(`Compiling on godbolt.org with ${id.name}…\n`);
    const body = {
      source: code,
      options: { userArguments: lang.godbolt === 'c' || lang.godbolt === 'c++' ? '-O2 -lm' : '', executeParameters: { args: [], stdin: stdin || '' }, compilerOptions: { executorRequest: true }, filters: { execute: true }, tools: [], libraries: [] },
      lang: lang.godbolt, allowStoreCodeDebug: false,
    };
    const j = await fetchJSON(CDN.godbolt + 'compiler/' + id.id + '/compile', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body) }, 90000);
    const txt = (a) => (Array.isArray(a) ? a.map((x) => x.text).join('\n') : String(a || ''));
    const ex = j.execResult || j;
    const b = ex.buildResult || j.buildResult || {};
    const cmsg = txt(b.stderr).replace(/\x1b\[[0-9;]*m/g, '').replace(/<source>|\/app\/example\.\w+|example\.\w+/g, file);
    if (cmsg.trim()) (b.code ? io.err : io.warn)(cmsg + '\n');
    const out = txt(ex.stdout), err = txt(ex.stderr);
    if (out) io.out(out + '\n');
    if (err) io.err(err + '\n');
    if (ex.didExecute === false) return b.code || 1;
    return Number(ex.code || 0);
  };

  R.piston = async (lang, file, code, stdin, io, url) => {
    io.info(`Running on your Piston server (${url})…\n`);
    const j = await fetchJSON(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ language: lang.piston || lang.id, version: '*', files: [{ name: file, content: code }], stdin: stdin || '' }) }, 90000);
    if (j.compile && (j.compile.stderr || j.compile.stdout)) io.warn(j.compile.stderr || j.compile.stdout);
    if (j.run) { if (j.run.stdout) io.out(j.run.stdout); if (j.run.stderr) io.err(j.run.stderr); return Number(j.run.code || 0); }
    throw new Error(j.message || 'Unexpected answer from Piston');
  };

  R.remote = async (lang, file, code, stdin, io, settings, compiler) => {
    settings = settings || {};
    const backend = settings.backend || 'auto';
    if (backend === 'piston') {
      if (!settings.pistonUrl) throw new Error('Set your Piston URL in Settings first.');
      return R.piston(lang, file, code, stdin, io, settings.pistonUrl);
    }
    if (backend === 'godbolt' && lang.godbolt) return R.godbolt(lang, file, code, stdin, io);
    try { return await R.wandbox(lang, file, code, stdin, io, compiler); }
    catch (e) {
      if (e.name === 'AbortError' && R._stopped) throw e;
      if (backend === 'auto' && lang.godbolt && !e.fatal) {
        io.warn(`Wandbox did not answer (${e.message}). Trying Compiler Explorer instead…\n`);
        return R.godbolt(lang, file, code, stdin, io);
      }
      throw e;
    }
  };

  /* ---------------- dispatcher ---------------- */
  R.run = async (job, io) => {
    const { lang, name, code, stdin, settings, compiler } = job;
    R._kill = null; R._abort = null; R._stopped = false;
    switch (lang.run) {
      case 'js': return R.js(code, stdin, io, name);
      case 'ts': return R.ts(name, code, stdin, io);
      case 'python': return settings && settings.pyRemote ? R.remote(lang, name, code, stdin, io, settings, compiler) : R.python(code, stdin, io);
      case 'ruby': return R.ruby(code, stdin, io);
      case 'r': return R.r(code, stdin, io);
      case 'sql': return R.sql(code, stdin, io);
      case 'remote': return R.remote(lang, name, code, stdin, io, settings, compiler);
      default: throw new Error(`${lang.name} files are not runnable.`);
    }
  };
  R.stop = () => { R._stopped = true; if (R._kill) R._kill(); if (R._abort) R._abort(); };
  R.loadUMD = loadUMD;
})(window);
