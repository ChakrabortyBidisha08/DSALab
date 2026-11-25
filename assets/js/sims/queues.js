/* DSA Lab · sims/queues.js — Queues, deques, priority queues (Schaum Ch. 6) */
(function (g) {
  'use strict';
  const DSA = g.DSA, U = DSA.U, V = DSA.V;
  const item = (v) => ({ id: U.uid('q'), v });
  const nul = (x) => (x ? x : 'NULL');

  /* Draw an array queue (linear strip), optionally with a ring above it. */
  function arrayQueue(st, f, o) {
    o = o || {};
    const sp = [];
    const N = st.N, cw = 50, ch = 40;
    const ay = o.ring ? 330 : 70;
    const hl = {};
    if (f.hl.nw != null) hl[f.hl.nw - 1] = 'new';
    if (f.hl.out != null) hl[f.hl.out - 1] = 'bad';
    if (f.hl.full) for (let i = 0; i < N; i++) if (st.Q[i]) hl[i] = 'bad';
    const ptrs = [];
    if (st.F) ptrs.push({ i: st.F - 1, label: o.lname || 'FRONT', cls: 'act', side: 'top' });
    if (st.R) ptrs.push({ i: st.R - 1, label: o.rname || 'REAR', cls: 'sel', side: 'bottom' });
    sp.push(...V.array('A', st.Q, { x: 0, y: ay, cw, ch, hl, ptrs, name: o.name || 'QUEUE' }));
    if (!st.F) sp.push(V.text('emp', 0, ay + ch + 46, `${o.lname || 'FRONT'} = ${o.rname || 'REAR'} = NULL (empty)`, 'muted', 'start'));
    if (st.fl) sp.push(V.box('Ac' + st.fl.id, o.flx != null ? o.flx : -110, ay - 4, cw, ch, V.fmt(st.fl.v), 'bad', { top: 'ITEM' }));
    if (o.ring) {
      const cx = ((N - 1) * (cw + 6)) / 2 + cw / 2, cy = 130, r = Math.max(78, N * 12);
      sp.push({ k: 'circle', key: 'ringbg', x: cx, y: cy, r, text: '', cls: 'ringbg' });
      for (let i = 0; i < N; i++) {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / N, x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
        const it = st.Q[i];
        sp.push(V.box('Rs' + i, x - 21, y - 17, 42, 34, it ? V.fmt(it.v) : '', 'cell ' + (it ? '' : 'slot ') + (hl[i] || ''), { rx: 6 }));
        sp.push(V.text('Ri' + i, cx + (r - 36) * Math.cos(a), cy + (r - 36) * Math.sin(a) + 4, i + 1, 'idx'));
      }
      const mark = (lab, idx, cls, dr) => {
        if (!idx) return;
        const a = -Math.PI / 2 + ((idx - 1) * 2 * Math.PI) / N;
        const x1 = cx + (r + 26) * Math.cos(a), y1 = cy + (r + 26) * Math.sin(a);
        sp.push(V.line('Rp' + lab, cx + (r + 54 + dr) * Math.cos(a), cy + (r + 54 + dr) * Math.sin(a), x1, y1, 'ptr ' + cls, true));
        sp.push(V.text('Rt' + lab, cx + (r + 72 + dr) * Math.cos(a), cy + (r + 72 + dr) * Math.sin(a) + 4, lab, 'ptr ptrl ' + cls));
      };
      mark(o.lname || 'FRONT', st.F, 'act', 0);
      mark(o.rname || 'REAR', st.R, 'sel', st.F === st.R ? 30 : 0);
    }
    return sp;
  }
  function queueInit(p) {
    const N = U.num(p.n, { lo: 2, hi: 10, name: 'N' });
    const vals = String(p.init).trim() ? U.nums(p.init, { max: N, name: 'starting items' }) : [];
    const Q = Array(N).fill(null);
    vals.forEach((v, i) => (Q[i] = item(v)));
    return { N, Q, F: vals.length ? 1 : 0, R: vals.length, fl: null };
  }

  /* ---------------- Linear queue ---------------- */
  DSA.sim({
    id: 'queue-linear', cat: 'queues', title: 'Queue in an Array (linear)', short: 'Queue (linear array)',
    tags: ['enqueue', 'dequeue', 'fifo', 'front', 'rear', 'overflow'],
    blurb: 'A queue is FIFO: insert at REAR, delete at FRONT. In a plain array both pointers only move right, so space freed at the front is never reused — watch the false “overflow”.',
    schaum: 'Schaum Ch. 6 · Queues',
    cx: [['Insert (enqueue)', 'O(1)'], ['Delete (dequeue)', 'O(1)'], ['Wasted cells', 'up to N − 1']],
    theory: `<p>A <b>queue</b> is a list where elements are deleted at one end, the <b>FRONT</b>, and inserted at the other, the <b>REAR</b> — first in, first out (<b>FIFO</b>), like a line at a ticket counter.</p>
      <p>In a simple array implementation REAR reaches N after N insertions and the queue reports <b>overflow</b> even if most cells at the front were freed by deletions. Shifting everything left would cost O(n) per deletion; the standard fix is the <a href="#/sim/queue-circular">circular queue</a>.</p>`,
    algo: {
      ins: ['QINSERT(QUEUE, N, FRONT, REAR, ITEM) — linear', '1. If REAR = N, then: Write OVERFLOW, and Return. [No cell after REAR.]', '2. If FRONT = NULL, then: Set FRONT := 1 and REAR := 1. [Queue was empty.]', '   Else: Set REAR := REAR + 1.', '3. Set QUEUE[REAR] := ITEM.', '4. Return.'],
      del: ['QDELETE(QUEUE, FRONT, REAR, ITEM) — linear', '1. If FRONT = NULL, then: Write UNDERFLOW, and Return.', '2. Set ITEM := QUEUE[FRONT].', '3. If FRONT = REAR, then: Set FRONT := NULL and REAR := NULL. [Now empty.]', '   Else: Set FRONT := FRONT + 1.', '4. Return.'],
    },
    controls: [
      { id: 'n', type: 'num', label: 'N', value: 6, min: 2, max: 10, reset: true, w: 64 },
      { id: 'init', type: 'text', label: 'Start with', value: '11, 22, 33', reset: true, w: 150 },
      { type: 'br' },
      { id: 'item', type: 'num', label: 'ITEM', value: 44, w: 80, enter: 'ins' },
      { type: 'btn', label: 'Insert at REAR', op: 'ins', kind: 'primary' },
      { type: 'btn', label: 'Delete at FRONT', op: 'del', kind: 'danger' },
    ],
    init: queueInit,
    vars0: (S) => ({ FRONT: nul(S.F), REAR: nul(S.R), N: S.N }),
    ops: {
      ins(S, p, R) {
        const ITEM = U.num(p.item, { name: 'ITEM' });
        R.algo('ins').vars(() => ({ FRONT: nul(S.F), REAR: nul(S.R), N: S.N, ITEM }));
        if (S.R === S.N) {
          const free = S.Q.filter((x) => !x).length;
          R.step('1.', `**Overflow**: REAR = N = ${S.N}.` + (free ? ` Yet ${free} cell(s) at the front are free — the linear queue cannot reuse them. A circular queue fixes this.` : ''), { full: true }, { tone: 'bad' });
          return;
        }
        if (!S.F) { S.F = 1; S.R = 1; R.step('2.', 'The queue was empty: FRONT := 1 and REAR := 1.'); }
        else { S.R++; R.step('Else', `REAR := REAR + 1 = ${S.R}.`); }
        S.Q[S.R - 1] = item(ITEM);
        R.step('3.', `QUEUE[${S.R}] := ${ITEM}.`, { nw: S.R }, { tone: 'ok' });
      },
      del(S, p, R) {
        R.algo('del').vars(() => ({ FRONT: nul(S.F), REAR: nul(S.R), ITEM: S.fl ? S.fl.v : '–' }));
        if (!S.F) { R.step('1.', '**Underflow** — FRONT = NULL, the queue is empty.', {}, { tone: 'bad' }); return; }
        R.step('2.', `ITEM := QUEUE[${S.F}] = **${S.Q[S.F - 1].v}**.`, { out: S.F });
        S.fl = S.Q[S.F - 1]; S.Q[S.F - 1] = null;
        if (S.F === S.R) { S.F = S.R = 0; R.step('3.', 'FRONT = REAR, so that was the last element: FRONT := REAR := NULL.'); }
        else { S.F++; R.step('Else', `FRONT := FRONT + 1 = ${S.F}. Cell ${S.F - 1} is now wasted in a linear queue.`); }
        R.step('4.', `Deleted ${S.fl.v}.`, {}, { tone: 'ok' });
        S.fl = null;
      },
    },
    view(st, f) { return { specs: arrayQueue(st, f), minH: 230, minW: 560 }; },
  });

  /* ---------------- Circular queue ---------------- */
  DSA.sim({
    id: 'queue-circular', cat: 'queues', title: 'Circular Queue', short: 'Circular queue',
    tags: ['circular queue', 'ring buffer', 'wrap around', 'front', 'rear'],
    blurb: 'Treat QUEUE[1] as following QUEUE[N]. When REAR or FRONT reaches N, the next step wraps to 1, so every freed cell gets reused.',
    schaum: 'Schaum Ch. 6 · Queues (circular array)',
    cx: [['Insert', 'O(1)'], ['Delete', 'O(1)'], ['Usable cells', 'all N']],
    theory: `<p>The textbook's array queue is <b>circular</b>: after <code>QUEUE[N]</code> comes <code>QUEUE[1]</code>. Both pointers advance with wrap-around, so the queue drifts around the ring and never wastes cells.</p>
      <p>The queue is <b>full</b> when <code>FRONT = 1 and REAR = N</code>, or when <code>FRONT = REAR + 1</code>; it is <b>empty</b> when <code>FRONT = NULL</code>. (Many C programs instead compute <code>rear = (rear + 1) % n</code> and keep a count.)</p>`,
    algo: {
      ins: ['QINSERT(QUEUE, N, FRONT, REAR, ITEM)', '1. [Full?] If (FRONT = 1 and REAR = N) or FRONT = REAR + 1, then:', '     Write OVERFLOW, and Return.', '2. [New REAR.] If FRONT = NULL, then: Set FRONT := 1 and REAR := 1.', '   Else if REAR = N, then: Set REAR := 1. [Wrap around.]', '   Else: Set REAR := REAR + 1.', '3. Set QUEUE[REAR] := ITEM.', '4. Return.'],
      del: ['QDELETE(QUEUE, N, FRONT, REAR, ITEM)', '1. [Empty?] If FRONT = NULL, then: Write UNDERFLOW, and Return.', '2. Set ITEM := QUEUE[FRONT].', '3. [New FRONT.] If FRONT = REAR, then: Set FRONT := NULL and REAR := NULL.', '   Else if FRONT = N, then: Set FRONT := 1. [Wrap around.]', '   Else: Set FRONT := FRONT + 1.', '4. Return.'],
    },
    controls: [
      { id: 'n', type: 'num', label: 'N', value: 6, min: 2, max: 10, reset: true, w: 64 },
      { id: 'init', type: 'text', label: 'Start with', value: '11, 22, 33, 44', reset: true, w: 150 },
      { type: 'br' },
      { id: 'item', type: 'num', label: 'ITEM', value: 55, w: 80, enter: 'ins' },
      { type: 'btn', label: 'Insert at REAR', op: 'ins', kind: 'primary' },
      { type: 'btn', label: 'Delete at FRONT', op: 'del', kind: 'danger' },
    ],
    init: queueInit,
    vars0: (S) => ({ FRONT: nul(S.F), REAR: nul(S.R), N: S.N }),
    ops: {
      ins(S, p, R) {
        const ITEM = U.num(p.item, { name: 'ITEM' });
        R.algo('ins').vars(() => ({ FRONT: nul(S.F), REAR: nul(S.R), N: S.N, ITEM }));
        if ((S.F === 1 && S.R === S.N) || (S.F && S.F === S.R + 1)) { R.step('1.', `**Overflow** — ${S.F === 1 ? 'FRONT = 1 and REAR = N' : 'FRONT = REAR + 1'}: every cell is in use.`, { full: true }, { tone: 'bad' }); return; }
        R.step('1.', 'Not full.');
        if (!S.F) { S.F = S.R = 1; R.step('2.', 'Empty queue: FRONT := 1, REAR := 1.'); }
        else if (S.R === S.N) { S.R = 1; R.step('Else if', `REAR = N = ${S.N} → **wrap around**: REAR := 1.`); }
        else { S.R++; R.step('Else:', `REAR := REAR + 1 = ${S.R}.`); }
        S.Q[S.R - 1] = item(ITEM);
        R.step('3.', `QUEUE[${S.R}] := ${ITEM}.`, { nw: S.R }, { tone: 'ok' });
      },
      del(S, p, R) {
        R.algo('del').vars(() => ({ FRONT: nul(S.F), REAR: nul(S.R), ITEM: S.fl ? S.fl.v : '–' }));
        if (!S.F) { R.step('1.', '**Underflow** — the queue is empty.', {}, { tone: 'bad' }); return; }
        R.step('2.', `ITEM := QUEUE[${S.F}] = **${S.Q[S.F - 1].v}**.`, { out: S.F });
        S.fl = S.Q[S.F - 1]; S.Q[S.F - 1] = null;
        if (S.F === S.R) { S.F = S.R = 0; R.step('3.', 'FRONT = REAR: the queue is now empty, FRONT := REAR := NULL.'); }
        else if (S.F === S.N) { S.F = 1; R.step('Else if', `FRONT = N → **wrap around**: FRONT := 1.`); }
        else { S.F++; R.step('Else:', `FRONT := FRONT + 1 = ${S.F}.`); }
        R.step('4.', `Deleted ${S.fl.v}.`, {}, { tone: 'ok' });
        S.fl = null;
      },
    },
    view(st, f) { return { specs: arrayQueue(st, f, { ring: true }), minH: 380, minW: 560 }; },
  });

  /* ---------------- Linked queue ---------------- */
  const LO = { iw: 52, lw: 30, nh: 42, gx: 40, gy: 90, per: 6 };
  DSA.sim({
    id: 'queue-linked', cat: 'queues', title: 'Queue using a Linked List', short: 'Queue (linked list)',
    tags: ['linked queue', 'front', 'rear'],
    blurb: 'Keep two pointers: FRONT (first node, where deletions happen) and REAR (last node, where insertions happen). Both operations are O(1) and there is no fixed size.',
    schaum: 'Schaum Ch. 6 · Linked representation of queues',
    cx: [['Insert at REAR', 'O(1)'], ['Delete at FRONT', 'O(1)']],
    theory: `<p>A linked queue is a one-way list with an extra pointer to its last node. New nodes are linked after <code>REAR</code>; deletions unlink the node at <code>FRONT</code>. When the last node is deleted, both pointers become NULL.</p>`,
    algo: {
      ins: ['LINKQ_INSERT(INFO, LINK, FRONT, REAR, ITEM)', '1. Allocate NEW; Set INFO[NEW] := ITEM and LINK[NEW] := NULL.', '2. If FRONT = NULL, then: Set FRONT := NEW and REAR := NEW.', '   Else: Set LINK[REAR] := NEW and REAR := NEW.', '3. Exit.'],
      del: ['LINKQ_DELETE(INFO, LINK, FRONT, REAR, ITEM)', '1. If FRONT = NULL, then: Write UNDERFLOW, and Exit.', '2. Set TEMP := FRONT and ITEM := INFO[TEMP].', '3. Set FRONT := LINK[TEMP]. [If FRONT = NULL, Set REAR := NULL too.]', '4. Free TEMP and Exit.'],
    },
    controls: [
      { id: 'init', type: 'text', label: 'Start with', value: '7, 14, 21', reset: true, w: 150 },
      { type: 'br' },
      { id: 'item', type: 'num', label: 'ITEM', value: 28, w: 80, enter: 'ins' },
      { type: 'btn', label: 'Insert at REAR', op: 'ins', kind: 'primary' },
      { type: 'btn', label: 'Delete at FRONT', op: 'del', kind: 'danger' },
    ],
    init(p) { return { L: (String(p.init).trim() ? U.nums(p.init, { max: 11 }) : []).map(item) }; },
    ops: {
      ins(S, p, R) {
        const ITEM = U.num(p.item, { name: 'ITEM' });
        R.algo('ins').vars(() => ({ FRONT: S.L.length ? '→' + S.L[0].v : 'NULL', REAR: S.L.length ? '→' + S.L[S.L.length - 1].v : 'NULL' }));
        if (S.L.length >= 12) { R.step(null, '**Overflow** — the demo keeps 12 nodes on screen.', {}, { tone: 'bad' }); return; }
        const it = item(ITEM);
        R.step('1.', `NEW holds ${ITEM}, LINK[NEW] = NULL.`);
        S.L.push(it);
        R.step(S.L.length === 1 ? '2.' : 'Else', S.L.length === 1 ? 'The queue was empty: FRONT := REAR := NEW.' : `LINK[REAR] := NEW and REAR := NEW.`, { nw: it.id }, { tone: 'ok' });
      },
      del(S, p, R) {
        R.algo('del').vars(() => ({ FRONT: S.L.length ? '→' + S.L[0].v : 'NULL', REAR: S.L.length ? '→' + S.L[S.L.length - 1].v : 'NULL' }));
        if (!S.L.length) { R.step('1.', '**Underflow** — FRONT = NULL.', {}, { tone: 'bad' }); return; }
        const t = S.L[0];
        R.step('2.', `TEMP := FRONT; ITEM := ${t.v}.`, { dead: t.id });
        R.step('3.', S.L[1] ? `FRONT := LINK[TEMP] (${S.L[1].v}).` : 'FRONT := LINK[TEMP] = NULL, so REAR := NULL as well.', { dead: t.id, headAt: 1 });
        S.L.shift();
        R.step('4.', `Deleted ${t.v}.`, {}, { tone: 'ok' });
      },
    },
    view(st, f) {
      const hl = {};
      if (f.hl.nw) hl[f.hl.nw] = 'new';
      if (f.hl.dead) hl[f.hl.dead] = 'bad';
      const sp = V.list('K', st.L, Object.assign({ x: 0, y: 40, head: 'FRONT', hl, headAt: f.hl.headAt, ptrs: st.L.length ? [{ id: st.L[st.L.length - 1].id, label: 'REAR', cls: 'sel' }] : [] }, LO));
      return { specs: sp, minH: 230, minW: 560 };
    },
  });

  /* ---------------- Deque ---------------- */
  DSA.sim({
    id: 'deque', cat: 'queues', title: 'Deque (Double-Ended Queue)', short: 'Deque',
    tags: ['dequeue', 'double ended queue', 'input restricted', 'output restricted', 'left', 'right'],
    blurb: 'Insert and delete at both ends. Stored in a circular array with pointers LEFT and RIGHT. Try the input-restricted and output-restricted variants.',
    schaum: 'Schaum Ch. 6 · Deques',
    cx: [['Insert / delete at either end', 'O(1)']],
    theory: `<p>A <b>deque</b> (pronounced “deck”) lets you add and remove elements at both the <code>LEFT</code> and the <code>RIGHT</code> end. It is stored in a circular array, so LEFT can move left past cell 1 to cell N.</p>
      <ul><li><b>Input-restricted deque</b>: insertions only at one end (here: RIGHT), deletions at both.</li><li><b>Output-restricted deque</b>: deletions only at one end (here: LEFT), insertions at both.</li></ul>
      <p>A deque can act as a stack (use one end) or a queue (insert at one end, delete at the other).</p>`,
    algo: {
      insR: ['INSERT_RIGHT(DEQ, N, LEFT, RIGHT, ITEM)', '1. If COUNT = N, then: Write OVERFLOW, and Return.', '2. If LEFT = NULL, then: Set LEFT := RIGHT := 1.', '   Else if RIGHT = N, then: Set RIGHT := 1. Else: Set RIGHT := RIGHT + 1.', '3. Set DEQ[RIGHT] := ITEM.', '4. Return.'],
      insL: ['INSERT_LEFT(DEQ, N, LEFT, RIGHT, ITEM)', '1. If COUNT = N, then: Write OVERFLOW, and Return.', '2. If LEFT = NULL, then: Set LEFT := RIGHT := 1.', '   Else if LEFT = 1, then: Set LEFT := N. Else: Set LEFT := LEFT − 1.', '3. Set DEQ[LEFT] := ITEM.', '4. Return.'],
      delL: ['DELETE_LEFT(DEQ, N, LEFT, RIGHT, ITEM)', '1. If LEFT = NULL, then: Write UNDERFLOW, and Return.', '2. Set ITEM := DEQ[LEFT].', '3. If LEFT = RIGHT, then: Set LEFT := RIGHT := NULL.', '   Else if LEFT = N, then: Set LEFT := 1. Else: Set LEFT := LEFT + 1.', '4. Return.'],
      delR: ['DELETE_RIGHT(DEQ, N, LEFT, RIGHT, ITEM)', '1. If LEFT = NULL, then: Write UNDERFLOW, and Return.', '2. Set ITEM := DEQ[RIGHT].', '3. If LEFT = RIGHT, then: Set LEFT := RIGHT := NULL.', '   Else if RIGHT = 1, then: Set RIGHT := N. Else: Set RIGHT := RIGHT − 1.', '4. Return.'],
    },
    controls: [
      { id: 'n', type: 'num', label: 'N', value: 7, min: 2, max: 10, reset: true, w: 64 },
      { id: 'kind', type: 'select', label: 'Type', value: 'any', opts: [['any', 'Unrestricted deque'], ['in', 'Input-restricted (insert RIGHT only)'], ['out', 'Output-restricted (delete LEFT only)']] },
      { type: 'br' },
      { id: 'item', type: 'num', label: 'ITEM', value: 9, w: 80 },
      { type: 'btn', label: '⟵ Insert LEFT', op: 'insL', kind: 'primary' },
      { type: 'btn', label: 'Insert RIGHT ⟶', op: 'insR', kind: 'primary' },
      { type: 'btn', label: 'Delete LEFT', op: 'delL', kind: 'danger' },
      { type: 'btn', label: 'Delete RIGHT', op: 'delR', kind: 'danger' },
    ],
    init(p) {
      const N = U.num(p.n, { lo: 2, hi: 10, name: 'N' });
      const Q = Array(N).fill(null);
      [30, 40, 50].slice(0, N).forEach((v, i) => (Q[2 + i < N ? 2 + i : i] = item(v)));
      const filled = Q.map((x, i) => (x ? i + 1 : 0)).filter(Boolean);
      return { N, Q, F: filled[0] || 0, R: filled[filled.length - 1] || 0, cnt: filled.length, fl: null };
    },
    vars0: (S) => ({ LEFT: nul(S.F), RIGHT: nul(S.R), COUNT: S.cnt }),
    ops: {
      insL(S, p, R) { this.ins(S, p, R, true); },
      insR(S, p, R) { this.ins(S, p, R, false); },
      delL(S, p, R) { this.del(S, p, R, true); },
      delR(S, p, R) { this.del(S, p, R, false); },
    },
    ins(S, p, R, left) {
      const ITEM = U.num(p.item, { name: 'ITEM' });
      R.algo(left ? 'insL' : 'insR').vars(() => ({ LEFT: nul(S.F), RIGHT: nul(S.R), COUNT: S.cnt, ITEM }));
      if (left && p.kind === 'in') { R.step(null, 'This is an **input-restricted** deque: insertions are allowed only at the RIGHT end.', {}, { tone: 'bad' }); return; }
      if (S.cnt === S.N) { R.step('1.', '**Overflow** — all N cells are in use.', { full: true }, { tone: 'bad' }); return; }
      if (!S.F) { S.F = S.R = 1; R.step('2.', 'Empty deque: LEFT := RIGHT := 1.'); }
      else if (left) { const w = S.F === 1; S.F = w ? S.N : S.F - 1; R.step('Else if', w ? `LEFT = 1 → wrap around: LEFT := N = ${S.N}.` : `LEFT := LEFT − 1 = ${S.F}.`); }
      else { const w = S.R === S.N; S.R = w ? 1 : S.R + 1; R.step('Else if', w ? 'RIGHT = N → wrap around: RIGHT := 1.' : `RIGHT := RIGHT + 1 = ${S.R}.`); }
      const at = left ? S.F : S.R;
      S.Q[at - 1] = item(ITEM); S.cnt++;
      R.step('3.', `DEQ[${at}] := ${ITEM}.`, { nw: at }, { tone: 'ok' });
    },
    del(S, p, R, left) {
      R.algo(left ? 'delL' : 'delR').vars(() => ({ LEFT: nul(S.F), RIGHT: nul(S.R), COUNT: S.cnt, ITEM: S.fl ? S.fl.v : '–' }));
      if (!left && p.kind === 'out') { R.step(null, 'This is an **output-restricted** deque: deletions are allowed only at the LEFT end.', {}, { tone: 'bad' }); return; }
      if (!S.F) { R.step('1.', '**Underflow** — the deque is empty.', {}, { tone: 'bad' }); return; }
      const at = left ? S.F : S.R;
      R.step('2.', `ITEM := DEQ[${at}] = **${S.Q[at - 1].v}**.`, { out: at });
      S.fl = S.Q[at - 1]; S.Q[at - 1] = null; S.cnt--;
      if (S.F === S.R) { S.F = S.R = 0; R.step('3.', 'LEFT = RIGHT: the deque is now empty.'); }
      else if (left) { const w = S.F === S.N; S.F = w ? 1 : S.F + 1; R.step('Else if', w ? 'LEFT = N → wrap: LEFT := 1.' : `LEFT := LEFT + 1 = ${S.F}.`); }
      else { const w = S.R === 1; S.R = w ? S.N : S.R - 1; R.step('Else if', w ? `RIGHT = 1 → wrap: RIGHT := N = ${S.N}.` : `RIGHT := RIGHT − 1 = ${S.R}.`); }
      R.step('4.', `Deleted ${S.fl.v} from the ${left ? 'LEFT' : 'RIGHT'} end.`, {}, { tone: 'ok' });
      S.fl = null;
    },
    view(st, f) {
      const sp = arrayQueue(st, f, { name: 'DEQ', lname: 'LEFT', rname: 'RIGHT', flx: st.fl && st.R && st.fl ? -110 : -110 });
      const order = [];
      if (st.F) { let i = st.F; for (let k = 0; k < st.cnt; k++) { order.push(st.Q[i - 1]); i = i === st.N ? 1 : i + 1; } }
      sp.push(V.text('logt', 0, 210, 'Logical order, LEFT → RIGHT:', 'note', 'start'));
      sp.push(...V.row('L', order.filter(Boolean).map((x) => ({ id: 'lg' + x.id, v: x.v })), { x: 0, y: 224, cw: 40, empty: '(empty)' }));
      return { specs: sp, minH: 300, minW: 560 };
    },
  });

  /* ---------------- Priority queue (one-way list) ---------------- */
  DSA.sim({
    id: 'priority-queue', cat: 'queues', title: 'Priority Queue (one-way list)', short: 'Priority queue',
    tags: ['priority', 'prn', 'scheduling'],
    blurb: 'Every element carries a priority number PRN (smaller number = higher priority). The list is kept in priority order, and equal priorities stay first-come-first-served.',
    schaum: 'Schaum Ch. 6 · Priority queues',
    cx: [['Insert (find the place)', 'O(n)'], ['Delete highest priority', 'O(1)'], ['With a heap instead', 'O(log n) each']],
    theory: `<p>In a <b>priority queue</b> the element deleted is the one with the <b>highest priority</b>, not simply the oldest. Among elements of equal priority the usual FIFO rule applies.</p>
      <p>The textbook's one-way list representation stores <code>INFO</code>, <code>PRN</code> and <code>LINK</code> in each node and keeps the list sorted by PRN. Insertion walks to the first node with a <b>larger</b> PRN and inserts in front of it; deletion just removes the first node. A <a href="#/sim/heap">heap</a> makes both operations O(log n).</p>`,
    algo: {
      ins: ['PQINSERT(INFO, PRN, LINK, START, ITEM, N)', '1. Allocate NEW; Set INFO[NEW] := ITEM and PRN[NEW] := N.', '2. Traverse with SAVE and PTR until PTR = NULL or PRN[PTR] > N.', '3. Insert NEW between SAVE and PTR. [Equal PRNs stay in arrival order.]', '4. Exit.'],
      del: ['PQDELETE(INFO, PRN, LINK, START)', '1. If START = NULL, then: Write UNDERFLOW, and Exit.', '2. Process INFO[START]. [Highest priority = first node.]', '3. Set START := LINK[START] and free the old first node.', '4. Exit.'],
    },
    controls: [
      { id: 'item', type: 'text', label: 'ITEM', value: 'EEE', w: 90 },
      { id: 'prn', type: 'num', label: 'PRN', value: 2, min: 1, max: 9, w: 64 },
      { type: 'btn', label: 'Insert', op: 'ins', kind: 'primary' },
      { type: 'btn', label: 'Delete (serve)', op: 'del', kind: 'danger' },
    ],
    init() {
      return { L: [['AAA', 1], ['BBB', 2], ['CCC', 2], ['DDD', 4]].map(([v, prn]) => ({ id: U.uid('pq'), v, prn })), p: {} };
    },
    ops: {
      ins(S, p, R) {
        const ITEM = String(p.item || '').trim();
        if (!ITEM || ITEM.length > 4) U.fail('Type ITEM (up to 4 characters).');
        const N = U.num(p.prn, { lo: 1, hi: 9, name: 'PRN' });
        R.algo('ins');
        if (S.L.length >= 11) { R.step(null, '**Overflow** — the demo keeps 11 nodes.', {}, { tone: 'bad' }); return; }
        R.step('1.', `NEW holds ${ITEM} with PRN ${N}.`);
        let i = 0;
        while (i < S.L.length && S.L[i].prn <= N) { R.step('2.', `PRN ${S.L[i].prn} ≤ ${N} — keep walking.`, { n: { [S.L[i].id]: 'cmp' } }); i++; }
        R.step('2.', i < S.L.length ? `PRN ${S.L[i].prn} > ${N} — stop here.` : 'Reached the end of the list.', i < S.L.length ? { n: { [S.L[i].id]: 'sel' } } : {});
        const nd = { id: U.uid('pq'), v: ITEM, prn: N };
        S.L.splice(i, 0, nd);
        R.step('3.', `Inserted ${ITEM} at position ${i + 1}.`, { n: { [nd.id]: 'new' } }, { tone: 'ok' });
      },
      del(S, p, R) {
        R.algo('del');
        if (!S.L.length) { R.step('1.', '**Underflow** — no elements waiting.', {}, { tone: 'bad' }); return; }
        const t = S.L[0];
        R.step('2.', `Serve **${t.v}** (PRN ${t.prn}) — the first node has the highest priority.`, { n: { [t.id]: 'bad' } });
        S.L.shift();
        R.step('3.', 'START := LINK[START].', {}, { tone: 'ok' });
      },
    },
    view(st, f) {
      const sp = V.list('P', st.L, Object.assign({ x: 0, y: 40, head: 'START', hl: f.hl.n || {}, addr: (nd) => 'PRN ' + nd.prn }, LO));
      return { specs: sp, minH: 230, minW: 560 };
    },
  });
})(typeof window !== 'undefined' ? window : globalThis);
