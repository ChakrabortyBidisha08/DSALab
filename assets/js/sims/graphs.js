/* DSA Lab · sims/graphs.js — Graphs and their applications (Schaum Ch. 8) */
(function (g) {
  'use strict';
  const DSA = g.DSA, U = DSA.U, V = DSA.V;
  const INF = '∞';

  /* ---------- parsing & layout ---------- */
  function parseGraph(str, o) {
    o = o || {};
    const parts = String(str).split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean);
    if (!parts.length) U.fail('Enter edges such as A-B:4, B-C:2 (use > for one-way edges).');
    const nodes = new Set(), edges = [];
    for (const part of parts) {
      const m = part.match(/^(\w{1,3})\s*(?:(-|>|->|–)\s*(\w{1,3}))?\s*(?::\s*(-?\d+))?$/);
      if (!m) U.fail(`Could not read “${part}”. Write edges like A-B or A-B:4 (or A>B for a directed edge).`);
      nodes.add(m[1]);
      if (!m[3]) continue;
      nodes.add(m[3]);
      if (m[1] === m[3]) U.fail(`Self-loop ${m[1]}-${m[1]} is not supported here.`);
      const w = m[4] == null ? 1 : Number(m[4]);
      if (o.positive && w < 0) U.fail('This algorithm needs non-negative weights.');
      edges.push({ u: m[1], v: m[3], w, arrow: m[2] === '>' || m[2] === '->' });
    }
    if (nodes.size > 12) U.fail('Use at most 12 vertices so the picture stays readable.');
    if (edges.length > 30) U.fail('Use at most 30 edges.');
    const directed = o.directed != null ? o.directed : edges.some((e) => e.arrow);
    const seen = new Set();
    const E = [];
    for (const e of edges) {
      const k = directed ? e.u + '>' + e.v : [e.u, e.v].sort().join('~');
      if (seen.has(k)) U.fail(`Edge ${e.u}–${e.v} is listed twice.`);
      seen.add(k); E.push({ u: e.u, v: e.v, w: e.w });
    }
    const ids = [...nodes].sort((a, b) => (/^\d+$/.test(a) && /^\d+$/.test(b) ? a - b : a < b ? -1 : 1));
    return { nodes: ids.map((id) => ({ id, x: 0, y: 0 })), edges: E, directed };
  }
  /* Deterministic force-directed layout (Fruchterman–Reingold), seeded on a circle. */
  function layout(G, cache) {
    const n = G.nodes.length, W = 440, H = 300;
    G.nodes.forEach((nd, i) => { const a = -Math.PI / 2 + (2 * Math.PI * i) / n; nd.x = W / 2 + 150 * Math.cos(a); nd.y = H / 2 + 120 * Math.sin(a); });
    if (n > 2) {
      const k = Math.sqrt((W * H) / n) * 0.75;
      let t = 40;
      for (let it = 0; it < 160; it++) {
        const d = G.nodes.map(() => [0, 0]);
        for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
          if (i === j) continue;
          const dx = G.nodes[i].x - G.nodes[j].x, dy = G.nodes[i].y - G.nodes[j].y, dist = Math.max(1, Math.hypot(dx, dy));
          const f = (k * k) / dist; d[i][0] += (dx / dist) * f; d[i][1] += (dy / dist) * f;
        }
        const idx = Object.fromEntries(G.nodes.map((nd, i) => [nd.id, i]));
        for (const e of G.edges) {
          const a = idx[e.u], b = idx[e.v];
          const dx = G.nodes[a].x - G.nodes[b].x, dy = G.nodes[a].y - G.nodes[b].y, dist = Math.max(1, Math.hypot(dx, dy));
          const f = (dist * dist) / k;
          d[a][0] -= (dx / dist) * f; d[a][1] -= (dy / dist) * f; d[b][0] += (dx / dist) * f; d[b][1] += (dy / dist) * f;
        }
        G.nodes.forEach((nd, i) => {
          const l = Math.max(1, Math.hypot(d[i][0], d[i][1]));
          nd.x = U.clamp(nd.x + (d[i][0] / l) * Math.min(l, t), 20, W - 20);
          nd.y = U.clamp(nd.y + (d[i][1] / l) * Math.min(l, t), 20, H - 20);
        });
        t = Math.max(1, t * 0.97);
      }
    }
    if (cache) G.nodes.forEach((nd) => { const c = cache[nd.id]; if (c) { nd.x = c.x; nd.y = c.y; } });
    G.nodes.forEach((nd) => { nd.x = Math.round(nd.x); nd.y = Math.round(nd.y); });
    return G;
  }
  const adj = (G) => {
    const A = Object.fromEntries(G.nodes.map((n) => [n.id, []]));
    for (const e of G.edges) { A[e.u].push({ to: e.v, w: e.w }); if (!G.directed) A[e.v].push({ to: e.u, w: e.w }); }
    for (const k in A) A[k].sort((a, b) => (a.to < b.to ? -1 : 1));
    return A;
  };
  const ek = (G, u, v) => V.ekey(G, u, v);
  function makeGraph(p, page, o) {
    const G = parseGraph(p.g, o);
    return layout(G, page && page._gpos);
  }
  /* Drag vertices with the mouse or a finger. Positions persist while the input stays the same. */
  function enableDrag(page) {
    const svg = page.scene.svg;
    svg.style.touchAction = 'none';
    let drag = null;
    const down = (e) => {
      const el = e.target.closest && e.target.closest('[data-key]');
      if (!el) return;
      const key = el.getAttribute('data-key');
      if (!key.startsWith('Gn')) return;
      drag = key.slice(2);
      svg.classList.add('dragging');
      try { svg.setPointerCapture(e.pointerId); } catch (er) { /* ignore */ }
      e.preventDefault();
    };
    const move = (e) => {
      if (!drag) return;
      const pt = page.scene.toLocal(e);
      const upd = (G) => { const n = G && G.nodes.find((x) => x.id === drag); if (n) { n.x = Math.round(pt.x); n.y = Math.round(pt.y); } };
      upd(page.S && page.S.G);
      page.player.frames.forEach((f) => upd(f.st && f.st.G));
      page._gpos = page._gpos || {};
      page._gpos[drag] = { x: Math.round(pt.x), y: Math.round(pt.y) };
      page.redraw(true);
    };
    const up = () => { if (drag) { drag = null; svg.classList.remove('dragging'); page.redraw(false); } };
    svg.addEventListener('pointerdown', down);
    svg.addEventListener('pointermove', move);
    svg.addEventListener('pointerup', up);
    svg.addEventListener('pointercancel', up);
    page._undrag = () => { svg.removeEventListener('pointerdown', down); svg.removeEventListener('pointermove', move); svg.removeEventListener('pointerup', up); svg.removeEventListener('pointercancel', up); };
  }
  const gmount = (page) => enableDrag(page);
  const gunmount = (page) => page._undrag && page._undrag();
  const SAMPLE_U = 'A-B:4, A-C:2, B-C:5, B-D:10, C-E:3, E-D:4, D-F:11, E-F:7';
  const SAMPLE_D = 'A>B, A>C, B>D, C>B, C>E, D>F, E>D, E>F';
  const DRAG_NOTE = { type: 'note', text: 'Tip: drag the vertices to rearrange the drawing.' };

  /* Standard drawing: graph + optional extra specs placed to the right. */
  function gview(st, f, o) {
    o = o || {};
    const sp = V.graph('G', st.G, Object.assign({ weights: o.weights, hl: f.hl.n || st.hl || {}, ehl: f.hl.e || st.ehl || {}, sub: o.sub, top: o.top }, {}));
    return sp;
  }
  const status = (st, id) => (st.status ? st.status[id] : 1);
  const STCLS = { 1: '', 2: 'sel', 3: 'ok' };

  /* ---------------- Representation ---------------- */
  DSA.sim({
    id: 'graph-repr', cat: 'graphs', title: 'Graph Representations', short: 'Adjacency matrix & lists',
    tags: ['adjacency matrix', 'adjacency list', 'linked representation', 'sequential representation', 'directed', 'undirected', 'weighted'],
    blurb: 'Store a graph as an adjacency matrix A (A[i, j] = 1 or the weight when there is an edge) or as adjacency lists (each vertex keeps a linked list of its neighbours).',
    schaum: 'Schaum Ch. 8 · Sequential and linked representation of graphs',
    cx: [['Matrix: memory', 'O(V²)'], ['Matrix: is there an edge u–v?', 'O(1)'], ['Lists: memory', 'O(V + E)'], ['Lists: all neighbours of u', 'O(deg u)']],
    theory: `<p>The <b>adjacency matrix</b> of a graph with m vertices is an m × m matrix with <code>A[i, j] = 1</code> (or the edge weight) if there is an edge from vertex i to vertex j, and 0 otherwise. For an undirected graph it is symmetric. It answers “is there an edge?” instantly but always uses m² cells.</p>
      <p>The textbook's <b>linked representation</b> keeps a list of nodes, each pointing to its <b>adjacency list</b> of edges — memory proportional to V + E, ideal for sparse graphs and for traversals that need every neighbour of a vertex.</p>
      <p>Type your own edges: <code>A-B:4</code> is an undirected edge of weight 4, <code>A&gt;B</code> a directed edge.</p>`,
    algo: { run: ['BUILD representations of G', '1. Set A[i, j] := 0 for all i, j; every adjacency list := empty.', '2. Repeat for each edge (U, V, W):', '  3. Set A[U, V] := W (or 1). [Undirected: also A[V, U].]', '  4. Append V to ADJ[U]. [Undirected: also append U to ADJ[V].]', '5. Exit.'] },
    controls: [{ id: 'g', type: 'text', label: 'Edges', value: SAMPLE_U, wide: true, run: true, presets: [[SAMPLE_U, 'Weighted, undirected'], [SAMPLE_D, 'Directed'], ['1-2, 1-3, 2-4, 3-4, 4-5', 'Small, numbered']] }, { id: 'wt', type: 'check', label: 'Show weights', value: true, run: true }, { type: 'btn', label: 'Build', op: 'play', kind: 'primary' }, DRAG_NOTE],
    auto: 'run', mount: gmount, unmount: gunmount,
    init(p, page) { const G = makeGraph(p, page); const ids = G.nodes.map((n) => n.id); return { G, ids, M: ids.map(() => ids.map(() => 0)), L: Object.fromEntries(ids.map((i) => [i, []])), wt: !!p.wt }; },
    ops: {
      run(S, p, R) {
        const ix = Object.fromEntries(S.ids.map((x, i) => [x, i]));
        R.vars(() => ({ vertices: S.ids.length, edges: S.G.edges.length, directed: S.G.directed ? 'yes' : 'no' }));
        R.step('1.', `${S.ids.length} vertices: start with an all-zero ${S.ids.length} × ${S.ids.length} matrix and empty lists.`);
        for (const e of S.G.edges) {
          const val = S.wt ? e.w : 1;
          S.M[ix[e.u]][ix[e.v]] = val; if (!S.G.directed) S.M[ix[e.v]][ix[e.u]] = val;
          S.L[e.u].push(e.v + (S.wt ? `(${e.w})` : '')); if (!S.G.directed) S.L[e.v].push(e.u + (S.wt ? `(${e.w})` : ''));
          R.step('  3.', `Edge ${e.u}${S.G.directed ? ' → ' : ' – '}${e.v}${S.wt ? ' (weight ' + e.w + ')' : ''}: A[${e.u}, ${e.v}] := ${val}${S.G.directed ? '' : ` and A[${e.v}, ${e.u}] := ${val}`}; add to the adjacency list${S.G.directed ? '' : 's'}.`, { e: { [ek(S.G, e.u, e.v)]: 'act' }, cell: [ix[e.u], ix[e.v]] });
        }
        R.step('5.', `Matrix: ${S.ids.length * S.ids.length} cells. Lists: ${S.G.directed ? S.G.edges.length : 2 * S.G.edges.length} list entries.`, {}, { tone: 'ok' });
      },
    },
    view(st, f) {
      const sp = gview(st, f, { weights: st.wt });
      const ox = 500, n = st.ids.length;
      const c = f.hl.cell;
      sp.push(...V.matrix('M', st.M, { x: ox, y: 30, cw: 30, ch: 28, rows: st.ids, cols: st.ids, name: 'Adjacency matrix', fs: 12, hl: (i, j) => (c && ((c[0] === i && c[1] === j) || (!st.G.directed && c[0] === j && c[1] === i)) ? 'new' : st.M[i][j] ? 'sel' : '') }));
      const ly = 30 + n * 28 + 40;
      sp.push(V.text('lt', ox, ly - 10, 'Adjacency lists', 'name', 'start'));
      st.ids.forEach((id, i) => {
        sp.push(V.box('lh' + id, ox, ly + i * 30, 30, 26, id, 'cell', { rx: 4, fs: 12 }));
        st.L[id].forEach((t, j) => sp.push(V.box('li' + id + '_' + j, ox + 44 + j * 50, ly + i * 30, 46, 26, t, 'chip', { rx: 4, fs: 11 })));
      });
      return { specs: sp, minH: 360, minW: 700 };
    },
  });

  /* ---------------- Warshall ---------------- */
  DSA.sim({
    id: 'warshall', cat: 'graphs', title: 'Warshall’s Algorithm (Path Matrix)', short: 'Warshall (path matrix)',
    tags: ['warshall', 'path matrix', 'transitive closure', 'reachability'],
    blurb: 'Compute the path matrix P: P[i, j] = 1 if there is any path from i to j. Allow vertex K as an intermediate stop, for K = 1, 2, …, m.',
    schaum: 'Schaum Ch. 8 · Warshall’s algorithm; path matrix',
    cx: [['Time', 'O(m³)'], ['Space', 'O(m²)']],
    theory: `<p>Let <code>P_K[i, j] = 1</code> if there is a path from vᵢ to vⱼ whose intermediate vertices all come from {v₁, …, v_K}. Then <code>P₀ = A</code> (the adjacency matrix) and</p>
      <p class="formula">P_K[i, j] = P_{K−1}[i, j] ∨ (P_{K−1}[i, K] ∧ P_{K−1}[K, j])</p>
      <p>— either we could already get there, or we can go i → K and K → j. After K = m, <code>P_m</code> is the <b>path matrix</b> (transitive closure). The graph is <b>strongly connected</b> exactly when P has no 0.</p>`,
    algo: { run: ['WARSHALL(A, P, M)', '1. Repeat for I, J = 1 to M: [Initialise.] Set P[I, J] := A[I, J] (0 or 1).', '2. Repeat Steps 3 and 4 for K = 1 to M:', '  3. Repeat Step 4 for I = 1 to M:', '    4. Repeat for J = 1 to M: Set P[I, J] := P[I, J] ∨ (P[I, K] ∧ P[K, J]).', '5. Exit.'] },
    controls: [{ id: 'g', type: 'text', label: 'Edges', value: 'A>B, B>C, C>D, D>B, A>E', wide: true, run: true, presets: [['A>B, B>C, C>D, D>B, A>E', 'Directed, 5 vertices'], ['1>2, 2>3, 3>1, 3>4', 'Cycle + tail'], [SAMPLE_D, 'Directed 6']] }, { type: 'btn', label: 'Compute', op: 'play', kind: 'primary' }, DRAG_NOTE],
    auto: 'run', mount: gmount, unmount: gunmount,
    init(p, page) { const G = makeGraph(p, page, { directed: true }); const ids = G.nodes.map((n) => n.id); const ix = Object.fromEntries(ids.map((x, i) => [x, i])); const P = ids.map(() => ids.map(() => 0)); G.edges.forEach((e) => (P[ix[e.u]][ix[e.v]] = 1)); return { G, ids, P, k: null }; },
    ops: {
      run(S, p, R) {
        const m = S.ids.length;
        let added = 0;
        R.vars(() => ({ K: S.k == null ? '–' : S.ids[S.k], 'new 1s': added }));
        R.step('1.', 'P₀ = the adjacency matrix: 1 where there is a direct edge.');
        for (let k = 0; k < m; k++) {
          S.k = k;
          R.step('2.', `K = ${S.ids[k]}: now paths may pass through ${S.ids[k]}. Row and column ${S.ids[k]} are highlighted.`);
          for (let i = 0; i < m; i++) for (let j = 0; j < m; j++) {
            if (!S.P[i][j] && S.P[i][k] && S.P[k][j]) {
              S.P[i][j] = 1; added++;
              R.step('    4.', `P[${S.ids[i]}, ${S.ids[k]}] = 1 and P[${S.ids[k]}, ${S.ids[j]}] = 1 → **P[${S.ids[i]}, ${S.ids[j]}] := 1** (path ${S.ids[i]} → ${S.ids[k]} → ${S.ids[j]}).`, { cell: [i, j], n: { [S.ids[i]]: 'act', [S.ids[k]]: 'sel', [S.ids[j]]: 'ok' } });
            }
          }
        }
        S.k = null;
        const zeros = S.P.flat().filter((x) => !x).length;
        R.step('5.', `Path matrix complete (${added} new path(s) found). ` + (zeros ? `${zeros} zero(s) remain, so the graph is not strongly connected.` : 'No zeros: the graph is strongly connected.'), {}, { tone: 'ok' });
      },
    },
    view(st, f) {
      const sp = gview(st, f);
      const k = st.k, c = f.hl.cell;
      sp.push(...V.matrix('P', st.P, { x: 500, y: 40, cw: 34, ch: 32, rows: st.ids, cols: st.ids, name: 'P' + (k == null ? '' : ' (K = ' + st.ids[k] + ')'), rhl: k != null ? { [k]: 'sel' } : {}, chl: k != null ? { [k]: 'sel' } : {}, hl: (i, j) => (c && c[0] === i && c[1] === j ? 'new' : k != null && (i === k || j === k) ? 'sel' : st.P[i][j] ? 'ok' : '') }));
      return { specs: sp, minH: 340, minW: 720 };
    },
  });

  /* ---------------- Floyd (shortest paths) ---------------- */
  DSA.sim({
    id: 'floyd', cat: 'graphs', title: 'Shortest-Path Algorithm (Floyd–Warshall)', short: 'Floyd–Warshall',
    tags: ['floyd', 'all pairs shortest path', 'shortest path matrix', 'modified warshall'],
    blurb: 'The textbook’s shortest-path algorithm: Warshall’s idea with MIN and + instead of OR and AND. Q[i, j] ends as the length of the shortest path from i to j.',
    schaum: 'Schaum Ch. 8 · Shortest-path algorithm',
    cx: [['Time', 'O(m³)'], ['Space', 'O(m²)']],
    theory: `<p>Start from the weight matrix W with ∞ where there is no edge. For K = 1 … m allow vertex K as an intermediate stop:</p>
      <p class="formula">Q_K[i, j] = MIN( Q_{K−1}[i, j], Q_{K−1}[i, K] + Q_{K−1}[K, j] )</p>
      <p>Following the textbook, the diagonal starts at ∞ too, so at the end <code>Q[i, i]</code> is the length of the shortest cycle through i (∞ if there is none). Many C books start the diagonal at 0 instead. Negative edges are allowed as long as there is no negative cycle.</p>`,
    algo: { run: ['SHORTPATH(W, Q, M)', '1. Repeat for I, J = 1 to M: [Initialise.]', '     If W[I, J] = 0, then: Set Q[I, J] := ∞. Else: Set Q[I, J] := W[I, J].', '2. Repeat Steps 3 and 4 for K = 1 to M:', '  3. Repeat Step 4 for I = 1 to M:', '    4. Repeat for J = 1 to M: Set Q[I, J] := MIN(Q[I, J], Q[I, K] + Q[K, J]).', '5. Exit.'] },
    controls: [{ id: 'g', type: 'text', label: 'Edges', value: 'A>B:7, A>D:5, B>A:7, B>D:2, C>B:3, D>C:1', wide: true, run: true, presets: [['A>B:7, A>D:5, B>A:7, B>D:2, C>B:3, D>C:1', 'Directed, 4 vertices'], ['1-2:3, 1-3:8, 2-3:2, 3-4:1, 2-4:7', 'Undirected']] }, { type: 'btn', label: 'Compute', op: 'play', kind: 'primary' }, DRAG_NOTE],
    auto: 'run', mount: gmount, unmount: gunmount,
    init(p, page) {
      const G = makeGraph(p, page);
      const ids = G.nodes.map((n) => n.id), ix = Object.fromEntries(ids.map((x, i) => [x, i]));
      const Q = ids.map(() => ids.map(() => Infinity));
      G.edges.forEach((e) => { Q[ix[e.u]][ix[e.v]] = e.w; if (!G.directed) Q[ix[e.v]][ix[e.u]] = e.w; });
      return { G, ids, Q, k: null };
    },
    ops: {
      run(S, p, R) {
        const m = S.ids.length;
        let better = 0;
        R.vars(() => ({ K: S.k == null ? '–' : S.ids[S.k], improvements: better }));
        R.step('1.', 'Q₀ = W, with ∞ wherever there is no edge.');
        for (let k = 0; k < m; k++) {
          S.k = k;
          R.step('2.', `K = ${S.ids[k]}: try every path that detours through ${S.ids[k]}.`);
          for (let i = 0; i < m; i++) for (let j = 0; j < m; j++) {
            const via = S.Q[i][k] + S.Q[k][j];
            if (via < S.Q[i][j]) {
              const old = S.Q[i][j];
              S.Q[i][j] = via; better++;
              R.step('    4.', `Q[${S.ids[i]}, ${S.ids[k]}] + Q[${S.ids[k]}, ${S.ids[j]}] = ${S.Q[i][k]} + ${S.Q[k][j]} = ${via} < ${old === Infinity ? INF : old} → **Q[${S.ids[i]}, ${S.ids[j]}] := ${via}**.`, { cell: [i, j], n: { [S.ids[i]]: 'act', [S.ids[k]]: 'sel', [S.ids[j]]: 'ok' } });
            }
          }
        }
        S.k = null;
        R.step('5.', `Done: ${better} improvement(s). Q now holds every shortest distance.`, {}, { tone: 'ok' });
      },
    },
    view(st, f) {
      const sp = gview(st, f, { weights: true });
      const k = st.k, c = f.hl.cell;
      sp.push(...V.matrix('Q', st.Q, { x: 500, y: 40, cw: 38, ch: 32, rows: st.ids, cols: st.ids, name: 'Q' + (k == null ? '' : ' (K = ' + st.ids[k] + ')'), fmt: (v) => (v === Infinity ? INF : String(v)), rhl: k != null ? { [k]: 'sel' } : {}, chl: k != null ? { [k]: 'sel' } : {}, hl: (i, j) => (c && c[0] === i && c[1] === j ? 'new' : k != null && (i === k || j === k) ? 'sel' : '') }));
      return { specs: sp, minH: 340, minW: 740 };
    },
  });

  /* ---------------- BFS ---------------- */
  DSA.sim({
    id: 'bfs', cat: 'graphs', title: 'Breadth-First Search', short: 'BFS',
    tags: ['bfs', 'breadth first', 'queue', 'status', 'shortest path', 'traversal'],
    blurb: 'Visit the start vertex, then all its neighbours, then their neighbours… using a QUEUE. STATUS = 1 ready, 2 waiting in the queue, 3 processed. ORIG records how each vertex was reached.',
    schaum: 'Schaum Ch. 8 · Traversing a graph (breadth-first search)',
    cx: [['Adjacency lists', 'O(V + E)'], ['Adjacency matrix', 'O(V²)']],
    theory: `<p>During the search each vertex is in one of three states: <b>STATUS = 1</b> ready (not yet seen), <b>2</b> waiting (in the queue), <b>3</b> processed. BFS processes vertices in order of their distance (number of edges) from the start, so following <code>ORIG</code> pointers backwards from any vertex gives a path with the <b>fewest edges</b> — try choosing a target.</p>
      <p>Neighbours are taken in alphabetical order here, so the order of visits is reproducible.</p>`,
    algo: { run: ['BFS(G, A) — breadth-first from A', '1. Set STATUS := 1 (ready) for every vertex.', '2. Put A in QUEUE and set STATUS(A) := 2 (waiting).', '3. Repeat Steps 4 and 5 until QUEUE is empty:', '  4. Remove the front vertex N of QUEUE; process N; Set STATUS(N) := 3.', '  5. Add to the rear of QUEUE every neighbour M of N with STATUS(M) = 1;', '       Set STATUS(M) := 2 and ORIG(M) := N.', '6. Exit.'] },
    controls: [{ id: 'g', type: 'text', label: 'Edges', value: 'A-B, A-C, A-D, B-E, C-F, D-F, E-G, F-G, F-H', wide: true, run: true, presets: [['A-B, A-C, A-D, B-E, C-F, D-F, E-G, F-G, F-H', 'Undirected, 8 vertices'], [SAMPLE_D, 'Directed']] }, { id: 'src', type: 'text', label: 'Start', value: 'A', w: 60, run: true }, { id: 'dst', type: 'text', label: 'Target (optional)', value: 'H', w: 60, run: true }, { type: 'btn', label: 'Search', op: 'play', kind: 'primary' }, DRAG_NOTE],
    auto: 'run', mount: gmount, unmount: gunmount,
    init(p, page) {
      const G = makeGraph(p, page);
      const src = String(p.src).trim(), dst = String(p.dst || '').trim();
      if (!G.nodes.some((n) => n.id === src)) U.fail(`Start vertex “${src}” is not in the graph.`);
      if (dst && !G.nodes.some((n) => n.id === dst)) U.fail(`Target vertex “${dst}” is not in the graph.`);
      return { G, src, dst, status: Object.fromEntries(G.nodes.map((n) => [n.id, 1])), orig: {}, Q: [], out: [], cur: null };
    },
    ops: {
      run(S, p, R) {
        const A = adj(S.G);
        R.vars(() => ({ N: S.cur || '–', QUEUE: S.Q.slice(), processed: S.out.length }));
        R.step('1.', 'Every vertex starts in the ready state (STATUS = 1).');
        S.Q.push(S.src); S.status[S.src] = 2;
        R.step('2.', `QUEUE = [${S.src}], STATUS(${S.src}) := 2.`);
        while (S.Q.length) {
          const N = S.Q.shift(); S.cur = N; S.status[N] = 3; S.out.push(N);
          R.step('  4.', `Remove ${N} from the front of QUEUE and process it.`, { n: { [N]: 'act' } });
          const added = [];
          for (const { to } of A[N]) if (S.status[to] === 1) { S.status[to] = 2; S.orig[to] = N; S.Q.push(to); added.push(to); }
          R.step('  5.', added.length ? `Ready neighbours of ${N}: ${added.join(', ')} → enqueue them, ORIG := ${N}.` : `No ready neighbours of ${N}.`, { n: { [N]: 'act' }, e: Object.fromEntries(added.map((t) => [ek(S.G, N, t), 'act'])) });
        }
        S.cur = null;
        let msg = `BFS order: **${S.out.join(' ')}**.`;
        const e = {}, n = {};
        if (S.dst) {
          if (S.status[S.dst] === 1) msg += ` ${S.dst} cannot be reached from ${S.src}.`;
          else { const path = [S.dst]; while (path[0] !== S.src) path.unshift(S.orig[path[0]]); path.forEach((v, i) => { n[v] = 'path'; if (i) e[ek(S.G, path[i - 1], v)] = 'path'; }); msg += ` Fewest-edges path to ${S.dst}: ${path.join(' → ')} (${path.length - 1} edge(s)).`; }
        }
        R.step('6.', msg, { n, e }, { tone: 'ok' });
      },
    },
    view(st, f) {
      const hl = Object.assign({}, Object.fromEntries(st.G.nodes.map((n) => [n.id, STCLS[status(st, n.id)]])), f.hl.n || {});
      const ehl = Object.assign({}, Object.fromEntries(Object.keys(st.orig).map((v) => [ek(st.G, st.orig[v], v), 'ok'])), f.hl.e || {});
      const sp = V.graph('G', st.G, { hl, ehl, sub: Object.fromEntries(st.G.nodes.map((n) => [n.id, 'S=' + status(st, n.id)])), top: Object.fromEntries(Object.keys(st.orig).map((v) => [v, '←' + st.orig[v]])) });
      sp.push(...V.row('Q', st.Q.map((v) => ({ id: 'q' + v, v })), { x: 500, y: 60, name: 'QUEUE', cw: 36, empty: '(empty)' }));
      sp.push(...V.row('O', st.out.map((v) => ({ id: 'o' + v, v })), { x: 500, y: 140, name: 'Order', cw: 36, empty: '(none yet)' }));
      sp.push(V.text('leg', 500, 230, 'STATUS: 1 ready · 2 waiting · 3 processed', 'idx', 'start'));
      return { specs: sp, minH: 340, minW: 760 };
    },
  });

  /* ---------------- DFS ---------------- */
  DSA.sim({
    id: 'dfs', cat: 'graphs', title: 'Depth-First Search', short: 'DFS',
    tags: ['dfs', 'depth first', 'stack', 'backtracking', 'traversal'],
    blurb: 'Go as deep as possible before backing up. The textbook version uses a STACK with the same STATUS values as BFS; the recursive version uses the call stack.',
    schaum: 'Schaum Ch. 8 · Traversing a graph (depth-first search)',
    cx: [['Adjacency lists', 'O(V + E)'], ['Adjacency matrix', 'O(V²)']],
    theory: `<p>Depth-first search is breadth-first search with the QUEUE replaced by a <b>STACK</b>: the most recently discovered vertex is explored next, so the search plunges along one path and backtracks only when it gets stuck.</p>
      <p>The textbook algorithm pushes <i>all</i> ready neighbours of the processed vertex and marks them waiting; the recursive form (common in C courses) visits the first unvisited neighbour immediately. Both are O(V + E) but can produce different orders — compare them. DFS underlies cycle detection, topological sorting and finding connected components.</p>`,
    algo: {
      stack: ['DFS(G, A) — depth-first from A, with a stack', '1. Set STATUS := 1 (ready) for every vertex.', '2. Push A onto STACK and set STATUS(A) := 2 (waiting).', '3. Repeat Steps 4 and 5 until STACK is empty:', '  4. Pop the top vertex N; process N; Set STATUS(N) := 3.', '  5. Push every neighbour M of N with STATUS(M) = 1; Set STATUS(M) := 2.', '6. Exit.'],
      rec: ['DFS(N) — recursive', '1. Mark N visited and process N.', '2. Repeat for each neighbour M of N:', '     If M is not visited, then: Call DFS(M).', '3. Return.'],
    },
    controls: [{ id: 'g', type: 'text', label: 'Edges', value: 'A-B, A-C, A-D, B-E, C-F, D-F, E-G, F-G, F-H', wide: true, run: true, presets: [['A-B, A-C, A-D, B-E, C-F, D-F, E-G, F-G, F-H', 'Undirected, 8 vertices'], [SAMPLE_D, 'Directed']] }, { id: 'src', type: 'text', label: 'Start', value: 'A', w: 60, run: true }, { id: 'how', type: 'select', label: 'Method', value: 'stack', run: true, opts: [['stack', 'Textbook (stack + STATUS)'], ['rec', 'Recursive']] }, { type: 'btn', label: 'Search', op: 'play', kind: 'primary' }, DRAG_NOTE],
    auto: 'run', mount: gmount, unmount: gunmount,
    init(p, page) {
      const G = makeGraph(p, page);
      const src = String(p.src).trim();
      if (!G.nodes.some((n) => n.id === src)) U.fail(`Start vertex “${src}” is not in the graph.`);
      return { G, src, how: p.how, status: Object.fromEntries(G.nodes.map((n) => [n.id, 1])), orig: {}, K: [], out: [], cur: null };
    },
    ops: {
      run(S, p, R) {
        const A = adj(S.G);
        R.vars(() => ({ N: S.cur || '–', STACK: S.K.slice(), processed: S.out.length }));
        if (S.how === 'rec') {
          R.algo('rec');
          const dfs = (N, from) => {
            S.K.push(N); S.cur = N; S.status[N] = 3; S.out.push(N); if (from) S.orig[N] = from;
            R.step('1.', `Visit ${N}${from ? ` (reached from ${from})` : ''}.`, { n: { [N]: 'act' }, e: from ? { [ek(S.G, from, N)]: 'act' } : {} });
            for (const { to } of A[N]) {
              if (S.status[to] === 1) { R.step('     If M', `${to} is unvisited → recurse into it.`, { n: { [N]: 'sel', [to]: 'cmp' } }); dfs(to, N); S.cur = N; R.step('2.', `Back at ${N}.`, { n: { [N]: 'act' } }); }
            }
            S.K.pop();
            R.step('3.', `All neighbours of ${N} done — return.`);
          };
          dfs(S.src, null);
        } else {
          R.algo('stack');
          R.step('1.', 'Every vertex starts ready (STATUS = 1).');
          S.K.push(S.src); S.status[S.src] = 2;
          R.step('2.', `STACK = [${S.src}].`);
          while (S.K.length) {
            const N = S.K.pop(); S.cur = N; S.status[N] = 3; S.out.push(N);
            R.step('  4.', `Pop ${N} and process it.`, { n: { [N]: 'act' } });
            const added = [];
            for (const { to } of A[N]) if (S.status[to] === 1) { S.status[to] = 2; S.orig[to] = N; S.K.push(to); added.push(to); }
            R.step('  5.', added.length ? `Push the ready neighbours ${added.join(', ')} (${added[added.length - 1]} is now on top).` : `No ready neighbours of ${N}.`, { n: { [N]: 'act' }, e: Object.fromEntries(added.map((t) => [ek(S.G, N, t), 'act'])) });
          }
        }
        S.cur = null;
        const unseen = S.G.nodes.filter((n) => S.status[n.id] === 1).map((n) => n.id);
        R.step(S.how === 'rec' ? '3.' : '6.', `DFS order: **${S.out.join(' ')}**.` + (unseen.length ? ` Not reachable from ${S.src}: ${unseen.join(', ')}.` : ''), {}, { tone: 'ok' });
      },
    },
    view(st, f) {
      const hl = Object.assign({}, Object.fromEntries(st.G.nodes.map((n) => [n.id, STCLS[status(st, n.id)]])), f.hl.n || {});
      const ehl = Object.assign({}, Object.fromEntries(Object.keys(st.orig).map((v) => [ek(st.G, st.orig[v], v), 'ok'])), f.hl.e || {});
      const sp = V.graph('G', st.G, { hl, ehl, sub: st.how === 'rec' ? undefined : Object.fromEntries(st.G.nodes.map((n) => [n.id, 'S=' + status(st, n.id)])) });
      sp.push(...V.row('K', st.K.map((v, i) => ({ id: 'k' + i + v, v })), { x: 500, y: 60, name: st.how === 'rec' ? 'Calls' : 'STACK', cw: 36, empty: '(empty)' }));
      if (st.K.length) sp.push(V.text('ktop', 500 + (st.K.length - 1) * 40 + 18, 108, 'top', 'idx act'));
      sp.push(...V.row('O', st.out.map((v) => ({ id: 'o' + v, v })), { x: 500, y: 150, name: 'Order', cw: 36, empty: '(none yet)' }));
      return { specs: sp, minH: 340, minW: 760 };
    },
  });

  /* ---------------- Topological sort ---------------- */
  DSA.sim({
    id: 'topo-sort', cat: 'graphs', title: 'Topological Sorting', short: 'Topological sort',
    tags: ['topological sort', 'indegree', 'dag', 'poset', 'scheduling', 'kahn'],
    blurb: 'Order the vertices of a directed acyclic graph so every edge points forward. Repeatedly output a vertex with in-degree 0 and delete its outgoing edges.',
    schaum: 'Schaum Ch. 8 · Posets; topological sorting',
    cx: [['Time', 'O(V + E)']],
    theory: `<p>A directed graph with no cycles describes a <b>partial order</b>: an edge S → T means “S must come before T” (a prerequisite, a task dependency). A <b>topological sort</b> lists the vertices so that every edge goes from left to right.</p>
      <p>The textbook algorithm keeps <code>INDEG(N)</code>, the number of edges entering N. Vertices with in-degree 0 have no remaining prerequisites, so they can go next; deleting their outgoing edges may free up more vertices. If the queue empties before all vertices are output, the graph contains a <b>cycle</b> and no topological order exists.</p>`,
    algo: { run: ['TOPOSORT(G)', '1. Find INDEG(N) for every vertex N.', '2. Put in QUEUE every vertex with INDEG = 0.', '3. Repeat Steps 4 and 5 until QUEUE is empty:', '  4. Remove the front vertex N of QUEUE and output it.', '  5. Repeat for each edge N → M: Set INDEG(M) := INDEG(M) − 1. [Delete the edge.]', '       If INDEG(M) = 0, then: Add M to the rear of QUEUE.', '6. Exit. [Vertices never output lie on a cycle.]'] },
    controls: [{ id: 'g', type: 'text', label: 'Edges', value: 'A>B, A>C, B>D, C>D, C>E, D>F, E>F, G>E', wide: true, run: true, presets: [['A>B, A>C, B>D, C>D, C>E, D>F, E>F, G>E', 'DAG, 7 vertices'], ['A>B, B>C, C>A, C>D', 'Has a cycle']] }, { type: 'btn', label: 'Sort', op: 'play', kind: 'primary' }, DRAG_NOTE],
    auto: 'run', mount: gmount, unmount: gunmount,
    init(p, page) { const G = makeGraph(p, page, { directed: true }); return { G, indeg: Object.fromEntries(G.nodes.map((n) => [n.id, 0])), Q: [], out: [], gone: {} }; },
    ops: {
      run(S, p, R) {
        const A = adj(S.G);
        S.G.edges.forEach((e) => S.indeg[e.v]++);
        R.vars(() => ({ QUEUE: S.Q.slice(), output: S.out.slice() }));
        R.step('1.', 'In-degrees computed (shown under each vertex).');
        S.G.nodes.forEach((n) => { if (!S.indeg[n.id]) S.Q.push(n.id); });
        R.step('2.', `In-degree 0: ${S.Q.join(', ') || 'none'} → QUEUE.`, { n: Object.fromEntries(S.Q.map((x) => [x, 'sel'])) });
        while (S.Q.length) {
          const N = S.Q.shift(); S.out.push(N);
          R.step('  4.', `Output ${N}.`, { n: { [N]: 'act' } });
          for (const { to } of A[N]) {
            S.indeg[to]--; S.gone[ek(S.G, N, to)] = true;
            if (!S.indeg[to]) S.Q.push(to);
            R.step('  5.', `Delete edge ${N} → ${to}: INDEG(${to}) = ${S.indeg[to]}` + (S.indeg[to] ? '.' : ` → ${to} joins the QUEUE.`), { n: { [N]: 'act', [to]: S.indeg[to] ? 'cmp' : 'sel' } });
          }
        }
        const left = S.G.nodes.filter((n) => !S.out.includes(n.id)).map((n) => n.id);
        R.step('6.', left.length ? `QUEUE is empty but ${left.join(', ')} were never output — **the graph has a cycle**, so no topological order exists.` : `Topological order: **${S.out.join(' → ')}**.`, left.length ? { n: Object.fromEntries(left.map((x) => [x, 'bad'])) } : {}, { tone: left.length ? 'bad' : 'ok' });
      },
    },
    view(st, f) {
      const hl = Object.assign({}, Object.fromEntries(st.out.map((x) => [x, 'ok'])), f.hl.n || {});
      const ehl = Object.fromEntries(Object.keys(st.gone).map((k) => [k, 'dim']));
      const sp = V.graph('G', st.G, { hl, ehl, sub: Object.fromEntries(st.G.nodes.map((n) => [n.id, 'in=' + st.indeg[n.id]])) });
      sp.push(...V.row('Q', st.Q.map((v) => ({ id: 'q' + v, v })), { x: 500, y: 60, name: 'QUEUE', cw: 36, empty: '(empty)' }));
      sp.push(...V.row('O', st.out.map((v) => ({ id: 'o' + v, v })), { x: 500, y: 140, name: 'Order', cw: 36, empty: '(none yet)' }));
      return { specs: sp, minH: 340, minW: 760 };
    },
  });

  /* ---------------- Dijkstra ---------------- */
  DSA.sim({
    id: 'dijkstra', cat: 'graphs', title: 'Dijkstra’s Shortest Paths', short: 'Dijkstra',
    tags: ['dijkstra', 'single source shortest path', 'greedy', 'relaxation', 'distance'],
    blurb: 'From a source vertex, repeatedly settle the unvisited vertex with the smallest tentative distance and relax its outgoing edges. Works when all weights are non-negative.',
    schaum: 'Beyond the textbook · single-source shortest paths',
    cx: [['Simple array version', 'O(V²)'], ['With a binary heap', 'O((V + E) log V)']],
    theory: `<p>Dijkstra's algorithm keeps a tentative distance <code>DIST[v]</code> for every vertex (∞ at first, 0 for the source). It is <b>greedy</b>: the unvisited vertex with the smallest DIST can never be improved later (all weights are ≥ 0), so it is settled. Then every edge leaving it is <b>relaxed</b>: if going through it is shorter, DIST and PRED are updated.</p>
      <p>The highlighted PRED edges form the <b>shortest-path tree</b>. With negative weights use Bellman–Ford (or Floyd–Warshall for all pairs) instead.</p>`,
    algo: { run: ['DIJKSTRA(G, S)', '1. Set DIST[S] := 0 and DIST[V] := ∞ for every other V; all vertices unvisited.', '2. Repeat until no reachable vertex is unvisited:', '  3. Select the unvisited vertex U with the smallest DIST; mark U visited.', '  4. Repeat for each edge U → V of weight W with V unvisited:', '       If DIST[U] + W < DIST[V], then: Set DIST[V] := DIST[U] + W and PRED[V] := U.', '5. Exit. [PRED edges form the shortest-path tree.]'] },
    controls: [{ id: 'g', type: 'text', label: 'Edges', value: SAMPLE_U, wide: true, run: true, presets: [[SAMPLE_U, 'Undirected, 6 vertices'], ['S>A:10, S>B:5, B>A:3, A>C:1, B>C:9, B>D:2, D>C:6, C>D:4, D>S:7', 'Directed (CLRS-style)']] }, { id: 'src', type: 'text', label: 'Source', value: 'A', w: 60, run: true }, { type: 'btn', label: 'Run', op: 'play', kind: 'primary' }, DRAG_NOTE],
    auto: 'run', mount: gmount, unmount: gunmount,
    init(p, page) {
      const G = makeGraph(p, page, { positive: true });
      const src = String(p.src).trim();
      if (!G.nodes.some((n) => n.id === src)) U.fail(`Source “${src}” is not in the graph.`);
      return { G, src, D: Object.fromEntries(G.nodes.map((n) => [n.id, Infinity])), pred: {}, done: {} };
    },
    ops: {
      run(S, p, R) {
        const A = adj(S.G);
        S.D[S.src] = 0;
        const tbl = () => ({ head: ['Vertex', 'DIST', 'PRED', 'Done'], rows: S.G.nodes.map((n) => [n.id, S.D[n.id] === Infinity ? INF : String(S.D[n.id]), S.pred[n.id] || '–', S.done[n.id] ? '✓' : '']), hi: -1 });
        R.table(tbl).vars(() => ({ settled: Object.keys(S.done).length }));
        R.step('1.', `DIST[${S.src}] := 0; every other DIST := ∞.`);
        for (;;) {
          let u = null;
          for (const n of S.G.nodes) if (!S.done[n.id] && S.D[n.id] < Infinity && (u == null || S.D[n.id] < S.D[u])) u = n.id;
          if (u == null) break;
          S.done[u] = true;
          R.step('  3.', `Smallest unvisited DIST is ${u} (${S.D[u]}) → settle it.`, { n: { [u]: 'act' } });
          for (const { to, w } of A[u]) {
            if (S.done[to]) continue;
            const nd = S.D[u] + w;
            if (nd < S.D[to]) { const old = S.D[to]; S.D[to] = nd; S.pred[to] = u; R.step('       If DIST', `Relax ${u} → ${to}: ${S.D[u]} + ${w} = ${nd} < ${old === Infinity ? INF : old} → DIST[${to}] := ${nd}.`, { n: { [u]: 'act', [to]: 'new' }, e: { [ek(S.G, u, to)]: 'act' } }); }
            else R.step('       If DIST', `${u} → ${to}: ${S.D[u]} + ${w} = ${nd} ≥ ${S.D[to]}, no change.`, { n: { [u]: 'act', [to]: 'cmp' }, e: { [ek(S.G, u, to)]: 'cmp' } });
          }
        }
        const unreach = S.G.nodes.filter((n) => S.D[n.id] === Infinity).map((n) => n.id);
        R.step('5.', 'All reachable vertices are settled. Highlighted edges form the shortest-path tree.' + (unreach.length ? ` Unreachable: ${unreach.join(', ')}.` : ''), {}, { tone: 'ok' });
      },
    },
    view(st, f) {
      const hl = Object.assign({}, Object.fromEntries(Object.keys(st.done).map((x) => [x, 'ok'])), f.hl.n || {});
      const ehl = Object.assign({}, Object.fromEntries(Object.keys(st.pred).map((v) => [ek(st.G, st.pred[v], v), 'ok'])), f.hl.e || {});
      const sp = V.graph('G', st.G, { weights: true, hl, ehl, sub: Object.fromEntries(st.G.nodes.map((n) => [n.id, st.D[n.id] === Infinity ? INF : 'd=' + st.D[n.id]])) });
      return { specs: sp, minH: 340, minW: 520 };
    },
  });

  /* ---------------- Prim ---------------- */
  DSA.sim({
    id: 'prim', cat: 'graphs', title: 'Minimum Spanning Tree — Prim', short: 'Prim’s MST',
    tags: ['prim', 'minimum spanning tree', 'mst', 'greedy'],
    blurb: 'Grow one tree from a start vertex, always adding the cheapest edge that connects a new vertex to the tree.',
    schaum: 'Beyond the textbook · minimum spanning trees',
    cx: [['Array version', 'O(V²)'], ['With a heap', 'O(E log V)']],
    theory: `<p>A <b>spanning tree</b> of a connected, undirected graph uses V − 1 edges to connect all V vertices without a cycle; a <b>minimum</b> spanning tree has the least total weight (cheapest network of roads, cables, pipes…).</p>
      <p>Prim's algorithm keeps <code>KEY[v]</code> = the cheapest edge joining v to the tree so far. Each round it adds the vertex with the smallest KEY and updates its neighbours' keys — the same shape as Dijkstra, but KEY is one edge weight, not a path length.</p>`,
    algo: { run: ['PRIM(G, S)', '1. Set KEY[S] := 0 and KEY[V] := ∞ for all other V; the tree T is empty.', '2. Repeat until every vertex is in T:', '  3. Add to T the vertex U not in T with the smallest KEY (with edge PRED[U] – U).', '  4. Repeat for each edge U – V with V not in T:', '       If W(U, V) < KEY[V], then: Set KEY[V] := W(U, V) and PRED[V] := U.', '5. Exit. [T is a minimum spanning tree.]'] },
    controls: [{ id: 'g', type: 'text', label: 'Edges', value: SAMPLE_U, wide: true, run: true, presets: [[SAMPLE_U, '6 vertices'], ['A-B:7, A-D:5, B-C:8, B-D:9, B-E:7, C-E:5, D-E:15, D-F:6, E-F:8, E-G:9, F-G:11', '7 vertices (classic)']] }, { id: 'src', type: 'text', label: 'Start', value: 'A', w: 60, run: true }, { type: 'btn', label: 'Run', op: 'play', kind: 'primary' }, DRAG_NOTE],
    auto: 'run', mount: gmount, unmount: gunmount,
    init(p, page) {
      const G = makeGraph(p, page, { directed: false });
      const src = String(p.src).trim();
      if (!G.nodes.some((n) => n.id === src)) U.fail(`Start “${src}” is not in the graph.`);
      return { G, src, K: Object.fromEntries(G.nodes.map((n) => [n.id, Infinity])), pred: {}, inT: {}, total: 0 };
    },
    ops: {
      run(S, p, R) {
        const A = adj(S.G);
        S.K[S.src] = 0;
        R.table(() => ({ head: ['Vertex', 'KEY', 'PRED', 'In T'], rows: S.G.nodes.map((n) => [n.id, S.K[n.id] === Infinity ? INF : String(S.K[n.id]), S.pred[n.id] || '–', S.inT[n.id] ? '✓' : '']), hi: -1 })).vars(() => ({ 'tree weight': S.total, 'tree edges': Object.keys(S.inT).length ? Object.keys(S.inT).length - 1 : 0 }));
        R.step('1.', `KEY[${S.src}] := 0, all other keys ∞.`);
        for (;;) {
          let u = null;
          for (const n of S.G.nodes) if (!S.inT[n.id] && S.K[n.id] < Infinity && (u == null || S.K[n.id] < S.K[u])) u = n.id;
          if (u == null) break;
          S.inT[u] = true; if (S.pred[u]) S.total += S.K[u];
          R.step('  3.', S.pred[u] ? `Cheapest connection: ${S.pred[u]} – ${u} (weight ${S.K[u]}) → add ${u} to T.` : `Start the tree at ${u}.`, { n: { [u]: 'act' }, e: S.pred[u] ? { [ek(S.G, S.pred[u], u)]: 'new' } : {} });
          for (const { to, w } of A[u]) {
            if (S.inT[to]) continue;
            if (w < S.K[to]) { const old = S.K[to]; S.K[to] = w; S.pred[to] = u; R.step('       If W', `Edge ${u} – ${to} (${w}) beats KEY[${to}] = ${old === Infinity ? INF : old} → KEY[${to}] := ${w}.`, { n: { [u]: 'act', [to]: 'new' }, e: { [ek(S.G, u, to)]: 'cmp' } }); }
          }
        }
        const missing = S.G.nodes.filter((n) => !S.inT[n.id]).map((n) => n.id);
        R.step('5.', missing.length ? `The graph is not connected (${missing.join(', ')} unreachable); this is a spanning tree of one component, weight ${S.total}.` : `Minimum spanning tree complete: total weight **${S.total}**.`, {}, { tone: 'ok' });
      },
    },
    view(st, f) {
      const hl = Object.assign({}, Object.fromEntries(Object.keys(st.inT).map((x) => [x, 'ok'])), f.hl.n || {});
      const ehl = Object.assign({}, Object.fromEntries(Object.keys(st.pred).filter((v) => st.inT[v]).map((v) => [ek(st.G, st.pred[v], v), 'ok'])), f.hl.e || {});
      return { specs: V.graph('G', st.G, { weights: true, hl, ehl, sub: Object.fromEntries(st.G.nodes.map((n) => [n.id, st.K[n.id] === Infinity ? INF : 'key ' + st.K[n.id]])) }), minH: 340, minW: 520 };
    },
  });

  /* ---------------- Kruskal ---------------- */
  DSA.sim({
    id: 'kruskal', cat: 'graphs', title: 'Minimum Spanning Tree — Kruskal', short: 'Kruskal’s MST',
    tags: ['kruskal', 'minimum spanning tree', 'mst', 'union find', 'disjoint sets'],
    blurb: 'Sort all edges by weight and take each one unless it would close a cycle — detected with union–find (disjoint sets).',
    schaum: 'Beyond the textbook · minimum spanning trees',
    cx: [['Sorting edges', 'O(E log E)'], ['Union–find operations', 'almost O(1) each']],
    theory: `<p>Kruskal's algorithm builds a <b>forest</b> that gradually merges into one tree. Edges are considered from lightest to heaviest; an edge is accepted only if its two ends are in <b>different components</b>. Components are tracked with a <b>union–find</b> structure: FIND returns the representative of a vertex's set, UNION merges two sets.</p>
      <p>Prim and Kruskal always find a tree of the same (minimum) weight, though they may choose different edges when weights tie.</p>`,
    algo: { run: ['KRUSKAL(G)', '1. Sort the edges by increasing weight; put every vertex in its own set.', '2. Repeat for each edge U – V in that order, until T has M − 1 edges:', '  3. If FIND(U) ≠ FIND(V), then: add U – V to T and UNION the two sets.', '     Else: skip the edge. [It would form a cycle.]', '4. Exit.'] },
    controls: [{ id: 'g', type: 'text', label: 'Edges', value: SAMPLE_U, wide: true, run: true, presets: [[SAMPLE_U, '6 vertices'], ['A-B:7, A-D:5, B-C:8, B-D:9, B-E:7, C-E:5, D-E:15, D-F:6, E-F:8, E-G:9, F-G:11', '7 vertices (classic)']] }, { type: 'btn', label: 'Run', op: 'play', kind: 'primary' }, DRAG_NOTE],
    auto: 'run', mount: gmount, unmount: gunmount,
    init(p, page) { const G = makeGraph(p, page, { directed: false }); return { G, set: Object.fromEntries(G.nodes.map((n) => [n.id, n.id])), T: [], rej: [], total: 0, cur: null }; },
    ops: {
      run(S, p, R) {
        const find = (x) => (S.set[x] === x ? x : (S.set[x] = find(S.set[x])));
        const order = S.G.edges.slice().sort((a, b) => a.w - b.w || (a.u + a.v < b.u + b.v ? -1 : 1));
        const m = S.G.nodes.length;
        R.table(() => ({ head: ['Edge', 'Weight', 'Decision'], rows: order.map((e) => { const k = ek(S.G, e.u, e.v); return [`${e.u}–${e.v}`, String(e.w), S.T.includes(k) ? 'take' : S.rej.includes(k) ? 'skip (cycle)' : '']; }), hi: S.cur == null ? -1 : S.cur })).vars(() => ({ 'tree edges': S.T.length, 'tree weight': S.total }));
        R.step('1.', `Edges sorted by weight: ${order.map((e) => `${e.u}${e.v}(${e.w})`).join(', ')}.`);
        for (let i = 0; i < order.length && S.T.length < m - 1; i++) {
          const e = order[i], k = ek(S.G, e.u, e.v); S.cur = i;
          const a = find(e.u), b = find(e.v);
          if (a !== b) { S.set[a] = b; S.T.push(k); S.total += e.w; R.step('  3.', `${e.u} and ${e.v} are in different components → take ${e.u}–${e.v} (${e.w}).`, { e: { [k]: 'new' } }); }
          else { S.rej.push(k); R.step('     Else', `${e.u} and ${e.v} are already connected → skip ${e.u}–${e.v}; it would form a cycle.`, { e: { [k]: 'bad' } }); }
        }
        S.cur = null;
        R.step('4.', S.T.length === m - 1 ? `Spanning tree with ${S.T.length} edges, total weight **${S.total}**.` : `The graph is disconnected: a minimum spanning forest of weight ${S.total}.`, {}, { tone: 'ok' });
      },
    },
    view(st, f) {
      const ehl = Object.assign({}, Object.fromEntries(st.T.map((k) => [k, 'ok'])), Object.fromEntries(st.rej.map((k) => [k, 'dim'])), f.hl.e || {});
      const comps = {};
      const root = (x) => { while (st.set[x] !== x) x = st.set[x]; return x; };
      st.G.nodes.forEach((n) => (comps[n.id] = root(n.id)));
      const roots = [...new Set(Object.values(comps))];
      const tones = ['act', 'sel', 'cmp', 'ok', 'path', 'new'];
      const hl = Object.fromEntries(st.G.nodes.map((n) => [n.id, roots.length > 1 && st.T.length ? tones[roots.indexOf(comps[n.id]) % tones.length] : st.T.length ? 'ok' : '']));
      return { specs: V.graph('G', st.G, { weights: true, hl, ehl }), minH: 340, minW: 520 };
    },
  });

  DSA.graphs = { parseGraph, layout };
})(typeof window !== 'undefined' ? window : globalThis);
