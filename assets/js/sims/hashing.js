/* DSA Lab · sims/hashing.js — Hashing (Schaum Ch. 9) */
(function (g) {
  'use strict';
  const DSA = g.DSA, U = DSA.U, V = DSA.V;

  /* ---------------- Hash functions ---------------- */
  const digitsOf = (m) => String(Math.max(1, m - 1)).length;
  const HF = {
    div: (k, m) => ({ h: k % m, how: `${k} mod ${m} = ${k % m}` }),
    mid: (k, m) => {
      const l = digitsOf(m), sq = String(k * k), start = Math.max(0, Math.floor((sq.length - l) / 2));
      const mid = sq.slice(start, start + l);
      return { h: Number(mid) % m, how: `${k}² = ${sq}; middle ${l} digit(s) → ${mid}` + (Number(mid) >= m ? ` → mod ${m} = ${Number(mid) % m}` : ''), sq, start, l };
    },
    fold: (k, m) => {
      const l = digitsOf(m), s = String(k), parts = [];
      for (let i = 0; i < s.length; i += l) parts.push(s.slice(i, i + l));
      const sum = parts.reduce((a, b) => a + Number(b), 0);
      const keep = Number(String(sum).slice(-l)) % m;
      return { h: keep, how: `${parts.join(' + ')} = ${sum}` + (String(sum).length > l ? ` → drop the carry: ${String(sum).slice(-l)}` : '') + (Number(String(sum).slice(-l)) >= m ? ` → mod ${m} = ${keep}` : ''), parts };
    },
  };
  DSA.sim({
    id: 'hash-functions', cat: 'hashing', title: 'Hash Functions', short: 'Hash functions',
    tags: ['division method', 'midsquare', 'folding', 'hash address', 'modulo'],
    blurb: 'Turn a key into a table address: the division method (k mod m), the mid-square method and the folding method — compared side by side.',
    schaum: 'Schaum Ch. 9 · Hash functions',
    cx: [['Computing H(k)', 'O(1)']],
    theory: `<p>A <b>hash function</b> H maps a key k (say a 4-digit employee number) to an address in a table of m cells. A good H is fast and spreads keys evenly so that few keys collide.</p>
      <ul><li><b>Division method</b>: <code>H(k) = k mod m</code>. Choose m prime (or with no small factors), e.g. 97 rather than 100.</li>
      <li><b>Mid-square method</b>: square k and take the middle digits of k² (as many digits as an address needs).</li>
      <li><b>Folding method</b>: cut k into parts of that many digits and add them, ignoring the final carry. A variant reverses every second part first.</li></ul>
      <p>With 1-based tables the textbook adds 1: <code>H(k) = k mod m + 1</code>.</p>`,
    algo: {
      run: ['H(k) — three methods', '1. Division: H(k) := k mod m.', '2. Mid-square: H(k) := the middle l digits of k², where l = number of digits in m − 1.', '3. Folding: split k into l-digit parts k₁, k₂, …; H(k) := (k₁ + k₂ + …) ignoring the last carry.', '4. [Each method gives an address 0 … m − 1.]'],
    },
    controls: [
      { id: 'keys', type: 'text', label: 'Keys', value: '3205, 7148, 2345', wide: true, run: true, rand: () => U.randList(4, 1000, 9999).join(', ') },
      { id: 'm', type: 'num', label: 'Table size m', value: 100, min: 2, max: 997, run: true, w: 90 },
      { type: 'btn', label: 'Hash', op: 'play', kind: 'primary' },
    ],
    auto: 'run',
    init(p) { return { keys: U.nums(p.keys, { max: 8, lo: 0, hi: 99999, name: 'keys' }), m: U.num(p.m, { lo: 2, hi: 997, name: 'm' }), i: null, step: null, res: [] }; },
    ops: {
      run(S, p, R) {
        R.table(() => ({ head: ['k', 'Division', 'Mid-square', 'Folding'], rows: S.res.map((r) => [r.k, r.div ?? '', r.mid ?? '', r.fold ?? '']) }));
        R.vars(() => ({ m: S.m, k: S.i == null ? '–' : S.keys[S.i], l: digitsOf(S.m) }));
        R.step(null, `Hash ${S.keys.length} key(s) into a table of m = ${S.m} addresses (0 … ${S.m - 1}).`);
        S.keys.forEach((k, i) => {
          S.i = i; S.res.push({ k });
          const d = HF.div(k, S.m); S.step = 'div'; S.res[i].div = d.h; R.step('1.', `Division: ${d.how}.`);
          const m = HF.mid(k, S.m); S.step = 'mid'; S.res[i].mid = m.h; R.step('2.', `Mid-square: ${m.how}.`);
          const f = HF.fold(k, S.m); S.step = 'fold'; S.res[i].fold = f.h; R.step('3.', `Folding: ${f.how}.`);
        });
        S.i = null; S.step = null;
        R.step('4.', 'Compare the columns: different methods scatter the same keys differently.', {}, { tone: 'ok' });
      },
    },
    view(st) {
      const sp = [];
      if (st.i == null) {
        st.res.forEach((r, j) => sp.push(V.text('done' + j, 0, j * 30, `${r.k}  →  div ${r.div}   mid-sq ${r.mid}   fold ${r.fold}`, 'note', 'start')));
        if (!st.res.length) sp.push(V.text('hint', 0, 0, 'Press play to hash each key.', 'muted', 'start'));
        return { specs: sp, minH: 220 };
      }
      const k = st.keys[st.i], m = st.m, l = digitsOf(m);
      const digits = (pre, s, x, y, hl) => s.split('').forEach((c, i) => sp.push(V.box(pre + i, x + i * 30, y, 27, 34, c, 'chip ' + (hl ? hl(i) : ''), { rx: 4, fs: 14 })));
      sp.push(V.text('kl', -12, 22, 'k', 'name', 'end'));
      digits('k', String(k), 0, 4);
      if (st.step === 'div') {
        sp.push(V.text('d1', 0, 90, `${k} ÷ ${m} = ${Math.floor(k / m)} remainder ${k % m}`, 'note', 'start'));
        sp.push(V.text('d2', 0, 140, `H(k) = ${k % m}`, 'big ok', 'start'));
      } else if (st.step === 'mid') {
        const r = HF.mid(k, m);
        sp.push(V.text('ml', -12, 92, 'k²', 'name', 'end'));
        digits('sq', r.sq, 0, 74, (i) => (i >= r.start && i < r.start + r.l ? 'ok' : 'dim'));
        sp.push(V.text('d2', 0, 160, `H(k) = ${r.h}`, 'big ok', 'start'));
      } else {
        const r = HF.fold(k, m);
        r.parts.forEach((pt, j) => { digits('p' + j + '_', pt, j * (l * 30 + 40), 74, () => 'sel'); if (j) sp.push(V.text('plus' + j, j * (l * 30 + 40) - 20, 96, '+', 'big')); });
        sp.push(V.text('d2', 0, 160, `H(k) = ${r.h}`, 'big ok', 'start'));
      }
      return { specs: sp, minH: 220 };
    },
  });

  /* ---------------- Open addressing ---------------- */
  const PROBE = {
    linear: { name: 'Linear probing', f: (h, i) => h + i, how: (h, i, m) => `(${h} + ${i}) mod ${m}` },
    quad: { name: 'Quadratic probing', f: (h, i) => h + i * i, how: (h, i, m) => `(${h} + ${i}²) mod ${m}` },
    double: { name: 'Double hashing', f: (h, i, h2) => h + i * h2, how: (h, i, m, h2) => `(${h} + ${i}·${h2}) mod ${m}` },
  };
  const h2of = (k, m) => 1 + (k % (m - 2 > 0 ? m - 2 : 1));
  DSA.sim({
    id: 'hash-open', cat: 'hashing', title: 'Collision Resolution: Open Addressing', short: 'Open addressing (probing)',
    tags: ['collision', 'linear probing', 'quadratic probing', 'double hashing', 'load factor', 'clustering'],
    blurb: 'When H(k) is already taken, probe other cells in a fixed sequence: H, H+1, H+2… (linear), H+1², H+2²… (quadratic) or H+i·H₂(k) (double hashing).',
    schaum: 'Schaum Ch. 9 · Collision resolution',
    cx: [['Search, low load factor', '≈ O(1)'], ['Worst case', 'O(m)'], ['Linear probing, successful (α = λ)', '≈ ½(1 + 1/(1 − λ))']],
    theory: `<p>A <b>collision</b> happens when two keys hash to the same address. In <b>open addressing</b> every key lives inside the table itself; on a collision we probe a sequence of alternative cells.</p>
      <ul><li><b>Linear probing</b> tries <code>H, H + 1, H + 2, …</code> (mod m). Simple, but long runs of occupied cells form — <b>primary clustering</b>.</li>
      <li><b>Quadratic probing</b> tries <code>H + 1, H + 4, H + 9, …</code>, breaking up those runs; with m prime it is guaranteed to find a free cell while the table is at most half full.</li>
      <li><b>Double hashing</b> uses a second hash <code>H₂(k) = 1 + (k mod (m − 2))</code> as the step size, so keys that collide at H still follow different paths.</li></ul>
      <p>The <b>load factor</b> λ = n / m controls performance; keep it below about 0.7. Deleting needs a “deleted” marker (shown as DEL) so later searches do not stop early.</p>`,
    algo: {
      ins: ['INSERT(T, m, K) — open addressing', '1. Set H := K mod m and I := 0.', '2. Repeat while I < m:', '  3. Set LOC := probe(H, I) mod m.', '  4. If T[LOC] is empty or DEL, then: Set T[LOC] := K, and Exit.', '  5. If T[LOC] = K, then: Write: already present, and Exit.', '  6. Set I := I + 1. [Collision — try the next cell in the sequence.]', '7. Write: OVERFLOW (no free cell found).'],
      find: ['SEARCH(T, m, K) — open addressing', '1. Set H := K mod m and I := 0.', '2. Repeat while I < m:', '  3. Set LOC := probe(H, I) mod m.', '  4. If T[LOC] = K, then: Return LOC.', '  5. If T[LOC] is empty, then: Return NOT FOUND. [DEL cells are skipped.]', '  6. Set I := I + 1.', '7. Return NOT FOUND.'],
      del: ['DELETE(T, m, K) — open addressing', '1. LOC := SEARCH(T, m, K).', '2. If LOC = NOT FOUND, then: Exit.', '3. Set T[LOC] := DEL. [A marker, not empty, so probe chains stay intact.]', '4. Exit.'],
    },
    controls: [
      { id: 'm', type: 'num', label: 'm', value: 11, min: 3, max: 19, reset: true, w: 64 },
      { id: 'probe', type: 'select', label: 'Probing', value: 'linear', reset: true, opts: Object.entries(PROBE).map(([k, v]) => [k, v.name]) },
      { id: 'init', type: 'text', label: 'Insert first', value: '22, 31, 4, 15, 28, 17, 88, 59', reset: true, w: 230 },
      { type: 'br' },
      { id: 'key', type: 'num', label: 'Key', value: 10, w: 90 },
      { type: 'btn', label: 'Insert', op: 'ins', kind: 'primary' },
      { type: 'btn', label: 'Search', op: 'find' },
      { type: 'btn', label: 'Delete', op: 'del', kind: 'danger' },
    ],
    init(p) {
      const m = U.num(p.m, { lo: 3, hi: 19, name: 'm' });
      const S = { m, T: Array(m).fill(null), probe: p.probe, cur: null, path: [], n: 0 };
      const keys = String(p.init).trim() ? U.nums(p.init, { max: m, lo: 0, hi: 999, name: 'keys' }) : [];
      for (const k of keys) this.place(S, k);
      return S;
    },
    place(S, k) {
      const h = k % S.m, h2 = h2of(k, S.m);
      for (let i = 0; i < S.m; i++) { const loc = ((PROBE[S.probe].f(h, i, h2) % S.m) + S.m) % S.m; if (S.T[loc] == null || S.T[loc] === 'DEL') { S.T[loc] = k; S.n++; return loc; } if (S.T[loc] === k) return loc; }
      return -1;
    },
    vars0: (S) => ({ m: S.m, n: S.n, 'load factor λ': (S.n / S.m).toFixed(2) }),
    ops: {
      ins(S, p, R) { this.walk(S, p, R, 'ins'); },
      find(S, p, R) { this.walk(S, p, R, 'find'); },
      del(S, p, R) { this.walk(S, p, R, 'del'); },
    },
    walk(S, p, R, mode) {
      const K = U.num(p.key, { lo: 0, hi: 999, name: 'Key' });
      const P = PROBE[S.probe], h = K % S.m, h2 = h2of(K, S.m);
      let I = 0, loc = null;
      R.algo(mode).vars(() => Object.assign({ K, H: h }, S.probe === 'double' ? { H2: h2 } : {}, { I, LOC: loc ?? '–', 'λ': (S.n / S.m).toFixed(2) }));
      S.path = [];
      R.step(mode === 'del' ? '1.' : '1.', `H(${K}) = ${K} mod ${S.m} = **${h}**` + (S.probe === 'double' ? `, H₂(${K}) = 1 + (${K} mod ${S.m - 2}) = ${h2}` : '') + '.');
      for (I = 0; I < S.m; I++) {
        loc = ((P.f(h, I, h2) % S.m) + S.m) % S.m; S.cur = loc; S.path.push(loc);
        R.step(mode === 'del' ? '1.' : '3.', `Probe ${I}: LOC = ${P.how(h, I, S.m, h2)} = ${loc}.`);
        const v = S.T[loc];
        if (mode === 'ins') {
          if (v == null || v === 'DEL') { S.T[loc] = K; S.n++; R.step('4.', `T[${loc}] is ${v === 'DEL' ? 'a DEL marker' : 'empty'} → store ${K} there` + (I ? ` after ${I} collision(s).` : '.'), { nw: loc }, { tone: 'ok' }); S.cur = null; return; }
          if (v === K) { R.step('5.', `${K} is already in the table at ${loc}.`, {}, { tone: 'cmp' }); S.cur = null; return; }
          R.step('6.', `T[${loc}] = ${v} — collision! Try the next probe.`, { col: loc });
        } else {
          if (v === K) {
            if (mode === 'find') { R.step('4.', `**Found ${K} at address ${loc}** with ${I + 1} probe(s).`, { hit: loc }, { tone: 'ok' }); S.cur = null; return; }
            R.step('2.', `Found ${K} at ${loc}.`, { hit: loc });
            S.T[loc] = 'DEL'; S.n--;
            R.step('3.', `T[${loc}] := DEL. Searches for keys further along this probe sequence still work.`, { col: loc }, { tone: 'ok' }); S.cur = null; return;
          }
          if (v == null) { R.step(mode === 'del' ? '2.' : '5.', `T[${loc}] is empty → ${K} is **not in the table** (${I + 1} probe(s)).`, {}, { tone: 'bad' }); S.cur = null; return; }
          R.step(mode === 'del' ? '1.' : '6.', v === 'DEL' ? `T[${loc}] is DEL — keep probing.` : `T[${loc}] = ${v} ≠ ${K} — keep probing.`, { col: loc });
        }
      }
      S.cur = null;
      R.step(mode === 'ins' ? '7.' : '7.', mode === 'ins' ? `**Overflow** — ${S.m} probes found no free cell${S.probe === 'quad' ? ' (quadratic probing cannot reach every cell)' : ''}.` : `${K} is not in the table.`, {}, { tone: 'bad' });
    },
    view(st, f) {
      const sp = [], per = Math.min(st.m, 11), cw = 50, ch = 42;
      const pos = (i) => [(i % per) * (cw + 8), Math.floor(i / per) * (ch + 60) + 60];
      for (let i = 0; i < st.m; i++) {
        const [x, y] = pos(i), v = st.T[i];
        const cls = f.hl.nw === i ? 'new' : f.hl.hit === i ? 'ok' : f.hl.col === i ? 'bad' : st.cur === i ? 'act' : v === 'DEL' ? 'dim' : v == null ? 'slot' : '';
        sp.push(V.box('t' + i, x, y, cw, ch, v == null ? '' : v, 'cell ' + cls, { rx: 6, fs: v === 'DEL' ? 11 : undefined }));
        sp.push(V.text('ti' + i, x + cw / 2, y - 8, i, 'idx'));
      }
      st.path.forEach((loc, k) => {
        if (!k) return;
        const [x1, y1] = pos(st.path[k - 1]), [x2, y2] = pos(loc);
        sp.push(V.line('pa' + k, x1 + cw / 2, y1 + ch + 6, x2 + cw / 2, y2 + ch + 6, 'link act', true, { bend: x2 >= x1 ? 26 : -26 }));
      });
      if (st.cur != null) { const [x, y] = pos(st.cur); sp.push(...V.ptr('pLOC', x + cw / 2, y - 18, 'LOC', 'act', 'top', 20)); }
      return { specs: sp, minH: 220 };
    },
  });

  /* ---------------- Separate chaining ---------------- */
  DSA.sim({
    id: 'hash-chain', cat: 'hashing', title: 'Collision Resolution: Chaining', short: 'Chaining',
    tags: ['chaining', 'separate chaining', 'bucket', 'linked list'],
    blurb: 'Each table cell heads a linked list of every key that hashed there. Collisions simply make a chain longer, and the table never “fills up”.',
    schaum: 'Schaum Ch. 9 · Chaining',
    cx: [['Average search (λ = n/m)', 'O(1 + λ)'], ['Worst case (all in one chain)', 'O(n)']],
    theory: `<p>With <b>chaining</b> the table <code>LIST[0..m−1]</code> holds pointers; <code>LIST[H(k)]</code> points to a linked list of all records whose keys hash to that address. Insertion puts the new node at the front of its chain (O(1)); search and deletion walk one chain.</p>
      <p>The load factor λ = n / m may exceed 1. The expected chain length is λ, so with a reasonable m operations stay close to constant time. Deletion is easy — no DEL markers needed.</p>`,
    algo: {
      ins: ['CHAIN_INSERT(LIST, m, K)', '1. Set H := K mod m.', '2. Allocate NEW with INFO[NEW] := K.', '3. Set LINK[NEW] := LIST[H] and LIST[H] := NEW. [Insert at the front of chain H.]', '4. Exit.'],
      find: ['CHAIN_SEARCH(LIST, m, K)', '1. Set H := K mod m and PTR := LIST[H].', '2. Repeat while PTR ≠ NULL:', '     If INFO[PTR] = K, then: Return PTR. Else: Set PTR := LINK[PTR].', '3. Return NULL. [Not found.]'],
      del: ['CHAIN_DELETE(LIST, m, K)', '1. Set H := K mod m; search chain H keeping SAVE one node behind PTR.', '2. If K is not found, then: Exit.', '3. Unlink the node: LINK[SAVE] := LINK[PTR] (or LIST[H] := LINK[PTR] if it was first).', '4. Exit.'],
    },
    controls: [
      { id: 'm', type: 'num', label: 'm', value: 7, min: 2, max: 11, reset: true, w: 64 },
      { id: 'init', type: 'text', label: 'Insert first', value: '15, 11, 27, 8, 12, 22, 4, 36', reset: true, w: 230 },
      { type: 'br' },
      { id: 'key', type: 'num', label: 'Key', value: 29, w: 90 },
      { type: 'btn', label: 'Insert', op: 'ins', kind: 'primary' },
      { type: 'btn', label: 'Search', op: 'find' },
      { type: 'btn', label: 'Delete', op: 'del', kind: 'danger' },
    ],
    init(p) {
      const m = U.num(p.m, { lo: 2, hi: 11, name: 'm' });
      const L = U.range(m).map(() => []);
      const keys = String(p.init).trim() ? U.nums(p.init, { max: 20, lo: 0, hi: 999, name: 'keys' }) : [];
      keys.forEach((k) => { if (!L[k % m].some((n) => n.v === k)) L[k % m].unshift({ id: U.uid('h'), v: k }); });
      return { m, L, cur: null };
    },
    vars0: (S) => ({ m: S.m, n: U.sum(S.L.map((c) => c.length)), 'λ': (U.sum(S.L.map((c) => c.length)) / S.m).toFixed(2) }),
    ops: {
      ins(S, p, R) {
        const K = U.num(p.key, { lo: 0, hi: 999, name: 'Key' }), H = K % S.m;
        R.algo('ins').vars(() => ({ K, H, 'chain length': S.L[H].length }));
        S.cur = H;
        R.step('1.', `H(${K}) = ${K} mod ${S.m} = **${H}**.`);
        if (S.L[H].some((n) => n.v === K)) { R.step(null, `${K} is already in chain ${H}.`, {}, { tone: 'cmp' }); S.cur = null; return; }
        if (U.sum(S.L.map((c) => c.length)) >= 24) { R.step(null, 'The demo shows at most 24 keys.', {}, { tone: 'bad' }); S.cur = null; return; }
        const nd = { id: U.uid('h'), v: K };
        R.step('2.', `NEW node holds ${K}.`);
        S.L[H].unshift(nd);
        R.step('3.', `Linked in at the front of chain ${H}${S.L[H].length > 1 ? ` — a collision with ${S.L[H].length - 1} other key(s), handled for free` : ''}.`, { nw: nd.id }, { tone: 'ok' });
        S.cur = null;
      },
      find(S, p, R) { this.walk(S, p, R, false); },
      del(S, p, R) { this.walk(S, p, R, true); },
    },
    walk(S, p, R, del) {
      const K = U.num(p.key, { lo: 0, hi: 999, name: 'Key' }), H = K % S.m;
      R.algo(del ? 'del' : 'find').vars(() => ({ K, H }));
      S.cur = H;
      R.step('1.', `H(${K}) = ${H}: only chain ${H} needs to be searched.`);
      const ch = S.L[H];
      for (let i = 0; i < ch.length; i++) {
        if (ch[i].v === K) {
          if (!del) { R.step('     If', `**Found ${K}** after ${i + 1} comparison(s).`, { hit: ch[i].id }, { tone: 'ok' }); S.cur = null; return; }
          R.step('1.', `Found ${K} in chain ${H}.`, { dead: ch[i].id });
          ch.splice(i, 1);
          R.step('3.', `Unlinked ${K}.`, {}, { tone: 'ok' }); S.cur = null; return;
        }
        R.step(del ? '1.' : '     If', `${ch[i].v} ≠ ${K}, follow the link.`, { cmp: ch[i].id });
      }
      R.step(del ? '2.' : '3.', `${K} is not in the table.`, {}, { tone: 'bad' });
      S.cur = null;
    },
    view(st, f) {
      const sp = [], ch = 40;
      st.L.forEach((chain, i) => {
        const y = i * (ch + 14);
        sp.push(V.text('li' + i, -10, y + ch / 2 + 4, i, 'idx', 'end'));
        sp.push(V.box('b' + i, 0, y, 46, ch, chain.length ? '' : '×', 'lnk ' + (st.cur === i ? 'act' : '') + (chain.length ? '' : ' nil'), { rx: 5 }));
        chain.forEach((nd, j) => {
          const x = 90 + j * 100;
          const cls = f.hl.nw === nd.id ? 'new' : f.hl.hit === nd.id ? 'ok' : f.hl.dead === nd.id ? 'bad' : f.hl.cmp === nd.id ? 'cmp' : '';
          sp.push(V.box('n' + nd.id, x, y, 46, ch, nd.v, 'info ' + cls, { rx: 4 }));
          sp.push(V.box('l' + nd.id, x + 46, y, 24, ch, j === chain.length - 1 ? '×' : '', 'lnk ' + (j === chain.length - 1 ? 'nil ' : '') + cls, { rx: 4 }));
          const sx = j ? x - 100 + 58 : 23;
          sp.push({ k: 'poly', key: 'a' + nd.id, pts: [[sx, y + ch / 2], [sx + 8, y + ch / 2], [(sx + x) / 2, y + ch / 2], [x - 8, y + ch / 2], [x - 2, y + ch / 2]], cls: 'link', arrow: true });
        });
      });
      sp.push(V.text('lt', 23, -14, 'LIST', 'name'));
      return { specs: sp, minH: 260 };
    },
  });
})(typeof window !== 'undefined' ? window : globalThis);
