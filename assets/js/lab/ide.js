/* DSA Lab · lab/ide.js — the Code Lab: a small VS Code-style IDE.
   Monaco (the editor inside VS Code) with an explorer, tabs, a terminal, a stdin box, a live
   preview for HTML/CSS/JS, share links, zip download and per-browser autosave.
   Falls back to a plain text editor when Monaco cannot be downloaded. */
(function (g) {
  'use strict';
  const DSA = g.DSA, U = DSA.U, R = DSA.Runners, CDN = DSA.CDN;
  const Lab = (DSA.Lab = DSA.Lab || {});

  /* ---------- icons not in the shared set ---------- */
  const EXTRA = {
    pencil: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
    popout: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    chevron: '<path d="m6 9 6 6 6-6"/>',
    sidebar: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/>',
    zip: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M10 9h1M10 12h1M10 15h1"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  };
  const ic = (n, cls) => (EXTRA[n] ? `<svg class="ic ${cls || ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${EXTRA[n]}</svg>` : U.icon(n, cls));

  /* ---------- file badges ---------- */
  const BADGE = {
    c: ['C', '#6a9bd8'], cpp: ['C++', '#6a9bd8'], java: ['J', '#f0883e'], python: ['Py', '#f5c542'], javascript: ['JS', '#e8d44d'],
    typescript: ['TS', '#4a8fe0'], html: ['<>', '#ef6a3a'], css: ['#', '#5b8cf0'], ruby: ['Rb', '#e0525a'], r: ['R', '#4f8fe0'],
    sql: ['SQL', '#e3a23a'], rust: ['Rs', '#e0a77e'], go: ['Go', '#3fc4e6'], csharp: ['C#', '#b37fe0'], php: ['php', '#8f92d6'],
    swift: ['Sw', '#f0703e'], kotlin: ['Kt', '#b18cff'], haskell: ['Hs', '#a08fd6'], scala: ['Sc', '#e0525a'], perl: ['Pl', '#7a8fd6'],
    lua: ['Lua', '#7a8fd6'], bash: ['$', '#5fcf6a'], pascal: ['Pas', '#d6c95a'], markdown: ['MD', '#8aa3c4'], json: ['{}', '#d6c95a'], text: ['Tx', '#8aa3c4'],
  };
  const badge = (name) => {
    const l = DSA.langOfFile(name);
    const b = BADGE[l.id] || [(name.split('.').pop() || '?').slice(0, 3), '#8aa3c4'];
    return `<span class="fi" style="--fc:${b[1]}" aria-hidden="true">${U.esc(b[0])}</span>`;
  };

  /* ---------- settings & workspace ---------- */
  const SETTINGS0 = { backend: 'auto', pistonUrl: '', pyRemote: false, simple: false, fontSize: 14, wrap: false, minimap: false, tabSize: 4, clearOnRun: true, compilers: {}, panelH: 0 };
  const README = `# Welcome to the Code Lab

- Pick a file on the left, or press **+** to make a new one. The file extension
  decides the language: .c .cpp .java .py .js .ts .html .css .rb .r .sql .rs .go .cs .php .swift .hs .sh …
- Press **Run** (or Ctrl + Enter).
- Programs that read input (scanf, input(), Scanner, cin, gets) read it from the
  **Input** box. Type the input there *before* you press Run, one value per line.
- Python, JavaScript, TypeScript, HTML/CSS, Ruby, R and SQL run inside your browser.
  C, C++, Java, Rust, Go, C# and the rest are compiled on wandbox.org (free), so you
  need to be online for those.
- Your files are saved in this browser automatically. Use Download to keep a copy
  (a single file or a .zip of everything) and Share to send someone a link.
- Every simulation has a "Run in Code Lab" button that opens its C or Python program here.
`;
  function defaultWS() {
    const T = DSA.TEMPLATES;
    return {
      v: 1,
      files: [
        { name: 'main.c', code: T.c }, { name: 'main.py', code: T.python },
        { name: 'index.html', code: T.html }, { name: 'style.css', code: T.css }, { name: 'script.js', code: T.webjs },
        { name: 'README.md', code: README },
      ],
      open: ['main.c', 'main.py', 'README.md'], active: 'main.c', stdin: '7\n',
    };
  }
  function loadWS() {
    const w = U.store.get('ws', null);
    if (!w || !Array.isArray(w.files)) return defaultWS();
    w.files = w.files.filter((f) => f && typeof f.name === 'string' && typeof f.code === 'string');
    w.open = (Array.isArray(w.open) ? w.open : []).filter((n) => w.files.some((f) => f.name === n));
    if (!w.files.some((f) => f.name === w.active)) w.active = w.open[0] || (w.files[0] && w.files[0].name) || null;
    if (w.active && !w.open.includes(w.active)) w.open.push(w.active);
    w.stdin = typeof w.stdin === 'string' ? w.stdin : '';
    return w;
  }
  /* A file still holding one of the starter programs can be replaced without asking. */
  const pristine = (f) => !f.code.trim() || f.code === README || Object.values(DSA.TEMPLATES).includes(f.code);
  const validName = (n) => /^[\w\-. ()+#]{1,80}$/.test(n) && !/^[. ]|[. ]$/.test(n);
  const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  /* ---------- share links: deflate-raw + base64url ---------- */
  const b64u = {
    enc(b) { let s = ''; for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); },
    dec(t) { const s = atob(t.replace(/-/g, '+').replace(/_/g, '/')); const b = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i); return b; },
  };
  async function pack(obj) {
    const raw = new TextEncoder().encode(JSON.stringify(obj));
    if (g.CompressionStream) {
      try { return 'z' + b64u.enc(new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer())); }
      catch (e) { /* fall through */ }
    }
    return 'j' + b64u.enc(raw);
  }
  async function unpack(t) {
    let b = b64u.dec(t.slice(1));
    if (t[0] === 'z') b = new Uint8Array(await new Response(new Blob([b]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());
    return JSON.parse(new TextDecoder().decode(b));
  }

  /* ---------- a tiny zip writer (stored, UTF-8 names) ---------- */
  let CRC;
  function crc32(b) {
    if (!CRC) { CRC = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; CRC[n] = c >>> 0; } }
    let c = 0xffffffff;
    for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }
  function zip(files) {
    const enc = new TextEncoder(), parts = [], central = [];
    const d = new Date(), time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1), date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    let off = 0;
    for (const f of files) {
      const name = enc.encode(f.name), data = enc.encode(f.code), crc = crc32(data);
      const lh = new DataView(new ArrayBuffer(30));
      [[0, 0x04034b50, 4], [4, 20], [6, 0x0800], [8, 0], [10, time], [12, date], [14, crc, 4], [18, data.length, 4], [22, data.length, 4], [26, name.length], [28, 0]]
        .forEach(([o, v, n]) => (n === 4 ? lh.setUint32(o, v, true) : lh.setUint16(o, v, true)));
      parts.push(lh.buffer, name, data);
      const ch = new DataView(new ArrayBuffer(46));
      [[0, 0x02014b50, 4], [4, 20], [6, 20], [8, 0x0800], [10, 0], [12, time], [14, date], [16, crc, 4], [20, data.length, 4], [24, data.length, 4], [28, name.length], [30, 0], [32, 0], [34, 0], [36, 0], [38, 0, 4], [42, off, 4]]
        .forEach(([o, v, n]) => (n === 4 ? ch.setUint32(o, v, true) : ch.setUint16(o, v, true)));
      central.push(ch.buffer, name);
      off += 30 + name.length + data.length;
    }
    const size = central.reduce((s, b) => s + b.byteLength, 0);
    const end = new DataView(new ArrayBuffer(22));
    [[0, 0x06054b50, 4], [4, 0], [6, 0], [8, files.length], [10, files.length], [12, size, 4], [16, off, 4], [20, 0]]
      .forEach(([o, v, n]) => (n === 4 ? end.setUint32(o, v, true) : end.setUint16(o, v, true)));
    return new Blob([...parts, ...central, end.buffer], { type: 'application/zip' });
  }
  Lab.zip = zip;
  function download(name, blob) {
    const a = U.h('a', { href: URL.createObjectURL(blob), download: name });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  /* ---------- Monaco ---------- */
  let monacoP = null;
  function loadMonaco() {
    if (g.monaco && g.monaco.editor) return Promise.resolve(g.monaco);
    if (monacoP) return monacoP;
    const vs = CDN.monaco, base = vs.replace(/vs\/?$/, '');
    g.MonacoEnvironment = {
      getWorkerUrl: () => 'data:text/javascript;charset=utf-8,' + encodeURIComponent(
        `self.MonacoEnvironment={baseUrl:${JSON.stringify(base)}};` +
        'self.addEventListener("unhandledrejection",function(e){var r=e.reason;if(r&&(r.name==="Canceled"||r.message==="Canceled"))e.preventDefault()});' +
        `importScripts(${JSON.stringify(vs + '/base/worker/workerMain.js')});`),
    };
    /* Monaco's AMD loader adds plain <script> tags. Mark its scripts crossorigin so the browser
       treats them like our own code: then expected "Canceled" rejections from inside Monaco reach
       the filter below instead of being logged as muted cross-origin errors. Other scripts are untouched. */
    if (!document.__labScripts) {
      document.__labScripts = true;
      const ce = document.createElement;
      document.createElement = function (tag, opt) {
        const el = ce.call(this, tag, opt);
        if (typeof tag === 'string' && tag.toLowerCase() === 'script') {
          const sa = el.setAttribute;
          el.setAttribute = function (n, v) { if (n === 'src' && String(v).startsWith(CDN.monaco)) el.crossOrigin = 'anonymous'; return sa.call(this, n, v); };
        }
        return el;
      };
    }
    monacoP = new Promise((res, rej) => {
      const t = setTimeout(() => rej(new Error('the editor took too long to download')), 30000);
      U.loadScript(vs + '/loader.js').then(() => {
        g.require.config({ paths: { vs } });
        g.require(['vs/editor/editor.main'], () => { clearTimeout(t); setupMonaco(g.monaco); res(g.monaco); }, (e) => { clearTimeout(t); rej(e); });
      }, (e) => { clearTimeout(t); rej(e); });
    }).catch((e) => { monacoP = null; throw e; });
    return monacoP;
  }
  function setupMonaco(m) {
    const base = { 'editorGutter.background': '#0a1224' };
    m.editor.defineTheme('dsa-dark', {
      base: 'vs-dark', inherit: true, rules: [],
      colors: Object.assign({}, base, {
        'editor.background': '#0a1224', 'editor.lineHighlightBackground': '#131d36', 'editor.lineHighlightBorder': '#00000000',
        'editorLineNumber.foreground': '#4a5b80', 'editorLineNumber.activeForeground': '#c9d6ef', 'editorCursor.foreground': '#29d3e8',
        'editor.selectionBackground': '#29d3e83d', 'editorIndentGuide.background1': '#1c2742', 'editorWidget.background': '#131b31',
        'editorWidget.border': '#33436a', 'editorSuggestWidget.background': '#131b31', 'editorSuggestWidget.border': '#33436a',
        'editorSuggestWidget.selectedBackground': '#1f2c4d', 'editorHoverWidget.background': '#131b31', 'editorHoverWidget.border': '#33436a',
        'scrollbarSlider.background': '#33436a66', 'scrollbarSlider.hoverBackground': '#33436aaa', 'minimap.background': '#0a1224',
      }),
    });
    m.editor.defineTheme('dsa-light', {
      base: 'vs', inherit: true, rules: [],
      colors: {
        'editor.background': '#f6f8fc', 'editorGutter.background': '#f6f8fc', 'editor.lineHighlightBackground': '#eef3fa', 'editor.lineHighlightBorder': '#00000000',
        'editorLineNumber.foreground': '#9aa8c4', 'editorLineNumber.activeForeground': '#24304f', 'editorCursor.foreground': '#0b97b0',
        'editor.selectionBackground': '#0b97b033', 'minimap.background': '#f6f8fc',
      },
    });
    const ts = m.languages.typescript;
    if (ts) {
      const env = 'declare function readline(): string | null;\n';
      ts.typescriptDefaults.addExtraLib(env, 'file:///lab-env.d.ts');
      ts.javascriptDefaults.addExtraLib(env, 'file:///lab-env.d.ts');
      // moduleDetection 3 = "force": every file is its own module, so two files may both declare `nums`.
      ts.typescriptDefaults.setCompilerOptions({ target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext, moduleDetection: 3, allowNonTsExtensions: true, strict: false, noImplicitAny: false });
      ts.javascriptDefaults.setCompilerOptions({ target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext, moduleDetection: 3, allowNonTsExtensions: true, allowJs: true });
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => m.editor.remeasureFonts());
  }
  const edTheme = () => (document.documentElement.dataset.theme === 'light' ? 'dsa-light' : 'dsa-dark');
  const edOpts = (S) => ({
    fontSize: S.fontSize, fontFamily: "'JetBrains Mono', ui-monospace, 'Cascadia Code', Consolas, monospace", minimap: { enabled: !!S.minimap },
    wordWrap: S.wrap ? 'on' : 'off', tabSize: S.tabSize, insertSpaces: true, automaticLayout: true, scrollBeyondLastLine: false, smoothScrolling: true,
    bracketPairColorization: { enabled: true }, guides: { bracketPairs: 'active' }, padding: { top: 10, bottom: 10 }, fixedOverflowWidgets: true,
    stickyScroll: { enabled: false }, mouseWheelZoom: true, renderLineHighlight: 'all', cursorBlinking: 'smooth',
  });

  function monacoEditor(m, host, S, hooks) {
    const models = new Map(), views = new Map();
    const ed = m.editor.create(host, Object.assign(edOpts(S), { model: null, theme: edTheme() }));
    let cur = null;
    const model = (f) => {
      let md = models.get(f);
      if (md && !md.isDisposed()) return md;
      const uri = m.Uri.file('/lab/' + f.name);
      const old = m.editor.getModel(uri); if (old) old.dispose();
      md = m.editor.createModel(f.code, DSA.langOfFile(f.name).monaco, uri);
      md.updateOptions({ tabSize: S.tabSize, insertSpaces: true });
      md.onDidChangeContent(() => { f.code = md.getValue(); hooks.edit(f); });
      models.set(f, md);
      return md;
    };
    ed.onDidChangeCursorPosition(() => hooks.cursor());
    ed.addCommand(m.KeyMod.CtrlCmd | m.KeyCode.Enter, () => hooks.run());
    ed.addCommand(m.KeyMod.CtrlCmd | m.KeyCode.KeyS, () => hooks.save());
    ed.addCommand(m.KeyMod.CtrlCmd | m.KeyCode.KeyB, () => hooks.toggleFiles());
    return {
      kind: 'monaco',
      show(f, focus) {
        if (cur && models.has(cur) && ed.getModel()) views.set(cur, ed.saveViewState());
        cur = f || null;
        if (!f) { ed.setModel(null); return; }
        ed.setModel(model(f));
        const v = views.get(f); if (v) ed.restoreViewState(v);
        if (focus) ed.focus();
      },
      refresh(f) { const md = models.get(f); if (md && !md.isDisposed() && md.getValue() !== f.code) md.setValue(f.code); },
      renamed(f) {
        const md = models.get(f), v = views.get(f);
        models.delete(f);
        const wasCur = cur === f;
        if (md) md.dispose();
        if (wasCur) { cur = null; this.show(f, true); if (v) ed.restoreViewState(v); }
      },
      remove(f) { const md = models.get(f); models.delete(f); views.delete(f); if (cur === f) { cur = null; ed.setModel(null); } if (md) md.dispose(); },
      pos() { const p = ed.getPosition(); return p ? [p.lineNumber, p.column, ed.getModel() ? ed.getModel().getLineCount() : 0] : [1, 1, 0]; },
      selection() { const md = ed.getModel(), s = ed.getSelection(); return md && s && !s.isEmpty() ? md.getValueInRange(s).length : 0; },
      goto(line, col) { if (!ed.getModel()) return; ed.revealLineInCenter(line); ed.setPosition({ lineNumber: line, column: col || 1 }); ed.focus(); },
      markers(f, list) {
        const md = models.get(f); if (!md || md.isDisposed()) return;
        const n = md.getLineCount();
        m.editor.setModelMarkers(md, 'lab', list.filter((d) => d.line >= 1 && d.line <= n).map((d) => ({
          startLineNumber: d.line, endLineNumber: d.line,
          startColumn: d.col || md.getLineFirstNonWhitespaceColumn(d.line) || 1,
          endColumn: d.col ? Math.min(d.col + 1, md.getLineMaxColumn(d.line)) : md.getLineMaxColumn(d.line),
          message: d.msg, severity: d.sev === 'warning' ? m.MarkerSeverity.Warning : d.sev === 'note' ? m.MarkerSeverity.Info : m.MarkerSeverity.Error,
          source: 'Run',
        })));
      },
      options(S2) { ed.updateOptions(edOpts(S2)); models.forEach((md) => md.updateOptions({ tabSize: S2.tabSize })); },
      theme() { m.editor.setTheme(edTheme()); },
      focus() { ed.focus(); },
      layout() { ed.layout(); },
      destroy() { ed.dispose(); models.forEach((md) => md.dispose()); models.clear(); },
    };
  }

  /* A plain <textarea> editor: used on request, or when Monaco cannot load. */
  function plainEditor(host, S, hooks) {
    host.innerHTML = '';
    const ta = U.h('textarea', { class: 'lab-ta', spellcheck: 'false', autocapitalize: 'off', autocomplete: 'off', 'aria-label': 'Code editor' });
    host.append(ta);
    let cur = null;
    const apply = () => { ta.style.fontSize = S.fontSize + 'px'; ta.style.tabSize = S.tabSize; ta.style.whiteSpace = S.wrap ? 'pre-wrap' : 'pre'; };
    apply();
    ta.addEventListener('input', () => { if (cur) { cur.code = ta.value; hooks.edit(cur); } });
    ta.addEventListener('keyup', () => hooks.cursor());
    ta.addEventListener('click', () => hooks.cursor());
    ta.addEventListener('keydown', (e) => {
      if (e.key === 'Tab' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        const s = ta.selectionStart, en = ta.selectionEnd, pad = ' '.repeat(S.tabSize);
        if (!e.shiftKey) { ta.setRangeText(pad, s, en, 'end'); }
        else { const ls = ta.value.lastIndexOf('\n', s - 1) + 1; const lead = ta.value.slice(ls, ls + S.tabSize).match(/^ */)[0].length; if (lead) ta.setRangeText('', ls, ls + lead, 'preserve'); }
        ta.dispatchEvent(new Event('input'));
      } else if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        const s = ta.selectionStart, ls = ta.value.lastIndexOf('\n', s - 1) + 1;
        const ind = ta.value.slice(ls, s).match(/^[ \t]*/)[0] + (/[{:([]\s*$/.test(ta.value.slice(ls, s)) ? ' '.repeat(S.tabSize) : '');
        e.preventDefault(); ta.setRangeText('\n' + ind, s, ta.selectionEnd, 'end'); ta.dispatchEvent(new Event('input'));
      }
    });
    return {
      kind: 'plain',
      show(f, focus) { cur = f || null; ta.value = f ? f.code : ''; ta.disabled = !f; ta.scrollTop = 0; if (f && focus) ta.focus(); },
      refresh(f) { if (cur === f && ta.value !== f.code) ta.value = f.code; },
      renamed() {}, remove(f) { if (cur === f) this.show(null); },
      pos() { const before = ta.value.slice(0, ta.selectionStart); const ln = before.split('\n').length; return [ln, ta.selectionStart - before.lastIndexOf('\n'), ta.value.split('\n').length]; },
      selection() { return ta.selectionEnd - ta.selectionStart; },
      goto(line) { const lines = ta.value.split('\n'); const at = lines.slice(0, line - 1).join('\n').length + (line > 1 ? 1 : 0); ta.focus(); ta.setSelectionRange(at, at + (lines[line - 1] || '').length); },
      markers() {}, options(S2) { S = S2; apply(); }, theme() {}, focus() { ta.focus(); }, layout() {}, destroy() { host.innerHTML = ''; },
    };
  }

  /* ---------- compiler messages → editor squiggles ---------- */
  function diagnostics(text, file) {
    const out = [], seen = new Set(), n = reEsc(file);
    const firstErr = (text.split('\n').find((l) => /^\s*\w*(Error|Exception)\b.*:/.test(l)) || '').trim();
    const add = (line, col, sev, msg) => {
      line = +line; col = col ? +col : 0;
      if (!/[A-Za-z]{2}/.test(msg)) msg = firstErr || 'error';
      const k = line + ':' + msg; if (!line || seen.has(k) || out.length >= 60) return;
      seen.add(k); out.push({ line, col, sev: (sev || 'error').replace('fatal ', ''), msg: msg.trim() || 'error' });
    };
    let m;
    const gccLike = new RegExp(`(?:^|[\\s/"'(])${n}:(\\d+)(?::(\\d+))?:?\\s*(fatal error|error|warning|note)?:?\\s*(.*)$`, 'gm');
    while ((m = gccLike.exec(text))) add(m[1], m[2], m[3], m[4] || '');
    const cs = new RegExp(`${n}\\((\\d+),(\\d+)\\):\\s*(error|warning)\\s*([^\\n]*)`, 'g');
    while ((m = cs.exec(text))) add(m[1], m[2], m[3], m[4]);
    const rust = new RegExp(`^(error|warning)(?:\\[\\w+\\])?: ([^\\n]*)\\n\\s*--> ${n}:(\\d+):(\\d+)`, 'gm');
    while ((m = rust.exec(text))) add(m[3], m[4], m[1], m[2]);
    const py = new RegExp(`File "${n}", line (\\d+)`, 'g');
    let last = null; while ((m = py.exec(text))) last = m[1];
    if (last) {
      const lines = text.trim().split('\n'), msg = lines.reverse().find((l) => /^\w*(Error|Exception|Interrupt|Exit)\b|^\w+: /.test(l.trim()));
      add(last, 0, 'error', msg || 'Python error');
    }
    const php = new RegExp(`(?:error|warning)[^\\n]*?: ([^\\n]*?) in [^\\n]*${n} on line (\\d+)`, 'gi');
    while ((m = php.exec(text))) add(m[2], 0, /warning/i.test(m[0]) ? 'warning' : 'error', m[1]);
    return out;
  }
  Lab.diagnostics = diagnostics;

  const READS = /\bscanf\s*\(|\bgetchar\s*\(|\bfgets\s*\(|\bgetline\s*\(|\bcin\s*>>|\bnew\s+Scanner\b|\bBufferedReader\b|\breadLine\s*\(|\breadline\s*\(|\binput\s*\(|\bgets\b|\bSTDIN\b|\bReadLine\s*\(|\bfmt\.Scan|\bio::stdin\b|\bstdin\b|\bread_line\b|\breadLines\s*\(|\bprompt\s*\(/;

  /* Monaco rejects pending work with "Canceled" when an editor or model is disposed. That is
     expected, so keep it out of the console (installed once; it ignores everything else). */
  g.addEventListener('unhandledrejection', (e) => { const r = e.reason; if (r && (r.name === 'Canceled' || r.message === 'Canceled')) e.preventDefault(); });

  /* ---------- the IDE ---------- */
  Lab.mount = (root, rest) => {
    if (Lab.current) { try { Lab.current.destroy(); } catch (e) { /* ignore */ } }
    const S = Object.assign({}, SETTINGS0, U.store.get('labSettings', {}));
    S.compilers = Object.assign({}, S.compilers);
    let ws = loadWS();
    let editor = null, running = false, runT0 = 0, tick = 0, previewOf = null, errText = '', alive = true, prevTimer = 0, preloadT = 0, toastT = 0;
    const offs = [];
    const on = (t, ev, fn, o) => { t.addEventListener(ev, fn, o); offs.push(() => t.removeEventListener(ev, fn, o)); };
    const byName = (n) => ws.files.find((f) => f.name === n) || null;
    const active = () => byName(ws.active);
    const narrow = () => g.innerWidth < 860;

    root.innerHTML = `
<div class="lab" data-files="${narrow() ? 0 : 1}">
  <div class="lab-bar">
    <button class="lb" type="button" data-a="files" title="Show or hide the file explorer (Ctrl+B)" aria-label="Toggle file explorer">${ic('sidebar')}</button>
    <div class="lab-title"><span id="labBadge"></span><span id="labFname" class="lab-fname"></span></div>
    <span class="spring"></span>
    <span class="lab-rt" id="labRt"></span>
    <label class="lab-comp" id="labCompWrap" hidden><span class="sr">Compiler</span><select id="labComp" aria-label="Compiler"></select></label>
    <button class="btn primary sm lab-run" type="button" data-a="run" id="labRun" title="Run (Ctrl+Enter)">${ic('play')}<span>Run</span></button>
    <button class="btn danger sm lab-stop" type="button" data-a="stop" id="labStop" hidden>${ic('stop')}<span>Stop</span></button>
    <span class="lab-sep"></span>
    <button class="lb" type="button" data-a="share" title="Share a link to this code" aria-label="Share">${ic('share')}</button>
    <button class="lb" type="button" data-a="download" title="Download" aria-label="Download">${ic('download')}</button>
    <button class="lb hide-sm" type="button" data-a="upload" title="Open files from your computer" aria-label="Open files">${ic('upload')}</button>
    <button class="lb" type="button" data-a="settings" title="Settings" aria-label="Settings">${ic('gear')}</button>
    <input type="file" id="labUpload" multiple hidden>
  </div>
  <div class="lab-body">
    <aside class="lab-side" aria-label="Files">
      <div class="lab-sh"><span>Explorer</span><span class="cnt" id="labCount"></span><span class="spring"></span>
        <button class="lb sm" type="button" data-a="upload" title="Open files from your computer" aria-label="Open files">${ic('upload')}</button>
        <button class="lb sm" type="button" data-a="new" title="New file" aria-label="New file">${ic('plus')}</button></div>
      <ul class="lab-files" id="labFiles"></ul>
      <div class="lab-sidefoot">Files are saved in this browser.<br><a href="#/">Back to the simulations</a></div>
    </aside>
    <div class="lab-scrim" data-a="files"></div>
    <section class="lab-work" id="labWork">
      <div class="lab-tabs" id="labTabs" role="tablist" aria-label="Open files"></div>
      <div class="lab-ed" id="labEd"><div class="lab-edload"><div class="spin"></div><span>Loading the editor…</span></div></div>
      <div class="lab-split" id="labSplit" role="separator" aria-orientation="horizontal" aria-label="Resize the output panel" tabindex="0"></div>
      <div class="lab-panel" id="labPanel" data-tab="term">
        <div class="lab-ptabs" role="tablist">
          <button type="button" role="tab" data-t="term" aria-selected="true">Terminal</button>
          <button type="button" role="tab" data-t="in" aria-selected="false">Input</button>
          <button type="button" role="tab" data-t="prev" aria-selected="false">Preview</button>
          <span class="spring"></span>
          <button class="lb sm" type="button" data-a="clear" title="Clear the terminal" aria-label="Clear the terminal">${ic('trash')}</button>
          <button class="lb sm lab-fold" type="button" data-a="fold" title="Shrink or grow the panel" aria-label="Shrink or grow the panel">${ic('chevron')}</button>
        </div>
        <div class="lab-pbody">
          <div class="lab-term" id="labTermBox"><pre id="labOut" class="lab-out" aria-live="polite"></pre></div>
          <div class="lab-in"><div class="lab-inh"><b>Input</b><span>stdin · one value per line, typed before you press Run</span></div>
            <textarea id="labStdin" spellcheck="false" autocapitalize="off" autocomplete="off" placeholder="e.g.&#10;5&#10;3 8 1 9 2" aria-label="Program input (stdin)"></textarea></div>
          <div class="lab-prev"><div class="lab-prevbar"><span id="labPrevName" class="lab-fname"></span><span class="spring"></span>
            <button class="lb sm" type="button" data-a="reload" title="Reload the preview" aria-label="Reload the preview">${ic('reset')}</button>
            <button class="lb sm" type="button" data-a="popout" title="Open the page in a new tab" aria-label="Open in a new tab">${ic('popout')}</button></div>
            <iframe id="labFrame" title="Web page preview" sandbox="allow-scripts allow-modals allow-forms allow-popups"></iframe></div>
        </div>
      </div>
    </section>
  </div>
  <footer class="lab-status" id="labStatus">
    <span id="stLang"></span><span id="stRun" class="st-run"></span><span class="spring"></span><span id="stPos"></span><span id="stSave" class="hide-sm"></span>
  </footer>
  <dialog class="lab-dlg" id="labDlg"></dialog>
  <div class="lab-toast" id="labToast" role="status" hidden></div>
</div>`;
    const $ = (id) => root.querySelector('#' + id);
    const lab = root.querySelector('.lab');
    const panel = $('labPanel'), out = $('labOut'), termBox = $('labTermBox'), stdinBox = $('labStdin'), frame = $('labFrame'), dlg = $('labDlg');
    stdinBox.value = ws.stdin;

    /* ----- persistence ----- */
    let saveT = 0;
    const persist = () => {
      clearTimeout(saveT); saveT = 0;
      try { g.localStorage.setItem('dsalab:ws', JSON.stringify(ws)); $('stSave').textContent = 'Saved in this browser'; $('stSave').classList.remove('bad'); }
      catch (e) { $('stSave').textContent = 'Not saved: browser storage is full or blocked — download your files'; $('stSave').classList.add('bad'); }
    };
    const saveSoon = () => { $('stSave').textContent = 'Saving…'; clearTimeout(saveT); saveT = setTimeout(persist, 500); };
    const saveSettings = () => U.store.set('labSettings', S);

    /* ----- toast ----- */
    function toast(msg, kind) {
      const t = $('labToast');
      t.textContent = msg; t.className = 'lab-toast' + (kind ? ' ' + kind : ''); t.hidden = false;
      clearTimeout(toastT); toastT = setTimeout(() => (t.hidden = true), 3200);
    }

    /* ----- terminal ----- */
    const term = (() => {
      let buf = [], raf = 0, size = 0, capped = false, lastNL = true;
      const LIMIT = 500000;
      function flush() {
        raf = 0;
        const stick = termBox.scrollHeight - termBox.scrollTop - termBox.clientHeight < 48;
        const frag = document.createDocumentFragment();
        const f = active(), loc = f ? new RegExp(`${reEsc(f.name)}(?::(\\d+)(?::(\\d+))?|\\((\\d+),(\\d+)\\)|", line (\\d+)| on line (\\d+))`, 'g') : null;
        for (const [cls, s] of buf) {
          const sp = document.createElement('span'); if (cls) sp.className = cls;
          if (loc && cls && cls !== 't-cmd' && cls !== 't-info' && loc.test(s)) {
            loc.lastIndex = 0; let last = 0, m;
            while ((m = loc.exec(s))) {
              sp.append(s.slice(last, m.index));
              const ln = +(m[1] || m[3] || m[5] || m[6]), col = +(m[2] || m[4] || 0);
              const a = U.h('a', { class: 't-loc', href: '#', 'data-ln': ln, 'data-col': col, title: 'Go to line ' + ln, text: m[0] });
              sp.append(a); last = loc.lastIndex;
            }
            sp.append(s.slice(last));
          } else sp.textContent = s;
          frag.append(sp);
        }
        buf = [];
        out.append(frag);
        if (stick) termBox.scrollTop = termBox.scrollHeight;
      }
      function write(cls, s) {
        if (s == null || s === '') return;
        s = String(s).replace(/\x1b\[[0-9;?]*[A-Za-z]/g, '').replace(/\r\n/g, '\n');
        if (cls === 't-err' || cls === 't-warn') errText += s;
        if (capped) return;
        size += s.length;
        if (size > LIMIT) {
          capped = true; buf.push(['t-warn', '\n[The program printed more than 500 KB, so it was stopped.]\n']);
          if (running) R.stop();
        } else {
          const lastB = buf[buf.length - 1];
          if (lastB && lastB[0] === cls) lastB[1] += s; else buf.push([cls, s]);
        }
        lastNL = s.endsWith('\n');
        if (panel.dataset.tab !== 'term' && !(panel.dataset.tab === 'in' && !narrow())) panel.querySelector('[data-t="term"]').classList.add('unread');
        if (!raf) raf = requestAnimationFrame(flush);
      }
      return {
        out: (s) => write('', s), err: (s) => write('t-err', s), warn: (s) => write('t-warn', s), info: (s) => write('t-info', s), cmd: (s) => write('t-cmd', s),
        nl() { if (!lastNL) write('', '\n'); },
        clear() { buf = []; out.textContent = ''; size = 0; capped = false; lastNL = true; },
        reset() { size = 0; capped = false; },
        flush() { if (raf) { cancelAnimationFrame(raf); flush(); } },
      };
    })();
    const io = { out: term.out, err: term.err, warn: term.warn, info: term.info };

    /* ----- explorer ----- */
    function renderFiles() {
      const ul = $('labFiles');
      ul.innerHTML = '';
      const files = [...ws.files].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
      if (!files.length) ul.innerHTML = '<li class="lab-empty">No files yet. Press + to make one.</li>';
      for (const f of files) {
        const on1 = f.name === ws.active;
        ul.append(U.h('li', { class: 'lab-file' + (on1 ? ' on' : ''), 'data-name': f.name, title: f.name, tabindex: '0', 'aria-current': on1 ? 'true' : null },
          U.h('span', { class: 'fbadge', html: badge(f.name) }), U.h('span', { class: 'fn', text: f.name }),
          U.h('button', { type: 'button', class: 'lb xs', 'data-fa': 'rename', title: 'Rename', 'aria-label': 'Rename ' + f.name, html: ic('pencil') }),
          U.h('button', { type: 'button', class: 'lb xs', 'data-fa': 'delete', title: 'Delete', 'aria-label': 'Delete ' + f.name, html: ic('trash') })));
      }
      $('labCount').textContent = ws.files.length;
    }
    function renderTabs() {
      const bar = $('labTabs');
      ws.open = ws.open.filter((n) => byName(n));
      bar.innerHTML = '';
      for (const n of ws.open) {
        const on1 = n === ws.active;
        bar.append(U.h('div', { class: 'lab-tab' + (on1 ? ' on' : ''), role: 'tab', 'aria-selected': on1 ? 'true' : 'false', 'data-name': n, title: n, tabindex: on1 ? '0' : '-1' },
          U.h('span', { class: 'fbadge', html: badge(n) }), U.h('span', { class: 'tn', text: n }),
          U.h('button', { type: 'button', class: 'x', 'data-x': '1', title: 'Close', 'aria-label': 'Close ' + n, html: ic('x') })));
      }
      if (!ws.open.length) bar.append(U.h('span', { class: 'lab-notabs', text: 'No file open' }));
      const t = bar.querySelector('.lab-tab.on'); if (t) t.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
    function uniqueName(name) {
      if (!byName(name)) return name;
      const dot = name.lastIndexOf('.'), base = dot > 0 ? name.slice(0, dot) : name, ext = dot > 0 ? name.slice(dot) : '';
      for (let i = 2; ; i++) { const n = `${base}-${i}${ext}`; if (!byName(n)) return n; }
    }
    function addFile(name, code, open) {
      const f = { name: uniqueName(name), code: code || '' };
      ws.files.push(f);
      if (open !== false) openFile(f.name, true); else renderFiles();
      saveSoon();
      return f;
    }
    function openFile(name, focus) {
      const f = byName(name); if (!f) return;
      if (!ws.open.includes(name)) {
        const i = ws.open.indexOf(ws.active);
        ws.open.splice(i < 0 ? ws.open.length : i + 1, 0, name);
      }
      ws.active = name;
      if (editor) editor.show(f, focus);
      renderTabs(); renderFiles(); updateBar(); saveSoon();
      if (narrow() && lab.dataset.files === '1') lab.dataset.files = '0';
    }
    function closeTab(name) {
      const i = ws.open.indexOf(name); if (i < 0) return;
      ws.open.splice(i, 1);
      if (ws.active === name) {
        ws.active = ws.open[Math.min(i, ws.open.length - 1)] || null;
        if (editor) editor.show(active(), false);
      }
      renderTabs(); renderFiles(); updateBar(); saveSoon();
    }
    function renameFile(f, nu) {
      nu = nu.trim();
      if (nu === f.name) return null;
      if (!validName(nu)) return 'Use letters, digits, spaces, dots, dashes or underscores (up to 80 characters).';
      if (ws.files.some((x) => x !== f && x.name.toLowerCase() === nu.toLowerCase())) return `There is already a file called ${nu}.`;
      const old = f.name;
      f.name = nu;
      ws.open = ws.open.map((n) => (n === old ? nu : n));
      if (ws.active === old) ws.active = nu;
      if (previewOf === old) previewOf = nu;
      if (editor) editor.renamed(f);
      renderTabs(); renderFiles(); updateBar(); saveSoon();
      return null;
    }
    function deleteFile(f) {
      if (!g.confirm(`Delete ${f.name}? This cannot be undone.`)) return;
      ws.files = ws.files.filter((x) => x !== f);
      const wasActive = ws.active === f.name;
      ws.open = ws.open.filter((n) => n !== f.name);
      if (editor) editor.remove(f);
      if (wasActive) { ws.active = ws.open[0] || null; if (editor) editor.show(active(), false); }
      if (previewOf === f.name) previewOf = null;
      renderTabs(); renderFiles(); updateBar(); saveSoon();
    }
    function startRename(f) {
      const li = $('labFiles').querySelector(`li[data-name="${CSS.escape(f.name)}"]`); if (!li) return;
      const inp = U.h('input', { class: 'lab-rn', value: f.name, spellcheck: 'false', 'aria-label': 'New name for ' + f.name });
      li.querySelector('.fn').replaceWith(inp);
      li.classList.add('editing');
      const dot = f.name.lastIndexOf('.');
      inp.focus(); inp.setSelectionRange(0, dot > 0 ? dot : f.name.length);
      let done = false;
      const finish = (ok) => {
        if (done) return; done = true;
        const err = ok ? renameFile(f, inp.value) : null;
        if (err) toast(err, 'bad');
        renderFiles();
      };
      inp.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); finish(true); } else if (e.key === 'Escape') { e.preventDefault(); finish(false); } });
      inp.addEventListener('blur', () => finish(true));
      inp.addEventListener('click', (e) => e.stopPropagation());
    }

    /* ----- toolbar / status ----- */
    function runtimeLabel(lang) {
      if (!lang) return '';
      if (lang.run === 'remote' || (lang.run === 'python' && S.pyRemote)) {
        if (S.backend === 'piston') return 'your Piston server';
        if (S.backend === 'godbolt' && lang.godbolt) return 'Compiler Explorer';
        return 'Wandbox (online)';
      }
      return { js: 'browser · Web Worker', ts: 'browser · TypeScript', web: 'browser · live preview', python: 'browser · Pyodide', ruby: 'browser · ruby.wasm', r: 'browser · webR', sql: 'browser · SQLite', none: 'not runnable' }[lang.run] || '';
    }
    let compFor = null;
    async function fillCompilers(lang) {
      const wrap = $('labCompWrap'), sel = $('labComp');
      const remote = lang && (lang.run === 'remote' || (lang.run === 'python' && S.pyRemote)) && (S.backend === 'auto' || S.backend === 'wandbox' || (S.backend === 'godbolt' && !lang.godbolt)) && lang.wandbox;
      if (!remote) { wrap.hidden = true; compFor = null; return; }
      wrap.hidden = false;
      if (compFor === lang.id) return;
      compFor = lang.id;
      sel.innerHTML = '';
      sel.add(new Option('Latest compiler', ''));
      sel.value = '';
      try {
        const list = await R.compilersFor(lang);
        if (compFor !== lang.id) return;
        list.slice(0, 60).forEach((c) => sel.add(new Option(`${c.display || c.name} ${c.version}`.trim(), c.name)));
        if (S.compilers[lang.id] && list.some((c) => c.name === S.compilers[lang.id])) sel.value = S.compilers[lang.id];
        sel.title = list.length ? `${list.length} ${lang.name} compilers on wandbox.org` : `wandbox.org lists no ${lang.name} compiler right now`;
      } catch (e) {
        if (compFor === lang.id) sel.title = 'Could not reach wandbox.org: ' + e.message;
      }
    }
    function updateBar() {
      const f = active(), lang = f ? DSA.langOfFile(f.name) : null;
      $('labBadge').innerHTML = f ? badge(f.name) : '';
      $('labFname').textContent = f ? f.name : 'No file open';
      $('labRt').textContent = lang ? runtimeLabel(lang) : '';
      $('stLang').textContent = lang ? lang.name : '';
      $('labRun').disabled = !f;
      fillCompilers(lang);
      updatePos();
      clearTimeout(preloadT);
      if (lang && lang.run === 'python' && !S.pyRemote && !(navigator.connection && navigator.connection.saveData)) preloadT = setTimeout(() => { if (alive) R.preloadPython(); }, 1500);
    }
    function updatePos() {
      if (!editor || !active()) { $('stPos').textContent = ''; return; }
      const [ln, col] = editor.pos(), sel = editor.selection();
      $('stPos').textContent = `Ln ${ln}, Col ${col}${sel ? ` (${sel} selected)` : ''}`;
    }
    R.onStatus = (rt, state, ver) => {
      if (!alive || rt !== 'python') return;
      const f = active(); if (!f || DSA.langOfFile(f.name).run !== 'python' || S.pyRemote) return;
      $('labRt').textContent = state === 'loading' ? 'browser · Pyodide (loading…)' : state === 'ready' ? `browser · Python ${ver || ''} ready`.replace(/\s+ready$/, ' ready') : runtimeLabel(DSA.LANG.python);
    };
    function setRunning(v) {
      running = v;
      lab.classList.toggle('running', v);
      $('labRun').hidden = v; $('labStop').hidden = !v;
      $('stRun').textContent = v ? 'Running…' : '';
    }

    /* ----- panel ----- */
    function setTab(t) {
      panel.dataset.tab = t;
      panel.querySelectorAll('.lab-ptabs [data-t]').forEach((b) => b.setAttribute('aria-selected', b.dataset.t === t ? 'true' : 'false'));
      if (t === 'term') panel.querySelector('[data-t="term"]').classList.remove('unread');
      if (t === 'in' && !narrow()) panel.querySelector('[data-t="term"]').classList.remove('unread');
      if (t === 'prev' && !previewOf) { const h = ws.files.find((f) => DSA.langOfFile(f.name).id === 'html'); if (h) preview(h); }
      if (panel.classList.contains('folded')) unfold();
    }
    function setPanelH(h) {
      const work = $('labWork').getBoundingClientRect().height;
      const max = Math.max(140, work - 120);
      h = U.clamp(Math.round(h), 120, max);
      panel.style.height = h + 'px';
      S.panelH = h;
    }
    function fold() { panel.classList.add('folded'); }
    function unfold() { panel.classList.remove('folded'); }
    if (S.panelH) setPanelH(S.panelH);

    /* ----- running ----- */
    const refersTo = (html, name) => new RegExp(`(?:src|href)\\s*=\\s*["'](?:\\./)?${reEsc(name)}["']`, 'i').test(html);
    function webTarget(f, lang) {
      if (lang.id === 'html') return f;
      if (lang.id !== 'css' && lang.id !== 'javascript') return null;
      const htmls = ws.files.filter((x) => DSA.langOfFile(x.name).id === 'html');
      return htmls.find((h) => refersTo(h.code, f.name)) || (lang.id === 'css' ? htmls[0] || null : null);
    }
    const BRIDGE = '<script>(function(){var P=parent,f=function(x){if(typeof x==="string")return x;if(x instanceof Error)return x.name+": "+x.message;try{var s=JSON.stringify(x);return s===undefined?String(x):s}catch(e){return String(x)}},s=function(t,a){try{P.postMessage({__lab:1,t:t,s:[].map.call(a,f).join(" ")},"*")}catch(e){}};["log","info","debug"].forEach(function(k){var o=console[k];console[k]=function(){s("out",arguments);o.apply(console,arguments)}});["warn","error"].forEach(function(k){var o=console[k];console[k]=function(){s(k==="warn"?"warn":"err",arguments);o.apply(console,arguments)}});addEventListener("error",function(e){s("err",[e.message+(e.lineno?" (line "+e.lineno+")":"")])});addEventListener("unhandledrejection",function(e){s("err",["Unhandled promise rejection: "+f(e.reason)])});})();<\/script>';
    function buildPage(h) {
      let html = h.code;
      html = html.replace(/<link\b[^>]*>/gi, (tag) => {
        if (!/rel\s*=\s*["']?stylesheet/i.test(tag)) return tag;
        const m = tag.match(/href\s*=\s*["']([^"']+)["']/i);
        const f = m && byName(m[1].replace(/^\.\//, ''));
        return f ? `<style data-file="${U.esc(f.name)}">\n${f.code.replace(/<\/style/gi, '<\\/style')}\n</style>` : tag;
      });
      html = html.replace(/<script\b([^>]*?)\bsrc\s*=\s*["']([^"']+)["']([^>]*)>\s*<\/script>/gi, (tag, a, src, b) => {
        const f = byName(src.replace(/^\.\//, ''));
        return f ? `<script${a}${b} data-file="${U.esc(f.name)}">\n${f.code.replace(/<\/script/gi, '<\\/script')}\n</script>` : tag;
      });
      if (/<head\b[^>]*>/i.test(html)) return html.replace(/<head\b[^>]*>/i, (m) => m + BRIDGE);
      if (/<html\b[^>]*>/i.test(html)) return html.replace(/<html\b[^>]*>/i, (m) => m + BRIDGE);
      return BRIDGE + html;
    }
    function preview(h, announce) {
      previewOf = h.name;
      $('labPrevName').textContent = h.name;
      frame.srcdoc = buildPage(h);
      if (announce) {
        setTab('prev');
        if (S.clearOnRun) term.clear();
        term.cmd(`$ open ${h.name}\n`); term.info('The page is in the Preview tab; console.log output appears here.\n');
      }
    }
    on(g, 'message', (e) => {
      if (e.source !== frame.contentWindow || !e.data || e.data.__lab !== 1) return;
      (e.data.t === 'err' ? term.err : e.data.t === 'warn' ? term.warn : term.out)(String(e.data.s) + '\n');
    });

    async function run() {
      if (running) return;
      const f = active();
      if (!f) { toast('Open or create a file first.'); return; }
      persist();
      const lang = DSA.langOfFile(f.name);
      const page = webTarget(f, lang);
      if (page) { preview(page, true); return; }
      if (lang.run === 'web') { setTab('term'); term.nl(); term.info(`A stylesheet needs an HTML page to show it. Make index.html with <link rel="stylesheet" href="${f.name}"> and run that.\n`); return; }
      if (lang.run === 'none') { setTab('term'); term.nl(); term.info(`${f.name} is a ${lang.name} file, so there is nothing to run. Open a program such as main.c or main.py.\n`); return; }
      setRunning(true);
      if (narrow() || panel.dataset.tab === 'prev') setTab('term');
      unfold();
      if (S.clearOnRun) term.clear(); else term.nl();
      term.cmd('$ ' + DSA.cmdLine(lang, f.name) + '\n');
      const stdin = stdinBox.value;
      if (!stdin.trim() && READS.test(f.code)) term.warn('This program reads input, but the Input box is empty. Type the input there (one value per line) before you press Run.\n');
      if (editor) editor.markers(f, []);
      errText = '';
      runT0 = performance.now();
      tick = setInterval(() => { $('stRun').textContent = `Running… ${((performance.now() - runT0) / 1000).toFixed(1)} s`; }, 200);
      let code = 0;
      try {
        code = await R.run({ lang, name: f.name, code: f.code, stdin, settings: S, compiler: S.compilers[lang.id] || '' }, io);
      } catch (e) {
        const msg = String((e && e.message) || e);
        if (e && e.name === 'AbortError') { term.nl(); term.warn(R._stopped ? 'Stopped.\n' : 'The compiler service took too long to answer. Try again in a moment.\n'); code = 130; }
        else {
          term.nl(); term.err(msg + '\n');
          if (location.protocol === 'file:' && lang.run !== 'remote') term.info('Pages opened from a file on disk cannot start the in-browser runtimes. Serve the folder over http:// (see README.md).\n');
          else if (/Failed to fetch|NetworkError|Load failed|could not download|download failed|HTTP 5\d\d/i.test(msg)) {
            term.info(lang.run === 'remote'
              ? `Could not reach the online compiler. Check your internet connection${lang.godbolt ? ', or choose Compiler Explorer in Settings' : ''}. If you are offline, Python and JavaScript still run here.\n`
              : 'The language runtime could not be downloaded. It needs an internet connection the first time; afterwards your browser keeps a copy.\n');
          }
          code = 1;
        }
      } finally {
        clearInterval(tick);
        term.flush();
        const secs = ((performance.now() - runT0) / 1000).toFixed(2);
        term.nl();
        if (code === 0) term.info(`[Finished in ${secs} s]\n`);
        else if (code === 137 || code === 130) term.warn(`[Stopped after ${secs} s]\n`);
        else term.warn(`[Exited with code ${code} after ${secs} s]\n`);
        setRunning(false);
        if (editor && alive && byName(f.name) === f) editor.markers(f, diagnostics(errText, f.name));
      }
    }
    function stop() { if (running) R.stop(); }

    /* ----- dialogs ----- */
    function openDialog(html, cls) {
      dlg.className = 'lab-dlg ' + (cls || '');
      dlg.innerHTML = `<form method="dialog" class="dlg-in">${html}</form>`;
      if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
      return dlg.querySelector('form');
    }
    const closeDialog = () => { if (dlg.open) dlg.close(); };
    on(dlg, 'click', (e) => { if (e.target === dlg) closeDialog(); });

    function newFileDialog() {
      const langs = DSA.LANGS.filter((l) => l.file);
      const f = openDialog(`
        <h2>New file</h2>
        <label class="dfld"><span>File name</span><input id="nfName" required spellcheck="false" autocomplete="off" value="${U.esc(uniqueName('main.py'))}"></label>
        <p class="dhint">The extension picks the language. Or choose one:</p>
        <div class="nf-grid" id="nfGrid">${langs.map((l) => `<button type="button" class="nf" data-l="${l.id}">${badge(l.file)}<span>${U.esc(l.name)}</span></button>`).join('')}
          <button type="button" class="nf" data-l="web"><span class="fi" style="--fc:#ef6a3a">&lt;&gt;</span><span>Web project</span></button></div>
        <label class="dchk"><input type="checkbox" id="nfTpl" checked> Start with a small example program</label>
        <p class="derr" id="nfErr" hidden></p>
        <div class="dfoot"><button class="btn ghost" value="cancel" formnovalidate>Cancel</button><button class="btn primary" id="nfOk" value="ok">Create</button></div>`, 'narrow');
      const name = f.querySelector('#nfName'), grid = f.querySelector('#nfGrid'), err = f.querySelector('#nfErr');
      let web = false, ext = '.py';   // used when the typed name has no extension
      const mark = () => {
        if (name.value.includes('.')) ext = name.value.slice(name.value.lastIndexOf('.'));
        const id = web ? 'web' : DSA.langOfFile(name.value.includes('.') ? name.value : 'x' + ext).id;
        grid.querySelectorAll('.nf').forEach((b) => b.classList.toggle('on', b.dataset.l === id));
      };
      grid.addEventListener('click', (e) => {
        const b = e.target.closest('.nf'); if (!b) return;
        web = b.dataset.l === 'web';
        name.value = web ? uniqueName('index.html') : uniqueName(DSA.LANG[b.dataset.l].file);
        name.disabled = web; mark(); err.hidden = true;
      });
      name.addEventListener('input', () => { web = false; mark(); err.hidden = true; });
      mark();
      name.focus(); name.select();
      f.addEventListener('submit', (e) => {
        if (e.submitter && e.submitter.value === 'cancel') return;
        const tpl = f.querySelector('#nfTpl').checked;
        if (web) {
          const T = DSA.TEMPLATES, hName = uniqueName('index.html'), sfx = hName.replace(/^index|\.html$/g, '');
          const cName = uniqueName(`style${sfx}.css`), jName = uniqueName(`script${sfx}.js`);
          const html = tpl ? T.html.replace('style.css', cName).replace('script.js', jName) : `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="utf-8">\n  <link rel="stylesheet" href="${cName}">\n</head>\n<body>\n\n  <script src="${jName}"></script>\n</body>\n</html>\n`;
          addFile(cName, tpl ? T.css : '', false); addFile(jName, tpl ? T.webjs : '', false);
          addFile(hName, html);
          return;
        }
        let n = name.value.trim();
        if (n && !n.includes('.')) n += ext;
        if (!validName(n)) { e.preventDefault(); err.textContent = 'Use letters, digits, spaces, dots, dashes or underscores, and end with an extension such as .py or .c'; err.hidden = false; return; }
        if (byName(n)) { e.preventDefault(); err.textContent = `There is already a file called ${n}.`; err.hidden = false; return; }
        const lang = DSA.langOfFile(n);
        addFile(n, tpl && lang.tpl ? lang.tpl : '');
      });
    }

    function settingsDialog() {
      const f = openDialog(`
        <h2>Settings</h2>
        <fieldset><legend>Where compiled languages run</legend>
          <label class="dradio"><input type="radio" name="backend" value="auto"> <span><b>Automatic</b> — Wandbox, and Compiler Explorer if Wandbox is down (C, C++, Rust, Go)</span></label>
          <label class="dradio"><input type="radio" name="backend" value="wandbox"> <span><b>Wandbox only</b> (wandbox.org)</span></label>
          <label class="dradio"><input type="radio" name="backend" value="godbolt"> <span><b>Compiler Explorer</b> (godbolt.org) for C, C++, Rust and Go</span></label>
          <label class="dradio"><input type="radio" name="backend" value="piston"> <span><b>My own Piston server</b></span></label>
          <label class="dfld" id="stPiston"><span>Piston execute URL</span><input name="pistonUrl" type="url" placeholder="https://your-server/api/v2/execute" spellcheck="false"></label>
          <label class="dchk"><input type="checkbox" name="pyRemote"> Run Python on the online compiler instead of in the browser</label>
          <p class="dhint">Code you run on an online compiler is sent to that service. Don't paste passwords or other secrets into programs you run there.</p>
        </fieldset>
        <fieldset><legend>Editor</legend>
          <div class="drow">
            <label class="dfld sm"><span>Font size</span><select name="fontSize">${[12, 13, 14, 15, 16, 18, 20, 22].map((n) => `<option>${n}</option>`).join('')}</select></label>
            <label class="dfld sm"><span>Tab size</span><select name="tabSize"><option>2</option><option>4</option><option>8</option></select></label>
          </div>
          <label class="dchk"><input type="checkbox" name="wrap"> Wrap long lines</label>
          <label class="dchk"><input type="checkbox" name="minimap"> Show the minimap</label>
          <label class="dchk"><input type="checkbox" name="simple"> Use the simple editor (lighter; good for phones and slow connections)</label>
          <label class="dchk"><input type="checkbox" name="clearOnRun"> Clear the terminal before each run</label>
        </fieldset>
        <fieldset><legend>Workspace</legend>
          <p class="dhint">Your files live in this browser's storage. Clearing site data deletes them, so download anything you want to keep.</p>
          <button type="button" class="btn danger sm" id="stReset">Reset the workspace to the starter files</button>
        </fieldset>
        <div class="dfoot"><button class="btn ghost" value="cancel" formnovalidate>Cancel</button><button class="btn primary" value="ok">Save</button></div>`);
      f.querySelector(`[name="backend"][value="${S.backend}"]`).checked = true;
      f.pistonUrl.value = S.pistonUrl; f.pyRemote.checked = S.pyRemote; f.fontSize.value = String(S.fontSize); f.tabSize.value = String(S.tabSize);
      f.wrap.checked = S.wrap; f.minimap.checked = S.minimap; f.simple.checked = S.simple; f.clearOnRun.checked = S.clearOnRun;
      const pist = () => { f.querySelector('#stPiston').hidden = f.querySelector('[name="backend"]:checked').value !== 'piston'; };
      f.addEventListener('change', pist); pist();
      f.querySelector('#stReset').addEventListener('click', () => {
        if (!g.confirm('Replace all your files with the starter files? Download them first if you want to keep them.')) return;
        closeDialog();
        ws.files.forEach((x) => editor && editor.remove(x));
        ws = defaultWS(); stdinBox.value = ws.stdin; previewOf = null;
        if (editor) editor.show(active(), true);
        renderFiles(); renderTabs(); updateBar(); persist(); toast('Workspace reset');
      });
      f.addEventListener('submit', (e) => {
        if (e.submitter && e.submitter.value === 'cancel') return;
        const backend = f.querySelector('[name="backend"]:checked').value, url = f.pistonUrl.value.trim();
        if (backend === 'piston' && !/^https?:\/\/\S+$/.test(url)) { e.preventDefault(); f.pistonUrl.focus(); toast('Enter the full URL of your Piston execute endpoint.', 'bad'); return; }
        const wasSimple = S.simple;
        Object.assign(S, { backend, pistonUrl: url, pyRemote: f.pyRemote.checked, fontSize: +f.fontSize.value, tabSize: +f.tabSize.value, wrap: f.wrap.checked, minimap: f.minimap.checked, simple: f.simple.checked, clearOnRun: f.clearOnRun.checked });
        saveSettings();
        compFor = null;
        if (wasSimple !== S.simple) startEditor(); else if (editor) editor.options(S);
        updateBar();
      });
    }

    async function shareDialog() {
      persist();
      const f = active();
      const form = openDialog(`
        <h2>Share a link</h2>
        <p class="dhint">The code travels inside the link itself, so nothing is uploaded anywhere. Anyone who opens it gets a copy in their own Code Lab.</p>
        <label class="dradio"><input type="radio" name="what" value="one" ${f ? 'checked' : 'disabled'}> <span>Only <b>${U.esc(f ? f.name : 'the open file')}</b></span></label>
        <label class="dradio"><input type="radio" name="what" value="all" ${f ? '' : 'checked'}> <span>All ${ws.files.length} files</span></label>
        <label class="dchk"><input type="checkbox" name="inp" ${stdinBox.value.trim() ? 'checked' : ''}> Include the Input box</label>
        <div class="dlink"><input id="shUrl" readonly aria-label="Share link"><button type="button" class="btn primary" id="shCopy">${ic('copy')}Copy</button></div>
        <p class="dhint" id="shNote"></p>
        <div class="dfoot"><button class="btn ghost" value="cancel">Close</button></div>`, 'narrow');
      const url = form.querySelector('#shUrl'), note = form.querySelector('#shNote');
      const make = async () => {
        const one = form.querySelector('[name="what"]:checked').value === 'one';
        const files = one && f ? [f] : ws.files;
        const data = await pack({ v: 1, f: files.map((x) => [x.name, x.code]), a: f && files.includes(f) ? f.name : files[0] && files[0].name, i: form.inp.checked ? stdinBox.value : undefined });
        url.value = location.href.split('#')[0] + '#/lab/s/' + data;
        const kb = (url.value.length / 1024).toFixed(1);
        note.textContent = url.value.length > 30000 ? `This link is long (${kb} KB). Some chat apps cut long links — share fewer files, or use Download instead.` : `Link length: ${kb} KB.`;
      };
      form.addEventListener('change', make);
      await make();
      form.querySelector('#shCopy').addEventListener('click', async (e) => {
        const ok = await U.copy(url.value);
        e.currentTarget.innerHTML = ic(ok ? 'check' : 'x') + (ok ? 'Copied' : 'Select and copy');
        if (!ok) url.select();
      });
      url.addEventListener('focus', () => url.select());
    }

    /* small pop-up menu (download) */
    function menu(anchor, items) {
      const old = lab.querySelector('.lab-menu'); if (old) { old.remove(); if (old.dataset.for === anchor.dataset.a) return; }
      const m = U.h('div', { class: 'lab-menu', role: 'menu', 'data-for': anchor.dataset.a });
      items.forEach((it) => m.append(U.h('button', { type: 'button', role: 'menuitem', html: ic(it.icon) + `<span>${U.esc(it.label)}</span>`, onclick: () => { m.remove(); it.run(); } })));
      lab.append(m);
      const r = anchor.getBoundingClientRect(), lr = lab.getBoundingClientRect();
      m.style.top = r.bottom - lr.top + 6 + 'px';
      m.style.right = Math.max(8, lr.right - r.right) + 'px';
      const close = (e) => { if (!m.contains(e.target) && e.target !== anchor && !anchor.contains(e.target)) { m.remove(); document.removeEventListener('pointerdown', close, true); } };
      document.addEventListener('pointerdown', close, true);
      offs.push(() => document.removeEventListener('pointerdown', close, true));
      const first = m.querySelector('button'); if (first) first.focus();
      m.addEventListener('keydown', (e) => { if (e.key === 'Escape') { m.remove(); anchor.focus(); } });
    }
    function downloadMenu(anchor) {
      persist();
      const f = active();
      const items = [];
      if (f) items.push({ icon: 'file', label: `Download ${f.name}`, run: () => download(f.name, new Blob([f.code], { type: 'text/plain;charset=utf-8' })) });
      if (ws.files.length) items.push({ icon: 'zip', label: `Download all ${ws.files.length} files (.zip)`, run: () => download('code-lab.zip', zip(ws.files)) });
      if (!items.length) { toast('There are no files to download.'); return; }
      menu(anchor, items);
    }

    /* ----- importing files ----- */
    async function importFiles(list) {
      let first = null, skipped = 0;
      for (const file of Array.from(list || [])) {
        if (file.size > 2e6) { skipped++; continue; }
        const text = await file.text();
        if (text.includes('\u0000')) { skipped++; continue; }
        const name = validName(file.name) ? file.name : file.name.replace(/[^\w\-. ()+#]/g, '_').replace(/^[. ]+|[. ]+$/g, '').slice(-80) || 'file.txt';
        const f = place(name, text);
        first = first || f;
      }
      if (first) openFile(first.name, true);
      if (skipped) toast(`${skipped} file(s) skipped: only text files up to 2 MB can be opened.`, 'bad');
    }
    /* Put incoming code into the workspace: reuse an identical file, overwrite an untouched
       starter file of the same name, otherwise keep both (main-2.py). */
    function place(name, code) {
      const ex = byName(name);
      if (ex && ex.code === code) return ex;
      if (ex && pristine(ex)) { ex.code = code; if (editor) editor.refresh(ex); saveSoon(); return ex; }
      return addFile(name, code, false);
    }
    function takeIncoming() {
      const inc = U.store.get('labIncoming', null);
      if (!inc || typeof inc.code !== 'string') return;
      U.store.set('labIncoming', null);
      const name = validName(String(inc.name || '')) ? inc.name : 'program.' + (inc.lang === 'python' ? 'py' : 'c');
      const f = place(name, inc.code);
      openFile(f.name, true);
      toast(`Opened ${f.name} from the simulation — press Run`);
    }
    async function takeShare(data) {
      try {
        const obj = await unpack(data);
        if (!obj || !Array.isArray(obj.f)) throw new Error('bad');
        let open = null, n = 0;
        for (const [name, code] of obj.f) {
          if (typeof name !== 'string' || typeof code !== 'string' || !validName(name)) continue;
          const f = place(name, code);
          if (name === obj.a || !open) open = f;
          n++;
        }
        if (typeof obj.i === 'string') { stdinBox.value = obj.i; ws.stdin = obj.i; }
        if (open) openFile(open.name, true);
        toast(n === 1 ? `Opened the shared file ${open.name}` : `Opened ${n} shared files`);
      } catch (e) { toast('This share link is damaged or incomplete.', 'bad'); }
      if (alive && history.replaceState) history.replaceState(null, '', '#/lab');
    }

    /* ----- events ----- */
    on(lab, 'click', (e) => {
      const loc = e.target.closest('.t-loc');
      if (loc) { e.preventDefault(); if (editor) editor.goto(+loc.dataset.ln, +loc.dataset.col || 1); return; }
      const b = e.target.closest('[data-a]'); if (!b || !lab.contains(b)) return;
      const a = b.dataset.a;
      if (a === 'run') run();
      else if (a === 'stop') stop();
      else if (a === 'files') lab.dataset.files = lab.dataset.files === '1' ? '0' : '1';
      else if (a === 'new') newFileDialog();
      else if (a === 'upload') $('labUpload').click();
      else if (a === 'settings') settingsDialog();
      else if (a === 'share') shareDialog();
      else if (a === 'download') downloadMenu(b);
      else if (a === 'clear') term.clear();
      else if (a === 'fold') panel.classList.toggle('folded');
      else if (a === 'reload') { const h = byName(previewOf) || ws.files.find((x) => DSA.langOfFile(x.name).id === 'html'); if (h) preview(h); }
      else if (a === 'popout') {
        const h = byName(previewOf) || ws.files.find((x) => DSA.langOfFile(x.name).id === 'html');
        if (!h) { toast('There is no HTML file to open.'); return; }
        const u = URL.createObjectURL(new Blob([buildPage(h)], { type: 'text/html' }));
        g.open(u, '_blank', 'noopener'); setTimeout(() => URL.revokeObjectURL(u), 60000);
      }
    });
    on($('labUpload'), 'change', (e) => { importFiles(e.target.files); e.target.value = ''; });
    on($('labFiles'), 'click', (e) => {
      const li = e.target.closest('li.lab-file'); if (!li) return;
      const f = byName(li.dataset.name); if (!f) return;
      const fa = e.target.closest('[data-fa]');
      if (fa && fa.dataset.fa === 'rename') startRename(f);
      else if (fa && fa.dataset.fa === 'delete') deleteFile(f);
      else if (!li.classList.contains('editing')) openFile(f.name, true);
    });
    on($('labFiles'), 'dblclick', (e) => { const li = e.target.closest('li.lab-file'); if (li && !e.target.closest('button')) { const f = byName(li.dataset.name); if (f) startRename(f); } });
    on($('labFiles'), 'keydown', (e) => {
      const li = e.target.closest('li.lab-file'); if (!li || e.target !== li) return;
      const f = byName(li.dataset.name); if (!f) return;
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openFile(f.name, true); }
      else if (e.key === 'F2') { e.preventDefault(); startRename(f); }
      else if (e.key === 'Delete') { e.preventDefault(); deleteFile(f); }
      else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); const n = e.key === 'ArrowDown' ? li.nextElementSibling : li.previousElementSibling; if (n) n.focus(); }
    });
    on($('labTabs'), 'click', (e) => {
      const t = e.target.closest('.lab-tab'); if (!t) return;
      if (e.target.closest('[data-x]')) closeTab(t.dataset.name); else openFile(t.dataset.name, true);
    });
    on($('labTabs'), 'auxclick', (e) => { const t = e.target.closest('.lab-tab'); if (t && e.button === 1) { e.preventDefault(); closeTab(t.dataset.name); } });
    on($('labTabs'), 'keydown', (e) => {
      const t = e.target.closest('.lab-tab'); if (!t) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { const n = e.key === 'ArrowRight' ? t.nextElementSibling : t.previousElementSibling; if (n && n.dataset.name) { openFile(n.dataset.name, false); const nt = $('labTabs').querySelector('.lab-tab.on'); if (nt) nt.focus(); } }
      else if (e.key === 'Delete') closeTab(t.dataset.name);
    });
    on(panel.querySelector('.lab-ptabs'), 'click', (e) => { const b = e.target.closest('[data-t]'); if (b) setTab(b.dataset.t); });
    on(stdinBox, 'input', () => { ws.stdin = stdinBox.value; saveSoon(); });
    on(stdinBox, 'keydown', (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); run(); } });
    on($('labComp'), 'change', (e) => {
      const f = active(); if (!f) return;
      S.compilers[DSA.langOfFile(f.name).id] = e.target.value; saveSettings();
    });
    on(document, 'keydown', (e) => {
      if (dlg.open || e.defaultPrevented) return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key === 'Enter') { e.preventDefault(); run(); }
      else if (mod && (e.key === 's' || e.key === 'S')) { e.preventDefault(); persist(); toast('Saved in this browser'); }
      else if (mod && (e.key === 'b' || e.key === 'B') && !e.target.closest('input, textarea')) { e.preventDefault(); lab.dataset.files = lab.dataset.files === '1' ? '0' : '1'; }
      else if (e.key === 'Escape' && running && !e.target.closest('.monaco-editor')) stop();
    });
    on(document, 'dsalab:theme', () => editor && editor.theme());
    on(g, 'pagehide', persist);
    on(g, 'resize', U.debounce(() => { if (S.panelH) setPanelH(S.panelH); }, 150));
    // drag & drop files into the lab
    on(lab, 'dragover', (e) => { if (e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files')) { e.preventDefault(); lab.classList.add('dropping'); } });
    on(lab, 'dragleave', (e) => { if (e.target === lab || !lab.contains(e.relatedTarget)) lab.classList.remove('dropping'); });
    on(lab, 'drop', (e) => { if (e.dataTransfer && e.dataTransfer.files.length) { e.preventDefault(); importFiles(e.dataTransfer.files); } lab.classList.remove('dropping'); });
    // panel splitter
    const split = $('labSplit');
    on(split, 'pointerdown', (e) => {
      e.preventDefault();
      split.setPointerCapture(e.pointerId);
      unfold();
      const y0 = e.clientY, h0 = panel.getBoundingClientRect().height;
      lab.classList.add('dragging');
      const move = (ev) => setPanelH(h0 - (ev.clientY - y0));
      const up = () => { split.removeEventListener('pointermove', move); split.removeEventListener('pointerup', up); split.removeEventListener('pointercancel', up); lab.classList.remove('dragging'); saveSettings(); };
      split.addEventListener('pointermove', move); split.addEventListener('pointerup', up); split.addEventListener('pointercancel', up);
    });
    on(split, 'keydown', (e) => {
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
      e.preventDefault(); unfold();
      setPanelH(panel.getBoundingClientRect().height + (e.key === 'ArrowUp' ? 24 : -24)); saveSettings();
    });

    const hooks = {
      edit(f) {
        saveSoon();
        if (previewOf && panel.dataset.tab === 'prev') {
          const h = byName(previewOf);
          if (h && (f === h || refersTo(h.code, f.name))) { clearTimeout(prevTimer); prevTimer = setTimeout(() => alive && preview(h), 600); }
        }
      },
      cursor: () => updatePos(),
      run: () => run(),
      save: () => { persist(); toast('Saved in this browser'); },
      toggleFiles: () => { lab.dataset.files = lab.dataset.files === '1' ? '0' : '1'; },
    };

    /* ----- editor start-up ----- */
    let edGen = 0;
    async function startEditor() {
      const gen = ++edGen;
      const host = $('labEd');
      if (editor) { editor.destroy(); editor = null; }
      if (S.simple) { editor = plainEditor(host, S, hooks); editor.show(active(), false); updatePos(); return; }
      host.innerHTML = '<div class="lab-edload"><div class="spin"></div><span>Loading the editor…</span></div>';
      try {
        const m = await loadMonaco();
        if (!alive || gen !== edGen) return;
        host.innerHTML = '';
        editor = monacoEditor(m, host, S, hooks);
      } catch (e) {
        if (!alive || gen !== edGen) return;
        editor = plainEditor(host, S, hooks);
        toast('The full editor could not be downloaded, so a simple editor is in use.', 'bad');
      }
      editor.show(active(), !narrow());
      updatePos();
    }

    renderFiles(); renderTabs(); updateBar(); setTab('term');
    term.info('Code Lab ready. Press Run (Ctrl+Enter) to run the open file. Type program input in the Input box.\n');
    if (location.protocol === 'file:') term.warn('This page was opened straight from a file on your disk. The simulations work, but browsers block the in-browser runtimes (Python, JavaScript, Ruby, R) on file:// pages. Serve the folder over http:// instead — see "Run it on your computer" in README.md.\n');
    startEditor();
    if (rest && rest.startsWith('s/')) takeShare(rest.slice(2));
    takeIncoming();

    const page = {
      receive: takeIncoming,
      run, stop,
      get files() { return ws.files; },
      destroy() {
        if (!alive) return;
        persist();
        alive = false;
        if (running) R.stop();
        clearInterval(tick); clearTimeout(prevTimer); clearTimeout(preloadT); clearTimeout(toastT);
        offs.forEach((fn) => fn());
        if (dlg.open) dlg.close();
        if (editor) editor.destroy();
        if (R.onStatus) R.onStatus = null;
        if (Lab.current === page) Lab.current = null;
      },
    };
    Lab.current = page;
    return page;
  };
  Lab.receive = () => { if (Lab.current) Lab.current.receive(); };
})(window);
