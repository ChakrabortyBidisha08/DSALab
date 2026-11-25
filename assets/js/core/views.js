/* DSA Lab · core/views.js — builders that turn data into shape specs.
   They are pure functions (no DOM), so simulations can be unit-tested in Node. */
(function (g) {
  'use strict';
  const DSA = g.DSA;
  const V = (DSA.V = {});

  const fmt = (v) => (v == null ? '' : typeof v === 'number' && !Number.isInteger(v) ? String(Math.round(v * 100) / 100) : String(v));
  V.fmt = fmt;
  V.text = (key, x, y, text, cls, anchor, fs) => ({ k: 'text', key, x, y, text, cls: cls || '', anchor, fs });
  V.line = (key, x1, y1, x2, y2, cls, arrow, more) => Object.assign({ k: 'line', key, x1, y1, x2, y2, cls: cls || '', arrow }, more || {});
  V.box = (key, x, y, w, h, text, cls, more) => Object.assign({ k: 'box', key, x, y, w, h, text, cls: cls || '' }, more || {});
  V.circ = (key, x, y, r, text, cls, more) => Object.assign({ k: 'circle', key, x, y, r, text, cls: cls || '' }, more || {});

  /* A labelled pointer arrow that points at (x, y) from the given side. */
  V.ptr = (key, x, y, label, cls, side, len) => {
    const L = len || 26;
    side = side || 'top';
    const c = 'ptr ' + (cls || '');
    if (side === 'top') return [V.text(key + 't', x, y - L - 6, label, c + ' ptrl'), V.line(key + 'a', x, y - L, x, y - 3, c, true)];
    if (side === 'bottom') return [V.text(key + 't', x, y + L + 14, label, c + ' ptrl'), V.line(key + 'a', x, y + L, x, y + 3, c, true)];
    if (side === 'right') return [V.text(key + 't', x + L + 6, y + 4, label, c + ' ptrl', 'start'), V.line(key + 'a', x + L, y, x + 3, y, c, true)];
    return [V.text(key + 't', x - L - 6, y + 4, label, c + ' ptrl', 'end'), V.line(key + 'a', x - L, y, x - 3, y, c, true)];
  };

  /* Linear array of cells. items: raw values or {id, v, cls}. Null = empty slot. */
  V.array = function (pre, items, o) {
    o = o || {};
    const out = [];
    const n = items.length;
    const cw = o.cw || 52, ch = o.ch || 44, gap = o.gap == null ? 6 : o.gap;
    const x0 = o.x || 0, y0 = o.y || 0, base = o.base == null ? 1 : o.base;
    const vert = !!o.vertical;
    const pos = (i) => (vert ? [x0, y0 + (n - 1 - i) * (ch + gap)] : [x0 + i * (cw + gap), y0]);
    const hl = o.hl || {};
    items.forEach((it, i) => {
      const obj = it !== null && typeof it === 'object';
      const v = obj ? it.v : it;
      const id = obj && it.id != null ? it.id : 'i' + i;
      const [x, y] = pos(i);
      const cls = ['cell', v == null ? 'slot' : '', hl[i] || '', obj && it.cls ? it.cls : ''].join(' ');
      out.push({ k: 'box', key: pre + 'c' + id, x, y, w: cw, h: ch, text: v == null ? '' : fmt(v), cls, fs: o.fs, sub: o.sub ? o.sub(i, it) : undefined, from: obj && it.from ? it.from : undefined });
      if (o.idx !== false) {
        const lab = o.idxLabel ? o.idxLabel(i) : i + base;
        if (vert) out.push(V.text(pre + 'x' + i, x - 12, y + ch / 2 + 4, lab, 'idx', 'end'));
        else out.push(V.text(pre + 'x' + i, x + cw / 2, y - 9, lab, 'idx'));
      }
    });
    if (o.name) {
      if (vert) out.push(V.text(pre + 'name', x0 + cw / 2, y0 + n * (ch + gap) + 16, o.name, 'name'));
      else out.push(V.text(pre + 'name', x0 - 14, y0 + ch / 2 + 5, o.name, 'name', 'end'));
    }
    const stack = {};
    for (const p of o.ptrs || []) {
      if (p == null || p.i == null || Number.isNaN(p.i)) continue;
      const side = p.side || (vert ? 'right' : 'bottom');
      const k = side + ':' + p.i;
      const lvl = (stack[k] = (stack[k] || 0) + 1) - 1;
      const [x, y] = pos(p.i);
      const pk = pre + 'p' + (p.key || p.label);
      if (side === 'bottom') out.push(...V.ptr(pk, x + cw / 2, y + ch + (o.idxBelow ? 18 : 0), p.label, p.cls, 'bottom', 22 + lvl * 17));
      else if (side === 'top') out.push(...V.ptr(pk, x + cw / 2, y - (o.idx === false ? 0 : 16), p.label, p.cls, 'top', 20 + lvl * 17));
      else if (side === 'right') out.push(...V.ptr(pk, x + cw, y + ch / 2, p.label, p.cls, 'right', 24 + lvl * 56));
      else out.push(...V.ptr(pk, x - (o.idx === false ? 0 : 22), y + ch / 2, p.label, p.cls, 'left', 24 + lvl * 56));
    }
    return out;
  };
  V.arrayPos = (o, i) => {
    const cw = o.cw || 52, gap = o.gap == null ? 6 : o.gap;
    return (o.x || 0) + i * (cw + gap);
  };

  /* Bars for sorting. items: [{id, v}] */
  V.bars = function (pre, items, o) {
    o = o || {};
    const out = [];
    const n = Math.max(1, items.length);
    const gap = o.gap == null ? 8 : o.gap;
    const bw = o.bw || Math.max(18, Math.min(54, ((o.w || 640) - (n - 1) * gap) / n));
    const H = o.h || 200, x0 = o.x || 0, y0 = o.y || 0;
    const maxV = o.max || Math.max(1, ...items.map((it) => Math.abs(it.v)));
    const hl = o.hl || {};
    items.forEach((it, i) => {
      const bh = Math.max(6, (Math.abs(it.v) / maxV) * H);
      const x = x0 + i * (bw + gap);
      out.push({ k: 'box', key: pre + 'b' + it.id, x, y: y0 + H - bh - (it.lift || 0), w: bw, h: bh, text: '', top: fmt(it.v), cls: 'bar ' + (hl[i] || '') + ' ' + (it.cls || ''), rx: 4 });
      if (o.idx !== false) out.push(V.text(pre + 'x' + i, x + bw / 2, y0 + H + 16, i + (o.base == null ? 1 : o.base), 'idx'));
    });
    const stack = {};
    for (const p of o.ptrs || []) {
      if (p == null || p.i == null) continue;
      const lvl = (stack[p.i] = (stack[p.i] || 0) + 1) - 1;
      const x = x0 + p.i * (bw + gap) + bw / 2;
      out.push(...V.ptr(pre + 'p' + (p.key || p.label), x, y0 + H + 22, p.label, p.cls, 'bottom', 20 + lvl * 16));
    }
    if (o.line != null) out.push(V.line(pre + 'pivotline', x0 - 6, y0 + H - (o.line / maxV) * H, x0 + n * (bw + gap), y0 + H - (o.line / maxV) * H, 'guide'));
    return out;
  };
  V.barX = (o, n, i) => {
    const gap = o.gap == null ? 8 : o.gap;
    const bw = o.bw || Math.max(18, Math.min(54, ((o.w || 640) - (n - 1) * gap) / n));
    return (o.x || 0) + i * (bw + gap) + bw / 2;
  };

  /* Singly / doubly / circular linked list in rows. nodes: [{id, v, cls}] */
  V.list = function (pre, nodes, o) {
    o = o || {};
    const out = [];
    const n = nodes.length;
    const dbl = !!o.doubly;
    const iw = o.iw || 52, lw = o.lw || 30, nh = o.nh || 42;
    const nw = dbl ? iw + 2 * lw : iw + lw;
    const gx = o.gx || 44, gy = o.gy || 74, per = o.per || 6;
    const x0 = o.x || 0, y0 = o.y || 0;
    const hl = o.hl || {};
    const P = (i) => [x0 + (i % per) * (nw + gx), y0 + Math.floor(i / per) * (nh + gy)];
    const rows = Math.max(1, Math.ceil(n / per));
    nodes.forEach((nd, i) => {
      const [x, y] = P(i);
      const c = 'node ' + (hl[nd.id] || '') + ' ' + (nd.cls || '');
      const sub = o.addr ? o.addr(nd, i) : undefined;
      if (dbl) {
        out.push(V.box(pre + 'b' + nd.id, x, y, lw, nh, o.backText ? o.backText(nd, i) : (i === 0 && !o.circular ? '×' : ''), 'lnk ' + (i === 0 && !o.circular ? 'nil ' : '') + c, { rx: 4 }));
        out.push(V.box(pre + 'n' + nd.id, x + lw, y, iw, nh, fmt(nd.v), 'info ' + c, { rx: 0, sub, top: nd.top }));
        out.push(V.box(pre + 'l' + nd.id, x + lw + iw, y, lw, nh, o.linkText ? o.linkText(nd, i) : (i === n - 1 && !o.circular ? '×' : ''), 'lnk ' + (i === n - 1 && !o.circular ? 'nil ' : '') + c, { rx: 4 }));
      } else {
        out.push(V.box(pre + 'n' + nd.id, x, y, iw, nh, fmt(nd.v), 'info ' + c, { rx: 4, sub, top: nd.top }));
        const last = i === n - 1 && !o.circular;
        out.push(V.box(pre + 'l' + nd.id, x + iw, y, lw, nh, o.linkText ? o.linkText(nd, i) : last ? '×' : '', 'lnk ' + (last && !o.linkText ? 'nil ' : '') + c, { rx: 4 }));
      }
    });
    // forward links
    for (let i = 0; i < n - 1; i++) {
      const [x, y] = P(i), [nx, ny] = P(i + 1);
      const sx = x + nw - lw / 2, sy = dbl ? y + nh * 0.34 : y + nh / 2;
      const ty = dbl ? ny + nh * 0.34 : ny + nh / 2;
      const cls = 'link ' + ((o.ehl && o.ehl[nodes[i].id]) || '');
      let pts;
      if (ny === y) pts = [[sx, sy], [sx + 8, sy], [(sx + nx) / 2, ty], [nx - 8, ty], [nx - 2, ty]];
      else {
        const midY = y + nh + gy / 2;
        pts = [[sx, sy], [sx, midY], [x0 - 18, midY], [x0 - 18, ty], [nx - 2, ty]];
      }
      out.push({ k: 'poly', key: pre + 'a' + nodes[i].id, pts, cls, arrow: true });
      if (dbl) {
        const bx = nx + lw / 2, by = ny + nh * 0.68;
        const tx = x + nw + 2, tyb = y + nh * 0.68;
        let bp;
        if (ny === y) bp = [[bx, by], [bx - 8, by], [(bx + tx) / 2, tyb], [tx + 8, tyb], [tx, tyb]];
        else { const midY = y + nh + gy / 2 + 12; bp = [[bx, by], [bx, ny - 10], [x + nw + 16, midY], [x + nw + 16, tyb], [tx, tyb]]; }
        out.push({ k: 'poly', key: pre + 'r' + nodes[i].id, pts: bp, cls: 'link back ' + ((o.bhl && o.bhl[nodes[i].id]) || ''), arrow: true });
      }
    }
    // circular link back to the first node
    if (o.circular && n > 0) {
      const [x, y] = P(n - 1), [fx, fy] = P(0);
      const sx = x + nw - lw / 2, sy = dbl ? y + nh * 0.34 : y + nh / 2;
      const yb = y0 + rows * (nh + gy) - gy + 30;
      const pts = [[sx, sy], [x + nw + 14, sy], [x + nw + 14, yb], [fx - 22, yb], [fx - 22, fy + nh / 2], [fx - 2, fy + nh / 2]];
      out.push({ k: 'poly', key: pre + 'circ', pts, cls: 'link circ ' + (o.circCls || ''), arrow: true });
    }
    // head pointer
    if (o.head) {
      const hk = pre + 'H' + o.head;
      const hi = o.headAt == null ? 0 : o.headAt;
      if (n && hi < n) out.push(...V.ptr(hk, P(hi)[0] + (dbl ? lw : 0) + iw / 2, P(hi)[1] - (o.top ? 20 : 2), o.head, 'head', 'top', 26));
      else {
        out.push(V.text(hk + 't', x0, y0 + nh / 2 - 12, o.head, 'ptr head ptrl', 'start'));
        out.push(V.text(hk + 'n', x0, y0 + nh / 2 + 12, '= NULL (list is empty)', 'nilt', 'start'));
      }
    }
    // extra pointers attached to nodes by id
    const stack = {};
    const idx = {}; nodes.forEach((nd, i) => (idx[nd.id] = i));
    for (const p of o.ptrs || []) {
      if (!p) continue;
      if (p.id == null || idx[p.id] == null) {
        if (p.label && p.nullAt != null) {
          const [x, y] = P(Math.min(p.nullAt, Math.max(0, n)));
          out.push(V.text(pre + 'p' + p.label + 't', x + nw / 2, y + nh + 34, p.label + ' = NULL', 'ptr ptrl ' + (p.cls || '')));
        }
        continue;
      }
      const lvl = (stack[p.id] = (stack[p.id] || 0) + 1) - 1;
      const [x, y] = P(idx[p.id]);
      out.push(...V.ptr(pre + 'p' + p.label, x + (dbl ? lw : 0) + iw / 2, y + nh + (o.addr ? 18 : 0), p.label, p.cls, 'bottom', 22 + lvl * 16));
    }
    return out;
  };
  V.listPos = (o, i) => {
    const dbl = !!o.doubly, iw = o.iw || 52, lw = o.lw || 30, nh = o.nh || 42;
    const nw = dbl ? iw + 2 * lw : iw + lw, gx = o.gx || 44, gy = o.gy || 74, per = o.per || 6;
    return { x: (o.x || 0) + (i % per) * (nw + gx), y: (o.y || 0) + Math.floor(i / per) * (nh + gy), w: nw, h: nh };
  };

  /* Binary tree. Node: {id, v, l, r}. Layout by in-order rank, so a BST reads left→right sorted. */
  V.treeLayout = function (root, o) {
    o = o || {};
    const dx = o.dx || 54, dy = o.dy || 70, x0 = o.x || 0, y0 = o.y || 0;
    const pos = new Map();
    let k = 0, maxD = 0;
    (function walk(nd, d) {
      if (!nd) return;
      walk(nd.l, d + 1);
      pos.set(nd.id, { x: x0 + k * dx, y: y0 + d * dy, d, nd });
      k++; if (d > maxD) maxD = d;
      walk(nd.r, d + 1);
    })(root, 0);
    return { pos, count: k, depth: maxD };
  };
  V.tree = function (pre, root, o) {
    o = o || {};
    const out = [];
    const R = o.r || 21;
    const L = V.treeLayout(root, o);
    const hl = o.hl || {}, ehl = o.ehl || {};
    for (const [, p] of L.pos) {
      for (const side of ['l', 'r']) {
        const c = p.nd[side];
        if (c && L.pos.has(c.id)) {
          const q = L.pos.get(c.id);
          out.push(V.line(pre + 'e' + c.id, p.x, p.y, q.x, q.y, 'edge ' + (ehl[c.id] || ''), false, { t1: R, t2: R }));
        } else if (o.nulls) {
          const nx = p.x + (side === 'l' ? -16 : 16), ny = p.y + R + 14;
          out.push(V.box(pre + 'z' + side + p.nd.id, nx - 6, ny - 5, 12, 10, '', 'nullbox', { rx: 2 }));
        }
      }
    }
    for (const t of o.threads || []) {
      const a = L.pos.get(t.from), b = t.to != null ? L.pos.get(t.to) : null;
      if (!a) continue;
      const sx = a.x + (t.side === 'l' ? -14 : 14), sy = a.y + R - 4;
      if (b) out.push(V.line(pre + 'th' + t.side + t.from, sx, sy, b.x, b.y, 'thread ' + (t.cls || ''), true, { bend: t.side === 'l' ? -28 : 28, t2: R + 2 }));
      else if (o.header) out.push(V.line(pre + 'th' + t.side + t.from, sx, sy, o.header.x, o.header.y + 16, 'thread ' + (t.cls || ''), true, { bend: t.side === 'l' ? -40 : 40 }));
    }
    for (const [id, p] of L.pos) {
      const nd = p.nd;
      out.push(V.circ(pre + 'n' + id, p.x, p.y, R, fmt(nd.v), 'tnode ' + (hl[id] || '') + ' ' + (nd.cls || ''), {
        badge: o.badge ? o.badge(nd) : undefined, sub: o.sub ? o.sub(nd) : undefined, top: o.top ? o.top(nd) : undefined,
      }));
    }
    const stack = {};
    for (const p of o.ptrs || []) {
      if (!p || !L.pos.has(p.id)) continue;
      const q = L.pos.get(p.id);
      const lvl = (stack[p.id] = (stack[p.id] || 0) + 1) - 1;
      out.push(V.text(pre + 'p' + p.label, q.x + R + 6, q.y - R - 4 - lvl * 15, p.label, 'ptr ptrl ' + (p.cls || ''), 'start'));
    }
    out.layout = L;
    return out;
  };

  /* Tidy layout for general trees (any number of children): node {id, kids:[…]} with width w(node). */
  V.tidy = function (root, o) {
    o = o || {};
    const gap = o.gap == null ? 18 : o.gap, dy = o.dy || 80;
    const W = o.width || (() => 44);
    const pos = new Map();
    const width = new Map();
    (function meas(nd) {
      const kids = (nd.kids || []).filter(Boolean);
      kids.forEach(meas);
      const kw = kids.reduce((s, c) => s + width.get(c.id), 0) + Math.max(0, kids.length - 1) * gap;
      width.set(nd.id, Math.max(W(nd), kw));
    })(root);
    (function place(nd, left, d) {
      const w = width.get(nd.id);
      pos.set(nd.id, { x: (o.x || 0) + left + w / 2, y: (o.y || 0) + d * dy, d, nd });
      const kids = (nd.kids || []).filter(Boolean);
      const kw = kids.reduce((s, c) => s + width.get(c.id), 0) + Math.max(0, kids.length - 1) * gap;
      let x = left + (w - kw) / 2;
      for (const c of kids) { place(c, x, d + 1); x += width.get(c.id) + gap; }
    })(root, 0, 0);
    return { pos, width: width.get(root.id) };
  };

  /* Multi-key nodes (B-trees, m-way trees). node {id, keys:[…], kids:[…]} */
  V.ktree = function (pre, root, o) {
    o = o || {};
    const out = [];
    if (!root) return out;
    const kw = o.kw || 38, kh = o.kh || 34;
    const L = V.tidy(root, { gap: o.gap || 22, dy: o.dy || 84, x: o.x, y: o.y, width: (nd) => Math.max(1, nd.keys.length) * kw + 8 });
    const hl = o.hl || {}, khl = o.khl || {};
    for (const [, p] of L.pos) {
      const nd = p.nd, w = Math.max(1, nd.keys.length) * kw;
      (nd.kids || []).forEach((c, i) => {
        if (!c) return;
        const q = L.pos.get(c.id);
        const sx = p.x - w / 2 + i * kw;
        out.push(V.line(pre + 'e' + c.id, sx, p.y + kh, q.x, q.y, 'edge ' + ((o.ehl && o.ehl[c.id]) || ''), false, { t2: 1 }));
      });
    }
    for (const [id, p] of L.pos) {
      const nd = p.nd, w = Math.max(1, nd.keys.length) * kw;
      out.push(V.box(pre + 'f' + id, p.x - w / 2 - 4, p.y - 4, w + 8, kh + 8, '', 'kframe ' + (hl[id] || ''), { rx: 8 }));
      nd.keys.forEach((k, i) => {
        out.push(V.box(pre + 'k' + k, p.x - w / 2 + i * kw, p.y, kw, kh, fmt(k), 'key ' + (khl[k] || ''), { rx: 4 }));
      });
      if (!nd.keys.length) out.push(V.text(pre + 'empty' + id, p.x, p.y + kh / 2 + 4, '∅', 'muted'));
    }
    out.layout = L;
    return out;
  };

  /* General tree drawn with circles. node {id, v, kids:[…]} */
  V.gtree = function (pre, root, o) {
    o = o || {};
    const out = [];
    if (!root) return out;
    const R = o.r || 20;
    const L = V.tidy(root, { gap: o.gap || 16, dy: o.dy || 74, x: o.x, y: o.y, width: () => 2 * R + 6 });
    const hl = o.hl || {};
    for (const [, p] of L.pos) for (const c of p.nd.kids || []) {
      if (!c) continue;
      const q = L.pos.get(c.id);
      out.push(V.line(pre + 'e' + c.id, p.x, p.y, q.x, q.y, 'edge ' + ((o.ehl && o.ehl[c.id]) || ''), false, { t1: R, t2: R }));
    }
    for (const [id, p] of L.pos) out.push(V.circ(pre + 'n' + id, p.x, p.y, R, fmt(p.nd.v), 'tnode ' + (hl[id] || '') + ' ' + (p.nd.cls || ''), { sub: o.sub ? o.sub(p.nd) : undefined, badge: o.badge ? o.badge(p.nd) : undefined }));
    out.layout = L;
    return out;
  };

  /* Graph: G = {nodes:[{id,x,y,label}], edges:[{u,v,w}], directed} */
  V.ekey = (G, u, v) => (G.directed ? u + '>' + v : (String(u) < String(v) ? u + '~' + v : v + '~' + u));
  V.graph = function (pre, G, o) {
    o = o || {};
    const out = [];
    const R = o.r || 22;
    const at = {}; G.nodes.forEach((nd) => (at[nd.id] = nd));
    const has = new Set(G.edges.map((e) => e.u + '>' + e.v));
    const hl = o.hl || {}, ehl = o.ehl || {};
    for (const e of G.edges) {
      const a = at[e.u], b = at[e.v];
      if (!a || !b || e.u === e.v) continue;
      const key = V.ekey(G, e.u, e.v);
      const bend = G.directed && has.has(e.v + '>' + e.u) ? 16 : 0;
      out.push(V.line(pre + 'e' + key, a.x, a.y, b.x, b.y, 'edge ' + (ehl[key] || '') + (G.directed ? ' dir' : ''), G.directed ? true : false, {
        t1: R, t2: R + (G.directed ? 2 : 0), bend, label: o.weights && e.w != null ? fmt(e.w) : undefined,
      }));
    }
    for (const nd of G.nodes) {
      out.push(V.circ(pre + 'n' + nd.id, nd.x, nd.y, R, nd.label != null ? nd.label : nd.id, 'gnode ' + (hl[nd.id] || ''), {
        sub: o.sub ? o.sub[nd.id] : undefined, top: o.top ? o.top[nd.id] : undefined, badge: o.badge ? o.badge[nd.id] : undefined,
      }));
    }
    return out;
  };

  /* Matrix / 2-D table. M: array of rows. */
  V.matrix = function (pre, M, o) {
    o = o || {};
    const out = [];
    const cw = o.cw || 40, ch = o.ch || 34, x0 = o.x || 0, y0 = o.y || 0;
    const f = o.fmt || fmt;
    const hl = o.hl || {};
    M.forEach((row, i) => row.forEach((v, j) => {
      const c = typeof hl === 'function' ? hl(i, j) : hl[i + ',' + j];
      out.push(V.box(pre + 'm' + i + '_' + j, x0 + j * cw, y0 + i * ch, cw - 3, ch - 3, f(v, i, j), 'mcell ' + (c || ''), { rx: 4, fs: o.fs }));
    }));
    const rl = o.rows, cl = o.cols;
    if (rl) rl.forEach((t, i) => out.push(V.text(pre + 'r' + i, x0 - 10, y0 + i * ch + ch / 2 + 3, t, 'idx ' + ((o.rhl && o.rhl[i]) || ''), 'end')));
    if (cl) cl.forEach((t, j) => out.push(V.text(pre + 'c' + j, x0 + j * cw + cw / 2 - 1, y0 - 9, t, 'idx ' + ((o.chl && o.chl[j]) || ''))));
    if (o.name) out.push(V.text(pre + 'name', x0 + (M[0] ? M[0].length : 1) * cw / 2, y0 - (cl ? 30 : 12), o.name, 'name'));
    return out;
  };

  /* Simple horizontal row of labelled chips (e.g. a queue of vertices, an output string). */
  V.row = function (pre, vals, o) {
    o = o || {};
    const cw = o.cw || 38, ch = o.ch || 32, gap = o.gap == null ? 4 : o.gap;
    const out = [];
    if (o.name) out.push(V.text(pre + 'name', (o.x || 0) - 10, (o.y || 0) + ch / 2 + 4, o.name, 'name', 'end'));
    vals.forEach((it, i) => {
      const obj = it !== null && typeof it === 'object';
      out.push(V.box(pre + (obj && it.id != null ? it.id : 'r' + i), (o.x || 0) + i * (cw + gap), o.y || 0, cw, ch, fmt(obj ? it.v : it), 'chip ' + ((o.hl && o.hl[i]) || '') + ' ' + (obj && it.cls ? it.cls : ''), { rx: 5, fs: o.fs }));
    });
    if (!vals.length && o.empty) out.push(V.text(pre + 'empty', o.x || 0, (o.y || 0) + ch / 2 + 4, o.empty, 'muted', 'start'));
    return out;
  };
})(typeof window !== 'undefined' ? window : globalThis);
