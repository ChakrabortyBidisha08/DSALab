/* DSA Lab · sims/search.js — Searching (Schaum Ch. 4 & 9) */
(function (g) {
  'use strict';
  const DSA = g.DSA, U = DSA.U, V = DSA.V;
  const items = (vals) => vals.map((v, i) => ({ id: 'd' + i, v }));
  const randArr = (n) => () => U.randList(n, 1, 99).join(', ');
  const randSorted = (n) => () => U.randList(n, 1, 99, true).sort((a, b) => a - b).join(', ');

  /* ---------------- Linear search ---------------- */
  DSA.sim({
    id: 'linear-search', cat: 'search', title: 'Linear Search (with a sentinel)', short: 'Linear search',
    tags: ['sequential search', 'sentinel', 'find'],
    blurb: 'Compare ITEM with each element in turn. Putting ITEM into DATA[N + 1] as a sentinel guarantees the loop stops, so it needs only one test per element.',
    schaum: 'Schaum Ch. 4 · Linear search',
    cx: [['Worst case', 'n + 1 comparisons'], ['Average (successful)', '(n + 1) / 2'], ['Order', 'O(n)']],
    theory: `<p>Linear (sequential) search works on <b>any</b> array, sorted or not. The textbook version places <code>ITEM</code> in <code>DATA[N + 1]</code>; the loop <code>while DATA[LOC] ≠ ITEM</code> then always stops, and stopping at position N + 1 means “not found”. This saves the separate <code>LOC ≤ N</code> test on every step.</p>
      <p>The average number of comparisons for a successful search is about <code>n / 2</code>, so the running time is <b>O(n)</b>.</p>`,
    algo: {
      run: ['LINEAR(DATA, N, ITEM, LOC)', '1. [Insert ITEM at the end as a sentinel.] Set DATA[N + 1] := ITEM.', '2. [Initialise counter.] Set LOC := 1.', '3. [Search.] Repeat while DATA[LOC] ≠ ITEM:', '     Set LOC := LOC + 1.', '   [End of loop.]', '4. [Successful?] If LOC = N + 1, then: Set LOC := 0.', '5. Exit.'],
      plain: ['LINEAR(DATA, N, ITEM, LOC) — no sentinel', '1. Set LOC := 1.', '2. Repeat while LOC ≤ N and DATA[LOC] ≠ ITEM:', '     Set LOC := LOC + 1.', '3. If LOC = N + 1, then: Set LOC := 0.', '4. Exit.'],
    },
    controls: [
      { id: 'arr', type: 'text', label: 'DATA', value: '33, 12, 78, 45, 61, 27, 90, 54', wide: true, run: true, rand: randArr(9) },
      { id: 'item', type: 'num', label: 'ITEM', value: 27, run: true, w: 80 },
      { id: 'sent', type: 'check', label: 'Use sentinel', value: true, run: true },
      { type: 'btn', label: 'Search', op: 'play', kind: 'primary' },
    ],
    auto: 'run',
    init(p) { return { a: items(U.nums(p.arr, { max: 15 })), item: U.num(p.item, { name: 'ITEM' }), loc: null, sent: !!p.sent, sentOn: false, res: null }; },
    ops: {
      run(S, p, R) {
        const N = S.a.length, ITEM = S.item;
        let LOC = null, cmp = 0;
        R.algo(S.sent ? 'run' : 'plain').vars(() => ({ N, ITEM, LOC: LOC == null ? '–' : LOC, comparisons: cmp }));
        if (S.sent) { S.sentOn = true; R.step('1.', `Put ITEM = ${ITEM} in DATA[${N + 1}] as a sentinel.`, { sent: true }); }
        LOC = 1; S.loc = 0;
        R.step(S.sent ? '2.' : '1.', 'LOC := 1.');
        while (true) {
          if (!S.sent && LOC > N) break;
          const v = LOC <= N ? S.a[LOC - 1].v : ITEM;
          cmp++;
          if (v === ITEM) { R.step(S.sent ? '3.' : '2.', `DATA[${LOC}] = ${v} = ITEM — the loop stops.`, { cur: LOC - 1, eq: true }); break; }
          R.step(S.sent ? '3.' : '2.', `DATA[${LOC}] = ${v} ≠ ${ITEM}.`, { cur: LOC - 1 });
          LOC++; S.loc = LOC - 1;
          R.step('     Set LOC', `LOC := ${LOC}.`);
        }
        if (LOC === N + 1) { S.res = 0; R.step(S.sent ? '4.' : '3.', `Stopped at the ${S.sent ? 'sentinel' : 'end'} (LOC = N + 1), so ${ITEM} is **not** in DATA: LOC := 0. (${cmp} comparisons)`, {}, { tone: 'bad' }); }
        else { S.res = LOC; R.step(S.sent ? '4.' : '3.', `**Found ${ITEM} at LOC = ${LOC}** after ${cmp} comparison(s).`, { cur: LOC - 1, eq: true }, { tone: 'ok' }); }
      },
    },
    view(st, f) {
      const arr = st.a.slice();
      if (st.sentOn) arr.push({ id: 'sentinel', v: st.item, cls: 'sel' });
      const hl = {};
      if (st.loc != null) for (let i = 0; i < st.loc; i++) hl[i] = 'dim';
      if (f.hl.cur != null) hl[f.hl.cur] = f.hl.eq ? 'ok' : 'cmp';
      const sp = V.array('A', arr, { x: 0, y: 40, hl, name: 'DATA', ptrs: st.loc != null ? [{ i: st.loc, label: 'LOC', cls: 'act' }] : [] });
      if (st.sentOn) sp.push(V.text('sl', V.arrayPos({}, st.a.length) + 26, 20, 'sentinel', 'idx sel'));
      sp.push(V.text('it', 0, 150, `ITEM = ${st.item}`, 'note', 'start'));
      return { specs: sp, minH: 210 };
    },
  });

  /* ---------------- Binary search ---------------- */
  DSA.sim({
    id: 'binary-search', cat: 'search', title: 'Binary Search', short: 'Binary search',
    tags: ['binary search', 'bisection', 'divide and conquer', 'beg', 'mid', 'end', 'sorted'],
    blurb: 'On a sorted array, compare ITEM with the middle element and throw away the half that cannot contain it. Each step halves the search space.',
    schaum: 'Schaum Ch. 4 · Binary search',
    cx: [['Worst case', '⌊log₂ n⌋ + 1 comparisons'], ['Order', 'O(log n)'], ['Requirement', 'sorted array, direct access']],
    theory: `<p>Binary search needs the data to be <b>sorted</b> and stored so that any element can be reached directly (an array, not a linked list).</p>
      <p>Variables <code>BEG</code> and <code>END</code> bound the segment still in play, and <code>MID = INT((BEG + END) / 2)</code>. If <code>ITEM &lt; DATA[MID]</code> the search continues in the left half (<code>END := MID − 1</code>), otherwise in the right half (<code>BEG := MID + 1</code>). If <code>BEG &gt; END</code> the segment is empty and ITEM is absent.</p>
      <p>With 1 000 000 elements binary search needs at most 20 comparisons; linear search may need a million.</p>`,
    algo: { run: ['BINARY(DATA, LB, UB, ITEM, LOC)', '1. [Initialise segment variables.] Set BEG := LB, END := UB and MID := INT((BEG + END)/2).', '2. Repeat Steps 3 and 4 while BEG ≤ END and DATA[MID] ≠ ITEM:', '  3. If ITEM < DATA[MID], then: Set END := MID − 1.', '     Else: Set BEG := MID + 1.', '  4. Set MID := INT((BEG + END)/2).', '  [End of Step 2 loop.]', '5. If DATA[MID] = ITEM, then: Set LOC := MID.', '   Else: Set LOC := NULL.', '6. Exit.'] },
    controls: [
      { id: 'arr', type: 'text', label: 'DATA (sorted)', value: '11, 22, 30, 33, 40, 44, 55, 60, 66, 77, 80, 88, 99', wide: true, run: true, rand: randSorted(13) },
      { id: 'item', type: 'num', label: 'ITEM', value: 40, run: true, w: 80 },
      { type: 'btn', label: 'Search', op: 'play', kind: 'primary' },
    ],
    auto: 'run',
    init(p) {
      const vals = U.nums(p.arr, { max: 16 });
      let sorted = true;
      for (let i = 1; i < vals.length; i++) if (vals[i] < vals[i - 1]) sorted = false;
      const a = sorted ? vals : vals.slice().sort((x, y) => x - y);
      return { a: items(a), item: U.num(p.item, { name: 'ITEM' }), beg: null, end: null, mid: null, res: null, sortedNote: !sorted };
    },
    ops: {
      run(S, p, R) {
        const N = S.a.length, ITEM = S.item, D = (i) => S.a[i - 1].v;
        let cmp = 0;
        R.vars(() => ({ ITEM, BEG: S.beg ?? '–', END: S.end ?? '–', MID: S.mid ?? '–', 'DATA[MID]': S.mid && S.mid >= 1 && S.mid <= N ? D(S.mid) : '–', comparisons: cmp }));
        if (S.sortedNote) R.step(null, 'Binary search needs sorted data, so your array was sorted first.', {}, { tone: 'cmp' });
        S.beg = 1; S.end = N; S.mid = Math.floor((S.beg + S.end) / 2);
        R.step('1.', `BEG := 1, END := ${N}, MID := INT((1 + ${N})/2) = ${S.mid}.`);
        while (S.beg <= S.end && D(S.mid) !== ITEM) {
          cmp++;
          R.step('2.', `DATA[MID] = DATA[${S.mid}] = ${D(S.mid)} ≠ ${ITEM}, and BEG ≤ END.`, { cmp: true });
          if (ITEM < D(S.mid)) { S.end = S.mid - 1; R.step('3.', `${ITEM} < ${D(S.mid)} → the right half is discarded: END := MID − 1 = ${S.end}.`); }
          else { S.beg = S.mid + 1; R.step('Else', `${ITEM} > ${D(S.mid)} → the left half is discarded: BEG := MID + 1 = ${S.beg}.`); }
          S.mid = Math.floor((S.beg + S.end) / 2);
          R.step('4.', S.beg <= S.end ? `MID := INT((${S.beg} + ${S.end})/2) = ${S.mid}.` : `BEG = ${S.beg} > END = ${S.end}: the segment is empty.`);
        }
        cmp += S.beg <= S.end ? 1 : 0;
        if (S.beg <= S.end && D(S.mid) === ITEM) { S.res = S.mid; R.step('5.', `**DATA[${S.mid}] = ${ITEM} → LOC := ${S.mid}** after ${cmp} comparison(s).`, { found: true }, { tone: 'ok' }); }
        else { S.res = 0; S.mid = null; R.step('Else', `${ITEM} is not in DATA → LOC := NULL. (${cmp} comparisons — at most ⌊log₂${N}⌋ + 1 = ${Math.floor(Math.log2(N)) + 1})`, {}, { tone: 'bad' }); }
      },
    },
    view(st, f) {
      const hl = {};
      st.a.forEach((_, i) => { if (st.beg != null && (i + 1 < st.beg || i + 1 > st.end)) hl[i] = 'dim'; });
      if (st.mid && st.mid >= 1 && st.mid <= st.a.length) hl[st.mid - 1] = f.hl.found ? 'ok' : 'cmp';
      const ptrs = [];
      if (st.beg != null && st.beg <= st.a.length + 1) ptrs.push({ i: st.beg - 1, label: 'BEG', cls: 'act', side: 'bottom' });
      if (st.end != null && st.end >= 0) ptrs.push({ i: st.end - 1, label: 'END', cls: 'sel', side: 'bottom' });
      if (st.mid) ptrs.push({ i: st.mid - 1, label: 'MID', cls: 'cmp', side: 'top' });
      const sp = V.array('A', st.a, { x: 0, y: 50, hl, ptrs, name: 'DATA' });
      sp.push(V.text('it', 0, 190, `ITEM = ${st.item}`, 'note', 'start'));
      return { specs: sp, minH: 230 };
    },
  });

  /* ---------------- Interpolation search ---------------- */
  DSA.sim({
    id: 'interpolation-search', cat: 'search', title: 'Interpolation Search', short: 'Interpolation search',
    tags: ['interpolation', 'probe', 'uniform'],
    blurb: 'Like binary search, but guess where ITEM should be from its value — the way you open a dictionary near “S” rather than in the middle.',
    schaum: 'Beyond the textbook · searching sorted data',
    cx: [['Uniformly spread keys', 'O(log log n)'], ['Worst case', 'O(n)']],
    theory: `<p>Instead of the middle, probe at</p><p class="formula">POS = BEG + (ITEM − DATA[BEG]) · (END − BEG) / (DATA[END] − DATA[BEG])</p>
      <p>When keys are spread evenly this lands very close to ITEM, needing about <code>log log n</code> probes. On skewed data (e.g. 1, 2, 3, 1000) it can degrade to linear time, which is why binary search remains the safe default.</p>`,
    algo: { run: ['INTERPOLATION(DATA, N, ITEM, LOC)', '1. Set BEG := 1 and END := N.', '2. Repeat while BEG ≤ END and DATA[BEG] ≤ ITEM ≤ DATA[END]:', '  3. Set POS := BEG + INT((ITEM − DATA[BEG]) · (END − BEG) / (DATA[END] − DATA[BEG])).', '  4. If DATA[POS] = ITEM, then: Set LOC := POS, and Exit.', '  5. If DATA[POS] < ITEM, then: Set BEG := POS + 1. Else: Set END := POS − 1.', '6. Set LOC := 0. [Not found.]', '7. Exit.'] },
    controls: [
      { id: 'arr', type: 'text', label: 'DATA (sorted)', value: '10, 12, 13, 16, 18, 19, 20, 21, 22, 23, 24, 33, 35, 42, 47', wide: true, run: true, rand: randSorted(14) },
      { id: 'item', type: 'num', label: 'ITEM', value: 18, run: true, w: 80 },
      { type: 'btn', label: 'Search', op: 'play', kind: 'primary' },
    ],
    auto: 'run',
    init(p) { const v = U.nums(p.arr, { max: 16 }).sort((a, b) => a - b); return { a: items(v), item: U.num(p.item, { name: 'ITEM' }), beg: null, end: null, pos: null }; },
    ops: {
      run(S, p, R) {
        const D = (i) => S.a[i - 1].v, ITEM = S.item;
        let probes = 0;
        R.vars(() => ({ ITEM, BEG: S.beg ?? '–', END: S.end ?? '–', POS: S.pos ?? '–', probes }));
        S.beg = 1; S.end = S.a.length;
        R.step('1.', `BEG := 1, END := ${S.end}.`);
        while (S.beg <= S.end && D(S.beg) <= ITEM && ITEM <= D(S.end)) {
          R.step('2.', `${D(S.beg)} ≤ ${ITEM} ≤ ${D(S.end)}, so ITEM could be in DATA[${S.beg}..${S.end}].`);
          const span = D(S.end) - D(S.beg);
          S.pos = span === 0 ? S.beg : S.beg + Math.floor(((ITEM - D(S.beg)) * (S.end - S.beg)) / span);
          probes++;
          R.step('3.', `POS = ${S.beg} + INT((${ITEM} − ${D(S.beg)})·(${S.end} − ${S.beg}) / (${D(S.end)} − ${D(S.beg)})) = **${S.pos}**.`, { probe: true });
          if (D(S.pos) === ITEM) { R.step('4.', `DATA[${S.pos}] = ${ITEM} — **found after ${probes} probe(s)**.`, { found: true }, { tone: 'ok' }); return; }
          if (D(S.pos) < ITEM) { S.beg = S.pos + 1; R.step('5.', `DATA[${S.pos}] = ${D(S.pos)} < ${ITEM} → BEG := ${S.beg}.`); }
          else { S.end = S.pos - 1; R.step('5.', `DATA[${S.pos}] = ${D(S.pos)} > ${ITEM} → END := ${S.end}.`); }
        }
        S.pos = null;
        R.step('6.', `${ITEM} is not present (${probes} probe(s)).`, {}, { tone: 'bad' });
      },
    },
    view(st, f) {
      const hl = {};
      st.a.forEach((_, i) => { if (st.beg != null && (i + 1 < st.beg || i + 1 > st.end)) hl[i] = 'dim'; });
      if (st.pos) hl[st.pos - 1] = f.hl.found ? 'ok' : 'cmp';
      const ptrs = [];
      if (st.beg != null && st.beg <= st.a.length) ptrs.push({ i: st.beg - 1, label: 'BEG', cls: 'act', side: 'bottom' });
      if (st.end != null && st.end >= 1) ptrs.push({ i: st.end - 1, label: 'END', cls: 'sel', side: 'bottom' });
      if (st.pos) ptrs.push({ i: st.pos - 1, label: 'POS', cls: 'cmp', side: 'top' });
      const sp = V.array('A', st.a, { x: 0, y: 50, hl, ptrs, name: 'DATA' });
      sp.push(V.text('it', 0, 190, `ITEM = ${st.item}`, 'note', 'start'));
      return { specs: sp, minH: 230 };
    },
  });
})(typeof window !== 'undefined' ? window : globalThis);
