/* DSA Lab · app.js — router, sidebar, search, home and topic pages. */
(function (g) {
  'use strict';
  const DSA = g.DSA, U = DSA.U;
  const app = (DSA.app = {});
  const main = () => U.$('#main');
  const topicIcon = (c, cls) => `<svg class="ticon ${cls || ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${c.icon}</svg>`;

  /* ---------- progress (kept in this browser only) ---------- */
  app.seen = new Set(U.store.get('seen', []));
  app.visited = (id) => {
    if (app.seen.has(id)) return;
    app.seen.add(id); U.store.set('seen', [...app.seen]);
    const a = U.$(`.side-nav a[data-sim="${id}"]`); if (a) a.classList.add('seen');
    updateCounts();
  };
  app.done = (id) => app.visited(id);

  /* ---------- theme ---------- */
  function setTheme(t) {
    document.documentElement.dataset.theme = t;
    U.store.set('theme', t);
    const b = U.$('#themeBtn');
    if (b) { b.innerHTML = U.icon(t === 'dark' ? 'sun' : 'moon'); b.title = t === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'; }
    document.dispatchEvent(new CustomEvent('dsalab:theme', { detail: t }));
  }
  app.theme = () => document.documentElement.dataset.theme || 'dark';

  /* ---------- Code Lab hand-off ---------- */
  DSA.openInLab = (file) => {
    U.store.set('labIncoming', file);
    if (location.hash.startsWith('#/lab')) { if (DSA.Lab && DSA.Lab.receive) DSA.Lab.receive(); }
    else location.hash = '#/lab';
  };

  /* ---------- sidebar ---------- */
  function buildSidebar() {
    const nav = U.$('#sideNav');
    const open = new Set(U.store.get('openTopics', ['arrays']));
    nav.innerHTML = '';
    for (const c of DSA.cats) {
      if (!c.sims.length) continue;
      const det = U.h('details', { 'data-topic': c.id });
      if (open.has(c.id)) det.open = true;
      det.append(U.h('summary', { html: topicIcon(c) + `<span class="tt">${U.esc(c.title)}</span><span class="cnt" data-cnt="${c.id}"></span>` }));
      const ul = U.h('ul');
      for (const id of c.sims) {
        const s = DSA.sims[id];
        ul.append(U.h('li', null, U.h('a', { href: '#/sim/' + id, 'data-sim': id, class: app.seen.has(id) ? 'seen' : '' }, s.short || s.title)));
      }
      det.append(ul);
      det.addEventListener('toggle', () => {
        const ids = U.$$('#sideNav details[open]').map((d) => d.dataset.topic);
        U.store.set('openTopics', ids);
      });
      nav.append(det);
    }
    updateCounts();
  }
  function updateCounts() {
    for (const c of DSA.cats) {
      const el = U.$(`[data-cnt="${c.id}"]`);
      if (el) { const n = c.sims.filter((id) => app.seen.has(id)).length; el.textContent = n ? `${n}/${c.sims.length}` : c.sims.length; el.classList.toggle('some', n > 0); }
    }
    const p = U.$('#progress');
    if (p) {
      const all = DSA.sequence().length, n = DSA.sequence().filter((id) => app.seen.has(id)).length;
      p.innerHTML = `<span>${n} of ${all} explored</span><i style="--w:${all ? (n / all) * 100 : 0}%"></i>`;
    }
  }
  function markActive(id) {
    U.$$('.side-nav a.on').forEach((a) => a.classList.remove('on'));
    if (!id) return;
    const a = U.$(`.side-nav a[data-sim="${id}"]`);
    if (a) {
      a.classList.add('on');
      const det = a.closest('details'); if (det && !det.open) det.open = true;
      const box = U.$('.sidebar');
      const r = a.getBoundingClientRect(), br = box.getBoundingClientRect();
      if (r.top < br.top + 60 || r.bottom > br.bottom - 20) box.scrollTop += r.top - br.top - br.height / 3;
    }
  }

  /* ---------- search ---------- */
  function searchIndex() {
    return DSA.sequence().map((id) => {
      const s = DSA.sims[id], c = DSA.catById[s.cat];
      return { id, s, c, hay: [s.title, s.short, s.blurb, c.title, c.short, (s.tags || []).join(' ')].join(' ').toLowerCase() };
    });
  }
  function search(q) {
    q = q.trim().toLowerCase();
    if (!q) return [];
    const words = q.split(/\s+/);
    return (app.idx || (app.idx = searchIndex()))
      .map((r) => {
        if (!words.every((w) => r.hay.includes(w))) return null;
        const t = r.s.title.toLowerCase();
        return { r, score: (t.startsWith(q) ? 0 : t.includes(q) ? 1 : 2) };
      })
      .filter(Boolean).sort((a, b) => a.score - b.score).map((x) => x.r);
  }
  function wireSearch() {
    const inp = U.$('#q'), box = U.$('#qres');
    let sel = 0, res = [];
    const draw = () => {
      if (!inp.value.trim()) { box.hidden = true; return; }
      res = search(inp.value).slice(0, 8);
      box.hidden = false;
      box.innerHTML = res.length
        ? res.map((r, i) => `<a href="#/sim/${r.id}" class="${i === sel ? 'on' : ''}" role="option">${topicIcon(r.c)}<span><b>${U.esc(r.s.title)}</b><small>${U.esc(r.c.title)}</small></span></a>`).join('')
        : '<div class="none">No simulation matches “' + U.esc(inp.value) + '”.</div>';
    };
    inp.addEventListener('input', () => { sel = 0; draw(); });
    inp.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(sel + 1, res.length - 1); draw(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(sel - 1, 0); draw(); }
      else if (e.key === 'Enter' && res[sel]) { location.hash = '#/sim/' + res[sel].id; inp.value = ''; draw(); inp.blur(); }
      else if (e.key === 'Escape') { inp.value = ''; draw(); inp.blur(); }
    });
    inp.addEventListener('blur', () => setTimeout(() => (box.hidden = true), 160));
    inp.addEventListener('focus', draw);
    box.addEventListener('mousedown', (e) => e.preventDefault());
    box.addEventListener('click', () => { inp.value = ''; box.hidden = true; });
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k' && !e.target.closest('.monaco-editor')) { e.preventDefault(); inp.focus(); inp.select(); }
      else if (e.key === '/' && !e.target.closest('input,textarea,select,[contenteditable="true"],.monaco-editor')) { e.preventDefault(); inp.focus(); }
    });
  }

  /* ---------- pages ---------- */
  function home(el) {
    document.title = `${DSA.config.siteName} — ${DSA.config.tagline}`;
    const all = DSA.sequence();
    const last = U.store.get('last', null);
    const first = all[0];
    el.innerHTML = `
      <section class="hero">
        <div class="hero-text">
          <p class="kicker">Data structures &amp; algorithms, in motion</p>
          <h1>See every data structure <em>move</em>, one step at a time.</h1>
          <p class="lead">${all.length} interactive simulations covering the whole classic syllabus — arrays and linked lists through stacks, Polish notation, queues, trees, graphs, sorting, searching and hashing. Type your own input, then play, pause and step backwards through the algorithm while its pseudocode and variables update beside it.</p>
          <div class="cta">
            <a class="btn primary lg" href="#/sim/${last && DSA.sims[last] ? last : first}">${last && DSA.sims[last] ? 'Continue: ' + U.esc(DSA.sims[last].title) : 'Start with arrays'} ${U.icon('arrowR')}</a>
            <a class="btn lg" href="#/lab">${U.icon('terminal')} Open the Code Lab</a>
          </div>
          <div id="progress" class="progress"></div>
        </div>
        <figure class="hero-fig" aria-label="Live demo: insertion sort">
          <svg id="heroSvg" class="scene"></svg>
          <figcaption id="heroCap">Insertion sort, running live</figcaption>
        </figure>
      </section>
      <section class="howto" aria-label="How to use">
        <div><b>1</b><span><strong>Pick a topic</strong> from the list or press <kbd>/</kbd> to search.</span></div>
        <div><b>2</b><span><strong>Enter your own data</strong> — or roll the dice for a random input.</span></div>
        <div><b>3</b><span><strong>Step through it</strong> with <kbd>←</kbd> <kbd>→</kbd> and <kbd>Space</kbd>, watching the algorithm line and variables.</span></div>
        <div><b>4</b><span><strong>Read the C / Python</strong> and run it in the Code Lab.</span></div>
      </section>
      <section class="topics" aria-label="Topics">
        <h2>Topics</h2>
        <div class="tgrid">${DSA.cats.filter((c) => c.sims.length).map((c, i) => `
          <article class="tcard">
            <a class="tlink" href="#/topic/${c.id}">${topicIcon(c, 'big')}<span class="tnum">${String(i + 1).padStart(2, '0')}</span><h3>${U.esc(c.title)}</h3></a>
            <p>${U.esc(c.blurb)}</p>
            <div class="chips">${c.sims.slice(0, 6).map((id) => `<a href="#/sim/${id}" class="${app.seen.has(id) ? 'seen' : ''}">${U.esc(DSA.sims[id].short || DSA.sims[id].title)}</a>`).join('')}${c.sims.length > 6 ? `<a href="#/topic/${c.id}" class="more">+${c.sims.length - 6} more</a>` : ''}</div>
            <footer><span>${U.esc(c.schaum)}</span><span>${c.sims.length} simulation${c.sims.length > 1 ? 's' : ''}</span></footer>
          </article>`).join('')}
        </div>
      </section>
      <section class="labpromo">
        <div>
          <h2>A VS&nbsp;Code-style editor, in the browser</h2>
          <p>The Code Lab uses Monaco, the editor inside Visual Studio Code. Python, JavaScript, TypeScript, HTML/CSS, Ruby, R and SQL run right in your browser; C, C++, Java, Rust, Go, C#, PHP, Swift, Haskell and dozens more compile on a free online compiler service. Every simulation's C and Python program opens in it with one click.</p>
          <a class="btn primary" href="#/lab">${U.icon('terminal')} Start coding</a>
        </div>
        <ul class="langs">${['C', 'C++', 'Java', 'Python', 'JavaScript', 'TypeScript', 'HTML', 'CSS', 'Rust', 'Go', 'Ruby', 'R', 'C#', 'PHP', 'SQL', 'Swift', 'Haskell', 'Scala', 'Perl', 'Lua', 'Pascal', 'Bash'].map((l) => `<li>${l}</li>`).join('')}</ul>
      </section>`;
    updateCounts();
    heroDemo();
  }

  function heroDemo() {
    const svg = U.$('#heroSvg');
    if (!svg) return;
    const sc = new DSA.Scene(svg);
    let arr, frames, i = 0;
    const make = () => {
      arr = U.randList(9, 8, 99, true).map((v, k) => ({ id: 'h' + k, v }));
      frames = [];
      const a = arr.slice();
      frames.push({ a: a.slice(), hl: {} });
      for (let k = 1; k < a.length; k++) {
        let j = k;
        frames.push({ a: a.slice(), hl: { [j]: 'sel' } });
        while (j > 0 && a[j - 1].v > a[j].v) {
          frames.push({ a: a.slice(), hl: { [j]: 'sel', [j - 1]: 'cmp' } });
          [a[j - 1], a[j]] = [a[j], a[j - 1]]; j--;
          frames.push({ a: a.slice(), hl: { [j]: 'sel' } });
        }
        const done = {}; for (let q = 0; q <= k; q++) done[q] = done[q] || 'ok';
        frames.push({ a: a.slice(), hl: done });
      }
      const all = {}; a.forEach((_, q) => (all[q] = 'ok'));
      frames.push({ a: a.slice(), hl: all });
      i = 0;
    };
    make();
    const tick = () => {
      if (!document.body.contains(svg)) return;
      const f = frames[i];
      sc.render(DSA.V.bars('h', f.a, { w: 420, h: 170, hl: f.hl, idx: false }), { dur: 380, minW: 460, minH: 220 });
      i++;
      if (i >= frames.length) { setTimeout(() => { make(); tick(); }, 1600); return; }
      app.heroT = setTimeout(tick, 520);
    };
    clearTimeout(app.heroT);
    const reduce = g.matchMedia && g.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { i = frames.length - 1; const f = frames[i]; sc.render(DSA.V.bars('h', f.a, { w: 420, h: 170, hl: f.hl, idx: false }), { dur: 0, minW: 460, minH: 220 }); U.$('#heroCap').textContent = 'Insertion sort result (animation paused: reduced motion)'; return; }
    tick();
  }

  function topicPage(el, id) {
    const c = DSA.catById[id];
    document.title = `${c.title} — ${DSA.config.siteName}`;
    el.innerHTML = `
      <section class="topic-head">
        <nav class="crumbs"><a href="#/">Home</a><span>/</span><span>${U.esc(c.title)}</span></nav>
        <div class="th">${topicIcon(c, 'big')}<div><h1>${U.esc(c.title)}</h1><p class="blurb">${U.esc(c.blurb)}</p><span class="tag book">${U.icon('book')}${U.esc(c.schaum)}</span></div></div>
      </section>
      <ol class="simlist">${c.sims.map((sid, i) => { const s = DSA.sims[sid]; return `
        <li><a href="#/sim/${sid}" class="${app.seen.has(sid) ? 'seen' : ''}">
          <span class="n">${i + 1}</span>
          <span class="b"><b>${U.esc(s.title)}</b><small>${U.esc(s.blurb || '')}</small></span>
          <span class="x">${(s.cx || []).slice(0, 2).map(([k, v]) => `<i>${U.esc(k)} <code>${U.esc(v)}</code></i>`).join('')}</span>
          ${app.seen.has(sid) ? `<span class="ok">${U.icon('check')}</span>` : U.icon('arrowR')}
        </a></li>`; }).join('')}
      </ol>`;
  }

  function aboutPage(el) {
    document.title = `About — ${DSA.config.siteName}`;
    el.innerHTML = `<article class="prose">
      <nav class="crumbs"><a href="#/">Home</a><span>/</span><span>About</span></nav>
      <h1>About ${U.esc(DSA.config.siteName)}</h1>
      <p>${U.esc(DSA.config.siteName)} is a free, open learning site for data structures and algorithms. The simulations follow the topic order and notation of the classic data-structures syllabus (Lipschutz, <i>Schaum's Outline of Data Structures</i>): 1-based arrays, <code>Set K := K + 1</code> style pseudocode, and names such as <code>INFO</code>, <code>LINK</code>, <code>START</code>, <code>AVAIL</code>, <code>TOP</code>, <code>FRONT</code> and <code>REAR</code>. The pseudocode and programs on this site are written fresh for it; it is not affiliated with or endorsed by McGraw-Hill or the authors.</p>
      <h2>How the simulations work</h2>
      <p>Each operation runs instantly and records a snapshot at every step. The player then replays those snapshots, so you can pause, scrub and step backwards. Your inputs, progress and theme are stored only in this browser (local storage).</p>
      <h2>Keyboard shortcuts</h2>
      <ul><li><kbd>Space</kbd> play / pause, <kbd>←</kbd> <kbd>→</kbd> step, <kbd>Home</kbd> / <kbd>End</kbd> first / last step</li><li><kbd>/</kbd> or <kbd>Ctrl</kbd> <kbd>K</kbd> search simulations</li><li>In the Code Lab: <kbd>Ctrl</kbd> <kbd>Enter</kbd> run, <kbd>Ctrl</kbd> <kbd>S</kbd> save</li></ul>
      <h2>Code Lab services</h2>
      <p>The editor is <a href="https://microsoft.github.io/monaco-editor/" target="_blank" rel="noopener">Monaco</a>. In-browser runtimes: <a href="https://pyodide.org" target="_blank" rel="noopener">Pyodide</a> (Python), <a href="https://github.com/ruby/ruby.wasm" target="_blank" rel="noopener">ruby.wasm</a>, <a href="https://docs.r-wasm.org/webr/latest/" target="_blank" rel="noopener">webR</a> and <a href="https://sql.js.org" target="_blank" rel="noopener">sql.js</a>. Compiled languages are sent to the free <a href="https://wandbox.org" target="_blank" rel="noopener">Wandbox</a> compiler service, with <a href="https://godbolt.org" target="_blank" rel="noopener">Compiler Explorer</a> as a fallback for C, C++, Rust and Go. Code you run that way leaves your browser, so don't paste secrets into it.</p>
    </article>`;
  }

  function notFound(el) {
    el.innerHTML = `<article class="prose"><h1>Page not found</h1><p>That simulation doesn't exist (yet). <a href="#/">Back to all topics</a>.</p></article>`;
  }

  async function labPage(el, rest) {
    document.title = `Code Lab — ${DSA.config.siteName}`;
    el.innerHTML = '<div class="lab-loading"><div class="spin"></div><p>Loading the Code Lab…</p></div>';
    try {
      await U.loadCSS('assets/css/lab.css');
      await U.loadScript('assets/js/lab/languages.js');
      await U.loadScript('assets/js/lab/runners.js');
      await U.loadScript('assets/js/lab/ide.js');
      if (!el.isConnected) return;
      app.page = DSA.Lab.mount(el, rest);
    } catch (e) {
      el.innerHTML = `<article class="prose"><h1>The Code Lab could not load</h1><p>${U.esc(e.message)}. Check your connection and reload the page.</p></article>`;
    }
  }

  /* ---------- router ---------- */
  function route() {
    const raw = location.hash.replace(/^#\/?/, '');
    const parts = raw.split('/');
    const kind = parts[0] || '', id = parts[1] || '';
    if (app.page && app.page.destroy) { try { app.page.destroy(); } catch (e) { console.error(e); } }
    app.page = null;
    clearTimeout(app.heroT);
    const el = main();
    document.body.dataset.route = kind || 'home';
    document.body.classList.remove('drawer');
    el.innerHTML = '';
    markActive(null);
    if (!kind) home(el);
    else if (kind === 'sim' && DSA.sims[id]) {
      const s = DSA.sims[id];
      document.title = `${s.title} — ${DSA.config.siteName}`;
      app.page = new DSA.SimPage(s, el, app);
      U.store.set('last', id);
      markActive(id);
      app.visited(id);
    } else if (kind === 'topic' && DSA.catById[id]) topicPage(el, id);
    else if (kind === 'lab') labPage(el, parts.slice(1).join('/'));
    else if (kind === 'about') aboutPage(el);
    else notFound(el);
    U.$$('.topnav a').forEach((a) => a.classList.toggle('on', a.getAttribute('href') === '#/' + kind || (kind === '' && a.getAttribute('href') === '#/')));
    if (kind !== 'lab') g.scrollTo(0, 0);
    el.focus({ preventScroll: true });
  }

  function init() {
    setTheme(U.store.get('theme', g.matchMedia && g.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'));
    U.$('#themeBtn').addEventListener('click', () => setTheme(app.theme() === 'dark' ? 'light' : 'dark'));
    U.$('#menuBtn').addEventListener('click', () => document.body.classList.toggle('drawer'));
    U.$('#scrim').addEventListener('click', () => document.body.classList.remove('drawer'));
    U.$('#brandName').textContent = DSA.config.siteName;
    buildSidebar();
    wireSearch();
    g.addEventListener('hashchange', route);
    route();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})(window);
