/* DSA Lab · sims/expr.js — Polish notation: infix → postfix / prefix, evaluation (Schaum Ch. 6) */
(function (g) {
  'use strict';
  const DSA = g.DSA, U = DSA.U, V = DSA.V;
  const PREC = { '^': 3, '*': 2, '/': 2, '%': 2, '+': 1, '-': 1 };
  const isOp = (t) => Object.prototype.hasOwnProperty.call(PREC, t);
  const isOperand = (t) => /^[A-Za-z_]\w*$|^\d+(\.\d+)?$/.test(t);

  function tokInfix(str) {
    const s = String(str).replace(/[×]/g, '*').replace(/[÷]/g, '/').replace(/[−–]/g, '-').trim();
    if (!s) U.fail('Type an infix expression, e.g. A + ( B * C - ( D / E ^ F ) * G ) * H');
    const out = [], re = /\s*([A-Za-z_]\w*|\d+(?:\.\d+)?|[-+*/^%()])/y;
    let i = 0;
    while (i < s.length) {
      re.lastIndex = i;
      const m = re.exec(s);
      if (!m) U.fail(`Unexpected character “${s[i].trim() || 'space'}” at position ${i + 1}.`);
      out.push(m[1]); i = re.lastIndex;
      while (s[i] === ' ') i++;
    }
    if (out.length > 32) U.fail('Keep the expression to 32 symbols or fewer.');
    // validate shape: operand / operator alternation and parentheses
    let depth = 0, want = 'operand';
    out.forEach((t, k) => {
      if (t === '(') { if (want !== 'operand') U.fail(`A “(” cannot follow an operand (symbol ${k + 1}). Write the operator explicitly, e.g. A * (B + C).`); depth++; }
      else if (t === ')') { if (want !== 'operator') U.fail(`“)” at symbol ${k + 1} has nothing before it.`); depth--; if (depth < 0) U.fail('There is a “)” without a matching “(”.'); }
      else if (isOp(t)) { if (want !== 'operator') U.fail(t === '-' ? 'Unary minus is not supported here — write (0 - X) instead.' : `Operator “${t}” at symbol ${k + 1} is missing its left operand.`); want = 'operand'; }
      else { if (want !== 'operand') U.fail(`Two operands in a row near “${t}” — an operator is missing.`); want = 'operator'; }
    });
    if (depth) U.fail('Unbalanced parentheses: a “(” is never closed.');
    if (want === 'operand') U.fail('The expression ends with an operator.');
    return out;
  }
  function tokPolish(str, kind) {
    const s = String(str).replace(/[×]/g, '*').replace(/[÷]/g, '/').replace(/[−–]/g, '-').trim();
    if (!s) U.fail(`Type a ${kind} expression.`);
    const toks = /\s/.test(s) ? s.split(/\s+/) : s.split('');
    toks.forEach((t) => { if (!isOp(t) && !isOperand(t)) U.fail(`“${t}” is neither an operand nor an operator (+ − * / % ^).`); });
    if (toks.length > 32) U.fail('Keep the expression to 32 symbols or fewer.');
    return toks;
  }
  const calc = (a, op, b) => {
    if ((op === '/' || op === '%') && b === 0) U.fail('Division by zero.');
    const r = op === '+' ? a + b : op === '-' ? a - b : op === '*' ? a * b : op === '/' ? a / b : op === '%' ? a % b : Math.pow(a, b);
    if (!Number.isFinite(r)) U.fail('The result is too large to show.');
    return Math.round(r * 1e6) / 1e6;
  };
  const show = (v) => V.fmt(v);

  /* Shared drawing: input row (ghost + moving tokens), STACK row (top at right), output row. */
  function exprView(st, f, labels) {
    const sp = [], cw = 30, ch = 34, gap = 4;
    const rowY = { q: 0, s: 110, o: 220 };
    sp.push(V.text('lq', -14, rowY.q + ch / 2 + 4, labels.q, 'name', 'end'));
    sp.push(V.text('ls', -14, rowY.s + ch / 2 + 4, 'STACK', 'name', 'end'));
    sp.push(V.text('lo', -14, rowY.o + ch / 2 + 4, labels.o, 'name', 'end'));
    const W = (t) => Math.max(cw, 14 + String(t).length * 9);
    const qx = []; let x = 0;
    st.q.forEach((t, i) => { qx.push(x); x += W(t.v) + gap; });
    st.q.forEach((t, i) => {
      const cls = i === f.hl.cur ? 'act' : st.done[i] ? 'dim' : t.sent ? 'sel' : '';
      sp.push(V.box('g' + i, qx[i], rowY.q, W(t.v), ch, t.v, 'chip slot ' + cls, { rx: 5 }));
    });
    // tokens still waiting in the input sit on top of their ghost cell
    st.q.forEach((t, i) => { if (!st.done[i] && !t.sent) sp.push(V.box('t' + t.id, qx[i], rowY.q, W(t.v), ch, t.v, 'chip ' + (i === f.hl.cur ? 'act' : ''), { rx: 5 })); });
    let sx = 0;
    st.stack.forEach((t, j) => {
      const cls = (f.hl.pop && f.hl.pop.includes(t.id)) ? 'cmp' : (j === st.stack.length - 1 && f.hl.push) ? 'new' : t.v === '(' || t.v === ')' ? 'sel' : '';
      sp.push(V.box('t' + t.id, sx, rowY.s, W(t.v), ch, show(t.v), 'cell ' + cls, { rx: 5 }));
      sx += W(t.v) + gap;
    });
    if (st.stack.length) sp.push(...V.ptr('stop', sx - gap - W(st.stack[st.stack.length - 1].v) / 2, rowY.s + ch, 'TOP', 'act', 'bottom', 18));
    else sp.push(V.text('sempty', 0, rowY.s + ch / 2 + 4, '(empty)', 'muted', 'start'));
    let ox = 0;
    st.out.forEach((t) => { sp.push(V.box('t' + t.id, ox, rowY.o, W(t.v), ch, show(t.v), 'cell ' + (t.id === f.hl.outNew ? 'new' : 'ok'), { rx: 5 })); ox += W(t.v) + gap; });
    if (st.result != null) sp.push(V.text('res', 0, rowY.o + ch + 44, st.result, 'big ok', 'start'));
    return { specs: sp, minH: 300, minW: 520 };
  }
  const tableRows = (rows) => () => ({ head: ['Symbol', 'STACK', rows.col], rows: rows.list.slice() });

  /* ---------------- Infix → Postfix ---------------- */
  DSA.sim({
    id: 'infix-postfix', cat: 'expr', title: 'Infix to Postfix (Polish) Conversion', short: 'Infix → Postfix',
    tags: ['polish', 'reverse polish', 'postfix', 'shunting yard', 'operator precedence', 'conversion'],
    blurb: 'Transform an infix expression Q into its postfix (reverse Polish) form P with an operator stack, exactly as in the textbook table: Symbol scanned · STACK · Expression P.',
    schaum: 'Schaum Ch. 6 · Polish notation',
    cx: [['n symbols', 'O(n)'], ['Stack space', 'O(n)']],
    theory: `<p>In <b>postfix</b> (reverse Polish) notation the operator follows its operands: <code>A + B * C</code> becomes <code>A B C * +</code>. No parentheses are ever needed, and a computer can evaluate it in one left-to-right pass with a stack.</p>
      <p>The conversion keeps <b>operands in their original order</b> and only delays operators. An operator waits on the STACK until an operator of <b>lower</b> precedence (or a “)”) arrives. Precedence used here: <code>^</code> highest (right-associative), then <code>* / %</code>, then <code>+ −</code> (both left-associative).</p>
      <p>The algorithm pushes a “(” first and appends a “)” to Q, so the final “)” flushes everything left on the stack.</p>`,
    algo: { run: ['POLISH(Q, P) — infix Q to postfix P', '1. Push "(" onto STACK and append ")" to the end of Q.', '2. Scan Q left to right; for each symbol do Steps 3–6 until STACK is empty:', '  3. Operand → append it to P.', '  4. "(" → push it onto STACK.', '  5. Operator ⊗ → (a) while the top of STACK is an operator of higher or', '       equal precedence, pop it and append it to P;', '       (b) push ⊗. [For right-associative ^ pop only strictly higher.]', '  6. ")" → (a) pop operators to P until "(" is on top;', '       (b) pop the "(" and discard it.', '7. Exit.'] },
    controls: [
      { id: 'e', type: 'text', label: 'Infix Q', value: 'A + ( B * C - ( D / E ^ F ) * G ) * H', wide: true, run: true,
        presets: [['A + ( B * C - ( D / E ^ F ) * G ) * H', 'Textbook example'], ['A + B * C', 'A + B * C'], ['( A + B ) * C', '(A + B) * C'], ['A ^ B ^ C', 'A ^ B ^ C (right-assoc.)'], ['( 3 + 4 ) * 5 - 6 / 2', 'With numbers']] },
      { type: 'btn', label: 'Convert', op: 'play', kind: 'primary' },
    ],
    auto: 'run',
    init(p) { const toks = tokInfix(p.e); return { q: toks.map((v, i) => ({ id: 'q' + i, v })), done: {}, stack: [], out: [], result: null }; },
    ops: {
      run(S, p, R) {
        const T = { col: 'Expression P', list: [] };
        const snap = (sym) => T.list.push([sym, S.stack.map((t) => t.v).join(' '), S.out.map((t) => t.v).join(' ')]);
        R.table(tableRows(T)).vars(() => ({ symbol: S.cur == null ? '–' : S.q[S.cur].v, P: S.out.map((t) => t.v).join(' ') || '–' }));
        S.stack.push({ id: 'open', v: '(' });
        S.q.push({ id: 'close', v: ')', sent: true });
        R.step('1.', 'Push “(” onto STACK and add the sentinel “)” to the end of Q.', { push: true });
        for (let i = 0; i < S.q.length; i++) {
          const t = S.q[i]; S.cur = i; S.q[i].sent = false;
          if (isOperand(t.v)) { S.done[i] = true; S.out.push(t); snap(t.v); R.step('3.', `“${t.v}” is an operand → append it to P.`, { cur: i, outNew: t.id }); }
          else if (t.v === '(') { S.done[i] = true; S.stack.push(t); snap('('); R.step('4.', '“(” → push it.', { cur: i, push: true }); }
          else if (isOp(t.v)) {
            const pops = [];
            while (S.stack.length) {
              const top = S.stack[S.stack.length - 1].v;
              if (!isOp(top)) break;
              const higher = PREC[top] > PREC[t.v] || (PREC[top] === PREC[t.v] && t.v !== '^');
              if (!higher) break;
              const x = S.stack.pop(); S.out.push(x); pops.push(x.v);
              R.step('       equal', `Top “${x.v}” has ${PREC[x.v] > PREC[t.v] ? 'higher' : 'equal'} precedence than “${t.v}” → pop it to P.`, { cur: i, outNew: x.id });
            }
            if (!pops.length) R.step('5.', `Operator “${t.v}”: the top of STACK (${S.stack.length ? '“' + S.stack[S.stack.length - 1].v + '”' : 'empty'}) has lower precedence, so nothing is popped.`, { cur: i });
            S.done[i] = true; S.stack.push(t); snap(t.v);
            R.step('       (b) push', `Push “${t.v}”.`, { cur: i, push: true });
          } else {
            S.done[i] = true;
            const pops = [];
            while (S.stack.length && S.stack[S.stack.length - 1].v !== '(') {
              const x = S.stack.pop(); S.out.push(x); pops.push(x.v);
              R.step('6.', `“)” → pop “${x.v}” to P.`, { cur: i, outNew: x.id });
            }
            S.stack.pop(); snap(')');
            R.step('       (b) pop the', `Pop the matching “(” and throw it away` + (pops.length ? '.' : ' (nothing was between them).'), { cur: i });
          }
        }
        S.cur = null;
        S.result = 'P = ' + S.out.map((t) => t.v).join(' ');
        R.step('7.', `STACK is empty, so we are done. **P = ${S.out.map((t) => t.v).join(' ')}**`, {}, { tone: 'ok' });
      },
    },
    view(st, f) { return exprView(st, f, { q: 'Q', o: 'P' }); },
  });

  /* ---------------- Infix → Prefix ---------------- */
  DSA.sim({
    id: 'infix-prefix', cat: 'expr', title: 'Infix to Prefix Conversion', short: 'Infix → Prefix',
    tags: ['polish', 'prefix', 'conversion', 'operator precedence'],
    blurb: 'Scan the infix expression from right to left with an operator stack, collect the output, then read it backwards to get the prefix (Polish) form.',
    schaum: 'Schaum Ch. 6 · Polish notation',
    cx: [['n symbols', 'O(n)'], ['Stack space', 'O(n)']],
    theory: `<p>In <b>prefix</b> (Polish) notation the operator comes first: <code>A + B * C</code> becomes <code>+ A * B C</code>.</p>
      <p>The trick is to mirror the postfix algorithm: scan from the <b>right</b>, treat “)” as the opening bracket and “(” as the closing one, and pop only operators of <b>strictly higher</b> precedence (equal-precedence left-associative operators must stay, because we are reading backwards). For the right-associative <code>^</code> the rule flips: pop on equal precedence too. Finally reverse the output.</p>`,
    algo: { run: ['PREFIX(Q) — infix Q to prefix', '1. Push ")" onto STACK and put "(" at the start of Q.', '2. Scan Q right to left; for each symbol do Steps 3–6 until STACK is empty:', '  3. Operand → append it to OUT.', '  4. ")" → push it onto STACK.', '  5. Operator ⊗ → (a) pop to OUT every operator on top with strictly', '       higher precedence [for ^: higher or equal];', '       (b) push ⊗.', '  6. "(" → pop operators to OUT until ")" is on top; discard the ")".', '7. The prefix expression is OUT read backwards.'] },
    controls: [
      { id: 'e', type: 'text', label: 'Infix Q', value: '( A + B ) * C - D / E', wide: true, run: true,
        presets: [['( A + B ) * C - D / E', '(A + B) * C − D / E'], ['A + B * C', 'A + B * C'], ['A - B - C', 'A − B − C (left-assoc.)'], ['A ^ B ^ C', 'A ^ B ^ C (right-assoc.)'], ['A * ( B + C ) / D', 'A * (B + C) / D']] },
      { type: 'btn', label: 'Convert', op: 'play', kind: 'primary' },
    ],
    auto: 'run',
    init(p) { const toks = tokInfix(p.e); return { q: toks.map((v, i) => ({ id: 'q' + i, v })), done: {}, stack: [], out: [], result: null }; },
    ops: {
      run(S, p, R) {
        const T = { col: 'OUT (reversed later)', list: [] };
        const snap = (sym) => T.list.push([sym, S.stack.map((t) => t.v).join(' '), S.out.map((t) => t.v).join(' ')]);
        R.table(tableRows(T)).vars(() => ({ symbol: S.cur == null ? '–' : S.q[S.cur].v, OUT: S.out.map((t) => t.v).join(' ') || '–' }));
        S.stack.push({ id: 'close', v: ')' });
        S.q.unshift({ id: 'open', v: '(', sent: true });
        R.step('1.', 'Push “)” onto STACK and put “(” at the start of Q. Now scan from the right.', { push: true });
        for (let i = S.q.length - 1; i >= 0; i--) {
          const t = S.q[i]; S.cur = i; S.q[i].sent = false;
          if (isOperand(t.v)) { S.done[i] = true; S.out.push(t); snap(t.v); R.step('3.', `Operand “${t.v}” → OUT.`, { cur: i, outNew: t.id }); }
          else if (t.v === ')') { S.done[i] = true; S.stack.push(t); snap(')'); R.step('4.', '“)” → push it.', { cur: i, push: true }); }
          else if (isOp(t.v)) {
            let popped = false;
            while (S.stack.length) {
              const top = S.stack[S.stack.length - 1].v;
              if (!isOp(top)) break;
              const pop = PREC[top] > PREC[t.v] || (PREC[top] === PREC[t.v] && t.v === '^');
              if (!pop) break;
              const x = S.stack.pop(); S.out.push(x); popped = true;
              R.step('       higher', `Top “${x.v}” has ${PREC[x.v] > PREC[t.v] ? 'higher precedence' : 'equal precedence and ^ is right-associative'} → pop it to OUT.`, { cur: i, outNew: x.id });
            }
            if (!popped) R.step('5.', `“${t.v}”: nothing on top has strictly higher precedence, so nothing is popped.`, { cur: i });
            S.done[i] = true; S.stack.push(t); snap(t.v);
            R.step('       (b) push', `Push “${t.v}”.`, { cur: i, push: true });
          } else {
            S.done[i] = true;
            while (S.stack.length && S.stack[S.stack.length - 1].v !== ')') {
              const x = S.stack.pop(); S.out.push(x);
              R.step('6.', `“(” → pop “${x.v}” to OUT.`, { cur: i, outNew: x.id });
            }
            S.stack.pop(); snap('(');
            R.step('6.', 'Discard the matching “)”.', { cur: i });
          }
        }
        S.cur = null;
        R.step('7.', `OUT = ${S.out.map((t) => t.v).join(' ')}. Now read it backwards…`);
        S.out.reverse();
        S.result = 'Prefix = ' + S.out.map((t) => t.v).join(' ');
        R.step('7.', `**Prefix = ${S.out.map((t) => t.v).join(' ')}**`, {}, { tone: 'ok' });
      },
    },
    view(st, f) { return exprView(st, f, { q: 'Q', o: 'OUT' }); },
  });

  /* ---------------- Postfix evaluation ---------------- */
  DSA.sim({
    id: 'postfix-eval', cat: 'expr', title: 'Evaluating a Postfix Expression', short: 'Evaluate postfix',
    tags: ['postfix evaluation', 'reverse polish', 'calculator', 'stack'],
    blurb: 'Scan left to right: push operands; when an operator appears, pop two values, apply it, and push the result. The last value left is the answer.',
    schaum: 'Schaum Ch. 6 · Evaluation of a postfix expression',
    cx: [['n symbols', 'O(n)'], ['Stack space', 'O(n)']],
    theory: `<p>A postfix expression needs no precedence rules and no parentheses. Each operator applies to the <b>two values just below it</b> on the stack.</p>
      <p>Order matters for <code>−</code>, <code>/</code> and <code>^</code>: the first value popped (<code>A</code>) is the <b>right</b> operand and the second (<code>B</code>) is the left one, so we compute <code>B ⊗ A</code>.</p>
      <p>Separate multi-digit numbers with spaces (<code>12 4 /</code>). Without spaces each digit is one operand (<code>562+*</code>).</p>`,
    algo: { run: ['EVALUATE(P) — postfix', '1. Append ")" to the end of P as a sentinel.', '2. Scan P left to right; repeat Steps 3 and 4 until ")" is reached:', '  3. Operand → push it onto STACK.', '  4. Operator ⊗ → (a) pop A (the top element) and then B;', '       (b) compute B ⊗ A;', '       (c) push the result onto STACK.', '5. Set VALUE := the top element of STACK.', '6. Exit.'] },
    controls: [
      { id: 'e', type: 'text', label: 'Postfix P', value: '5 6 2 + * 12 4 / -', wide: true, run: true,
        presets: [['5 6 2 + * 12 4 / -', '5 6 2 + * 12 4 / − (textbook)'], ['2 3 4 * +', '2 3 4 * +'], ['6 2 / 3 -', '6 2 / 3 −'], ['2 3 ^ 2 ^', '2 3 ^ 2 ^']] },
      { type: 'btn', label: 'Evaluate', op: 'play', kind: 'primary' },
    ],
    auto: 'run',
    init(p) {
      const toks = tokPolish(p.e, 'postfix');
      toks.forEach((t) => { if (/^[A-Za-z_]/.test(t)) U.fail(`“${t}” is a variable — use numbers so the expression can be evaluated.`); });
      return { q: toks.map((v, i) => ({ id: 'q' + i, v })), done: {}, stack: [], out: [], result: null };
    },
    ops: {
      run(S, p, R) {
        const T = { col: 'Action', list: [] };
        R.table(() => ({ head: ['Symbol', 'STACK', 'Action'], rows: T.list.slice() })).vars(() => ({ A: S.A == null ? '–' : S.A, B: S.B == null ? '–' : S.B, depth: S.stack.length }));
        S.q.push({ id: 'close', v: ')', sent: true });
        R.step('1.', 'Append the sentinel “)” to P.');
        for (let i = 0; i < S.q.length; i++) {
          const t = S.q[i]; S.cur = i;
          if (t.v === ')') break;
          if (isOperand(t.v)) { S.done[i] = true; S.stack.push({ id: t.id, v: Number(t.v) }); T.list.push([t.v, S.stack.map((x) => show(x.v)).join(' '), 'push']); R.step('3.', `Operand ${t.v} → push.`, { cur: i, push: true }); continue; }
          if (S.stack.length < 2) U.fail(`Not enough operands for “${t.v}” (symbol ${i + 1}) — the postfix expression is malformed.`);
          S.done[i] = true;
          const a = S.stack[S.stack.length - 1], b = S.stack[S.stack.length - 2];
          S.A = a.v; S.B = b.v;
          R.step('4.', `Operator “${t.v}”: pop A = ${show(a.v)} (top), then B = ${show(b.v)}.`, { cur: i, pop: [a.id, b.id] });
          const r = calc(b.v, t.v, a.v);
          S.stack.pop(); S.stack.pop();
          R.step('       (b) compute', `B ${t.v} A = ${show(b.v)} ${t.v} ${show(a.v)} = **${show(r)}**.`, { cur: i });
          S.stack.push({ id: 'r' + i, v: r }); S.A = S.B = null;
          T.list.push([t.v, S.stack.map((x) => show(x.v)).join(' '), `${show(b.v)} ${t.v} ${show(a.v)} = ${show(r)}`]);
          R.step('       (c) push', `Push ${show(r)}.`, { cur: i, push: true });
        }
        S.cur = S.q.length - 1; S.done[S.q.length - 1] = true;
        if (S.stack.length !== 1) U.fail(`The expression leaves ${S.stack.length} values on the stack — some operator is missing.`);
        S.result = 'VALUE = ' + show(S.stack[0].v);
        R.step('5.', `Reached “)”. **VALUE = ${show(S.stack[0].v)}**`, {}, { tone: 'ok' });
      },
    },
    view(st, f) { return exprView(st, f, { q: 'P', o: '' }); },
  });

  /* ---------------- Prefix evaluation ---------------- */
  DSA.sim({
    id: 'prefix-eval', cat: 'expr', title: 'Evaluating a Prefix Expression', short: 'Evaluate prefix',
    tags: ['prefix evaluation', 'polish notation'],
    blurb: 'Scan from right to left: push operands; at an operator pop A then B and push A ⊗ B (A is the left operand this time).',
    schaum: 'Schaum Ch. 6 · Polish notation',
    cx: [['n symbols', 'O(n)'], ['Stack space', 'O(n)']],
    theory: `<p>Prefix evaluation is postfix evaluation in a mirror: scan from the right end. Because we read backwards, the first value popped is now the <b>left</b> operand: compute <code>A ⊗ B</code>.</p>`,
    algo: { run: ['EVALUATE(E) — prefix', '1. Scan E from right to left; for each symbol:', '  2. Operand → push it onto STACK.', '  3. Operator ⊗ → (a) pop A (the top element) and then B;', '       (b) compute A ⊗ B; [A is the left operand]', '       (c) push the result onto STACK.', '4. Set VALUE := the only element left on STACK.', '5. Exit.'] },
    controls: [
      { id: 'e', type: 'text', label: 'Prefix E', value: '- * + 4 3 2 5', wide: true, run: true,
        presets: [['- * + 4 3 2 5', '− * + 4 3 2 5'], ['+ 9 * 2 6', '+ 9 * 2 6'], ['/ - 20 4 2', '/ − 20 4 2'], ['^ 2 ^ 3 2', '^ 2 ^ 3 2']] },
      { type: 'btn', label: 'Evaluate', op: 'play', kind: 'primary' },
    ],
    auto: 'run',
    init(p) {
      const toks = tokPolish(p.e, 'prefix');
      toks.forEach((t) => { if (/^[A-Za-z_]/.test(t)) U.fail(`“${t}” is a variable — use numbers so the expression can be evaluated.`); });
      return { q: toks.map((v, i) => ({ id: 'q' + i, v })), done: {}, stack: [], out: [], result: null };
    },
    ops: {
      run(S, p, R) {
        const T = [];
        R.table(() => ({ head: ['Symbol', 'STACK', 'Action'], rows: T.slice() })).vars(() => ({ A: S.A == null ? '–' : S.A, B: S.B == null ? '–' : S.B, depth: S.stack.length }));
        R.step('1.', 'Start at the right-most symbol.');
        for (let i = S.q.length - 1; i >= 0; i--) {
          const t = S.q[i]; S.cur = i;
          if (isOperand(t.v)) { S.done[i] = true; S.stack.push({ id: t.id, v: Number(t.v) }); T.push([t.v, S.stack.map((x) => show(x.v)).join(' '), 'push']); R.step('2.', `Operand ${t.v} → push.`, { cur: i, push: true }); continue; }
          if (S.stack.length < 2) U.fail(`Not enough operands for “${t.v}” — the prefix expression is malformed.`);
          S.done[i] = true;
          const a = S.stack[S.stack.length - 1], b = S.stack[S.stack.length - 2];
          S.A = a.v; S.B = b.v;
          R.step('3.', `Operator “${t.v}”: pop A = ${show(a.v)} (top), then B = ${show(b.v)}.`, { cur: i, pop: [a.id, b.id] });
          const r = calc(a.v, t.v, b.v);
          S.stack.pop(); S.stack.pop();
          R.step('       (b) compute', `A ${t.v} B = ${show(a.v)} ${t.v} ${show(b.v)} = **${show(r)}**.`, { cur: i });
          S.stack.push({ id: 'r' + i, v: r }); S.A = S.B = null;
          T.push([t.v, S.stack.map((x) => show(x.v)).join(' '), `${show(a.v)} ${t.v} ${show(b.v)} = ${show(r)}`]);
          R.step('       (c) push', `Push ${show(r)}.`, { cur: i, push: true });
        }
        S.cur = null;
        if (S.stack.length !== 1) U.fail(`The expression leaves ${S.stack.length} values on the stack — some operator is missing.`);
        S.result = 'VALUE = ' + show(S.stack[0].v);
        R.step('4.', `**VALUE = ${show(S.stack[0].v)}**`, {}, { tone: 'ok' });
      },
    },
    view(st, f) { return exprView(st, f, { q: 'E', o: '' }); },
  });

  DSA.expr = { tokInfix, tokPolish, PREC };
})(typeof window !== 'undefined' ? window : globalThis);
