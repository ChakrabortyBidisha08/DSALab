/* DSA Lab · sims/analysis.js — Complexity of algorithms (Schaum Ch. 1–2) */
(function (g) {
  'use strict';
  const DSA = g.DSA, U = DSA.U, V = DSA.V;
  const CLASSES = [
    ['1', 'O(1)', () => 1, 'ok'],
    ['log', 'O(log n)', (n) => Math.max(1, Math.log2(n)), 'act'],
    ['n', 'O(n)', (n) => n, 'sel'],
    ['nlogn', 'O(n log n)', (n) => n * Math.max(1, Math.log2(n)), 'path'],
    ['n2', 'O(n²)', (n) => n * n, 'cmp'],
    ['n3', 'O(n³)', (n) => n * n * n, 'cmp'],
    ['2n', 'O(2ⁿ)', (n) => Math.pow(2, n), 'bad'],
  ];
  const human = (x) => (x >= 1e12 ? (x / 1e12).toFixed(1) + ' T' : x >= 1e9 ? (x / 1e9).toFixed(1) + ' G' : x >= 1e6 ? (x / 1e6).toFixed(1) + ' M' : x >= 1e4 ? (x / 1e3).toFixed(1) + ' k' : String(Math.round(x)));
  const time = (ops) => { const s = ops / 1e8; return s < 1e-6 ? '< 1 µs' : s < 1e-3 ? (s * 1e6).toFixed(0) + ' µs' : s < 1 ? (s * 1e3).toFixed(0) + ' ms' : s < 60 ? s.toFixed(1) + ' s' : s < 3600 ? (s / 60).toFixed(1) + ' min' : s < 86400 * 365 ? (s / 3600).toFixed(1) + ' h' : (s / 86400 / 365).toExponential(1) + ' years'; };

  DSA.sim({
    id: 'complexity', cat: 'analysis', title: 'Growth of Functions (Big-O Race)', short: 'Big-O race',
    tags: ['complexity', 'big o', 'time complexity', 'growth rate', 'asymptotic', 'logarithm', 'exponential'],
    blurb: 'Grow n step by step and watch how many operations each complexity class needs. On a log scale the gaps are easier to see; on a linear scale exponential time simply explodes.',
    schaum: 'Schaum Ch. 2 · Complexity of algorithms',
    cx: [['Rule of thumb', '~10⁸ simple operations per second']],
    theory: `<p>The <b>complexity</b> of an algorithm is the function f(n) giving its running time (or memory) in terms of the input size n. <b>Big-O</b> notation keeps only the fastest-growing term and drops constant factors: <code>3n² + 5n + 7</code> is <code>O(n²)</code>.</p>
      <ul><li><code>O(log n)</code> — binary search, balanced-tree operations.</li><li><code>O(n)</code> — linear search, traversal.</li><li><code>O(n log n)</code> — merge sort, heapsort, average quicksort.</li><li><code>O(n²)</code> — bubble, selection and insertion sort.</li><li><code>O(2ⁿ)</code> — trying every subset; only feasible for tiny n.</li></ul>
      <p>The time column assumes about 10⁸ basic operations per second. At n = 60, an O(n log n) algorithm needs microseconds while an O(2ⁿ) one would need tens of years.</p>`,
    algo: { run: ['Typical sources of each growth rate', '1. O(1): Set X := A[K]. [One step, whatever n is.]', '2. O(log n): Repeat while N > 1: Set N := ⌊N/2⌋.', '3. O(n): Repeat for K = 1 to N: [constant work].', '4. O(n log n): MERGESORT, HEAPSORT.', '5. O(n²): Repeat for I = 1 to N: Repeat for J = 1 to N: …', '6. O(n³): three nested loops (matrix multiplication).', '7. O(2ⁿ): examine every subset of N items.'] },
    controls: [
      { id: 'n', type: 'num', label: 'Grow n up to', value: 40, min: 2, max: 64, run: true, w: 80 },
      { id: 'scale', type: 'select', label: 'Scale', value: 'log', run: true, opts: [['log', 'Logarithmic'], ['lin', 'Linear']] },
      { type: 'btn', label: 'Race', op: 'play', kind: 'primary' },
    ],
    auto: 'run',
    init(p) { return { N: U.num(p.n, { lo: 2, hi: 64, name: 'n' }), n: 1, scale: p.scale }; },
    ops: {
      run(S, p, R) {
        R.table(() => ({ head: ['Class', 'Operations', 'Time @10⁸/s'], rows: CLASSES.map(([, name, f]) => [name, human(f(S.n)), time(f(S.n))]), hi: -1 }));
        R.vars(() => ({ n: S.n }));
        const steps = U.range(Math.min(S.N, 24)).map((i) => Math.max(1, Math.round(((i + 1) * S.N) / Math.min(S.N, 24))));
        for (const n of [...new Set(steps)]) {
          S.n = n;
          const lead = CLASSES.filter(([, , f]) => f(n) >= 1e8).map((c) => c[1]);
          R.step(null, `n = ${n}.` + (lead.length ? ` ${lead.join(', ')} already need more than 10⁸ operations (over a second).` : ''));
        }
        R.step(null, `At n = ${S.N}: O(log n) ≈ ${human(Math.log2(S.N))}, O(n²) = ${human(S.N * S.N)}, O(2ⁿ) ≈ ${human(Math.pow(2, S.N))} operations.`, {}, { tone: 'ok' });
      },
    },
    view(st) {
      const sp = [], W = 520, rowH = 40;
      const vals = CLASSES.map(([, , f]) => f(st.n));
      const maxLin = Math.max(...CLASSES.map(([, , f]) => f(st.N)).filter((x) => x < 1e15), 1);
      const maxLog = Math.log10(Math.max(10, ...CLASSES.map(([, , f]) => f(st.N))));
      CLASSES.forEach(([k, name, f, tone], i) => {
        const v = vals[i];
        const frac = st.scale === 'log' ? Math.log10(Math.max(1, v)) / maxLog : Math.min(1, v / maxLin);
        const y = i * rowH;
        sp.push(V.text('l' + k, -12, y + 18, name, 'name', 'end'));
        sp.push(V.box('bg' + k, 0, y, W, 26, '', 'slot', { rx: 5 }));
        sp.push(V.box('b' + k, 0, y, Math.max(4, frac * W), 26, '', 'bar ' + tone, { rx: 5 }));
        sp.push(V.text('v' + k, W + 12, y + 18, human(v), 'note', 'start'));
      });
      sp.push(V.text('nlab', 0, CLASSES.length * rowH + 22, `n = ${st.n}   (${st.scale === 'log' ? 'log scale' : 'linear scale'})`, 'big', 'start'));
      return { specs: sp, minH: 330, minW: 640 };
    },
  });
})(typeof window !== 'undefined' ? window : globalThis);
