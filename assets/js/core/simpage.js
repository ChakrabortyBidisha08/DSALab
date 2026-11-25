/* DSA Lab · core/simpage.js — registry + the standard simulation page.
   A simulation is a plain object passed to DSA.sim({...}):
     id, cat, title, blurb, schaum, cx (complexity rows), theory (HTML),
     algo: { name: [title, '1. …', '2. …'] }   textbook-style pseudocode
     controls: [...]                            inputs and operation buttons
     init(p)            → initial model state (plain data)
     ops: { name(S, p, R, page) }               mutate S and record steps with R.step()
     view(st, frame, page) → shape specs (or {specs, box, minW, minH})
     auto: 'run'        → algorithm-replay mode: re-run 'run' whenever inputs change */
(function (g) {
  'use strict';
  const DSA = g.DSA, U = DSA.U;

  DSA.cats = DSA.cats || [];
  DSA.catById = DSA.catById || {};
  DSA.sims = DSA.sims || {};
  DSA.code = DSA.code || {};
  DSA.topic = (c) => { DSA.cats.push(c); DSA.catById[c.id] = c; c.sims = c.sims || []; return c; };
  DSA.sim = (def) => {
    DSA.sims[def.id] = def;
    const c = DSA.catById[def.cat];
    if (c) c.sims.push(def.id);
    else if (typeof console !== 'undefined') console.warn('Unknown topic for', def.id);
    return def;
  };
  DSA.sequence = () => DSA.cats.flatMap((c) => c.sims);

  const fmtVar = (v) => {
    if (v === null) return 'NULL';
    if (Array.isArray(v)) return '[' + v.map((x) => (x === null ? '–' : V(x))).join(', ') + ']';
    return V(v);
  };
  const V = (x) => (typeof x === 'number' && !Number.isInteger(x) ? String(Math.round(x * 1000) / 1000) : String(x));

  class SimPage {
    constructor(def, mount, app) {
      this.d = def; this.app = app;
      this.ctrl = {}; this.history = []; this.S = null;
      mount.innerHTML = '';
      this.el = U.h('article', { class: 'sim', 'data-sim': def.id });
      mount.append(this.el);
      this.build();
      this.onKey = this.onKey.bind(this);
      document.addEventListener('keydown', this.onKey);
      if (typeof ResizeObserver !== 'undefined') { this.ro = new ResizeObserver(() => this.fit()); this.ro.observe(this.stage); }
      this.reset();
      if (def.mount) def.mount.call(def, this);
    }

    destroy() {
      document.removeEventListener('keydown', this.onKey);
      this.player.destroy();
      if (this.ro) this.ro.disconnect();
      clearTimeout(this.toastT);
      if (this.d.unmount) this.d.unmount.call(this.d, this);
    }

    /* ---------- layout ---------- */
    build() {
      const d = this.d, cat = DSA.catById[d.cat] || { id: '', title: '' };
      const head = U.h('header', { class: 'sim-head' },
        U.h('nav', { class: 'crumbs', 'aria-label': 'Breadcrumb' },
          U.h('a', { href: '#/' }, 'Home'), U.h('span', { 'aria-hidden': 'true' }, '/'),
          U.h('a', { href: '#/topic/' + cat.id }, cat.title)),
        U.h('h1', null, d.title),
        d.blurb ? U.h('p', { class: 'blurb' }, d.blurb) : null,
        U.h('div', { class: 'meta' },
          d.schaum ? U.h('span', { class: 'tag book', html: U.icon('book') + U.esc(d.schaum) }) : null,
          (d.cx || []).map(([k, v]) => U.h('span', { class: 'tag cx', html: U.esc(k) + ' <b>' + U.esc(v) + '</b>' }))));

      const controls = U.h('section', { class: 'controls', 'aria-label': 'Inputs and operations' });
      this.buildControls(controls);

      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'scene');
      svg.setAttribute('role', 'img');
      svg.setAttribute('aria-label', d.title + ' — animated diagram');
      this.stage = U.h('div', { class: 'stage' }, svg);
      this.toastEl = U.h('div', { class: 'toast', role: 'status', 'aria-live': 'assertive' });
      this.stage.append(this.toastEl);
      this.msgEl = U.h('div', { class: 'msg', 'aria-live': 'polite' });
      const pl = U.h('div');
      this.scene = new DSA.Scene(svg);
      this.scene.onClick = (key, e) => { if (d.click) d.click.call(d, key, this, e); };
      this.player = new DSA.Player(pl, { onFrame: (f, i, anim) => this.show(f, anim), onEnd: () => this.app && this.app.done && this.app.done(d.id) });

      this.algoTitle = U.h('div', { class: 'ptitle' });
      this.algoEl = U.h('ol', { class: 'pseudo' });
      this.algoBox = U.h('div', { class: 'pscroll' }, this.algoEl);
      this.varsEl = U.h('div', { class: 'vars' });
      this.tableEl = U.h('div', { class: 'trace' });
      this.tableTitle = U.h('h3', null, 'Trace table');
      this.tableWrap = U.h('div', { class: 'panel tracep', hidden: true }, this.tableTitle, this.tableEl);
      const side = U.h('aside', { class: 'side' },
        U.h('div', { class: 'panel algop' }, U.h('h3', null, 'Algorithm'), this.algoTitle, this.algoBox),
        U.h('div', { class: 'panel varp' }, U.h('h3', null, 'Variables'), this.varsEl),
        this.tableWrap);
      const col = U.h('div', { class: 'stagecol' }, this.stage, this.msgEl, pl);
      this.el.append(head, controls, U.h('div', { class: 'simgrid' }, col, side), this.buildTabs(), this.buildNav());
    }

    buildControls(box) {
      const d = this.d;
      const row = U.h('div', { class: 'crow' });
      box.append(row);
      for (const c of d.controls || []) {
        if (c.type === 'br') { box.append(U.h('div', { class: 'crow' })); continue; }
        const host = box.lastChild;
        if (c.type === 'btn') {
          const b = U.h('button', { type: 'button', class: 'btn ' + (c.kind || ''), title: c.title || null }, c.label);
          b.addEventListener('click', () => {
            if (c.op === 'reset') this.reset();
            else if (c.op === 'play') { this.player.go(0, false); this.player.play(); }
            else this.op(c.op);
          });
          host.append(b); continue;
        }
        if (c.type === 'sep') { host.append(U.h('span', { class: 'csep', 'aria-hidden': 'true' })); continue; }
        if (c.type === 'note') { host.append(U.h('span', { class: 'cnote', html: c.html || U.esc(c.text) })); continue; }
        const id = 'c-' + d.id + '-' + c.id;
        let input;
        if (c.type === 'select') {
          input = U.h('select', { id });
          for (const o of c.opts) { const [v, l] = Array.isArray(o) ? o : [o, o]; input.append(U.h('option', { value: v }, l)); }
          input.value = String(c.value);
        } else if (c.type === 'check') {
          input = U.h('input', { id, type: 'checkbox' });
          input.checked = !!c.value;
        } else {
          input = U.h('input', {
            id, type: c.type === 'num' ? 'number' : 'text', value: c.value == null ? '' : c.value,
            min: c.min, max: c.max, step: c.step, placeholder: c.ph || null, autocomplete: 'off', spellcheck: 'false',
            inputmode: c.type === 'num' ? 'numeric' : null, class: c.wide ? 'wide' : null,
          });
          if (c.w) input.style.width = c.w + 'px';
        }
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') { e.preventDefault(); if (c.enter) this.op(c.enter); else if (c.run || c.reset) this.reset(); }
        });
        input.addEventListener('change', () => { if (c.reset || c.run) this.reset(); });
        this.ctrl[c.id] = input;
        const fld = U.h('label', { class: 'fld ' + (c.type === 'check' ? 'chk ' : '') + (c.wide ? 'grow' : ''), for: id }, U.h('span', null, c.label), input);
        if (c.rand) {
          const dice = U.h('button', { type: 'button', class: 'ib', title: 'Random ' + c.label.toLowerCase(), 'aria-label': 'Random ' + c.label, html: U.icon('dice') });
          dice.addEventListener('click', (e) => { e.preventDefault(); input.value = c.rand(this.params(true)); this.reset(); });
          fld.append(dice);
        }
        if (c.presets) {
          const sel = U.h('select', { class: 'preset', 'aria-label': c.label + ' examples', title: 'Examples' },
            U.h('option', { value: '' }, 'Examples…'), c.presets.map(([v, l]) => U.h('option', { value: v }, l)));
          sel.addEventListener('change', () => { if (sel.value) { input.value = sel.value; sel.value = ''; this.reset(); } });
          fld.append(sel);
        }
        host.append(fld);
      }
      if (!d.auto && d.ops) {
        const last = box.lastChild;
        this.undoBtn = U.h('button', { type: 'button', class: 'btn ghost', title: 'Undo the last operation', html: U.icon('undo') + 'Undo' });
        this.undoBtn.addEventListener('click', () => this.undo());
        const rb = U.h('button', { type: 'button', class: 'btn ghost', title: 'Start again from the initial state', html: U.icon('reset') + 'Reset' });
        rb.addEventListener('click', () => this.reset());
        last.append(U.h('span', { class: 'cspring' }), this.undoBtn, rb);
      }
    }

    buildTabs() {
      const d = this.d, code = DSA.code[d.code || d.id] || {};
      const tabs = [['learn', 'Explanation']];
      if (code.c) tabs.push(['c', 'C program']);
      if (code.py) tabs.push(['py', 'Python program']);
      const bar = U.h('div', { class: 'tabbar', role: 'tablist' });
      const body = U.h('div', { class: 'tabbody', role: 'tabpanel' });
      const show = (k) => {
        U.$$('button', bar).forEach((b) => b.setAttribute('aria-selected', String(b.dataset.k === k)));
        body.innerHTML = '';
        if (k === 'learn') {
          body.append(U.h('div', { class: 'theory', html: d.theory || '<p>Use the controls above, then step through the animation.</p>' }));
          if (d.cx && d.cx.length) {
            body.append(U.h('table', { class: 'cxtable' },
              U.h('thead', null, U.h('tr', null, U.h('th', null, 'Operation / case'), U.h('th', null, 'Cost'))),
              U.h('tbody', null, d.cx.map(([a, b]) => U.h('tr', null, U.h('td', null, a), U.h('td', null, U.h('code', null, b)))))));
          }
        } else {
          const src = code[k], lang = k === 'c' ? 'c' : 'py';
          const fname = (d.file || d.id.replace(/-/g, '_')) + (k === 'c' ? '.c' : '.py');
          const copy = U.h('button', { type: 'button', class: 'btn ghost sm', html: U.icon('copy') + 'Copy' });
          copy.addEventListener('click', async () => { const ok = await U.copy(src); copy.innerHTML = U.icon(ok ? 'check' : 'x') + (ok ? 'Copied' : 'Copy failed'); setTimeout(() => (copy.innerHTML = U.icon('copy') + 'Copy'), 1600); });
          const open = U.h('button', { type: 'button', class: 'btn sm primary', html: U.icon('terminal') + 'Run in Code Lab' });
          open.addEventListener('click', () => { DSA.openInLab({ name: fname, lang: k === 'c' ? 'c' : 'python', code: src }); });
          body.append(U.h('div', { class: 'codebox' },
            U.h('div', { class: 'codebar' }, U.h('span', { class: 'fname', html: U.icon('file') + U.esc(fname) }), U.h('span', { class: 'cspring' }), copy, open),
            U.h('pre', { class: 'code' }, U.h('code', { html: U.highlight(src, lang) }))));
        }
      };
      tabs.forEach(([k, l]) => {
        const b = U.h('button', { type: 'button', role: 'tab', 'data-k': k }, l);
        b.addEventListener('click', () => show(k));
        bar.append(b);
      });
      show('learn');
      return U.h('section', { class: 'tabs' }, bar, body);
    }

    buildNav() {
      const seq = DSA.sequence(), i = seq.indexOf(this.d.id);
      const a = seq[i - 1] && DSA.sims[seq[i - 1]], b = seq[i + 1] && DSA.sims[seq[i + 1]];
      return U.h('nav', { class: 'simnav', 'aria-label': 'More simulations' },
        a ? U.h('a', { href: '#/sim/' + a.id, class: 'prev', html: U.icon('arrowL') + '<span><small>Previous</small>' + U.esc(a.title) + '</span>' }) : U.h('span'),
        b ? U.h('a', { href: '#/sim/' + b.id, class: 'next', html: '<span><small>Next</small>' + U.esc(b.title) + '</span>' + U.icon('arrowR') }) : U.h('span'));
    }

    /* ---------- state & operations ---------- */
    params(raw) {
      const p = {};
      for (const c of this.d.controls || []) {
        if (!c.id || !this.ctrl[c.id]) continue;
        const el = this.ctrl[c.id];
        if (c.type === 'num') p[c.id] = el.value === '' ? NaN : Number(el.value);
        else if (c.type === 'check') p[c.id] = el.checked;
        else p[c.id] = el.value;
      }
      return p;
    }
    setParam(id, v) { if (this.ctrl[id]) { if (this.ctrl[id].type === 'checkbox') this.ctrl[id].checked = !!v; else this.ctrl[id].value = v; } }

    reset(msg) {
      const p = this.params();
      let S;
      try { S = this.d.init ? this.d.init.call(this.d, p, this) : {}; }
      catch (e) { this.err(e); if (!this.S) { this.S = {}; this.player.load([this.frame0()]); } return; }
      this.S = S;
      this.history = []; this.syncUndo();
      if (this.d.auto) this.op(this.d.auto, { paused: true });
      else this.player.load([this.frame0(msg)]);
    }

    frame0(msg) {
      const A = this.d.algo || {};
      return { st: U.clone(this.S), line: null, msg: msg || this.d.ready || 'Ready. Choose an operation above, then watch each step.', hl: {}, algo: this.d.algo0 || Object.keys(A)[0], vars: this.d.vars0 ? this.d.vars0(this.S) : null };
    }

    op(name, o) {
      o = o || {};
      const d = this.d, fn = d.ops && d.ops[name];
      if (!fn) return;
      const p = this.params();
      const before = U.clone(this.S);
      const R = new DSA.Recorder(this.S);
      try { fn.call(d, this.S, p, R, this); }
      catch (e) { this.S = before; this.err(e); return; }
      if (!R.frames.length) R.step(null, 'Done.');
      if (o.keep || d.keepInput || (d.auto && name === d.auto)) this.S = before;
      else { this.history.push(before); if (this.history.length > 60) this.history.shift(); }
      this.syncUndo();
      this.player.load(R.frames, { autoplay: !o.paused });
      if (this.app && !o.paused) this.app.visited(d.id);
    }

    undo() {
      if (!this.history.length) return;
      this.S = this.history.pop();
      this.syncUndo();
      this.player.load([this.frame0('Undone. This is the state before your last operation.')]);
    }
    syncUndo() { if (this.undoBtn) this.undoBtn.disabled = !this.history.length; }

    /* Re-draw the current frame without animation (used while dragging). */
    redraw(keepBox) { if (this.cur) this.show(this.cur, false, keepBox); }

    err(e) {
      if (e instanceof U.InputError) this.toast(e.message, 'bad');
      else { if (typeof console !== 'undefined') console.error(e); this.toast('Unexpected error: ' + (e && e.message), 'bad'); }
    }
    toast(msg, tone) {
      this.toastEl.textContent = msg;
      this.toastEl.dataset.tone = tone || '';
      this.toastEl.classList.add('on');
      clearTimeout(this.toastT);
      this.toastT = setTimeout(() => this.toastEl.classList.remove('on'), 3600);
    }

    /* ---------- drawing one frame ---------- */
    show(f, anim, keepBox) {
      this.cur = f;
      let out;
      try { out = this.d.view.call(this.d, f.st, f, this); }
      catch (e) { if (typeof console !== 'undefined') console.error(e); out = []; }
      const specs = Array.isArray(out) ? out : out.specs || [];
      const o = Array.isArray(out) ? {} : out;
      const vb = this.scene.render(specs, {
        dur: anim ? this.player.tweenMs() : 0, box: keepBox && this.vb ? this.vb : o.box,
        minW: o.minW || this.d.minW || 520, minH: o.minH || this.d.minH || 220, pad: o.pad,
      });
      this.vb = vb; this.fit();
      this.msgEl.innerHTML = f.msg ? U.md(f.msg) : '&nbsp;';
      this.msgEl.dataset.tone = f.tone || '';
      this.showAlgo(f.algo, f.line);
      this.showVars(f.vars);
      this.showTable(f.table);
    }

    fit() {
      if (!this.vb) return;
      const w = this.stage.clientWidth || 640;
      const small = w < 560;
      const lo = this.d.stageMin || (small ? 190 : 250), hi = this.d.stageMax || (small ? 440 : 540);
      const h = Math.round(U.clamp((w * this.vb[3]) / this.vb[2], lo, hi));
      const cur = parseFloat(this.stage.style.height) || 0;
      if (!cur || Math.abs(cur - h) / h > 0.1) this.stage.style.height = h + 'px';
    }

    showAlgo(key, line) {
      const A = this.d.algo || {};
      key = key || this.d.algo0 || Object.keys(A)[0];
      const lines = A[key] || [];
      if (this.algoKey !== key) {
        this.algoKey = key;
        this.algoTitle.innerHTML = lines.length ? U.pseudo(lines[0]) : '<span class="muted">—</span>';
        this.algoEl.innerHTML = lines.slice(1).map((l, i) => {
          const ind = (l.match(/^\s*/)[0].length / 2) | 0;
          return `<li data-i="${i + 1}" style="--ind:${ind}">${U.pseudo(l.trim())}</li>`;
        }).join('');
        this.lineEls = U.$$('li', this.algoEl);
      }
      let idx = -1;
      if (typeof line === 'number') idx = line;
      else if (typeof line === 'string') { const t = line.trim(); idx = lines.findIndex((l, i) => i > 0 && l.trim().startsWith(t)); }
      let on = null;
      for (const li of this.lineEls) { const hit = Number(li.dataset.i) === idx; li.classList.toggle('on', hit); if (hit) on = li; }
      if (on) {
        const box = this.algoBox;
        const top = on.offsetTop - this.algoEl.offsetTop;
        if (top < box.scrollTop || top + on.offsetHeight > box.scrollTop + box.clientHeight) box.scrollTop = Math.max(0, top - box.clientHeight / 2);
      }
    }

    showVars(v) {
      if (!v || !Object.keys(v).length) { this.varsEl.innerHTML = '<span class="muted">No variables at this step.</span>'; this.prevVars = null; return; }
      const prev = this.prevVars || {};
      this.varsEl.innerHTML = Object.keys(v).map((k) => {
        const chg = prev[k] !== undefined && fmtVar(prev[k]) !== fmtVar(v[k]);
        return `<span class="var${chg ? ' chg' : ''}"><i>${U.esc(k)}</i><b>${U.esc(fmtVar(v[k]))}</b></span>`;
      }).join('');
      this.prevVars = v;
    }

    showTable(t) {
      if (!t || !t.rows) { this.tableWrap.hidden = true; return; }
      this.tableWrap.hidden = false;
      this.tableTitle.textContent = t.title || 'Trace table';
      const hi = t.hi == null ? t.rows.length - 1 : t.hi;
      this.tableEl.innerHTML = '<table><thead><tr>' + t.head.map((h) => `<th>${U.esc(h)}</th>`).join('') + '</tr></thead><tbody>' +
        t.rows.map((r, i) => `<tr${i === hi ? ' class="on"' : ''}>` + r.map((c) => `<td>${U.esc(c)}</td>`).join('') + '</tr>').join('') + '</tbody></table>';
      const on = this.tableEl.querySelector('tr.on');
      if (on) this.tableEl.scrollTop = Math.max(0, on.offsetTop - this.tableEl.clientHeight / 2);
    }

    onKey(e) {
      const t = e.target;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (t && (t.closest('input, textarea, select, [contenteditable="true"]'))) return;
      if (e.key === ' ' || e.key === 'k') { e.preventDefault(); this.player.toggle(); }
      else if (e.key === 'ArrowRight' || e.key === 'l') { e.preventDefault(); this.player.act('next'); }
      else if (e.key === 'ArrowLeft' || e.key === 'j') { e.preventDefault(); this.player.act('prev'); }
      else if (e.key === 'Home') { e.preventDefault(); this.player.act('first'); }
      else if (e.key === 'End') { e.preventDefault(); this.player.act('last'); }
    }
  }
  DSA.SimPage = SimPage;
})(typeof window !== 'undefined' ? window : globalThis);
