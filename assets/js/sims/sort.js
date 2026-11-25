/* DSA Lab · sims/sort.js — Sorting (Schaum Ch. 4, 6 & 9) */
(function (g) {
  'use strict';
  const DSA = g.DSA, U = DSA.U, V = DSA.V;
  const items = (vals) => vals.map((v, i) => ({ id: 'b' + i, v }));
  const PRESETS = [
    ['64, 25, 12, 22, 11, 90, 47, 33', 'Random 8'],
    ['5, 8, 12, 19, 23, 30, 41, 56, 70', 'Already sorted'],
    ['70, 56, 41, 30, 23, 19, 12, 8, 5', 'Reversed (worst case)'],
    ['12, 8, 19, 23, 30, 56, 41, 70, 5', 'Nearly sorted'],
    ['30, 10, 30, 20, 10, 20, 30, 10', 'Many duplicates'],
  ];
  const rand = () => U.randList(U.rand(8, 11), 5, 99).join(', ');
  const arrCtl = (val) => ({ id: 'arr', type: 'text', label: 'Array', value: val || '64, 25, 12, 22, 11, 90, 47, 33', wide: true, run: true, rand, presets: PRESETS });
  const BO = { x: 0, y: 30, w: 600, h: 190 };

  function barsView(st, f, o) {
    const hl = {};
    (st.done || []).forEach((i) => (hl[i] = 'ok'));
    const H = f.hl || {};
    if (H.range) st.a.forEach((_, i) => { if (i < H.range[0] || i > H.range[1]) hl[i] = hl[i] || 'dim'; });
    (H.c || []).forEach((i) => (hl[i] = 'cmp'));
    (H.s || []).forEach((i) => (hl[i] = 'act'));
    (H.m || []).forEach((i) => (hl[i] = 'sel'));
    (H.k || []).forEach((i) => (hl[i] = 'ok'));
    const ptrs = Object.keys(st.p || {}).filter((k) => st.p[k] != null).map((k) => ({ i: st.p[k], label: k, cls: (o && o.pc && o.pc[k]) || 'act' }));
    const a = st.a.map((it) => Object.assign({}, it, { lift: it.lift || 0 }));
    const sp = V.bars('B', a, Object.assign({}, BO, { hl, ptrs, line: o && o.line != null ? o.line : undefined, max: st.max }));
    return sp;
  }
  const doneAll = (S) => (S.done = S.a.map((_, i) => i));

  /* ---------------- Bubble sort ---------------- */
  DSA.sim({
    id: 'bubble-sort', cat: 'sort', title: 'Bubble Sort', short: 'Bubble sort',
    tags: ['bubble', 'exchange sort', 'interchange', 'pass'],
    blurb: 'Compare neighbours and swap them when out of order. After pass K the K-th largest element has “bubbled” to its final place at the end.',
    schaum: 'Schaum Ch. 4 · Bubble sort',
    cx: [['Comparisons (always)', 'n(n − 1)/2'], ['Worst / average', 'O(n²)'], ['Best (with early exit)', 'O(n)'], ['Extra space', 'O(1)']],
    theory: `<p>Each <b>pass</b> walks along the unsorted part comparing <code>DATA[PTR]</code> with <code>DATA[PTR + 1]</code> and interchanging them when the first is larger. The largest remaining value is carried to the end, like a bubble rising.</p>
      <p>The textbook algorithm always makes N − 1 passes: <code>(n − 1) + (n − 2) + … + 1 = n(n − 1)/2</code> comparisons. A common improvement stops as soon as a pass makes no interchange — tick “Stop early” to see it finish sorted input in one pass.</p>`,
    algo: { run: ['BUBBLE(DATA, N)', '1. Repeat Steps 2 and 3 for K = 1 to N − 1: [Passes.]', '  2. Set PTR := 1. [Start of the pass.]', '  3. Repeat while PTR ≤ N − K:', '       (a) If DATA[PTR] > DATA[PTR + 1], then: Interchange them.', '       (b) Set PTR := PTR + 1.', '  [End of Step 1 loop.]', '4. Exit.'] },
    controls: [arrCtl(), { id: 'early', type: 'check', label: 'Stop early if no swap', value: false, run: true }, { type: 'btn', label: 'Sort', op: 'play', kind: 'primary' }],
    auto: 'run',
    init(p) { return { a: items(U.nums(p.arr, { max: 16, lo: 1, hi: 99, min: 2 })), p: {}, done: [] }; },
    ops: {
      run(S, p, R) {
        const N = S.a.length, A = S.a;
        let K = null, cmp = 0, sw = 0;
        R.vars(() => ({ N, K: K ?? '–', PTR: S.p.PTR ?? '–', comparisons: cmp, swaps: sw }));
        R.step(null, `Sort ${N} numbers into ascending order.`);
        for (K = 1; K <= N - 1; K++) {
          let swapped = false;
          S.p.PTR = 0;
          R.step('2.', `Pass K = ${K}: PTR := 1. This pass compares DATA[1..${N - K + 1}].`);
          for (let ptr = 1; ptr <= N - K; ptr++) {
            S.p.PTR = ptr - 1; cmp++;
            if (A[ptr - 1].v > A[ptr].v) {
              R.step('       (a)', `${A[ptr - 1].v} > ${A[ptr].v} → interchange.`, { c: [ptr - 1, ptr] });
              [A[ptr - 1], A[ptr]] = [A[ptr], A[ptr - 1]]; sw++; swapped = true;
              R.step('       (b)', 'Swapped. PTR := PTR + 1.', { s: [ptr - 1, ptr] });
            } else R.step('       (a)', `${A[ptr - 1].v} ≤ ${A[ptr].v} → no interchange. PTR := PTR + 1.`, { c: [ptr - 1, ptr] });
          }
          S.done.push(N - K);
          S.p.PTR = null;
          R.step('3.', `End of pass ${K}: ${A[N - K].v} is in its final place.`);
          if (p.early && !swapped) { doneAll(S); R.step('4.', `No interchange in pass ${K} — the array is already sorted. Stopped early after ${cmp} comparisons.`, {}, { tone: 'ok' }); return; }
        }
        doneAll(S); K = null;
        R.step('4.', `Sorted with ${cmp} comparisons and ${sw} interchanges.`, {}, { tone: 'ok' });
      },
    },
    view: (st, f) => barsView(st, f),
  });

  /* ---------------- Selection sort ---------------- */
  DSA.sim({
    id: 'selection-sort', cat: 'sort', title: 'Selection Sort', short: 'Selection sort',
    tags: ['selection', 'minimum', 'min'],
    blurb: 'For K = 1, 2, …, find the smallest element of A[K..N] and swap it into position K. At most one interchange per pass.',
    schaum: 'Schaum Ch. 9 · Selection sort',
    cx: [['Comparisons (always)', 'n(n − 1)/2'], ['Interchanges', '≤ n − 1'], ['Time', 'O(n²)'], ['Extra space', 'O(1)']],
    theory: `<p>Selection sort repeatedly <b>selects</b> the minimum of the unsorted part (using the procedure MIN) and places it at the front of that part. It does the same number of comparisons whatever the input, but performs at most n − 1 swaps — useful when writing to memory is expensive.</p>`,
    algo: { run: ['SELECTION(A, N)', '1. Repeat Steps 2 and 3 for K = 1 to N − 1:', '  2. Call MIN(A, K, N, LOC):', '       Set MIN := A[K] and LOC := K;', '       Repeat for J = K + 1 to N: If MIN > A[J], then: Set MIN := A[J] and LOC := J.', '  3. Interchange A[K] and A[LOC].', '4. Exit.'] },
    controls: [arrCtl(), { type: 'btn', label: 'Sort', op: 'play', kind: 'primary' }],
    auto: 'run',
    init(p) { return { a: items(U.nums(p.arr, { max: 16, lo: 1, hi: 99, min: 2 })), p: {}, done: [] }; },
    ops: {
      run(S, p, R) {
        const N = S.a.length, A = S.a;
        let cmp = 0, sw = 0, MIN = null;
        R.vars(() => ({ K: S.p.K != null ? S.p.K + 1 : '–', J: S.p.J != null ? S.p.J + 1 : '–', LOC: S.p.LOC != null ? S.p.LOC + 1 : '–', MIN: MIN ?? '–', comparisons: cmp, swaps: sw }));
        for (let K = 0; K < N - 1; K++) {
          S.p = { K, LOC: K }; MIN = A[K].v;
          R.step('       Set MIN', `Pass ${K + 1}: MIN := A[${K + 1}] = ${MIN}, LOC := ${K + 1}.`, { m: [K] });
          for (let J = K + 1; J < N; J++) {
            S.p.J = J; cmp++;
            if (MIN > A[J].v) { MIN = A[J].v; S.p.LOC = J; R.step('       Repeat for J', `A[${J + 1}] = ${A[J].v} < previous MIN → MIN := ${MIN}, LOC := ${J + 1}.`, { m: [J], c: [] }); }
            else R.step('       Repeat for J', `A[${J + 1}] = ${A[J].v} ≥ MIN (${MIN}).`, { c: [J], m: [S.p.LOC] });
          }
          S.p.J = null;
          const L = S.p.LOC;
          if (L !== K) { R.step('3.', `Interchange A[${K + 1}] = ${A[K].v} and A[${L + 1}] = ${A[L].v}.`, { m: [L], c: [K] }); [A[K], A[L]] = [A[L], A[K]]; sw++; }
          S.done.push(K);
          R.step('3.', L !== K ? `${A[K].v} is now in position ${K + 1}.` : `The minimum is already at position ${K + 1}; no interchange needed.`, { k: [K] });
        }
        S.p = {}; doneAll(S);
        R.step('4.', `Sorted with ${cmp} comparisons and only ${sw} interchanges.`, {}, { tone: 'ok' });
      },
    },
    view: (st, f) => barsView(st, f, { pc: { K: 'act', J: 'cmp', LOC: 'sel' } }),
  });

  /* ---------------- Insertion sort ---------------- */
  DSA.sim({
    id: 'insertion-sort', cat: 'sort', title: 'Insertion Sort', short: 'Insertion sort',
    tags: ['insertion', 'sentinel', 'card sorting'],
    blurb: 'Take A[K] out (TEMP), shift the larger elements of the sorted part one place right, and drop TEMP into the gap — like sorting a hand of cards.',
    schaum: 'Schaum Ch. 9 · Insertion sort',
    cx: [['Worst (reversed)', 'n(n − 1)/2 comparisons'], ['Best (sorted)', 'n − 1 comparisons'], ['Time', 'O(n²), O(n) best'], ['Extra space', 'O(1)']],
    theory: `<p>At step K the first K − 1 elements are already sorted. <code>TEMP := A[K]</code> is lifted out; every larger element to its left moves one place right; TEMP is inserted into the hole. The textbook puts <code>A[0] := −∞</code> as a <b>sentinel</b> so the inner loop never needs a separate “PTR ≥ 1” test.</p>
      <p>Insertion sort is <b>stable</b>, works in place, and is very fast on nearly sorted data — which is why real libraries use it for small sub-arrays.</p>`,
    algo: { run: ['INSERTION(A, N)', '1. Set A[0] := −∞. [Sentinel.]', '2. Repeat Steps 3 to 5 for K = 2 to N:', '  3. Set TEMP := A[K] and PTR := K − 1.', '  4. Repeat while TEMP < A[PTR]:', '       (a) Set A[PTR + 1] := A[PTR]. [Move the element right.]', '       (b) Set PTR := PTR − 1.', '  5. Set A[PTR + 1] := TEMP. [Drop TEMP into place.]', '6. Return.'] },
    controls: [arrCtl('31, 41, 59, 26, 41, 58, 12, 7'), { type: 'btn', label: 'Sort', op: 'play', kind: 'primary' }],
    auto: 'run',
    init(p) { return { a: items(U.nums(p.arr, { max: 16, lo: 1, hi: 99, min: 2 })), p: {}, done: [] }; },
    ops: {
      run(S, p, R) {
        const N = S.a.length, A = S.a;
        let cmp = 0, mv = 0, TEMP = null;
        R.vars(() => ({ K: S.p.K != null ? S.p.K + 1 : '–', PTR: S.p.PTR != null ? S.p.PTR + 1 : '–', TEMP: TEMP ?? '–', comparisons: cmp, moves: mv }));
        R.step('1.', 'A[0] := −∞ acts as a sentinel, so the scan always stops at the left end.');
        S.done = [0];
        for (let K = 1; K < N; K++) {
          let pos = K;
          TEMP = A[K].v; A[K].lift = 46; S.p = { K, PTR: K - 1 };
          R.step('3.', `K = ${K + 1}: lift TEMP := ${TEMP} out of the array.`, { m: [K] });
          while (pos > 0 && TEMP < A[pos - 1].v) {
            cmp++;
            R.step('4.', `TEMP = ${TEMP} < A[${pos}] = ${A[pos - 1].v} — keep shifting.`, { c: [pos - 1], m: [pos] });
            [A[pos - 1], A[pos]] = [A[pos], A[pos - 1]]; pos--; mv++;
            S.p.PTR = pos - 1;
            R.step('       (a)', `${A[pos + 1].v} moves one place right; PTR := PTR − 1.`, { s: [pos + 1], m: [pos] });
          }
          cmp++;
          R.step('4.', pos > 0 ? `TEMP = ${TEMP} ≥ A[${pos}] = ${A[pos - 1].v} — stop.` : `Reached the sentinel A[0] = −∞ — stop.`, pos > 0 ? { c: [pos - 1], m: [pos] } : { m: [pos] });
          A[pos].lift = 0;
          S.done = U.range(K + 1);
          R.step('5.', `A[${pos + 1}] := TEMP = ${TEMP}. The first ${K + 1} elements are sorted.`, { k: [pos] });
        }
        S.p = {}; TEMP = null; doneAll(S);
        R.step('6.', `Sorted with ${cmp} comparisons and ${mv} moves.`, {}, { tone: 'ok' });
      },
    },
    view: (st, f) => barsView(st, f, { pc: { K: 'sel', PTR: 'cmp' } }),
  });

  /* ---------------- Shell sort ---------------- */
  DSA.sim({
    id: 'shell-sort', cat: 'sort', title: 'Shell Sort', short: 'Shell sort',
    tags: ['shell', 'diminishing increment', 'gap'],
    blurb: 'Insertion sort on elements GAP apart, for shrinking gaps (N/2, N/4, …, 1). Far-apart moves early make the final gap-1 pass almost free.',
    schaum: 'Beyond the textbook · improved insertion sort',
    cx: [['With gaps N/2, N/4, …', 'O(n²) worst, much faster in practice'], ['Extra space', 'O(1)']],
    theory: `<p>Donald Shell's idea: insertion sort is slow because elements move one place at a time. Sorting the sub-lists of elements that are <code>GAP</code> apart lets small values jump far to the left quickly. The final pass with <code>GAP = 1</code> is an ordinary insertion sort on nearly sorted data.</p>`,
    algo: { run: ['SHELL(A, N)', '1. Set GAP := INT(N / 2).', '2. Repeat while GAP ≥ 1:', '  3. Repeat for K = GAP + 1 to N: [Gapped insertion sort.]', '       Set TEMP := A[K] and J := K.', '       Repeat while J > GAP and A[J − GAP] > TEMP:', '         Set A[J] := A[J − GAP] and J := J − GAP.', '       Set A[J] := TEMP.', '  4. Set GAP := INT(GAP / 2).', '5. Exit.'] },
    controls: [arrCtl('35, 33, 42, 10, 14, 19, 27, 44, 26, 31'), { type: 'btn', label: 'Sort', op: 'play', kind: 'primary' }],
    auto: 'run',
    init(p) { return { a: items(U.nums(p.arr, { max: 16, lo: 1, hi: 99, min: 2 })), p: {}, done: [] }; },
    ops: {
      run(S, p, R) {
        const N = S.a.length, A = S.a;
        let GAP = Math.floor(N / 2), cmp = 0, mv = 0;
        R.vars(() => ({ GAP, K: S.p.K != null ? S.p.K + 1 : '–', J: S.p.J != null ? S.p.J + 1 : '–', comparisons: cmp, moves: mv }));
        R.step('1.', `GAP := INT(${N}/2) = ${GAP}.`);
        while (GAP >= 1) {
          R.step('2.', `Sort every sub-list of elements ${GAP} apart.`);
          for (let K = GAP; K < N; K++) {
            let J = K; S.p = { K, J };
            A[K].lift = 46;
            R.step('       Set TEMP', `TEMP := A[${K + 1}] = ${A[K].v}.`, { m: [K] });
            while (J >= GAP) {
              cmp++;
              if (A[J - GAP].v <= A[J].v) { R.step('       Repeat while J', `A[${J - GAP + 1}] = ${A[J - GAP].v} ≤ TEMP — stop.`, { c: [J - GAP], m: [J] }); break; }
              R.step('       Repeat while J', `A[${J - GAP + 1}] = ${A[J - GAP].v} > TEMP = ${A[J].v} → move it ${GAP} place(s) right.`, { c: [J - GAP], m: [J] });
              [A[J - GAP], A[J]] = [A[J], A[J - GAP]]; J -= GAP; mv++; S.p.J = J;
              R.step('         Set A[J]', `J := J − GAP = ${J + 1}.`, { m: [J] });
            }
            A[J].lift = 0;
            R.step('       Set A[J] := TEMP', `TEMP placed at position ${J + 1}.`, { k: [J] });
          }
          GAP = Math.floor(GAP / 2); S.p = {};
          R.step('4.', GAP ? `GAP := ${GAP}.` : 'GAP becomes 0 — finished.');
        }
        doneAll(S);
        R.step('5.', `Sorted with ${cmp} comparisons and ${mv} moves.`, {}, { tone: 'ok' });
      },
    },
    view: (st, f) => barsView(st, f, { pc: { K: 'sel', J: 'cmp' } }),
  });

  /* ---------------- Merging two sorted lists ---------------- */
  DSA.sim({
    id: 'merging', cat: 'sort', title: 'Merging Two Sorted Lists', short: 'Merging',
    tags: ['merge', 'merging', 'two sorted arrays'],
    blurb: 'Combine sorted A (R elements) and sorted B (S elements) into one sorted C with pointers NA and NB — always take the smaller front element.',
    schaum: 'Schaum Ch. 9 · Merging',
    cx: [['Comparisons', '≤ R + S − 1'], ['Time', 'O(R + S)']],
    theory: `<p>Merging is the heart of merge sort. Pointers <code>NA</code> and <code>NB</code> mark the next unused elements of A and B; <code>PTR</code> marks the next free cell of C. Repeatedly copy the smaller of <code>A[NA]</code> and <code>B[NB]</code>. When one list is exhausted, copy the rest of the other unchanged.</p>`,
    algo: { run: ['MERGING(A, R, B, S, C)', '1. Set NA := 1, NB := 1 and PTR := 1.', '2. Repeat while NA ≤ R and NB ≤ S:', '     If A[NA] < B[NB], then: Set C[PTR] := A[NA], PTR := PTR + 1, NA := NA + 1.', '     Else: Set C[PTR] := B[NB], PTR := PTR + 1, NB := NB + 1.', '3. If NA > R, then: copy B[NB..S] to C[PTR..].', '   Else: copy A[NA..R] to C[PTR..].', '4. Exit.'] },
    controls: [
      { id: 'a', type: 'text', label: 'A (sorted)', value: '5, 12, 18, 33, 40', run: true, w: 210 },
      { id: 'b', type: 'text', label: 'B (sorted)', value: '3, 9, 21, 25, 47, 52', run: true, w: 210 },
      { type: 'btn', label: 'Merge', op: 'play', kind: 'primary' },
    ],
    auto: 'run',
    init(p) {
      const a = U.nums(p.a, { max: 8, name: 'elements of A' }).sort((x, y) => x - y), b = U.nums(p.b, { max: 8, name: 'elements of B' }).sort((x, y) => x - y);
      return { A: a.map((v, i) => ({ id: 'a' + i, v })), B: b.map((v, i) => ({ id: 'b' + i, v })), C: [], na: 0, nb: 0 };
    },
    ops: {
      run(S, p, R) {
        const r = S.A.length, s = S.B.length;
        let cmp = 0;
        R.vars(() => ({ NA: S.na + 1, NB: S.nb + 1, PTR: S.C.length + 1, comparisons: cmp }));
        R.step('1.', 'NA := 1, NB := 1, PTR := 1.');
        while (S.na < r && S.nb < s) {
          cmp++;
          const a = S.A[S.na], b = S.B[S.nb];
          if (a.v < b.v) { R.step('     If', `A[${S.na + 1}] = ${a.v} < B[${S.nb + 1}] = ${b.v} → take ${a.v} from A.`, { ca: S.na, cb: S.nb }); S.C.push(a); S.na++; }
          else { R.step('     Else', `B[${S.nb + 1}] = ${b.v} ≤ A[${S.na + 1}] = ${a.v} → take ${b.v} from B.`, { ca: S.na, cb: S.nb }); S.C.push(b); S.nb++; }
          R.step('2.', `C[${S.C.length}] := ${S.C[S.C.length - 1].v}.`, { nw: S.C.length - 1 });
        }
        if (S.na >= r) { while (S.nb < s) S.C.push(S.B[S.nb++]); R.step('3.', 'A is used up — copy the rest of B.'); }
        else { while (S.na < r) S.C.push(S.A[S.na++]); R.step('Else', 'B is used up — copy the rest of A.'); }
        R.step('4.', `Merged ${r} + ${s} elements with ${cmp} comparisons.`, {}, { tone: 'ok' });
      },
    },
    view(st, f) {
      const sp = [], cw = 44, gap = 6;
      const used = new Set(st.C.map((x) => x.id));
      const put = (arr, y, name, ptr, plabel, hlI) => {
        sp.push(V.text('n' + name, -12, y + 22, name, 'name', 'end'));
        arr.forEach((it, i) => { sp.push(V.box('s' + name + i, i * (cw + gap), y, cw, 40, '', 'slot', { rx: 6 })); if (!used.has(it.id)) sp.push(V.box('c' + it.id, i * (cw + gap), y, cw, 40, it.v, 'cell ' + (hlI === i ? 'cmp' : ''), { rx: 6 })); });
        if (ptr != null && ptr <= arr.length) sp.push(...V.ptr('p' + plabel, ptr * (cw + gap) + cw / 2, y + 42, plabel, 'act', 'bottom', 18));
      };
      put(st.A, 0, 'A', st.na, 'NA', f.hl.ca);
      put(st.B, 110, 'B', st.nb, 'NB', f.hl.cb);
      sp.push(V.text('nC', -12, 242, 'C', 'name', 'end'));
      const tot = st.A.length + st.B.length;
      for (let i = 0; i < tot; i++) sp.push(V.box('sC' + i, i * (cw + gap), 220, cw, 40, '', 'slot', { rx: 6 }));
      st.C.forEach((it, i) => sp.push(V.box('c' + it.id, i * (cw + gap), 220, cw, 40, it.v, 'cell ' + (f.hl.nw === i ? 'new' : 'ok'), { rx: 6 })));
      if (st.C.length < tot) sp.push(...V.ptr('pPTR', st.C.length * (cw + gap) + cw / 2, 262, 'PTR', 'sel', 'bottom', 18));
      return { specs: sp, minH: 320 };
    },
  });

  /* ---------------- Merge sort (bottom-up, as in the textbook) ---------------- */
  DSA.sim({
    id: 'merge-sort', cat: 'sort', title: 'Merge Sort', short: 'Merge sort',
    tags: ['merge sort', 'mergepass', 'divide and conquer', 'stable'],
    blurb: 'Treat the array as N sorted runs of length 1, then merge neighbouring runs into runs of length 2, 4, 8, … until one run remains. Items drop into the work array B and come back.',
    schaum: 'Schaum Ch. 9 · Merge-sort',
    cx: [['Time (all cases)', 'O(n log n)'], ['Passes', '⌈log₂ n⌉'], ['Extra space', 'O(n) for array B'], ['Stable', 'yes']],
    theory: `<p>The textbook's merge sort is <b>bottom-up</b>: procedure <code>MERGEPASS(A, N, L, B)</code> merges each pair of neighbouring runs of length <code>L</code> from A into B. Doubling L each pass gives <code>⌈log₂ n⌉</code> passes of <code>O(n)</code> work, so <b>O(n log n)</b> in every case.</p>
      <p>The recursive (top-down) version — split in half, sort each half, merge — does exactly the same merges in a different order.</p>`,
    algo: { run: ['MERGESORT(A, N)', '1. Set L := 1. [Length of the sorted runs.]', '2. Repeat Steps 3 to 5 while L < N:', '  3. Call MERGEPASS(A, N, L, B): merge each pair of runs', '       A[J..J+L−1] and A[J+L..J+2L−1] into B[J..J+2L−1].', '  4. Copy B back into A.', '  5. Set L := 2 · L.', '6. Exit.'] },
    controls: [arrCtl('38, 27, 43, 3, 9, 82, 10, 61, 17'), { type: 'btn', label: 'Sort', op: 'play', kind: 'primary' }],
    auto: 'run',
    init(p) { const a = items(U.nums(p.arr, { max: 16, lo: 1, hi: 99, min: 2 })); return { A: a.slice(), B: a.map(() => null), L: 1, max: Math.max(...a.map((x) => x.v)) }; },
    ops: {
      run(S, p, R) {
        const N = S.A.length;
        let cmp = 0;
        R.vars(() => ({ L: S.L, comparisons: cmp }));
        R.step('1.', 'L := 1: every single element is a sorted run.');
        while (S.L < N) {
          const L = S.L;
          R.step('2.', `Pass with L = ${L}: merge runs of length ${L} into runs of length ${2 * L}.`, { runs: L });
          for (let j = 0; j < N; j += 2 * L) {
            let i1 = j, e1 = Math.min(j + L, N), i2 = e1, e2 = Math.min(j + 2 * L, N), k = j;
            while (i1 < e1 && i2 < e2) {
              cmp++;
              const take1 = S.A[i1].v <= S.A[i2].v;
              R.step('       A[J', `Compare ${S.A[i1].v} and ${S.A[i2].v} → take ${take1 ? S.A[i1].v : S.A[i2].v}.`, { c: [i1, i2], runs: L, seg: [j, e2 - 1] });
              const src = take1 ? i1++ : i2++;
              S.B[k++] = S.A[src]; S.A[src] = null;
            }
            while (i1 < e1) { S.B[k++] = S.A[i1]; S.A[i1++] = null; }
            while (i2 < e2) { S.B[k++] = S.A[i2]; S.A[i2++] = null; }
            R.step('  3.', `B[${j + 1}..${e2}] now holds a sorted run.`, { runs: L, seg: [j, e2 - 1] });
          }
          S.A = S.B.slice(); S.B = S.B.map(() => null); S.L *= 2;
          R.step('  4.', 'Copy B back into A.', { runs: S.L });
          R.step('  5.', S.L < N ? `L := ${S.L}.` : `L := ${S.L} ≥ N — done.`, { runs: S.L });
        }
        R.step('6.', `Sorted with ${cmp} comparisons.`, { all: true }, { tone: 'ok' });
      },
    },
    view(st, f) {
      const sp = [], n = st.A.length, gap = 8, bw = Math.max(18, Math.min(50, (600 - (n - 1) * gap) / n)), H = 150;
      const bar = (it, i, y, cls) => { const h = Math.max(6, (it.v / st.max) * H); sp.push({ k: 'box', key: 'b' + it.id, x: i * (bw + gap), y: y + H - h, w: bw, h, text: '', top: String(it.v), cls: 'bar ' + cls, rx: 4 }); };
      sp.push(V.text('la', -10, 30 + H - 10, 'A', 'name', 'end'), V.text('lb', -10, 250 + H - 10, 'B', 'name', 'end'));
      const run = f.hl.runs || st.L;
      st.A.forEach((it, i) => {
        const tone = f.hl.all ? 'ok' : (f.hl.c || []).includes(i) ? 'cmp' : f.hl.seg && (i < f.hl.seg[0] || i > f.hl.seg[1]) ? 'dim' : Math.floor(i / run) % 2 ? 'sel' : '';
        if (it) bar(it, i, 30, tone);
        sp.push(V.text('ia' + i, i * (bw + gap) + bw / 2, 30 + H + 16, i + 1, 'idx'));
      });
      st.B.forEach((it, i) => { sp.push(V.box('bs' + i, i * (bw + gap), 250 + H - 4, bw, 4, '', 'slot', { rx: 1 })); if (it) bar(it, i, 250, 'new'); });
      return { specs: sp, minH: 440 };
    },
  });

  /* ---------------- Quick sort ---------------- */
  DSA.sim({
    id: 'quick-sort', cat: 'sort', title: 'Quicksort', short: 'Quicksort',
    tags: ['quick sort', 'quicksort', 'partition', 'pivot', 'lower', 'upper', 'divide and conquer'],
    blurb: 'Put one element (the pivot) into its final place so smaller elements are left of it and larger ones right, then sort the two sides. Sub-list boundaries wait on the stacks LOWER and UPPER.',
    schaum: 'Schaum Ch. 6 · Quicksort, an application of stacks',
    cx: [['Average', 'O(n log n)'], ['Worst (already sorted, first-element pivot)', 'O(n²)'], ['Stack space', 'O(log n) average'], ['Stable', 'no']],
    theory: `<p>The textbook presents quicksort as an <b>application of stacks</b>. The <b>reduction step</b> <code>QUICK(A, N, BEG, END, LOC)</code> takes the first element as the pivot and alternately scans from the right and from the left, swapping the pivot with any element on the wrong side, until the pivot (tracked by <code>LOC</code>) reaches its final position.</p>
      <p>The boundaries of sub-lists still to be sorted are pushed onto two stacks, <code>LOWER</code> and <code>UPPER</code>, instead of using recursion. Switch to the <b>Lomuto</b> scheme to see the partition most C textbooks use (last element as pivot, index i marks the end of the “smaller” region).</p>
      <p>On sorted input the first-element pivot always splits off just one element, giving the O(n²) worst case — try the “Already sorted” example.</p>`,
    algo: {
      run: ['QUICKSORT with stacks LOWER, UPPER', '1. Set TOP := NULL. If N > 1, then: Push 1 onto LOWER and N onto UPPER.', '2. Repeat Steps 3 to 6 while TOP ≠ NULL:', '  3. Pop BEG := LOWER[TOP] and END := UPPER[TOP].', '  4. Call QUICK(A, N, BEG, END, LOC):', '       (a) LEFT := BEG, RIGHT := END, LOC := BEG.', '       (b) Scan right to left: while A[LOC] ≤ A[RIGHT] and LOC ≠ RIGHT, RIGHT := RIGHT − 1;', '           if A[LOC] > A[RIGHT], swap them and LOC := RIGHT.', '       (c) Scan left to right: while A[LEFT] ≤ A[LOC] and LEFT ≠ LOC, LEFT := LEFT + 1;', '           if A[LEFT] > A[LOC], swap them and LOC := LEFT. Go back to (b).', '       (d) Stop when LOC = RIGHT (in b) or LOC = LEFT (in c): A[LOC] is final.', '  5. If BEG < LOC − 1, then: Push BEG and LOC − 1. [Left sub-list.]', '  6. If LOC + 1 < END, then: Push LOC + 1 and END. [Right sub-list.]', '7. Exit.'],
      lomuto: ['QUICKSORT (Lomuto partition)', '1. Push (1, N) onto the stack.', '2. Repeat while the stack is not empty:', '  3. Pop (BEG, END). Set PIVOT := A[END] and I := BEG − 1.', '  4. Repeat for J = BEG to END − 1:', '       If A[J] ≤ PIVOT, then: Set I := I + 1 and swap A[I], A[J].', '  5. Swap A[I + 1] and A[END]. Set LOC := I + 1. [Pivot is final.]', '  6. Push (BEG, LOC − 1) and (LOC + 1, END) if they have 2 or more elements.', '7. Exit.'],
    },
    controls: [arrCtl('44, 33, 11, 55, 77, 90, 40, 60, 99, 22, 88, 66'), { id: 'scheme', type: 'select', label: 'Partition', value: 'book', run: true, opts: [['book', 'Textbook (first element, alternating scans)'], ['lomuto', 'Lomuto (last element pivot)']] }, { type: 'btn', label: 'Sort', op: 'play', kind: 'primary' }],
    auto: 'run',
    init(p) { return { a: items(U.nums(p.arr, { max: 16, lo: 1, hi: 99, min: 2 })), p: {}, done: [], lower: [], upper: [], scheme: p.scheme }; },
    ops: {
      run(S, p, R) {
        const A = S.a, N = A.length;
        let cmp = 0, sw = 0, BEG = null, END = null;
        const swap = (i, j) => { [A[i], A[j]] = [A[j], A[i]]; sw++; };
        R.vars(() => ({ BEG: BEG == null ? '–' : BEG + 1, END: END == null ? '–' : END + 1, LOWER: S.lower.map((x) => x + 1), UPPER: S.upper.map((x) => x + 1), comparisons: cmp, swaps: sw }));
        const rng = () => [BEG, END];
        if (S.scheme === 'lomuto') {
          R.algo('lomuto');
          S.lower.push(0); S.upper.push(N - 1);
          R.step('1.', `Push (1, ${N}).`);
          while (S.lower.length) {
            BEG = S.lower.pop(); END = S.upper.pop();
            const piv = A[END].v; let i = BEG - 1;
            S.p = { I: null, J: BEG, PIVOT: END };
            R.step('3.', `Pop (${BEG + 1}, ${END + 1}). PIVOT := A[${END + 1}] = ${piv}.`, { range: rng(), m: [END] });
            for (let j = BEG; j < END; j++) {
              S.p.J = j; cmp++;
              if (A[j].v <= piv) { i++; S.p.I = i; R.step('       If', `A[${j + 1}] = ${A[j].v} ≤ ${piv} → I := ${i + 1}, swap A[I] and A[J].`, { range: rng(), c: [j], m: [END] }); if (i !== j) swap(i, j); R.step('4.', 'Smaller-than-pivot region grows.', { range: rng(), s: [i], m: [END] }); }
              else R.step('       If', `A[${j + 1}] = ${A[j].v} > ${piv} → leave it.`, { range: rng(), c: [j], m: [END] });
            }
            swap(i + 1, END); const LOC = i + 1; S.done.push(LOC); S.p = { LOC };
            R.step('5.', `Swap the pivot into position ${LOC + 1}. It is final.`, { range: rng(), k: [LOC] });
            if (LOC + 1 < END) { S.lower.push(LOC + 1); S.upper.push(END); }
            if (BEG < LOC - 1) { S.lower.push(BEG); S.upper.push(LOC - 1); }
            if (LOC - 1 === BEG && !S.done.includes(BEG)) S.done.push(BEG);
            if (LOC + 1 === END && !S.done.includes(END)) S.done.push(END);
            R.step('6.', 'Push the sub-lists that still need sorting.', { range: rng() });
          }
        } else {
          R.algo('run');
          S.lower.push(0); S.upper.push(N - 1);
          R.step('1.', `Push 1 onto LOWER and ${N} onto UPPER.`);
          while (S.lower.length) {
            BEG = S.lower.pop(); END = S.upper.pop();
            R.step('3.', `Pop BEG = ${BEG + 1}, END = ${END + 1}.`, { range: rng() });
            let L = BEG, Rt = END, LOC = BEG;
            S.p = { LEFT: L, RIGHT: Rt, LOC };
            R.step('       (a)', `LEFT := ${L + 1}, RIGHT := ${Rt + 1}, LOC := ${LOC + 1}. Pivot = ${A[LOC].v}.`, { range: rng(), m: [LOC] });
            for (;;) {
              while (A[LOC].v <= A[Rt].v && LOC !== Rt) { cmp++; R.step('       (b)', `A[LOC] = ${A[LOC].v} ≤ A[RIGHT] = ${A[Rt].v} → RIGHT := ${Rt}.`, { range: rng(), c: [Rt], m: [LOC] }); Rt--; S.p.RIGHT = Rt; }
              if (LOC === Rt) break;
              cmp++;
              R.step('           if A[LOC]', `A[LOC] = ${A[LOC].v} > A[RIGHT] = ${A[Rt].v} → swap; LOC := RIGHT = ${Rt + 1}.`, { range: rng(), c: [Rt], m: [LOC] });
              swap(LOC, Rt); LOC = Rt; S.p.LOC = LOC;
              R.step('           if A[LOC]', 'Pivot moved right.', { range: rng(), m: [LOC] });
              while (A[L].v <= A[LOC].v && L !== LOC) { cmp++; R.step('       (c)', `A[LEFT] = ${A[L].v} ≤ A[LOC] = ${A[LOC].v} → LEFT := ${L + 2}.`, { range: rng(), c: [L], m: [LOC] }); L++; S.p.LEFT = L; }
              if (LOC === L) break;
              cmp++;
              R.step('           if A[LEFT]', `A[LEFT] = ${A[L].v} > A[LOC] = ${A[LOC].v} → swap; LOC := LEFT = ${L + 1}.`, { range: rng(), c: [L], m: [LOC] });
              swap(L, LOC); LOC = L; S.p.LOC = LOC;
              R.step('           if A[LEFT]', 'Pivot moved left.', { range: rng(), m: [LOC] });
            }
            S.done.push(LOC); S.p = { LOC };
            R.step('       (d)', `LEFT, LOC and RIGHT meet: A[${LOC + 1}] = ${A[LOC].v} is in its final place.`, { range: rng(), k: [LOC] });
            if (BEG < LOC - 1) { S.lower.push(BEG); S.upper.push(LOC - 1); R.step('  5.', `Push the left sub-list (${BEG + 1}, ${LOC}).`, { range: rng() }); }
            else if (BEG === LOC - 1) S.done.push(BEG);
            if (LOC + 1 < END) { S.lower.push(LOC + 1); S.upper.push(END); R.step('  6.', `Push the right sub-list (${LOC + 2}, ${END + 1}).`, { range: rng() }); }
            else if (LOC + 1 === END) S.done.push(END);
          }
        }
        BEG = END = null; S.p = {}; doneAll(S);
        R.step('7.', `Sorted with ${cmp} comparisons and ${sw} swaps.`, {}, { tone: 'ok' });
      },
    },
    view: (st, f) => barsView(st, f, { pc: { LEFT: 'act', RIGHT: 'sel', LOC: 'cmp', I: 'act', J: 'sel', PIVOT: 'cmp' } }),
  });

  /* ---------------- Radix sort ---------------- */
  DSA.sim({
    id: 'radix-sort', cat: 'sort', title: 'Radix Sort', short: 'Radix sort',
    tags: ['radix', 'bucket', 'digit', 'card sorter', 'lsd'],
    blurb: 'Distribute the numbers into ten pockets by their last digit, collect them in order, then repeat with the tens digit, the hundreds digit, … No comparisons at all.',
    schaum: 'Schaum Ch. 9 · Radix sort',
    cx: [['d digits, n numbers, radix 10', 'O(d · (n + 10))'], ['Comparisons', 'none'], ['Extra space', 'n + 10 pockets']],
    theory: `<p>Radix sort mimics the old punched-card sorting machines. Starting with the <b>least significant digit</b>, each pass distributes the numbers into pockets 0–9 and then collects the pockets in order. Because each pass is <b>stable</b> (it keeps the order from the previous pass), after the last (most significant) digit the list is sorted.</p>
      <p>The time is proportional to <code>d · n</code> where d is the number of digits — excellent when d is small and fixed.</p>`,
    algo: { run: ['RADIXSORT(A, N)', '1. Let D := number of digits of the largest key.', '2. Repeat Steps 3 and 4 for digit position E = 1 (units) to D:', '  3. [Distribute.] For each key, in order, put it into pocket = its E-th digit.', '  4. [Collect.] Take the keys out of pockets 0, 1, …, 9, in order.', '5. Exit.'] },
    controls: [{ id: 'arr', type: 'text', label: 'Array', value: '348, 143, 361, 423, 538, 128, 321, 543, 366', wide: true, run: true, rand: () => U.randList(9, 10, 999).join(', ') }, { type: 'btn', label: 'Sort', op: 'play', kind: 'primary' }],
    auto: 'run',
    init(p) { return { a: items(U.nums(p.arr, { max: 12, lo: 0, hi: 999 })), pockets: U.range(10).map(() => []), E: 0 }; },
    ops: {
      run(S, p, R) {
        const D = String(Math.max(...S.a.map((x) => x.v))).length;
        R.vars(() => ({ D, E: S.E || '–' }));
        R.step('1.', `The largest key has D = ${D} digit(s), so ${D} pass(es).`);
        for (let e = 1; e <= D; e++) {
          S.E = e;
          const div = Math.pow(10, e - 1);
          R.step('2.', `Pass ${e}: use the ${['units', 'tens', 'hundreds'][e - 1]} digit.`);
          while (S.a.length) {
            const it = S.a.shift(); const d = Math.floor(it.v / div) % 10;
            S.pockets[d].push(it);
            R.step('  3.', `${it.v} → pocket ${d}.`, { mv: it.id, pocket: d });
          }
          for (let d = 0; d < 10; d++) while (S.pockets[d].length) S.a.push(S.pockets[d].shift());
          R.step('  4.', `Collect pockets 0 → 9: ${S.a.map((x) => x.v).join(', ')}.`);
        }
        S.E = 0;
        R.step('5.', 'Sorted — and not a single comparison between keys.', { all: true }, { tone: 'ok' });
      },
    },
    view(st, f) {
      const sp = [], cw = 50, gap = 6;
      sp.push(V.text('la', -10, 22, 'A', 'name', 'end'));
      st.a.forEach((it, i) => sp.push(V.box('c' + it.id, i * (cw + gap), 0, cw, 40, it.v, 'cell ' + (f.hl.all ? 'ok' : it.id === f.hl.mv ? 'act' : ''), { rx: 6 })));
      const div = Math.pow(10, Math.max(0, (st.E || 1) - 1));
      for (let d = 0; d < 10; d++) {
        const x = d * (cw + gap);
        sp.push(V.box('pk' + d, x - 2, 100, cw + 4, 4 * 36 + 12, '', 'slot' + (f.hl.pocket === d ? ' act' : ''), { rx: 8 }));
        sp.push(V.text('pl' + d, x + cw / 2, 100 + 4 * 36 + 30, d, 'name'));
        st.pockets[d].forEach((it, j) => sp.push(V.box('c' + it.id, x, 100 + 4 * 36 - 30 - j * 36 + 4, cw, 32, it.v, 'cell ' + (it.id === f.hl.mv ? 'new' : ''), { rx: 5, fs: 13, title: 'digit ' + (Math.floor(it.v / div) % 10) })));
      }
      sp.push(V.text('pt', 0, 86, 'Pockets 0–9', 'title', 'start'));
      return { specs: sp, minH: 330 };
    },
  });

  /* ---------------- Counting sort ---------------- */
  DSA.sim({
    id: 'counting-sort', cat: 'sort', title: 'Counting Sort', short: 'Counting sort',
    tags: ['counting', 'histogram', 'stable', 'integer sort'],
    blurb: 'Count how many times each key occurs, turn the counts into positions with a running total, then place each key directly into the output — right to left, so equal keys keep their order.',
    schaum: 'Beyond the textbook · linear-time sorting',
    cx: [['n keys in range 0..k', 'O(n + k)'], ['Extra space', 'O(n + k)'], ['Stable', 'yes']],
    theory: `<p>When keys are small integers, comparing them is unnecessary. <code>COUNT[v]</code> first holds how many keys equal v; after the running sum it holds how many keys are <b>≤ v</b>, which is exactly the last position where a v belongs. Scanning the input from the right and decrementing the count keeps equal keys in their original order (stability), which is what radix sort relies on.</p>`,
    algo: { run: ['COUNTSORT(A, N, K) — keys 0..K', '1. Set COUNT[0..K] := 0.', '2. Repeat for J = 1 to N: Set COUNT[A[J]] := COUNT[A[J]] + 1.', '3. Repeat for V = 1 to K: Set COUNT[V] := COUNT[V] + COUNT[V − 1]. [Running total.]', '4. Repeat for J = N down to 1:', '     Set B[COUNT[A[J]]] := A[J] and COUNT[A[J]] := COUNT[A[J]] − 1.', '5. Exit. [B is sorted.]'] },
    controls: [{ id: 'arr', type: 'text', label: 'Keys (0–9)', value: '4, 1, 3, 4, 2, 9, 1, 3, 4, 0', wide: true, run: true, rand: () => U.randList(10, 0, 9).join(', ') }, { type: 'btn', label: 'Sort', op: 'play', kind: 'primary' }],
    auto: 'run',
    init(p) { const a = U.nums(p.arr, { max: 14, lo: 0, hi: 9, name: 'keys (0–9)' }); return { a: a.map((v, i) => ({ id: 'k' + i, v })), C: U.range(Math.max(...a) + 1).map(() => 0), B: a.map(() => null) }; },
    ops: {
      run(S, p, R) {
        const n = S.a.length, K = S.C.length - 1;
        R.vars(() => ({ N: n, K }));
        R.step('1.', `COUNT[0..${K}] := 0.`);
        S.a.forEach((it, j) => { S.C[it.v]++; R.step('2.', `A[${j + 1}] = ${it.v} → COUNT[${it.v}] = ${S.C[it.v]}.`, { j, c: it.v }); });
        for (let v = 1; v <= K; v++) { S.C[v] += S.C[v - 1]; R.step('3.', `COUNT[${v}] += COUNT[${v - 1}] → ${S.C[v]} keys are ≤ ${v}.`, { c: v }); }
        for (let j = n - 1; j >= 0; j--) {
          const it = S.a[j], pos = S.C[it.v];
          S.B[pos - 1] = it; S.a[j] = Object.assign({}, it, { gone: true });
          S.C[it.v]--;
          R.step('     Set B', `A[${j + 1}] = ${it.v} goes to B[${pos}]; COUNT[${it.v}] := ${S.C[it.v]}.`, { j, c: it.v, b: pos - 1 });
        }
        R.step('5.', 'B is sorted, and equal keys kept their original left-to-right order.', { all: true }, { tone: 'ok' });
      },
    },
    view(st, f) {
      const sp = [], cw = 40, gap = 6;
      const lab = (k, y, t) => sp.push(V.text(k, -12, y + 22, t, 'name', 'end'));
      lab('la', 0, 'A'); lab('lc', 110, 'COUNT'); lab('lb', 220, 'B');
      st.a.forEach((it, i) => { sp.push(V.box('sa' + i, i * (cw + gap), 0, cw, 38, '', 'slot', { rx: 5 })); if (!it.gone) sp.push(V.box('c' + it.id, i * (cw + gap), 0, cw, 38, it.v, 'cell ' + (f.hl.j === i ? 'act' : ''), { rx: 5 })); });
      st.C.forEach((c, v) => { sp.push(V.box('cc' + v, v * (cw + gap), 110, cw, 38, c, 'mcell ' + (f.hl.c === v ? 'cmp' : ''), { rx: 5 })); sp.push(V.text('cv' + v, v * (cw + gap) + cw / 2, 102, v, 'idx')); });
      st.B.forEach((it, i) => { sp.push(V.box('sb' + i, i * (cw + gap), 220, cw, 38, '', 'slot', { rx: 5 })); sp.push(V.text('bi' + i, i * (cw + gap) + cw / 2, 274, i + 1, 'idx')); if (it) sp.push(V.box('c' + it.id, i * (cw + gap), 220, cw, 38, it.v, 'cell ' + (f.hl.all ? 'ok' : f.hl.b === i ? 'new' : 'ok'), { rx: 5 })); });
      return { specs: sp, minH: 300 };
    },
  });
})(typeof window !== 'undefined' ? window : globalThis);
