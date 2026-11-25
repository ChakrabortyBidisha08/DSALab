/* DSA Lab · sims/linked.js — Linked Lists (Schaum Ch. 5) */
(function (g) {
  'use strict';
  const DSA = g.DSA, U = DSA.U, V = DSA.V;
  const MAXN = 12;
  const node = (v) => ({ id: U.uid('n'), v });
  const LO = { x: 0, y: 0, per: 6, iw: 52, lw: 30, nh: 42, gx: 44, gy: 100 };
  const PC = { PTR: 'act', SAVE: 'sel', LOC: 'ok', LOCP: 'sel', NEW: 'act', PREV: 'sel', NEXT: 'cmp', LAST: 'sel', LOCA: 'sel', LOCB: 'cmp', P: 'act', Q: 'cmp' };
  const randList = (n) => () => U.randList(n, 1, 99, true).join(', ');
  const randSorted = (n) => () => U.randList(n, 1, 99, true).sort((a, b) => a - b).join(', ');
  const find = (sp, key) => sp.find((s) => s.key === key);
  const vOf = (S, id) => { const n = S.L.find((x) => x.id === id); return n ? n.v : S.fl && S.fl.id === id ? (S.fl.v == null ? 'NEW' : S.fl.v) : '?'; };
  const pName = (S, id) => (id === undefined ? '–' : id === null ? 'NULL' : '→' + vOf(S, id));
  const full = (S, R) => { if (S.L.length >= MAXN) { R.step(null, `**Overflow** — this demo keeps at most ${MAXN} nodes on screen (in a real program AVAIL = NULL).`, {}, { tone: 'bad' }); return true; } return false; };

  /* Pointer-based list drawing with a floating NEW node, bypass arcs and explicit link maps. */
  function drawList(st, f, extra) {
    const o = Object.assign({}, LO, extra || {});
    const n = st.L.length;
    if (st.links) o.per = Math.max(o.per, n);
    const ptrs = [], nulls = [];
    for (const k of Object.keys(st.p || {})) {
      const v = st.p[k];
      if (v === undefined) continue;
      if (v === null) nulls.push(k); else ptrs.push({ id: v, label: k, cls: PC[k] || '' });
    }
    const head = o.head === false ? null : (o.head || 'START');
    const sp = V.list('L', st.L, Object.assign({}, o, { hl: f.hl.n || {}, ehl: f.hl.e || {}, ptrs, head, headAt: f.hl.headAt }));
    const pos = (i) => V.listPos(o, i);
    const idx = {}; st.L.forEach((nd, i) => (idx[nd.id] = i));
    const linkC = (i) => { const q = pos(i); return [q.x + q.w - o.lw / 2, q.y + o.nh / 2]; };
    const by = f.hl.by;
    if (by && by.from != null && idx[by.from] != null) {
      const i = idx[by.from];
      const s = find(sp, 'La' + by.from);
      if (by.to == null) {
        const lk = find(sp, 'Ll' + by.from);
        if (lk) { lk.text = '×'; lk.cls += ' nil'; }
        if (s) sp.splice(sp.indexOf(s), 1);
      } else if (idx[by.to] != null) {
        const [sx, sy] = linkC(i), q = pos(idx[by.to]);
        const top = Math.min(pos(i).y, q.y) - 22;
        const pts = [[sx, sy], [sx, top], [(sx + q.x) / 2, top], [q.x + o.iw / 2, top], [q.x + o.iw / 2, q.y - 2]];
        if (s) { s.pts = pts; s.cls += ' act'; } else sp.push({ k: 'poly', key: 'La' + by.from, pts, cls: 'link act', arrow: true });
      }
    }
    if (st.links) {
      st.L.forEach((nd, i) => {
        const t = st.links[nd.id];
        const s = find(sp, 'La' + nd.id), lk = find(sp, 'Ll' + nd.id);
        const [sx, sy] = linkC(i);
        if (t == null) {
          if (s) sp.splice(sp.indexOf(s), 1);
          if (lk) { lk.text = '×'; if (!/ nil/.test(lk.cls)) lk.cls += ' nil'; }
          return;
        }
        if (lk) { lk.text = ''; lk.cls = lk.cls.replace(/ nil/g, ''); }
        const j = idx[t]; if (j == null) return;
        const q = pos(j);
        let pts;
        if (j === i + 1) pts = [[sx, sy], [sx + 8, sy], [(sx + q.x) / 2, q.y + o.nh / 2], [q.x - 8, q.y + o.nh / 2], [q.x - 2, q.y + o.nh / 2]];
        else { const yb = pos(i).y + o.nh + 26, tx = q.x + o.iw / 2; pts = [[sx, sy + 8], [sx, yb], [(sx + tx) / 2, yb], [tx, yb], [tx, q.y + o.nh + 2]]; }
        const spec = { k: 'poly', key: 'La' + nd.id, pts, cls: 'link ' + ((f.hl.e && f.hl.e[nd.id]) || ''), arrow: true };
        if (s) Object.assign(s, spec); else sp.push(spec);
      });
    }
    if (st.fl) {
      const at = Math.min(st.fl.at, n);
      const step = o.iw + o.lw + o.gx;
      const base = n ? pos(Math.min(at, n - 1)) : { x: o.x, y: o.y, w: o.iw + o.lw };
      const fx = n === 0 ? o.x : at < n ? base.x - step / 2 : base.x + base.w + o.gx / 2;
      const fy = base.y - 120;
      sp.push(V.box('Ln' + st.fl.id, fx, fy, o.iw, o.nh, st.fl.v == null ? '' : V.fmt(st.fl.v), 'info new', { rx: 4, top: 'NEW' }));
      sp.push(V.box('Ll' + st.fl.id, fx + o.iw, fy, o.lw, o.nh, st.fl.next === null ? '×' : '', 'lnk new' + (st.fl.next === null ? ' nil' : ''), { rx: 4 }));
      if (st.fl.next != null && idx[st.fl.next] != null) {
        const q = pos(idx[st.fl.next]);
        const sx = fx + o.iw + o.lw / 2, sy = fy + o.nh / 2, tx = q.x + o.iw / 2, my = (fy + o.nh + q.y) / 2;
        sp.push({ k: 'poly', key: 'La' + st.fl.id, pts: [[sx, sy], [sx + 20, sy], [sx + 20, my], [tx, my], [tx, q.y - 2]], cls: 'link new', arrow: true });
      }
      if (f.hl.toNew != null && idx[f.hl.toNew] != null) {
        const [lx, ly] = linkC(idx[f.hl.toNew]);
        const s = find(sp, 'La' + f.hl.toNew);
        const tx = fx + o.iw / 2, ty = fy + o.nh;
        const spec = { k: 'poly', key: 'La' + f.hl.toNew, pts: [[lx, ly], [lx, ly - 34], [(lx + tx) / 2, ty + 24], [tx, ty + 24], [tx, ty + 2]], cls: 'link act', arrow: true };
        if (s) Object.assign(s, spec); else sp.push(spec);
        const lk = find(sp, 'Ll' + f.hl.toNew); if (lk) { lk.text = ''; lk.cls = lk.cls.replace(/ nil/g, ''); }
      }
    }
    if (nulls.length) {
      const q = n ? pos(n - 1) : { x: o.x + 150, y: o.y, w: 0 };
      sp.push(V.text('Lnull', n ? q.x + q.w + 16 : q.x, q.y + o.nh + 44, nulls.join(', ') + ' = NULL', 'ptr ptrl', 'start'));
    }
    if (st.out && st.out.length) {
      const rows = Math.max(1, Math.ceil(n / o.per));
      sp.push(...V.row('O', st.out.map((v, i) => ({ id: 'o' + i, v })), { x: 0, y: rows * (o.nh + o.gy) + 10, name: st.outName || 'Output', cw: 40 }));
    }
    return sp;
  }

  /* ======================= Singly linked list ======================= */
  const SING = {
    traverse: ['TRAVERSE(INFO, LINK, START)', '1. [Begin at the first node.] Set PTR := START.', '2. Repeat Steps 3 and 4 while PTR ≠ NULL:', '  3. Apply PROCESS to INFO[PTR].', '  4. [Follow the link.] Set PTR := LINK[PTR].', '  [End of Step 2 loop.]', '5. Exit.'],
    search: ['SEARCH(INFO, LINK, START, ITEM, LOC)', '1. Set PTR := START.', '2. Repeat Step 3 while PTR ≠ NULL:', '  3. If ITEM = INFO[PTR], then: Set LOC := PTR, and Exit.', '     Else: Set PTR := LINK[PTR].', '  [End of Step 2 loop.]', '4. [Not found.] Set LOC := NULL.', '5. Exit.'],
    insfirst: ['INSFIRST(INFO, LINK, START, ITEM)', '1. [Get a node.] Allocate a free node NEW. [None free → OVERFLOW.]', '2. [Store the data.] Set INFO[NEW] := ITEM.', '3. [Point it at the old first node.] Set LINK[NEW] := START.', '4. [It becomes the first node.] Set START := NEW.', '5. Exit.'],
    insend: ['INSLAST(INFO, LINK, START, ITEM)', '1. Allocate NEW; Set INFO[NEW] := ITEM and LINK[NEW] := NULL.', '2. If START = NULL, then: Set START := NEW, and Exit.', '3. Set PTR := START.', '4. Repeat while LINK[PTR] ≠ NULL: Set PTR := LINK[PTR].', '5. [Old last node points to NEW.] Set LINK[PTR] := NEW.', '6. Exit.'],
    insloc: ['INSLOC(INFO, LINK, START, LOC, ITEM)', '1. Allocate a free node NEW. [None free → OVERFLOW.]', '2. Set INFO[NEW] := ITEM.', '3. If LOC = NULL, then: [Insert as the first node.]', '     Set LINK[NEW] := START and START := NEW.', '   Else: [Insert after node LOC.]', '     Set LINK[NEW] := LINK[LOC] and LINK[LOC] := NEW.', '4. Exit.'],
    inssort: ['INSSORTED(INFO, LINK, START, ITEM)', '1. If START = NULL, then: Set LOC := NULL, and go to Step 6.', '2. If ITEM < INFO[START], then: Set LOC := NULL, and go to Step 6.', '3. Set SAVE := START and PTR := LINK[START].', '4. Repeat while PTR ≠ NULL and INFO[PTR] ≤ ITEM:', '     Set SAVE := PTR and PTR := LINK[PTR].', '5. Set LOC := SAVE. [ITEM goes after node SAVE.]', '6. Call INSLOC(INFO, LINK, START, LOC, ITEM).', '7. Exit.'],
    delfirst: ['DELFIRST(INFO, LINK, START)', '1. If START = NULL, then: Write UNDERFLOW, and Exit.', '2. Set LOC := START. [The node to remove.]', '3. Set START := LINK[START]. [Second node becomes first.]', '4. [Free the node.] Set LINK[LOC] := AVAIL and AVAIL := LOC.', '5. Exit.'],
    delitem: ['DELETE(INFO, LINK, START, ITEM)', '1. If START = NULL, then: Write UNDERFLOW, and Exit.', '2. If INFO[START] = ITEM, then: Set LOC := START, LOCP := NULL, and go to Step 5.', '3. Set SAVE := START and PTR := LINK[START].', '4. Repeat while PTR ≠ NULL:', '     If INFO[PTR] = ITEM, then: Set LOC := PTR, LOCP := SAVE, and go to Step 5.', '     Set SAVE := PTR and PTR := LINK[PTR].', '   [End of loop.] Write: ITEM not in list, and Exit.', '5. If LOCP = NULL, then: Set START := LINK[START].', '   Else: Set LINK[LOCP] := LINK[LOC]. [Bypass node LOC.]', '6. [Free the node.] Set LINK[LOC] := AVAIL and AVAIL := LOC.', '7. Exit.'],
    reverse: ['REVERSE(INFO, LINK, START)', '1. Set PREV := NULL and PTR := START.', '2. Repeat Steps 3 to 5 while PTR ≠ NULL:', '  3. Set NEXT := LINK[PTR]. [Remember the rest of the list.]', '  4. Set LINK[PTR] := PREV. [Turn this link around.]', '  5. Set PREV := PTR and PTR := NEXT.', '  [End of Step 2 loop.]', '6. Set START := PREV.', '7. Exit.'],
  };

  /* Insert NEW after node LOC (index li, -1 = at the front). Shared by several ops. */
  function insertAfter(S, R, li, ITEM, lines) {
    const NEW = node(ITEM);
    const LOC = li >= 0 ? S.L[li].id : null;
    S.p.NEW = NEW.id;
    S.fl = { id: NEW.id, v: null, at: li + 1, next: undefined };
    R.step(lines[0], `Allocate a free node **NEW**.`);
    S.fl.v = ITEM;
    R.step(lines[1], `INFO[NEW] := ${ITEM}.`);
    if (LOC == null) {
      S.fl.next = S.L[0] ? S.L[0].id : null;
      R.step(lines[2], S.L[0] ? `LOC = NULL, so NEW goes first: LINK[NEW] := START (the node with ${S.L[0].v}).` : 'LOC = NULL and the list is empty: LINK[NEW] := START = NULL.');
      S.L.unshift(NEW); S.fl = null;
      R.step(lines[2], 'START := NEW — the new node is now the first node.', { n: { [NEW.id]: 'new' } }, { tone: 'ok' });
    } else {
      const nxt = S.L[li + 1];
      S.fl.next = nxt ? nxt.id : null;
      R.step(lines[3], nxt ? `LINK[NEW] := LINK[LOC] — NEW points to the node with ${nxt.v}.` : 'LINK[NEW] := LINK[LOC] = NULL — NEW will be the last node.', { n: { [LOC]: 'sel' } });
      R.step(lines[3], `LINK[LOC] := NEW — the node with ${S.L[li].v} now points to NEW.`, { n: { [LOC]: 'sel' }, toNew: LOC });
      S.L.splice(li + 1, 0, NEW); S.fl = null;
      R.step(lines[3], `Inserted ${ITEM} after ${S.L[li].v}. No other node moved in memory — only two links changed.`, { n: { [NEW.id]: 'new' } }, { tone: 'ok' });
    }
  }

  DSA.sim({
    id: 'll-singly', cat: 'linked', title: 'Singly Linked List', short: 'Singly linked list',
    tags: ['linked list', 'node', 'pointer', 'insert', 'delete', 'search', 'reverse', 'one-way list'],
    blurb: 'Each node holds INFO and a LINK to the next node; START points to the first. Traverse, search, insert (first, last, after a node, in sorted order), delete and reverse.',
    schaum: 'Schaum Ch. 5 · Linked lists',
    cx: [['Insert / delete at the front', 'O(1)'], ['Search, insert at the end', 'O(n)'], ['Insert after a known node', 'O(1)'], ['Reverse', 'O(n)']],
    theory: `<p>A <b>linked list</b> (one-way list) is a chain of nodes. Each node has two fields: <code>INFO</code>, the data, and <code>LINK</code>, the address of the next node. The pointer variable <code>START</code> holds the address of the first node, and the last node's LINK is <code>NULL</code> (×).</p>
      <p>Unlike an array, inserting or deleting never shifts data — you only <b>change links</b>. The price is that you cannot jump to the k-th node; you must follow links from START (sequential access).</p>
      <h3>Pointers used</h3><ul><li><code>PTR</code> walks along the list.</li><li><code>SAVE</code> trails one node behind PTR, so you still know the predecessor.</li><li><code>LOC</code> is the node found; <code>LOCP</code> its predecessor.</li><li><code>NEW</code> is a freshly allocated node (taken from the free-storage list AVAIL).</li></ul>`,
    algo: SING,
    controls: [
      { id: 'init', type: 'text', label: 'List', value: '12, 25, 37, 48', wide: true, reset: true, rand: randList(5) },
      { type: 'br' },
      { id: 'item', type: 'num', label: 'ITEM', value: 30, w: 80 },
      { id: 'pos', type: 'num', label: 'After node #', value: 2, min: 0, w: 70 },
      { type: 'br' },
      { type: 'btn', label: 'Traverse', op: 'traverse' },
      { type: 'btn', label: 'Search ITEM', op: 'search' },
      { type: 'sep' },
      { type: 'btn', label: 'Insert first', op: 'insfirst', kind: 'primary' },
      { type: 'btn', label: 'Insert last', op: 'insend' },
      { type: 'btn', label: 'Insert after #', op: 'insloc' },
      { type: 'btn', label: 'Insert sorted', op: 'inssort' },
      { type: 'br' },
      { type: 'btn', label: 'Delete first', op: 'delfirst', kind: 'danger' },
      { type: 'btn', label: 'Delete ITEM', op: 'delitem', kind: 'danger' },
      { type: 'btn', label: 'Reverse list', op: 'reverse' },
    ],
    init(p) { return { L: U.nums(p.init, { min: 0, max: MAXN, name: 'nodes' }).map(node), p: {}, fl: null, out: [] }; },
    vars0: (S) => ({ START: S.L.length ? '→' + S.L[0].v : 'NULL', nodes: S.L.length }),
    ops: {
      traverse(S, p, R) {
        R.algo('traverse');
        let i = 0, count = 0;
        R.vars(() => ({ PTR: pName(S, S.p.PTR), COUNT: count }));
        S.p.PTR = S.L[0] ? S.L[0].id : null; S.outName = 'Visited';
        R.step('1.', S.L.length ? `PTR := START — PTR points to the node holding ${S.L[0].v}.` : 'PTR := START = NULL — the list is empty.');
        while (S.p.PTR != null) {
          R.step('2.', 'PTR ≠ NULL, so the loop continues.');
          count++; S.out.push(S.L[i].v);
          R.step('3.', `PROCESS INFO[PTR] = **${S.L[i].v}**.`, { n: { [S.L[i].id]: 'act' } });
          i++; S.p.PTR = S.L[i] ? S.L[i].id : null;
          R.step('4.', S.L[i] ? `PTR := LINK[PTR] — move to ${S.L[i].v}.` : 'PTR := LINK[PTR] = NULL — we fell off the end.', { e: { [S.L[i - 1].id]: 'act' } });
        }
        R.step('2.', 'PTR = NULL, the loop ends.');
        R.step('5.', `Traversal visited ${count} node(s).`, {}, { tone: 'ok' });
        S.p = {}; S.out = [];
      },
      search(S, p, R) {
        const ITEM = U.num(p.item, { name: 'ITEM' });
        R.algo('search');
        let i = 0, cmp = 0;
        R.vars(() => ({ ITEM, PTR: pName(S, S.p.PTR), LOC: pName(S, S.p.LOC), comparisons: cmp }));
        S.p.PTR = S.L[0] ? S.L[0].id : null;
        R.step('1.', 'PTR := START.');
        while (S.p.PTR != null) {
          R.step('2.', 'PTR ≠ NULL.');
          cmp++;
          if (S.L[i].v === ITEM) {
            S.p.LOC = S.L[i].id;
            R.step('3.', `INFO[PTR] = ${ITEM} = ITEM → found! LOC := PTR (node #${i + 1}).`, { n: { [S.L[i].id]: 'ok' } }, { tone: 'ok' });
            S.p = {}; return;
          }
          R.step('3.', `INFO[PTR] = ${S.L[i].v} ≠ ${ITEM}.`, { n: { [S.L[i].id]: 'cmp' } });
          i++; S.p.PTR = S.L[i] ? S.L[i].id : null;
          R.step('Else', S.L[i] ? `PTR := LINK[PTR] → ${S.L[i].v}.` : 'PTR := LINK[PTR] = NULL.', { e: { [S.L[i - 1].id]: 'act' } });
        }
        S.p.LOC = null;
        R.step('4.', `PTR = NULL — ${ITEM} is not in the list. LOC := NULL after ${cmp} comparison(s).`, {}, { tone: 'bad' });
        S.p = {};
      },
      insfirst(S, p, R) {
        const ITEM = U.num(p.item, { name: 'ITEM' });
        R.algo('insfirst').vars(() => ({ ITEM, START: S.L.length ? '→' + S.L[0].v : 'NULL', NEW: pName(S, S.p.NEW) }));
        if (full(S, R)) return;
        const NEW = node(ITEM);
        S.fl = { id: NEW.id, v: null, at: 0, next: undefined }; S.p.NEW = NEW.id;
        R.step('1.', 'Allocate a free node **NEW**.');
        S.fl.v = ITEM; R.step('2.', `INFO[NEW] := ${ITEM}.`);
        S.fl.next = S.L[0] ? S.L[0].id : null;
        R.step('3.', S.L[0] ? `LINK[NEW] := START — NEW points to the old first node (${S.L[0].v}).` : 'LINK[NEW] := START = NULL.');
        S.L.unshift(NEW); S.fl = null;
        R.step('4.', 'START := NEW. Done in constant time — no traversal needed.', { n: { [NEW.id]: 'new' } }, { tone: 'ok' });
        S.p = {};
      },
      insend(S, p, R) {
        const ITEM = U.num(p.item, { name: 'ITEM' });
        R.algo('insend').vars(() => ({ ITEM, PTR: pName(S, S.p.PTR), NEW: pName(S, S.p.NEW) }));
        if (full(S, R)) return;
        const NEW = node(ITEM);
        S.fl = { id: NEW.id, v: ITEM, at: S.L.length, next: null }; S.p.NEW = NEW.id;
        R.step('1.', `NEW holds ${ITEM} and its LINK is NULL — it will be the last node.`);
        if (!S.L.length) { S.L.push(NEW); S.fl = null; R.step('2.', 'The list was empty, so START := NEW.', { n: { [NEW.id]: 'new' } }, { tone: 'ok' }); S.p = {}; return; }
        R.step('2.', 'START ≠ NULL, so we must find the last node.');
        let i = 0; S.p.PTR = S.L[0].id;
        R.step('3.', `PTR := START (${S.L[0].v}).`, { n: { [S.L[0].id]: 'act' } });
        while (i < S.L.length - 1) {
          i++; S.p.PTR = S.L[i].id;
          R.step('4.', `LINK[PTR] ≠ NULL → PTR := LINK[PTR] (${S.L[i].v}).`, { n: { [S.L[i].id]: 'act' }, e: { [S.L[i - 1].id]: 'act' } });
        }
        R.step('4.', `LINK[PTR] = NULL — PTR is at the last node (${S.L[i].v}).`, { n: { [S.L[i].id]: 'sel' } });
        R.step('5.', `LINK[PTR] := NEW.`, { n: { [S.L[i].id]: 'sel' }, toNew: S.L[i].id });
        S.L.push(NEW); S.fl = null;
        R.step('6.', `Appended ${ITEM}. It took ${S.L.length - 1} step(s) to reach the end — O(n).`, { n: { [NEW.id]: 'new' } }, { tone: 'ok' });
        S.p = {};
      },
      insloc(S, p, R) {
        const ITEM = U.num(p.item, { name: 'ITEM' });
        const pos = U.num(p.pos, { lo: 0, hi: S.L.length, name: 'node # (0 = insert first)' });
        R.algo('insloc').vars(() => ({ ITEM, LOC: pos ? '→' + S.L[pos - 1].v : 'NULL', NEW: pName(S, S.p.NEW) }));
        if (full(S, R)) return;
        if (pos) S.p.LOC = S.L[pos - 1].id;
        R.step(null, pos ? `LOC = node #${pos} (holding ${S.L[pos - 1].v}). Insert ${ITEM} right after it.` : `LOC = NULL, so ${ITEM} is inserted as the first node.`, pos ? { n: { [S.L[pos - 1].id]: 'sel' } } : {});
        insertAfter(S, R, pos - 1, ITEM, ['1.', '2.', '3.', 'Else']);
        S.p = {};
      },
      inssort(S, p, R) {
        const ITEM = U.num(p.item, { name: 'ITEM' });
        R.algo('inssort').vars(() => ({ ITEM, SAVE: pName(S, S.p.SAVE), PTR: pName(S, S.p.PTR), LOC: pName(S, S.p.LOC) }));
        if (full(S, R)) return;
        for (let i = 1; i < S.L.length; i++) if (S.L[i - 1].v > S.L[i].v) { R.step(null, 'This list is **not sorted**, so “insert sorted” would put ITEM in a misleading place. Use the dice for a sorted list or type one in ascending order.', {}, { tone: 'bad' }); return; }
        let li = -1;
        if (!S.L.length) { S.p.LOC = null; R.step('1.', 'START = NULL, so LOC := NULL.'); }
        else if (ITEM < S.L[0].v) { S.p.LOC = null; R.step('2.', `${ITEM} < INFO[START] = ${S.L[0].v} → LOC := NULL (insert at the front).`, { n: { [S.L[0].id]: 'cmp' } }); }
        else {
          R.step('2.', `${ITEM} ≥ INFO[START] = ${S.L[0].v}, so ITEM goes somewhere after the first node.`, { n: { [S.L[0].id]: 'cmp' } });
          let s = 0; S.p.SAVE = S.L[0].id; S.p.PTR = S.L[1] ? S.L[1].id : null;
          R.step('3.', 'SAVE := START, PTR := LINK[START].');
          while (S.L[s + 1] && S.L[s + 1].v <= ITEM) {
            R.step('4.', `INFO[PTR] = ${S.L[s + 1].v} ≤ ${ITEM}, keep going.`, { n: { [S.L[s + 1].id]: 'cmp' } });
            s++; S.p.SAVE = S.L[s].id; S.p.PTR = S.L[s + 1] ? S.L[s + 1].id : null;
            R.step('     Set SAVE', 'SAVE := PTR and PTR := LINK[PTR].');
          }
          R.step('4.', S.L[s + 1] ? `INFO[PTR] = ${S.L[s + 1].v} > ${ITEM} — stop.` : 'PTR = NULL — stop.', S.L[s + 1] ? { n: { [S.L[s + 1].id]: 'cmp' } } : {});
          S.p.LOC = S.L[s].id; li = s;
          R.step('5.', `LOC := SAVE (node ${S.L[s].v}).`, { n: { [S.L[s].id]: 'sel' } });
        }
        S.p.SAVE = undefined; S.p.PTR = undefined;
        insertAfter(S, R, li, ITEM, ['6.', '6.', '6.', '6.']);
        S.p = {};
      },
      delfirst(S, p, R) {
        R.algo('delfirst').vars(() => ({ START: S.L.length ? '→' + S.L[0].v : 'NULL', LOC: pName(S, S.p.LOC) }));
        if (!S.L.length) { R.step('1.', '**Underflow** — START = NULL, the list is empty.', {}, { tone: 'bad' }); return; }
        const first = S.L[0];
        S.p.LOC = first.id;
        R.step('2.', `LOC := START (${first.v}).`, { n: { [first.id]: 'bad' } });
        R.step('3.', S.L[1] ? `START := LINK[START] — START now points to ${S.L[1].v}.` : 'START := LINK[START] = NULL — the list becomes empty.', { n: { [first.id]: 'bad' }, headAt: 1 });
        S.L.shift(); S.p = {};
        R.step('4.', `Node ${first.v} goes back to the free-storage list. O(1).`, {}, { tone: 'ok' });
      },
      delitem(S, p, R) {
        const ITEM = U.num(p.item, { name: 'ITEM' });
        R.algo('delitem').vars(() => ({ ITEM, SAVE: pName(S, S.p.SAVE), PTR: pName(S, S.p.PTR), LOC: pName(S, S.p.LOC), LOCP: pName(S, S.p.LOCP) }));
        if (!S.L.length) { R.step('1.', '**Underflow** — the list is empty.', {}, { tone: 'bad' }); return; }
        let k = -1;
        if (S.L[0].v === ITEM) { k = 0; S.p.LOC = S.L[0].id; S.p.LOCP = null; R.step('2.', `INFO[START] = ${ITEM} — the first node is the one to delete. LOCP := NULL.`, { n: { [S.L[0].id]: 'bad' } }); }
        else {
          R.step('2.', `INFO[START] = ${S.L[0].v} ≠ ${ITEM}.`, { n: { [S.L[0].id]: 'cmp' } });
          S.p.SAVE = S.L[0].id; S.p.PTR = S.L[1] ? S.L[1].id : null;
          R.step('3.', 'SAVE := START, PTR := LINK[START].');
          let i = 1;
          while (i < S.L.length) {
            R.step('4.', 'PTR ≠ NULL.');
            if (S.L[i].v === ITEM) { k = i; S.p.LOC = S.L[i].id; S.p.LOCP = S.L[i - 1].id; S.p.PTR = undefined; S.p.SAVE = undefined; R.step('If INFO[PTR]', `INFO[PTR] = ${ITEM} → LOC := PTR, LOCP := SAVE (${S.L[i - 1].v}).`, { n: { [S.L[i].id]: 'bad' } }); break; }
            R.step('If INFO[PTR]', `INFO[PTR] = ${S.L[i].v} ≠ ${ITEM}.`, { n: { [S.L[i].id]: 'cmp' } });
            i++; S.p.SAVE = S.L[i - 1].id; S.p.PTR = S.L[i] ? S.L[i].id : null;
            R.step('Set SAVE', 'SAVE := PTR and PTR := LINK[PTR].', { e: { [S.L[i - 1].id]: 'act' } });
          }
          if (k < 0) { R.step('[End', `PTR = NULL — ${ITEM} is not in the list; nothing deleted.`, {}, { tone: 'bad' }); S.p = {}; return; }
        }
        const doomed = S.L[k];
        if (k === 0) R.step('5.', S.L[1] ? `LOCP = NULL → START := LINK[START] (${S.L[1].v}).` : 'LOCP = NULL → START := LINK[START] = NULL.', { n: { [doomed.id]: 'bad' }, headAt: 1 });
        else R.step('Else', `LINK[LOCP] := LINK[LOC] — ${S.L[k - 1].v} now skips over ${ITEM}` + (S.L[k + 1] ? ` straight to ${S.L[k + 1].v}.` : ' and becomes the last node.'), { n: { [doomed.id]: 'bad' }, by: { from: S.L[k - 1].id, to: S.L[k + 1] ? S.L[k + 1].id : null } });
        S.L.splice(k, 1); S.p = {};
        R.step('6.', `Node ${ITEM} is returned to AVAIL. Deleted.`, {}, { tone: 'ok' });
      },
      reverse(S, p, R) {
        R.algo('reverse');
        const order = S.L.slice();
        S.links = {}; order.forEach((nd, i) => (S.links[nd.id] = order[i + 1] ? order[i + 1].id : null));
        R.vars(() => ({ PREV: pName(S, S.p.PREV), PTR: pName(S, S.p.PTR), NEXT: pName(S, S.p.NEXT) }));
        S.p.PREV = null; S.p.PTR = order[0] ? order[0].id : null;
        R.step('1.', 'PREV := NULL, PTR := START.');
        let i = 0;
        while (i < order.length) {
          const cur = order[i];
          R.step('2.', `PTR ≠ NULL (${cur.v}).`, { n: { [cur.id]: 'act' } });
          S.p.NEXT = order[i + 1] ? order[i + 1].id : null;
          R.step('3.', `NEXT := LINK[PTR] = ${order[i + 1] ? order[i + 1].v : 'NULL'}.`, { n: { [cur.id]: 'act' } });
          S.links[cur.id] = i ? order[i - 1].id : null;
          R.step('4.', `LINK[PTR] := PREV — ${cur.v} now points ${i ? 'back to ' + order[i - 1].v : 'to NULL'}.`, { n: { [cur.id]: 'act' }, e: { [cur.id]: 'cmp' } });
          S.p.PREV = cur.id; S.p.PTR = S.p.NEXT; i++;
          R.step('5.', 'PREV := PTR, PTR := NEXT.');
        }
        S.p.NEXT = undefined;
        R.step('2.', 'PTR = NULL — every link has been turned around.');
        S.L = order.slice().reverse(); S.links = null; S.p = {};
        R.step('6.', 'START := PREV. The list now runs the other way.', {}, { tone: 'ok' });
      },
    },
    view(st, f) { return { specs: drawList(st, f), minH: 260, minW: 560 }; },
  });

  /* ======================= Memory representation (INFO / LINK / AVAIL) ======================= */
  const MEM = 12;
  function memInit(p) {
    const vals = U.nums(p.init, { min: 0, max: 8, name: 'nodes' });
    const INFO = Array(MEM + 1).fill(null), LINK = Array(MEM + 1).fill(0);
    const places = [3, 7, 1, 10, 5, 12, 8, 2].slice(0, vals.length);
    vals.forEach((v, i) => { INFO[places[i]] = v; LINK[places[i]] = places[i + 1] || 0; });
    const free = U.range(MEM).map((i) => i + 1).filter((a) => !places.includes(a));
    free.forEach((a, i) => (LINK[a] = free[i + 1] || 0));
    return { INFO, LINK, START: places[0] || 0, AVAIL: free[0] || 0, p: {} };
  }
  const chain = (S, start) => { const out = []; let a = start, guard = 0; while (a && guard++ < 40) { out.push(a); a = S.LINK[a]; } return out; };
  DSA.sim({
    id: 'll-memory', cat: 'linked', title: 'Linked List in Memory (INFO, LINK, AVAIL)', short: 'Memory: INFO / LINK / AVAIL',
    tags: ['avail', 'free storage', 'garbage collection', 'parallel arrays', 'memory representation'],
    blurb: 'A list stored in two parallel arrays INFO and LINK. START points to the first node; unused cells form a second list, AVAIL, the free-storage list. Watch nodes move between the two.',
    schaum: 'Schaum Ch. 5 · Representation in memory, AVAIL list',
    cx: [['Get a node from AVAIL', 'O(1)'], ['Return a node to AVAIL', 'O(1)']],
    theory: `<p>Before pointers and <code>malloc</code>, a linked list was kept in <b>parallel arrays</b>: <code>INFO[K]</code> holds the data of node K and <code>LINK[K]</code> holds the <i>index</i> of the next node. <code>NULL</code> is written as 0.</p>
      <p>All unused cells are chained into a second list whose first cell is <code>AVAIL</code>. Insertion <b>takes</b> the first cell of AVAIL; deletion <b>gives</b> the cell back by putting it at the front of AVAIL. When AVAIL = NULL and a node is needed, that is <b>overflow</b>; deleting from an empty list is <b>underflow</b>. Periodically collecting freed cells back into AVAIL is called <b>garbage collection</b>.</p>`,
    algo: {
      traverse: ['TRAVERSE(INFO, LINK, START)', '1. Set PTR := START.', '2. Repeat while PTR ≠ NULL:', '     Apply PROCESS to INFO[PTR] and Set PTR := LINK[PTR].', '3. Exit.'],
      insfirst: ['INSFIRST(INFO, LINK, START, AVAIL, ITEM)', '1. [Free cell left?] If AVAIL = NULL, then: Write OVERFLOW, and Exit.', '2. [Take the first free cell.] Set NEW := AVAIL and AVAIL := LINK[AVAIL].', '3. Set INFO[NEW] := ITEM.', '4. Set LINK[NEW] := START.', '5. Set START := NEW.', '6. Exit.'],
      del: ['DELETE(INFO, LINK, START, AVAIL, ITEM)', '1. Find LOC (node holding ITEM) and LOCP (its predecessor). [Not found → Exit.]', '2. If LOCP = NULL, then: Set START := LINK[START].', '   Else: Set LINK[LOCP] := LINK[LOC].', '3. [Give the cell back.] Set LINK[LOC] := AVAIL.', '4. Set AVAIL := LOC.', '5. Exit.'],
    },
    controls: [
      { id: 'init', type: 'text', label: 'List', value: 'ANT, BEE, CAT, DOG', wide: true, reset: true },
      { type: 'br' },
      { id: 'item', type: 'text', label: 'ITEM', value: 'EEL', w: 90 },
      { type: 'btn', label: 'Insert first', op: 'insfirst', kind: 'primary' },
      { type: 'btn', label: 'Delete ITEM', op: 'del', kind: 'danger' },
      { type: 'btn', label: 'Traverse', op: 'traverse' },
    ],
    init(p) {
      const vals = U.tokens(p.init, { min: 0, max: 8, maxLen: 4, name: 'nodes' });
      const S = memInit({ init: vals.map((_, i) => i).join(',') || '' });
      const places = chain(S, S.START);
      places.forEach((a, i) => (S.INFO[a] = vals[i]));
      return S;
    },
    vars0: (S) => ({ START: S.START || 'NULL', AVAIL: S.AVAIL || 'NULL' }),
    ops: {
      traverse(S, p, R) {
        R.algo('traverse');
        R.vars(() => ({ START: S.START || 'NULL', PTR: S.p.PTR == null ? '–' : S.p.PTR || 'NULL' }));
        S.p.PTR = S.START;
        R.step('1.', `PTR := START = ${S.START || 'NULL'}.`);
        while (S.p.PTR) {
          const a = S.p.PTR;
          R.step('     Apply', `INFO[${a}] = **${S.INFO[a]}**; PTR := LINK[${a}] = ${S.LINK[a] || 'NULL'}.`, { row: a });
          S.p.PTR = S.LINK[a];
        }
        R.step('2.', 'PTR = NULL — end of the list.', {}, { tone: 'ok' });
        S.p = {};
      },
      insfirst(S, p, R) {
        const ITEM = String(p.item || '').trim();
        if (!ITEM || ITEM.length > 4) U.fail('Type ITEM (up to 4 characters).');
        R.algo('insfirst').vars(() => ({ ITEM, START: S.START || 'NULL', AVAIL: S.AVAIL || 'NULL', NEW: S.p.NEW || '–' }));
        if (!S.AVAIL) { R.step('1.', '**Overflow** — AVAIL = NULL, every cell is in use.', {}, { tone: 'bad' }); return; }
        R.step('1.', `AVAIL = ${S.AVAIL} ≠ NULL, so a free cell exists.`, { row: S.AVAIL });
        const NEW = S.AVAIL; S.p.NEW = NEW; S.AVAIL = S.LINK[NEW];
        R.step('2.', `NEW := AVAIL = ${NEW}; AVAIL := LINK[${NEW}] = ${S.AVAIL || 'NULL'}.`, { row: NEW });
        S.INFO[NEW] = ITEM; R.step('3.', `INFO[${NEW}] := ${ITEM}.`, { row: NEW });
        S.LINK[NEW] = S.START; R.step('4.', `LINK[${NEW}] := START = ${S.START || 'NULL'}.`, { row: NEW });
        S.START = NEW; R.step('5.', `START := ${NEW}. Cell ${NEW} moved from the AVAIL list to the front of the data list.`, { row: NEW }, { tone: 'ok' });
        S.p = {};
      },
      del(S, p, R) {
        const ITEM = String(p.item || '').trim();
        R.algo('del').vars(() => ({ ITEM, START: S.START || 'NULL', AVAIL: S.AVAIL || 'NULL', LOC: S.p.LOC || '–', LOCP: S.p.LOCP == null ? '–' : S.p.LOCP || 'NULL' }));
        if (!S.START) { R.step('1.', '**Underflow** — the list is empty.', {}, { tone: 'bad' }); return; }
        let save = 0, a = S.START;
        while (a && String(S.INFO[a]) !== ITEM) { R.step('1.', `INFO[${a}] = ${S.INFO[a]} ≠ ${ITEM}.`, { row: a }); save = a; a = S.LINK[a]; }
        if (!a) { R.step('1.', `${ITEM} is not in the list.`, {}, { tone: 'bad' }); return; }
        S.p.LOC = a; S.p.LOCP = save;
        R.step('1.', `Found ${ITEM} in cell LOC = ${a}; LOCP = ${save || 'NULL'}.`, { row: a, bad: true });
        if (!save) { S.START = S.LINK[a]; R.step('2.', `LOCP = NULL → START := LINK[${a}] = ${S.START || 'NULL'}.`, { row: a, bad: true }); }
        else { S.LINK[save] = S.LINK[a]; R.step('Else', `LINK[${save}] := LINK[${a}] = ${S.LINK[a] || 'NULL'} — cell ${save} skips cell ${a}.`, { row: save }); }
        S.LINK[a] = S.AVAIL; S.INFO[a] = null;
        R.step('3.', `LINK[${a}] := AVAIL = ${S.AVAIL || 'NULL'}.`, { row: a });
        S.AVAIL = a; R.step('4.', `AVAIL := ${a}. The cell is free again (front of AVAIL).`, { row: a }, { tone: 'ok' });
        S.p = {};
      },
    },
    view(st, f) {
      const sp = [], rh = 30, tx = 0, ty = 30;
      sp.push(V.text('th0', tx + 14, ty - 14, '#', 'idx'), V.text('th1', tx + 64, ty - 14, 'INFO', 'name'), V.text('th2', tx + 128, ty - 14, 'LINK', 'name'));
      const inList = new Set(chain(st, st.START)), free = new Set(chain(st, st.AVAIL));
      for (let k = 1; k <= MEM; k++) {
        const y = ty + (k - 1) * rh;
        const tone = f.hl.row === k ? (f.hl.bad ? 'bad' : 'act') : inList.has(k) ? '' : 'dim';
        sp.push(V.text('rk' + k, tx + 14, y + rh / 2, k, 'idx'));
        sp.push(V.box('mi' + k, tx + 32, y, 66, rh - 3, st.INFO[k] == null ? '' : st.INFO[k], 'mcell ' + tone, { rx: 3, fs: 13 }));
        sp.push(V.box('ml' + k, tx + 102, y, 50, rh - 3, st.LINK[k] || 0, 'mcell ' + tone, { rx: 3, fs: 13 }));
      }
      const pt = (label, a, dy, cls) => {
        const y = a ? ty + (a - 1) * rh + rh / 2 - 1 : ty + MEM * rh + 12 + dy;
        sp.push(V.text('pt' + label, tx - 64, y + 4 + (a ? dy : 0), `${label}${a ? '' : ' = NULL'}`, 'ptr ptrl ' + cls, 'end'));
        if (a) sp.push(V.line('pa' + label, tx - 60, y + dy, tx + 30, y, 'ptr ' + cls, true));
      };
      pt('START', st.START, -6, 'head');
      pt('AVAIL', st.AVAIL, 8, 'sel');
      // logical views
      const lx = 250;
      const data = chain(st, st.START).map((a) => ({ id: a, v: st.INFO[a] }));
      const avail = chain(st, st.AVAIL).map((a) => ({ id: a, v: '' }));
      const lo = { iw: 52, lw: 30, nh: 36, gx: 30, gy: 60, per: 5 };
      const hl = f.hl.row ? { [f.hl.row]: f.hl.bad ? 'bad' : 'act' } : {};
      sp.push(V.text('lt1', lx, 0, 'Data list (follow START)', 'title', 'start'));
      sp.push(...V.list('L', data, Object.assign({ x: lx, y: 44, head: 'START', hl, addr: (nd) => 'cell ' + nd.id, linkText: (nd) => String(st.LINK[nd.id] || '×') }, lo)));
      const ay = 44 + Math.max(1, Math.ceil(data.length / 5)) * (lo.nh + lo.gy) + 50;
      sp.push(V.text('lt2', lx, ay - 44, 'Free-storage list (follow AVAIL)', 'title', 'start'));
      sp.push(...V.list('L', avail, Object.assign({ x: lx, y: ay, head: 'AVAIL', hl, addr: (nd) => 'cell ' + nd.id, linkText: (nd) => String(st.LINK[nd.id] || '×') }, lo)));
      return { specs: sp, minH: 380 };
    },
  });

  /* ======================= Circular list (with LAST pointer) ======================= */
  DSA.sim({
    id: 'll-circular', cat: 'linked', title: 'Circular Linked List', short: 'Circular list',
    tags: ['circular', 'ring', 'last pointer'],
    blurb: 'The last node links back to the first, so there is no NULL at the end. Keeping a pointer to the LAST node gives O(1) insertion at both ends.',
    schaum: 'Schaum Ch. 5 · Circular lists',
    cx: [['Insert at front / end (with LAST)', 'O(1)'], ['Delete first', 'O(1)'], ['Traverse', 'O(n)']],
    theory: `<p>In a <b>circular list</b> the LINK of the last node points back to the first node. A traversal therefore stops when it comes back to where it started, not at NULL.</p>
      <p>Storing a pointer to the <b>last</b> node is the usual trick: the first node is simply <code>LINK[LAST]</code>, so both ends are reachable in one step. Circular lists are used for round-robin scheduling and buffers that wrap around.</p>`,
    algo: {
      insfirst: ['CINSFIRST(LAST, ITEM)', '1. Allocate NEW and Set INFO[NEW] := ITEM.', '2. If LAST = NULL, then: Set LINK[NEW] := NEW and LAST := NEW, and Exit.', '3. Set LINK[NEW] := LINK[LAST]. [NEW points to the old first node.]', '4. Set LINK[LAST] := NEW. [The ring now enters at NEW.]', '5. Exit.'],
      insend: ['CINSLAST(LAST, ITEM)', '1. Allocate NEW and Set INFO[NEW] := ITEM.', '2. If LAST = NULL, then: Set LINK[NEW] := NEW and LAST := NEW, and Exit.', '3. Set LINK[NEW] := LINK[LAST] and LINK[LAST] := NEW.', '4. Set LAST := NEW. [Same as insert-first, plus moving LAST.]', '5. Exit.'],
      delfirst: ['CDELFIRST(LAST)', '1. If LAST = NULL, then: Write UNDERFLOW, and Exit.', '2. Set FIRST := LINK[LAST].', '3. If FIRST = LAST, then: Set LAST := NULL, and Exit. [Only one node.]', '4. Set LINK[LAST] := LINK[FIRST]. [Bypass the old first node.]', '5. Free FIRST and Exit.'],
      traverse: ['CTRAVERSE(LAST)', '1. If LAST = NULL, then: Exit.', '2. Set PTR := LINK[LAST]. [Start at the first node.]', '3. Repeat: Apply PROCESS to INFO[PTR] and Set PTR := LINK[PTR],', '     until PTR = LINK[LAST]. [Back where we started.]', '4. Exit.'],
    },
    controls: [
      { id: 'init', type: 'text', label: 'List', value: '5, 10, 15, 20', wide: true, reset: true, rand: randList(4) },
      { type: 'br' },
      { id: 'item', type: 'num', label: 'ITEM', value: 25, w: 80 },
      { type: 'btn', label: 'Insert first', op: 'insfirst', kind: 'primary' },
      { type: 'btn', label: 'Insert last', op: 'insend' },
      { type: 'btn', label: 'Delete first', op: 'delfirst', kind: 'danger' },
      { type: 'btn', label: 'Traverse', op: 'traverse' },
    ],
    init(p) { return { L: U.nums(p.init, { min: 0, max: MAXN, name: 'nodes' }).map(node), p: {}, fl: null, out: [] }; },
    vars0: (S) => ({ LAST: S.L.length ? '→' + S.L[S.L.length - 1].v : 'NULL' }),
    ops: {
      insfirst(S, p, R) { this.ins(S, p, R, false); },
      insend(S, p, R) { this.ins(S, p, R, true); },
      delfirst(S, p, R) {
        R.algo('delfirst').vars(() => ({ LAST: S.L.length ? '→' + S.L[S.L.length - 1].v : 'NULL', FIRST: pName(S, S.p.FIRST) }));
        if (!S.L.length) { R.step('1.', '**Underflow** — LAST = NULL.', {}, { tone: 'bad' }); return; }
        const first = S.L[0];
        S.p.FIRST = first.id; R.step('2.', `FIRST := LINK[LAST] (${first.v}).`, { n: { [first.id]: 'bad' } });
        if (S.L.length === 1) { S.L = []; S.p = {}; R.step('3.', 'FIRST = LAST — it was the only node. LAST := NULL.', {}, { tone: 'ok' }); return; }
        R.step('4.', `LINK[LAST] := LINK[FIRST] — the last node now points to ${S.L[1].v}.`, { n: { [first.id]: 'bad' }, circ: 1 });
        S.L.shift(); S.p = {};
        R.step('5.', `${first.v} removed.`, {}, { tone: 'ok' });
      },
      traverse(S, p, R) {
        R.algo('traverse').vars(() => ({ PTR: pName(S, S.p.PTR) }));
        if (!S.L.length) { R.step('1.', 'LAST = NULL — nothing to traverse.'); return; }
        S.p.PTR = S.L[0].id; S.outName = 'Visited';
        R.step('2.', `PTR := LINK[LAST] — start at ${S.L[0].v}.`);
        for (let i = 0; i < S.L.length; i++) {
          S.out.push(S.L[i].v); S.p.PTR = S.L[i].id;
          R.step('3.', `PROCESS ${S.L[i].v}.`, { n: { [S.L[i].id]: 'act' } });
        }
        S.p.PTR = S.L[0].id;
        R.step('     until', `PTR := LINK[PTR] brings us back to ${S.L[0].v} = LINK[LAST] — stop.`, { n: { [S.L[0].id]: 'ok' }, circ: 'act' }, { tone: 'ok' });
        S.p = {}; S.out = [];
      },
    },
    ins(S, p, R, atEnd) {
      const ITEM = U.num(p.item, { name: 'ITEM' });
      R.algo(atEnd ? 'insend' : 'insfirst').vars(() => ({ ITEM, LAST: S.L.length ? '→' + S.L[S.L.length - 1].v : 'NULL' }));
      if (full(S, R)) return;
      const NEW = node(ITEM);
      S.fl = { id: NEW.id, v: ITEM, at: atEnd ? S.L.length : 0, next: undefined };
      R.step('1.', `NEW holds ${ITEM}.`);
      if (!S.L.length) { S.L.push(NEW); S.fl = null; R.step('2.', 'The list was empty: NEW points to itself and LAST := NEW.', { n: { [NEW.id]: 'new' } }, { tone: 'ok' }); return; }
      S.fl.next = S.L[0].id;
      R.step('3.', `LINK[NEW] := LINK[LAST] — NEW points to the first node (${S.L[0].v}).`);
      if (atEnd) { S.L.push(NEW); S.fl = null; R.step('3.', 'LINK[LAST] := NEW.', { n: { [NEW.id]: 'new' } }); R.step('4.', `LAST := NEW — ${ITEM} is the new last node.`, { n: { [NEW.id]: 'new' } }, { tone: 'ok' }); }
      else { S.L.unshift(NEW); S.fl = null; R.step('4.', `LINK[LAST] := NEW — ${ITEM} is the new first node (LAST did not move).`, { n: { [NEW.id]: 'new' } }, { tone: 'ok' }); }
    },
    view(st, f) {
      const sp = drawList(st, f, { head: false, circular: true, circCls: f.hl.circ === 'act' ? 'act' : '' });
      if (st.L.length) {
        const q = V.listPos(LO, st.L.length - 1);
        sp.push(...V.ptr('LLAST', q.x + LO.iw / 2, q.y - 2, 'LAST', 'sel', 'top', 26));
        if (f.hl.circ === 1 && st.L.length > 1) {
          const s = find(sp, 'Lcirc');
          if (s) { const p1 = V.listPos(LO, 1), P = s.pts; s.pts = [P[0], P[1], P[2], [p1.x - 22, P[2][1]], [p1.x - 22, p1.y + LO.nh / 2], [p1.x - 2, p1.y + LO.nh / 2]]; s.cls += ' act'; }
        }
      }
      return { specs: sp, minH: 260, minW: 560 };
    },
  });

  /* ======================= Header linked list ======================= */
  DSA.sim({
    id: 'll-header', cat: 'linked', title: 'Header Linked Lists', short: 'Header list',
    tags: ['header node', 'grounded', 'circular header'],
    blurb: 'A special header node sits at the front of the list and is never deleted. Grounded header lists end in NULL; circular header lists link back to the header.',
    schaum: 'Schaum Ch. 5 · Header linked lists',
    cx: [['Insert / delete (no special first-node case)', 'O(n) search + O(1) relink']],
    theory: `<p>A <b>header list</b> always starts with a header node whose INFO is not part of the data (it may hold a count or a title). <code>START</code> points to the header, and the first real node is <code>LINK[START]</code>.</p>
      <ul><li><b>Grounded header list</b>: the last node's LINK is NULL.</li><li><b>Circular header list</b>: the last node's LINK points back to the header, so “end of list” means <code>PTR = START</code>.</li></ul>
      <p>The big win: every real node has a predecessor (at worst the header), so insertion and deletion need <b>no special case</b> for the first node. Polynomials are often stored this way.</p>`,
    algo: {
      traverse: ['HTRAVERSE(INFO, LINK, START)', '1. Set PTR := LINK[START]. [Skip the header.]', '2. Repeat Steps 3 and 4 while PTR ≠ END:', '  3. Apply PROCESS to INFO[PTR].', '  4. Set PTR := LINK[PTR].', '5. Exit. [END is NULL (grounded) or START (circular).]'],
      ins: ['HINSERT(INFO, LINK, START, ITEM) — sorted', '1. Set SAVE := START and PTR := LINK[START].', '2. Repeat while PTR ≠ END and INFO[PTR] < ITEM:', '     Set SAVE := PTR and PTR := LINK[PTR].', '3. Allocate NEW; Set INFO[NEW] := ITEM.', '4. Set LINK[NEW] := PTR and LINK[SAVE] := NEW.', '5. Exit. [No special case: SAVE is at worst the header.]'],
      del: ['HDELETE(INFO, LINK, START, ITEM)', '1. Set SAVE := START and PTR := LINK[START].', '2. Repeat while PTR ≠ END and INFO[PTR] ≠ ITEM:', '     Set SAVE := PTR and PTR := LINK[PTR].', '3. If PTR = END, then: Write: not found, and Exit.', '4. Set LINK[SAVE] := LINK[PTR]. [Bypass PTR.]', '5. Free PTR and Exit.'],
    },
    controls: [
      { id: 'kind', type: 'select', label: 'Kind', value: 'circ', reset: true, opts: [['ground', 'Grounded header list'], ['circ', 'Circular header list']] },
      { id: 'init', type: 'text', label: 'List', value: '14, 29, 41, 56', wide: true, reset: true, rand: randSorted(4) },
      { type: 'br' },
      { id: 'item', type: 'num', label: 'ITEM', value: 33, w: 80 },
      { type: 'btn', label: 'Insert (sorted)', op: 'ins', kind: 'primary' },
      { type: 'btn', label: 'Delete ITEM', op: 'del', kind: 'danger' },
      { type: 'btn', label: 'Traverse', op: 'traverse' },
    ],
    init(p) {
      const vals = U.nums(p.init, { min: 0, max: MAXN - 1, name: 'nodes' }).sort((a, b) => a - b);
      return { L: [{ id: 'hdr', v: 'HEAD', cls: 'hdr' }].concat(vals.map(node)), p: {}, fl: null, out: [], circ: p.kind === 'circ' };
    },
    ops: {
      traverse(S, p, R) {
        R.algo('traverse').vars(() => ({ PTR: pName(S, S.p.PTR), END: S.circ ? 'START' : 'NULL' }));
        S.outName = 'Visited';
        let i = 1; S.p.PTR = S.L[1] ? S.L[1].id : S.circ ? 'hdr' : null;
        R.step('1.', 'PTR := LINK[START] — skip the header node.');
        while (i < S.L.length) {
          S.out.push(S.L[i].v);
          R.step('3.', `PROCESS ${S.L[i].v}.`, { n: { [S.L[i].id]: 'act' } });
          i++; S.p.PTR = S.L[i] ? S.L[i].id : S.circ ? 'hdr' : null;
          R.step('4.', 'PTR := LINK[PTR].', { e: { [S.L[i - 1].id]: 'act' } });
        }
        R.step('2.', S.circ ? 'PTR = START (back at the header) — stop.' : 'PTR = NULL — stop.', S.circ ? { n: { hdr: 'ok' } } : {}, { tone: 'ok' });
        S.p = {}; S.out = [];
      },
      ins(S, p, R) {
        const ITEM = U.num(p.item, { name: 'ITEM' });
        R.algo('ins').vars(() => ({ ITEM, SAVE: pName(S, S.p.SAVE), PTR: pName(S, S.p.PTR) }));
        if (full(S, R)) return;
        let s = 0; S.p.SAVE = 'hdr'; S.p.PTR = S.L[1] ? S.L[1].id : S.circ ? 'hdr' : null;
        R.step('1.', 'SAVE := START (the header), PTR := LINK[START].');
        while (S.L[s + 1] && S.L[s + 1].v < ITEM) {
          R.step('2.', `${S.L[s + 1].v} < ${ITEM}, move on.`, { n: { [S.L[s + 1].id]: 'cmp' } });
          s++; S.p.SAVE = S.L[s].id; S.p.PTR = S.L[s + 1] ? S.L[s + 1].id : S.circ ? 'hdr' : null;
          R.step('     Set SAVE', 'SAVE := PTR and PTR := LINK[PTR].');
        }
        R.step('2.', `Stop: ${S.L[s + 1] ? S.L[s + 1].v + ' ≥ ' + ITEM : 'PTR reached the END'}. Insert after SAVE (${S.L[s].v}).`, { n: { [S.L[s].id]: 'sel' } });
        const NEW = node(ITEM);
        S.fl = { id: NEW.id, v: ITEM, at: s + 1, next: S.L[s + 1] ? S.L[s + 1].id : S.circ ? 'hdr' : null };
        if (S.fl.next === 'hdr') S.fl.next = 'hdr';
        R.step('3.', `NEW holds ${ITEM}.`);
        R.step('4.', 'LINK[NEW] := PTR and LINK[SAVE] := NEW.', { toNew: S.L[s].id });
        S.L.splice(s + 1, 0, NEW); S.fl = null; S.p = {};
        R.step('5.', s === 0 ? 'Inserted right after the header — still no special case!' : 'Inserted.', { n: { [NEW.id]: 'new' } }, { tone: 'ok' });
      },
      del(S, p, R) {
        const ITEM = U.num(p.item, { name: 'ITEM' });
        R.algo('del').vars(() => ({ ITEM, SAVE: pName(S, S.p.SAVE), PTR: pName(S, S.p.PTR) }));
        let s = 0; S.p.SAVE = 'hdr'; S.p.PTR = S.L[1] ? S.L[1].id : S.circ ? 'hdr' : null;
        R.step('1.', 'SAVE := START, PTR := LINK[START].');
        while (S.L[s + 1] && S.L[s + 1].v !== ITEM) {
          R.step('2.', `${S.L[s + 1].v} ≠ ${ITEM}.`, { n: { [S.L[s + 1].id]: 'cmp' } });
          s++; S.p.SAVE = S.L[s].id; S.p.PTR = S.L[s + 1] ? S.L[s + 1].id : S.circ ? 'hdr' : null;
          R.step('     Set SAVE', 'SAVE := PTR and PTR := LINK[PTR].');
        }
        if (!S.L[s + 1]) { R.step('3.', `PTR = END — ${ITEM} is not in the list.`, {}, { tone: 'bad' }); S.p = {}; return; }
        const doomed = S.L[s + 1];
        R.step('3.', `Found ${ITEM}.`, { n: { [doomed.id]: 'bad' } });
        R.step('4.', `LINK[SAVE] := LINK[PTR] — ${S.L[s].v} skips ${ITEM}.`, { n: { [doomed.id]: 'bad' }, by: { from: S.L[s].id, to: S.L[s + 2] ? S.L[s + 2].id : null } });
        S.L.splice(s + 1, 1); S.p = {};
        R.step('5.', 'Deleted — the header made the first-node case disappear.', {}, { tone: 'ok' });
      },
    },
    view(st, f) {
      const sp = drawList(st, f, { circular: st.circ });
      const h = find(sp, 'Lnhdr'); if (h) h.cls += ' hdr';
      if (st.circ) { const s = find(sp, 'Lcirc'); if (s && f.hl.n && f.hl.n.hdr === 'ok') s.cls += ' ok'; }
      return { specs: sp, minH: 260, minW: 560 };
    },
  });

  /* ======================= Two-way (doubly) linked list ======================= */
  const DO = { doubly: true, iw: 50, lw: 26, nh: 42, gx: 40, gy: 100, per: 5 };
  DSA.sim({
    id: 'll-doubly', cat: 'linked', title: 'Two-Way (Doubly) Linked List', short: 'Doubly linked list',
    tags: ['two-way', 'doubly', 'forw', 'back', 'prev', 'next'],
    blurb: 'Each node has BACK (previous) and FORW (next) pointers, so the list can be walked in both directions and a node can be deleted knowing only its own address.',
    schaum: 'Schaum Ch. 5 · Two-way lists',
    cx: [['Delete a known node', 'O(1)'], ['Insert between two known nodes', 'O(1)'], ['Traverse either way', 'O(n)']],
    theory: `<p>A <b>two-way list</b> stores three fields per node: <code>BACK</code>, <code>INFO</code>, <code>FORW</code>. <code>FIRST</code> points to the first node and <code>LAST</code> to the last.</p>
      <p>Deleting node <code>LOC</code> takes two assignments and needs no search for the predecessor:</p>
      <p class="formula">FORW[BACK[LOC]] := FORW[LOC] &nbsp;and&nbsp; BACK[FORW[LOC]] := BACK[LOC]</p>
      <p>The cost is one extra pointer per node and two links to update on every insertion.</p>`,
    algo: {
      ins: ['INSTWL(INFO, FORW, BACK, LOCA, LOCB, ITEM)', '1. Allocate NEW and Set INFO[NEW] := ITEM.', '2. [Hook NEW between LOCA and LOCB.]', '     Set FORW[LOCA] := NEW and FORW[NEW] := LOCB.', '     Set BACK[LOCB] := NEW and BACK[NEW] := LOCA.', '3. Exit. [At either end, FIRST or LAST is updated instead.]'],
      del: ['DELTWL(INFO, FORW, BACK, LOC)', '1. Set FORW[BACK[LOC]] := FORW[LOC]. [Or FIRST := FORW[LOC] if LOC is first.]', '2. Set BACK[FORW[LOC]] := BACK[LOC]. [Or LAST := BACK[LOC] if LOC is last.]', '3. Free node LOC.', '4. Exit.'],
      fwd: ['Traverse forward', '1. Set PTR := FIRST.', '2. Repeat while PTR ≠ NULL:', '     Apply PROCESS to INFO[PTR] and Set PTR := FORW[PTR].', '3. Exit.'],
      bwd: ['Traverse backward', '1. Set PTR := LAST.', '2. Repeat while PTR ≠ NULL:', '     Apply PROCESS to INFO[PTR] and Set PTR := BACK[PTR].', '3. Exit.'],
    },
    controls: [
      { id: 'init', type: 'text', label: 'List', value: '11, 22, 33, 44', wide: true, reset: true, rand: randList(4) },
      { type: 'br' },
      { id: 'item', type: 'num', label: 'ITEM', value: 27, w: 80 },
      { id: 'pos', type: 'num', label: 'Position #', value: 3, min: 1, w: 70 },
      { type: 'btn', label: 'Insert at #', op: 'ins', kind: 'primary' },
      { type: 'btn', label: 'Delete node #', op: 'del', kind: 'danger' },
      { type: 'btn', label: 'Forward', op: 'fwd' },
      { type: 'btn', label: 'Backward', op: 'bwd' },
    ],
    init(p) { return { L: U.nums(p.init, { min: 0, max: 10, name: 'nodes' }).map(node), p: {}, out: [] }; },
    ops: {
      ins(S, p, R) {
        const ITEM = U.num(p.item, { name: 'ITEM' });
        const pos = U.num(p.pos, { lo: 1, hi: S.L.length + 1, name: 'position' });
        R.algo('ins').vars(() => ({ ITEM, LOCA: pName(S, S.p.LOCA), LOCB: pName(S, S.p.LOCB) }));
        if (S.L.length >= 10) { R.step(null, '**Overflow** — this demo keeps at most 10 nodes.', {}, { tone: 'bad' }); return; }
        const A = S.L[pos - 2], B = S.L[pos - 1];
        S.p.LOCA = A ? A.id : null; S.p.LOCB = B ? B.id : null;
        const NEW = node(ITEM);
        R.step('1.', `NEW holds ${ITEM}. It goes between ${A ? A.v : 'the start'} and ${B ? B.v : 'the end'}.`, { n: Object.assign({}, A ? { [A.id]: 'sel' } : {}, B ? { [B.id]: 'cmp' } : {}) });
        S.L.splice(pos - 1, 0, NEW);
        R.step('     Set FORW[LOCA]', A ? `FORW[LOCA] := NEW and FORW[NEW] := LOCB.` : 'NEW is first: FIRST := NEW and FORW[NEW] := LOCB.', { n: { [NEW.id]: 'new' }, e: Object.assign({ [NEW.id]: 'act' }, A ? { [A.id]: 'act' } : {}) });
        R.step('     Set BACK[LOCB]', B ? 'BACK[LOCB] := NEW and BACK[NEW] := LOCA.' : 'NEW is last: LAST := NEW and BACK[NEW] := LOCA.', { n: { [NEW.id]: 'new' }, b: Object.assign({ [NEW.id]: 'act' }, A ? { [A.id]: 'act' } : {}) });
        S.p = {};
        R.step('3.', `Inserted ${ITEM} with four pointer assignments.`, { n: { [NEW.id]: 'new' } }, { tone: 'ok' });
      },
      del(S, p, R) {
        R.algo('del').vars(() => ({ LOC: pName(S, S.p.LOC) }));
        if (!S.L.length) { R.step(null, '**Underflow** — the list is empty.', {}, { tone: 'bad' }); return; }
        const pos = U.num(p.pos, { lo: 1, hi: S.L.length, name: 'position' });
        const L = S.L[pos - 1], A = S.L[pos - 2], B = S.L[pos];
        S.p.LOC = L.id;
        R.step(null, `LOC = node #${pos} (${L.v}). No search for the predecessor is needed: BACK[LOC] already knows it.`, { n: { [L.id]: 'bad' } });
        R.step('1.', A ? `FORW[BACK[LOC]] := FORW[LOC] — ${A.v} now points forward to ${B ? B.v : 'NULL'}.` : `LOC is first, so FIRST := FORW[LOC] (${B ? B.v : 'NULL'}).`, { n: { [L.id]: 'bad' } });
        R.step('2.', B ? `BACK[FORW[LOC]] := BACK[LOC] — ${B.v} now points back to ${A ? A.v : 'NULL'}.` : `LOC is last, so LAST := BACK[LOC] (${A ? A.v : 'NULL'}).`, { n: { [L.id]: 'bad' } });
        S.L.splice(pos - 1, 1); S.p = {};
        R.step('3.', `Node ${L.v} freed.`, {}, { tone: 'ok' });
      },
      fwd(S, p, R) { this.walk(S, R, false); },
      bwd(S, p, R) { this.walk(S, R, true); },
    },
    walk(S, R, back) {
      R.algo(back ? 'bwd' : 'fwd').vars(() => ({ PTR: pName(S, S.p.PTR) }));
      const order = back ? S.L.slice().reverse() : S.L.slice();
      S.outName = back ? 'Backward' : 'Forward';
      S.p.PTR = order[0] ? order[0].id : null;
      R.step('1.', back ? 'PTR := LAST.' : 'PTR := FIRST.');
      order.forEach((nd, i) => {
        S.out.push(nd.v); S.p.PTR = nd.id;
        R.step('     Apply', `PROCESS ${nd.v}; PTR := ${back ? 'BACK' : 'FORW'}[PTR].`, { n: { [nd.id]: 'act' } });
      });
      S.p.PTR = null;
      R.step('2.', 'PTR = NULL — done.', {}, { tone: 'ok' });
      S.p = {}; S.out = [];
    },
    view(st, f) {
      const n = st.L.length;
      const ptrs = [], nulls = [];
      for (const k of Object.keys(st.p)) { const v = st.p[k]; if (v === undefined) continue; if (v === null) nulls.push(k); else ptrs.push({ id: v, label: k, cls: PC[k] || 'act' }); }
      const sp = V.list('D', st.L, Object.assign({ hl: f.hl.n || {}, ehl: f.hl.e || {}, bhl: f.hl.b || {}, ptrs, head: 'FIRST' }, DO));
      if (n) { const q = V.listPos(DO, n - 1); sp.push(...V.ptr('DLAST', q.x + DO.lw + DO.iw / 2, q.y - 2, 'LAST', 'sel', 'top', 26)); }
      if (st.out && st.out.length) sp.push(...V.row('O', st.out.map((v, i) => ({ id: 'o' + i, v })), { x: 0, y: Math.max(1, Math.ceil(n / DO.per)) * (DO.nh + DO.gy) + 10, name: st.outName, cw: 40 }));
      return { specs: sp, minH: 260, minW: 560 };
    },
  });

  /* ======================= Polynomial addition ======================= */
  const SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  const term = (c, e) => (e === 0 ? String(c) : (c === 1 ? '' : c === -1 ? '−' : c) + 'x' + (e === 1 ? '' : String(e).split('').map((d) => SUP[d]).join('')));
  function parsePoly(str, name) {
    const s = String(str).replace(/\s+/g, '').replace(/−/g, '-');
    if (!s) U.fail(`Enter polynomial ${name}, e.g. 5x^3 + 4x^2 + 2`);
    const terms = {};
    const re = /([+-]?)(\d*)(x(?:\^(\d+))?)?/g;
    let m, any = false;
    while ((m = re.exec(s)) && m[0] !== '') {
      if (!m[2] && !m[3]) U.fail(`Could not read polynomial ${name} near “${m[0]}”.`);
      const c = (m[1] === '-' ? -1 : 1) * (m[2] ? Number(m[2]) : 1);
      const e = m[3] ? (m[4] ? Number(m[4]) : 1) : 0;
      if (e > 9) U.fail('Keep exponents at 9 or below.');
      terms[e] = (terms[e] || 0) + c; any = true;
    }
    if (!any || re.lastIndex < s.length && s.slice(re.lastIndex)) U.fail(`Could not read polynomial ${name}.`);
    const out = Object.keys(terms).map(Number).filter((e) => terms[e] !== 0).sort((a, b) => b - a).map((e) => ({ id: U.uid('t'), c: terms[e], e }));
    if (out.length > 7) U.fail('Use at most 7 terms per polynomial.');
    return out;
  }
  DSA.sim({
    id: 'll-poly', cat: 'linked', title: 'Polynomial Addition with Linked Lists', short: 'Polynomial addition',
    tags: ['polynomial', 'coefficient', 'exponent', 'application'],
    blurb: 'Each term (coefficient, exponent) is a node, in decreasing order of exponent. Walk both lists together, like merging, to build P + Q.',
    schaum: 'Schaum Ch. 5 · Polynomials (header lists)',
    cx: [['P with m terms + Q with n terms', 'O(m + n)']],
    theory: `<p>A polynomial such as <code>5x³ + 4x² + 2</code> is stored as a linked list of terms, each node holding a coefficient and an exponent, sorted by <b>decreasing exponent</b>. (The textbook adds a header node; it is omitted here to keep the picture small.)</p>
      <p>Addition walks two pointers P and Q along the lists:</p>
      <ul><li>larger exponent on one side → copy that term and advance that pointer;</li><li>equal exponents → add coefficients (drop the term if the sum is 0) and advance both;</li><li>when one list ends, copy the rest of the other.</li></ul>`,
    algo: { add: ['POLYADD(P, Q, R)', '1. Set PTR1 := P and PTR2 := Q; R := empty list.', '2. Repeat while PTR1 ≠ NULL and PTR2 ≠ NULL:', '     If EXP[PTR1] > EXP[PTR2]: append term PTR1 to R; PTR1 := LINK[PTR1].', '     Else if EXP[PTR1] < EXP[PTR2]: append term PTR2 to R; PTR2 := LINK[PTR2].', '     Else: SUM := COEF[PTR1] + COEF[PTR2]; if SUM ≠ 0, append (SUM, EXP);', '           advance both pointers.', '3. Append the remaining terms of whichever list is not finished.', '4. Exit.'] },
    controls: [
      { id: 'p', type: 'text', label: 'P(x)', value: '5x^3 + 4x^2 - 3x + 2', wide: true, run: true },
      { id: 'q', type: 'text', label: 'Q(x)', value: '3x^4 - 4x^2 + 7x + 6', wide: true, run: true },
      { type: 'btn', label: 'Add P + Q', op: 'play', kind: 'primary' },
    ],
    auto: 'add',
    init(p) { return { P: parsePoly(p.p, 'P'), Q: parsePoly(p.q, 'Q'), R: [], i: 0, j: 0 }; },
    ops: {
      add(S, p, R) {
        R.vars(() => ({ PTR1: S.P[S.i] ? term(S.P[S.i].c, S.P[S.i].e) : 'NULL', PTR2: S.Q[S.j] ? term(S.Q[S.j].c, S.Q[S.j].e) : 'NULL', terms: S.R.length }));
        R.step('1.', 'PTR1 := P, PTR2 := Q, and the result R starts empty.');
        while (S.i < S.P.length && S.j < S.Q.length) {
          const a = S.P[S.i], b = S.Q[S.j];
          if (a.e > b.e) { S.R.push({ id: U.uid('r'), c: a.c, e: a.e }); S.i++; R.step('     If EXP', `x^${a.e} only appears in P → copy ${term(a.c, a.e)}.`, { pa: a.id }); }
          else if (a.e < b.e) { S.R.push({ id: U.uid('r'), c: b.c, e: b.e }); S.j++; R.step('     Else if', `x^${b.e} only appears in Q → copy ${term(b.c, b.e)}.`, { qa: b.id }); }
          else {
            const sum = a.c + b.c; S.i++; S.j++;
            if (sum) { S.R.push({ id: U.uid('r'), c: sum, e: a.e }); R.step('     Else: SUM', `Same exponent ${a.e}: ${a.c} + ${b.c} = ${sum} → ${term(sum, a.e)}.`, { pa: a.id, qa: b.id }); }
            else R.step('     Else: SUM', `Same exponent ${a.e}: ${a.c} + ${b.c} = 0 → the term cancels, nothing appended.`, { pa: a.id, qa: b.id }, { tone: 'cmp' });
          }
        }
        while (S.i < S.P.length) { const a = S.P[S.i++]; S.R.push({ id: U.uid('r'), c: a.c, e: a.e }); R.step('3.', `Q is finished — copy ${term(a.c, a.e)} from P.`, { pa: a.id }); }
        while (S.j < S.Q.length) { const b = S.Q[S.j++]; S.R.push({ id: U.uid('r'), c: b.c, e: b.e }); R.step('3.', `P is finished — copy ${term(b.c, b.e)} from Q.`, { qa: b.id }); }
        R.step('4.', 'P + Q = ' + (S.R.length ? S.R.map((t, i) => (i && t.c > 0 ? '+ ' : '') + term(t.c, t.e)).join(' ') : '0'), {}, { tone: 'ok' });
      },
    },
    view(st, f) {
      const lo = { iw: 58, lw: 26, nh: 40, gx: 34, gy: 60, per: 7 };
      const toNodes = (arr) => arr.map((t) => ({ id: t.id, v: term(t.c, t.e) }));
      const sp = [];
      const lab = (k, y, t) => sp.push(V.text(k, -16, y + 24, t, 'name', 'end'));
      lab('lp', 0, 'P'); lab('lq', 110, 'Q'); lab('lr', 230, 'P + Q');
      const hlP = {}, hlQ = {};
      st.P.forEach((t, i) => (hlP[t.id] = i < st.i ? 'dim' : ''));
      st.Q.forEach((t, i) => (hlQ[t.id] = i < st.j ? 'dim' : ''));
      if (f.hl.pa) hlP[f.hl.pa] = 'act';
      if (f.hl.qa) hlQ[f.hl.qa] = 'cmp';
      sp.push(...V.list('P', toNodes(st.P), Object.assign({ x: 0, y: 0, hl: hlP, ptrs: st.P[st.i] ? [{ id: st.P[st.i].id, label: 'PTR1', cls: 'act' }] : [] }, lo)));
      sp.push(...V.list('Q', toNodes(st.Q), Object.assign({ x: 0, y: 110, hl: hlQ, ptrs: st.Q[st.j] ? [{ id: st.Q[st.j].id, label: 'PTR2', cls: 'cmp' }] : [] }, lo)));
      if (st.R.length) sp.push(...V.list('R', toNodes(st.R), Object.assign({ x: 0, y: 230, hl: { [st.R[st.R.length - 1].id]: f.line && f.tone !== 'ok' ? 'new' : '' } }, lo)));
      else sp.push(V.text('Rempty', 0, 254, '(empty)', 'muted', 'start'));
      return { specs: sp, minH: 320 };
    },
  });
})(typeof window !== 'undefined' ? window : globalThis);
