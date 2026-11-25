/* DSA Lab · sims/searchtrees.js — BST, AVL and B-trees (Schaum Ch. 7) */
(function (g) {
  'use strict';
  const DSA = g.DSA, U = DSA.U, V = DSA.V;
  const mk = (v) => ({ id: U.uid('t'), v, l: null, r: null, h: 1 });
  const randKeys = (n) => () => U.randList(n, 1, 99, true).join(', ');
  const ids = (root) => { const o = []; (function w(n) { if (n) { o.push(n); w(n.l); w(n.r); } })(root); return o; };
  const setChild = (S, par, old, nw) => { if (!par) S.root = nw; else if (par.l === old) par.l = nw; else par.r = nw; };
  const count = (root) => ids(root).length;
  const tooBig = (S, R) => { if (count(S.root) >= 31) { R.step(null, 'The demo keeps at most 31 nodes so the tree stays readable.', {}, { tone: 'bad' }); return true; } return false; };

  function treeView(st, f, o) {
    o = o || {};
    const hl = Object.assign({}, f.hl.n || {}), ehl = {};
    (f.hl.path || []).forEach((id) => { hl[id] = hl[id] || 'path'; ehl[id] = 'path'; });
    const sp = V.tree('T', st.root, Object.assign({ x: 0, y: 40, dx: 48, dy: 66, hl, ehl, ptrs: f.hl.ptrs || [] }, o));
    if (!st.root) sp.push(V.text('empty', 0, 40, 'ROOT = NULL (empty tree)', 'muted', 'start'));
    if (st.out && st.out.length) sp.push(...V.row('O', st.out.map((v, i) => ({ id: 'o' + i, v })), { x: 0, y: 40 + (sp.layout.depth + 1) * 66 + 16, name: 'Inorder', cw: 36 }));
    return { specs: sp, minH: 300, minW: 560 };
  }

  /* ======================= Binary search tree ======================= */
  DSA.sim({
    id: 'bst', cat: 'searchtrees', title: 'Binary Search Tree', short: 'Binary search tree',
    tags: ['bst', 'binary search tree', 'insert', 'delete', 'successor', 'find'],
    blurb: 'Every key in a node’s left subtree is smaller and every key in its right subtree is larger. Search, insert and delete (leaf, one child, two children via the inorder successor).',
    schaum: 'Schaum Ch. 7 · Binary search trees',
    cx: [['Search / insert / delete (average)', 'O(log n)'], ['Worst case (skewed tree)', 'O(n)'], ['Inorder traversal', 'sorted order']],
    theory: `<p>A <b>binary search tree</b> keeps, for every node N, all values in the left subtree <b>less than</b> INFO[N] and all values in the right subtree <b>greater</b>. Searching therefore follows a single path from the root — like binary search, but the structure can grow and shrink cheaply.</p>
      <p>The textbook's procedure <code>FIND</code> returns <code>LOC</code> (the node, or NULL) and <code>PAR</code> (its parent). Deletion has two cases:</p>
      <ul><li><b>Case A</b>: the node has no children or one child — replace it in its parent by that child (or NULL).</li><li><b>Case B</b>: the node has two children — find its <b>inorder successor</b> SUC (left-most node of the right subtree), remove SUC by Case A, and put SUC in the deleted node's place.</li></ul>
      <p>Inserting already sorted keys produces a skewed tree of height n — try the dice, then insert 10, 20, 30, 40 into an empty tree. Self-balancing trees such as <a href="#/sim/avl">AVL trees</a> prevent this.</p>`,
    algo: {
      find: ['FIND(INFO, LEFT, RIGHT, ROOT, ITEM, LOC, PAR)', '1. [Empty tree?] If ROOT = NULL, then: Set LOC := NULL, PAR := NULL, and Return.', '2. Set PTR := ROOT and SAVE := NULL.', '3. Repeat while PTR ≠ NULL:', '     If ITEM = INFO[PTR], then: Set LOC := PTR, PAR := SAVE, and Return.', '     Set SAVE := PTR.', '     If ITEM < INFO[PTR], then: Set PTR := LEFT[PTR]. Else: Set PTR := RIGHT[PTR].', '4. [Not found.] Set LOC := NULL and PAR := SAVE.', '5. Return.'],
      ins: ['INSBST(INFO, LEFT, RIGHT, ROOT, ITEM)', '1. Call FIND(…, ITEM, LOC, PAR).', '2. If LOC ≠ NULL, then: Exit. [ITEM is already in the tree.]', '3. Allocate NEW: INFO[NEW] := ITEM, LEFT[NEW] := RIGHT[NEW] := NULL.', '4. If PAR = NULL, then: Set ROOT := NEW.', '   Else if ITEM < INFO[PAR], then: Set LEFT[PAR] := NEW.', '   Else: Set RIGHT[PAR] := NEW.', '5. Exit.'],
      del: ['DEL(INFO, LEFT, RIGHT, ROOT, ITEM)', '1. Call FIND(…, ITEM, LOC, PAR). If LOC = NULL, then: Write: not found, and Exit.', '2. If LOC has two children, then: [Case B]', '     Find SUC := left-most node of RIGHT[LOC] and its parent PARSUC.', '     Remove SUC by Case A; put SUC in LOC’s place (it takes both subtrees).', '3. Else: [Case A — no child or one child]', '     Set CHILD := LEFT[LOC] or RIGHT[LOC] (or NULL); replace LOC by CHILD in PAR.', '4. Free node LOC and Exit.'],
      inorder: ['INORDER(ROOT)', '1. Traverse left subtree, visit node, traverse right subtree.', '2. For a BST this lists the keys in increasing order.'],
    },
    controls: [
      { id: 'init', type: 'text', label: 'Build from', value: '50, 30, 70, 20, 40, 60, 80, 35, 45, 65', wide: true, reset: true, rand: randKeys(10) },
      { type: 'br' },
      { id: 'item', type: 'num', label: 'ITEM', value: 30, w: 80 },
      { type: 'btn', label: 'Insert', op: 'ins', kind: 'primary' },
      { type: 'btn', label: 'Search', op: 'find' },
      { type: 'btn', label: 'Delete', op: 'del', kind: 'danger' },
      { type: 'btn', label: 'Inorder', op: 'inorder' },
    ],
    init(p) {
      const S = { root: null, out: [] };
      const vals = String(p.init).trim() ? U.nums(p.init, { min: 0, max: 31, name: 'keys' }) : [];
      for (const v of vals) { let par = null, cur = S.root; while (cur && cur.v !== v) { par = cur; cur = v < cur.v ? cur.l : cur.r; } if (cur) continue; const n = mk(v); if (!par) S.root = n; else if (v < par.v) par.l = n; else par.r = n; }
      return S;
    },
    vars0: (S) => ({ nodes: count(S.root) }),
    find(S, ITEM, R) {
      R.algo('find');
      let ptr = S.root, save = null; const path = [];
      if (!ptr) { R.step('1.', 'ROOT = NULL — the tree is empty.'); return { loc: null, par: null, path }; }
      R.step('2.', `PTR := ROOT (${ptr.v}).`, { ptrs: [{ id: ptr.id, label: 'PTR', cls: 'act' }] });
      while (ptr) {
        path.push(ptr.id);
        if (ITEM === ptr.v) { R.step('     If ITEM', `${ITEM} = INFO[PTR] — found.`, { path: path.slice(), n: { [ptr.id]: 'ok' } }); return { loc: ptr, par: save, path }; }
        save = ptr;
        const go = ITEM < ptr.v ? 'l' : 'r';
        R.step('     If ITEM <', `${ITEM} ${ITEM < ptr.v ? '<' : '>'} ${ptr.v} → go ${go === 'l' ? 'left' : 'right'}.`, { path: path.slice(), n: { [ptr.id]: 'cmp' }, ptrs: [{ id: ptr.id, label: 'PTR', cls: 'act' }] });
        ptr = ptr[go];
      }
      R.step('4.', `Fell off the tree: LOC := NULL, PAR := ${save ? save.v : 'NULL'}.`, { path: path.slice(), ptrs: save ? [{ id: save.id, label: 'PAR', cls: 'sel' }] : [] });
      return { loc: null, par: save, path };
    },
    ops: {
      find(S, p, R) {
        const ITEM = U.num(p.item, { name: 'ITEM' });
        R.vars(() => ({ ITEM }));
        const r = this.find(S, ITEM, R);
        R.step('5.', r.loc ? `**Found ${ITEM}** after ${r.path.length} comparison(s).` : `${ITEM} is not in the tree (${r.path.length} comparison(s)).`, { path: r.path, n: r.loc ? { [r.loc.id]: 'ok' } : {} }, { tone: r.loc ? 'ok' : 'bad' });
      },
      ins(S, p, R) {
        const ITEM = U.num(p.item, { name: 'ITEM' });
        R.vars(() => ({ ITEM }));
        if (tooBig(S, R)) return;
        const r = this.find(S, ITEM, R);
        R.algo('ins');
        if (r.loc) { R.step('2.', `${ITEM} is already in the tree — nothing to insert.`, { path: r.path, n: { [r.loc.id]: 'ok' } }, { tone: 'cmp' }); return; }
        const nw = mk(ITEM);
        if (!r.par) { S.root = nw; R.step('4.', `PAR = NULL → ROOT := NEW (${ITEM}).`, { n: { [nw.id]: 'new' } }, { tone: 'ok' }); return; }
        if (ITEM < r.par.v) { r.par.l = nw; R.step('Else if', `${ITEM} < ${r.par.v} → LEFT[PAR] := NEW.`, { path: r.path, n: { [nw.id]: 'new' } }, { tone: 'ok' }); }
        else { r.par.r = nw; R.step('Else:', `${ITEM} > ${r.par.v} → RIGHT[PAR] := NEW.`, { path: r.path, n: { [nw.id]: 'new' } }, { tone: 'ok' }); }
      },
      del(S, p, R) {
        const ITEM = U.num(p.item, { name: 'ITEM' });
        R.vars(() => ({ ITEM }));
        const r = this.find(S, ITEM, R);
        R.algo('del');
        if (!r.loc) { R.step('1.', `${ITEM} is not in the tree — nothing deleted.`, {}, { tone: 'bad' }); return; }
        const loc = r.loc, par = r.par;
        if (loc.l && loc.r) {
          R.step('2.', `${ITEM} has two children → Case B.`, { n: { [loc.id]: 'bad' } });
          let parsuc = loc, suc = loc.r; const path = [suc.id];
          R.step('     Find SUC', `Go right once to ${suc.v}…`, { n: { [loc.id]: 'bad', [suc.id]: 'cmp' }, path: path.slice() });
          while (suc.l) { parsuc = suc; suc = suc.l; path.push(suc.id); R.step('     Find SUC', `…then left to ${suc.v}.`, { n: { [loc.id]: 'bad', [suc.id]: 'cmp' }, path: path.slice() }); }
          R.step('     Find SUC', `SUC = ${suc.v} is the inorder successor (smallest key larger than ${ITEM}).`, { n: { [loc.id]: 'bad', [suc.id]: 'sel' } });
          setChild(S, parsuc, suc, suc.r);
          R.step('     Remove SUC', `Remove ${suc.v} from its place (it has no left child)${suc.r ? `; ${suc.r.v} moves up` : ''}.`, { n: { [loc.id]: 'bad' } });
          suc.l = loc.l; suc.r = loc.r; setChild(S, par, loc, suc);
          R.step('     Remove SUC', `${suc.v} takes the place of ${ITEM}, adopting both subtrees.`, { n: { [suc.id]: 'new' } });
        } else {
          const child = loc.l || loc.r;
          R.step('3.', child ? `${ITEM} has one child (${child.v}) → Case A.` : `${ITEM} is a leaf → Case A.`, { n: { [loc.id]: 'bad' } });
          setChild(S, par, loc, child);
          R.step('     Set CHILD', child ? `${child.v} replaces ${ITEM} under ${par ? par.v : 'ROOT'}.` : par ? `${par.v} now has NULL where ${ITEM} was.` : 'The tree is now empty.', child ? { n: { [child.id]: 'new' } } : {});
        }
        R.step('4.', `Deleted ${ITEM}.`, {}, { tone: 'ok' });
      },
      inorder(S, p, R) {
        R.algo('inorder');
        S.out = [];
        ids(S.root).sort((a, b) => a.v - b.v).forEach((n) => { S.out.push(n.v); R.step('1.', `Visit ${n.v}.`, { n: { [n.id]: 'act' } }); });
        R.step('2.', `Sorted: ${S.out.join(', ')}.`, {}, { tone: 'ok' });
        S.out = [];
      },
    },
    view: treeView,
  });

  /* ======================= AVL tree ======================= */
  const Hh = (n) => (n ? n.h : 0);
  const upd = (n) => { n.h = 1 + Math.max(Hh(n.l), Hh(n.r)); };
  const BF = (n) => Hh(n.l) - Hh(n.r);
  const rotR = (y) => { const x = y.l; y.l = x.r; x.r = y; upd(y); upd(x); return x; };
  const rotL = (x) => { const y = x.r; x.r = y.l; y.l = x; upd(x); upd(y); return y; };
  function rebalance(S, path, R, ITEM) {
    for (let i = path.length - 1; i >= 0; i--) {
      const { node: z, par, side } = path[i];
      upd(z);
      const b = BF(z);
      if (Math.abs(b) <= 1) { R.step('2.', `Height of ${z.v} = ${z.h}, balance factor ${b > 0 ? '+' : ''}${b} — OK.`, { n: { [z.id]: 'act' } }); continue; }
      let kind, top;
      if (b > 1) {
        kind = BF(z.l) >= 0 ? 'LL' : 'LR';
        R.step('3.', `**${z.v} is unbalanced** (BF = +${b}). Case ${kind}.`, { n: { [z.id]: 'bad', [z.l.id]: 'cmp' } });
        if (kind === 'LR') { const c = z.l; z.l = rotL(c); R.step('     LR', `First rotate left at ${c.v} (turns LR into LL).`, { n: { [z.id]: 'bad', [z.l.id]: 'sel' } }); }
        top = rotR(z);
      } else {
        kind = BF(z.r) <= 0 ? 'RR' : 'RL';
        R.step('3.', `**${z.v} is unbalanced** (BF = ${b}). Case ${kind}.`, { n: { [z.id]: 'bad', [z.r.id]: 'cmp' } });
        if (kind === 'RL') { const c = z.r; z.r = rotR(c); R.step('     RL', `First rotate right at ${c.v} (turns RL into RR).`, { n: { [z.id]: 'bad', [z.r.id]: 'sel' } }); }
        top = rotL(z);
      }
      if (!par) S.root = top; else par[side] = top;
      R.step(kind === 'LL' || kind === 'LR' ? '     LL' : '     RR', `Rotate ${kind === 'LL' || kind === 'LR' ? 'right' : 'left'} at ${z.v}: ${top.v} moves up. Balanced again.`, { n: { [top.id]: 'ok', [z.id]: 'sel' } });
    }
  }
  DSA.sim({
    id: 'avl', cat: 'searchtrees', title: 'AVL Tree (height-balanced BST)', short: 'AVL tree',
    tags: ['avl', 'balance factor', 'rotation', 'LL', 'RR', 'LR', 'RL', 'height balanced'],
    blurb: 'A BST where the heights of every node’s two subtrees differ by at most 1. After each insert or delete, single or double rotations restore balance. Badges show balance factors.',
    schaum: 'Schaum Ch. 7 · AVL search trees',
    cx: [['Search / insert / delete', 'O(log n) guaranteed'], ['Height', '< 1.44 log₂(n + 2)'], ['Rotations per insert', 'at most 1 (single or double)']],
    theory: `<p>The <b>balance factor</b> of a node is <code>BF = height(left) − height(right)</code>. An AVL tree keeps every BF in {−1, 0, +1}. After an insertion, walk back up the path; the first node with BF = ±2 is the <b>pivot</b>, and one of four cases applies:</p>
      <ul><li><b>LL</b> (inserted in the left child's left subtree) → single <b>right</b> rotation.</li><li><b>RR</b> → single <b>left</b> rotation.</li><li><b>LR</b> → left rotation at the child, then right rotation at the pivot.</li><li><b>RL</b> → right rotation at the child, then left rotation at the pivot.</li></ul>
      <p>Deletion uses ordinary BST deletion (replacing a two-child node by its inorder successor's key) and may need rotations at several ancestors. Insert 10, 20, 30 to see RR, or 30, 10, 20 to see LR.</p>`,
    algo: {
      ins: ['AVL_INSERT(ROOT, ITEM)', '1. Insert ITEM as in a BST, remembering the path from ROOT.', '2. Walk back up the path, updating each node’s height and balance factor.', '3. At the first node with |BF| = 2, rotate:', '     LL: single right rotation.', '     RR: single left rotation.', '     LR: left rotation at the child, then right rotation.', '     RL: right rotation at the child, then left rotation.', '4. Exit. [After one rebalance the insertion is complete.]'],
      del: ['AVL_DELETE(ROOT, ITEM)', '1. Delete ITEM as in a BST (two children → copy the inorder successor’s key, delete the successor).', '2. Walk back up the path, updating heights and balance factors.', '3. At every node with |BF| = 2, rotate as for insertion:', '     LL: single right rotation.', '     RR: single left rotation.', '     LR: left rotation at the child, then right rotation.', '     RL: right rotation at the child, then left rotation.', '4. Exit. [Several rotations may be needed.]'],
      find: ['SEARCH — same as a BST', '1. Compare ITEM with the node and go left or right.', '2. Height is O(log n), so at most about 1.44 log₂ n comparisons.'],
    },
    controls: [
      { id: 'init', type: 'text', label: 'Build from', value: '30, 20, 40, 10, 25, 35, 50', wide: true, reset: true, rand: randKeys(8), presets: [['10, 20, 30', 'RR case: 10, 20, 30'], ['30, 10, 20', 'LR case: 30, 10, 20'], ['50, 40, 30, 20, 10', 'Sorted input stays balanced'], ['', 'Empty tree']] },
      { type: 'br' },
      { id: 'item', type: 'num', label: 'ITEM', value: 5, w: 80 },
      { type: 'btn', label: 'Insert', op: 'ins', kind: 'primary' },
      { type: 'btn', label: 'Delete', op: 'del', kind: 'danger' },
      { type: 'btn', label: 'Search', op: 'find' },
    ],
    init(p) {
      const S = { root: null };
      const vals = String(p.init).trim() ? U.nums(p.init, { min: 0, max: 31, name: 'keys' }) : [];
      const quiet = { step() {}, algo() { return this; }, vars() { return this; } };
      vals.forEach((v) => this.insert(S, v, quiet));
      return S;
    },
    insert(S, ITEM, R) {
      const path = [];
      let par = null, side = null, cur = S.root;
      while (cur) {
        path.push({ node: cur, par, side });
        if (ITEM === cur.v) { R.step('1.', `${ITEM} is already in the tree.`, { n: { [cur.id]: 'ok' } }, { tone: 'cmp' }); return false; }
        R.step('1.', `${ITEM} ${ITEM < cur.v ? '<' : '>'} ${cur.v} → go ${ITEM < cur.v ? 'left' : 'right'}.`, { n: { [cur.id]: 'cmp' }, path: path.map((x) => x.node.id) });
        par = cur; side = ITEM < cur.v ? 'l' : 'r'; cur = cur[side];
      }
      const nw = mk(ITEM);
      if (!par) S.root = nw; else par[side] = nw;
      R.step('1.', `Attach ${ITEM} as a new leaf.`, { n: { [nw.id]: 'new' } });
      rebalance(S, path, R, ITEM);
      return true;
    },
    vars0: (S) => ({ nodes: count(S.root), height: Hh(S.root) }),
    ops: {
      ins(S, p, R) {
        const ITEM = U.num(p.item, { name: 'ITEM' });
        R.algo('ins').vars(() => ({ ITEM, height: Hh(S.root), nodes: count(S.root) }));
        if (tooBig(S, R)) return;
        if (this.insert(S, ITEM, R)) R.step('4.', `Inserted ${ITEM}. Tree height = ${Hh(S.root)}.`, {}, { tone: 'ok' });
      },
      del(S, p, R) {
        const ITEM = U.num(p.item, { name: 'ITEM' });
        R.algo('del').vars(() => ({ ITEM, height: Hh(S.root), nodes: count(S.root) }));
        const path = [];
        let par = null, side = null, cur = S.root;
        while (cur && cur.v !== ITEM) { path.push({ node: cur, par, side }); R.step('1.', `${ITEM} ${ITEM < cur.v ? '<' : '>'} ${cur.v}.`, { n: { [cur.id]: 'cmp' } }); par = cur; side = ITEM < cur.v ? 'l' : 'r'; cur = cur[side]; }
        if (!cur) { R.step('1.', `${ITEM} is not in the tree.`, {}, { tone: 'bad' }); return; }
        R.step('1.', `Found ${ITEM}.`, { n: { [cur.id]: 'bad' } });
        if (cur.l && cur.r) {
          path.push({ node: cur, par, side });
          let sp = cur, sside = 'r', s = cur.r;
          while (s.l) { path.push({ node: s, par: sp, side: sside }); sp = s; sside = 'l'; s = s.l; }
          R.step('1.', `Two children: the inorder successor is ${s.v}. Copy ${s.v} into this node, then delete the successor.`, { n: { [cur.id]: 'bad', [s.id]: 'sel' } });
          cur.v = s.v;
          sp[sside] = s.r;
          R.step('1.', `Successor removed from its old place.`, { n: { [cur.id]: 'new' } });
        } else {
          const child = cur.l || cur.r;
          if (!par) S.root = child; else par[side] = child;
          R.step('1.', child ? `One child: ${child.v} takes its place.` : 'It was a leaf: simply removed.');
        }
        rebalance(S, path, R, ITEM);
        R.step('4.', `Deleted ${ITEM}. Tree height = ${Hh(S.root)}.`, {}, { tone: 'ok' });
      },
      find(S, p, R) {
        const ITEM = U.num(p.item, { name: 'ITEM' });
        R.algo('find');
        let cur = S.root, k = 0;
        while (cur) { k++; if (cur.v === ITEM) { R.step('1.', `**Found ${ITEM}** with ${k} comparison(s).`, { n: { [cur.id]: 'ok' } }, { tone: 'ok' }); return; } R.step('1.', `${ITEM} ${ITEM < cur.v ? '<' : '>'} ${cur.v}.`, { n: { [cur.id]: 'cmp' } }); cur = ITEM < cur.v ? cur.l : cur.r; }
        R.step('2.', `${ITEM} is not in the tree (${k} comparisons).`, {}, { tone: 'bad' });
      },
    },
    view(st, f) { return treeView(st, f, { badge: (n) => { const b = Hh(n.l) - Hh(n.r); return (b > 0 ? '+' : '') + b; } }); },
  });

  /* ======================= m-way search tree ======================= */
  let mid = 0;
  const mnode = (keys) => ({ id: 'M' + (++mid), keys: keys.slice(), kids: Array(keys.length + 1).fill(null) });
  DSA.sim({
    id: 'mway', cat: 'searchtrees', title: 'm-way Search Tree', short: 'm-way search tree',
    tags: ['m-way', 'multiway search tree', 'search tree of order m'],
    blurb: 'A node holds up to m − 1 sorted keys and m subtree pointers; all keys in subtree i lie between keys i − 1 and i. No balancing — compare with the B-tree.',
    schaum: 'Schaum Ch. 7 · m-way search trees',
    cx: [['Search / insert / delete', 'O(height) node visits'], ['Height (unbalanced)', 'up to n / (m − 1)']],
    theory: `<p>An <b>m-way search tree</b> generalises the binary search tree. Each node has the form <code>[A₀, K₁, A₁, K₂, …, K_n, A_n]</code> with <code>n ≤ m − 1</code> keys in increasing order, and every key in subtree <code>Aᵢ</code> lies between <code>Kᵢ</code> and <code>Kᵢ₊₁</code>.</p>
      <ul><li><b>Insert</b>: search for the key; if the node where the search ends has room, put it there; otherwise hang a new one-key node on the empty subtree pointer.</li><li><b>Delete Kᵢ</b>: if both neighbouring subtrees are empty, just remove it; otherwise replace it with the largest key of <code>Aᵢ₋₁</code> (or the smallest of <code>Aᵢ</code>) and delete that key instead.</li></ul>
      <p>Nothing keeps the tree balanced, so inserting sorted keys produces a long chain — the motivation for <a href="#/sim/btree">B-trees</a>.</p>`,
    algo: {
      ins: ['MWAY_INSERT(ROOT, K)', '1. Set N := ROOT. [Empty tree → ROOT := new node [K].]', '2. Repeat:', '     Find i with K_i < K < K_(i+1). [K already present → Exit.]', '     If N has fewer than m − 1 keys and A_i is empty, then: insert K into N, and Exit.', '     If A_i is empty, then: Set A_i := new node [K], and Exit.', '     Set N := A_i.'],
      del: ['MWAY_DELETE(ROOT, K)', '1. Find the node N and index i with K_i = K. [Not found → Exit.]', '2. If A_(i−1) and A_i are both empty, then: remove K_i and A_i from N, and Exit.', '3. If A_(i−1) is not empty, then: Set K_i := the largest key in A_(i−1); delete that key from A_(i−1).', '   Else: Set K_i := the smallest key in A_i; delete that key from A_i.', '4. Exit.'],
      find: ['MWAY_SEARCH(ROOT, K)', '1. Set N := ROOT.', '2. Repeat while N ≠ NULL:', '     If K equals some K_i of N, then: Return found.', '     Else: Set N := A_i where K_i < K < K_(i+1).', '3. Return not found.'],
    },
    controls: [
      { id: 'm', type: 'select', label: 'm', value: '3', reset: true, opts: [['3', '3'], ['4', '4'], ['5', '5']] },
      { id: 'init', type: 'text', label: 'Build from', value: '50, 20, 80, 10, 30, 60, 90, 25, 35', wide: true, reset: true, rand: randKeys(10) },
      { type: 'br' },
      { id: 'item', type: 'num', label: 'Key', value: 40, w: 80 },
      { type: 'btn', label: 'Insert', op: 'ins', kind: 'primary' },
      { type: 'btn', label: 'Delete', op: 'del', kind: 'danger' },
      { type: 'btn', label: 'Search', op: 'find' },
    ],
    init(p) {
      const S = { root: null, m: Number(p.m) };
      const vals = String(p.init).trim() ? U.nums(p.init, { min: 0, max: 30, name: 'keys' }) : [];
      const quiet = { step() {}, algo() { return this; }, vars() { return this; } };
      vals.forEach((k) => this.insert(S, k, quiet));
      return S;
    },
    insert(S, K, R) {
      if (!S.root) { S.root = mnode([K]); R.step('1.', `Empty tree: ROOT := [${K}].`, { k: { [K]: 'new' } }); return true; }
      let n = S.root;
      for (;;) {
        if (n.keys.includes(K)) { R.step('     Find', `${K} is already present.`, { k: { [K]: 'ok' } }, { tone: 'cmp' }); return false; }
        let i = n.keys.findIndex((x) => K < x); if (i < 0) i = n.keys.length;
        R.step('     Find', `In [${n.keys.join(' ')}], ${K} falls in gap A${i}.`, { n: { [n.id]: 'path' } });
        if (!n.kids[i] && n.keys.length < S.m - 1) { n.keys.splice(i, 0, K); n.kids.splice(i, 0, null); R.step('     If N has', `The node has room and A${i} is empty → insert ${K} here.`, { k: { [K]: 'new' } }); return true; }
        if (!n.kids[i]) { n.kids[i] = mnode([K]); R.step('     If A_i', `The node is full → hang a new node [${K}] on A${i}.`, { k: { [K]: 'new' } }); return true; }
        n = n.kids[i];
      }
    },
    vars0: (S) => ({ m: S.m, 'max keys per node': S.m - 1 }),
    ops: {
      ins(S, p, R) {
        const K = U.num(p.item, { name: 'Key' });
        R.algo('ins').vars(() => ({ K, m: S.m }));
        let total = 0; (function w(n) { if (!n) return; total += n.keys.length; n.kids.forEach(w); })(S.root);
        if (total >= 30) { R.step(null, 'The demo keeps at most 30 keys.', {}, { tone: 'bad' }); return; }
        if (this.insert(S, K, R)) R.step('     Set N', `Inserted ${K}.`, { k: { [K]: 'ok' } }, { tone: 'ok' });
      },
      find(S, p, R) {
        const K = U.num(p.item, { name: 'Key' });
        R.algo('find');
        let n = S.root, v = 0;
        while (n) {
          v++;
          if (n.keys.includes(K)) { R.step('     If K', `**Found ${K}** in node ${v} on the path.`, { n: { [n.id]: 'ok' }, k: { [K]: 'ok' } }, { tone: 'ok' }); return; }
          let i = n.keys.findIndex((x) => K < x); if (i < 0) i = n.keys.length;
          R.step('     Else', `Not in [${n.keys.join(' ')}] → follow A${i}.`, { n: { [n.id]: 'path' } });
          n = n.kids[i];
        }
        R.step('3.', `${K} is not in the tree.`, {}, { tone: 'bad' });
      },
      del(S, p, R) {
        const K = U.num(p.item, { name: 'Key' });
        R.algo('del').vars(() => ({ K }));
        const delFrom = (n, key, par, pidx) => {
          const i = n.keys.indexOf(key) + 1;
          const left = n.kids[i - 1], right = n.kids[i];
          if (!left && !right) {
            n.keys.splice(i - 1, 1); n.kids.splice(i, 1);
            R.step('2.', `A${i - 1} and A${i} are empty → simply remove ${key}.`, { n: { [n.id]: 'act' } });
            if (!n.keys.length) { const only = n.kids[0] || null; if (par) par.kids[pidx] = only; else S.root = only; }
            return;
          }
          if (left) {
            let qp = n, qi = i - 1, q = left;
            while (q.kids[q.kids.length - 1]) { qp = q; qi = q.kids.length - 1; q = q.kids[qi]; }
            const big = q.keys[q.keys.length - 1];
            R.step('3.', `A${i - 1} is not empty: its largest key is ${big}.`, { k: { [key]: 'bad', [big]: 'sel' } });
            delFrom(q, big, qp, qi); n.keys[n.keys.indexOf(key)] = big;
            R.step('3.', `${big} replaces ${key}.`, { k: { [big]: 'new' } });
          } else {
            let qp = n, qi = i, q = right;
            while (q.kids[0]) { qp = q; qi = 0; q = q.kids[0]; }
            const small = q.keys[0];
            R.step('   Else', `A${i - 1} is empty, A${i} is not: its smallest key is ${small}.`, { k: { [key]: 'bad', [small]: 'sel' } });
            delFrom(q, small, qp, qi); n.keys[n.keys.indexOf(key)] = small;
            R.step('   Else', `${small} replaces ${key}.`, { k: { [small]: 'new' } });
          }
        };
        let n = S.root, par = null, pi = -1;
        while (n && !n.keys.includes(K)) { let i = n.keys.findIndex((x) => K < x); if (i < 0) i = n.keys.length; R.step('1.', `Not in [${n.keys.join(' ')}] → A${i}.`, { n: { [n.id]: 'path' } }); par = n; pi = i; n = n.kids[i]; }
        if (!n) { R.step('1.', `${K} is not in the tree.`, {}, { tone: 'bad' }); return; }
        R.step('1.', `Found ${K}.`, { n: { [n.id]: 'act' }, k: { [K]: 'bad' } });
        delFrom(n, K, par, pi);
        R.step('4.', `Deleted ${K}.`, {}, { tone: 'ok' });
      },
    },
    view(st, f) {
      const toK = (n) => (n ? { id: n.id, keys: n.keys, kids: n.kids.map(toK) } : null);
      const sp = st.root ? V.ktree('K', toK(st.root), { x: 0, y: 30, hl: f.hl.n || {}, khl: f.hl.k || {} }) : [V.text('empty', 0, 30, 'ROOT = NULL (empty tree)', 'muted', 'start')];
      if (st.root) {
        const L = sp.layout;
        for (const [, p] of L.pos) {
          const w = Math.max(1, p.nd.keys.length) * 38;
          p.nd.kids.forEach((c, i) => { if (!c) sp.push(V.text('nul' + p.nd.id + '_' + i, p.x - w / 2 + i * 38, p.y + 50, '∅', 'idx')); });
        }
      }
      return { specs: sp, minH: 280, minW: 560 };
    },
  });

  /* ======================= B-tree ======================= */
  let bid = 0;
  const bnode = (keys, kids) => ({ id: 'B' + (++bid), keys: keys || [], kids: kids || [] });
  const leaf = (n) => !n.kids.length;
  DSA.sim({
    id: 'btree', cat: 'searchtrees', title: 'B-Tree', short: 'B-tree',
    tags: ['b-tree', 'btree', 'm-way search tree', 'split', 'merge', 'borrow', 'order', 'disk'],
    blurb: 'A balanced m-way search tree: every node holds up to m − 1 keys, all leaves are on the same level, and nodes split (or borrow and merge) to stay that way.',
    schaum: 'Schaum Ch. 7 · m-way search trees and B-trees',
    cx: [['Search / insert / delete', 'O(log_m n) node visits'], ['Keys per node (order m)', '⌈m/2⌉ − 1 … m − 1 (root ≥ 1)']],
    theory: `<p>An <b>m-way search tree</b> generalises a BST: a node holds up to m − 1 sorted keys and up to m subtrees, with all keys in subtree i lying between key i − 1 and key i. A <b>B-tree of order m</b> adds balance rules:</p>
      <ul><li>every node except the root has at least <code>⌈m/2⌉ − 1</code> keys;</li><li>all leaves are at the same level.</li></ul>
      <p><b>Insertion</b> always adds to a leaf; if the leaf overflows (m keys) it <b>splits</b> around its median key, which moves up into the parent — possibly splitting the parent too, and growing a new root. <b>Deletion</b> from an internal node first swaps in the predecessor; if a leaf underflows it <b>borrows</b> a key through the parent from a richer sibling, or else <b>merges</b> with a sibling and the separating key comes down.</p>
      <p>Because nodes are wide and the tree is shallow, B-trees (and B+-trees) are used by databases and file systems, where each node is one disk block.</p>`,
    algo: {
      ins: ['BTREE_INSERT(ROOT, K) — order m', '1. Search down to the leaf L where K belongs. [Duplicate → Exit.]', '2. Insert K into L in sorted order.', '3. Repeat while node L has m keys: [Overflow]', '     Split L: the median key moves up into the parent;', '     the keys left of it stay in L, those right of it form a new node.', '     [No parent → the median becomes a new ROOT; the tree grows taller.]', '     Set L := the parent.', '4. Exit.'],
      del: ['BTREE_DELETE(ROOT, K) — order m', '1. Find the node containing K. [Not found → Exit.]', '2. If it is internal, then: replace K by its predecessor (largest key of the left subtree)', '     and delete that key from its leaf instead.', '3. Remove the key from the leaf L.', '4. Repeat while L (not the root) has fewer than ⌈m/2⌉ − 1 keys: [Underflow]', '     If a neighbouring sibling has a spare key, then: borrow it through the parent.', '     Else: merge L, the separating parent key and a sibling into one node; Set L := parent.', '5. If ROOT has no keys, then: its only child becomes ROOT.', '6. Exit.'],
      find: ['BTREE_SEARCH(ROOT, K)', '1. Set N := ROOT.', '2. Repeat while N ≠ NULL:', '     Find the first key ≥ K in N. If it equals K, then: Return found.', '     Else: Set N := the subtree between the neighbouring keys.', '3. Return not found.'],
    },
    controls: [
      { id: 'm', type: 'select', label: 'Order m', value: '4', reset: true, opts: [['3', '3 (2-3 tree)'], ['4', '4 (2-3-4 tree)'], ['5', '5']] },
      { id: 'init', type: 'text', label: 'Build from', value: '10, 20, 5, 6, 12, 30, 7, 17, 3, 8, 25, 28', wide: true, reset: true, rand: randKeys(12) },
      { type: 'br' },
      { id: 'item', type: 'num', label: 'Key', value: 15, w: 80 },
      { type: 'btn', label: 'Insert', op: 'ins', kind: 'primary' },
      { type: 'btn', label: 'Delete', op: 'del', kind: 'danger' },
      { type: 'btn', label: 'Search', op: 'find' },
    ],
    init(p) {
      const S = { root: bnode(), m: Number(p.m) };
      const vals = String(p.init).trim() ? U.nums(p.init, { min: 0, max: 40, name: 'keys' }) : [];
      const quiet = { step() {}, algo() { return this; }, vars() { return this; } };
      vals.forEach((k) => this.insert(S, k, quiet));
      return S;
    },
    insert(S, K, R) {
      const path = [];
      let n = S.root;
      for (;;) {
        if (n.keys.includes(K)) { R.step('1.', `${K} is already in the tree.`, { n: { [n.id]: 'ok' }, k: { [K]: 'ok' } }, { tone: 'cmp' }); return false; }
        path.push(n);
        if (leaf(n)) break;
        const i = n.keys.findIndex((x) => K < x), c = i < 0 ? n.kids.length - 1 : i;
        R.step('1.', `In node [${n.keys.join(' ')}], ${K} belongs in subtree ${c + 1}.`, { n: { [n.id]: 'path' } });
        n = n.kids[c];
      }
      const pos = n.keys.findIndex((x) => K < x);
      n.keys.splice(pos < 0 ? n.keys.length : pos, 0, K);
      R.step('2.', `Insert ${K} into leaf [${n.keys.join(' ')}].`, { n: { [n.id]: 'act' }, k: { [K]: 'new' } });
      let i = path.length - 1;
      while (n.keys.length >= S.m) {
        R.step('3.', `Overflow: the node has ${n.keys.length} keys but order ${S.m} allows ${S.m - 1}. Split it.`, { n: { [n.id]: 'bad' } });
        const mid = Math.floor((S.m - 1) / 2), med = n.keys[mid];
        const right = bnode(n.keys.slice(mid + 1), leaf(n) ? [] : n.kids.slice(mid + 1));
        n.keys = n.keys.slice(0, mid); if (!leaf(n)) n.kids = n.kids.slice(0, mid + 1);
        const par = path[i - 1];
        if (!par) { S.root = bnode([med], [n, right]); R.step('     [No parent', `Median ${med} becomes a new root — the tree grows one level taller.`, { k: { [med]: 'new' } }); break; }
        const ci = par.kids.indexOf(n);
        par.keys.splice(ci, 0, med); par.kids.splice(ci + 1, 0, right);
        R.step('     Split L', `Median ${med} moves up into the parent; [${n.keys.join(' ')}] and [${right.keys.join(' ')}] become siblings.`, { k: { [med]: 'new' }, n: { [par.id]: 'act' } });
        n = par; i--;
      }
      return true;
    },
    vars0: (S) => ({ m: S.m, 'min keys': Math.ceil(S.m / 2) - 1, 'max keys': S.m - 1 }),
    ops: {
      ins(S, p, R) {
        const K = U.num(p.item, { name: 'Key' });
        R.algo('ins').vars(() => ({ K, m: S.m }));
        let total = 0; (function w(n) { total += n.keys.length; n.kids.forEach(w); })(S.root);
        if (total >= 40) { R.step(null, 'The demo keeps at most 40 keys.', {}, { tone: 'bad' }); return; }
        if (this.insert(S, K, R)) R.step('4.', `Inserted ${K}.`, { k: { [K]: 'ok' } }, { tone: 'ok' });
      },
      find(S, p, R) {
        const K = U.num(p.item, { name: 'Key' });
        R.algo('find');
        let n = S.root, visits = 0;
        while (n) {
          visits++;
          if (n.keys.includes(K)) { R.step('     Find', `**Found ${K}** after visiting ${visits} node(s).`, { n: { [n.id]: 'ok' }, k: { [K]: 'ok' } }, { tone: 'ok' }); return; }
          const i = n.keys.findIndex((x) => K < x);
          R.step('     Else', `Not in [${n.keys.join(' ')}]` + (leaf(n) ? '.' : ` → subtree ${(i < 0 ? n.keys.length : i) + 1}.`), { n: { [n.id]: 'path' } });
          n = leaf(n) ? null : n.kids[i < 0 ? n.kids.length - 1 : i];
        }
        R.step('3.', `${K} is not in the tree.`, {}, { tone: 'bad' });
      },
      del(S, p, R) {
        const K = U.num(p.item, { name: 'Key' }), MIN = Math.ceil(S.m / 2) - 1;
        R.algo('del').vars(() => ({ K, m: S.m, 'min keys': MIN }));
        const path = [];
        let n = S.root, idx = -1;
        for (;;) {
          path.push(n);
          idx = n.keys.indexOf(K);
          if (idx >= 0) break;
          if (leaf(n)) { R.step('1.', `${K} is not in the tree.`, {}, { tone: 'bad' }); return; }
          const i = n.keys.findIndex((x) => K < x);
          R.step('1.', `Not in [${n.keys.join(' ')}]; go down.`, { n: { [n.id]: 'path' } });
          n = n.kids[i < 0 ? n.kids.length - 1 : i];
        }
        R.step('1.', `Found ${K}.`, { n: { [n.id]: 'act' }, k: { [K]: 'bad' } });
        if (!leaf(n)) {
          let q = n.kids[idx]; path.push(q);
          while (!leaf(q)) { q = q.kids[q.kids.length - 1]; path.push(q); }
          const pred = q.keys[q.keys.length - 1];
          R.step('2.', `${K} is in an internal node: its predecessor is ${pred}.`, { k: { [K]: 'bad', [pred]: 'sel' } });
          n.keys[idx] = pred; q.keys.pop();
          R.step('     and delete', `${pred} moves up to replace ${K}; now remove it from the leaf.`, { k: { [pred]: 'new' } });
          n = q;
        } else { n.keys.splice(idx, 1); R.step('3.', `Removed ${K} from the leaf.`, { n: { [n.id]: 'act' } }); }
        let i = path.length - 1;
        while (n !== S.root && n.keys.length < MIN) {
          const par = path[i - 1], ci = par.kids.indexOf(n);
          const ls = par.kids[ci - 1], rs = par.kids[ci + 1];
          R.step('4.', `Underflow: [${n.keys.join(' ') || 'empty'}] has fewer than ${MIN} key(s).`, { n: { [n.id]: 'bad' } });
          if (ls && ls.keys.length > MIN) {
            n.keys.unshift(par.keys[ci - 1]); par.keys[ci - 1] = ls.keys.pop(); if (!leaf(ls)) n.kids.unshift(ls.kids.pop());
            R.step('     If a neighbouring', `Borrow from the left sibling: ${par.keys[ci - 1]} goes up, ${n.keys[0]} comes down.`, { n: { [n.id]: 'ok', [ls.id]: 'sel' } });
            break;
          }
          if (rs && rs.keys.length > MIN) {
            n.keys.push(par.keys[ci]); par.keys[ci] = rs.keys.shift(); if (!leaf(rs)) n.kids.push(rs.kids.shift());
            R.step('     If a neighbouring', `Borrow from the right sibling: ${par.keys[ci]} goes up, ${n.keys[n.keys.length - 1]} comes down.`, { n: { [n.id]: 'ok', [rs.id]: 'sel' } });
            break;
          }
          const [a, b, si] = ls ? [ls, n, ci - 1] : [n, rs, ci];
          const sep = par.keys[si];
          a.keys = a.keys.concat([sep], b.keys); a.kids = a.kids.concat(b.kids);
          par.keys.splice(si, 1); par.kids.splice(si + 1, 1);
          R.step('     Else: merge', `No sibling can spare a key: merge with ${ls ? 'the left' : 'the right'} sibling, pulling ${sep} down.`, { n: { [a.id]: 'act' }, k: { [sep]: 'new' } });
          n = par; i--;
        }
        if (!S.root.keys.length && S.root.kids.length) { S.root = S.root.kids[0]; R.step('5.', 'The root is empty — its only child becomes the new root (the tree gets shorter).'); }
        R.step('6.', `Deleted ${K}.`, {}, { tone: 'ok' });
      },
    },
    view(st, f) {
      const sp = V.ktree('K', st.root, { x: 0, y: 30, hl: f.hl.n || {}, khl: f.hl.k || {} });
      return { specs: sp, minH: 280, minW: 560 };
    },
  });
})(typeof window !== 'undefined' ? window : globalThis);
