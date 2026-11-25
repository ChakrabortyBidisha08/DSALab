/* DSA Lab · sims/recursion.js — Recursion and the Towers of Hanoi (Schaum Ch. 6) */
(function (g) {
  'use strict';
  const DSA = g.DSA, U = DSA.U, V = DSA.V;

  const FN = {
    fact: {
      name: 'Factorial', args: 1, def: [5], lim: [[0, 8]],
      label: (a) => `fact(${a[0]})`,
      algo: ['FACTORIAL(FACT, N)', '1. [Base case.] If N = 0, then: Set FACT := 1, and Return.', '2. [Recursive case.] Call FACTORIAL(FACT, N − 1).', '3. Set FACT := N · FACT.', '4. Return.'],
      body(a, rec, st) { const n = a[0]; if (n === 0) { st('1.', 'N = 0 — base case, FACT := 1.'); return 1; } st('2.', `N = ${n} ≠ 0 → call FACTORIAL(${n - 1}).`); const f = rec([n - 1]); const r = n * f; st('3.', `Back in fact(${n}): FACT := ${n} · ${f} = **${r}**.`); return r; },
    },
    fib: {
      name: 'Fibonacci', args: 1, def: [5], lim: [[0, 7]],
      label: (a) => `fib(${a[0]})`,
      algo: ['FIBONACCI(FIB, N)', '1. [Base cases.] If N = 0 or N = 1, then: Set FIB := N, and Return.', '2. Call FIBONACCI(FIBA, N − 2).', '3. Call FIBONACCI(FIBB, N − 1).', '4. Set FIB := FIBA + FIBB.', '5. Return.'],
      body(a, rec, st) { const n = a[0]; if (n < 2) { st('1.', `N = ${n} — base case, FIB := ${n}.`); return n; } st('2.', `fib(${n}) needs fib(${n - 2}) first.`); const x = rec([n - 2]); st('3.', `Now fib(${n}) needs fib(${n - 1}).`); const y = rec([n - 1]); st('4.', `FIB := ${x} + ${y} = **${x + y}**.`); return x + y; },
    },
    gcd: {
      name: 'GCD (Euclid)', args: 2, def: [84, 36], lim: [[0, 999], [0, 999]],
      label: (a) => `gcd(${a[0]},${a[1]})`,
      algo: ['GCD(A, B)', '1. [Base case.] If B = 0, then: Return A.', '2. Return GCD(B, A mod B).'],
      body(a, rec, st) { const [x, y] = a; if (y === 0) { st('1.', `B = 0 → the answer is A = **${x}**.`); return x; } st('2.', `${x} mod ${y} = ${x % y} → call GCD(${y}, ${x % y}).`); const r = rec([y, x % y]); st('2.', `gcd(${x},${y}) passes ${r} straight back (tail recursion).`); return r; },
    },
    pow: {
      name: 'Power xⁿ (fast)', args: 2, def: [2, 10], lim: [[-9, 9], [0, 40]],
      label: (a) => `pow(${a[0]},${a[1]})`,
      algo: ['POWER(X, N)', '1. [Base case.] If N = 0, then: Return 1.', '2. Set H := POWER(X, ⌊N/2⌋).', '3. If N is even, then: Return H · H.', '   Else: Return H · H · X.'],
      body(a, rec, st) { const [x, n] = a; if (n === 0) { st('1.', 'N = 0 → return 1.'); return 1; } st('2.', `Halve the exponent: call POWER(${x}, ${Math.floor(n / 2)}).`); const h = rec([x, Math.floor(n / 2)]); const r = n % 2 ? h * h * x : h * h; st(n % 2 ? 'Else' : '3.', n % 2 ? `N = ${n} is odd: ${h}·${h}·${x} = **${r}**.` : `N = ${n} is even: ${h}·${h} = **${r}**.`); return r; },
    },
    digits: {
      name: 'Sum of digits', args: 1, def: [4728], lim: [[0, 999999]],
      label: (a) => `sum(${a[0]})`,
      algo: ['SUMDIGITS(N)', '1. [Base case.] If N < 10, then: Return N.', '2. Return (N mod 10) + SUMDIGITS(⌊N / 10⌋).'],
      body(a, rec, st) { const n = a[0]; if (n < 10) { st('1.', `${n} < 10 → return ${n}.`); return n; } st('2.', `Last digit ${n % 10}; call SUMDIGITS(${Math.floor(n / 10)}).`); const r = rec([Math.floor(n / 10)]); st('2.', `${n % 10} + ${r} = **${n % 10 + r}**.`); return n % 10 + r; },
    },
    ack: {
      name: 'Ackermann A(m, n)', args: 2, def: [1, 2], lim: [[0, 2], [0, 3]],
      label: (a) => `A(${a[0]},${a[1]})`,
      algo: ['ACKERMANN(M, N)', '1. If M = 0, then: Return N + 1.', '2. If N = 0, then: Return A(M − 1, 1).', '3. Return A(M − 1, A(M, N − 1)).'],
      body(a, rec, st) { const [m, n] = a; if (m === 0) { st('1.', `M = 0 → return N + 1 = **${n + 1}**.`); return n + 1; } if (n === 0) { st('2.', `N = 0 → call A(${m - 1}, 1).`); return rec([m - 1, 1]); } st('3.', `First the inner call A(${m}, ${n - 1}).`); const inner = rec([m, n - 1]); st('3.', `Inner value is ${inner}; now call A(${m - 1}, ${inner}).`); return rec([m - 1, inner]); },
    },
  };

  DSA.sim({
    id: 'recursion', cat: 'recursion', title: 'Recursion and the Call Stack', short: 'Recursion & call stack',
    tags: ['factorial', 'fibonacci', 'gcd', 'power', 'ackermann', 'recursion tree', 'call stack', 'base case'],
    blurb: 'Pick a recursive function and watch every call: the recursion tree grows downward, the call stack grows and shrinks, and return values flow back up.',
    schaum: 'Schaum Ch. 6 · Recursion',
    cx: [['factorial(n)', 'O(n) calls'], ['naive fib(n)', 'O(φⁿ) calls'], ['gcd(a, b)', 'O(log min(a, b))'], ['fast power', 'O(log n)']],
    theory: `<p>A procedure is <b>recursive</b> if it calls itself. To terminate it needs a <b>base case</b> that is solved directly, and every recursive call must move closer to it (the textbook calls this a <i>well-defined</i> recursive definition).</p>
      <p>Each call gets its own <b>activation record</b> (parameters, local variables, return address) on the <b>call stack</b>. A call stays on the stack until it returns, so the stack depth equals the depth of the recursion tree's current path.</p>
      <ul><li>Factorial and sum-of-digits make one call per level: a chain.</li><li>Naive Fibonacci makes two calls per level and recomputes the same values again and again — count the repeated <code>fib(2)</code> nodes.</li><li>Ackermann's function grows astonishingly fast; even A(2, 3) needs 106 calls, so the inputs here are kept tiny.</li></ul>`,
    algo: Object.fromEntries(Object.entries(FN).map(([k, f]) => [k, f.algo])),
    controls: [
      { id: 'fn', type: 'select', label: 'Function', value: 'fact', run: true, opts: Object.entries(FN).map(([k, f]) => [k, f.name]) },
      { id: 'a', type: 'num', label: 'first argument', value: 5, run: true, w: 86 },
      { id: 'b', type: 'num', label: 'second argument', value: 2, run: true, w: 86 },
      { type: 'btn', label: 'Run', op: 'play', kind: 'primary' },
    ],
    auto: 'run',
    init(p) {
      const f = FN[p.fn];
      const args = [U.num(p.a, { lo: f.lim[0][0], hi: f.lim[0][1], name: 'the first argument' })];
      if (f.args > 1) args.push(U.num(p.b, { lo: f.lim[1][0], hi: f.lim[1][1], name: 'the second argument' }));
      if (p.fn === 'gcd' && !args[0] && !args[1]) U.fail('gcd(0, 0) is undefined.');
      if (p.fn === 'ack' && args[0] === 2 && args[1] > 1) U.fail('A(2, n) for n > 1 makes more calls than fit on screen. Try A(2, 1) or A(1, 3).');
      return { fn: p.fn, args, nodes: {}, root: null, stack: [], cnt: 0, result: null };
    },
    ops: {
      run(S, p, R) {
        const f = FN[S.fn];
        R.algo(S.fn).vars(() => {
          const top = S.stack[S.stack.length - 1];
          return { depth: S.stack.length, calls: S.cnt, current: top ? S.nodes[top].v : '–' };
        });
        R.table(() => ({ head: ['Call stack (top first)'], rows: S.stack.slice().reverse().map((id) => [S.nodes[id].v]), hi: 0 }));
        const call = (args, parent) => {
          if (S.cnt >= 60) U.fail('That makes more than 60 calls — too many to draw. Use a smaller argument.');
          const id = 'c' + (++S.cnt);
          S.nodes[id] = { id, v: f.label(args), kids: [], val: null };
          if (parent) S.nodes[parent].kids.push(id); else S.root = id;
          S.stack.push(id);
          R.step(null, `Call **${f.label(args)}** — a new activation record is pushed on the call stack.`, { cur: id });
          const st = (line, msg) => R.step(line, msg, { cur: id });
          const r = f.body(args, (a2) => call(a2, id), st);
          S.nodes[id].val = r;
          S.stack.pop();
          R.step(null, `${f.label(args)} returns **${r}** and its record is popped.`, { cur: id, ret: true });
          return r;
        };
        R.step(null, `Evaluate ${f.label(S.args)}.`);
        S.result = call(S.args, null);
        R.step(null, `Result: ${f.label(S.args)} = **${S.result}** after ${S.cnt} call(s).`, {}, { tone: 'ok' });
      },
    },
    view(st, f) {
      const sp = [];
      if (!st.root) return { specs: [V.text('hint', 0, 0, 'Press play to start the first call.', 'muted', 'start')], minH: 260 };
      const toTree = (id) => ({ id, v: st.nodes[id].v, kids: st.nodes[id].kids.map(toTree) });
      const root = toTree(st.root);
      const W = (nd) => Math.max(64, nd.v.length * 9 + 14);
      const L = V.tidy(root, { gap: 14, dy: 74, width: W });
      const onStack = new Set(st.stack);
      for (const [, p] of L.pos) for (const c of p.nd.kids) { const q = L.pos.get(c.id); sp.push(V.line('e' + c.id, p.x, p.y + 32, q.x, q.y, 'edge ' + (onStack.has(c.id) ? 'act' : ''), true, { t2: 2 })); }
      for (const [id, p] of L.pos) {
        const nd = st.nodes[id], w = W(p.nd);
        const cls = f.hl.cur === id ? (f.hl.ret ? 'ok' : 'act') : onStack.has(id) ? 'sel' : nd.val != null ? '' : 'dim';
        sp.push(V.box('n' + id, p.x - w / 2, p.y, w, 32, nd.v, 'cell ' + cls, { fs: 13, sub: nd.val != null ? '= ' + nd.val : undefined }));
      }
      // call stack drawn to the right, top of stack at the top
      const sx = L.width + 70;
      sp.push(V.text('cst', sx, -18, 'Call stack', 'title', 'start'));
      st.stack.slice().reverse().forEach((id, k) => sp.push(V.box('f' + id, sx, k * 38, 120, 32, st.nodes[id].v, 'cell ' + (k === 0 ? 'act' : 'sel'), { fs: 13 })));
      if (!st.stack.length) sp.push(V.text('cse', sx, 18, st.result != null ? '(empty — all calls returned)' : '(empty)', 'muted', 'start'));
      return { specs: sp, minH: 300, minW: 600 };
    },
  });

  /* ---------------- Towers of Hanoi ---------------- */
  DSA.sim({
    id: 'hanoi', cat: 'recursion', title: 'Towers of Hanoi', short: 'Towers of Hanoi',
    tags: ['hanoi', 'tower', 'divide and conquer', 'recursion'],
    blurb: 'Move N disks from peg A to peg C, one at a time, never placing a larger disk on a smaller one. TOWER(N) = TOWER(N−1) to the spare peg, move the big disk, TOWER(N−1) on top of it.',
    schaum: 'Schaum Ch. 6 · Towers of Hanoi',
    cx: [['Moves for N disks', '2ᴺ − 1'], ['Recursion depth', 'N']],
    theory: `<p>The puzzle has a beautiful recursive solution. To move N disks from <code>BEG</code> to <code>END</code> using <code>AUX</code>:</p>
      <ol><li>move the top N − 1 disks from BEG to AUX (using END as the spare);</li><li>move the largest disk from BEG to END;</li><li>move the N − 1 disks from AUX to END (using BEG as the spare).</li></ol>
      <p>If M(N) is the number of moves, M(1) = 1 and M(N) = 2·M(N − 1) + 1, so <b>M(N) = 2ᴺ − 1</b>: 7 moves for 3 disks, 63 for 6, and over 500 billion years for the legendary 64 disks at one move per second.</p>`,
    algo: { run: ['TOWER(N, BEG, AUX, END)', '1. If N = 1, then: Write BEG → END, and Return.', '2. [Move N − 1 disks out of the way.] Call TOWER(N − 1, BEG, END, AUX).', '3. Write BEG → END. [Move the largest disk.]', '4. [Put the N − 1 disks back on top.] Call TOWER(N − 1, AUX, BEG, END).', '5. Return.'] },
    controls: [
      { id: 'n', type: 'num', label: 'Disks N', value: 3, min: 1, max: 6, run: true, w: 70 },
      { type: 'btn', label: 'Solve', op: 'play', kind: 'primary' },
    ],
    auto: 'run',
    init(p) {
      const n = U.num(p.n, { lo: 1, hi: 6, name: 'N' });
      return { n, pegs: { A: U.range(n).map((i) => n - i), B: [], C: [] }, calls: [], moves: 0, last: null };
    },
    ops: {
      run(S, p, R) {
        const log = [];
        R.vars(() => ({ moves: S.moves, 'needed': Math.pow(2, S.n) - 1, depth: S.calls.length }))
          .table(() => ({ head: ['#', 'Move'], rows: log.slice() }));
        const tower = (n, beg, aux, end) => {
          S.calls.push(`TOWER(${n}, ${beg}, ${aux}, ${end})`);
          if (n === 1) {
            R.step('1.', `TOWER(1, ${beg}, ${aux}, ${end}): just move the disk.`);
            move(beg, end, '1.');
          } else {
            R.step('2.', `TOWER(${n}): first park ${n - 1} disk(s) on ${aux}.`);
            tower(n - 1, beg, end, aux);
            R.step('3.', `Back in TOWER(${n}, ${beg}, ${aux}, ${end}): move the largest of these disks.`);
            move(beg, end, '3.');
            R.step('4.', `Now bring the ${n - 1} parked disk(s) from ${aux} onto ${end}.`);
            tower(n - 1, aux, beg, end);
          }
          S.calls.pop();
          R.step('5.', `TOWER(${n}, ${beg}, ${aux}, ${end}) is finished.`);
        };
        const move = (a, b, line) => {
          const d = S.pegs[a].pop(); S.pegs[b].push(d); S.moves++; S.last = d;
          log.push([S.moves, `disk ${d}: ${a} → ${b}`]);
          R.step(line, `Move ${S.moves}: disk ${d} from ${a} to ${b}.`, { mv: d });
        };
        R.step(null, `Move ${S.n} disk(s) from A to C. That will take 2^${S.n} − 1 = ${Math.pow(2, S.n) - 1} moves.`);
        tower(S.n, 'A', 'B', 'C');
        S.last = null;
        R.step(null, `Solved in ${S.moves} moves.`, {}, { tone: 'ok' });
      },
    },
    view(st, f) {
      const sp = [], pw = 190, base = 220, dh = 24;
      ['A', 'B', 'C'].forEach((name, k) => {
        const cx = k * pw + pw / 2;
        sp.push(V.box('peg' + name, cx - 5, 40, 10, base - 40, '', 'peg', { rx: 4 }));
        sp.push(V.box('base' + name, cx - pw / 2 + 12, base, pw - 24, 8, '', 'peg', { rx: 3 }));
        sp.push(V.text('pl' + name, cx, base + 28, name + (name === 'A' ? ' (BEG)' : name === 'B' ? ' (AUX)' : ' (END)'), 'name'));
        st.pegs[name].forEach((d, j) => {
          const w = 30 + d * 22;
          sp.push(V.box('d' + d, cx - w / 2, base - (j + 1) * dh, w, dh - 3, d, 'disk d' + d + (f.hl.mv === d ? ' new' : ''), { rx: 8, fs: 12 }));
        });
      });
      const sx = 3 * pw + 30;
      sp.push(V.text('cs', sx, 28, 'Active calls', 'title', 'start'));
      st.calls.slice().reverse().forEach((c, k) => sp.push(V.box('call' + (st.calls.length - 1 - k), sx, 40 + k * 34, 168, 28, c, 'cell ' + (k === 0 ? 'act' : 'sel'), { fs: 12 })));
      return { specs: sp, minH: 280, minW: 640 };
    },
  });
})(typeof window !== 'undefined' ? window : globalThis);
