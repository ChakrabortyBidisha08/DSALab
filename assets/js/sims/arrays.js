/* DSA Lab · sims/arrays.js — Arrays & Matrices (Schaum Ch. 4) */
(function (g) {
  'use strict';
  const DSA = g.DSA, U = DSA.U, V = DSA.V;
  const items = (vals) => vals.map((v) => ({ id: U.uid('a'), v }));
  const randArr = (n, lo, hi) => () => U.randList(n, lo, hi).join(', ');
  const parseMatrix = (str, name, maxR, maxC) => {
    const rows = String(str).split(/[;\n|]+/).map((r) => r.trim()).filter(Boolean);
    if (!rows.length) U.fail(`Enter matrix ${name} as rows separated by “;”, e.g. 1 2; 3 4`);
    if (rows.length > maxR) U.fail(`Matrix ${name} may have at most ${maxR} rows here.`);
    const M = rows.map((r) => U.nums(r, { max: maxC, name: `entries per row of ${name}`, lo: -99, hi: 99 }));
    if (M.some((r) => r.length !== M[0].length)) U.fail(`Every row of ${name} needs the same number of entries.`);
    return M;
  };

  /* ---------------- Traversal ---------------- */
  DSA.sim({
    id: 'array-traverse', cat: 'arrays', title: 'Traversing a Linear Array', short: 'Traversal',
    tags: ['visit', 'loop', 'sum', 'maximum'],
    blurb: 'Visit every element exactly once, from the lower bound LB to the upper bound UB, applying an operation called PROCESS to each one.',
    schaum: 'Schaum Ch. 4 · Traversing linear arrays',
    cx: [['Traversal of n elements', 'O(n)'], ['Extra memory', 'O(1)']],
    theory: `<p>A <b>linear array</b> is a list of a finite number of elements of the same type stored in <b>consecutive memory locations</b> and referenced by an index. Its length is <code>UB − LB + 1</code>, where LB is the lower bound and UB the upper bound of the index. This site follows the textbook and uses <code>LB = 1</code>; in C the first index is 0.</p>
      <p><b>Traversing</b> means visiting each element once, usually to print it, count it or combine it into a total. The counter <code>K</code> starts at LB and moves one step at a time until it passes UB.</p>
      <h3>Try this</h3><ul><li>Switch PROCESS to “Track the largest” and watch MAX change only when a bigger element appears.</li><li>Use the dice to generate a new array and predict the final SUM before you press play.</li></ul>`,
    algo: { run: ['TRAVERSE(LA, LB, UB)', '1. [Start at the lower bound.] Set K := LB.', '2. Repeat Steps 3 and 4 while K ≤ UB:', '  3. [Visit element.] Apply PROCESS to LA[K].', '  4. [Move to the next element.] Set K := K + 1.', '  [End of Step 2 loop.]', '5. Exit.'] },
    controls: [
      { id: 'arr', type: 'text', label: 'LA', value: '12, 7, 31, 4, 25, 18, 9', wide: true, run: true, rand: randArr(8, 1, 60) },
      { id: 'proc', type: 'select', label: 'PROCESS', value: 'sum', run: true, opts: [['print', 'Print the element'], ['sum', 'Add it to SUM'], ['max', 'Track the largest (MAX)'], ['even', 'Count even numbers']] },
      { type: 'btn', label: 'Run traversal', op: 'play', kind: 'primary' },
    ],
    auto: 'run',
    init(p) { return { a: items(U.nums(p.arr, { max: 14 })), k: null, out: [], acc: null, lab: null, visited: 0 }; },
    ops: {
      run(S, p, R) {
        const n = S.a.length, LB = 1, UB = n;
        let K = null, acc = p.proc === 'sum' || p.proc === 'even' ? 0 : null;
        const label = { sum: 'SUM', max: 'MAX', even: 'COUNT' }[p.proc] || null;
        S.lab = label;
        R.vars(() => Object.assign({ LB, UB, K: K == null ? '–' : K }, label ? { [label]: acc == null ? '–' : acc } : {}));
        R.step(null, `LA has ${n} elements, so LB = 1 and UB = ${n}. Press play to visit them in order.`);
        K = LB; S.k = 0; R.step('1.', `Start at the lower bound: **K := ${K}**.`);
        while (K <= UB) {
          R.step('2.', `Is K ≤ UB?  ${K} ≤ ${UB} → yes, visit LA[${K}].`);
          const v = S.a[K - 1].v;
          let m;
          if (p.proc === 'print') { S.out.push(v); m = `PROCESS prints LA[${K}] = **${v}**.`; }
          else if (p.proc === 'sum') { acc += v; m = `SUM := SUM + LA[${K}] = ${acc - v} + ${v} = **${acc}**.`; }
          else if (p.proc === 'max') { const old = acc; if (acc == null || v > acc) acc = v; m = old == null ? `First element, so MAX := ${v}.` : v > old ? `LA[${K}] = ${v} is larger than MAX (${old}) → **MAX := ${v}**.` : `LA[${K}] = ${v} is not larger than MAX (${old}); MAX stays.`; }
          else { if (v % 2 === 0) acc++; m = v % 2 === 0 ? `LA[${K}] = ${v} is even → **COUNT := ${acc}**.` : `LA[${K}] = ${v} is odd; COUNT stays ${acc}.`; }
          S.acc = acc; S.visited = K;
          R.step('3.', m, { cur: K - 1 });
          K++; S.k = K - 1; R.step('4.', `Move on: K := K + 1 = ${K}.`);
        }
        R.step('2.', `Is K ≤ UB?  ${K} ≤ ${UB} → no, the loop stops.`);
        S.k = null;
        R.step('5.', `Done — each of the ${n} elements was visited exactly once.` + (label ? ` Final ${label} = **${acc}**.` : ''), {}, { tone: 'ok' });
      },
    },
    view(st, f) {
      const hl = {};
      for (let i = 0; i < st.visited; i++) hl[i] = 'ok';
      if (f.hl.cur != null) hl[f.hl.cur] = 'act';
      const sp = V.array('A', st.a, { x: 0, y: 40, hl, name: 'LA', ptrs: st.k != null ? [{ i: st.k, label: 'K', cls: 'act' }] : [] });
      if (st.out.length) sp.push(...V.row('O', st.out.map((v, i) => ({ id: 'o' + i, v })), { x: 0, y: 150, name: 'Output', cw: 46 }));
      else if (st.lab) sp.push(V.text('acc', 0, 170, `${st.lab} = ${st.acc == null ? '–' : st.acc}`, 'big', 'start'));
      return { specs: sp, minH: 230 };
    },
  });

  /* ---------------- Insertion / deletion share a slot view ---------------- */
  function slotView(st, f) {
    const o = { x: 0, y: 92, name: 'LA' };
    const hl = {};
    if (f.hl.cmp != null) hl[f.hl.cmp] = 'cmp';
    if (f.hl.mv != null) hl[f.hl.mv] = 'act';
    if (f.hl.nw != null) hl[f.hl.nw] = 'new';
    for (let i = st.n; i < st.cap; i++) if (!st.slots[i]) hl[i] = hl[i] || '';
    const ptrs = [];
    if (st.j != null) ptrs.push({ i: st.j, label: 'J' });
    if (st.fk != null) ptrs.push({ i: st.fk, label: 'K', cls: 'act' });
    const sp = V.array('A', st.slots, Object.assign({ hl, ptrs }, o));
    if (st.float) sp.push(V.box('Ac' + st.float.id, V.arrayPos(o, st.fk == null ? 0 : st.fk), 0, 52, 44, V.fmt(st.float.v), st.floatCls || 'new', { top: 'ITEM' }));
    const nx = V.arrayPos(o, Math.max(0, st.n - 1)) + 26;
    sp.push(V.text('Nlab', -66, o.y + 104, st.n ? `N = ${st.n}` : 'N = 0 (empty)', 'note', 'start'));
    sp.push(V.text('Mlab', V.arrayPos(o, st.cap - 1) + 52, o.y + 104, `MAX = ${st.cap}`, 'idx', 'end'));
    return { specs: sp, minH: 250 };
  }
  function slotInit(p) {
    const cap = U.num(p.cap, { lo: 2, hi: 14, name: 'MAX' });
    const vals = U.nums(p.arr, { max: cap, min: 0, name: 'elements' });
    if (vals.length > cap) U.fail('There are more elements than MAX.');
    const slots = items(vals);
    while (slots.length < cap) slots.push(null);
    return { slots, n: vals.length, cap, j: null, fk: null, float: null };
  }

  DSA.sim({
    id: 'array-insert', cat: 'arrays', title: 'Inserting into a Linear Array', short: 'Insertion',
    tags: ['insert', 'shift'],
    blurb: 'To insert ITEM at position K, first move LA[N], LA[N−1], …, LA[K] one place to the right, then drop ITEM into the gap.',
    schaum: 'Schaum Ch. 4 · Inserting and deleting',
    cx: [['Insert at position K', 'O(N − K + 1)'], ['Insert at the end', 'O(1)'], ['Insert at the front (worst)', 'O(N)']],
    theory: `<p>An array occupies a fixed block of memory, so making room in the middle means <b>shifting</b>. The elements are moved <b>starting from the last one</b>; moving from the front would overwrite values that have not been copied yet.</p>
      <p>If <code>N = MAX</code> there is no free cell: this is <b>overflow</b>. Inserting at the end (K = N + 1) needs no shifting at all, which is why many programs append and sort later.</p>
      <h3>Try this</h3><ul><li>Insert at K = 1 and count the moves (N of them) — the worst case.</li><li>Fill the array to MAX and try once more to see overflow.</li></ul>`,
    algo: { insert: ['INSERT(LA, N, K, ITEM)', '1. [Start at the last element.] Set J := N.', '2. Repeat Steps 3 and 4 while J ≥ K:', '  3. [Move J-th element right.] Set LA[J + 1] := LA[J].', '  4. [Go one place left.] Set J := J − 1.', '  [End of Step 2 loop.]', '5. [Insert ITEM.] Set LA[K] := ITEM.', '6. [Update N.] Set N := N + 1.', '7. Exit.'] },
    controls: [
      { id: 'arr', type: 'text', label: 'LA', value: '10, 20, 30, 40, 50', wide: true, reset: true, rand: randArr(5, 1, 90) },
      { id: 'cap', type: 'num', label: 'MAX', value: 8, min: 2, max: 14, reset: true, w: 70 },
      { type: 'br' },
      { id: 'item', type: 'num', label: 'ITEM', value: 25, w: 80, enter: 'insert' },
      { id: 'k', type: 'num', label: 'K', value: 3, min: 1, w: 70, enter: 'insert' },
      { type: 'btn', label: 'Insert ITEM at K', op: 'insert', kind: 'primary' },
    ],
    init: slotInit,
    vars0: (S) => ({ N: S.n, MAX: S.cap }),
    ops: {
      insert(S, p, R) {
        const N = S.n;
        const ITEM = U.num(p.item, { name: 'ITEM' });
        const K = U.num(p.k, { lo: 1, hi: N + 1, name: 'K (1 … N + 1)' });
        let J = null;
        R.algo('insert').vars(() => ({ N: S.n, K, ITEM, J: J == null ? '–' : J, MAX: S.cap }));
        if (N >= S.cap) { R.step(null, `**Overflow** — N = MAX = ${S.cap}, there is no free cell for ITEM.`, {}, { tone: 'bad' }); return; }
        S.float = { id: U.uid('a'), v: ITEM }; S.fk = K - 1;
        R.step(null, `Insert ITEM = **${ITEM}** at position K = ${K}. ${N - K + 1} element(s) must move right.`);
        J = N; S.j = J - 1;
        R.step('1.', `Start at the last element: J := N = ${N}.`);
        while (J >= K) {
          R.step('2.', `J = ${J} ≥ K = ${K}, so LA[${J}] = ${S.slots[J - 1].v} must move.`, { cmp: J - 1 });
          S.slots[J] = S.slots[J - 1]; S.slots[J - 1] = null;
          R.step('3.', `LA[${J + 1}] := LA[${J}] — ${S.slots[J].v} moves one place right.`, { mv: J });
          J--; S.j = J - 1;
          R.step('4.', `J := J − 1 = ${J}.`);
        }
        R.step('2.', `J = ${J} < K = ${K}: position ${K} is now free.`);
        S.slots[K - 1] = S.float; S.float = null; S.j = null;
        R.step('5.', `LA[${K}] := ITEM — ${ITEM} drops into the gap.`, { nw: K - 1 });
        S.n++;
        R.step('6.', `N := N + 1 = ${S.n}. Insertion finished with ${N - K + 1} move(s).`, { nw: K - 1 }, { tone: 'ok' });
        S.fk = null;
      },
    },
    view: slotView,
  });

  DSA.sim({
    id: 'array-delete', cat: 'arrays', title: 'Deleting from a Linear Array', short: 'Deletion',
    tags: ['delete', 'remove', 'shift'],
    blurb: 'To delete LA[K], copy it into ITEM, then move every later element one place to the left to close the gap.',
    schaum: 'Schaum Ch. 4 · Inserting and deleting',
    cx: [['Delete at position K', 'O(N − K)'], ['Delete the last element', 'O(1)'], ['Delete the first (worst)', 'O(N)']],
    theory: `<p>Deletion is the mirror image of insertion. The value is saved in <code>ITEM</code>, then the elements <code>LA[K+1] … LA[N]</code> move <b>left, starting from the front of that block</b> so that nothing is overwritten before it is copied.</p>
      <p>Deleting from an empty array is <b>underflow</b>. Deleting the last element needs no moves at all.</p>`,
    algo: { del: ['DELETE(LA, N, K, ITEM)', '1. [Save the element.] Set ITEM := LA[K].', '2. Repeat Step 3 for J = K to N − 1:', '  3. [Move (J + 1)-st element left.] Set LA[J] := LA[J + 1].', '  [End of loop.]', '4. [Update N.] Set N := N − 1.', '5. Exit.'] },
    controls: [
      { id: 'arr', type: 'text', label: 'LA', value: '15, 25, 35, 45, 55, 65', wide: true, reset: true, rand: randArr(6, 1, 90) },
      { id: 'cap', type: 'num', label: 'MAX', value: 8, min: 2, max: 14, reset: true, w: 70 },
      { type: 'br' },
      { id: 'k', type: 'num', label: 'K', value: 2, min: 1, w: 70, enter: 'del' },
      { type: 'btn', label: 'Delete LA[K]', op: 'del', kind: 'primary' },
    ],
    init: slotInit,
    vars0: (S) => ({ N: S.n, MAX: S.cap }),
    ops: {
      del(S, p, R) {
        const N = S.n;
        let J = null, ITEM = null;
        R.algo('del').vars(() => ({ N: S.n, K: p.k, ITEM: ITEM == null ? '–' : ITEM, J: J == null ? '–' : J }));
        if (!N) { R.step(null, '**Underflow** — the array is empty, there is nothing to delete.', {}, { tone: 'bad' }); return; }
        const K = U.num(p.k, { lo: 1, hi: N, name: 'K (1 … N)' });
        R.step(null, `Delete the element at position K = ${K}.`, { cmp: K - 1 });
        S.float = S.slots[K - 1]; S.slots[K - 1] = null; S.fk = K - 1; S.floatCls = 'bad'; ITEM = S.float.v;
        R.step('1.', `ITEM := LA[${K}] = **${ITEM}**. Position ${K} is now a gap.`);
        for (J = K; J <= N - 1; J++) {
          S.j = J - 1;
          R.step('2.', `J = ${J} (runs from K = ${K} to N − 1 = ${N - 1}).`, { cmp: J });
          S.slots[J - 1] = S.slots[J]; S.slots[J] = null;
          R.step('3.', `LA[${J}] := LA[${J + 1}] — ${S.slots[J - 1].v} moves one place left.`, { mv: J - 1 });
        }
        S.j = null; S.float = null; S.n--;
        R.step('4.', `N := N − 1 = ${S.n}. Deleted ${ITEM} using ${N - K} move(s).`, {}, { tone: 'ok' });
        S.fk = null; S.floatCls = null;
      },
    },
    view: slotView,
  });

  /* ---------------- Two-dimensional arrays ---------------- */
  DSA.sim({
    id: 'array-2d', cat: 'arrays', title: 'Two-Dimensional Arrays in Memory', short: '2-D address calculation',
    tags: ['row major', 'column major', 'LOC', 'base address', 'address'],
    blurb: 'An M × N array is laid out in consecutive memory cells either row by row (row-major) or column by column (column-major). Watch it being stored, then compute LOC(A[J, K]).',
    schaum: 'Schaum Ch. 4 · Multidimensional arrays',
    cx: [['Address of any element', 'O(1)'], ['Memory used', 'M · N · w']],
    theory: `<p>Memory is one long row of cells, so a 2-D array must be <b>linearised</b>. With base address <code>Base(A)</code> and <code>w</code> memory cells per element:</p>
      <p class="formula">Row-major: LOC(A[J, K]) = Base(A) + w · [N · (J − 1) + (K − 1)]</p>
      <p class="formula">Column-major: LOC(A[J, K]) = Base(A) + w · [M · (K − 1) + (J − 1)]</p>
      <p>The bracket counts how many elements are stored <b>before</b> A[J, K]. C stores arrays in row-major order; FORTRAN uses column-major order.</p>`,
    algo: {
      row: ['Row-major storage of A (M × N)', '1. Store row 1, then row 2, …, row M; inside a row K = 1 … N.', '2. Elements before A[J, K] = N · (J − 1) + (K − 1).', '3. LOC(A[J, K]) := Base(A) + w · [N · (J − 1) + (K − 1)].'],
      col: ['Column-major storage of A (M × N)', '1. Store column 1, then column 2, …, column N; inside a column J = 1 … M.', '2. Elements before A[J, K] = M · (K − 1) + (J − 1).', '3. LOC(A[J, K]) := Base(A) + w · [M · (K − 1) + (J − 1)].'],
    },
    controls: [
      { id: 'm', type: 'num', label: 'M (rows)', value: 3, min: 1, max: 6, run: true, w: 64 },
      { id: 'n', type: 'num', label: 'N (cols)', value: 4, min: 1, max: 8, run: true, w: 64 },
      { id: 'order', type: 'select', label: 'Order', value: 'row', run: true, opts: [['row', 'Row-major'], ['col', 'Column-major']] },
      { type: 'br' },
      { id: 'base', type: 'num', label: 'Base(A)', value: 200, run: true, w: 86 },
      { id: 'w', type: 'num', label: 'w', value: 4, min: 1, max: 8, run: true, w: 60 },
      { id: 'j', type: 'num', label: 'J', value: 2, min: 1, run: true, w: 60 },
      { id: 'k', type: 'num', label: 'K', value: 3, min: 1, run: true, w: 60 },
      { type: 'btn', label: 'Store & compute', op: 'play', kind: 'primary' },
    ],
    auto: 'run',
    init(p) {
      const M = U.num(p.m, { lo: 1, hi: 6, name: 'M' }), N = U.num(p.n, { lo: 1, hi: 8, name: 'N' });
      const J = U.num(p.j, { lo: 1, hi: M, name: 'J' }), K = U.num(p.k, { lo: 1, hi: N, name: 'K' });
      const base = U.num(p.base, { lo: 0, hi: 99999, name: 'Base' }), w = U.num(p.w, { lo: 1, hi: 8, name: 'w' });
      return { M, N, J, K, base, w, order: p.order, placed: [], target: false, cur: null };
    },
    ops: {
      run(S, p, R) {
        const { M, N, J, K, base, w } = S;
        const row = S.order === 'row';
        R.algo(row ? 'row' : 'col');
        let t = 0;
        R.vars(() => ({ M, N, 'Base(A)': base, w, J, K, stored: S.placed.length }));
        R.step(null, `A is ${M} × ${N}. Watch the elements move into memory in ${row ? 'row' : 'column'}-major order.`);
        const order = [];
        if (row) for (let a = 1; a <= M; a++) for (let b = 1; b <= N; b++) order.push([a, b]);
        else for (let b = 1; b <= N; b++) for (let a = 1; a <= M; a++) order.push([a, b]);
        for (const [a, b] of order) {
          S.placed.push([a, b]); S.cur = [a, b];
          R.step('1.', `A[${a}, ${b}] → address ${base + w * t}` + (t === 0 ? ' (the base address)' : ` = Base + ${t}·w`), {});
          t++;
        }
        S.cur = null; S.target = true;
        const before = row ? N * (J - 1) + (K - 1) : M * (K - 1) + (J - 1);
        R.step('2.', row ? `Before A[${J}, ${K}] come ${J - 1} full row(s) of ${N} plus ${K - 1} element(s): N·(J−1) + (K−1) = ${N}·${J - 1} + ${K - 1} = **${before}**.`
          : `Before A[${J}, ${K}] come ${K - 1} full column(s) of ${M} plus ${J - 1} element(s): M·(K−1) + (J−1) = ${M}·${K - 1} + ${J - 1} = **${before}**.`);
        R.step('3.', `LOC(A[${J}, ${K}]) = ${base} + ${w} · ${before} = **${base + w * before}**.`, {}, { tone: 'ok' });
      },
    },
    view(st) {
      const cw = 54, ch = 40, sp = [];
      const tgt = (a, b) => st.target && a === st.J && b === st.K;
      // logical grid
      sp.push(V.text('gt', 0, -16, `A — logical view (${st.M} × ${st.N})`, 'title', 'start'));
      for (let a = 1; a <= st.M; a++) {
        sp.push(V.text('gr' + a, -12, (a - 1) * (ch + 4) + ch / 2 + 4, a, 'idx', 'end'));
        for (let b = 1; b <= st.N; b++) {
          if (a === 1) sp.push(V.text('gc' + b, (b - 1) * (cw + 4) + cw / 2, -2 + 0, b, 'idx'));
          sp.push(V.box('slot' + a + '_' + b, (b - 1) * (cw + 4), (a - 1) * (ch + 4) + 6, cw, ch, '', 'slot'));
        }
      }
      // memory strip
      const per = 8, my = st.M * (ch + 4) + 80;
      sp.push(V.text('mt', 0, my - 30, 'Memory (consecutive cells, w = ' + st.w + ' each)', 'title', 'start'));
      const at = {}; st.placed.forEach(([a, b], t) => (at[a + '_' + b] = t));
      for (let a = 1; a <= st.M; a++) for (let b = 1; b <= st.N; b++) {
        const t = at[a + '_' + b];
        const cls = (tgt(a, b) ? 'ok' : st.cur && st.cur[0] === a && st.cur[1] === b ? 'act' : '');
        if (t == null) sp.push(V.box('e' + a + '_' + b, (b - 1) * (cw + 4), (a - 1) * (ch + 4) + 6, cw, ch, `${a},${b}`, 'cell ' + cls));
        else sp.push(V.box('e' + a + '_' + b, (t % per) * (cw + 6), my + Math.floor(t / per) * (ch + 34), cw, ch, `${a},${b}`, 'cell ' + cls, { sub: String(st.base + st.w * t) }));
      }
      if (st.target) sp.push(V.text('ans', 0, my + Math.ceil((st.M * st.N) / per) * (ch + 34) + 8, `LOC(A[${st.J}, ${st.K}]) = ${st.base + st.w * (st.order === 'row' ? st.N * (st.J - 1) + st.K - 1 : st.M * (st.K - 1) + st.J - 1)}`, 'big', 'start'));
      return { specs: sp, minH: 300 };
    },
  });

  /* ---------------- Matrix multiplication ---------------- */
  DSA.sim({
    id: 'matrix-mult', cat: 'arrays', title: 'Matrix Multiplication', short: 'Matrix multiplication',
    tags: ['matrix', 'product', 'two dimensional'],
    blurb: 'C = A × B. Each entry C[I, J] is the dot product of row I of A with column J of B.',
    schaum: 'Schaum Ch. 4 · Matrices',
    cx: [['M × P times P × N', 'O(M · N · P)'], ['Square n × n', 'O(n³)']],
    theory: `<p>If A is <code>M × P</code> and B is <code>P × N</code>, the product C is <code>M × N</code> with</p>
      <p class="formula">C[I, J] = A[I, 1]·B[1, J] + A[I, 2]·B[2, J] + … + A[I, P]·B[P, J]</p>
      <p>The number of columns of A must equal the number of rows of B. Three nested loops give <code>M · N · P</code> multiplications.</p>`,
    algo: { run: ['MATMUL(A, B, C, M, P, N)', '1. Repeat Steps 2 to 4 for I = 1 to M:', '  2. Repeat Steps 3 and 4 for J = 1 to N:', '    3. Set C[I, J] := 0. [Initialise.]', '    4. Repeat for K = 1 to P:', '         Set C[I, J] := C[I, J] + A[I, K] · B[K, J].', '    [End of K loop.]', '  [End of J loop.]', '[End of I loop.]', '5. Exit.'] },
    controls: [
      { id: 'a', type: 'text', label: 'A', value: '1 2 3; 4 5 6', wide: true, run: true, ph: 'rows separated by ;' },
      { id: 'b', type: 'text', label: 'B', value: '7 8; 9 10; 11 12', wide: true, run: true },
      { type: 'btn', label: 'Multiply', op: 'play', kind: 'primary' },
    ],
    auto: 'run',
    init(p) {
      const A = parseMatrix(p.a, 'A', 4, 4), B = parseMatrix(p.b, 'B', 4, 4);
      if (A[0].length !== B.length) U.fail(`Columns of A (${A[0].length}) must equal rows of B (${B.length}).`);
      return { A, B, C: A.map(() => B[0].map(() => null)), i: null, j: null, k: null };
    },
    ops: {
      run(S, p, R) {
        const M = S.A.length, P = S.B.length, N = S.B[0].length;
        let I = null, J = null, K = null;
        R.vars(() => ({ M, P, N, I: I ?? '–', J: J ?? '–', K: K ?? '–', 'C[I,J]': I && J && S.C[I - 1][J - 1] != null ? S.C[I - 1][J - 1] : '–' }));
        R.step(null, `A is ${M} × ${P} and B is ${P} × ${N}, so C will be ${M} × ${N}.`);
        for (I = 1; I <= M; I++) {
          S.i = I; S.j = null; R.step('1.', `Row I = ${I} of A.`);
          for (J = 1; J <= N; J++) {
            S.j = J; K = null; S.k = null;
            R.step('2.', `Column J = ${J} of B — compute C[${I}, ${J}].`);
            S.C[I - 1][J - 1] = 0; R.step('3.', `C[${I}, ${J}] := 0.`);
            for (K = 1; K <= P; K++) {
              S.k = K;
              const a = S.A[I - 1][K - 1], b = S.B[K - 1][J - 1];
              S.C[I - 1][J - 1] += a * b;
              R.step('4.', `K = ${K}: add A[${I}, ${K}] · B[${K}, ${J}] = ${a} · ${b} = ${a * b} → C[${I}, ${J}] = **${S.C[I - 1][J - 1]}**.`);
            }
            S.k = null; K = null;
          }
        }
        S.i = S.j = null; I = J = null;
        R.step('5.', `Finished: ${M * N * P} multiplications.`, {}, { tone: 'ok' });
      },
    },
    view(st) {
      const cw = 44, ch = 36, sp = [];
      const M = st.A.length, P = st.B.length, N = st.B[0].length;
      const ax = 0, bx = P * cw + 60, cx = bx + N * cw + 60;
      const hlA = (i, j) => (st.i === i + 1 ? (st.k === j + 1 ? 'cmp' : 'sel') : '');
      const hlB = (i, j) => (st.j === j + 1 ? (st.k === i + 1 ? 'cmp' : 'sel') : '');
      const hlC = (i, j) => (st.i === i + 1 && st.j === j + 1 ? 'act' : st.C[i][j] != null ? 'ok' : '');
      const lab = (n) => U.range(n).map((x) => x + 1);
      sp.push(...V.matrix('A', st.A, { x: ax, y: 30, cw, ch, hl: hlA, rows: lab(M), cols: lab(P), name: 'A' }));
      sp.push(V.text('x', bx - 30, 30 + (Math.max(M, P) * ch) / 2, '×', 'big'));
      sp.push(...V.matrix('B', st.B, { x: bx, y: 30, cw, ch, hl: hlB, rows: lab(P), cols: lab(N), name: 'B' }));
      sp.push(V.text('eq', cx - 30, 30 + (Math.max(M, P) * ch) / 2, '=', 'big'));
      sp.push(...V.matrix('C', st.C, { x: cx, y: 30, cw, ch, hl: hlC, rows: lab(M), cols: lab(N), name: 'C', fmt: (v) => (v == null ? '' : String(v)) }));
      return { specs: sp, minH: 220 };
    },
  });

  /* ---------------- Sparse & triangular matrices ---------------- */
  DSA.sim({
    id: 'sparse-matrix', cat: 'arrays', title: 'Sparse and Triangular Matrices', short: 'Sparse matrices',
    tags: ['sparse', 'triplet', 'lower triangular', 'compact storage'],
    blurb: 'Save memory when most entries are zero: store only the non-zero entries as (row, column, value) triplets, or pack a lower-triangular matrix into a 1-D array.',
    schaum: 'Schaum Ch. 4 · Sparse matrices',
    cx: [['Triplet form', '3·(t + 1) cells'], ['Lower triangular, order n', 'n(n + 1)/2 cells']],
    theory: `<p>A <b>sparse matrix</b> has so many zeros that storing all <code>M · N</code> entries wastes memory. Two classic fixes:</p>
      <ul><li><b>Triplet (3-tuple) form</b>: a table whose first row is <code>(M, N, t)</code> — the size and the number of non-zero entries — followed by one row <code>(row, col, value)</code> per non-zero entry, in row order.</li>
      <li><b>Lower-triangular</b> matrices (all entries above the diagonal are 0) fit row by row in a 1-D array B of <code>n(n + 1)/2</code> cells, with <span class="formula">A[J, K] → B[L], L = J(J − 1)/2 + K, for J ≥ K</span></li></ul>`,
    algo: {
      tri: ['TRIPLETS(A, M, N, T)', '1. Set t := 0 and T[0] := (M, N, ·).', '2. Repeat for J = 1 to M and, inside it, K = 1 to N:', '  3. If A[J, K] ≠ 0, then: Set t := t + 1 and T[t] := (J, K, A[J, K]).', '4. Set T[0].value := t. [Number of non-zero entries.]', '5. Exit.'],
      low: ['PACK(A, n, B) — lower triangular', '1. Set L := 0.', '2. Repeat for J = 1 to n and, inside it, K = 1 to J:', '  3. Set L := L + 1 and B[L] := A[J, K]. [L = J(J − 1)/2 + K.]', '4. Exit. [B holds n(n + 1)/2 entries.]'],
    },
    controls: [
      { id: 'mode', type: 'select', label: 'Storage', value: 'tri', run: true, opts: [['tri', 'Triplet (row, col, value)'], ['low', 'Lower-triangular → 1-D array']] },
      { id: 'a', type: 'text', label: 'A', value: '0 0 3 0 4; 0 0 5 7 0; 0 0 0 0 0; 0 2 6 0 0', wide: true, run: true, ph: 'rows separated by ;',
        presets: [['0 0 3 0 4; 0 0 5 7 0; 0 0 0 0 0; 0 2 6 0 0', 'Sparse 4 × 5'], ['4 0 0 0; 3 1 0 0; 0 2 6 0; 7 0 5 8', 'Lower triangular 4 × 4'], ['1 0 0; 2 3 0; 4 5 6', 'Lower triangular 3 × 3']] },
      { type: 'btn', label: 'Compress', op: 'play', kind: 'primary' },
    ],
    auto: 'run',
    init(p) {
      const A = parseMatrix(p.a, 'A', 6, 7);
      if (p.mode === 'low') {
        if (A.length !== A[0].length) U.fail('A lower-triangular matrix must be square.');
        for (let j = 0; j < A.length; j++) for (let k = j + 1; k < A.length; k++) if (A[j][k] !== 0) U.fail(`A[${j + 1}, ${k + 1}] is above the diagonal but not 0, so A is not lower triangular.`);
      }
      return { A, mode: p.mode, out: [], cur: null };
    },
    ops: {
      run(S, p, R) {
        const A = S.A, M = A.length, N = A[0].length;
        if (S.mode === 'tri') {
          R.algo('tri');
          let t = 0;
          R.vars(() => ({ M, N, t, saved: `${M * N} → ${3 * (t + 1)} cells` }));
          S.out = [[M, N, '·']];
          R.step('1.', `The header row holds the size ${M} × ${N}; its count is filled in at the end.`);
          for (let j = 1; j <= M; j++) for (let k = 1; k <= N; k++) {
            S.cur = [j, k];
            if (A[j - 1][k - 1] !== 0) { t++; S.out.push([j, k, A[j - 1][k - 1]]); R.step('3.', `A[${j}, ${k}] = ${A[j - 1][k - 1]} ≠ 0 → triplet ${t}: (${j}, ${k}, ${A[j - 1][k - 1]}).`, { nz: true }); }
            else R.step('2.', `A[${j}, ${k}] = 0, skip it.`);
          }
          S.cur = null; S.out[0][2] = t;
          R.step('4.', `t = ${t} non-zero entries. Storage: ${3 * (t + 1)} cells instead of ${M * N}.`, {}, { tone: 'ok' });
        } else {
          R.algo('low');
          let L = 0;
          R.vars(() => ({ n: M, L, cells: `${M * M} → ${(M * (M + 1)) / 2}` }));
          R.step('1.', `n = ${M}. Only the ${(M * (M + 1)) / 2} entries on or below the diagonal are stored.`);
          for (let j = 1; j <= M; j++) for (let k = 1; k <= j; k++) {
            S.cur = [j, k]; L++;
            S.out.push({ j, k, v: A[j - 1][k - 1] });
            R.step('3.', `A[${j}, ${k}] → B[${L}]   (L = ${j}·${j - 1}/2 + ${k} = ${L}).`);
          }
          S.cur = null;
          R.step('4.', `Packed into ${L} cells instead of ${M * M}.`, {}, { tone: 'ok' });
        }
      },
    },
    view(st) {
      const sp = [], A = st.A, M = A.length, N = A[0].length, cw = 40, ch = 34;
      const cur = st.cur;
      const done = new Set();
      if (st.mode === 'tri') st.out.slice(1).forEach((r) => done.add(r[0] + ',' + r[1]));
      else st.out.forEach((r) => done.add(r.j + ',' + r.k));
      sp.push(...V.matrix('A', A, {
        x: 0, y: 30, cw, ch, name: 'A', rows: U.range(M).map((i) => i + 1), cols: U.range(N).map((i) => i + 1),
        hl: (i, j) => (cur && cur[0] === i + 1 && cur[1] === j + 1 ? 'act' : done.has(i + 1 + ',' + (j + 1)) ? 'ok' : A[i][j] === 0 ? 'dim' : (st.mode === 'low' && j > i ? 'dim' : '')),
      }));
      const ox = N * cw + 70;
      if (st.mode === 'tri') {
        sp.push(...V.matrix('T', st.out, { x: ox, y: 30, cw: 46, ch, name: 'Triplets', cols: ['Row', 'Col', 'Val'], rows: st.out.map((_, i) => i), hl: (i) => (i === 0 ? 'sel' : i === st.out.length - 1 && cur ? 'new' : '') }));
      } else {
        const per = 8;
        sp.push(V.text('Bt', ox, 18, 'B (1-D)', 'name', 'start'));
        st.out.forEach((r, t) => sp.push(V.box('B' + t, ox + (t % per) * 46, 30 + Math.floor(t / per) * 70, 42, ch, r.v, 'cell ' + (t === st.out.length - 1 && cur ? 'new' : ''), { sub: `B[${t + 1}]`, top: `${r.j},${r.k}` })));
      }
      return { specs: sp, minH: 240 };
    },
  });
})(typeof window !== 'undefined' ? window : globalThis);
