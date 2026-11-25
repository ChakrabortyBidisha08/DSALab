/* DSA Lab · sims/stacks.js — Stacks (Schaum Ch. 6) */
(function (g) {
  'use strict';
  const DSA = g.DSA, U = DSA.U, V = DSA.V;
  const item = (v) => ({ id: U.uid('s'), v });

  /* ---------------- Stack in an array ---------------- */
  DSA.sim({
    id: 'stack-array', cat: 'stacks', title: 'Stack using an Array', short: 'Stack (array)',
    tags: ['push', 'pop', 'peek', 'top', 'lifo', 'overflow', 'underflow', 'maxstk'],
    blurb: 'A stack is a LIFO list: the last item pushed is the first popped. Here it lives in an array STACK[1..MAXSTK] with TOP holding the index of the top element.',
    schaum: 'Schaum Ch. 6 · Array representation of stacks',
    cx: [['PUSH', 'O(1)'], ['POP', 'O(1)'], ['PEEK', 'O(1)'], ['Memory', 'MAXSTK cells, fixed']],
    theory: `<p>A <b>stack</b> allows insertion and deletion at one end only, the <b>top</b>. It is <b>LIFO</b> — last in, first out — like a pile of plates.</p>
      <p>In the array representation, <code>TOP</code> is the index of the top element and <code>TOP = 0</code> (NULL) means the stack is empty. <code>MAXSTK</code> is the capacity.</p>
      <ul><li><b>Overflow</b>: PUSH when <code>TOP = MAXSTK</code>.</li><li><b>Underflow</b>: POP when <code>TOP = 0</code>.</li></ul>
      <p>Stacks power function calls (the call stack), undo, bracket matching, expression conversion and evaluation, backtracking and depth-first search.</p>`,
    algo: {
      push: ['PUSH(STACK, TOP, MAXSTK, ITEM)', '1. [Is the stack full?] If TOP = MAXSTK, then: Print OVERFLOW, and Return.', '2. Set TOP := TOP + 1. [Move TOP up one cell.]', '3. Set STACK[TOP] := ITEM. [Place ITEM on top.]', '4. Return.'],
      pop: ['POP(STACK, TOP, ITEM)', '1. [Is the stack empty?] If TOP = 0, then: Print UNDERFLOW, and Return.', '2. Set ITEM := STACK[TOP]. [Copy the top element.]', '3. Set TOP := TOP − 1. [Move TOP down one cell.]', '4. Return.'],
      peek: ['PEEK(STACK, TOP, ITEM)', '1. If TOP = 0, then: Print UNDERFLOW, and Return.', '2. Set ITEM := STACK[TOP]. [TOP does not change.]', '3. Return.'],
    },
    controls: [
      { id: 'max', type: 'num', label: 'MAXSTK', value: 6, min: 1, max: 10, reset: true, w: 70 },
      { id: 'init', type: 'text', label: 'Start with', value: '10, 20, 30', reset: true, w: 160 },
      { type: 'br' },
      { id: 'item', type: 'num', label: 'ITEM', value: 40, w: 80, enter: 'push' },
      { type: 'btn', label: 'PUSH', op: 'push', kind: 'primary' },
      { type: 'btn', label: 'POP', op: 'pop', kind: 'danger' },
      { type: 'btn', label: 'PEEK', op: 'peek' },
    ],
    init(p) {
      const max = U.num(p.max, { lo: 1, hi: 10, name: 'MAXSTK' });
      const vals = String(p.init).trim() ? U.nums(p.init, { max, name: 'starting items' }) : [];
      return { S: vals.map(item), max, fl: null, out: null };
    },
    vars0: (S) => ({ TOP: S.S.length, MAXSTK: S.max }),
    ops: {
      push(S, p, R) {
        const ITEM = U.num(p.item, { name: 'ITEM' });
        R.algo('push').vars(() => ({ TOP: S.S.length, MAXSTK: S.max, ITEM }));
        if (S.S.length >= S.max) { R.step('1.', `**Overflow!** TOP = MAXSTK = ${S.max}; there is no room for ${ITEM}.`, { full: true }, { tone: 'bad' }); return; }
        R.step('1.', `TOP = ${S.S.length} < MAXSTK = ${S.max}, so there is room.`);
        S.top = S.S.length + 1;
        R.step('2.', `TOP := TOP + 1 = ${S.top}.`);
        const it = item(ITEM); S.S.push(it); S.top = null;
        R.step('3.', `STACK[${S.S.length}] := ${ITEM}.`, { nw: true }, { tone: 'ok' });
        p.item = ITEM;
      },
      pop(S, p, R) {
        R.algo('pop').vars(() => ({ TOP: S.S.length + (S.fl ? 0 : 0), ITEM: S.out == null ? '–' : S.out }));
        if (!S.S.length) { R.step('1.', '**Underflow!** TOP = 0, the stack is empty.', {}, { tone: 'bad' }); return; }
        R.step('1.', `TOP = ${S.S.length} ≠ 0.`, { tp: true });
        S.out = S.S[S.S.length - 1].v;
        R.step('2.', `ITEM := STACK[${S.S.length}] = **${S.out}**.`, { tp: true });
        S.fl = S.S.pop();
        R.step('3.', `TOP := TOP − 1 = ${S.S.length}. Popped ${S.out}.`, {}, { tone: 'ok' });
        S.fl = null; S.out = null;
      },
      peek(S, p, R) {
        R.algo('peek').vars(() => ({ TOP: S.S.length, ITEM: S.out == null ? '–' : S.out }));
        if (!S.S.length) { R.step('1.', '**Underflow** — nothing to peek at.', {}, { tone: 'bad' }); return; }
        S.out = S.S[S.S.length - 1].v;
        R.step('2.', `ITEM := STACK[TOP] = **${S.out}**. The stack itself is unchanged.`, { tp: true }, { tone: 'ok' });
        S.out = null;
      },
    },
    view(st, f) {
      const cells = st.S.slice();
      while (cells.length < st.max) cells.push(null);
      const n = st.S.length, top = st.top != null ? st.top : n;
      const hl = {};
      if (f.hl.tp && n) hl[n - 1] = 'cmp';
      if (f.hl.nw && n) hl[n - 1] = 'new';
      if (f.hl.full) for (let i = 0; i < n; i++) hl[i] = 'bad';
      const o = { x: 60, y: 30, cw: 86, ch: 40, gap: 4, vertical: true, name: 'STACK' };
      const sp = V.array('S', cells, Object.assign({ hl, ptrs: [{ i: top - 1, label: 'TOP = ' + top, key: 'TOP', cls: top ? 'act' : 'dim', side: 'right' }] }, o));
      sp.push(V.line('Sbase', o.x - 10, o.y + st.max * (o.ch + o.gap) + 2, o.x + o.cw + 10, o.y + st.max * (o.ch + o.gap) + 2, 'edge'));
      sp.push(V.text('Smax', o.x + o.cw / 2, o.y - 14, `MAXSTK = ${st.max}`, 'idx'));
      if (st.fl) sp.push(V.box('Sc' + st.fl.id, o.x + o.cw + 120, o.y + 10, o.cw, o.ch, V.fmt(st.fl.v), 'bad', { top: 'ITEM' }));
      if (st.out != null && !st.fl) sp.push(V.text('peek', o.x + o.cw + 150, o.y + 30, `ITEM = ${st.out}`, 'big', 'start'));
      return { specs: sp, minW: 420, minH: 300 };
    },
  });

  /* ---------------- Stack as a linked list ---------------- */
  const LO = { iw: 52, lw: 30, nh: 42, gx: 40, gy: 90, per: 6 };
  DSA.sim({
    id: 'stack-linked', cat: 'stacks', title: 'Stack using a Linked List', short: 'Stack (linked list)',
    tags: ['push', 'pop', 'linked stack', 'top'],
    blurb: 'No fixed capacity: each PUSH allocates a node and links it in front of TOP; each POP unlinks the TOP node.',
    schaum: 'Schaum Ch. 6 · Linked representation of stacks',
    cx: [['PUSH', 'O(1)'], ['POP', 'O(1)'], ['Memory', 'one extra link per item']],
    theory: `<p>A <b>linked stack</b> is a singly linked list where <code>TOP</code> plays the role of <code>START</code>. Pushing is “insert at the front” and popping is “delete the first node” — both O(1).</p>
      <p>The stack can grow until free memory runs out (AVAIL = NULL), so overflow is far less likely than with a fixed array; the price is one link field per node.</p>`,
    algo: {
      push: ['PUSH_LINKSTACK(INFO, LINK, TOP, ITEM)', '1. [Get a node.] If AVAIL = NULL, then: Write OVERFLOW, and Exit.', '2. Set NEW := AVAIL and AVAIL := LINK[AVAIL].', '3. Set INFO[NEW] := ITEM.', '4. Set LINK[NEW] := TOP. [NEW sits on the old top.]', '5. Set TOP := NEW.', '6. Exit.'],
      pop: ['POP_LINKSTACK(INFO, LINK, TOP, ITEM)', '1. If TOP = NULL, then: Write UNDERFLOW, and Exit.', '2. Set ITEM := INFO[TOP].', '3. Set TEMP := TOP and TOP := LINK[TOP]. [Unlink the top node.]', '4. [Free it.] Set LINK[TEMP] := AVAIL and AVAIL := TEMP.', '5. Exit.'],
    },
    controls: [
      { id: 'init', type: 'text', label: 'Start with (top last)', value: '5, 15, 25', reset: true, w: 160 },
      { type: 'br' },
      { id: 'item', type: 'num', label: 'ITEM', value: 35, w: 80, enter: 'push' },
      { type: 'btn', label: 'PUSH', op: 'push', kind: 'primary' },
      { type: 'btn', label: 'POP', op: 'pop', kind: 'danger' },
    ],
    init(p) {
      const vals = String(p.init).trim() ? U.nums(p.init, { max: 10, name: 'items' }) : [];
      return { L: vals.reverse().map(item), fl: null, out: null };
    },
    vars0: (S) => ({ TOP: S.L.length ? '→' + S.L[0].v : 'NULL', size: S.L.length }),
    ops: {
      push(S, p, R) {
        const ITEM = U.num(p.item, { name: 'ITEM' });
        R.algo('push').vars(() => ({ ITEM, TOP: S.L.length ? '→' + S.L[0].v : 'NULL' }));
        if (S.L.length >= 11) { R.step('1.', '**Overflow** — this demo keeps 11 nodes on screen.', {}, { tone: 'bad' }); return; }
        const it = item(ITEM);
        S.fl = { id: it.id, v: null, next: undefined };
        R.step('2.', 'Take a free node NEW from AVAIL.');
        S.fl.v = ITEM; R.step('3.', `INFO[NEW] := ${ITEM}.`);
        S.fl.next = S.L[0] ? S.L[0].id : null; R.step('4.', S.L[0] ? `LINK[NEW] := TOP — NEW points to ${S.L[0].v}.` : 'LINK[NEW] := TOP = NULL.');
        S.L.unshift(it); S.fl = null;
        R.step('5.', `TOP := NEW. ${ITEM} is on top.`, { nw: it.id }, { tone: 'ok' });
      },
      pop(S, p, R) {
        R.algo('pop').vars(() => ({ TOP: S.L.length ? '→' + S.L[0].v : 'NULL', ITEM: S.out == null ? '–' : S.out }));
        if (!S.L.length) { R.step('1.', '**Underflow** — TOP = NULL.', {}, { tone: 'bad' }); return; }
        S.out = S.L[0].v;
        R.step('2.', `ITEM := INFO[TOP] = **${S.out}**.`, { dead: S.L[0].id });
        R.step('3.', S.L[1] ? `TEMP := TOP; TOP := LINK[TOP] — TOP moves to ${S.L[1].v}.` : 'TOP := LINK[TOP] = NULL — the stack is now empty.', { dead: S.L[0].id, headAt: 1 });
        S.L.shift();
        R.step('4.', `The old top node goes back to AVAIL. Popped ${S.out}.`, {}, { tone: 'ok' });
        S.out = null;
      },
    },
    view(st, f) {
      const hl = {};
      if (f.hl.nw) hl[f.hl.nw] = 'new';
      if (f.hl.dead) hl[f.hl.dead] = 'bad';
      const o = Object.assign({ x: 0, y: 130, head: 'TOP', hl, headAt: f.hl.headAt }, LO);
      const sp = V.list('K', st.L, o);
      if (st.fl) {
        sp.push(V.box('Kn' + st.fl.id, 0, 0, LO.iw, LO.nh, st.fl.v == null ? '' : st.fl.v, 'info new', { rx: 4, top: 'NEW' }));
        sp.push(V.box('Kl' + st.fl.id, LO.iw, 0, LO.lw, LO.nh, st.fl.next === null ? '×' : '', 'lnk new' + (st.fl.next === null ? ' nil' : ''), { rx: 4 }));
        if (st.fl.next) {
          const sx = LO.iw + LO.lw / 2;
          sp.push({ k: 'poly', key: 'Ka' + st.fl.id, pts: [[sx, LO.nh / 2], [sx + 14, LO.nh / 2], [sx + 14, 86], [LO.iw / 2, 86], [LO.iw / 2, 130 - 34]], cls: 'link new', arrow: true });
        }
      }
      sp.push(V.text('Knote', 0, 130 + 42 + 56, 'TOP is the first node: PUSH and POP both work at the front.', 'muted', 'start'));
      return { specs: sp, minH: 280, minW: 560 };
    },
  });

  /* ---------------- Bracket matching ---------------- */
  const OPEN = '([{', CLOSE = ')]}';
  DSA.sim({
    id: 'paren-match', cat: 'stacks', title: 'Balanced Parentheses Checker', short: 'Bracket matching',
    tags: ['parentheses', 'brackets', 'balanced', 'application'],
    blurb: 'Scan the expression; push every opening bracket and, at every closing bracket, pop and check that the kinds match. Balanced means the stack ends empty.',
    schaum: 'Schaum Ch. 6 · Application of stacks',
    cx: [['Scan of n symbols', 'O(n)'], ['Stack space (worst)', 'O(n)']],
    theory: `<p>Brackets must close in the <b>reverse order</b> they opened — exactly the LIFO order of a stack. Three things can go wrong:</p>
      <ul><li>a closing bracket arrives when the stack is empty (too many closers);</li><li>the popped opener is the wrong kind, e.g. <code>( ]</code>;</li><li>input ends with openers still on the stack (too many openers).</li></ul>`,
    algo: { run: ['BALANCED(E)', '1. Set STACK := empty.', '2. Repeat Steps 3 and 4 for each symbol X of E, left to right:', '  3. If X is an opening bracket, then: PUSH X.', '  4. If X is a closing bracket, then:', '       If STACK is empty, then: Return NOT BALANCED.', '       POP Y; if Y does not match X, then: Return NOT BALANCED.', '  [End of Step 2 loop.]', '5. If STACK is empty, then: Return BALANCED; Else: Return NOT BALANCED.'] },
    controls: [
      { id: 'e', type: 'text', label: 'Expression', value: '{ a * (b + c) - [d / (e - f)] }', wide: true, run: true,
        presets: [['{ a * (b + c) - [d / (e - f)] }', 'Balanced'], ['( a + [ b * c ) ]', 'Wrong kind'], ['((a + b) * c', 'Unclosed'], ['a + b) * (c', 'Extra closer']] },
      { type: 'btn', label: 'Check', op: 'play', kind: 'primary' },
    ],
    auto: 'run',
    init(p) {
      const s = String(p.e);
      if (!s.trim()) U.fail('Type an expression with brackets.');
      if (s.length > 48) U.fail('Keep the expression under 48 characters.');
      return { chars: s.replace(/\s+/g, '').split('').map((c, i) => ({ id: 'c' + i, v: c })), stack: [], i: null, res: null };
    },
    ops: {
      run(S, p, R) {
        const rows = [];
        R.vars(() => ({ X: S.i == null || S.i >= S.chars.length ? '–' : S.chars[S.i].v, depth: S.stack.length })).table(() => ({ head: ['Symbol', 'Stack', 'Action'], rows: rows.slice() }));
        R.step('1.', 'Start with an empty stack.');
        for (let i = 0; i < S.chars.length; i++) {
          const c = S.chars[i].v; S.i = i;
          if (OPEN.includes(c)) { S.stack.push({ id: 'k' + i, v: c }); rows.push([c, S.stack.map((x) => x.v).join(' '), 'push']); R.step('3.', `“${c}” opens a bracket → PUSH.`, { cur: i }); }
          else if (CLOSE.includes(c)) {
            if (!S.stack.length) { rows.push([c, '', 'empty! ✗']); S.res = 'bad'; R.step('       If STACK', `“${c}” closes, but the stack is empty — **not balanced** (extra closing bracket).`, { cur: i, bad: true }, { tone: 'bad' }); return; }
            const y = S.stack[S.stack.length - 1].v;
            if (OPEN.indexOf(y) !== CLOSE.indexOf(c)) { rows.push([c, S.stack.map((x) => x.v).join(' '), `pop ${y} ✗`]); S.res = 'bad'; R.step('       POP', `Popped “${y}” but found “${c}” — wrong kind, **not balanced**.`, { cur: i, bad: true }, { tone: 'bad' }); return; }
            S.stack.pop(); rows.push([c, S.stack.map((x) => x.v).join(' '), `pop ${y} ✓`]);
            R.step('       POP', `“${c}” matches the popped “${y}”.`, { cur: i });
          } else { rows.push([c, S.stack.map((x) => x.v).join(' '), '—']); R.step('2.', `“${c}” is not a bracket; skip it.`, { cur: i }); }
        }
        S.i = S.chars.length;
        if (S.stack.length) { S.res = 'bad'; R.step('5.', `End of input but ${S.stack.length} opening bracket(s) remain — **not balanced**.`, {}, { tone: 'bad' }); }
        else { S.res = 'ok'; R.step('5.', 'End of input and the stack is empty — **balanced**.', {}, { tone: 'ok' }); }
      },
    },
    view(st, f) {
      const sp = [];
      st.chars.forEach((c, i) => {
        const cls = f.hl.cur === i ? (f.hl.bad ? 'bad' : 'act') : st.i != null && i < st.i ? 'dim' : OPEN.includes(c.v) || CLOSE.includes(c.v) ? 'sel' : '';
        sp.push(V.box('t' + i, i * 30, 0, 27, 34, c.v, 'chip ' + cls, { rx: 5 }));
      });
      sp.push(V.text('sl', -10, 120, 'STACK', 'name', 'end'));
      st.stack.forEach((k, j) => sp.push(V.box('k' + k.id, j * 44, 100, 40, 40, k.v, 'cell', { rx: 5 })));
      if (st.stack.length) sp.push(...V.ptr('sTop', (st.stack.length - 1) * 44 + 20, 140, 'top', 'act', 'bottom', 20));
      if (!st.stack.length) sp.push(V.text('se', 0, 124, '(empty)', 'muted', 'start'));
      if (st.res) sp.push(V.text('res', 0, 214, st.res === 'ok' ? '✓ Balanced' : '✗ Not balanced', 'big ' + st.res, 'start'));
      return { specs: sp, minH: 240 };
    },
  });
})(typeof window !== 'undefined' ? window : globalThis);
