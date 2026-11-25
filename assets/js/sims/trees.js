/* DSA Lab · sims/trees.js — Binary trees (Schaum Ch. 7) */
(function (g) {
  'use strict';
  const DSA = g.DSA, U = DSA.U, V = DSA.V;
  const TREES = [
    ['A B C D E - G - - F H - - - - J K', 'Textbook-style 10 nodes'],
    ['A B C D E F G', 'Complete, 7 nodes'],
    ['1 2 3 4 5 6 7 8 9', 'Numbers 1–9'],
    ['A B - C - D', 'Left-skewed chain'],
    ['F B G A D - I - - C E H', 'BST-shaped (F B G …)'],
  ];
  /* Build from level order; "-" or "null" is an empty position. */
  function buildLevel(str) {
    const toks = String(str).trim().split(/[\s,]+/).filter(Boolean);
    if (!toks.length || toks[0] === '-') U.fail('Enter the tree in level order, e.g. A B C D E - G (use - for an empty child).');
    if (toks.length > 31) U.fail('Use at most 31 positions.');
    toks.forEach((t) => { if (t.length > 3) U.fail(`Keep node labels to 3 characters (“${t}”).`); });
    const mk = (v) => ({ id: 'n' + U.uid(''), v: /^-?\d+$/.test(v) ? Number(v) : v, l: null, r: null });
    const root = mk(toks[0]);
    const q = [root]; let i = 1;
    while (q.length && i < toks.length) {
      const nd = q.shift();
      for (const side of ['l', 'r']) {
        if (i >= toks.length) break;
        const t = toks[i++];
        if (t !== '-' && t.toLowerCase() !== 'null') { nd[side] = mk(t); q.push(nd[side]); }
      }
    }
    return root;
  }
  const nodesOf = (root) => { const out = []; (function w(n) { if (!n) return; out.push(n); w(n.l); w(n.r); })(root); return out; };
  const byId = (root) => Object.fromEntries(nodesOf(root).map((n) => [n.id, n]));

  /* ---------------- Traversals ---------------- */
  const ORDER = { pre: 'Preorder (N L R)', in: 'Inorder (L N R)', post: 'Postorder (L R N)', level: 'Level order (BFS)' };
  DSA.sim({
    id: 'bt-traversal', cat: 'trees', title: 'Binary Tree Traversals', short: 'Traversals (pre/in/post/level)',
    tags: ['preorder', 'inorder', 'postorder', 'level order', 'traversal', 'stack', 'tree walk'],
    blurb: 'Visit every node of a binary tree in preorder, inorder, postorder or level order — recursively, or with an explicit STACK exactly as the textbook algorithms do.',
    schaum: 'Schaum Ch. 7 · Traversing binary trees; traversal algorithms using stacks',
    cx: [['Any traversal of n nodes', 'O(n)'], ['Stack / recursion depth', 'O(height)'], ['Level order queue', 'O(width)']],
    theory: `<p>The three classic depth-first orders differ only in <b>when the root is processed</b>:</p>
      <ul><li><b>Preorder</b>: root, left subtree, right subtree (N L R).</li><li><b>Inorder</b>: left subtree, root, right subtree (L N R) — gives sorted order for a binary search tree.</li><li><b>Postorder</b>: left, right, root (L R N) — children before parents, e.g. to free a tree or evaluate an expression tree.</li></ul>
      <p><b>Level order</b> uses a queue and visits the tree row by row.</p>
      <p>The textbook's stack algorithms replace recursion: <i>preorder</i> pushes right children for later and walks left; <i>inorder</i> pushes the whole left-most path, then pops; <i>postorder</i> also pushes <code>−RIGHT</code> markers, and a negative value popped means “now go and do that right subtree”.</p>`,
    algo: {
      'pre-rec': ['PREORDER(PTR) — recursive', '1. If PTR = NULL, then: Return.', '2. Apply PROCESS to INFO[PTR].', '3. Call PREORDER(LEFT[PTR]).', '4. Call PREORDER(RIGHT[PTR]).', '5. Return.'],
      'in-rec': ['INORDER(PTR) — recursive', '1. If PTR = NULL, then: Return.', '2. Call INORDER(LEFT[PTR]).', '3. Apply PROCESS to INFO[PTR].', '4. Call INORDER(RIGHT[PTR]).', '5. Return.'],
      'post-rec': ['POSTORDER(PTR) — recursive', '1. If PTR = NULL, then: Return.', '2. Call POSTORDER(LEFT[PTR]).', '3. Call POSTORDER(RIGHT[PTR]).', '4. Apply PROCESS to INFO[PTR].', '5. Return.'],
      'pre-stack': ['PREORD(INFO, LEFT, RIGHT, ROOT) — with a stack', '1. Set TOP := 1, STACK[1] := NULL and PTR := ROOT.', '2. Repeat Steps 3 to 5 while PTR ≠ NULL:', '  3. Apply PROCESS to INFO[PTR].', '  4. [Right child?] If RIGHT[PTR] ≠ NULL, then: Push RIGHT[PTR].', '  5. [Left child?] If LEFT[PTR] ≠ NULL, then: Set PTR := LEFT[PTR].', '     Else: Set PTR := STACK[TOP] and TOP := TOP − 1. [Pop.]', '6. Exit.'],
      'in-stack': ['INORD(INFO, LEFT, RIGHT, ROOT) — with a stack', '1. Set TOP := 1, STACK[1] := NULL and PTR := ROOT.', '2. Repeat while PTR ≠ NULL: [Push the left-most path.]', '     Push PTR and Set PTR := LEFT[PTR].', '3. Set PTR := STACK[TOP] and TOP := TOP − 1. [Pop.]', '4. Repeat Steps 5 to 7 while PTR ≠ NULL:', '  5. Apply PROCESS to INFO[PTR].', '  6. If RIGHT[PTR] ≠ NULL, then: Set PTR := RIGHT[PTR], and go to Step 2.', '  7. Set PTR := STACK[TOP] and TOP := TOP − 1. [Pop.]', '8. Exit.'],
      'post-stack': ['POSTORD(INFO, LEFT, RIGHT, ROOT) — with a stack', '1. Set TOP := 1, STACK[1] := NULL and PTR := ROOT.', '2. Repeat Steps 3 to 5 while PTR ≠ NULL: [Left-most path.]', '  3. Push PTR.', '  4. If RIGHT[PTR] ≠ NULL, then: Push −RIGHT[PTR]. [A marker.]', '  5. Set PTR := LEFT[PTR].', '6. Set PTR := STACK[TOP] and TOP := TOP − 1. [Pop.]', '7. Repeat while PTR > 0: Apply PROCESS to INFO[PTR]; Pop into PTR.', '8. If PTR < 0, then: Set PTR := −PTR, and go to Step 2.', '9. Exit.'],
      level: ['LEVELORDER(ROOT) — with a queue', '1. Insert ROOT into QUEUE.', '2. Repeat while QUEUE is not empty:', '  3. Delete PTR from the front of QUEUE and PROCESS INFO[PTR].', '  4. Insert LEFT[PTR] and RIGHT[PTR] (if not NULL) at the rear.', '5. Exit.'],
    },
    controls: [
      { id: 'tree', type: 'text', label: 'Tree (level order)', value: TREES[0][0], wide: true, run: true, presets: TREES },
      { type: 'br' },
      { id: 'order', type: 'select', label: 'Order', value: 'in', run: true, opts: Object.entries(ORDER) },
      { id: 'how', type: 'select', label: 'Method', value: 'stack', run: true, opts: [['rec', 'Recursive (call stack)'], ['stack', 'Textbook stack algorithm']] },
      { type: 'btn', label: 'Traverse', op: 'play', kind: 'primary' },
    ],
    auto: 'run',
    init(p) { return { root: buildLevel(p.tree), out: [], stack: [], cur: null, order: p.order, how: p.order === 'level' ? 'queue' : p.how }; },
    ops: {
      run(S, p, R) {
        const N = byId(S.root);
        const visit = (id, line) => { S.out.push(id); R.step(line, `PROCESS **${N[id].v}**.`, { vis: id }); };
        const lab = (x) => (typeof x === 'string' && x[0] === '-' ? '−' + N[x.slice(1)].v : x && N[x] ? N[x].v : 'NULL');
        R.vars(() => ({ PTR: lab(S.cur), visited: S.out.length, [S.how === 'queue' ? 'QUEUE' : 'STACK']: S.stack.map(lab) }));
        if (S.order === 'level') {
          R.algo('level');
          S.stack = [S.root.id];
          R.step('1.', `QUEUE ← ${S.root.v}.`);
          while (S.stack.length) {
            const id = S.stack.shift(); S.cur = id;
            visit(id, '  3.');
            const n = N[id];
            if (n.l) S.stack.push(n.l.id); if (n.r) S.stack.push(n.r.id);
            R.step('  4.', `Enqueue the children of ${n.v}: ${[n.l, n.r].filter(Boolean).map((c) => c.v).join(', ') || 'none'}.`, { vis: id });
          }
        } else if (S.how === 'rec') {
          const k = S.order;
          R.algo(k + '-rec');
          const call = (id) => {
            if (!id) { R.step('1.', 'PTR = NULL — return immediately.'); return; }
            S.stack.push(id); S.cur = id;
            R.step(null, `Call on ${N[id].v} (call stack depth ${S.stack.length}).`);
            const n = N[id];
            if (k === 'pre') { visit(id, '2.'); R.step('3.', `Go left from ${n.v}.`); call(n.l && n.l.id); S.cur = id; R.step('4.', `Back at ${n.v}; go right.`); call(n.r && n.r.id); }
            if (k === 'in') { R.step('2.', `Go left from ${n.v}.`); call(n.l && n.l.id); S.cur = id; visit(id, '3.'); R.step('4.', `Go right from ${n.v}.`); call(n.r && n.r.id); }
            if (k === 'post') { R.step('2.', `Go left from ${n.v}.`); call(n.l && n.l.id); S.cur = id; R.step('3.', `Back at ${n.v}; go right.`); call(n.r && n.r.id); S.cur = id; visit(id, '4.'); }
            S.stack.pop(); S.cur = S.stack[S.stack.length - 1] || null;
            R.step('5.', `Return from ${n.v}.`);
          };
          call(S.root.id);
        } else if (S.order === 'pre') {
          R.algo('pre-stack');
          S.stack = [null]; S.cur = S.root.id;
          R.step('1.', 'STACK := [NULL], PTR := ROOT.');
          while (S.cur) {
            const n = N[S.cur];
            visit(S.cur, '  3.');
            if (n.r) { S.stack.push(n.r.id); R.step('  4.', `Push the right child ${n.r.v} for later.`); }
            if (n.l) { S.cur = n.l.id; R.step('  5.', `PTR := LEFT = ${n.l.v}.`); }
            else { S.cur = S.stack.pop(); R.step('     Else', S.cur ? `No left child — pop ${N[S.cur].v}.` : 'No left child — pop NULL: done.'); }
          }
        } else if (S.order === 'in') {
          R.algo('in-stack');
          S.stack = [null]; S.cur = S.root.id;
          R.step('1.', 'STACK := [NULL], PTR := ROOT.');
          for (;;) {
            while (S.cur) { S.stack.push(S.cur); const n = N[S.cur]; S.cur = n.l ? n.l.id : null; R.step('     Push', `Push ${n.v}; PTR := LEFT[${n.v}] = ${n.l ? n.l.v : 'NULL'}.`); }
            S.cur = S.stack.pop();
            R.step('3.', S.cur ? `Pop ${N[S.cur].v}.` : 'Pop NULL.');
            let jumped = false;
            while (S.cur) {
              const n = N[S.cur];
              visit(S.cur, '  5.');
              if (n.r) { S.cur = n.r.id; R.step('  6.', `${n.v} has a right child ${n.r.v} → go to Step 2.`); jumped = true; break; }
              S.cur = S.stack.pop();
              R.step('  7.', S.cur ? `Pop ${N[S.cur].v}.` : 'Pop NULL — the stack is empty.');
            }
            if (!jumped) break;
          }
        } else {
          R.algo('post-stack');
          S.stack = [null]; S.cur = S.root.id;
          R.step('1.', 'STACK := [NULL], PTR := ROOT.');
          for (;;) {
            while (S.cur) {
              const n = N[S.cur];
              S.stack.push(S.cur); R.step('  3.', `Push ${n.v}.`);
              if (n.r) { S.stack.push('-' + n.r.id); R.step('  4.', `Push −${n.r.v} (do ${n.r.v}'s subtree later).`); }
              S.cur = n.l ? n.l.id : null; R.step('  5.', `PTR := LEFT = ${n.l ? n.l.v : 'NULL'}.`);
            }
            S.cur = S.stack.pop();
            R.step('6.', S.cur ? `Pop ${S.cur[0] === '-' ? '−' + N[S.cur.slice(1)].v : N[S.cur].v}.` : 'Pop NULL.');
            while (S.cur && S.cur[0] !== '-') { visit(S.cur, '7.'); S.cur = S.stack.pop(); R.step('7.', S.cur ? `Pop ${S.cur[0] === '-' ? '−' + N[S.cur.slice(1)].v : N[S.cur].v}.` : 'Pop NULL.'); }
            if (S.cur && S.cur[0] === '-') { S.cur = S.cur.slice(1); R.step('8.', `Negative marker: PTR := ${N[S.cur].v}, back to Step 2.`); continue; }
            break;
          }
        }
        S.cur = null;
        R.step(null, `${ORDER[S.order]}: **${S.out.map((id) => N[id].v).join(' ')}**`, {}, { tone: 'ok' });
      },
    },
    view(st, f) {
      const N = byId(st.root);
      const hl = {};
      st.out.forEach((id) => (hl[id] = 'ok'));
      if (st.how !== 'queue') st.stack.forEach((id) => { if (id && N[id]) hl[id] = hl[id] || 'sel'; });
      const curId = st.cur && st.cur[0] === '-' ? st.cur.slice(1) : st.cur;
      if (curId && N[curId]) hl[curId] = 'act';
      if (f.hl.vis) hl[f.hl.vis] = 'new';
      const sp = V.tree('T', st.root, { x: 0, y: 30, dx: 52, dy: 66, hl, sub: (n) => (st.out.indexOf(n.id) >= 0 ? '#' + (st.out.indexOf(n.id) + 1) : undefined), ptrs: curId && N[curId] ? [{ id: curId, label: st.cur[0] === '-' ? 'PTR < 0' : 'PTR', cls: 'act' }] : [] });
      const L = sp.layout;
      const y = 30 + (L.depth + 1) * 66 + 20;
      sp.push(...V.row('O', st.out.map((id) => ({ id: 'o' + id, v: N[id].v })), { x: 0, y, name: 'Output', cw: 34, empty: '(nothing yet)' }));
      const lab = st.how === 'queue' ? 'QUEUE' : st.how === 'rec' ? 'Calls' : 'STACK';
      const items = st.stack.map((x, i) => ({ id: 's' + i + (x || 'null'), v: x == null ? 'NULL' : x[0] === '-' ? '−' + N[x.slice(1)].v : N[x].v, cls: x == null ? 'dim' : x[0] === '-' ? 'cmp' : '' }));
      sp.push(...V.row('S', items, { x: 0, y: y + 54, name: lab, cw: 44, empty: '(empty)' }));
      return { specs: sp, minH: 330, minW: 560 };
    },
  });

  /* ---------------- Representations ---------------- */
  DSA.sim({
    id: 'bt-repr', cat: 'trees', title: 'Representing a Binary Tree in Memory', short: 'Linked & array representation',
    tags: ['sequential representation', 'array representation', 'linked representation', 'INFO LEFT RIGHT', 'complete binary tree'],
    blurb: 'Linked: three parallel arrays INFO, LEFT, RIGHT plus ROOT. Sequential: one array TREE where the children of TREE[K] live at 2K and 2K + 1.',
    schaum: 'Schaum Ch. 7 · Representing binary trees in memory',
    cx: [['Linked representation', '3n cells'], ['Sequential, depth d', 'up to 2^(d+1) − 1 cells']],
    theory: `<p><b>Linked representation</b>: node K has <code>INFO[K]</code>, <code>LEFT[K]</code> and <code>RIGHT[K]</code>; <code>ROOT</code> holds the root's location and NULL (0) marks a missing child. Unused cells would be chained into an AVAIL list as for linked lists.</p>
      <p><b>Sequential representation</b>: <code>TREE[1]</code> is the root; if a node is in <code>TREE[K]</code> its left child is in <code>TREE[2K]</code> and its right child in <code>TREE[2K + 1]</code>; its parent is in <code>TREE[⌊K/2⌋]</code>. No pointers are stored, but sparse or skewed trees waste many cells — try the left-skewed example. Complete trees (and heaps) fit perfectly.</p>`,
    algo: { run: ['SEQUENTIAL(T) — place each node', '1. Put the root in TREE[1].', '2. For a node in TREE[K]:', '     its left child goes to TREE[2K];', '     its right child goes to TREE[2K + 1].', '3. Cells with no node hold NULL.'] },
    controls: [{ id: 'tree', type: 'text', label: 'Tree (level order)', value: 'A B C D E - G - - F H', wide: true, run: true, presets: TREES }, { type: 'btn', label: 'Build both', op: 'play', kind: 'primary' }],
    auto: 'run',
    init(p) { return { root: buildLevel(p.tree), seq: {}, loc: {}, cur: null }; },
    ops: {
      run(S, p, R) {
        const nodes = [];
        (function w(n, k) { if (!n) return; nodes.push([n, k]); w(n.l, 2 * k); w(n.r, 2 * k + 1); })(S.root, 1);
        nodes.sort((a, b) => a[1] - b[1]);
        const maxK = Math.max(...nodes.map((x) => x[1]));
        if (maxK > 63) U.fail(`This tree needs TREE[1..${maxK}] — too many cells to draw. Use a shallower tree.`);
        R.vars(() => ({ K: S.cur ? S.cur[1] : '–', 'cells needed': maxK, nodes: nodes.length }));
        nodes.forEach(([n, k], i) => {
          S.seq[k] = n.id; S.loc[n.id] = i + 1; S.cur = [n.id, k];
          R.step(k === 1 ? '1.' : k % 2 ? '     its right' : '     its left', k === 1 ? `Root ${n.v} → TREE[1].` : `${n.v} is the ${k % 2 ? 'right' : 'left'} child of TREE[${Math.floor(k / 2)}] → TREE[${k}] = TREE[2·${Math.floor(k / 2)}${k % 2 ? ' + 1' : ''}].`);
        });
        S.cur = null;
        R.step('3.', `Sequential: ${maxK} cells for ${nodes.length} nodes (${maxK - nodes.length} wasted). Linked: ${nodes.length} rows of INFO/LEFT/RIGHT.`, {}, { tone: 'ok' });
      },
    },
    view(st) {
      const N = byId(st.root);
      const hl = {};
      Object.values(st.seq).forEach((id) => (hl[id] = 'ok'));
      if (st.cur) hl[st.cur[0]] = 'act';
      const sp = V.tree('T', st.root, { x: 0, y: 20, dx: 46, dy: 62, r: 19, hl, top: (n) => (st.loc[n.id] ? 'loc ' + st.loc[n.id] : undefined) });
      const L = sp.layout;
      const ty = 20 + (L.depth + 1) * 62 + 30;
      const maxK = Math.max(1, ...Object.keys(st.seq).map(Number));
      sp.push(V.text('st', 0, ty - 26, 'Sequential: TREE[1..' + maxK + ']', 'title', 'start'));
      for (let k = 1; k <= maxK; k++) {
        const per = 16, x = ((k - 1) % per) * 40, y = ty + Math.floor((k - 1) / per) * 66;
        const id = st.seq[k];
        sp.push(V.box('q' + k, x, y, 36, 32, id ? N[id].v : '', 'cell ' + (st.cur && st.cur[1] === k ? 'new' : id ? '' : 'slot'), { rx: 4, fs: 13, sub: String(k) }));
      }
      // linked representation table
      const lx = L.count * 46 + 40;
      const rows = Object.keys(st.loc).map((id) => N[id]).sort((a, b) => st.loc[a.id] - st.loc[b.id]);
      sp.push(V.text('lt', lx, 4, 'Linked: ROOT = ' + (rows.length ? st.loc[st.root.id] : 'NULL'), 'title', 'start'));
      ['INFO', 'LEFT', 'RIGHT'].forEach((h, j) => sp.push(V.text('lh' + j, lx + 40 + j * 54 + 25, 26, h, 'idx')));
      rows.forEach((n, i) => {
        const y = 34 + i * 28;
        sp.push(V.text('lr' + n.id, lx + 24, y + 17, st.loc[n.id], 'idx', 'end'));
        sp.push(V.box('li' + n.id, lx + 40, y, 50, 25, n.v, 'mcell ' + (st.cur && st.cur[0] === n.id ? 'new' : ''), { rx: 3, fs: 12 }));
        sp.push(V.box('ll' + n.id, lx + 94, y, 50, 25, n.l && st.loc[n.l.id] ? st.loc[n.l.id] : 0, 'mcell', { rx: 3, fs: 12 }));
        sp.push(V.box('lR' + n.id, lx + 148, y, 50, 25, n.r && st.loc[n.r.id] ? st.loc[n.r.id] : 0, 'mcell', { rx: 3, fs: 12 }));
      });
      return { specs: sp, minH: 320, minW: 600 };
    },
  });

  /* ---------------- Expression tree ---------------- */
  DSA.sim({
    id: 'expression-tree', cat: 'trees', title: 'Expression Trees', short: 'Expression tree',
    tags: ['expression tree', 'parse tree', 'prefix', 'infix', 'postfix', 'evaluate'],
    blurb: 'Build the binary tree of an arithmetic expression from its postfix form with a stack of subtrees, then read prefix, infix and postfix off its traversals.',
    schaum: 'Schaum Ch. 7 · Algebraic expressions as binary trees',
    cx: [['Build from postfix', 'O(n)'], ['Evaluate', 'O(n)']],
    theory: `<p>Any expression built from binary operators is a binary tree: operators are internal nodes and operands are leaves. The three traversals give the three notations: <b>preorder → prefix</b> (Polish), <b>inorder → infix</b> (add parentheses around every subtree), <b>postorder → postfix</b> (reverse Polish).</p>
      <p>Building from postfix: scan left to right; an operand becomes a one-node tree pushed on the stack; an operator pops two trees (right first, then left), becomes their parent, and the new tree is pushed. Evaluating is a postorder traversal.</p>`,
    algo: { run: ['BUILD(P) — expression tree from postfix P', '1. Scan P left to right; for each symbol X:', '  2. If X is an operand, then: Push a new leaf node X.', '  3. If X is an operator, then:', '       Pop T1 (right subtree) and T2 (left subtree);', '       make a node X with LEFT := T2, RIGHT := T1; Push it.', '4. The single tree left on the stack is the expression tree.'] },
    controls: [{ id: 'e', type: 'text', label: 'Infix expression', value: '( A + B * C ) * ( D - E / F )', wide: true, run: true, presets: [['( A + B * C ) * ( D - E / F )', '(A + B·C)·(D − E/F)'], ['( 3 + 4 ) * 5 - 6 / 2', '(3 + 4)·5 − 6/2'], ['A + B * C - D', 'A + B·C − D']] }, { type: 'btn', label: 'Build', op: 'play', kind: 'primary' }],
    auto: 'run',
    init(p) {
      const toks = DSA.expr.tokInfix(p.e);
      const PREC = DSA.expr.PREC, out = [], st = [];
      for (const t of toks) {
        if (PREC[t] == null && t !== '(' && t !== ')') out.push(t);
        else if (t === '(') st.push(t);
        else if (t === ')') { while (st[st.length - 1] !== '(') out.push(st.pop()); st.pop(); }
        else { while (st.length && st[st.length - 1] !== '(' && (PREC[st[st.length - 1]] > PREC[t] || (PREC[st[st.length - 1]] === PREC[t] && t !== '^'))) out.push(st.pop()); st.push(t); }
      }
      while (st.length) out.push(st.pop());
      return { post: out, i: null, stack: [], root: null, res: null };
    },
    ops: {
      run(S, p, R) {
        const PREC = DSA.expr.PREC;
        R.vars(() => ({ X: S.i == null ? '–' : S.post[S.i], 'stack size': S.stack.length }));
        R.step(null, `Postfix form: ${S.post.join(' ')}. Build the tree from it.`);
        S.post.forEach((t, i) => {
          S.i = i;
          if (PREC[t] == null) { S.stack.push({ id: 'x' + i, v: t, l: null, r: null }); R.step('  2.', `Operand ${t} → push a leaf.`, { nw: 'x' + i }); }
          else { const r = S.stack.pop(), l = S.stack.pop(); S.stack.push({ id: 'x' + i, v: t, l, r }); R.step('       make', `Operator ${t}: pop ${r.v === undefined ? '' : 'right'} and left subtrees, join them under “${t}”.`, { nw: 'x' + i }); }
        });
        S.root = S.stack[0]; S.i = null;
        const pre = [], ino = [], post = [];
        (function w(n) { if (!n) return; pre.push(n.v); w(n.l); w(n.r); })(S.root);
        (function w(n) { if (!n) return; if (n.l) { ino.push('('); w(n.l); } ino.push(n.v); if (n.r) { w(n.r); ino.push(')'); } })(S.root);
        (function w(n) { if (!n) return; w(n.l); w(n.r); post.push(n.v); })(S.root);
        S.res = { pre: pre.join(' '), in: ino.join(' ').replace(/\( /g, '(').replace(/ \)/g, ')'), post: post.join(' ') };
        const numeric = S.post.every((t) => PREC[t] != null || /^\d+(\.\d+)?$/.test(t));
        if (numeric) {
          const ev = (n) => (n.l ? ({ '+': (a, b) => a + b, '-': (a, b) => a - b, '*': (a, b) => a * b, '/': (a, b) => a / b, '%': (a, b) => a % b, '^': Math.pow })[n.v](ev(n.l), ev(n.r)) : Number(n.v));
          S.res.val = Math.round(ev(S.root) * 1e6) / 1e6;
        }
        R.step('4.', 'Tree complete. Preorder gives prefix, inorder gives infix, postorder gives postfix.' + (S.res.val != null ? ` Value = **${S.res.val}**.` : ''), {}, { tone: 'ok' });
      },
    },
    view(st, f) {
      const sp = [];
      let x = 0;
      const trees = st.root ? [st.root] : st.stack;
      trees.forEach((t, k) => {
        const part = V.tree('E', t, { x, y: 30, dx: 40, dy: 58, r: 18, hl: f.hl.nw ? { [f.hl.nw]: 'new' } : {} });
        sp.push(...part);
        x += part.layout.count * 40 + 30;
        if (!st.root) sp.push(V.text('lbl' + k, x - 30 - (part.layout.count * 40) / 2, 10, k === trees.length - 1 ? 'top' : '', 'idx'));
      });
      if (st.res) {
        const y = 30 + 58 * 5 + 10;
        sp.push(V.text('rp', 0, y, 'Prefix:   ' + st.res.pre, 'note', 'start'));
        sp.push(V.text('ri', 0, y + 24, 'Infix:    ' + st.res.in, 'note', 'start'));
        sp.push(V.text('rq', 0, y + 48, 'Postfix:  ' + st.res.post, 'note', 'start'));
      }
      return { specs: sp, minH: 330, minW: 560 };
    },
  });

  /* ---------------- Threaded binary tree ---------------- */
  DSA.sim({
    id: 'threaded-bt', cat: 'trees', title: 'Threaded Binary Trees', short: 'Threaded tree',
    tags: ['threads', 'inorder threading', 'header node', 'stackless traversal'],
    blurb: 'Replace empty RIGHT links by threads to the inorder successor (and empty LEFT links by threads to the predecessor). Inorder traversal then needs no stack at all.',
    schaum: 'Schaum Ch. 7 · Header nodes; threads',
    cx: [['Inorder traversal', 'O(n), no stack'], ['Extra memory', '1 flag bit per link']],
    theory: `<p>In a binary tree with n nodes, <code>n + 1</code> of the <code>2n</code> link fields are NULL. <b>Threading</b> puts them to work: a NULL <code>RIGHT</code> link is replaced by a pointer (a <b>thread</b>, drawn dashed) to the node's <b>inorder successor</b>; in a <b>two-way</b> threaded tree a NULL <code>LEFT</code> link points to the inorder predecessor. A flag bit tells threads from ordinary links.</p>
      <p>The first and last nodes have no predecessor/successor; their threads point to a <b>header node</b>. To traverse in inorder: go to the left-most node, then repeatedly follow either the thread or (if there is a real right child) one step right and then all the way left.</p>`,
    algo: {
      run: ['Inorder threading', '1. List the nodes in inorder: N₁, N₂, …, Nₙ.', '2. For each node Nᵢ with RIGHT = NULL: Set RIGHT := Nᵢ₊₁ (thread). [Nₙ → HEAD.]', '3. [Two-way] For each node Nᵢ with LEFT = NULL: Set LEFT := Nᵢ₋₁ (thread). [N₁ → HEAD.]', '4. Mark every thread with its flag bit.'],
      walk: ['Threaded inorder traversal (no stack)', '1. Set PTR := left-most node of the tree.', '2. Repeat while PTR ≠ HEAD:', '  3. PROCESS INFO[PTR].', '  4. If RIGHT[PTR] is a thread, then: Set PTR := RIGHT[PTR].', '     Else: Set PTR := RIGHT[PTR], then go left until LEFT is a thread.', '5. Exit.'],
    },
    controls: [
      { id: 'tree', type: 'text', label: 'Tree (level order)', value: 'A B C D E - G - - F H', wide: true, run: true, presets: TREES },
      { id: 'kind', type: 'select', label: 'Threads', value: 'two', run: true, opts: [['one', 'One-way (right threads)'], ['two', 'Two-way']] },
      { type: 'btn', label: 'Thread & traverse', op: 'play', kind: 'primary' },
    ],
    auto: 'run',
    init(p) { return { root: buildLevel(p.tree), threads: [], two: p.kind === 'two', out: [], cur: null }; },
    ops: {
      run(S, p, R) {
        const N = byId(S.root), ino = [];
        (function w(n) { if (!n) return; w(n.l); ino.push(n.id); w(n.r); })(S.root);
        R.vars(() => ({ threads: S.threads.length, PTR: S.cur ? N[S.cur].v : '–' }));
        R.step('1.', `Inorder: ${ino.map((id) => N[id].v).join(' ')}.`);
        ino.forEach((id, i) => {
          const n = N[id];
          if (!n.r) { S.threads.push({ from: id, to: ino[i + 1] || null, side: 'r' }); R.step('2.', `${n.v} has no right child → thread to its successor ${ino[i + 1] ? N[ino[i + 1]].v : 'HEAD'}.`, { th: id }); }
          if (S.two && !n.l) { S.threads.push({ from: id, to: i ? ino[i - 1] : null, side: 'l' }); R.step('3.', `${n.v} has no left child → thread to its predecessor ${i ? N[ino[i - 1]].v : 'HEAD'}.`, { th: id }); }
        });
        R.step('4.', `${S.threads.length} threads added. Now traverse in inorder using only links and threads.`);
        R.algo('walk');
        let cur = S.root; while (cur.l) cur = cur.l;
        S.cur = cur.id;
        R.step('1.', `Start at the left-most node, ${cur.v}.`);
        while (S.cur) {
          const n = N[S.cur];
          S.out.push(S.cur);
          R.step('  3.', `PROCESS ${n.v}.`);
          if (!n.r) { const t = S.threads.find((x) => x.from === S.cur && x.side === 'r'); S.cur = t.to; R.step('  4.', S.cur ? `RIGHT is a thread → jump straight to ${N[S.cur].v}.` : 'RIGHT thread points to HEAD — done.', { thr: n.id }); }
          else { let c = n.r; while (c.l) c = c.l; S.cur = c.id; R.step('     Else', `Real right child → go right to ${n.r.v}, then left as far as possible: ${c.v}.`); }
        }
        R.step('5.', `Inorder: ${S.out.map((id) => N[id].v).join(' ')} — visited with no stack.`, {}, { tone: 'ok' });
      },
    },
    view(st, f) {
      const hl = {};
      st.out.forEach((id) => (hl[id] = 'ok'));
      if (st.cur) hl[st.cur] = 'act';
      const L0 = V.treeLayout(st.root, { x: 60, y: 90, dx: 56, dy: 70 });
      const header = { x: 60 + ((L0.count - 1) * 56) / 2, y: 0 };
      const sp = [V.box('HEAD', header.x - 34, header.y, 68, 32, 'HEAD', 'hdr', { rx: 6 })];
      sp.push(...V.tree('T', st.root, { x: 60, y: 90, dx: 56, dy: 70, hl, nulls: true, header, threads: st.threads.map((t) => Object.assign({ cls: f.hl.thr === t.from && t.side === 'r' ? 'act' : f.hl.th === t.from ? 'new' : '' }, t)) }));
      sp.push(V.line('Hroot', header.x, header.y + 32, header.x, 90 - 22, 'edge', true));
      return { specs: sp, minH: 340, minW: 560 };
    },
  });

  /* ---------------- General tree → binary tree ---------------- */
  DSA.sim({
    id: 'general-tree', cat: 'trees', title: 'General Trees as Binary Trees', short: 'General tree → binary tree',
    tags: ['general tree', 'left child right sibling', 'forest', 'm-ary'],
    blurb: 'Any tree, with any number of children per node, can be stored as a binary tree: LEFT points to the first child and RIGHT to the next sibling.',
    schaum: 'Schaum Ch. 7 · General trees',
    cx: [['Conversion', 'O(n)'], ['Links per node', 'exactly 2']],
    theory: `<p>A <b>general tree</b> allows any number of children, which makes a fixed node layout awkward. The textbook's solution, known as the <b>left-child, right-sibling</b> representation, uses two links per node:</p>
      <ul><li><code>CHILD</code> (drawn as LEFT) — the node's first (left-most) child;</li><li><code>SIBL</code> (drawn as RIGHT) — the next sibling to its right.</li></ul>
      <p>The result is a binary tree, so all binary-tree algorithms apply. Preorder of the general tree equals preorder of the binary tree; postorder of the general tree equals inorder of the binary tree.</p>`,
    algo: { run: ['CONVERT(general tree T) — child / sibling', '1. For each node N of T:', '  2. Set LEFT[N] := the first child of N (or NULL).', '  3. Set RIGHT[N] := the next sibling of N (or NULL).', '4. The root keeps RIGHT = NULL; the binary tree is ready.'] },
    controls: [{ id: 'g', type: 'text', label: 'Children', value: 'A: B C D; B: E F; D: G H I; F: J', wide: true, run: true, ph: 'parent: children; …' }, { type: 'btn', label: 'Convert', op: 'play', kind: 'primary' }],
    auto: 'run',
    init(p) {
      const kids = {}, parent = {}; let order = [];
      String(p.g).split(';').map((s) => s.trim()).filter(Boolean).forEach((part) => {
        const m = part.match(/^(\w{1,3})\s*:\s*(.*)$/);
        if (!m) U.fail(`Write each part as “parent: child child …” (problem near “${part}”).`);
        const cs = m[2].split(/[\s,]+/).filter(Boolean);
        cs.forEach((c) => { if (c.length > 3) U.fail('Keep labels to 3 characters.'); if (parent[c]) U.fail(`${c} has two parents.`); parent[c] = m[1]; });
        kids[m[1]] = (kids[m[1]] || []).concat(cs); order.push(m[1], ...cs);
      });
      const roots = [...new Set(order)].filter((x) => !parent[x]);
      if (roots.length !== 1) U.fail(roots.length ? `Found ${roots.length} roots (${roots.join(', ')}); a tree has exactly one.` : 'There is a cycle — a tree has a root with no parent.');
      const mk = (v, seen) => { if (seen.has(v)) U.fail('There is a cycle in the description.'); seen.add(v); return { id: 'g' + v, v, kids: (kids[v] || []).map((c) => mk(c, seen)) }; };
      const root = mk(roots[0], new Set());
      if (nodesOfG(root).length > 18) U.fail('Use at most 18 nodes.');
      return { root, links: [], cur: null };
    },
    ops: {
      run(S, p, R) {
        R.vars(() => ({ 'binary links': S.links.length }));
        const walk = (n) => {
          S.cur = n.id;
          if (n.kids.length) { S.links.push({ from: n.id, to: n.kids[0].id, side: 'l' }); R.step('  2.', `LEFT[${n.v}] := first child ${n.kids[0].v}.`); }
          else R.step('  2.', `${n.v} has no children: LEFT[${n.v}] := NULL.`);
          n.kids.forEach((c, i) => { if (n.kids[i + 1]) { S.cur = c.id; S.links.push({ from: c.id, to: n.kids[i + 1].id, side: 'r' }); R.step('  3.', `RIGHT[${c.v}] := next sibling ${n.kids[i + 1].v}.`); } });
          n.kids.forEach(walk);
        };
        walk(S.root);
        S.cur = null;
        R.step('4.', 'Every node now has at most two links: first child (left) and next sibling (right).', {}, { tone: 'ok' });
      },
    },
    view(st) {
      const sp = V.gtree('G', st.root, { x: 0, y: 30, hl: st.cur ? { [st.cur]: 'act' } : {} });
      const w = sp.layout.width;
      const all = nodesOfG(st.root);
      const byV = Object.fromEntries(all.map((n) => [n.id, { id: n.id, v: n.v, l: null, r: null }]));
      st.links.forEach((k) => { byV[k.from][k.side] = byV[k.to]; });
      const broot = byV[st.root.id];
      sp.push(V.text('t1', w / 2, 0, 'General tree', 'title'));
      const bx = w + 80;
      const bt = V.tree('B', broot, { x: bx, y: 30, dx: 40, dy: 56, r: 17, hl: st.cur ? { [st.cur]: 'act' } : {} });
      sp.push(...bt);
      sp.push(V.text('t2', bx + ((bt.layout.count - 1) * 40) / 2, 0, 'Binary (child–sibling) tree', 'title'));
      return { specs: sp, minH: 300, minW: 620 };
    },
  });
  function nodesOfG(root) { const out = []; (function w(n) { out.push(n); n.kids.forEach(w); })(root); return out; }
  DSA.trees = { buildLevel, nodesOf, byId };
})(typeof window !== 'undefined' ? window : globalThis);
