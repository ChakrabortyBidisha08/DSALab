/* DSA Lab · code/code-linear.js — C and Python programs: arrays, lists, stacks, queues, recursion, strings */
(function (g) {
  'use strict';
  const C = (g.DSA.code = g.DSA.code || {});

  C['array-traverse'] = {
    c: String.raw`#include <stdio.h>

/* Traverse LA[LB..UB] and apply PROCESS (here: print and sum). C arrays start at 0. */
int main(void) {
    int LA[] = {12, 7, 31, 4, 25, 18, 9};
    int n = sizeof LA / sizeof LA[0];
    int sum = 0, max = LA[0];
    for (int k = 0; k < n; k++) {          /* K := LB ... UB */
        printf("LA[%d] = %d\n", k, LA[k]); /* PROCESS */
        sum += LA[k];
        if (LA[k] > max) max = LA[k];
    }
    printf("SUM = %d, MAX = %d\n", sum, max);
    return 0;
}
`,
    py: String.raw`def traverse(la, process):
    """Visit every element once, from the first to the last."""
    for k, value in enumerate(la):
        process(k, value)

LA = [12, 7, 31, 4, 25, 18, 9]
total = 0

def add(k, value):
    global total
    total += value
    print(f"LA[{k}] = {value}")

traverse(LA, add)
print("SUM =", total, " MAX =", max(LA))
`,
  };

  C['array-insert'] = {
    c: String.raw`#include <stdio.h>
#define MAX 10

/* Insert item at position k (1-based, as in the textbook). Returns new n, or -1 on overflow. */
int insert(int la[], int n, int k, int item) {
    if (n == MAX) { printf("OVERFLOW\n"); return -1; }
    for (int j = n; j >= k; j--)      /* move LA[N] .. LA[K] one place right */
        la[j] = la[j - 1];            /* (index j-1 in C is position j)       */
    la[k - 1] = item;
    return n + 1;
}

int main(void) {
    int la[MAX] = {10, 20, 30, 40, 50};
    int n = 5;
    n = insert(la, n, 3, 25);
    for (int i = 0; i < n; i++) printf("%d ", la[i]);
    printf("\n");
    return 0;
}
`,
    py: String.raw`def insert(la, n, k, item, maxsize):
    """Insert item at position k (1-based). la has room for maxsize items."""
    if n == maxsize:
        raise OverflowError("array is full")
    j = n
    while j >= k:                  # shift LA[N] .. LA[K] right, starting at the end
        la[j] = la[j - 1]
        j -= 1
    la[k - 1] = item
    return n + 1

LA = [10, 20, 30, 40, 50, None, None, None]
n = insert(LA, 5, 3, 25, len(LA))
print(LA[:n])   # [10, 20, 25, 30, 40, 50]
`,
  };

  C['array-delete'] = {
    c: String.raw`#include <stdio.h>

/* Delete the element at position k (1-based); its value is stored in *item. Returns new n. */
int delete_at(int la[], int n, int k, int *item) {
    *item = la[k - 1];
    for (int j = k; j <= n - 1; j++)  /* LA[J] := LA[J+1] */
        la[j - 1] = la[j];
    return n - 1;
}

int main(void) {
    int la[] = {15, 25, 35, 45, 55, 65};
    int n = 6, item;
    n = delete_at(la, n, 2, &item);
    printf("deleted %d:", item);
    for (int i = 0; i < n; i++) printf(" %d", la[i]);
    printf("\n");
    return 0;
}
`,
    py: String.raw`def delete_at(la, n, k):
    """Delete position k (1-based) from la[0:n]; return (item, new n)."""
    if n == 0:
        raise IndexError("underflow: array is empty")
    item = la[k - 1]
    for j in range(k, n):          # move LA[K+1] .. LA[N] one place left
        la[j - 1] = la[j]
    la[n - 1] = None
    return item, n - 1

LA = [15, 25, 35, 45, 55, 65]
item, n = delete_at(LA, 6, 2)
print("deleted", item, "->", LA[:n])
`,
  };

  C['array-2d'] = {
    c: String.raw`#include <stdio.h>

/* Address of A[J][K] (1-based) in an M x N array starting at base, w bytes per element. */
long loc_row_major(long base, int w, int N, int J, int K) { return base + w * ((long)N * (J - 1) + (K - 1)); }
long loc_col_major(long base, int w, int M, int J, int K) { return base + w * ((long)M * (K - 1) + (J - 1)); }

int main(void) {
    int M = 3, N = 4, J = 2, K = 3, w = 4;
    long base = 200;
    printf("row-major    LOC(A[%d,%d]) = %ld\n", J, K, loc_row_major(base, w, N, J, K));
    printf("column-major LOC(A[%d,%d]) = %ld\n", J, K, loc_col_major(base, w, M, J, K));

    int A[3][4];                      /* C itself uses row-major order: check it */
    printf("C: &A[1][2] - &A[0][0] = %ld elements\n", (long)(&A[1][2] - &A[0][0]));
    return 0;
}
`,
    py: String.raw`def loc_row_major(base, w, m, n, j, k):
    return base + w * (n * (j - 1) + (k - 1))

def loc_col_major(base, w, m, n, j, k):
    return base + w * (m * (k - 1) + (j - 1))

M, N, J, K, w, base = 3, 4, 2, 3, 4, 200
print("row-major   :", loc_row_major(base, w, M, N, J, K))   # 224
print("column-major:", loc_col_major(base, w, M, N, J, K))   # 228

# Storage order of every element
print("row order   :", [(j, k) for j in range(1, M + 1) for k in range(1, N + 1)])
print("column order:", [(j, k) for k in range(1, N + 1) for j in range(1, M + 1)])
`,
  };

  C['matrix-mult'] = {
    c: String.raw`#include <stdio.h>

int main(void) {
    int M = 2, P = 3, N = 2;
    int A[2][3] = {{1, 2, 3}, {4, 5, 6}};
    int B[3][2] = {{7, 8}, {9, 10}, {11, 12}};
    int C[2][2];
    for (int i = 0; i < M; i++)
        for (int j = 0; j < N; j++) {
            C[i][j] = 0;
            for (int k = 0; k < P; k++)
                C[i][j] += A[i][k] * B[k][j];
        }
    for (int i = 0; i < M; i++) {
        for (int j = 0; j < N; j++) printf("%5d", C[i][j]);
        printf("\n");
    }
    return 0;
}
`,
    py: String.raw`def matmul(A, B):
    m, p, n = len(A), len(B), len(B[0])
    assert len(A[0]) == p, "columns of A must equal rows of B"
    C = [[0] * n for _ in range(m)]
    for i in range(m):
        for j in range(n):
            for k in range(p):
                C[i][j] += A[i][k] * B[k][j]
    return C

A = [[1, 2, 3], [4, 5, 6]]
B = [[7, 8], [9, 10], [11, 12]]
for row in matmul(A, B):
    print(row)        # [58, 64] / [139, 154]
`,
  };

  C['sparse-matrix'] = {
    c: String.raw`#include <stdio.h>
#define R 4
#define C 5

int main(void) {
    int a[R][C] = {{0,0,3,0,4},{0,0,5,7,0},{0,0,0,0,0},{0,2,6,0,0}};
    int t[R * C + 1][3], cnt = 0;
    for (int i = 0; i < R; i++)
        for (int j = 0; j < C; j++)
            if (a[i][j] != 0) { cnt++; t[cnt][0] = i + 1; t[cnt][1] = j + 1; t[cnt][2] = a[i][j]; }
    t[0][0] = R; t[0][1] = C; t[0][2] = cnt;      /* header row: size and count */
    printf(" row col val\n");
    for (int k = 0; k <= cnt; k++) printf("%4d%4d%4d\n", t[k][0], t[k][1], t[k][2]);

    /* lower-triangular matrix packed into a 1-D array: A[j][k] -> B[j(j-1)/2 + k] (1-based) */
    int L[4][4] = {{4,0,0,0},{3,1,0,0},{0,2,6,0},{7,0,5,8}}, B[10], n = 4, pos = 0;
    for (int j = 0; j < n; j++) for (int k = 0; k <= j; k++) B[pos++] = L[j][k];
    printf("B:"); for (int i = 0; i < pos; i++) printf(" %d", B[i]); printf("\n");
    return 0;
}
`,
    py: String.raw`def to_triplets(a):
    rows, cols = len(a), len(a[0])
    t = [(i + 1, j + 1, v) for i, r in enumerate(a) for j, v in enumerate(r) if v != 0]
    return [(rows, cols, len(t))] + t

def pack_lower(a):
    """Row-by-row packing of a lower-triangular matrix: A[j][k] -> B[j(j-1)/2 + k] (1-based)."""
    return [a[j][k] for j in range(len(a)) for k in range(j + 1)]

A = [[0,0,3,0,4],[0,0,5,7,0],[0,0,0,0,0],[0,2,6,0,0]]
for row in to_triplets(A):
    print(row)
print(pack_lower([[4,0,0,0],[3,1,0,0],[0,2,6,0],[7,0,5,8]]))
`,
  };

  const LIST_C = String.raw`#include <stdio.h>
#include <stdlib.h>

typedef struct Node { int info; struct Node *link; } Node;

Node *new_node(int item) {
    Node *p = malloc(sizeof *p);
    if (!p) { printf("OVERFLOW\n"); exit(1); }
    p->info = item; p->link = NULL;
    return p;
}
void print_list(Node *start) {
    for (Node *ptr = start; ptr != NULL; ptr = ptr->link) printf("%d -> ", ptr->info);
    printf("NULL\n");
}
`;

  C['ll-singly'] = {
    c: LIST_C + String.raw`
Node *insert_first(Node *start, int item) { Node *n = new_node(item); n->link = start; return n; }

Node *insert_last(Node *start, int item) {
    Node *n = new_node(item);
    if (!start) return n;
    Node *ptr = start;
    while (ptr->link) ptr = ptr->link;
    ptr->link = n;
    return start;
}

Node *insert_after(Node *start, Node *loc, int item) {   /* loc == NULL: insert first */
    if (!loc) return insert_first(start, item);
    Node *n = new_node(item);
    n->link = loc->link; loc->link = n;
    return start;
}

Node *insert_sorted(Node *start, int item) {
    if (!start || item < start->info) return insert_first(start, item);
    Node *save = start, *ptr = start->link;
    while (ptr && ptr->info <= item) { save = ptr; ptr = ptr->link; }
    return insert_after(start, save, item);
}

Node *search(Node *start, int item) {
    for (Node *ptr = start; ptr; ptr = ptr->link) if (ptr->info == item) return ptr;
    return NULL;
}

Node *delete_item(Node *start, int item) {
    Node *save = NULL, *ptr = start;
    while (ptr && ptr->info != item) { save = ptr; ptr = ptr->link; }
    if (!ptr) { printf("%d not found\n", item); return start; }
    if (!save) start = ptr->link; else save->link = ptr->link;   /* bypass the node */
    free(ptr);
    return start;
}

Node *reverse(Node *start) {
    Node *prev = NULL, *ptr = start, *next;
    while (ptr) { next = ptr->link; ptr->link = prev; prev = ptr; ptr = next; }
    return prev;
}

int main(void) {
    Node *start = NULL;
    int a[] = {12, 25, 37, 48};
    for (int i = 0; i < 4; i++) start = insert_last(start, a[i]);
    start = insert_sorted(start, 30);
    start = insert_first(start, 5);
    print_list(start);
    printf("search 37: %s\n", search(start, 37) ? "found" : "not found");
    start = delete_item(start, 25);
    print_list(start);
    start = reverse(start);
    print_list(start);
    return 0;
}
`,
    py: String.raw`class Node:
    def __init__(self, info, link=None):
        self.info, self.link = info, link

class LinkedList:
    def __init__(self, values=()):
        self.start = None
        for v in values:
            self.insert_last(v)

    def __iter__(self):
        ptr = self.start
        while ptr:
            yield ptr.info
            ptr = ptr.link

    def insert_first(self, item):
        self.start = Node(item, self.start)

    def insert_last(self, item):
        if self.start is None:
            self.start = Node(item); return
        ptr = self.start
        while ptr.link:
            ptr = ptr.link
        ptr.link = Node(item)

    def insert_sorted(self, item):
        if self.start is None or item < self.start.info:
            self.insert_first(item); return
        save, ptr = self.start, self.start.link
        while ptr and ptr.info <= item:
            save, ptr = ptr, ptr.link
        save.link = Node(item, ptr)

    def search(self, item):
        ptr = self.start
        while ptr and ptr.info != item:
            ptr = ptr.link
        return ptr

    def delete(self, item):
        save, ptr = None, self.start
        while ptr and ptr.info != item:
            save, ptr = ptr, ptr.link
        if ptr is None:
            return False
        if save is None:
            self.start = ptr.link
        else:
            save.link = ptr.link
        return True

    def reverse(self):
        prev, ptr = None, self.start
        while ptr:
            ptr.link, prev, ptr = prev, ptr, ptr.link
        self.start = prev

lst = LinkedList([12, 25, 37, 48])
lst.insert_sorted(30); lst.insert_first(5)
print(list(lst))
lst.delete(25); print(list(lst))
lst.reverse(); print(list(lst))
`,
  };

  C['ll-memory'] = {
    c: String.raw`#include <stdio.h>
#define M 12
/* Linked list kept in parallel arrays, NULL = 0, cells 1..M as in the textbook. */
int INFO[M + 1], LINK[M + 1], START = 0, AVAIL = 1;

void init(void) { for (int k = 1; k < M; k++) LINK[k] = k + 1; LINK[M] = 0; AVAIL = 1; START = 0; }

int insfirst(int item) {
    if (AVAIL == 0) { printf("OVERFLOW\n"); return 0; }
    int new = AVAIL; AVAIL = LINK[AVAIL];       /* take the first free cell */
    INFO[new] = item; LINK[new] = START; START = new;
    return new;
}

void delete_item(int item) {
    int save = 0, loc = START;
    while (loc && INFO[loc] != item) { save = loc; loc = LINK[loc]; }
    if (!loc) { printf("%d not found\n", item); return; }
    if (!save) START = LINK[loc]; else LINK[save] = LINK[loc];
    LINK[loc] = AVAIL; AVAIL = loc;            /* give the cell back */
}

void traverse(void) {
    for (int ptr = START; ptr; ptr = LINK[ptr]) printf("[cell %d] %d  ", ptr, INFO[ptr]);
    printf("\nSTART = %d, AVAIL = %d\n", START, AVAIL);
}

int main(void) {
    init();
    insfirst(40); insfirst(30); insfirst(20); insfirst(10);
    traverse();
    delete_item(30);
    traverse();
    insfirst(99);           /* reuses the cell that 30 occupied */
    traverse();
    return 0;
}
`,
    py: String.raw`M = 12
INFO = [None] * (M + 1)
LINK = [0] * (M + 1)            # 0 plays the role of NULL; cells are 1..M
for k in range(1, M):
    LINK[k] = k + 1
START, AVAIL = 0, 1

def insfirst(item):
    global START, AVAIL
    if AVAIL == 0:
        raise MemoryError("OVERFLOW")
    new, AVAIL = AVAIL, LINK[AVAIL]
    INFO[new], LINK[new], START = item, START, new

def delete(item):
    global START, AVAIL
    save, loc = 0, START
    while loc and INFO[loc] != item:
        save, loc = loc, LINK[loc]
    if not loc:
        return False
    if save == 0:
        START = LINK[loc]
    else:
        LINK[save] = LINK[loc]
    LINK[loc], AVAIL = AVAIL, loc        # return the cell to AVAIL
    return True

def show():
    ptr, out = START, []
    while ptr:
        out.append(f"{INFO[ptr]}@{ptr}")
        ptr = LINK[ptr]
    print(" -> ".join(out), "| START =", START, "AVAIL =", AVAIL)

for x in (40, 30, 20, 10):
    insfirst(x)
show(); delete(30); show(); insfirst(99); show()
`,
  };

  C['ll-circular'] = {
    c: LIST_C + String.raw`
/* Circular list represented by a pointer to its LAST node; LAST->link is the first node. */
Node *insert_first(Node *last, int item) {
    Node *n = new_node(item);
    if (!last) { n->link = n; return n; }
    n->link = last->link; last->link = n;
    return last;
}
Node *insert_last(Node *last, int item) { last = insert_first(last, item); return last->link; }

Node *delete_first(Node *last) {
    if (!last) { printf("UNDERFLOW\n"); return NULL; }
    Node *first = last->link;
    if (first == last) { free(first); return NULL; }
    last->link = first->link; free(first);
    return last;
}

void print_circular(Node *last) {
    if (!last) { printf("(empty)\n"); return; }
    Node *ptr = last->link;
    do { printf("%d -> ", ptr->info); ptr = ptr->link; } while (ptr != last->link);
    printf("(back to %d)\n", last->link->info);
}

int main(void) {
    Node *last = NULL;
    last = insert_last(last, 10); last = insert_last(last, 20); last = insert_first(last, 5);
    print_circular(last);
    last = delete_first(last);
    print_circular(last);
    return 0;
}
`,
    py: String.raw`class Node:
    def __init__(self, info):
        self.info, self.link = info, self

class CircularList:
    """Keeps a pointer to the LAST node; last.link is the first node."""
    def __init__(self):
        self.last = None

    def insert_first(self, item):
        n = Node(item)
        if self.last is None:
            self.last = n
        else:
            n.link, self.last.link = self.last.link, n

    def insert_last(self, item):
        self.insert_first(item)
        self.last = self.last.link

    def delete_first(self):
        if self.last is None:
            raise IndexError("underflow")
        first = self.last.link
        if first is self.last:
            self.last = None
        else:
            self.last.link = first.link
        return first.info

    def items(self):
        if not self.last:
            return []
        out, ptr = [], self.last.link
        while True:
            out.append(ptr.info)
            ptr = ptr.link
            if ptr is self.last.link:
                return out

c = CircularList()
for v in (10, 20):
    c.insert_last(v)
c.insert_first(5)
print(c.items()); c.delete_first(); print(c.items())
`,
  };

  C['ll-header'] = {
    c: LIST_C + String.raw`
/* Circular header list: head is a dummy node; the list ends when ptr == head. */
Node *make_header(void) { Node *h = new_node(0); h->link = h; return h; }

void insert_sorted(Node *head, int item) {
    Node *save = head, *ptr = head->link;
    while (ptr != head && ptr->info < item) { save = ptr; ptr = ptr->link; }
    Node *n = new_node(item); n->link = ptr; save->link = n;   /* no special first-node case */
}
void delete_item(Node *head, int item) {
    Node *save = head, *ptr = head->link;
    while (ptr != head && ptr->info != item) { save = ptr; ptr = ptr->link; }
    if (ptr == head) { printf("%d not found\n", item); return; }
    save->link = ptr->link; free(ptr);
}
void print_header_list(Node *head) {
    for (Node *ptr = head->link; ptr != head; ptr = ptr->link) printf("%d -> ", ptr->info);
    printf("HEAD\n");
}

int main(void) {
    Node *head = make_header();
    int a[] = {41, 14, 56, 29};
    for (int i = 0; i < 4; i++) insert_sorted(head, a[i]);
    print_header_list(head);
    delete_item(head, 14);
    insert_sorted(head, 33);
    print_header_list(head);
    return 0;
}
`,
    py: String.raw`class Node:
    def __init__(self, info=None, link=None):
        self.info, self.link = info, link

class HeaderList:
    """Circular header list: the header node is never deleted."""
    def __init__(self):
        self.head = Node("HEAD")
        self.head.link = self.head

    def insert_sorted(self, item):
        save, ptr = self.head, self.head.link
        while ptr is not self.head and ptr.info < item:
            save, ptr = ptr, ptr.link
        save.link = Node(item, ptr)            # works even for the first position

    def delete(self, item):
        save, ptr = self.head, self.head.link
        while ptr is not self.head and ptr.info != item:
            save, ptr = ptr, ptr.link
        if ptr is self.head:
            return False
        save.link = ptr.link
        return True

    def items(self):
        out, ptr = [], self.head.link
        while ptr is not self.head:
            out.append(ptr.info); ptr = ptr.link
        return out

h = HeaderList()
for v in (41, 14, 56, 29):
    h.insert_sorted(v)
print(h.items()); h.delete(14); h.insert_sorted(33); print(h.items())
`,
  };

  C['ll-doubly'] = {
    c: String.raw`#include <stdio.h>
#include <stdlib.h>

typedef struct DNode { int info; struct DNode *back, *forw; } DNode;
DNode *first = NULL, *last = NULL;

void insert_after(DNode *loca, int item) {          /* loca == NULL: insert at the front */
    DNode *n = malloc(sizeof *n); n->info = item;
    DNode *locb = loca ? loca->forw : first;
    n->back = loca; n->forw = locb;
    if (loca) loca->forw = n; else first = n;
    if (locb) locb->back = n; else last = n;
}
void delete_node(DNode *loc) {
    if (loc->back) loc->back->forw = loc->forw; else first = loc->forw;
    if (loc->forw) loc->forw->back = loc->back; else last = loc->back;
    free(loc);
}
void forward(void) { for (DNode *p = first; p; p = p->forw) printf("%d ", p->info); printf("\n"); }
void backward(void) { for (DNode *p = last; p; p = p->back) printf("%d ", p->info); printf("\n"); }

int main(void) {
    insert_after(NULL, 11);
    insert_after(last, 22); insert_after(last, 33); insert_after(last, 44);
    insert_after(first->forw, 27);      /* between 22 and 33 */
    forward(); backward();
    delete_node(first->forw);           /* delete 22 without searching for its predecessor */
    forward();
    return 0;
}
`,
    py: String.raw`class DNode:
    def __init__(self, info):
        self.info, self.back, self.forw = info, None, None

class DoublyLinkedList:
    def __init__(self):
        self.first = self.last = None

    def insert_after(self, loca, item):
        """loca=None inserts at the front."""
        n = DNode(item)
        locb = loca.forw if loca else self.first
        n.back, n.forw = loca, locb
        if loca: loca.forw = n
        else:    self.first = n
        if locb: locb.back = n
        else:    self.last = n
        return n

    def delete(self, loc):
        if loc.back: loc.back.forw = loc.forw
        else:        self.first = loc.forw
        if loc.forw: loc.forw.back = loc.back
        else:        self.last = loc.back

    def forward(self):
        p, out = self.first, []
        while p: out.append(p.info); p = p.forw
        return out

    def backward(self):
        p, out = self.last, []
        while p: out.append(p.info); p = p.back
        return out

d = DoublyLinkedList()
n11 = d.insert_after(None, 11)
n22 = d.insert_after(n11, 22)
n33 = d.insert_after(n22, 33)
d.insert_after(n22, 27)
print(d.forward(), d.backward())
d.delete(n22); print(d.forward())
`,
  };

  C['ll-poly'] = {
    c: String.raw`#include <stdio.h>
#include <stdlib.h>

typedef struct Term { int coef, exp; struct Term *link; } Term;

Term *append(Term **head, Term *tail, int c, int e) {
    Term *t = malloc(sizeof *t); t->coef = c; t->exp = e; t->link = NULL;
    if (tail) tail->link = t; else *head = t;
    return t;
}
Term *poly_add(Term *p, Term *q) {           /* both sorted by decreasing exponent */
    Term *r = NULL, *tail = NULL;
    while (p && q) {
        if (p->exp > q->exp) { tail = append(&r, tail, p->coef, p->exp); p = p->link; }
        else if (p->exp < q->exp) { tail = append(&r, tail, q->coef, q->exp); q = q->link; }
        else {
            int s = p->coef + q->coef;
            if (s) tail = append(&r, tail, s, p->exp);
            p = p->link; q = q->link;
        }
    }
    for (; p; p = p->link) tail = append(&r, tail, p->coef, p->exp);
    for (; q; q = q->link) tail = append(&r, tail, q->coef, q->exp);
    return r;
}
void print_poly(Term *t) {
    for (; t; t = t->link) printf("%+dx^%d ", t->coef, t->exp);
    printf("\n");
}

int main(void) {
    Term *P = NULL, *Q = NULL, *tp = NULL, *tq = NULL;
    int pc[] = {5, 4, -3, 2}, pe[] = {3, 2, 1, 0};
    int qc[] = {3, -4, 7, 6}, qe[] = {4, 2, 1, 0};
    for (int i = 0; i < 4; i++) { tp = append(&P, tp, pc[i], pe[i]); tq = append(&Q, tq, qc[i], qe[i]); }
    print_poly(P); print_poly(Q);
    print_poly(poly_add(P, Q));        /* 3x^4 + 5x^3 + 4x + 8 */
    return 0;
}
`,
    py: String.raw`def poly_add(p, q):
    """p, q: lists of (coef, exp) sorted by decreasing exponent."""
    i = j = 0
    r = []
    while i < len(p) and j < len(q):
        (c1, e1), (c2, e2) = p[i], q[j]
        if e1 > e2:
            r.append((c1, e1)); i += 1
        elif e1 < e2:
            r.append((c2, e2)); j += 1
        else:
            if c1 + c2:
                r.append((c1 + c2, e1))
            i += 1; j += 1
    return r + p[i:] + q[j:]

P = [(5, 3), (4, 2), (-3, 1), (2, 0)]
Q = [(3, 4), (-4, 2), (7, 1), (6, 0)]
print(poly_add(P, Q))    # [(3, 4), (5, 3), (4, 1), (8, 0)]
`,
  };

  C['stack-array'] = {
    c: String.raw`#include <stdio.h>
#define MAXSTK 6

int STACK[MAXSTK + 1], TOP = 0;     /* 1-based like the textbook; TOP = 0 means empty */

void push(int item) {
    if (TOP == MAXSTK) { printf("OVERFLOW\n"); return; }
    STACK[++TOP] = item;
}
int pop(int *item) {
    if (TOP == 0) { printf("UNDERFLOW\n"); return 0; }
    *item = STACK[TOP--];
    return 1;
}
int peek(int *item) { if (TOP == 0) return 0; *item = STACK[TOP]; return 1; }

int main(void) {
    int x;
    push(10); push(20); push(30);
    if (peek(&x)) printf("top = %d\n", x);
    while (pop(&x)) printf("popped %d\n", x);   /* prints 30 20 10, then UNDERFLOW */
    return 0;
}
`,
    py: String.raw`class ArrayStack:
    def __init__(self, maxstk):
        self.stack = [None] * maxstk
        self.top = 0                      # number of items; 0 = empty

    def push(self, item):
        if self.top == len(self.stack):
            raise OverflowError("stack overflow")
        self.stack[self.top] = item
        self.top += 1

    def pop(self):
        if self.top == 0:
            raise IndexError("stack underflow")
        self.top -= 1
        return self.stack[self.top]

    def peek(self):
        if self.top == 0:
            raise IndexError("empty stack")
        return self.stack[self.top - 1]

s = ArrayStack(6)
for x in (10, 20, 30):
    s.push(x)
print("top =", s.peek())
print(s.pop(), s.pop(), s.pop())    # 30 20 10
`,
  };

  C['stack-linked'] = {
    c: LIST_C + String.raw`
Node *TOP = NULL;

void push(int item) { Node *n = new_node(item); n->link = TOP; TOP = n; }
int pop(int *item) {
    if (!TOP) { printf("UNDERFLOW\n"); return 0; }
    Node *temp = TOP; *item = temp->info; TOP = TOP->link; free(temp);
    return 1;
}

int main(void) {
    int x;
    push(5); push(15); push(25);
    print_list(TOP);                     /* 25 -> 15 -> 5 -> NULL */
    pop(&x); printf("popped %d\n", x);
    print_list(TOP);
    return 0;
}
`,
    py: String.raw`class Node:
    def __init__(self, info, link=None):
        self.info, self.link = info, link

class LinkedStack:
    def __init__(self):
        self.top = None

    def push(self, item):
        self.top = Node(item, self.top)

    def pop(self):
        if self.top is None:
            raise IndexError("stack underflow")
        item, self.top = self.top.info, self.top.link
        return item

    def is_empty(self):
        return self.top is None

s = LinkedStack()
for x in (5, 15, 25):
    s.push(x)
while not s.is_empty():
    print(s.pop())
`,
  };

  C['paren-match'] = {
    c: String.raw`#include <stdio.h>
#include <string.h>

int balanced(const char *e) {
    char stack[100]; int top = 0;
    for (const char *p = e; *p; p++) {
        if (strchr("([{", *p)) stack[top++] = *p;
        else if (strchr(")]}", *p)) {
            if (top == 0) return 0;                 /* extra closing bracket */
            char open = stack[--top];
            if ((*p == ')' && open != '(') || (*p == ']' && open != '[') || (*p == '}' && open != '{'))
                return 0;                           /* wrong kind */
        }
    }
    return top == 0;                                /* leftovers = unclosed */
}

int main(void) {
    const char *tests[] = {"{ a * (b + c) - [d / (e - f)] }", "( a + [ b * c ) ]", "((a + b) * c"};
    for (int i = 0; i < 3; i++) printf("%-34s %s\n", tests[i], balanced(tests[i]) ? "balanced" : "NOT balanced");
    return 0;
}
`,
    py: String.raw`PAIRS = {')': '(', ']': '[', '}': '{'}

def balanced(expr):
    stack = []
    for ch in expr:
        if ch in '([{':
            stack.append(ch)
        elif ch in PAIRS:
            if not stack or stack.pop() != PAIRS[ch]:
                return False
    return not stack

for e in ["{ a * (b + c) - [d / (e - f)] }", "( a + [ b * c ) ]", "((a + b) * c"]:
    print(f"{e:34} {'balanced' if balanced(e) else 'NOT balanced'}")
`,
  };

  const EXPR_C = String.raw`#include <stdio.h>
#include <string.h>
#include <ctype.h>

int prec(char op) { return op == '^' ? 3 : (op == '*' || op == '/' || op == '%') ? 2 : (op == '+' || op == '-') ? 1 : 0; }
int is_op(char c) { return prec(c) > 0; }
`;

  C['infix-postfix'] = {
    c: EXPR_C + String.raw`
/* Single-letter operands, e.g. "A+(B*C-(D/E^F)*G)*H". */
void infix_to_postfix(const char *q, char *p) {
    char stack[100]; int top = 0, k = 0;
    stack[top++] = '(';                                   /* push "(" ...          */
    char buf[200]; snprintf(buf, sizeof buf, "%s)", q);   /* ... and append ")"    */
    for (char *s = buf; top > 0; s++) {
        char c = *s;
        if (isspace((unsigned char)c)) continue;
        if (isalnum((unsigned char)c)) p[k++] = c;
        else if (c == '(') stack[top++] = c;
        else if (is_op(c)) {
            while (is_op(stack[top - 1]) &&
                   (prec(stack[top - 1]) > prec(c) || (prec(stack[top - 1]) == prec(c) && c != '^')))
                p[k++] = stack[--top];
            stack[top++] = c;
        } else if (c == ')') {
            while (stack[top - 1] != '(') p[k++] = stack[--top];
            top--;                                        /* discard "(" */
        }
    }
    p[k] = '\0';
}

int main(void) {
    char p[200];
    infix_to_postfix("A+(B*C-(D/E^F)*G)*H", p);
    printf("%s\n", p);                                    /* ABC*DEF^/G*-H*+ */
    return 0;
}
`,
    py: String.raw`PREC = {'^': 3, '*': 2, '/': 2, '%': 2, '+': 1, '-': 1}

def infix_to_postfix(tokens):
    stack, out = ['('], []
    for t in tokens + [')']:
        if t not in PREC and t not in '()':
            out.append(t)                                  # operand
        elif t == '(':
            stack.append(t)
        elif t in PREC:
            while stack[-1] in PREC and (PREC[stack[-1]] > PREC[t] or
                                         (PREC[stack[-1]] == PREC[t] and t != '^')):
                out.append(stack.pop())
            stack.append(t)
        else:                                              # ')'
            while stack[-1] != '(':
                out.append(stack.pop())
            stack.pop()
    return out

expr = "A + ( B * C - ( D / E ^ F ) * G ) * H"
print(' '.join(infix_to_postfix(expr.split())))   # A B C * D E F ^ / G * - H * +
`,
  };

  C['infix-prefix'] = {
    c: EXPR_C + String.raw`
/* Scan right to left; pop only strictly higher precedence (for ^: higher or equal); reverse at the end. */
void infix_to_prefix(const char *q, char *out) {
    char stack[100], tmp[200]; int top = 0, k = 0;
    for (int i = (int)strlen(q) - 1; i >= 0; i--) {
        char c = q[i];
        if (isspace((unsigned char)c)) continue;
        if (isalnum((unsigned char)c)) tmp[k++] = c;
        else if (c == ')') stack[top++] = c;
        else if (c == '(') { while (stack[top - 1] != ')') tmp[k++] = stack[--top]; top--; }
        else {
            while (top && is_op(stack[top - 1]) &&
                   (prec(stack[top - 1]) > prec(c) || (prec(stack[top - 1]) == prec(c) && c == '^')))
                tmp[k++] = stack[--top];
            stack[top++] = c;
        }
    }
    while (top) tmp[k++] = stack[--top];
    for (int i = 0; i < k; i++) out[i] = tmp[k - 1 - i];  /* reverse */
    out[k] = '\0';
}

int main(void) {
    char out[200];
    infix_to_prefix("(A+B)*C-D/E", out);
    printf("%s\n", out);                                  /* -*+ABC/DE */
    return 0;
}
`,
    py: String.raw`PREC = {'^': 3, '*': 2, '/': 2, '%': 2, '+': 1, '-': 1}

def infix_to_prefix(tokens):
    stack, out = [], []
    for t in reversed(tokens):
        if t not in PREC and t not in '()':
            out.append(t)
        elif t == ')':
            stack.append(t)
        elif t == '(':
            while stack[-1] != ')':
                out.append(stack.pop())
            stack.pop()
        else:
            while stack and stack[-1] in PREC and (PREC[stack[-1]] > PREC[t] or
                                                   (PREC[stack[-1]] == PREC[t] and t == '^')):
                out.append(stack.pop())
            stack.append(t)
    while stack:
        out.append(stack.pop())
    return out[::-1]

print(' '.join(infix_to_prefix("( A + B ) * C - D / E".split())))   # - * + A B C / D E
`,
  };

  C['postfix-eval'] = {
    c: String.raw`#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>

/* Tokens separated by spaces, e.g. "5 6 2 + * 12 4 / -". */
double eval_postfix(const char *expr) {
    double stack[100]; int top = 0;
    char buf[256]; strncpy(buf, expr, sizeof buf - 1); buf[sizeof buf - 1] = '\0';
    for (char *t = strtok(buf, " "); t; t = strtok(NULL, " ")) {
        if (strchr("+-*/^", t[0]) && t[1] == '\0') {
            double a = stack[--top], b = stack[--top];      /* A = top, B = next */
            double r = t[0] == '+' ? b + a : t[0] == '-' ? b - a : t[0] == '*' ? b * a
                     : t[0] == '/' ? b / a : pow(b, a);
            stack[top++] = r;
        } else stack[top++] = atof(t);
    }
    return stack[top - 1];
}

int main(void) {
    printf("%g\n", eval_postfix("5 6 2 + * 12 4 / -"));    /* 37 */
    return 0;
}
`,
    py: String.raw`import operator
OPS = {'+': operator.add, '-': operator.sub, '*': operator.mul,
       '/': operator.truediv, '%': operator.mod, '^': operator.pow}

def eval_postfix(tokens):
    stack = []
    for t in tokens:
        if t in OPS:
            a = stack.pop()          # right operand (top)
            b = stack.pop()          # left operand
            stack.append(OPS[t](b, a))
        else:
            stack.append(float(t))
    if len(stack) != 1:
        raise ValueError("malformed expression")
    return stack[0]

print(eval_postfix("5 6 2 + * 12 4 / -".split()))    # 37.0
`,
  };

  C['prefix-eval'] = {
    c: String.raw`#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>

double eval_prefix(const char *expr) {
    char *tok[64]; int n = 0;
    char buf[256]; strncpy(buf, expr, sizeof buf - 1); buf[sizeof buf - 1] = '\0';
    for (char *t = strtok(buf, " "); t; t = strtok(NULL, " ")) tok[n++] = t;
    double stack[64]; int top = 0;
    for (int i = n - 1; i >= 0; i--) {                       /* right to left */
        char *t = tok[i];
        if (strchr("+-*/^", t[0]) && t[1] == '\0') {
            double a = stack[--top], b = stack[--top];      /* A is the LEFT operand */
            stack[top++] = t[0] == '+' ? a + b : t[0] == '-' ? a - b : t[0] == '*' ? a * b
                         : t[0] == '/' ? a / b : pow(a, b);
        } else stack[top++] = atof(t);
    }
    return stack[0];
}

int main(void) {
    printf("%g\n", eval_prefix("- * + 4 3 2 5"));            /* (4+3)*2-5 = 9 */
    return 0;
}
`,
    py: String.raw`import operator
OPS = {'+': operator.add, '-': operator.sub, '*': operator.mul,
       '/': operator.truediv, '%': operator.mod, '^': operator.pow}

def eval_prefix(tokens):
    stack = []
    for t in reversed(tokens):
        if t in OPS:
            a = stack.pop()          # left operand
            b = stack.pop()          # right operand
            stack.append(OPS[t](a, b))
        else:
            stack.append(float(t))
    return stack[0]

print(eval_prefix("- * + 4 3 2 5".split()))   # 9.0
`,
  };

  C['queue-linear'] = {
    c: String.raw`#include <stdio.h>
#define N 6

int QUEUE[N + 1], FRONT = 0, REAR = 0;      /* 1-based; 0 = NULL */

void qinsert(int item) {
    if (REAR == N) { printf("OVERFLOW (REAR = N)\n"); return; }
    if (FRONT == 0) FRONT = REAR = 1; else REAR++;
    QUEUE[REAR] = item;
}
int qdelete(int *item) {
    if (FRONT == 0) { printf("UNDERFLOW\n"); return 0; }
    *item = QUEUE[FRONT];
    if (FRONT == REAR) FRONT = REAR = 0; else FRONT++;
    return 1;
}

int main(void) {
    int x;
    for (int i = 1; i <= 6; i++) qinsert(i * 11);
    qdelete(&x); qdelete(&x);
    qinsert(77);                 /* overflow although two cells are free: the linear-queue problem */
    printf("FRONT = %d, REAR = %d\n", FRONT, REAR);
    return 0;
}
`,
    py: String.raw`class LinearQueue:
    def __init__(self, n):
        self.q = [None] * (n + 1)      # use cells 1..n
        self.n, self.front, self.rear = n, 0, 0

    def insert(self, item):
        if self.rear == self.n:
            raise OverflowError("REAR = N (cells before FRONT are wasted)")
        if self.front == 0:
            self.front = self.rear = 1
        else:
            self.rear += 1
        self.q[self.rear] = item

    def delete(self):
        if self.front == 0:
            raise IndexError("underflow")
        item = self.q[self.front]
        if self.front == self.rear:
            self.front = self.rear = 0
        else:
            self.front += 1
        return item

q = LinearQueue(6)
for i in range(1, 7):
    q.insert(i * 11)
q.delete(); q.delete()
try:
    q.insert(77)
except OverflowError as e:
    print("Overflow:", e)
`,
  };

  C['queue-circular'] = {
    c: String.raw`#include <stdio.h>
#define N 6

int QUEUE[N + 1], FRONT = 0, REAR = 0;      /* 1-based circular queue; 0 = NULL */

void qinsert(int item) {
    if ((FRONT == 1 && REAR == N) || FRONT == REAR + 1) { printf("OVERFLOW\n"); return; }
    if (FRONT == 0) FRONT = REAR = 1;
    else if (REAR == N) REAR = 1;              /* wrap around */
    else REAR++;
    QUEUE[REAR] = item;
}
int qdelete(int *item) {
    if (FRONT == 0) { printf("UNDERFLOW\n"); return 0; }
    *item = QUEUE[FRONT];
    if (FRONT == REAR) FRONT = REAR = 0;
    else if (FRONT == N) FRONT = 1;            /* wrap around */
    else FRONT++;
    return 1;
}

int main(void) {
    int x;
    for (int i = 1; i <= 6; i++) qinsert(i * 11);
    qdelete(&x); qdelete(&x);
    qinsert(77); qinsert(88);                  /* reuse cells 1 and 2 */
    while (qdelete(&x)) printf("%d ", x);
    printf("\n");
    return 0;
}
`,
    py: String.raw`class CircularQueue:
    def __init__(self, n):
        self.q, self.n = [None] * n, n
        self.front = self.count = 0

    def insert(self, item):
        if self.count == self.n:
            raise OverflowError("queue full")
        rear = (self.front + self.count) % self.n     # wraps around automatically
        self.q[rear] = item
        self.count += 1

    def delete(self):
        if self.count == 0:
            raise IndexError("underflow")
        item = self.q[self.front]
        self.front = (self.front + 1) % self.n
        self.count -= 1
        return item

q = CircularQueue(6)
for i in range(1, 7):
    q.insert(i * 11)
q.delete(); q.delete()
q.insert(77); q.insert(88)
print([q.delete() for _ in range(q.count)])   # [33, 44, 55, 66, 77, 88]
`,
  };

  C['queue-linked'] = {
    c: LIST_C + String.raw`
Node *FRONT = NULL, *REAR = NULL;

void enqueue(int item) {
    Node *n = new_node(item);
    if (!FRONT) FRONT = REAR = n; else { REAR->link = n; REAR = n; }
}
int dequeue(int *item) {
    if (!FRONT) { printf("UNDERFLOW\n"); return 0; }
    Node *t = FRONT; *item = t->info; FRONT = FRONT->link;
    if (!FRONT) REAR = NULL;
    free(t);
    return 1;
}

int main(void) {
    int x;
    enqueue(7); enqueue(14); enqueue(21);
    dequeue(&x); printf("served %d\n", x);
    enqueue(28);
    print_list(FRONT);
    return 0;
}
`,
    py: String.raw`class Node:
    def __init__(self, info):
        self.info, self.link = info, None

class LinkedQueue:
    def __init__(self):
        self.front = self.rear = None

    def enqueue(self, item):
        n = Node(item)
        if self.rear is None:
            self.front = self.rear = n
        else:
            self.rear.link = n
            self.rear = n

    def dequeue(self):
        if self.front is None:
            raise IndexError("underflow")
        item, self.front = self.front.info, self.front.link
        if self.front is None:
            self.rear = None
        return item

q = LinkedQueue()
for x in (7, 14, 21):
    q.enqueue(x)
print(q.dequeue()); q.enqueue(28)
print(q.dequeue(), q.dequeue(), q.dequeue())
`,
  };

  C['deque'] = {
    c: String.raw`#include <stdio.h>
#define N 7

int DEQ[N], LEFT = -1, RIGHT = -1, COUNT = 0;   /* 0-based circular deque */

void insert_right(int x) { if (COUNT == N) { printf("OVERFLOW\n"); return; } if (COUNT == 0) LEFT = RIGHT = 0; else RIGHT = (RIGHT + 1) % N; DEQ[RIGHT] = x; COUNT++; }
void insert_left(int x)  { if (COUNT == N) { printf("OVERFLOW\n"); return; } if (COUNT == 0) LEFT = RIGHT = 0; else LEFT = (LEFT - 1 + N) % N; DEQ[LEFT] = x; COUNT++; }
int delete_left(int *x)  { if (!COUNT) { printf("UNDERFLOW\n"); return 0; } *x = DEQ[LEFT];  LEFT = (LEFT + 1) % N; COUNT--; return 1; }
int delete_right(int *x) { if (!COUNT) { printf("UNDERFLOW\n"); return 0; } *x = DEQ[RIGHT]; RIGHT = (RIGHT - 1 + N) % N; COUNT--; return 1; }

int main(void) {
    int x;
    insert_right(30); insert_right(40); insert_left(20); insert_left(10);
    delete_right(&x); printf("removed right: %d\n", x);
    delete_left(&x);  printf("removed left:  %d\n", x);
    while (delete_left(&x)) printf("%d ", x);
    printf("\n");
    return 0;
}
`,
    py: String.raw`from collections import deque   # Python's built-in deque is a double-ended queue

d = deque()
d.append(30); d.append(40)          # insert RIGHT
d.appendleft(20); d.appendleft(10)  # insert LEFT
print(list(d))                      # [10, 20, 30, 40]
print("removed right:", d.pop())
print("removed left: ", d.popleft())
print(list(d))

# An input-restricted deque would only allow append(); an output-restricted one only popleft().
`,
  };

  C['priority-queue'] = {
    c: String.raw`#include <stdio.h>
#include <stdlib.h>

typedef struct PNode { char info[8]; int prn; struct PNode *link; } PNode;
PNode *START = NULL;

void pq_insert(const char *item, int prn) {     /* smaller PRN = higher priority; FIFO among equals */
    PNode *n = malloc(sizeof *n);
    snprintf(n->info, sizeof n->info, "%s", item); n->prn = prn;
    PNode *save = NULL, *ptr = START;
    while (ptr && ptr->prn <= prn) { save = ptr; ptr = ptr->link; }
    n->link = ptr;
    if (save) save->link = n; else START = n;
}
int pq_delete(char *out, int *prn) {
    if (!START) return 0;
    PNode *t = START; START = START->link;
    snprintf(out, 8, "%s", t->info); *prn = t->prn; free(t);
    return 1;
}

int main(void) {
    char item[8]; int prn;
    pq_insert("AAA", 1); pq_insert("BBB", 2); pq_insert("CCC", 2); pq_insert("DDD", 4);
    pq_insert("EEE", 2);                     /* goes after CCC */
    while (pq_delete(item, &prn)) printf("%s(%d) ", item, prn);
    printf("\n");
    return 0;
}
`,
    py: String.raw`import heapq, itertools

class PriorityQueue:
    """Smaller number = higher priority; ties are served first-come-first-served."""
    def __init__(self):
        self.heap, self.counter = [], itertools.count()

    def insert(self, item, prn):
        heapq.heappush(self.heap, (prn, next(self.counter), item))

    def delete(self):
        prn, _, item = heapq.heappop(self.heap)
        return item, prn

pq = PriorityQueue()
for item, prn in [("AAA", 1), ("BBB", 2), ("CCC", 2), ("DDD", 4), ("EEE", 2)]:
    pq.insert(item, prn)
print([pq.delete() for _ in range(5)])
`,
  };

  C['recursion'] = {
    c: String.raw`#include <stdio.h>

long factorial(int n) { return n == 0 ? 1 : n * factorial(n - 1); }
long fib(int n) { return n < 2 ? n : fib(n - 2) + fib(n - 1); }
int gcd(int a, int b) { return b == 0 ? a : gcd(b, a % b); }
long power(long x, int n) {                 /* fast exponentiation */
    if (n == 0) return 1;
    long h = power(x, n / 2);
    return n % 2 ? h * h * x : h * h;
}
int sum_digits(int n) { return n < 10 ? n : n % 10 + sum_digits(n / 10); }
int ackermann(int m, int n) {
    if (m == 0) return n + 1;
    if (n == 0) return ackermann(m - 1, 1);
    return ackermann(m - 1, ackermann(m, n - 1));
}

int main(void) {
    printf("5! = %ld\n", factorial(5));
    printf("fib(10) = %ld\n", fib(10));
    printf("gcd(84, 36) = %d\n", gcd(84, 36));
    printf("2^10 = %ld\n", power(2, 10));
    printf("sum of digits of 4728 = %d\n", sum_digits(4728));
    printf("A(2, 3) = %d\n", ackermann(2, 3));
    return 0;
}
`,
    py: String.raw`import sys
sys.setrecursionlimit(10_000)

def factorial(n):    return 1 if n == 0 else n * factorial(n - 1)
def fib(n):          return n if n < 2 else fib(n - 2) + fib(n - 1)
def gcd(a, b):       return a if b == 0 else gcd(b, a % b)
def sum_digits(n):   return n if n < 10 else n % 10 + sum_digits(n // 10)

def power(x, n):
    if n == 0:
        return 1
    h = power(x, n // 2)
    return h * h * x if n % 2 else h * h

def ackermann(m, n):
    if m == 0: return n + 1
    if n == 0: return ackermann(m - 1, 1)
    return ackermann(m - 1, ackermann(m, n - 1))

print(factorial(5), fib(10), gcd(84, 36), power(2, 10), sum_digits(4728), ackermann(2, 3))
`,
  };

  C['hanoi'] = {
    c: String.raw`#include <stdio.h>

int moves = 0;
void tower(int n, char beg, char aux, char end) {
    if (n == 1) { printf("%d: %c -> %c\n", ++moves, beg, end); return; }
    tower(n - 1, beg, end, aux);          /* park n-1 disks on AUX */
    printf("%d: %c -> %c\n", ++moves, beg, end);
    tower(n - 1, aux, beg, end);          /* bring them onto END */
}

int main(void) {
    int n = 3;
    tower(n, 'A', 'B', 'C');
    printf("%d moves (2^%d - 1)\n", moves, n);
    return 0;
}
`,
    py: String.raw`def tower(n, beg="A", aux="B", end="C", moves=None):
    if moves is None:
        moves = []
    if n == 1:
        moves.append((beg, end))
    else:
        tower(n - 1, beg, end, aux, moves)
        moves.append((beg, end))
        tower(n - 1, aux, beg, end, moves)
    return moves

for i, (a, b) in enumerate(tower(3), 1):
    print(f"{i}: {a} -> {b}")
`,
  };

  C['string-ops'] = {
    c: String.raw`#include <stdio.h>
#include <string.h>

/* Positions are 1-based like the textbook. Results go into out (assumed large enough). */
void substring(const char *s, int k, int l, char *out) { strncpy(out, s + k - 1, l); out[l] = '\0'; }
int index_of(const char *t, const char *p) { const char *f = strstr(t, p); return f ? (int)(f - t) + 1 : 0; }
void insert_str(const char *t, int k, const char *s, char *out) {
    sprintf(out, "%.*s%s%s", k - 1, t, s, t + k - 1);
}
void delete_str(const char *t, int k, int l, char *out) { sprintf(out, "%.*s%s", k - 1, t, t + k - 1 + l); }
void replace_str(const char *t, const char *p, const char *q, char *out) {
    int k = index_of(t, p);
    if (!k) { strcpy(out, t); return; }
    char tmp[256]; delete_str(t, k, (int)strlen(p), tmp); insert_str(tmp, k, q, out);
}

int main(void) {
    const char *T = "TO BE OR NOT TO BE";
    char out[256];
    substring(T, 4, 5, out);          printf("SUBSTRING = '%s'\n", out);
    printf("INDEX(T, 'NOT') = %d\n", index_of(T, "NOT"));
    insert_str(T, 4, "XYZ", out);     printf("INSERT  = '%s'\n", out);
    delete_str(T, 4, 3, out);         printf("DELETE  = '%s'\n", out);
    replace_str(T, "NOT", "IS", out); printf("REPLACE = '%s'\n", out);
    printf("LENGTH  = %zu\n", strlen(T));
    return 0;
}
`,
    py: String.raw`def substring(s, k, l):      return s[k - 1:k - 1 + l]          # 1-based K
def index(t, p):             return t.find(p) + 1                # 0 when absent
def insert(t, k, s):         return t[:k - 1] + s + t[k - 1:]
def delete(t, k, l):         return t[:k - 1] + t[k - 1 + l:]

def replace(t, p, q):
    k = index(t, p)
    return t if k == 0 else insert(delete(t, k, len(p)), k, q)

T = "TO BE OR NOT TO BE"
print(repr(substring(T, 4, 5)), index(T, "NOT"))
print(insert(T, 4, "XYZ")); print(delete(T, 4, 3)); print(replace(T, "NOT", "IS"))
`,
  };

  C['pattern-naive'] = {
    c: String.raw`#include <stdio.h>
#include <string.h>

/* First pattern-matching algorithm: returns the 1-based INDEX of P in T, or 0. */
int patmat1(const char *T, const char *P, int *comparisons) {
    int S = (int)strlen(T), R = (int)strlen(P);
    *comparisons = 0;
    for (int K = 1; K <= S - R + 1; K++) {
        int L;
        for (L = 1; L <= R; L++) {
            (*comparisons)++;
            if (P[L - 1] != T[K + L - 2]) break;
        }
        if (L > R) return K;
    }
    return 0;
}

int main(void) {
    int c;
    int k = patmat1("ABABDABACDABABCABAB", "ABABCABAB", &c);
    printf("INDEX = %d after %d comparisons\n", k, c);
    return 0;
}
`,
    py: String.raw`def patmat1(t, p):
    """Brute force: return (1-based index or 0, number of comparisons)."""
    s, r, comparisons = len(t), len(p), 0
    for k in range(s - r + 1):
        for l in range(r):
            comparisons += 1
            if p[l] != t[k + l]:
                break
        else:
            return k + 1, comparisons
    return 0, comparisons

print(patmat1("ABABDABACDABABCABAB", "ABABCABAB"))
print(patmat1("AAAAAAAAAB", "AAAB"))     # the worst case
`,
  };

  C['pattern-kmp'] = {
    c: String.raw`#include <stdio.h>
#include <string.h>

void failure(const char *P, int F[]) {        /* F[q] for 1-based q stored at F[q-1] */
    int R = (int)strlen(P), k = 0;
    F[0] = 0;
    for (int q = 1; q < R; q++) {
        while (k > 0 && P[k] != P[q]) k = F[k - 1];
        if (P[k] == P[q]) k++;
        F[q] = k;
    }
}

void kmp(const char *T, const char *P) {
    int S = (int)strlen(T), R = (int)strlen(P), F[64], q = 0;
    failure(P, F);
    for (int i = 0; i < S; i++) {
        while (q > 0 && P[q] != T[i]) q = F[q - 1];
        if (P[q] == T[i]) q++;
        if (q == R) { printf("match at %d\n", i - R + 2); q = F[q - 1]; }
    }
}

int main(void) {
    kmp("AABAACAADAABAABA", "AABA");     /* matches at 1, 10, 13 */
    return 0;
}
`,
    py: String.raw`def failure_table(p):
    f, k = [0] * len(p), 0
    for q in range(1, len(p)):
        while k > 0 and p[k] != p[q]:
            k = f[k - 1]
        if p[k] == p[q]:
            k += 1
        f[q] = k
    return f

def kmp(t, p):
    f, q, matches = failure_table(p), 0, []
    for i, ch in enumerate(t):
        while q > 0 and p[q] != ch:
            q = f[q - 1]
        if p[q] == ch:
            q += 1
        if q == len(p):
            matches.append(i - len(p) + 2)     # 1-based position
            q = f[q - 1]
    return matches

print(failure_table("ABABCABAB"))
print(kmp("AABAACAADAABAABA", "AABA"))         # [1, 10, 13]
`,
  };
})(typeof window !== 'undefined' ? window : globalThis);
