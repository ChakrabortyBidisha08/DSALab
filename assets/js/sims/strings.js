/* DSA Lab · sims/strings.js — String processing and pattern matching (Schaum Ch. 3) */
(function (g) {
  'use strict';
  const DSA = g.DSA, U = DSA.U, V = DSA.V;
  const CW = 30, CH = 34;
  const chars = (s, pre) => s.split('').map((c, i) => ({ id: pre + i, v: c === ' ' ? '␣' : c }));
  const checkStr = (s, name, max) => { s = String(s == null ? '' : s); if (s.length > max) U.fail(`${name} may have at most ${max} characters here.`); return s; };
  const row = (sp, pre, arr, x, y, hl, idxBase) => {
    arr.forEach((c, i) => {
      sp.push(V.box(pre + c.id, x + i * (CW + 2), y, CW, CH, c.v, 'chip ' + ((hl && hl[i]) || ''), { rx: 4, fs: 14 }));
      if (idxBase != null) sp.push(V.text(pre + 'i' + i, x + i * (CW + 2) + CW / 2, y - 8, i + idxBase, 'idx'));
    });
  };

  /* ---------------- String operations ---------------- */
  DSA.sim({
    id: 'string-ops', cat: 'strings', title: 'String Operations', short: 'String operations',
    tags: ['substring', 'index', 'length', 'concatenation', 'insert', 'delete', 'replace'],
    blurb: 'LENGTH, SUBSTRING, INDEX, concatenation (//), INSERT, DELETE and REPLACE — the textbook string toolkit, with each piece coloured as the result is assembled.',
    schaum: 'Schaum Ch. 3 · String operations',
    cx: [['LENGTH', 'O(1) with a stored length'], ['SUBSTRING(S, K, L)', 'O(L)'], ['INDEX (naive)', 'O((S − R + 1) · R)'], ['INSERT / DELETE', 'O(n)']],
    theory: `<p>Positions are numbered from 1. The basic operations, defined in terms of each other:</p>
      <ul><li><code>SUBSTRING(S, K, L)</code> — the L characters of S starting at position K.</li>
      <li><code>INDEX(T, P)</code> — position of the first occurrence of P in T, or 0.</li>
      <li><code>S1 // S2</code> — concatenation.</li>
      <li><code>INSERT(T, K, S) = SUBSTRING(T, 1, K − 1) // S // SUBSTRING(T, K, LENGTH(T) − K + 1)</code></li>
      <li><code>DELETE(T, K, L) = SUBSTRING(T, 1, K − 1) // SUBSTRING(T, K + L, LENGTH(T) − K − L + 1)</code></li>
      <li><code>REPLACE(T, P, Q)</code>: find <code>K = INDEX(T, P)</code>, then <code>INSERT(DELETE(T, K, LENGTH(P)), K, Q)</code>.</li></ul>`,
    algo: {
      sub: ['SUBSTRING(T, K, L)', '1. Repeat for J = 0 to L − 1: Append T[K + J] to the result.', '2. Return the result.'],
      index: ['INDEX(T, P)', '1. Repeat for K = 1 to LENGTH(T) − LENGTH(P) + 1:', '     If SUBSTRING(T, K, LENGTH(P)) = P, then: Return K.', '2. Return 0. [P does not occur in T.]'],
      ins: ['INSERT(T, K, S)', '1. Set A := SUBSTRING(T, 1, K − 1).', '2. Set B := SUBSTRING(T, K, LENGTH(T) − K + 1).', '3. Return A // S // B.'],
      del: ['DELETE(T, K, L)', '1. Set A := SUBSTRING(T, 1, K − 1).', '2. Set B := SUBSTRING(T, K + L, LENGTH(T) − K − L + 1).', '3. Return A // B.'],
      rep: ['REPLACE(T, P, Q)', '1. Set K := INDEX(T, P).', '2. If K = 0, then: Return T unchanged.', '3. Set T := DELETE(T, K, LENGTH(P)).', '4. Return INSERT(T, K, Q).'],
      cat: ['CONCAT(S1, S2)', '1. Copy every character of S1, then every character of S2.', '2. LENGTH(S1 // S2) = LENGTH(S1) + LENGTH(S2).'],
    },
    controls: [
      { id: 't', type: 'text', label: 'T', value: 'TO BE OR NOT TO BE', wide: true, reset: true },
      { type: 'br' },
      { id: 'k', type: 'num', label: 'K', value: 4, w: 64 },
      { id: 'l', type: 'num', label: 'L', value: 5, w: 64 },
      { id: 's', type: 'text', label: 'S / P / Q', value: 'NOT', w: 110 },
      { id: 'q', type: 'text', label: 'replace with', value: 'IS', w: 90 },
      { type: 'br' },
      { type: 'btn', label: 'SUBSTRING(T, K, L)', op: 'sub', kind: 'primary' },
      { type: 'btn', label: 'INDEX(T, P)', op: 'index' },
      { type: 'btn', label: 'T // S', op: 'cat' },
      { type: 'btn', label: 'INSERT(T, K, S)', op: 'ins' },
      { type: 'btn', label: 'DELETE(T, K, L)', op: 'del' },
      { type: 'btn', label: 'REPLACE(T, P, Q)', op: 'rep' },
    ],
    keepInput: true,
    init(p) { const t = checkStr(p.t, 'T', 24); if (!t) U.fail('Type a string T.'); return { T: chars(t, 't'), S: [], out: null, hl: {}, sh: {}, label: '' }; },
    vars0: (S) => ({ 'LENGTH(T)': S.T.length }),
    ops: {
      sub(S, p, R) {
        const n = S.T.length, K = U.num(p.k, { lo: 1, hi: n, name: 'K' }), L = U.num(p.l, { lo: 0, hi: n - K + 1, name: `L (at most ${n - K + 1})` });
        R.algo('sub').vars(() => ({ K, L, 'LENGTH(T)': n }));
        S.out = []; S.label = `SUBSTRING(T, ${K}, ${L})`;
        for (let j = 0; j < L; j++) { S.out.push({ id: 'o' + j, v: S.T[K - 1 + j].v }); S.hl = { [K - 1 + j]: 'act' }; R.step('1.', `Append T[${K + j}] = “${S.T[K - 1 + j].v}”.`); }
        S.hl = {}; for (let j = 0; j < L; j++) S.hl[K - 1 + j] = 'ok';
        R.step('2.', `${S.label} = “${S.out.map((c) => c.v).join('')}”.`, {}, { tone: 'ok' });
      },
      index(S, p, R) {
        const P = checkStr(p.s, 'P', 12); if (!P) U.fail('Type a pattern P in the S / P / Q box.');
        const n = S.T.length, r = P.length;
        R.algo('index').vars(() => ({ K: S.k || '–', 'LENGTH(P)': r }));
        S.S = chars(P, 'p'); S.label = `INDEX(T, “${P}”)`;
        for (let K = 1; K <= n - r + 1; K++) {
          S.k = K; S.sh = K - 1;
          const ok = S.T.slice(K - 1, K - 1 + r).map((c) => c.v).join('') === S.S.map((c) => c.v).join('');
          S.hl = {}; for (let j = 0; j < r; j++) S.hl[K - 1 + j] = ok ? 'ok' : 'cmp';
          if (ok) { S.out = [{ id: 'o0', v: K }]; R.step('     If', `SUBSTRING(T, ${K}, ${r}) = “${P}” — found! INDEX = **${K}**.`, {}, { tone: 'ok' }); return; }
          R.step('     If', `SUBSTRING(T, ${K}, ${r}) ≠ “${P}”.`);
        }
        S.out = [{ id: 'o0', v: 0 }]; S.hl = {}; S.sh = null;
        R.step('2.', `“${P}” does not occur in T, so INDEX = 0.`, {}, { tone: 'bad' });
      },
      cat(S, p, R) {
        const s = checkStr(p.s, 'S', 12);
        R.algo('cat');
        S.S = chars(s, 's'); S.label = 'T // S';
        R.step('1.', `Concatenate T (length ${S.T.length}) and S = “${s}” (length ${s.length}).`);
        S.out = S.T.map((c) => ({ id: 'T' + c.id, v: c.v, from: 't' })).concat(S.S.map((c) => ({ id: 'S' + c.id, v: c.v, from: 's' })));
        R.step('2.', `T // S has length ${S.out.length}.`, {}, { tone: 'ok' });
      },
      ins(S, p, R) {
        const n = S.T.length, K = U.num(p.k, { lo: 1, hi: n + 1, name: 'K' }), s = checkStr(p.s, 'S', 12);
        R.algo('ins').vars(() => ({ K, 'LENGTH(T)': n, 'LENGTH(S)': s.length }));
        S.S = chars(s, 's'); S.label = `INSERT(T, ${K}, “${s}”)`;
        S.hl = {}; for (let i = 0; i < K - 1; i++) S.hl[i] = 'act';
        R.step('1.', `A = SUBSTRING(T, 1, ${K - 1}) — the part before position ${K}.`);
        for (let i = K - 1; i < n; i++) S.hl[i] = 'sel';
        R.step('2.', `B = SUBSTRING(T, ${K}, ${n - K + 1}) — the rest.`);
        S.out = S.T.slice(0, K - 1).map((c) => ({ id: 'T' + c.id, v: c.v })).concat(S.S.map((c) => ({ id: 'S' + c.id, v: c.v })), S.T.slice(K - 1).map((c) => ({ id: 'T' + c.id, v: c.v })));
        R.step('3.', `A // S // B = “${S.out.map((c) => c.v).join('').replace(/␣/g, ' ')}”.`, {}, { tone: 'ok' });
      },
      del(S, p, R) {
        const n = S.T.length, K = U.num(p.k, { lo: 1, hi: n, name: 'K' }), L = U.num(p.l, { lo: 0, hi: n - K + 1, name: `L (at most ${n - K + 1})` });
        R.algo('del').vars(() => ({ K, L, 'LENGTH(T)': n }));
        S.label = `DELETE(T, ${K}, ${L})`;
        S.hl = {}; for (let i = 0; i < K - 1; i++) S.hl[i] = 'act'; for (let i = K - 1; i < K - 1 + L; i++) S.hl[i] = 'bad';
        R.step('1.', `A = SUBSTRING(T, 1, ${K - 1}); the red characters will be dropped.`);
        for (let i = K - 1 + L; i < n; i++) S.hl[i] = 'sel';
        R.step('2.', `B = SUBSTRING(T, ${K + L}, ${n - K - L + 1}).`);
        S.out = S.T.slice(0, K - 1).concat(S.T.slice(K - 1 + L)).map((c) => ({ id: 'T' + c.id, v: c.v }));
        R.step('3.', `A // B = “${S.out.map((c) => c.v).join('').replace(/␣/g, ' ')}”.`, {}, { tone: 'ok' });
      },
      rep(S, p, R) {
        const P = checkStr(p.s, 'P', 12), Q = checkStr(p.q, 'Q', 12);
        if (!P) U.fail('Type the pattern P in the S / P / Q box.');
        const t = S.T.map((c) => c.v).join('').replace(/␣/g, ' ');
        const K = t.indexOf(P) + 1;
        R.algo('rep').vars(() => ({ K, 'LENGTH(P)': P.length }));
        S.label = `REPLACE(T, “${P}”, “${Q}”)`;
        if (!K) { R.step('2.', `INDEX(T, “${P}”) = 0, so T is returned unchanged.`, {}, { tone: 'bad' }); return; }
        S.hl = {}; for (let i = K - 1; i < K - 1 + P.length; i++) S.hl[i] = 'bad';
        R.step('1.', `K = INDEX(T, “${P}”) = ${K}.`);
        S.S = chars(Q, 'q');
        R.step('3.', `DELETE(T, ${K}, ${P.length}) removes “${P}”.`);
        S.out = S.T.slice(0, K - 1).map((c) => ({ id: 'T' + c.id, v: c.v })).concat(S.S.map((c) => ({ id: 'S' + c.id, v: c.v })), S.T.slice(K - 1 + P.length).map((c) => ({ id: 'T' + c.id, v: c.v })));
        R.step('4.', `INSERT(…, ${K}, “${Q}”) = “${S.out.map((c) => c.v).join('').replace(/␣/g, ' ')}”.`, {}, { tone: 'ok' });
      },
    },
    view(st) {
      const sp = [];
      sp.push(V.text('lt', -12, CH / 2 + 4, 'T', 'name', 'end'));
      row(sp, '', st.T, 0, 0, st.hl, 1);
      if (st.sh != null && st.S.length && st.label.startsWith('INDEX')) row(sp, 'P', st.S, st.sh * (CW + 2), CH + 14, Object.fromEntries(st.S.map((_, i) => [i, 'sel'])));
      else if (st.S.length) { sp.push(V.text('ls', -12, 90 + CH / 2 + 4, 'S', 'name', 'end')); row(sp, '', st.S, 0, 90, null); }
      if (st.out) {
        sp.push(V.text('lr', 0, 172, st.label + ' =', 'note', 'start'));
        // characters copied from T or S keep their key, so they glide into the result row
        st.out.forEach((c, i) => {
          const key = c.id[0] === 'T' || c.id[0] === 'S' ? c.id.slice(1) : 'o' + c.id;
          sp.push(V.box((c.id[0] === 'T' || c.id[0] === 'S' ? 'R' : '') + key, i * (CW + 2), 186, CW, CH, c.v, 'chip ok', { rx: 4, fs: 14 }));
        });
      }
      return { specs: sp, minH: 260 };
    },
  });

  /* ---------------- Naive pattern matching ---------------- */
  function matchView(st, f) {
    const sp = [];
    sp.push(V.text('lt', -12, CH / 2 + 4, 'T', 'name', 'end'));
    const hl = {};
    st.found.forEach((k) => { for (let j = 0; j < st.P.length; j++) hl[k + j] = 'ok'; });
    if (f.hl.tc != null) hl[f.hl.tc] = f.hl.ok ? 'ok' : 'bad';
    row(sp, '', st.T, 0, 0, hl, 1);
    if (st.k != null) {
      const ph = {};
      for (let j = 0; j < (f.hl.upto || 0); j++) ph[j] = 'ok';
      if (f.hl.pc != null) ph[f.hl.pc] = f.hl.ok ? 'ok' : 'bad';
      sp.push(V.text('lp', st.k * (CW + 2) - 12, CH + 18 + CH / 2 + 4, 'P', 'name', 'end'));
      st.P.forEach((c, j) => sp.push(V.box('p' + j, (st.k + j) * (CW + 2), CH + 18, CW, CH, c.v, 'chip ' + (ph[j] || 'sel'), { rx: 4, fs: 14 })));
    }
    if (st.F) {
      sp.push(V.text('lf', -12, 150 + CH / 2 + 4, 'F', 'name', 'end'));
      st.P.forEach((c, j) => {
        sp.push(V.box('fp' + j, j * (CW + 2), 120, CW, CH - 6, c.v, 'chip', { rx: 4, fs: 13 }));
        sp.push(V.box('fv' + j, j * (CW + 2), 150, CW, CH - 6, st.F[j] == null ? '' : st.F[j], 'chip ' + (f.hl.fq === j ? 'act' : f.hl.fk === j ? 'cmp' : ''), { rx: 4, fs: 13 }));
        sp.push(V.text('fi' + j, j * (CW + 2) + CW / 2, 112, j + 1, 'idx'));
      });
    }
    return { specs: sp, minH: st.F ? 220 : 160 };
  }
  DSA.sim({
    id: 'pattern-naive', cat: 'strings', title: 'Pattern Matching — Brute Force', short: 'Naive pattern matching',
    tags: ['pattern matching', 'string search', 'brute force', 'first pattern matching algorithm'],
    blurb: 'Slide the pattern P along the text T one position at a time and compare character by character, stopping at the first mismatch.',
    schaum: 'Schaum Ch. 3 · First pattern matching algorithm',
    cx: [['Worst case', 'O((S − R + 1) · R)'], ['Typical text', 'close to O(S)']],
    theory: `<p>With <code>S = LENGTH(T)</code> and <code>R = LENGTH(P)</code>, P can start at positions <code>K = 1 … S − R + 1</code>. For each K we compare <code>P[1..R]</code> with <code>T[K..K+R−1]</code> until a character differs.</p>
      <p>The worst case — e.g. <code>T = aaaa…ab</code>, <code>P = aaab</code> — re-checks almost every character R times, giving <b>O(R · S)</b> comparisons. The <a href="#/sim/pattern-kmp">table-driven method</a> never moves backwards in T.</p>`,
    algo: { run: ['PATMAT1(T, P, INDEX)', '1. Set K := 1 and MAX := S − R + 1.', '2. Repeat Steps 3 to 5 while K ≤ MAX:', '  3. Repeat for L = 1 to R: [Compare P with T[K…].]', '       If P[L] ≠ T[K + L − 1], then: Go to Step 5.', '  4. [Success.] Set INDEX := K, and Exit.', '  5. Set K := K + 1.', '6. [Failure.] Set INDEX := 0.', '7. Exit.'] },
    controls: [
      { id: 't', type: 'text', label: 'Text T', value: 'ABABDABACDABABCABAB', wide: true, run: true, presets: [['ABABDABACDABABCABAB', 'ABABD… (KMP classic)'], ['AAAAAAAAAB', 'Worst case aaa…ab'], ['TO BE OR NOT TO BE', 'TO BE OR NOT TO BE']] },
      { id: 'p', type: 'text', label: 'Pattern P', value: 'ABABCABAB', w: 160, run: true },
      { type: 'btn', label: 'Search', op: 'play', kind: 'primary' },
    ],
    auto: 'run',
    init(p) {
      const t = checkStr(p.t, 'T', 28), q = checkStr(p.p, 'P', 12);
      if (!t || !q) U.fail('Type both a text and a pattern.');
      if (q.length > t.length) U.fail('The pattern is longer than the text.');
      return { T: chars(t, 't'), P: chars(q, 'p'), k: null, found: [] };
    },
    ops: {
      run(S, p, R) {
        const s = S.T.length, r = S.P.length, MAX = s - r + 1;
        let cmp = 0, K = 1, L = null;
        R.vars(() => ({ K, L: L == null ? '–' : L, MAX, comparisons: cmp }));
        S.k = 0;
        R.step('1.', `S = ${s}, R = ${r}, so P can start at K = 1 … ${MAX}.`);
        for (K = 1; K <= MAX; K++) {
          S.k = K - 1;
          R.step('2.', `Try P at position K = ${K}.`);
          let ok = true;
          for (L = 1; L <= r; L++) {
            cmp++;
            const eq = S.P[L - 1].v === S.T[K + L - 2].v;
            R.step('3.', `P[${L}] = “${S.P[L - 1].v}” ${eq ? '=' : '≠'} T[${K + L - 1}] = “${S.T[K + L - 2].v}”.`, { pc: L - 1, tc: K + L - 2, ok: eq, upto: L - 1 });
            if (!eq) { ok = false; break; }
          }
          if (ok) { S.found = [K - 1]; L = null; R.step('4.', `All ${r} characters match — **INDEX = ${K}** after ${cmp} comparisons.`, { upto: r }, { tone: 'ok' }); return; }
          R.step('5.', 'Mismatch → slide P one place right.');
        }
        S.k = null; L = null;
        R.step('6.', `P does not occur in T — INDEX = 0 after ${cmp} comparisons.`, {}, { tone: 'bad' });
      },
    },
    view: matchView,
  });

  /* ---------------- KMP ---------------- */
  DSA.sim({
    id: 'pattern-kmp', cat: 'strings', title: 'Fast Pattern Matching (KMP failure table)', short: 'KMP pattern matching',
    tags: ['kmp', 'knuth morris pratt', 'failure function', 'prefix function', 'second pattern matching algorithm', 'pattern matching table'],
    blurb: 'Pre-compute a table F from the pattern so that, after a mismatch, the search knows how much of P already matches and never re-reads characters of T.',
    schaum: 'Schaum Ch. 3 · Second (table-driven) pattern matching algorithm',
    cx: [['Build table F', 'O(R)'], ['Search', 'O(S)'], ['Total', 'O(S + R)']],
    theory: `<p>The textbook's second pattern-matching algorithm drives the search with a pre-computed table built only from P. The modern form of this idea is the <b>Knuth–Morris–Pratt</b> algorithm shown here.</p>
      <p><code>F[Q]</code> is the length of the longest proper prefix of <code>P[1..Q]</code> that is also a suffix of it. If Q characters have matched and the next one fails, the pattern can be shifted so that the first <code>F[Q]</code> characters still line up — no character of T is ever compared twice after a mismatch.</p>`,
    algo: {
      fail: ['FAILURE(P, F) — build the table', '1. Set F[1] := 0 and K := 0.', '2. Repeat Steps 3 to 5 for Q = 2 to R:', '  3. Repeat while K > 0 and P[K + 1] ≠ P[Q]: Set K := F[K].', '  4. If P[K + 1] = P[Q], then: Set K := K + 1.', '  5. Set F[Q] := K.', '6. Return.'],
      run: ['KMP(T, P, F)', '1. Set Q := 0. [Number of characters matched.]', '2. Repeat Steps 3 to 5 for I = 1 to S:', '  3. Repeat while Q > 0 and P[Q + 1] ≠ T[I]: Set Q := F[Q].', '  4. If P[Q + 1] = T[I], then: Set Q := Q + 1.', '  5. If Q = R, then: Report a match at I − R + 1 and Set Q := F[Q].', '6. Exit.'],
    },
    controls: [
      { id: 't', type: 'text', label: 'Text T', value: 'ABABDABACDABABCABAB', wide: true, run: true, presets: [['ABABDABACDABABCABAB', 'ABABD…'], ['AABAACAADAABAABA', 'AABAACAAD… (2 matches)'], ['AAAAAAAAAB', 'aaa…ab']] },
      { id: 'p', type: 'text', label: 'Pattern P', value: 'ABABCABAB', w: 160, run: true },
      { type: 'btn', label: 'Build table & search', op: 'play', kind: 'primary' },
    ],
    auto: 'run',
    init(p) {
      const t = checkStr(p.t, 'T', 28), q = checkStr(p.p, 'P', 12);
      if (!t || !q) U.fail('Type both a text and a pattern.');
      if (q.length > t.length) U.fail('The pattern is longer than the text.');
      return { T: chars(t, 't'), P: chars(q, 'p'), F: q.split('').map(() => null), k: null, found: [] };
    },
    ops: {
      run(S, p, R) {
        const P = S.P.map((c) => c.v), T = S.T.map((c) => c.v), r = P.length, s = T.length;
        let K = 0, Q = 0, I = 0, cmp = 0;
        R.algo('fail').vars(() => ({ Q, K, comparisons: cmp }));
        S.F[0] = 0; R.step('1.', 'F[1] := 0 — a single character has no proper prefix.', { fq: 0 });
        for (Q = 2; Q <= r; Q++) {
          while (K > 0 && P[K] !== P[Q - 1]) { R.step('3.', `P[${K + 1}] = “${P[K]}” ≠ P[${Q}] = “${P[Q - 1]}” → fall back: K := F[${K}] = ${S.F[K - 1]}.`, { fq: Q - 1, fk: K }); K = S.F[K - 1]; }
          if (P[K] === P[Q - 1]) { K++; R.step('4.', `P[${K}] = P[${Q}] = “${P[Q - 1]}” → K := ${K}.`, { fq: Q - 1, fk: K - 1 }); }
          S.F[Q - 1] = K; R.step('5.', `F[${Q}] := ${K}.`, { fq: Q - 1 });
        }
        R.algo('run');
        Q = 0; S.k = 0;
        R.vars(() => ({ I, Q, comparisons: cmp, matches: S.found.length }));
        R.step('1.', 'Table ready. Now scan T once; Q counts matched characters.');
        for (I = 1; I <= s; I++) {
          while (Q > 0 && P[Q] !== T[I - 1]) {
            cmp++;
            R.step('3.', `P[${Q + 1}] = “${P[Q]}” ≠ T[${I}] = “${T[I - 1]}” → Q := F[${Q}] = ${S.F[Q - 1]} (slide P, T stays put).`, { tc: I - 1, pc: Q, ok: false, upto: Q });
            Q = S.F[Q - 1]; S.k = I - 1 - Q;
          }
          cmp++;
          if (P[Q] === T[I - 1]) { Q++; S.k = I - Q; R.step('4.', `P[${Q}] = T[${I}] = “${T[I - 1]}” → Q := ${Q}.`, { tc: I - 1, pc: Q - 1, ok: true, upto: Q - 1 }); }
          else { S.k = I; R.step('4.', `P[1] = “${P[0]}” ≠ T[${I}] = “${T[I - 1]}”; Q stays 0.`, { tc: I - 1, pc: 0, ok: false }); }
          if (Q === r) {
            S.found.push(I - r);
            R.step('5.', `Q = R — **match at position ${I - r + 1}**. Continue with Q := F[${r}] = ${S.F[r - 1]}.`, { upto: r }, { tone: 'ok' });
            Q = S.F[r - 1]; S.k = I - Q;
          }
        }
        S.k = null;
        R.step('6.', S.found.length ? `Done: ${S.found.length} match(es) at ${S.found.map((k) => k + 1).join(', ')} using ${cmp} comparisons for a text of ${s} characters.` : `No match, ${cmp} comparisons.`, {}, { tone: S.found.length ? 'ok' : 'bad' });
      },
    },
    view: matchView,
  });
})(typeof window !== 'undefined' ? window : globalThis);
