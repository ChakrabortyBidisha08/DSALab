/* DSA Lab · core/scene.js — a keyed SVG renderer.
   Every frame of a simulation is described as a flat list of "shape specs"
   ({k:'box'|'circle'|'line'|'text'|'poly', key, …geometry, text, cls}).
   Shapes with the same key in consecutive frames glide to their new place,
   new keys fade in, missing keys fade out. That is what makes swaps, shifts,
   rotations and pointer moves animate without each simulation writing
   animation code. */
(function (g) {
  'use strict';
  const DSA = g.DSA;
  const NS = 'http://www.w3.org/2000/svg';
  const mk = (tag, attrs) => {
    const el = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  };
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const r1 = (v) => Math.round(v * 10) / 10;
  const GEOM = {
    box: ['x', 'y', 'w', 'h'],
    circle: ['x', 'y', 'r'],
    line: ['x1', 'y1', 'x2', 'y2', 'bend'],
    text: ['x', 'y'],
    poly: [],
  };
  const TONES = ['act', 'ok', 'bad', 'cmp', 'sel', 'dim', 'new', 'path'];
  let sceneCount = 0;

  function linePath(c, s) {
    const { x1, y1, x2, y2 } = c;
    const bend = c.bend || 0;
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1;
    const nx = -dy / L, ny = dx / L;
    const cx = (x1 + x2) / 2 + nx * bend, cy = (y1 + y2) / 2 + ny * bend;
    let ax = x1, ay = y1, bx = x2, by = y2;
    const t1 = s.t1 || 0, t2 = s.t2 || 0;
    if (t1) { const ux = cx - x1, uy = cy - y1, ul = Math.hypot(ux, uy) || 1; ax += (ux / ul) * t1; ay += (uy / ul) * t1; }
    if (t2) { const ux = cx - x2, uy = cy - y2, ul = Math.hypot(ux, uy) || 1; bx += (ux / ul) * t2; by += (uy / ul) * t2; }
    const d = Math.abs(bend) > 0.5
      ? `M${r1(ax)},${r1(ay)} Q${r1(cx)},${r1(cy)} ${r1(bx)},${r1(by)}`
      : `M${r1(ax)},${r1(ay)} L${r1(bx)},${r1(by)}`;
    // label position: middle of the curve, nudged sideways
    const mx = 0.25 * ax + 0.5 * cx + 0.25 * bx, my = 0.25 * ay + 0.5 * cy + 0.25 * by;
    const off = s.loff != null ? s.loff : (bend >= 0 ? -11 : 11);
    return { d, lx: mx + nx * off, ly: my + ny * off };
  }

  class Scene {
    constructor(svg, opt) {
      this.svg = svg;
      this.opt = opt || {};
      this.uid = ++sceneCount;
      this.items = new Map();
      this.anim = new Set();
      this.vb = null; this.vbFrom = null; this.vbTo = null;
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      svg.setAttribute('xmlns', NS);
      const defs = mk('defs');
      ['def'].concat(TONES).forEach((t) => {
        const m = mk('marker', {
          id: `ah-${t}-${this.uid}`, viewBox: '0 0 10 10', refX: '8.6', refY: '5',
          markerWidth: '10', markerHeight: '10', markerUnits: 'userSpaceOnUse', orient: 'auto-start-reverse',
        });
        m.appendChild(mk('path', { d: 'M0,0.8 L10,5 L0,9.2 z', class: `ah ah-${t}` }));
        defs.appendChild(m);
      });
      svg.appendChild(defs);
      this.layer = svg.appendChild(mk('g', { class: 'layer' }));
      this._tick = this._tick.bind(this);
      svg.addEventListener('click', (e) => {
        const el = e.target.closest && e.target.closest('[data-key]');
        if (el && this.onClick) this.onClick(el.getAttribute('data-key'), e);
      });
    }

    /* Convert a mouse/touch event to scene coordinates. */
    toLocal(e) {
      const pt = this.svg.createSVGPoint();
      pt.x = e.clientX; pt.y = e.clientY;
      const m = this.layer.getScreenCTM();
      return m ? pt.matrixTransform(m.inverse()) : { x: 0, y: 0 };
    }

    clear() {
      for (const it of this.items.values()) it.el.remove();
      this.items.clear(); this.anim.clear();
    }

    render(specs, o) {
      o = o || {};
      const dur = Math.max(0, o.dur == null ? 420 : o.dur);
      const seen = new Set();
      let prev = null;
      for (const s of specs) {
        if (!s || s.key == null) continue;
        if (seen.has(s.key)) { if (this.opt.debug) console.warn('duplicate key', s.key); continue; }
        seen.add(s.key);
        let it = this.items.get(s.key);
        if (it && it.k !== s.k) { this._kill(it, 0); it = null; }
        const to = this._geom(s);
        let fresh = false;
        if (!it) {
          it = this._make(s);
          this.items.set(s.key, it);
          it.cur = Object.assign({}, to, s.from || {});
          fresh = true;
        }
        if (it.dying) { it.dying.cancel && it.dying.cancel(); clearTimeout(it.dyingT); it.dying = null; it.el.style.opacity = ''; }
        this._static(it, s);
        const want = prev ? prev.nextSibling : this.layer.firstChild;
        if (it.el !== want) this.layer.insertBefore(it.el, want);
        prev = it.el;
        if (fresh) {
          if (s.k === 'poly') it.cur.pts = (s.from && s.from.pts) || s.pts;
          this._draw(it);
          if (dur > 0 && it.el.animate) it.el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: Math.min(dur, 360), easing: 'ease-out' });
        }
        this._to(it, to, s, fresh && !s.from ? 0 : dur);
      }
      for (const [key, it] of this.items) if (!seen.has(key)) this._kill(it, dur);
      const box = o.box || this.bbox(specs, o);
      this._vb(box, dur);
      return box;
    }

    _geom(s) {
      const out = {};
      for (const k of GEOM[s.k] || []) out[k] = +s[k] || 0;
      return out;
    }

    _make(s) {
      const gEl = mk('g');
      gEl.setAttribute('data-key', s.key);
      const it = { k: s.k, el: gEl, p: {} };
      const add = (name, tag, attrs) => (it.p[name] = gEl.appendChild(mk(tag, attrs)));
      if (s.k === 'box') {
        add('r', 'rect');
        add('t', 'text', { class: 't' });
        add('top', 'text', { class: 'lbl top' });
        add('sub', 'text', { class: 'lbl sub' });
      } else if (s.k === 'circle') {
        add('c', 'circle');
        add('t', 'text', { class: 't' });
        add('top', 'text', { class: 'lbl top' });
        add('sub', 'text', { class: 'lbl sub' });
        add('badge', 'text', { class: 'lbl badge' });
      } else if (s.k === 'line' || s.k === 'poly') {
        add('path', 'path', { fill: 'none' });
        add('lab', 'text', { class: 'lbl elab' });
      } else {
        add('t', 'text', { class: 't' });
      }
      return it;
    }

    _static(it, s) {
      const cls = `sh ${s.k} ${s.cls || ''}`;
      if (it.cls !== cls) { it.el.setAttribute('class', cls); it.cls = cls; }
      const p = it.p;
      const setT = (el, v) => { if (!el) return; const t = v == null ? '' : String(v); if (el.textContent !== t) el.textContent = t; };
      if (s.k === 'box' || s.k === 'circle') {
        setT(p.t, s.text); setT(p.top, s.top); setT(p.sub, s.sub);
        if (p.badge) setT(p.badge, s.badge);
        if (s.fs) p.t.style.fontSize = s.fs + 'px'; else p.t.style.fontSize = '';
        if (p.r) p.r.setAttribute('rx', s.rx == null ? 7 : s.rx);
      } else if (s.k === 'line' || s.k === 'poly') {
        const tone = (s.cls || '').split(/\s+/).find((c) => TONES.includes(c)) || 'def';
        const url = `url(#ah-${tone}-${this.uid})`;
        const a = s.arrow;
        if (a === true || a === 'end' || a === 'both') p.path.setAttribute('marker-end', url); else p.path.removeAttribute('marker-end');
        if (a === 'start' || a === 'both') p.path.setAttribute('marker-start', url); else p.path.removeAttribute('marker-start');
        setT(p.lab, s.label);
      } else {
        setT(p.t, s.text);
        p.t.style.textAnchor = s.anchor || 'middle';
        if (s.fs) p.t.style.fontSize = s.fs + 'px'; else p.t.style.fontSize = '';
      }
      if (s.title !== it.title) {
        it.title = s.title;
        let t = it.el.querySelector('title');
        if (s.title) { if (!t) t = it.el.insertBefore(mk('title'), it.el.firstChild); t.textContent = s.title; }
        else if (t) t.remove();
      }
      it.spec = s;
    }

    _draw(it) {
      const c = it.cur, p = it.p, s = it.spec;
      if (it.k === 'box') {
        it.el.setAttribute('transform', `translate(${r1(c.x)},${r1(c.y)})`);
        p.r.setAttribute('width', r1(Math.max(0, c.w)));
        p.r.setAttribute('height', r1(Math.max(0, c.h)));
        const ty = s.tpos === 'b' ? c.h - 10 : s.tpos === 't' ? 12 : c.h / 2;
        p.t.setAttribute('x', r1(c.w / 2)); p.t.setAttribute('y', r1(ty));
        p.top.setAttribute('x', r1(c.w / 2)); p.top.setAttribute('y', -9);
        p.sub.setAttribute('x', r1(c.w / 2)); p.sub.setAttribute('y', r1(c.h + 15));
      } else if (it.k === 'circle') {
        it.el.setAttribute('transform', `translate(${r1(c.x)},${r1(c.y)})`);
        p.c.setAttribute('r', r1(Math.max(0, c.r)));
        p.t.setAttribute('x', 0); p.t.setAttribute('y', 0);
        p.top.setAttribute('x', 0); p.top.setAttribute('y', r1(-c.r - 9));
        p.sub.setAttribute('x', 0); p.sub.setAttribute('y', r1(c.r + 15));
        p.badge.setAttribute('x', r1(c.r * 0.95)); p.badge.setAttribute('y', r1(-c.r * 0.85));
      } else if (it.k === 'line') {
        const lp = linePath(c, s);
        p.path.setAttribute('d', lp.d);
        p.lab.setAttribute('x', r1(lp.lx)); p.lab.setAttribute('y', r1(lp.ly));
      } else if (it.k === 'poly') {
        const pts = c.pts || [];
        p.path.setAttribute('d', pts.map((q, i) => (i ? 'L' : 'M') + r1(q[0]) + ',' + r1(q[1])).join(' '));
        if (pts.length) {
          const m = pts[Math.floor((pts.length - 1) / 2)], n = pts[Math.ceil((pts.length - 1) / 2)];
          p.lab.setAttribute('x', r1((m[0] + n[0]) / 2)); p.lab.setAttribute('y', r1((m[1] + n[1]) / 2 - 8));
        }
      } else {
        p.t.setAttribute('x', r1(c.x)); p.t.setAttribute('y', r1(c.y));
      }
    }

    _to(it, to, s, dur) {
      if (it.k === 'poly') {
        const from = it.cur.pts || s.pts;
        if (dur <= 0 || !from || from.length !== s.pts.length) { it.cur.pts = s.pts; this._draw(it); this.anim.delete(it); return; }
        it.fromPts = from.map((q) => q.slice()); it.toPts = s.pts;
      } else {
        let same = true;
        for (const k in to) if (Math.abs((it.cur[k] || 0) - to[k]) > 0.05) { same = false; break; }
        if (same || dur <= 0) { Object.assign(it.cur, to); this._draw(it); this.anim.delete(it); return; }
        it.from = Object.assign({}, it.cur); it.to = to;
      }
      it.t0 = performance.now(); it.dur = dur;
      this.anim.add(it);
      this._kick();
    }

    _kill(it, dur) {
      if (it.dying) return;
      const done = () => { it.el.remove(); if (this.items.get(it.spec.key) === it) this.items.delete(it.spec.key); this.anim.delete(it); };
      if (dur > 0 && it.el.animate) {
        it.dying = it.el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: Math.min(dur, 320), easing: 'ease-in', fill: 'forwards' });
        it.dyingT = setTimeout(done, Math.min(dur, 320));
      } else { it.dying = { cancel() {} }; done(); }
    }

    _vb(box, dur) {
      const to = box.map((v) => +v || 0);
      if (!this.vb || dur <= 0) { this.vb = to; this.vbTo = null; this._applyVB(); return; }
      if (to.every((v, i) => Math.abs(v - this.vb[i]) < 0.5)) return;
      this.vbFrom = this.vb.slice(); this.vbTo = to; this.vbT0 = performance.now(); this.vbDur = dur;
      this._kick();
    }
    _applyVB() { this.svg.setAttribute('viewBox', this.vb.map(r1).join(' ')); }

    _kick() { if (!this.raf) this.raf = requestAnimationFrame(this._tick); }

    _tick(now) {
      this.raf = 0;
      for (const it of this.anim) {
        const t = Math.min(1, (now - it.t0) / it.dur), e = ease(Math.max(0, t));
        if (it.k === 'poly') {
          it.cur.pts = it.toPts.map((q, i) => [it.fromPts[i][0] + (q[0] - it.fromPts[i][0]) * e, it.fromPts[i][1] + (q[1] - it.fromPts[i][1]) * e]);
        } else {
          for (const k in it.to) it.cur[k] = it.from[k] + (it.to[k] - it.from[k]) * e;
        }
        this._draw(it);
        if (t >= 1) this.anim.delete(it);
      }
      if (this.vbTo) {
        const t = Math.min(1, (now - this.vbT0) / this.vbDur), e = ease(t);
        this.vb = this.vbFrom.map((v, i) => v + (this.vbTo[i] - v) * e);
        this._applyVB();
        if (t >= 1) { this.vb = this.vbTo; this.vbTo = null; this._applyVB(); }
      }
      if (this.anim.size || this.vbTo) this._kick();
    }

    /* Bounding box of a spec list, padded and grown to a minimum size. */
    bbox(specs, o) {
      o = o || {};
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      const add = (a, b, c, d) => { if (a < x0) x0 = a; if (b < y0) y0 = b; if (c > x1) x1 = c; if (d > y1) y1 = d; };
      for (const s of specs) {
        if (!s || s.nofit) continue;
        if (s.k === 'box') {
          const tw = Math.max(String(s.top || '').length, String(s.sub || '').length) * 6.5;
          const ex = Math.max(0, (tw - s.w) / 2);
          add(s.x - ex, s.y - (s.top ? 22 : 0), s.x + s.w + ex, s.y + s.h + (s.sub ? 22 : 0));
        } else if (s.k === 'circle') {
          const tw = Math.max(String(s.top || '').length, String(s.sub || '').length) * 6.5;
          const ex = Math.max(0, tw / 2 - s.r);
          add(s.x - s.r - ex, s.y - s.r - (s.top ? 22 : 0) - (s.badge ? 6 : 0), s.x + s.r + ex + (s.badge ? 12 : 0), s.y + s.r + (s.sub ? 22 : 0));
        } else if (s.k === 'line') {
          const b = Math.abs(s.bend || 0) / 2 + (s.label ? 14 : 0);
          add(Math.min(s.x1, s.x2) - b, Math.min(s.y1, s.y2) - b, Math.max(s.x1, s.x2) + b, Math.max(s.y1, s.y2) + b);
        } else if (s.k === 'poly') {
          for (const q of s.pts || []) add(q[0], q[1], q[0], q[1]);
        } else if (s.k === 'text') {
          const w = String(s.text == null ? '' : s.text).length * (s.fs || 13) * 0.6, a = s.anchor || 'middle';
          const lx = a === 'start' ? s.x : a === 'end' ? s.x - w : s.x - w / 2;
          add(lx, s.y - (s.fs || 13) * 0.8, lx + w, s.y + (s.fs || 13) * 0.6);
        }
      }
      if (x0 === Infinity) { x0 = 0; y0 = 0; x1 = 300; y1 = 120; }
      const pad = o.pad == null ? 22 : o.pad;
      x0 -= pad; y0 -= pad; x1 += pad; y1 += pad;
      let w = x1 - x0, h = y1 - y0;
      const minW = o.minW || 0, minH = o.minH || 0;
      if (w < minW) { x0 -= (minW - w) / 2; w = minW; }
      if (h < minH) { y0 -= (minH - h) / 2; h = minH; }
      return [x0, y0, w, h];
    }
  }

  DSA.Scene = Scene;
})(typeof window !== 'undefined' ? window : globalThis);
