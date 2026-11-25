/* DSA Lab · code/code-nonlinear.js — C and Python programs: trees, search trees, heaps, graphs */
(function (g) {
  'use strict';
  const C = (g.DSA.code = g.DSA.code || {});

  const TREE_C = String.raw`#include <stdio.h>
#include <stdlib.h>

typedef struct TNode { char info; struct TNode *left, *right; } TNode;

TNode *node(char info, TNode *l, TNode *r) {
    TNode *t = malloc(sizeof *t); t->info = info; t->left = l; t->right = r; return t;
}
/* The sample tree:        A
                        B     C
                      D   E     G
                         F H
                          J K           */
TNode *sample(void) {
    TNode *F = node('F', NULL, NULL), *H = node('H', node('J', NULL, NULL), node('K', NULL, NULL));
    return node('A', node('B', node('D', NULL, NULL), node('E', F, H)), node('C', NULL, node('G', NULL, NULL)));
}
`;

  C['bt-traversal'] = {
    c: TREE_C + String.raw`
void preorder(TNode *p)  { if (!p) return; printf("%c ", p->info); preorder(p->left); preorder(p->right); }
void inorder(TNode *p)   { if (!p) return; inorder(p->left); printf("%c ", p->info); inorder(p->right); }
void postorder(TNode *p) { if (!p) return; postorder(p->left); postorder(p->right); printf("%c ", p->info); }

void inorder_stack(TNode *root) {             /* INORD with an explicit stack */
    TNode *stack[64]; int top = 0; TNode *ptr = root;
    while (ptr || top) {
        while (ptr) { stack[top++] = ptr; ptr = ptr->left; }   /* push the left-most path */
        ptr = stack[--top];
        printf("%c ", ptr->info);
        ptr = ptr->right;
    }
}
void level_order(TNode *root) {
    TNode *q[64]; int f = 0, r = 0;
    if (root) q[r++] = root;
    while (f < r) {
        TNode *p = q[f++]; printf("%c ", p->info);
        if (p->left) q[r++] = p->left;
        if (p->right) q[r++] = p->right;
    }
}

int main(void) {
    TNode *root = sample();
    printf("preorder : "); preorder(root);  printf("\n");
    printf("inorder  : "); inorder(root);   printf("\n");
    printf("postorder: "); postorder(root); printf("\n");
    printf("inorder (stack): "); inorder_stack(root); printf("\n");
    printf("level order    : "); level_order(root); printf("\n");
    return 0;
}
`,
    py: String.raw`from collections import deque

class Node:
    def __init__(self, info, left=None, right=None):
        self.info, self.left, self.right = info, left, right

def preorder(p):
    return [p.info] + preorder(p.left) + preorder(p.right) if p else []

def inorder(p):
    return inorder(p.left) + [p.info] + inorder(p.right) if p else []

def postorder(p):
    return postorder(p.left) + postorder(p.right) + [p.info] if p else []

def preorder_stack(root):                 # textbook PREORD
    out, stack, ptr = [], [None], root
    while ptr:
        out.append(ptr.info)
        if ptr.right:
            stack.append(ptr.right)
        ptr = ptr.left if ptr.left else stack.pop()
    return out

def level_order(root):
    out, q = [], deque([root] if root else [])
    while q:
        p = q.popleft(); out.append(p.info)
        q.extend(c for c in (p.left, p.right) if c)
    return out

root = Node('A', Node('B', Node('D'), Node('E', Node('F'), Node('H', Node('J'), Node('K')))),
                 Node('C', None, Node('G')))
for f in (preorder, inorder, postorder, preorder_stack, level_order):
    print(f"{f.__name__:15}", ' '.join(f(root)))
`,
  };

  C['bt-repr'] = {
    c: String.raw`#include <stdio.h>

/* Sequential representation: TREE[1] is the root, children of K at 2K and 2K+1, '-' = empty. */
int main(void) {
    char TREE[16] = " ABCDE-G--FH";            /* index 0 unused */
    int n = 11;
    for (int k = 1; k <= n; k++) {
        if (TREE[k] == '-') continue;
        printf("TREE[%2d] = %c", k, TREE[k]);
        if (2 * k <= n && TREE[2 * k] != '-') printf("   left = %c", TREE[2 * k]);
        if (2 * k + 1 <= n && TREE[2 * k + 1] != '-') printf("   right = %c", TREE[2 * k + 1]);
        if (k > 1) printf("   parent = %c", TREE[k / 2]);
        printf("\n");
    }
    /* Linked representation in parallel arrays (0 = NULL). */
    char INFO[] = {0, 'A', 'B', 'C', 'D', 'E', 'G', 'F', 'H'};
    int LEFT[]  = {0,  2,   4,   0,   0,   7,   0,   0,   0};
    int RIGHT[] = {0,  3,   5,   6,   0,   8,   0,   0,   0};
    int ROOT = 1;
    printf("ROOT = %c, LEFT[ROOT] = %c, RIGHT[ROOT] = %c\n", INFO[ROOT], INFO[LEFT[ROOT]], INFO[RIGHT[ROOT]]);
    return 0;
}
`,
    py: String.raw`# Sequential (array) representation; index 0 unused, None = empty position
TREE = [None, 'A', 'B', 'C', 'D', 'E', None, 'G', None, None, 'F', 'H']

def left(k):   return 2 * k
def right(k):  return 2 * k + 1
def parent(k): return k // 2

for k in range(1, len(TREE)):
    if TREE[k] is None:
        continue
    kids = [TREE[c] for c in (left(k), right(k)) if c < len(TREE) and TREE[c]]
    print(f"TREE[{k}] = {TREE[k]}  children: {kids}  parent: {TREE[parent(k)] if k > 1 else '-'}")

# Linked representation with parallel lists (0 = NULL)
INFO  = [None, 'A', 'B', 'C', 'D', 'E', 'G', 'F', 'H']
LEFT  = [0, 2, 4, 0, 0, 7, 0, 0, 0]
RIGHT = [0, 3, 5, 6, 0, 8, 0, 0, 0]

def inorder(p):
    return inorder(LEFT[p]) + [INFO[p]] + inorder(RIGHT[p]) if p else []

print(inorder(1))
`,
  };

  C['expression-tree'] = {
    c: String.raw`#include <stdio.h>
#include <stdlib.h>
#include <ctype.h>

typedef struct E { char v; struct E *l, *r; } E;

E *build(const char *postfix) {           /* single-character tokens, e.g. "ABC*+DEF/-*" */
    E *stack[64]; int top = 0;
    for (const char *p = postfix; *p; p++) {
        E *n = malloc(sizeof *n); n->v = *p; n->l = n->r = NULL;
        if (!isalnum((unsigned char)*p)) { n->r = stack[--top]; n->l = stack[--top]; }
        stack[top++] = n;
    }
    return stack[0];
}
void prefix(E *t)  { if (!t) return; printf("%c", t->v); prefix(t->l); prefix(t->r); }
void infix(E *t)   { if (!t) return; if (t->l) printf("("); infix(t->l); printf("%c", t->v); infix(t->r); if (t->l) printf(")"); }
void postfix(E *t) { if (!t) return; postfix(t->l); postfix(t->r); printf("%c", t->v); }
double eval(E *t) {
    if (isdigit((unsigned char)t->v)) return t->v - '0';
    double a = eval(t->l), b = eval(t->r);
    switch (t->v) { case '+': return a + b; case '-': return a - b; case '*': return a * b; default: return a / b; }
}

int main(void) {
    E *t = build("ABC*+DEF/-*");        /* (A + B*C) * (D - E/F) */
    prefix(t); printf("\n"); infix(t); printf("\n"); postfix(t); printf("\n");
    printf("value of (3+4)*5-6/2 = %g\n", eval(build("34+5*62/-")));
    return 0;
}
`,
    py: String.raw`import operator
OPS = {'+': operator.add, '-': operator.sub, '*': operator.mul, '/': operator.truediv}

class E:
    def __init__(self, v, l=None, r=None):
        self.v, self.l, self.r = v, l, r

def build(postfix_tokens):
    stack = []
    for t in postfix_tokens:
        if t in OPS:
            r, l = stack.pop(), stack.pop()
            stack.append(E(t, l, r))
        else:
            stack.append(E(t))
    return stack[0]

def prefix(t):  return [t.v] + prefix(t.l) + prefix(t.r) if t else []
def postfix(t): return postfix(t.l) + postfix(t.r) + [t.v] if t else []
def infix(t):   return t.v if not t.l else f"({infix(t.l)} {t.v} {infix(t.r)})"
def evaluate(t):
    return float(t.v) if not t.l else OPS[t.v](evaluate(t.l), evaluate(t.r))

tree = build("3 4 + 5 * 6 2 / -".split())
print(' '.join(prefix(tree)), '|', infix(tree), '|', ' '.join(postfix(tree)), '=', evaluate(tree))
`,
  };

  C['threaded-bt'] = {
    c: String.raw`#include <stdio.h>
#include <stdlib.h>

/* One-way inorder threading: a NULL right link becomes a thread to the inorder successor. */
typedef struct T { char info; struct T *left, *right; int rthread; } T;

T *mk(char c, T *l, T *r) { T *t = malloc(sizeof *t); t->info = c; t->left = l; t->right = r; t->rthread = 0; return t; }

T *prev = NULL;
void thread(T *p) {                          /* inorder walk that installs the threads */
    if (!p) return;
    thread(p->left);
    if (prev && prev->right == NULL) { prev->right = p; prev->rthread = 1; }
    prev = p;
    thread(p->rthread ? NULL : p->right);
}

void threaded_inorder(T *root) {             /* no stack, no recursion */
    T *p = root;
    while (p && p->left) p = p->left;
    while (p) {
        printf("%c ", p->info);
        if (p->rthread) p = p->right;
        else { p = p->right; while (p && p->left) p = p->left; }
    }
    printf("\n");
}

int main(void) {
    T *root = mk('A', mk('B', mk('D', NULL, NULL), mk('E', mk('F', NULL, NULL), mk('H', NULL, NULL))), mk('C', NULL, mk('G', NULL, NULL)));
    thread(root);
    threaded_inorder(root);                  /* D B F E H A C G */
    return 0;
}
`,
    py: String.raw`class T:
    def __init__(self, info, left=None, right=None):
        self.info, self.left, self.right, self.rthread = info, left, right, False

def add_threads(root):
    order = []
    def walk(p):
        if p:
            walk(p.left); order.append(p); walk(p.right)
    walk(root)
    for node, succ in zip(order, order[1:] + [None]):
        if node.right is None:
            node.right, node.rthread = succ, True      # thread to the inorder successor

def threaded_inorder(root):
    p, out = root, []
    while p and p.left:
        p = p.left
    while p:
        out.append(p.info)
        if p.rthread:
            p = p.right
        else:
            p = p.right
            while p and p.left:
                p = p.left
    return out

root = T('A', T('B', T('D'), T('E', T('F'), T('H'))), T('C', None, T('G')))
add_threads(root)
print(threaded_inorder(root))
`,
  };

  C['general-tree'] = {
    c: String.raw`#include <stdio.h>
#include <stdlib.h>

/* Left-child, right-sibling: every general tree becomes a binary tree. */
typedef struct G { char info; struct G *child, *sibling; } G;

G *mk(char c) { G *g = calloc(1, sizeof *g); g->info = c; return g; }
void add_child(G *parent, G *c) {
    if (!parent->child) { parent->child = c; return; }
    G *p = parent->child; while (p->sibling) p = p->sibling; p->sibling = c;
}
void preorder(G *t, int depth) {
    for (; t; t = t->sibling) {
        printf("%*s%c\n", depth * 2, "", t->info);
        preorder(t->child, depth + 1);
    }
}

int main(void) {
    G *A = mk('A'), *B = mk('B'), *C = mk('C'), *D = mk('D');
    add_child(A, B); add_child(A, C); add_child(A, D);
    add_child(B, mk('E')); add_child(B, mk('F'));
    add_child(D, mk('G')); add_child(D, mk('H')); add_child(D, mk('I'));
    preorder(A, 0);
    printf("binary view: LEFT(A) = %c, RIGHT(B) = %c\n", A->child->info, B->sibling->info);
    return 0;
}
`,
    py: String.raw`class GNode:
    def __init__(self, info, children=()):
        self.info, self.children = info, list(children)

class BNode:
    def __init__(self, info):
        self.info, self.left, self.right = info, None, None   # left = first child, right = next sibling

def to_binary(g):
    b = BNode(g.info)
    prev = None
    for child in g.children:
        cb = to_binary(child)
        if prev is None:
            b.left = cb
        else:
            prev.right = cb
        prev = cb
    return b

def show(b, depth=0):
    if b:
        print("  " * depth + b.info)
        show(b.left, depth + 1)      # children are one level deeper
        show(b.right, depth)         # siblings stay at the same depth

tree = GNode('A', [GNode('B', [GNode('E'), GNode('F')]), GNode('C'), GNode('D', [GNode('G'), GNode('H'), GNode('I')])])
show(to_binary(tree))
`,
  };

  C['bst'] = {
    c: String.raw`#include <stdio.h>
#include <stdlib.h>

typedef struct N { int info; struct N *left, *right; } N;

N *insert(N *root, int item) {
    if (!root) { N *n = calloc(1, sizeof *n); n->info = item; return n; }
    if (item < root->info) root->left = insert(root->left, item);
    else if (item > root->info) root->right = insert(root->right, item);
    return root;                                  /* duplicates are ignored */
}
N *find(N *root, int item) {
    while (root && root->info != item) root = item < root->info ? root->left : root->right;
    return root;
}
N *delete_item(N *root, int item) {
    if (!root) return NULL;
    if (item < root->info) root->left = delete_item(root->left, item);
    else if (item > root->info) root->right = delete_item(root->right, item);
    else {
        if (!root->left || !root->right) {        /* case A: 0 or 1 child */
            N *child = root->left ? root->left : root->right;
            free(root);
            return child;
        }
        N *suc = root->right;                     /* case B: inorder successor */
        while (suc->left) suc = suc->left;
        root->info = suc->info;
        root->right = delete_item(root->right, suc->info);
    }
    return root;
}
void inorder(N *t) { if (t) { inorder(t->left); printf("%d ", t->info); inorder(t->right); } }

int main(void) {
    int keys[] = {50, 30, 70, 20, 40, 60, 80, 35, 45, 65};
    N *root = NULL;
    for (int i = 0; i < 10; i++) root = insert(root, keys[i]);
    inorder(root); printf("\n");
    printf("find 45: %s\n", find(root, 45) ? "yes" : "no");
    root = delete_item(root, 30);            /* two children */
    root = delete_item(root, 80);            /* leaf */
    inorder(root); printf("\n");
    return 0;
}
`,
    py: String.raw`class Node:
    def __init__(self, info):
        self.info, self.left, self.right = info, None, None

def insert(root, item):
    if root is None:
        return Node(item)
    if item < root.info:
        root.left = insert(root.left, item)
    elif item > root.info:
        root.right = insert(root.right, item)
    return root

def find(root, item):
    while root and root.info != item:
        root = root.left if item < root.info else root.right
    return root

def delete(root, item):
    if root is None:
        return None
    if item < root.info:
        root.left = delete(root.left, item)
    elif item > root.info:
        root.right = delete(root.right, item)
    else:
        if root.left is None or root.right is None:      # case A
            return root.left or root.right
        suc = root.right                                  # case B
        while suc.left:
            suc = suc.left
        root.info = suc.info
        root.right = delete(root.right, suc.info)
    return root

def inorder(t):
    return inorder(t.left) + [t.info] + inorder(t.right) if t else []

root = None
for k in (50, 30, 70, 20, 40, 60, 80, 35, 45, 65):
    root = insert(root, k)
print(inorder(root), bool(find(root, 45)))
root = delete(root, 30); root = delete(root, 80)
print(inorder(root))
`,
  };

  C['avl'] = {
    c: String.raw`#include <stdio.h>
#include <stdlib.h>

typedef struct A { int key, h; struct A *l, *r; } A;
int H(A *n) { return n ? n->h : 0; }
int max(int a, int b) { return a > b ? a : b; }
void upd(A *n) { n->h = 1 + max(H(n->l), H(n->r)); }
int bf(A *n) { return H(n->l) - H(n->r); }
A *rot_right(A *y) { A *x = y->l; y->l = x->r; x->r = y; upd(y); upd(x); return x; }
A *rot_left(A *x)  { A *y = x->r; x->r = y->l; y->l = x; upd(x); upd(y); return y; }

A *balance(A *n) {
    upd(n);
    if (bf(n) > 1)  { if (bf(n->l) < 0) n->l = rot_left(n->l);  return rot_right(n); }  /* LL / LR */
    if (bf(n) < -1) { if (bf(n->r) > 0) n->r = rot_right(n->r); return rot_left(n); }   /* RR / RL */
    return n;
}
A *insert(A *n, int key) {
    if (!n) { n = calloc(1, sizeof *n); n->key = key; n->h = 1; return n; }
    if (key < n->key) n->l = insert(n->l, key);
    else if (key > n->key) n->r = insert(n->r, key);
    else return n;
    return balance(n);
}
A *erase(A *n, int key) {
    if (!n) return NULL;
    if (key < n->key) n->l = erase(n->l, key);
    else if (key > n->key) n->r = erase(n->r, key);
    else {
        if (!n->l || !n->r) { A *c = n->l ? n->l : n->r; free(n); return c; }
        A *s = n->r; while (s->l) s = s->l;
        n->key = s->key; n->r = erase(n->r, s->key);
    }
    return balance(n);
}
void show(A *n, int d) { if (!n) return; show(n->r, d + 1); printf("%*s%d (bf %d)\n", 4 * d, "", n->key, bf(n)); show(n->l, d + 1); }

int main(void) {
    A *root = NULL;
    int keys[] = {10, 20, 30, 40, 50, 25};
    for (int i = 0; i < 6; i++) root = insert(root, keys[i]);
    show(root, 0);
    root = erase(root, 40);
    printf("--- after deleting 40 ---\n");
    show(root, 0);
    return 0;
}
`,
    py: String.raw`class AVL:
    def __init__(self, key):
        self.key, self.h, self.l, self.r = key, 1, None, None

def H(n): return n.h if n else 0
def upd(n): n.h = 1 + max(H(n.l), H(n.r))
def bf(n): return H(n.l) - H(n.r)

def rot_right(y):
    x = y.l; y.l, x.r = x.r, y; upd(y); upd(x); return x

def rot_left(x):
    y = x.r; x.r, y.l = y.l, x; upd(x); upd(y); return y

def balance(n):
    upd(n)
    if bf(n) > 1:                         # LL or LR
        if bf(n.l) < 0:
            n.l = rot_left(n.l)
        return rot_right(n)
    if bf(n) < -1:                        # RR or RL
        if bf(n.r) > 0:
            n.r = rot_right(n.r)
        return rot_left(n)
    return n

def insert(n, key):
    if n is None:
        return AVL(key)
    if key < n.key:   n.l = insert(n.l, key)
    elif key > n.key: n.r = insert(n.r, key)
    else:             return n
    return balance(n)

def show(n, d=0):
    if n:
        show(n.r, d + 1); print("    " * d + f"{n.key} (bf {bf(n)})"); show(n.l, d + 1)

root = None
for k in (10, 20, 30, 40, 50, 25):        # sorted input stays balanced
    root = insert(root, k)
show(root)
`,
  };

  C['mway'] = {
    c: String.raw`#include <stdio.h>
#include <stdlib.h>
#define M 3                                  /* order: up to M-1 keys, M subtrees */

typedef struct MW { int n, key[M - 1]; struct MW *sub[M]; } MW;

MW *mk(int k) { MW *t = calloc(1, sizeof *t); t->n = 1; t->key[0] = k; return t; }

MW *insert(MW *t, int k) {
    if (!t) return mk(k);
    MW *p = t;
    for (;;) {
        int i = 0; while (i < p->n && k > p->key[i]) i++;
        if (i < p->n && p->key[i] == k) return t;          /* already present */
        if (!p->sub[i] && p->n < M - 1) {                  /* room in this node */
            for (int j = p->n; j > i; j--) { p->key[j] = p->key[j - 1]; p->sub[j + 1] = p->sub[j]; }
            p->key[i] = k; p->sub[i + 1] = NULL; p->n++;
            return t;
        }
        if (!p->sub[i]) { p->sub[i] = mk(k); return t; }   /* hang a new node */
        p = p->sub[i];
    }
}
int search(MW *t, int k) {
    while (t) {
        int i = 0; while (i < t->n && k > t->key[i]) i++;
        if (i < t->n && t->key[i] == k) return 1;
        t = t->sub[i];
    }
    return 0;
}
void inorder(MW *t) { if (!t) return; for (int i = 0; i < t->n; i++) { inorder(t->sub[i]); printf("%d ", t->key[i]); } inorder(t->sub[t->n]); }

int main(void) {
    int keys[] = {50, 20, 80, 10, 30, 60, 90, 25, 35};
    MW *root = NULL;
    for (int i = 0; i < 9; i++) root = insert(root, keys[i]);
    inorder(root); printf("\n");
    printf("search 35: %d, search 40: %d\n", search(root, 35), search(root, 40));
    return 0;
}
`,
    py: String.raw`class MWayNode:
    def __init__(self, key):
        self.keys, self.subs = [key], [None, None]

def insert(root, k, m=3):
    if root is None:
        return MWayNode(k)
    p = root
    while True:
        i = sum(1 for x in p.keys if x < k)
        if i < len(p.keys) and p.keys[i] == k:
            return root
        if p.subs[i] is None and len(p.keys) < m - 1:
            p.keys.insert(i, k); p.subs.insert(i + 1, None)
            return root
        if p.subs[i] is None:
            p.subs[i] = MWayNode(k)
            return root
        p = p.subs[i]

def inorder(t):
    if t is None:
        return []
    out = []
    for i, k in enumerate(t.keys):
        out += inorder(t.subs[i]) + [k]
    return out + inorder(t.subs[-1])

root = None
for k in (50, 20, 80, 10, 30, 60, 90, 25, 35):
    root = insert(root, k)
print(inorder(root))
`,
  };

  C['btree'] = {
    c: String.raw`#include <stdio.h>
#include <stdlib.h>
#define ORDER 4                       /* max ORDER-1 keys, ORDER children per node */

typedef struct B { int n, key[ORDER], leaf; struct B *child[ORDER + 1]; } B;

B *new_node(int leaf) { B *b = calloc(1, sizeof *b); b->leaf = leaf; return b; }

/* Insert into the subtree at x. If x overflows, split it: return the new right sibling and the median. */
B *ins(B *x, int k, int *median) {
    int i = x->n;
    if (x->leaf) {
        while (i > 0 && x->key[i - 1] > k) { x->key[i] = x->key[i - 1]; i--; }
        x->key[i] = k; x->n++;
    } else {
        while (i > 0 && x->key[i - 1] > k) i--;
        int up; B *right = ins(x->child[i], k, &up);
        if (right) {
            for (int j = x->n; j > i; j--) { x->key[j] = x->key[j - 1]; x->child[j + 1] = x->child[j]; }
            x->key[i] = up; x->child[i + 1] = right; x->n++;
        }
    }
    if (x->n < ORDER) return NULL;                   /* no overflow */
    int mid = (ORDER - 1) / 2;                       /* split around the median */
    B *r = new_node(x->leaf);
    *median = x->key[mid];
    r->n = x->n - mid - 1;
    for (int j = 0; j < r->n; j++) r->key[j] = x->key[mid + 1 + j];
    if (!x->leaf) for (int j = 0; j <= r->n; j++) r->child[j] = x->child[mid + 1 + j];
    x->n = mid;
    return r;
}
B *insert(B *root, int k) {
    int up; B *right = ins(root, k, &up);
    if (!right) return root;
    B *nr = new_node(0);                              /* the tree grows taller */
    nr->n = 1; nr->key[0] = up; nr->child[0] = root; nr->child[1] = right;
    return nr;
}
void show(B *x, int d) {
    printf("%*s[", 2 * d, "");
    for (int i = 0; i < x->n; i++) printf(i ? " %d" : "%d", x->key[i]);
    printf("]\n");
    if (!x->leaf) for (int i = 0; i <= x->n; i++) show(x->child[i], d + 1);
}

int main(void) {
    B *root = new_node(1);
    int keys[] = {10, 20, 5, 6, 12, 30, 7, 17, 3, 8, 25, 28};
    for (int i = 0; i < 12; i++) root = insert(root, keys[i]);
    show(root, 0);
    return 0;
}
`,
    py: String.raw`class BNode:
    def __init__(self, keys=None, kids=None):
        self.keys, self.kids = keys or [], kids or []

class BTree:
    def __init__(self, order=4):
        self.m, self.root = order, BNode()

    def search(self, k, x=None):
        x = x or self.root
        i = sum(1 for key in x.keys if key < k)
        if i < len(x.keys) and x.keys[i] == k:
            return True
        return bool(x.kids) and self.search(k, x.kids[i])

    def insert(self, k):
        split = self._insert(self.root, k)
        if split:                                   # root split: tree grows taller
            median, right = split
            self.root = BNode([median], [self.root, right])

    def _insert(self, x, k):
        i = sum(1 for key in x.keys if key < k)
        if i < len(x.keys) and x.keys[i] == k:
            return None
        if not x.kids:
            x.keys.insert(i, k)
        else:
            split = self._insert(x.kids[i], k)
            if split:
                median, right = split
                x.keys.insert(i, median)
                x.kids.insert(i + 1, right)
        if len(x.keys) < self.m:
            return None
        mid = (self.m - 1) // 2                     # overflow: split around the median
        right = BNode(x.keys[mid + 1:], x.kids[mid + 1:])
        median = x.keys[mid]
        x.keys, x.kids = x.keys[:mid], x.kids[:mid + 1]
        return median, right

    def show(self, x=None, d=0):
        x = x or self.root
        print("  " * d + str(x.keys))
        for c in x.kids:
            self.show(c, d + 1)

t = BTree(4)
for k in (10, 20, 5, 6, 12, 30, 7, 17, 3, 8, 25, 28):
    t.insert(k)
t.show(); print(t.search(17), t.search(18))
`,
  };

  C['heap'] = {
    c: String.raw`#include <stdio.h>

int TREE[64], N = 0;                         /* 1-based max-heap */

void inshheap(int item) {
    int ptr = ++N; TREE[ptr] = item;
    while (ptr > 1 && TREE[ptr / 2] < TREE[ptr]) {         /* sift up */
        int t = TREE[ptr]; TREE[ptr] = TREE[ptr / 2]; TREE[ptr / 2] = t;
        ptr /= 2;
    }
}
int delheap(void) {
    int item = TREE[1];
    TREE[1] = TREE[N--];
    int ptr = 1;
    while (2 * ptr <= N) {                                 /* sift down */
        int c = 2 * ptr;
        if (c + 1 <= N && TREE[c + 1] > TREE[c]) c++;
        if (TREE[ptr] >= TREE[c]) break;
        int t = TREE[ptr]; TREE[ptr] = TREE[c]; TREE[c] = t;
        ptr = c;
    }
    return item;
}

int main(void) {
    int a[] = {44, 30, 50, 22, 60, 55, 77, 55};
    for (int i = 0; i < 8; i++) inshheap(a[i]);
    printf("heap array:");
    for (int i = 1; i <= N; i++) printf(" %d", TREE[i]);
    printf("\ndeleting the root repeatedly:");
    while (N > 0) printf(" %d", delheap());
    printf("\n");
    return 0;
}
`,
    py: String.raw`class MaxHeap:
    def __init__(self):
        self.tree = [None]                 # index 0 unused; root at 1

    def insert(self, item):
        self.tree.append(item)
        ptr = len(self.tree) - 1
        while ptr > 1 and self.tree[ptr // 2] < self.tree[ptr]:
            self.tree[ptr], self.tree[ptr // 2] = self.tree[ptr // 2], self.tree[ptr]
            ptr //= 2

    def delete(self):
        root, last = self.tree[1], self.tree.pop()
        n = len(self.tree) - 1
        if n:
            self.tree[1], ptr = last, 1
            while 2 * ptr <= n:
                c = 2 * ptr
                if c + 1 <= n and self.tree[c + 1] > self.tree[c]:
                    c += 1
                if self.tree[ptr] >= self.tree[c]:
                    break
                self.tree[ptr], self.tree[c] = self.tree[c], self.tree[ptr]
                ptr = c
        return root

h = MaxHeap()
for x in (44, 30, 50, 22, 60, 55, 77, 55):
    h.insert(x)
print(h.tree[1:])
print([h.delete() for _ in range(8)])

import heapq            # Python's heapq is a MIN-heap
print(heapq.nsmallest(3, [44, 30, 50, 22, 60]))
`,
  };

  C['huffman'] = {
    c: String.raw`#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct H { int w; char sym; struct H *l, *r; } H;

H *mk(int w, char s, H *l, H *r) { H *h = malloc(sizeof *h); h->w = w; h->sym = s; h->l = l; h->r = r; return h; }

void codes(H *t, char *buf, int d) {
    if (!t->l) { buf[d] = '\0'; printf("%c (%2d): %s\n", t->sym, t->w, d ? buf : "0"); return; }
    buf[d] = '0'; codes(t->l, buf, d + 1);
    buf[d] = '1'; codes(t->r, buf, d + 1);
}

int main(void) {
    char sym[] = "abcdef"; int w[] = {5, 9, 12, 13, 16, 45};
    H *forest[16]; int n = 6;
    for (int i = 0; i < n; i++) forest[i] = mk(w[i], sym[i], NULL, NULL);
    while (n > 1) {
        for (int i = 0; i < n; i++)                       /* keep the forest sorted by weight */
            for (int j = i + 1; j < n; j++)
                if (forest[j]->w < forest[i]->w) { H *t = forest[i]; forest[i] = forest[j]; forest[j] = t; }
        H *t = mk(forest[0]->w + forest[1]->w, 0, forest[0], forest[1]);   /* join the two smallest */
        forest[0] = t; forest[1] = forest[--n];
    }
    char buf[32];
    codes(forest[0], buf, 0);
    return 0;
}
`,
    py: String.raw`import heapq, itertools

def huffman(weights):
    tick = itertools.count()               # tie-breaker so heapq never compares trees
    heap = [(w, next(tick), sym) for sym, w in weights.items()]
    heapq.heapify(heap)
    while len(heap) > 1:
        w1, _, t1 = heapq.heappop(heap)
        w2, _, t2 = heapq.heappop(heap)
        heapq.heappush(heap, (w1 + w2, next(tick), (t1, t2)))
    codes = {}
    def walk(t, code):
        if isinstance(t, tuple):
            walk(t[0], code + "0"); walk(t[1], code + "1")
        else:
            codes[t] = code or "0"
    walk(heap[0][2], "")
    return codes

w = {"a": 5, "b": 9, "c": 12, "d": 13, "e": 16, "f": 45}
codes = huffman(w)
print(codes)
print("weighted path length =", sum(w[s] * len(c) for s, c in codes.items()))
`,
  };

  const GRAPH_C = String.raw`#include <stdio.h>
#define V 8
const char *NAME = "ABCDEFGH";
int adj[V][V];                                   /* adjacency matrix */
void edge(int u, int v) { adj[u][v] = adj[v][u] = 1; }
`;
  const GRAPH_PY = String.raw`from collections import defaultdict, deque

def build(edges, directed=False):
    g = defaultdict(list)
    for u, v in edges:
        g[u].append(v)
        if not directed:
            g[v].append(u)
    for u in g:
        g[u].sort()
    return g

EDGES = [("A","B"),("A","C"),("A","D"),("B","E"),("C","F"),("D","F"),("E","G"),("F","G"),("F","H")]
`;

  C['graph-repr'] = {
    c: String.raw`#include <stdio.h>
#include <stdlib.h>
#define V 6

typedef struct Edge { int to, w; struct Edge *next; } Edge;
int matrix[V][V];
Edge *list[V];
const char *NAME = "ABCDEF";

void add_edge(int u, int v, int w) {           /* undirected, weighted */
    matrix[u][v] = matrix[v][u] = w;
    Edge *a = malloc(sizeof *a); a->to = v; a->w = w; a->next = list[u]; list[u] = a;
    Edge *b = malloc(sizeof *b); b->to = u; b->w = w; b->next = list[v]; list[v] = b;
}

int main(void) {
    add_edge(0, 1, 4); add_edge(0, 2, 2); add_edge(1, 2, 5); add_edge(1, 3, 10);
    add_edge(2, 4, 3); add_edge(4, 3, 4); add_edge(3, 5, 11); add_edge(4, 5, 7);
    printf("   "); for (int j = 0; j < V; j++) printf("%3c", NAME[j]); printf("\n");
    for (int i = 0; i < V; i++) { printf("%3c", NAME[i]); for (int j = 0; j < V; j++) printf("%3d", matrix[i][j]); printf("\n"); }
    for (int i = 0; i < V; i++) {
        printf("%c:", NAME[i]);
        for (Edge *e = list[i]; e; e = e->next) printf(" -> %c(%d)", NAME[e->to], e->w);
        printf("\n");
    }
    return 0;
}
`,
    py: String.raw`edges = [("A","B",4),("A","C",2),("B","C",5),("B","D",10),("C","E",3),("E","D",4),("D","F",11),("E","F",7)]
vertices = sorted({x for e in edges for x in e[:2]})
idx = {v: i for i, v in enumerate(vertices)}

matrix = [[0] * len(vertices) for _ in vertices]
adj = {v: [] for v in vertices}
for u, v, w in edges:
    matrix[idx[u]][idx[v]] = matrix[idx[v]][idx[u]] = w
    adj[u].append((v, w)); adj[v].append((u, w))

print("   " + "  ".join(vertices))
for v, row in zip(vertices, matrix):
    print(v, row)
for v in vertices:
    print(v, "->", adj[v])
`,
  };

  C['warshall'] = {
    c: String.raw`#include <stdio.h>
#define M 5

int main(void) {
    const char *name = "ABCDE";
    int P[M][M] = {0};
    P[0][1] = P[1][2] = P[2][3] = P[3][1] = P[0][4] = 1;      /* A>B, B>C, C>D, D>B, A>E */
    for (int k = 0; k < M; k++)
        for (int i = 0; i < M; i++)
            for (int j = 0; j < M; j++)
                P[i][j] = P[i][j] || (P[i][k] && P[k][j]);
    printf("  "); for (int j = 0; j < M; j++) printf(" %c", name[j]); printf("\n");
    for (int i = 0; i < M; i++) { printf("%c ", name[i]); for (int j = 0; j < M; j++) printf(" %d", P[i][j]); printf("\n"); }
    return 0;
}
`,
    py: String.raw`def warshall(adj):
    m = len(adj)
    p = [row[:] for row in adj]
    for k in range(m):
        for i in range(m):
            for j in range(m):
                p[i][j] = p[i][j] or (p[i][k] and p[k][j])
    return p

names = "ABCDE"
A = [[0] * 5 for _ in range(5)]
for u, v in ("AB", "BC", "CD", "DB", "AE"):
    A[names.index(u)][names.index(v)] = 1
for name, row in zip(names, warshall(A)):
    print(name, row)
`,
  };

  C['floyd'] = {
    c: String.raw`#include <stdio.h>
#define M 4
#define INF 1000000

int main(void) {
    const char *name = "ABCD";
    int Q[M][M];
    for (int i = 0; i < M; i++) for (int j = 0; j < M; j++) Q[i][j] = INF;   /* textbook: diagonal starts at INF too */
    Q[0][1] = 7; Q[0][3] = 5; Q[1][0] = 7; Q[1][3] = 2; Q[2][1] = 3; Q[3][2] = 1;
    for (int k = 0; k < M; k++)
        for (int i = 0; i < M; i++)
            for (int j = 0; j < M; j++)
                if (Q[i][k] + Q[k][j] < Q[i][j]) Q[i][j] = Q[i][k] + Q[k][j];
    for (int i = 0; i < M; i++) {
        printf("%c:", name[i]);
        for (int j = 0; j < M; j++) Q[i][j] >= INF ? printf("   inf") : printf("%6d", Q[i][j]);
        printf("\n");
    }
    return 0;
}
`,
    py: String.raw`INF = float("inf")

def floyd(w):
    m = len(w)
    q = [[w[i][j] if w[i][j] else INF for j in range(m)] for i in range(m)]
    for k in range(m):
        for i in range(m):
            for j in range(m):
                if q[i][k] + q[k][j] < q[i][j]:
                    q[i][j] = q[i][k] + q[k][j]
    return q

W = [[0, 7, 0, 5],
     [7, 0, 0, 2],
     [0, 3, 0, 0],
     [0, 0, 1, 0]]
for row in floyd(W):
    print(row)
`,
  };

  C['bfs'] = {
    c: GRAPH_C + String.raw`
void bfs(int start) {
    int status[V], orig[V], queue[V], front = 0, rear = 0;
    for (int i = 0; i < V; i++) { status[i] = 1; orig[i] = -1; }     /* 1 = ready */
    queue[rear++] = start; status[start] = 2;                         /* 2 = waiting */
    printf("BFS: ");
    while (front < rear) {
        int n = queue[front++];
        printf("%c ", NAME[n]); status[n] = 3;                         /* 3 = processed */
        for (int m = 0; m < V; m++)
            if (adj[n][m] && status[m] == 1) { queue[rear++] = m; status[m] = 2; orig[m] = n; }
    }
    printf("\npath to H: H");
    for (int v = 7; orig[v] != -1; v = orig[v]) printf(" <- %c", NAME[orig[v]]);
    printf("\n");
}

int main(void) {
    edge(0,1); edge(0,2); edge(0,3); edge(1,4); edge(2,5); edge(3,5); edge(4,6); edge(5,6); edge(5,7);
    bfs(0);
    return 0;
}
`,
    py: GRAPH_PY + String.raw`
def bfs(g, start):
    status = defaultdict(lambda: 1)          # 1 ready, 2 waiting, 3 processed
    orig, order, q = {}, [], deque([start])
    status[start] = 2
    while q:
        n = q.popleft()
        order.append(n); status[n] = 3
        for m in g[n]:
            if status[m] == 1:
                status[m] = 2; orig[m] = n; q.append(m)
    return order, orig

order, orig = bfs(build(EDGES), "A")
path, v = ["H"], "H"
while v != "A":
    v = orig[v]; path.append(v)
print(order, "path:", " -> ".join(reversed(path)))
`,
  };

  C['dfs'] = {
    c: GRAPH_C + String.raw`
int visited[V];
void dfs_rec(int n) {
    visited[n] = 1; printf("%c ", NAME[n]);
    for (int m = 0; m < V; m++) if (adj[n][m] && !visited[m]) dfs_rec(m);
}
void dfs_stack(int start) {                     /* textbook version with STATUS */
    int status[V], stack[V * V], top = 0;
    for (int i = 0; i < V; i++) status[i] = 1;
    stack[top++] = start; status[start] = 2;
    while (top) {
        int n = stack[--top];
        printf("%c ", NAME[n]); status[n] = 3;
        for (int m = 0; m < V; m++) if (adj[n][m] && status[m] == 1) { stack[top++] = m; status[m] = 2; }
    }
}

int main(void) {
    edge(0,1); edge(0,2); edge(0,3); edge(1,4); edge(2,5); edge(3,5); edge(4,6); edge(5,6); edge(5,7);
    printf("recursive: "); dfs_rec(0); printf("\n");
    printf("stack    : "); dfs_stack(0); printf("\n");
    return 0;
}
`,
    py: GRAPH_PY + String.raw`
def dfs_recursive(g, n, seen=None):
    seen = seen if seen is not None else []
    seen.append(n)
    for m in g[n]:
        if m not in seen:
            dfs_recursive(g, m, seen)
    return seen

def dfs_stack(g, start):                 # textbook version with STATUS
    status = defaultdict(lambda: 1)
    stack, order = [start], []
    status[start] = 2
    while stack:
        n = stack.pop()
        order.append(n); status[n] = 3
        for m in g[n]:
            if status[m] == 1:
                status[m] = 2; stack.append(m)
    return order

g = build(EDGES)
print(dfs_recursive(g, "A"), dfs_stack(g, "A"))
`,
  };

  C['topo-sort'] = {
    c: String.raw`#include <stdio.h>
#define V 7

int main(void) {
    const char *name = "ABCDEFG";
    int adj[V][V] = {0}, indeg[V] = {0}, queue[V], f = 0, r = 0, out = 0;
    int e[][2] = {{0,1},{0,2},{1,3},{2,3},{2,4},{3,5},{4,5},{6,4}};   /* A>B, A>C, ... G>E */
    for (int i = 0; i < 8; i++) { adj[e[i][0]][e[i][1]] = 1; indeg[e[i][1]]++; }
    for (int v = 0; v < V; v++) if (!indeg[v]) queue[r++] = v;
    while (f < r) {
        int n = queue[f++]; printf("%c ", name[n]); out++;
        for (int m = 0; m < V; m++) if (adj[n][m] && --indeg[m] == 0) queue[r++] = m;
    }
    printf(out == V ? "\n" : "\n(cycle detected)\n");
    return 0;
}
`,
    py: String.raw`from collections import deque

def topo_sort(edges):
    nodes = sorted({x for e in edges for x in e})
    indeg = {v: 0 for v in nodes}
    out_edges = {v: [] for v in nodes}
    for u, v in edges:
        out_edges[u].append(v); indeg[v] += 1
    q = deque(v for v in nodes if indeg[v] == 0)
    order = []
    while q:
        n = q.popleft(); order.append(n)
        for m in out_edges[n]:
            indeg[m] -= 1
            if indeg[m] == 0:
                q.append(m)
    if len(order) < len(nodes):
        raise ValueError("the graph has a cycle")
    return order

print(topo_sort([("A","B"),("A","C"),("B","D"),("C","D"),("C","E"),("D","F"),("E","F"),("G","E")]))
`,
  };

  C['dijkstra'] = {
    c: String.raw`#include <stdio.h>
#define V 5
#define INF 1000000

int main(void) {
    const char *name = "SABCD";                    /* S=0 A=1 B=2 C=3 D=4 */
    int w[V][V] = {0};
    w[0][1] = 10; w[0][2] = 5; w[2][1] = 3; w[1][3] = 1; w[2][3] = 9; w[2][4] = 2; w[4][3] = 6; w[3][4] = 4; w[4][0] = 7;
    int dist[V], done[V] = {0}, pred[V];
    for (int i = 0; i < V; i++) { dist[i] = INF; pred[i] = -1; }
    dist[0] = 0;
    for (int it = 0; it < V; it++) {
        int u = -1;
        for (int i = 0; i < V; i++) if (!done[i] && (u < 0 || dist[i] < dist[u])) u = i;
        if (dist[u] == INF) break;
        done[u] = 1;
        for (int v = 0; v < V; v++)
            if (w[u][v] && !done[v] && dist[u] + w[u][v] < dist[v]) { dist[v] = dist[u] + w[u][v]; pred[v] = u; }
    }
    for (int i = 0; i < V; i++) printf("%c: dist %d, pred %c\n", name[i], dist[i], pred[i] < 0 ? '-' : name[pred[i]]);
    return 0;
}
`,
    py: String.raw`import heapq

def dijkstra(graph, source):
    dist = {v: float("inf") for v in graph}
    pred = {}
    dist[source] = 0
    heap = [(0, source)]
    while heap:
        d, u = heapq.heappop(heap)
        if d > dist[u]:
            continue                       # stale entry
        for v, w in graph[u]:
            if d + w < dist[v]:
                dist[v], pred[v] = d + w, u
                heapq.heappush(heap, (dist[v], v))
    return dist, pred

G = {"S": [("A", 10), ("B", 5)], "A": [("C", 1)], "B": [("A", 3), ("C", 9), ("D", 2)],
     "C": [("D", 4)], "D": [("C", 6), ("S", 7)]}
print(dijkstra(G, "S"))
`,
  };

  C['prim'] = {
    c: String.raw`#include <stdio.h>
#define V 7
#define INF 1000000

int main(void) {
    const char *name = "ABCDEFG";
    int w[V][V] = {0};
    int e[][3] = {{0,1,7},{0,3,5},{1,2,8},{1,3,9},{1,4,7},{2,4,5},{3,4,15},{3,5,6},{4,5,8},{4,6,9},{5,6,11}};
    for (int i = 0; i < 11; i++) w[e[i][0]][e[i][1]] = w[e[i][1]][e[i][0]] = e[i][2];
    int key[V], in_tree[V] = {0}, pred[V], total = 0;
    for (int i = 0; i < V; i++) { key[i] = INF; pred[i] = -1; }
    key[0] = 0;
    for (int it = 0; it < V; it++) {
        int u = -1;
        for (int i = 0; i < V; i++) if (!in_tree[i] && (u < 0 || key[i] < key[u])) u = i;
        in_tree[u] = 1;
        if (pred[u] >= 0) { printf("%c - %c (%d)\n", name[pred[u]], name[u], key[u]); total += key[u]; }
        for (int v = 0; v < V; v++) if (w[u][v] && !in_tree[v] && w[u][v] < key[v]) { key[v] = w[u][v]; pred[v] = u; }
    }
    printf("total weight = %d\n", total);          /* 39 */
    return 0;
}
`,
    py: String.raw`import heapq

def prim(graph, start):
    in_tree, tree, total = {start}, [], 0
    heap = [(w, start, v) for v, w in graph[start]]
    heapq.heapify(heap)
    while heap and len(in_tree) < len(graph):
        w, u, v = heapq.heappop(heap)
        if v in in_tree:
            continue
        in_tree.add(v); tree.append((u, v, w)); total += w
        for x, wx in graph[v]:
            if x not in in_tree:
                heapq.heappush(heap, (wx, v, x))
    return tree, total

edges = [("A","B",7),("A","D",5),("B","C",8),("B","D",9),("B","E",7),("C","E",5),
         ("D","E",15),("D","F",6),("E","F",8),("E","G",9),("F","G",11)]
graph = {}
for u, v, w in edges:
    graph.setdefault(u, []).append((v, w)); graph.setdefault(v, []).append((u, w))
print(prim(graph, "A"))
`,
  };

  C['kruskal'] = {
    c: String.raw`#include <stdio.h>
#include <stdlib.h>
#define V 7

int parent[V];
int find(int x) { return parent[x] == x ? x : (parent[x] = find(parent[x])); }
typedef struct { int u, v, w; } Edge;
int cmp(const void *a, const void *b) { return ((const Edge *)a)->w - ((const Edge *)b)->w; }

int main(void) {
    const char *name = "ABCDEFG";
    Edge e[] = {{0,1,7},{0,3,5},{1,2,8},{1,3,9},{1,4,7},{2,4,5},{3,4,15},{3,5,6},{4,5,8},{4,6,9},{5,6,11}};
    int m = sizeof e / sizeof e[0], taken = 0, total = 0;
    qsort(e, m, sizeof e[0], cmp);
    for (int i = 0; i < V; i++) parent[i] = i;
    for (int i = 0; i < m && taken < V - 1; i++) {
        int a = find(e[i].u), b = find(e[i].v);
        if (a != b) { parent[a] = b; taken++; total += e[i].w; printf("take %c-%c (%d)\n", name[e[i].u], name[e[i].v], e[i].w); }
    }
    printf("total weight = %d\n", total);
    return 0;
}
`,
    py: String.raw`def kruskal(vertices, edges):
    parent = {v: v for v in vertices}
    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]     # path halving
            x = parent[x]
        return x
    tree, total = [], 0
    for u, v, w in sorted(edges, key=lambda e: e[2]):
        a, b = find(u), find(v)
        if a != b:                            # different components: no cycle
            parent[a] = b
            tree.append((u, v, w)); total += w
    return tree, total

edges = [("A","B",7),("A","D",5),("B","C",8),("B","D",9),("B","E",7),("C","E",5),
         ("D","E",15),("D","F",6),("E","F",8),("E","G",9),("F","G",11)]
print(kruskal("ABCDEFG", edges))
`,
  };
})(typeof window !== 'undefined' ? window : globalThis);
