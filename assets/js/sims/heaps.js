/* DSA Lab · sims/heaps.js — Heaps, heapsort and Huffman's algorithm (Schaum Ch. 7) */
(function (g) {
  'use strict';
  const DSA = g.DSA, U = DSA.U, V = DSA.V;
  const item = (v) => ({ id: U.uid('h'), v });

  /* Tree view of TREE[1..n] plus the array underneath. Nodes and cells share item ids, so swaps glide. */
  function heapView(arr, n, f, o) {
    o = o || {};
    const build = (i) => (i > n ? null : { id: arr[i - 1].id, v: arr[i - 1].v, l: build(2 * i), r: build(2 * i + 1) });
    const hl = {};
    (f.hl.c || []).forEach((i) => arr[i - 1] && (hl[arr[i - 1].id] = 'cmp'));
    (f.hl.s || []).forEach((i) => arr[i - 1] && (hl[arr[i - 1].id] = 'act'));
    (f.hl.k || []).forEach((i) => arr[i - 1] && (hl[arr[i - 1].id] = 'ok'));
    (f.hl.b || []).forEach((i) => arr[i - 1] && (hl[arr[i - 1].id] = 'bad'));
    const root = build(1);
    const sp = root ? V.tree('T', root, { x: 0, y: 30, dx: 46, dy: 64, r: 19, hl, top: (nd) => String(arr.findIndex((x) => x.id === nd.id) + 1) }) : [V.text('empty', 0, 30, 'The heap is empty (N = 0).', 'muted', 'start')];
    const L = sp.layout || { depth: 0, count: 1 };
    const ay = 30 + (L.depth + 1) * 64 + 20;
    const cells = arr.map((it, i) => ({ id: it.id, v: it.v, cls: i >= n ? (o.sortedTail ? 'ok' : 'dim') : hl[it.id] || '' }));
    sp.push(...V.array('A', cells, { x: 0, y: ay, cw: 42, ch: 38, gap: 4, name: o.name || 'TREE' }));
    if (o.nLabel !== false) sp.push(V.text('nlab', V.arrayPos({ cw: 42, gap: 4 }, Math.max(0, n - 1)) + 21, ay + 60, 'N = ' + n, 'idx'));
    return { specs: sp, minH: 330, minW: 560 };
  }
  const better = (max) => (a, b) => (max ? a > b : a < b);

  /* ---------------- Heap ---------------- */
  DSA.sim({
    id: 'heap', cat: 'heaps', title: 'Heap: Insertion and Deletion', short: 'Max-heap / min-heap',
    tags: ['heap', 'max heap', 'min heap', 'priority queue', 'sift up', 'sift down', 'heapify', 'reheap'],
    blurb: 'A complete binary tree stored in an array, where every parent is ≥ its children (max-heap) or ≤ them (min-heap). Insert at the end and sift up; delete the root by moving the last element up and sifting down.',
    schaum: 'Schaum Ch. 7 · Heap; heapsort',
    cx: [['Insert', 'O(log n)'], ['Delete root', 'O(log n)'], ['Read max / min', 'O(1)'], ['Build heap bottom-up', 'O(n)']],
    theory: `<p>A <b>heap</b> is a complete binary tree in sequential representation: <code>TREE[1]</code> is the root and the children of <code>TREE[K]</code> are <code>TREE[2K]</code> and <code>TREE[2K + 1]</code>. In a <b>max-heap</b> the value at each node is at least the value at each of its children, so the root holds the maximum. A min-heap is the mirror image.</p>
      <ul><li><b>INSHEAP</b>: put ITEM at <code>TREE[N + 1]</code> and let it rise — swap with its parent while it is larger.</li><li><b>DELHEAP</b>: remove the root, move the last element to the root, and let it sink — swap with its larger child while that child is larger.</li></ul>
      <p>Heaps implement priority queues in O(log n) per operation and are the basis of heapsort.</p>`,
    algo: {
      ins: ['INSHEAP(TREE, N, ITEM)', '1. Set N := N + 1, TREE[N] := ITEM and PTR := N. [New leaf at the end.]', '2. Repeat Steps 3 and 4 while PTR > 1:', '  3. Set PAR := ⌊PTR / 2⌋. [Location of the parent.]', '  4. If TREE[PAR] ≥ TREE[PTR], then: Return. [Heap property holds.]', '     Else: Interchange TREE[PTR] and TREE[PAR], and Set PTR := PAR.', '5. Return. [ITEM reached the root.]'],
      del: ['DELHEAP(TREE, N, ITEM)', '1. Set ITEM := TREE[1]. [The root is removed.]', '2. Set TREE[1] := TREE[N] and N := N − 1. [Last leaf moves to the root.]', '3. Set PTR := 1.', '4. Repeat while PTR has a child:', '     Let CHILD be the larger child (smaller, for a min-heap).', '     If TREE[PTR] ≥ TREE[CHILD], then: Return.', '     Interchange TREE[PTR] and TREE[CHILD], and Set PTR := CHILD.', '5. Return.'],
      build: ['BUILDHEAP(TREE, N) — bottom-up', '1. Repeat for K = ⌊N / 2⌋ down to 1:', '     Sift TREE[K] down as in DELHEAP Step 4.', '2. Return. [Total work is O(N).]'],
    },
    controls: [
      { id: 'kind', type: 'select', label: 'Type', value: 'max', reset: true, opts: [['max', 'Max-heap'], ['min', 'Min-heap']] },
      { id: 'init', type: 'text', label: 'Start with', value: '97, 88, 95, 66, 55, 95, 48, 66, 35, 48, 55, 62, 77, 25, 38', wide: true, reset: true, rand: () => U.randList(10, 1, 99).join(', ') },
      { type: 'br' },
      { id: 'item', type: 'num', label: 'ITEM', value: 70, w: 80 },
      { type: 'btn', label: 'Insert', op: 'ins', kind: 'primary' },
      { type: 'btn', label: 'Delete root', op: 'del', kind: 'danger' },
      { type: 'btn', label: 'Build heap from “Start with”', op: 'build' },
    ],
    init(p) {
      const max = p.kind !== 'min';
      const vals = String(p.init).trim() ? U.nums(p.init, { min: 0, max: 31, name: 'values' }) : [];
      const S = { A: [], n: 0, max, out: null };
      const quiet = { step() {}, algo() { return this; }, vars() { return this; } };
      vals.forEach((v) => this.ins(S, v, quiet));
      return S;
    },
    ins(S, ITEM, R) {
      const gt = better(S.max);
      S.A.push(item(ITEM)); S.n++;
      let ptr = S.n;
      R.step('1.', `Place ${ITEM} at TREE[${ptr}], the next free leaf.`, { s: [ptr] });
      while (ptr > 1) {
        const par = Math.floor(ptr / 2);
        R.step('  3.', `PAR = ⌊${ptr}/2⌋ = ${par}. Compare ${S.A[ptr - 1].v} with its parent ${S.A[par - 1].v}.`, { c: [par], s: [ptr] });
        if (!gt(S.A[ptr - 1].v, S.A[par - 1].v)) { R.step('  4.', `${S.A[par - 1].v} ${S.max ? '≥' : '≤'} ${S.A[ptr - 1].v} — the heap property holds; stop.`, { k: [ptr] }); return; }
        [S.A[ptr - 1], S.A[par - 1]] = [S.A[par - 1], S.A[ptr - 1]];
        R.step('     Else', `Swap — ${S.A[par - 1].v} moves up to TREE[${par}].`, { s: [par] });
        ptr = par;
      }
      R.step('5.', `${S.A[0].v} reached the root.`, { k: [1] });
    },
    siftDown(S, k, R, n, line) {
      const gt = better(S.max);
      let ptr = k;
      for (;;) {
        const l = 2 * ptr, r = l + 1;
        if (l > n) { R.step(line || '4.', `TREE[${ptr}] has no children — stop.`, { k: [ptr] }); return; }
        let c = l;
        if (r <= n && gt(S.A[r - 1].v, S.A[l - 1].v)) c = r;
        R.step(line || '     Let CHILD', `Children of TREE[${ptr}] = ${S.A[ptr - 1].v}: ${S.A[l - 1].v}${r <= n ? ' and ' + S.A[r - 1].v : ''}. The ${S.max ? 'larger' : 'smaller'} is ${S.A[c - 1].v}.`, { c: [c], s: [ptr] });
        if (!gt(S.A[c - 1].v, S.A[ptr - 1].v)) { R.step(line || '     If TREE[PTR]', `${S.A[ptr - 1].v} ${S.max ? '≥' : '≤'} ${S.A[c - 1].v} — stop.`, { k: [ptr] }); return; }
        [S.A[ptr - 1], S.A[c - 1]] = [S.A[c - 1], S.A[ptr - 1]];
        R.step(line || '     Interchange', `Swap: ${S.A[c - 1].v} sinks to TREE[${c}].`, { s: [c] });
        ptr = c;
      }
    },
    vars0: (S) => ({ N: S.n, root: S.n ? S.A[0].v : '–' }),
    ops: {
      ins(S, p, R) {
        const ITEM = U.num(p.item, { name: 'ITEM' });
        R.algo('ins').vars(() => ({ N: S.n, ITEM }));
        if (S.n >= 31) { R.step(null, 'The demo keeps at most 31 nodes (5 levels).', {}, { tone: 'bad' }); return; }
        this.ins(S, ITEM, R);
        R.step('5.', `Inserted ${ITEM}. N = ${S.n}.`, {}, { tone: 'ok' });
      },
      del(S, p, R) {
        R.algo('del').vars(() => ({ N: S.n, ITEM: S.out == null ? '–' : S.out }));
        if (!S.n) { R.step('1.', '**Underflow** — the heap is empty.', {}, { tone: 'bad' }); return; }
        S.out = S.A[0].v;
        R.step('1.', `ITEM := TREE[1] = **${S.out}** (the ${S.max ? 'maximum' : 'minimum'}).`, { b: [1] });
        const last = S.A.pop(); S.n--;
        if (S.n) { S.A[0] = last; R.step('2.', `Move the last leaf ${last.v} to the root; N := ${S.n}.`, { s: [1] }); this.siftDown(S, 1, R, S.n); }
        R.step('5.', `Deleted ${S.out}.`, {}, { tone: 'ok' });
        S.out = null;
      },
      build(S, p, R) {
        const vals = String(p.init).trim() ? U.nums(p.init, { min: 1, max: 31, name: 'values' }) : [];
        S.A = vals.map(item); S.n = vals.length;
        R.algo('build').vars(() => ({ N: S.n }));
        R.step(null, 'Start from the values in their given order — not yet a heap.');
        for (let k = Math.floor(S.n / 2); k >= 1; k--) { R.step('1.', `K = ${k}: sift TREE[${k}] = ${S.A[k - 1].v} down.`, { s: [k] }); this.siftDown(S, k, R, S.n, '     Sift'); }
        R.step('2.', `Heap built bottom-up. Root = ${S.A[0] ? S.A[0].v : '–'}.`, {}, { tone: 'ok' });
      },
    },
    view(st, f) { return heapView(st.A, st.n, f); },
  });

  /* ---------------- Heapsort ---------------- */
  DSA.sim({
    id: 'heap-sort', cat: 'sort', title: 'Heapsort', short: 'Heapsort',
    tags: ['heapsort', 'heap sort', 'in place'],
    blurb: 'Phase A: turn the array into a max-heap. Phase B: repeatedly swap the root (the maximum) with the last element of the heap and shrink the heap by one, sifting the new root down.',
    schaum: 'Schaum Ch. 7 · Heapsort',
    cx: [['Time (all cases)', 'O(n log n)'], ['Extra space', 'O(1) — in place'], ['Stable', 'no']],
    theory: `<p>Heapsort needs no extra array: the heap occupies the front of A and the sorted part grows at the back.</p>
      <ul><li><b>Phase A</b> builds a max-heap — the textbook inserts the elements one by one with INSHEAP; the faster bottom-up method sifts down from ⌊n/2⌋ to 1 in O(n).</li><li><b>Phase B</b> repeats n − 1 times: interchange <code>A[1]</code> with <code>A[N]</code>, decrease N, and restore the heap with a sift-down (O(log n)).</li></ul>
      <p>Its O(n log n) worst case makes it a safe choice where quicksort's O(n²) worst case is unacceptable.</p>`,
    algo: { run: ['HEAPSORT(A, N)', '1. [Phase A: build a heap.]', '     Textbook: Repeat for J = 1 to N − 1: Call INSHEAP(A, J, A[J + 1]).', '     Bottom-up: Repeat for K = ⌊N/2⌋ down to 1: sift A[K] down.', '2. [Phase B: sort.] Repeat while N > 1:', '  3. Interchange A[1] and A[N]. [The maximum goes to its final place.]', '  4. Set N := N − 1 and sift A[1] down within A[1..N].', '5. Exit.'] },
    controls: [
      { id: 'arr', type: 'text', label: 'Array', value: '44, 30, 50, 22, 60, 55, 77, 55', wide: true, run: true, rand: () => U.randList(U.rand(7, 10), 1, 99).join(', ') },
      { id: 'build', type: 'select', label: 'Phase A', value: 'bottom', run: true, opts: [['ins', 'Repeated insertion (textbook)'], ['bottom', 'Bottom-up heapify']] },
      { type: 'btn', label: 'Sort', op: 'play', kind: 'primary' },
    ],
    auto: 'run',
    init(p) { return { A: U.nums(p.arr, { min: 2, max: 15, lo: 1, hi: 99 }).map(item), n: 0, phase: 'A', max: true, build: p.build }; },
    ops: {
      run(S, p, R) {
        const H = DSA.sims.heap;
        let cmpN = 0;
        R.vars(() => ({ phase: S.phase, 'heap size N': S.n }));
        if (S.build === 'ins') {
          S.n = 1;
          R.step('     Textbook', 'A[1] alone is a heap of size 1.', { k: [1] });
          for (let j = 1; j < S.A.length; j++) {
            S.n = j + 1;
            let ptr = S.n;
            R.step('     Textbook', `INSHEAP A[${ptr}] = ${S.A[ptr - 1].v} into the heap A[1..${ptr - 1}].`, { s: [ptr] });
            while (ptr > 1 && S.A[ptr - 1].v > S.A[Math.floor(ptr / 2) - 1].v) { const par = Math.floor(ptr / 2); [S.A[ptr - 1], S.A[par - 1]] = [S.A[par - 1], S.A[ptr - 1]]; ptr = par; cmpN++; R.step('     Textbook', `Swap up to A[${ptr}].`, { s: [ptr] }); }
          }
        } else {
          S.n = S.A.length;
          for (let k = Math.floor(S.n / 2); k >= 1; k--) { R.step('     Bottom-up', `Sift A[${k}] = ${S.A[k - 1].v} down.`, { s: [k] }); H.siftDown(S, k, { step: (l, m, h) => R.step('     Bottom-up', m, h) }, S.n); }
        }
        S.phase = 'B';
        R.step('2.', `Phase A done: A[1] = ${S.A[0].v} is the maximum. Phase B starts.`);
        while (S.n > 1) {
          R.step('  3.', `Interchange A[1] = ${S.A[0].v} and A[${S.n}] = ${S.A[S.n - 1].v}.`, { s: [1, S.n] });
          [S.A[0], S.A[S.n - 1]] = [S.A[S.n - 1], S.A[0]];
          S.n--;
          R.step('  4.', `${S.A[S.n].v} is in its final place. N := ${S.n}; sift the new root down.`, { k: [S.n + 1] });
          H.siftDown(S, 1, { step: (l, m, h) => R.step('  4.', m, h) }, S.n);
        }
        S.n = 0; S.phase = 'done';
        R.step('5.', `Sorted: ${S.A.map((x) => x.v).join(', ')}.`, {}, { tone: 'ok' });
      },
    },
    view(st, f) { return heapView(st.A, st.n, f, { name: 'A', sortedTail: st.phase !== 'A' }); },
  });

  /* ---------------- Huffman ---------------- */
  DSA.sim({
    id: 'huffman', cat: 'heaps', title: 'Huffman’s Algorithm', short: 'Huffman coding',
    tags: ['huffman', 'path length', 'weighted path length', 'prefix code', 'compression', 'extended binary tree'],
    blurb: 'Repeatedly join the two subtrees of smallest weight. The resulting tree gives each symbol a prefix-free code (left = 0, right = 1) with the minimum weighted path length.',
    schaum: 'Schaum Ch. 7 · Path lengths; Huffman’s algorithm',
    cx: [['n symbols with a heap / sorted list', 'O(n log n)'], ['Result', 'minimum weighted path length']],
    theory: `<p>Given weights w₁, …, wₙ (for example, how often each letter occurs), Huffman's algorithm builds an extended binary tree whose <b>weighted external path length</b> <code>P = Σ wᵢ · Lᵢ</code> is as small as possible (Lᵢ is the depth of leaf i).</p>
      <p>Start with n one-node trees. Repeatedly take the two trees with the <b>smallest</b> weights and make them the children of a new node whose weight is their sum. After n − 1 merges one tree remains. Reading 0 for each left branch and 1 for each right branch from the root gives each symbol its code; frequent symbols get short codes, and no code is a prefix of another.</p>`,
    algo: { run: ['HUFFMAN(W)', '1. Make a one-node tree for each symbol, with its weight.', '2. Repeat until only one tree remains:', '  3. Remove the two trees T1, T2 with the smallest weights.', '  4. Make a new node with weight w(T1) + w(T2), LEFT := T1, RIGHT := T2.', '  5. Put the new tree back among the others.', '6. Label left branches 0 and right branches 1; read each leaf’s code from the root.'] },
    controls: [
      { id: 'w', type: 'text', label: 'Symbols:weights', value: 'A:22 B:5 C:11 D:19 E:2 F:11 G:25 H:5', wide: true, run: true, presets: [['A:22 B:5 C:11 D:19 E:2 F:11 G:25 H:5', '8 letters'], ['a:5 b:9 c:12 d:13 e:16 f:45', 'a … f (classic)'], ['A:1 B:1 C:2 D:3 E:5 F:8', 'Fibonacci weights (skewed)']] },
      { type: 'btn', label: 'Build', op: 'play', kind: 'primary' },
    ],
    auto: 'run',
    init(p) {
      const parts = String(p.w).trim().split(/[\s,;]+/).filter(Boolean);
      if (parts.length < 2) U.fail('Enter at least two symbols, e.g. A:5 B:9 C:12');
      if (parts.length > 10) U.fail('Use at most 10 symbols.');
      const seen = new Set();
      const leaves = parts.map((s) => {
        const m = s.match(/^([^:\s]{1,3}):(\d{1,3})$/);
        if (!m) U.fail(`Write each symbol as name:weight (problem with “${s}”).`);
        if (seen.has(m[1])) U.fail(`Symbol ${m[1]} appears twice.`);
        seen.add(m[1]);
        return { id: 'hf' + m[1], v: Number(m[2]), ch: m[1], l: null, r: null };
      });
      return { forest: leaves.sort((a, b) => a.v - b.v), codes: null };
    },
    ops: {
      run(S, p, R) {
        let k = 0;
        R.vars(() => ({ trees: S.forest.length }));
        R.step('1.', `${S.forest.length} one-node trees, kept in increasing order of weight.`);
        while (S.forest.length > 1) {
          const a = S.forest[0], b = S.forest[1];
          R.step('  3.', `The two smallest weights are ${a.v}${a.ch ? ' (' + a.ch + ')' : ''} and ${b.v}${b.ch ? ' (' + b.ch + ')' : ''}.`, { n: { [a.id]: 'cmp', [b.id]: 'cmp' } });
          S.forest.splice(0, 2);
          const nd = { id: 'hn' + (++k), v: a.v + b.v, l: a, r: b };
          let i = S.forest.findIndex((t) => t.v > nd.v); if (i < 0) i = S.forest.length;
          S.forest.splice(i, 0, nd);
          R.step('  4.', `Join them under a new node of weight ${a.v} + ${b.v} = **${nd.v}**.`, { n: { [nd.id]: 'new' } });
        }
        const codes = [];
        let P = 0;
        (function w(n, code) { if (!n.l) { codes.push([n.ch, n.v, code || '0', (code || '0').length]); P += n.v * Math.max(1, code.length); return; } w(n.l, code + '0'); w(n.r, code + '1'); })(S.forest[0], '');
        S.codes = codes;
        R.table(() => ({ head: ['Symbol', 'Weight', 'Code', 'Bits'], rows: (S.codes || []).map((c) => c.map(String)), hi: -1 }));
        R.step('6.', `Codes assigned. Weighted path length P = Σ w·L = **${P}**.`, {}, { tone: 'ok' });
      },
    },
    view(st, f) {
      const sp = [];
      let x = 0;
      st.forest.forEach((t) => {
        const part = V.tree('H', t, { x, y: 20, dx: 40, dy: 62, r: 18, hl: f.hl.n || {}, sub: (n) => n.ch });
        sp.push(...part);
        if (st.codes) {
          for (const [, q] of part.layout.pos) {
            for (const [side, bit] of [['l', '0'], ['r', '1']]) {
              const c = q.nd[side]; if (!c) continue;
              const cq = part.layout.pos.get(c.id);
              sp.push(V.text('bit' + c.id, (q.x + cq.x) / 2 + (side === 'l' ? -8 : 8), (q.y + cq.y) / 2 - 2, bit, 'idx act'));
            }
          }
        }
        x += part.layout.count * 40 + 26;
      });
      return { specs: sp, minH: 320, minW: 560 };
    },
  });
})(typeof window !== 'undefined' ? window : globalThis);
