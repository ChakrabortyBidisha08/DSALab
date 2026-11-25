/* DSA Lab · core/util.js — small helpers shared by every page.
   Everything lives on one global object, window.DSA, so the site works from any
   static host (or straight from disk) with no build step. */
(function (g) {
  'use strict';
  const DSA = (g.DSA = g.DSA || {});
  const U = (DSA.U = {});

  DSA.config = Object.assign({
    siteName: 'DSA Lab',
    tagline: 'Every data structure, animated step by step',
  }, DSA.config || {});

  U.$ = (s, r) => (r || document).querySelector(s);
  U.$$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  U.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ESC[c]);

  /* Messages may use **bold** and `code`. Input is escaped first, so values
     typed by students can never inject markup. */
  U.md = (s) => U.esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/`(.+?)`/g, '<code>$1</code>');

  U.h = function (tag, attrs, ...kids) {
    const el = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'text') el.textContent = v;
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat(3)) {
      if (kid == null || kid === false) continue;
      el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    }
    return el;
  };

  U.clone = typeof structuredClone === 'function'
    ? (o) => (o === undefined ? undefined : structuredClone(o))
    : (o) => (o === undefined ? undefined : JSON.parse(JSON.stringify(o)));

  class InputError extends Error {}
  U.InputError = InputError;
  U.fail = (msg) => { throw new InputError(msg); };

  /* Parse "5, 3 8 1" into numbers with friendly validation messages. */
  U.nums = (str, opt) => {
    const o = Object.assign({ min: 1, max: 16, lo: -999, hi: 999, int: true, name: 'values' }, opt);
    const parts = String(str == null ? '' : str).split(/[\s,;]+/).filter(Boolean);
    if (parts.length < o.min) U.fail(o.min === 1 ? `Enter at least one ${o.name.replace(/s$/, '')}.` : `Enter at least ${o.min} ${o.name}.`);
    if (parts.length > o.max) U.fail(`Use at most ${o.max} ${o.name} so the picture stays readable.`);
    return parts.map((t) => {
      const v = Number(t);
      if (!Number.isFinite(v) || (o.int && !Number.isInteger(v))) U.fail(`“${t}” is not a ${o.int ? 'whole ' : ''}number.`);
      if (v < o.lo || v > o.hi) U.fail(`Keep ${o.name} between ${o.lo} and ${o.hi}.`);
      return v;
    });
  };

  U.num = (v, o) => {
    const x = Number(v);
    const opt = Object.assign({ lo: -999, hi: 999, name: 'value', int: true }, o);
    if (String(v).trim() === '' || !Number.isFinite(x) || (opt.int && !Number.isInteger(x))) U.fail(`Enter a ${opt.int ? 'whole ' : ''}number for ${opt.name}.`);
    if (x < opt.lo || x > opt.hi) U.fail(`${opt.name} must be between ${opt.lo} and ${opt.hi}.`);
    return x;
  };

  /* Tokens that may be numbers or short words (for keys such as "A B C"). */
  U.tokens = (str, opt) => {
    const o = Object.assign({ min: 1, max: 16, maxLen: 4, name: 'items' }, opt);
    const parts = String(str == null ? '' : str).split(/[\s,;]+/).filter(Boolean);
    if (parts.length < o.min) U.fail(`Enter at least ${o.min} ${o.name}.`);
    if (parts.length > o.max) U.fail(`Use at most ${o.max} ${o.name}.`);
    parts.forEach((t) => { if (t.length > o.maxLen) U.fail(`Keep each item to ${o.maxLen} characters (“${t}” is too long).`); });
    return parts.map((t) => (/^-?\d+$/.test(t) ? Number(t) : t));
  };

  U.rand = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
  U.shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  U.randList = (n, lo, hi, unique) => {
    if (unique && hi - lo + 1 >= n) {
      const pool = U.shuffle(U.range(hi - lo + 1).map((i) => i + lo));
      return pool.slice(0, n);
    }
    return U.range(n).map(() => U.rand(lo, hi));
  };
  U.range = (n) => Array.from({ length: Math.max(0, n) }, (_, i) => i);
  U.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  U.sum = (a) => a.reduce((s, x) => s + x, 0);

  let _id = 0;
  U.uid = (p) => (p || 'u') + (++_id).toString(36);

  U.store = {
    get(k, d) {
      try { const v = g.localStorage && g.localStorage.getItem('dsalab:' + k); return v == null ? d : JSON.parse(v); }
      catch (e) { return d; }
    },
    set(k, v) { try { g.localStorage && g.localStorage.setItem('dsalab:' + k, JSON.stringify(v)); } catch (e) { /* private mode */ } },
  };

  U.debounce = (fn, ms) => { let t; return function (...a) { clearTimeout(t); t = setTimeout(() => fn.apply(this, a), ms); }; };

  /* Load classic scripts in order (used to lazy-load the Code Lab). */
  const loaded = {};
  U.loadScript = (src) => loaded[src] || (loaded[src] = new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src; s.async = false;
    s.onload = () => res(); s.onerror = () => { delete loaded[src]; rej(new Error('Could not load ' + src)); };
    document.head.appendChild(s);
  }));
  U.loadCSS = (href) => loaded[href] || (loaded[href] = new Promise((res) => {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = href; l.onload = () => res(); l.onerror = () => res();
    document.head.appendChild(l);
  }));

  /* A very small syntax highlighter for the read-only code tabs (C, Python, …). */
  const KW = {
    c: 'auto break case char const continue default do double else enum extern float for goto if int long register return short signed sizeof static struct switch typedef union unsigned void volatile while bool true false NULL include define',
    py: 'and as assert break class continue def del elif else except False finally for from global if import in is lambda None nonlocal not or pass raise return True try while with yield print range len self',
  };
  U.highlight = (code, lang) => {
    const kw = new Set((KW[lang] || KW.c).split(' '));
    const re = lang === 'py'
      ? /(#[^\n]*)|("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_]\w*)/g
      : /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|<[a-z]+\.h>)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_]\w*)/g;
    let out = '', last = 0, m;
    while ((m = re.exec(code))) {
      out += U.esc(code.slice(last, m.index));
      const t = U.esc(m[0]);
      if (m[1]) out += `<span class="tk-c">${t}</span>`;
      else if (m[2]) out += `<span class="tk-s">${t}</span>`;
      else if (m[3]) out += `<span class="tk-n">${t}</span>`;
      else if (kw.has(m[4])) out += `<span class="tk-k">${t}</span>`;
      else if (code[re.lastIndex] === '(') out += `<span class="tk-f">${t}</span>`;
      else out += t;
      last = re.lastIndex;
    }
    return out + U.esc(code.slice(last));
  };

  /* Pseudocode lines in the textbook's notation: keywords bold, [remarks] dimmed. */
  const PKW = /\b(Set|If|then|Else|Repeat|while|for|to|by|Return|Exit|Write|Read|Call|Print|and|or|not|End|of|loop|Structure|Algorithm|Procedure|Go)\b/g;
  U.pseudo = (line) => U.esc(line)
    .replace(/(^|[^\w\]])\[([A-Z][^\]]*)\]/g, '$1<span class="pc-r">[$2]</span>')
    .replace(PKW, '<b>$1</b>')
    .replace(/:=/g, '<span class="pc-o">:=</span>');

  U.copy = async (text) => {
    try { await navigator.clipboard.writeText(text); return true; }
    catch (e) {
      const ta = U.h('textarea', { style: { position: 'fixed', opacity: '0' } });
      ta.value = text; document.body.appendChild(ta); ta.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch (er) { ok = false; }
      ta.remove(); return ok;
    }
  };

  /* Inline SVG icons (stroke style). */
  const P = {
    play: '<path d="M7 4.5v15l12-7.5z" fill="currentColor" stroke="none"/>',
    pause: '<path d="M7 4.5h3.5v15H7zM13.5 4.5H17v15h-3.5z" fill="currentColor" stroke="none"/>',
    prev: '<path d="M18 5 8 12l10 7z" fill="currentColor" stroke="none"/><path d="M6 5v14"/>',
    next: '<path d="M6 5l10 7-10 7z" fill="currentColor" stroke="none"/><path d="M18 5v14"/>',
    first: '<path d="M5 5v14M19 5l-9 7 9 7z"/>',
    last: '<path d="M19 5v14M5 5l9 7-9 7z"/>',
    undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
    reset: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
    dice: '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1.3" fill="currentColor"/><circle cx="15" cy="15" r="1.3" fill="currentColor"/><circle cx="15" cy="9" r="1.3" fill="currentColor"/><circle cx="9" cy="15" r="1.3" fill="currentColor"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h8"/>',
    code: '<path d="m8 7-5 5 5 5M16 7l5 5-5 5"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    check: '<path d="m5 12 5 5 9-10"/>',
    arrowR: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    arrowL: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/>',
    terminal: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="m7 9 3 3-3 3M12 15h5"/>',
    file: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
    upload: '<path d="M12 21V9M7 14l5-5 5 5M5 3h14"/>',
    stop: '<rect x="6" y="6" width="12" height="12" rx="1.5" fill="currentColor" stroke="none"/>',
    files: '<path d="M15 3H7a2 2 0 0 0-2 2v12"/><path d="M19 7h-8a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    wrap: '<path d="M4 6h16M4 12h13a3 3 0 0 1 0 6h-4m2-3-2 3 2 3M4 18h5"/>',
    home: '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/>',
  };
  U.icon = (name, cls) => `<svg class="ic ${cls || ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || ''}</svg>`;
})(typeof window !== 'undefined' ? window : globalThis);
