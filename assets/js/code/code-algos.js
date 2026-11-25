/* DSA Lab · code/code-algos.js — C and Python programs: searching, sorting, hashing, complexity */
(function (g) {
  'use strict';
  const C = (g.DSA.code = g.DSA.code || {});

  C['linear-search'] = {
    c: String.raw`#include <stdio.h>

/* Linear search with a sentinel: data[] must have room for one extra element. Returns 1-based LOC or 0. */
int linear(int data[], int n, int item) {
    data[n] = item;                 /* sentinel in DATA[N+1] */
    int loc = 0;
    while (data[loc] != item) loc++;
    return loc == n ? 0 : loc + 1;
}

int main(void) {
    int data[9] = {33, 12, 78, 45, 61, 27, 90, 54};
    printf("27 found at LOC = %d\n", linear(data, 8, 27));
    printf("99 found at LOC = %d (0 = not found)\n", linear(data, 8, 99));
    return 0;
}
`,
    py: String.raw`def linear_search(data, item):
    """Return the 1-based position of item, or 0, using a sentinel."""
    data = data + [item]            # sentinel
    loc = 0
    while data[loc] != item:
        loc += 1
    return 0 if loc == len(data) - 1 else loc + 1

DATA = [33, 12, 78, 45, 61, 27, 90, 54]
print(linear_search(DATA, 27), linear_search(DATA, 99))   # 6 0
`,
  };

  C['binary-search'] = {
    c: String.raw`#include <stdio.h>

/* Returns the 1-based LOC of item in sorted data[0..n-1], or 0. */
int binary(const int data[], int n, int item) {
    int beg = 1, end = n;
    while (beg <= end) {
        int mid = (beg + end) / 2;
        if (data[mid - 1] == item) return mid;
        if (item < data[mid - 1]) end = mid - 1; else beg = mid + 1;
    }
    return 0;
}

int main(void) {
    int data[] = {11, 22, 30, 33, 40, 44, 55, 60, 66, 77, 80, 88, 99};
    int n = sizeof data / sizeof data[0];
    printf("40 -> LOC %d\n", binary(data, n, 40));
    printf("85 -> LOC %d\n", binary(data, n, 85));
    return 0;
}
`,
    py: String.raw`def binary_search(data, item):
    """data must be sorted. Returns the 1-based position or 0."""
    beg, end = 1, len(data)
    while beg <= end:
        mid = (beg + end) // 2
        if data[mid - 1] == item:
            return mid
        if item < data[mid - 1]:
            end = mid - 1
        else:
            beg = mid + 1
    return 0

DATA = [11, 22, 30, 33, 40, 44, 55, 60, 66, 77, 80, 88, 99]
print(binary_search(DATA, 40), binary_search(DATA, 85))   # 5 0

import bisect                                              # the standard library way
i = bisect.bisect_left(DATA, 40)
print(i + 1 if i < len(DATA) and DATA[i] == 40 else 0)
`,
  };

  C['interpolation-search'] = {
    c: String.raw`#include <stdio.h>

int interpolation(const int a[], int n, int item) {
    int beg = 0, end = n - 1;
    while (beg <= end && a[beg] <= item && item <= a[end]) {
        if (a[end] == a[beg]) return a[beg] == item ? beg + 1 : 0;
        int pos = beg + (int)((long)(item - a[beg]) * (end - beg) / (a[end] - a[beg]));
        if (a[pos] == item) return pos + 1;
        if (a[pos] < item) beg = pos + 1; else end = pos - 1;
    }
    return 0;
}

int main(void) {
    int a[] = {10, 12, 13, 16, 18, 19, 20, 21, 22, 23, 24, 33, 35, 42, 47};
    printf("18 at %d, 47 at %d, 30 at %d\n", interpolation(a, 15, 18), interpolation(a, 15, 47), interpolation(a, 15, 30));
    return 0;
}
`,
    py: String.raw`def interpolation_search(a, item):
    beg, end = 0, len(a) - 1
    while beg <= end and a[beg] <= item <= a[end]:
        if a[end] == a[beg]:
            return beg + 1 if a[beg] == item else 0
        pos = beg + (item - a[beg]) * (end - beg) // (a[end] - a[beg])
        if a[pos] == item:
            return pos + 1
        if a[pos] < item:
            beg = pos + 1
        else:
            end = pos - 1
    return 0

A = [10, 12, 13, 16, 18, 19, 20, 21, 22, 23, 24, 33, 35, 42, 47]
print(interpolation_search(A, 18), interpolation_search(A, 47), interpolation_search(A, 30))
`,
  };

  const PRINT_C = String.raw`#include <stdio.h>

void print_array(const int a[], int n) { for (int i = 0; i < n; i++) printf("%d ", a[i]); printf("\n"); }
void swap(int *x, int *y) { int t = *x; *x = *y; *y = t; }
`;

  C['bubble-sort'] = {
    c: PRINT_C + String.raw`
void bubble(int a[], int n) {
    for (int k = 1; k <= n - 1; k++) {          /* pass K */
        int swapped = 0;
        for (int ptr = 0; ptr < n - k; ptr++)
            if (a[ptr] > a[ptr + 1]) { swap(&a[ptr], &a[ptr + 1]); swapped = 1; }
        if (!swapped) break;                    /* optional early exit */
    }
}

int main(void) {
    int a[] = {64, 25, 12, 22, 11, 90, 47, 33};
    bubble(a, 8);
    print_array(a, 8);
    return 0;
}
`,
    py: String.raw`def bubble_sort(a):
    n = len(a)
    for k in range(1, n):                 # pass K = 1 .. N-1
        swapped = False
        for ptr in range(n - k):
            if a[ptr] > a[ptr + 1]:
                a[ptr], a[ptr + 1] = a[ptr + 1], a[ptr]
                swapped = True
        if not swapped:                   # optional early exit
            break
    return a

print(bubble_sort([64, 25, 12, 22, 11, 90, 47, 33]))
`,
  };

  C['selection-sort'] = {
    c: PRINT_C + String.raw`
void selection(int a[], int n) {
    for (int k = 0; k < n - 1; k++) {
        int loc = k;                                       /* MIN(A, K, N, LOC) */
        for (int j = k + 1; j < n; j++) if (a[j] < a[loc]) loc = j;
        if (loc != k) swap(&a[k], &a[loc]);
    }
}

int main(void) {
    int a[] = {64, 25, 12, 22, 11, 90, 47, 33};
    selection(a, 8);
    print_array(a, 8);
    return 0;
}
`,
    py: String.raw`def selection_sort(a):
    n = len(a)
    for k in range(n - 1):
        loc = min(range(k, n), key=a.__getitem__)    # position of the minimum of a[k:]
        a[k], a[loc] = a[loc], a[k]
    return a

print(selection_sort([64, 25, 12, 22, 11, 90, 47, 33]))
`,
  };

  C['insertion-sort'] = {
    c: PRINT_C + String.raw`
void insertion(int a[], int n) {
    for (int k = 1; k < n; k++) {
        int temp = a[k], ptr = k - 1;
        while (ptr >= 0 && temp < a[ptr]) { a[ptr + 1] = a[ptr]; ptr--; }   /* shift right */
        a[ptr + 1] = temp;
    }
}

int main(void) {
    int a[] = {31, 41, 59, 26, 41, 58, 12, 7};
    insertion(a, 8);
    print_array(a, 8);
    return 0;
}
`,
    py: String.raw`def insertion_sort(a):
    for k in range(1, len(a)):
        temp, ptr = a[k], k - 1
        while ptr >= 0 and temp < a[ptr]:
            a[ptr + 1] = a[ptr]          # move the larger element right
            ptr -= 1
        a[ptr + 1] = temp
    return a

print(insertion_sort([31, 41, 59, 26, 41, 58, 12, 7]))
`,
  };

  C['shell-sort'] = {
    c: PRINT_C + String.raw`
void shell(int a[], int n) {
    for (int gap = n / 2; gap >= 1; gap /= 2)
        for (int k = gap; k < n; k++) {
            int temp = a[k], j = k;
            while (j >= gap && a[j - gap] > temp) { a[j] = a[j - gap]; j -= gap; }
            a[j] = temp;
        }
}

int main(void) {
    int a[] = {35, 33, 42, 10, 14, 19, 27, 44, 26, 31};
    shell(a, 10);
    print_array(a, 10);
    return 0;
}
`,
    py: String.raw`def shell_sort(a):
    gap = len(a) // 2
    while gap >= 1:
        for k in range(gap, len(a)):
            temp, j = a[k], k
            while j >= gap and a[j - gap] > temp:
                a[j] = a[j - gap]
                j -= gap
            a[j] = temp
        gap //= 2
    return a

print(shell_sort([35, 33, 42, 10, 14, 19, 27, 44, 26, 31]))
`,
  };

  C['merging'] = {
    c: PRINT_C + String.raw`
/* Merge sorted a[0..r-1] and b[0..s-1] into c. */
void merging(const int a[], int r, const int b[], int s, int c[]) {
    int na = 0, nb = 0, ptr = 0;
    while (na < r && nb < s) c[ptr++] = a[na] < b[nb] ? a[na++] : b[nb++];
    while (na < r) c[ptr++] = a[na++];
    while (nb < s) c[ptr++] = b[nb++];
}

int main(void) {
    int a[] = {5, 12, 18, 33, 40}, b[] = {3, 9, 21, 25, 47, 52}, c[11];
    merging(a, 5, b, 6, c);
    print_array(c, 11);
    return 0;
}
`,
    py: String.raw`def merging(a, b):
    na = nb = 0
    c = []
    while na < len(a) and nb < len(b):
        if a[na] < b[nb]:
            c.append(a[na]); na += 1
        else:
            c.append(b[nb]); nb += 1
    return c + a[na:] + b[nb:]

print(merging([5, 12, 18, 33, 40], [3, 9, 21, 25, 47, 52]))
`,
  };

  C['merge-sort'] = {
    c: PRINT_C + String.raw`
#include <string.h>
/* Bottom-up merge sort (as in the textbook): merge runs of length L = 1, 2, 4, ... */
void merge_sort(int a[], int n) {
    int b[64];
    for (int L = 1; L < n; L *= 2) {
        for (int j = 0; j < n; j += 2 * L) {
            int i1 = j, e1 = j + L < n ? j + L : n, i2 = e1, e2 = j + 2 * L < n ? j + 2 * L : n, k = j;
            while (i1 < e1 && i2 < e2) b[k++] = a[i1] <= a[i2] ? a[i1++] : a[i2++];
            while (i1 < e1) b[k++] = a[i1++];
            while (i2 < e2) b[k++] = a[i2++];
        }
        memcpy(a, b, n * sizeof(int));
    }
}

int main(void) {
    int a[] = {38, 27, 43, 3, 9, 82, 10, 61, 17};
    merge_sort(a, 9);
    print_array(a, 9);
    return 0;
}
`,
    py: String.raw`def merge_sort(a):
    """Top-down version: split, sort both halves, merge."""
    if len(a) <= 1:
        return a
    mid = len(a) // 2
    left, right = merge_sort(a[:mid]), merge_sort(a[mid:])
    out, i, j = [], 0, 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            out.append(left[i]); i += 1
        else:
            out.append(right[j]); j += 1
    return out + left[i:] + right[j:]

print(merge_sort([38, 27, 43, 3, 9, 82, 10, 61, 17]))
`,
  };

  C['quick-sort'] = {
    c: PRINT_C + String.raw`
/* Textbook reduction step: pivot = A[beg]; alternate scans from the right and from the left. */
int quick(int a[], int beg, int end) {
    int left = beg, right = end, loc = beg;
    for (;;) {
        while (a[loc] <= a[right] && loc != right) right--;
        if (loc == right) return loc;
        swap(&a[loc], &a[right]); loc = right;
        while (a[left] <= a[loc] && left != loc) left++;
        if (loc == left) return loc;
        swap(&a[left], &a[loc]); loc = left;
    }
}

/* Driver with explicit stacks LOWER and UPPER instead of recursion. */
void quicksort(int a[], int n) {
    int lower[64], upper[64], top = 0;
    if (n > 1) { lower[top] = 0; upper[top++] = n - 1; }
    while (top > 0) {
        top--;
        int beg = lower[top], end = upper[top];
        int loc = quick(a, beg, end);
        if (beg < loc - 1) { lower[top] = beg; upper[top++] = loc - 1; }
        if (loc + 1 < end) { lower[top] = loc + 1; upper[top++] = end; }
    }
}

int main(void) {
    int a[] = {44, 33, 11, 55, 77, 90, 40, 60, 99, 22, 88, 66};
    quicksort(a, 12);
    print_array(a, 12);
    return 0;
}
`,
    py: String.raw`def partition(a, beg, end):
    """Lomuto partition: last element is the pivot."""
    pivot, i = a[end], beg - 1
    for j in range(beg, end):
        if a[j] <= pivot:
            i += 1
            a[i], a[j] = a[j], a[i]
    a[i + 1], a[end] = a[end], a[i + 1]
    return i + 1

def quick_sort(a):
    stack = [(0, len(a) - 1)]            # explicit stack, like LOWER/UPPER
    while stack:
        beg, end = stack.pop()
        if beg < end:
            loc = partition(a, beg, end)
            stack.append((beg, loc - 1))
            stack.append((loc + 1, end))
    return a

print(quick_sort([44, 33, 11, 55, 77, 90, 40, 60, 99, 22, 88, 66]))
`,
  };

  C['radix-sort'] = {
    c: PRINT_C + String.raw`
void radix_sort(int a[], int n) {
    int max = a[0], out[64];
    for (int i = 1; i < n; i++) if (a[i] > max) max = a[i];
    for (int div = 1; max / div > 0; div *= 10) {           /* one pass per digit */
        int count[10] = {0};
        for (int i = 0; i < n; i++) count[(a[i] / div) % 10]++;
        for (int d = 1; d < 10; d++) count[d] += count[d - 1];
        for (int i = n - 1; i >= 0; i--) out[--count[(a[i] / div) % 10]] = a[i];   /* stable */
        for (int i = 0; i < n; i++) a[i] = out[i];
    }
}

int main(void) {
    int a[] = {348, 143, 361, 423, 538, 128, 321, 543, 366};
    radix_sort(a, 9);
    print_array(a, 9);
    return 0;
}
`,
    py: String.raw`def radix_sort(a):
    div = 1
    while max(a) // div > 0:
        pockets = [[] for _ in range(10)]
        for x in a:                         # distribute by the current digit
            pockets[(x // div) % 10].append(x)
        a = [x for p in pockets for x in p] # collect pockets 0..9
        div *= 10
    return a

print(radix_sort([348, 143, 361, 423, 538, 128, 321, 543, 366]))
`,
  };

  C['counting-sort'] = {
    c: PRINT_C + String.raw`
void counting_sort(const int a[], int n, int k, int b[]) {   /* keys in 0..k */
    int count[100] = {0};
    for (int j = 0; j < n; j++) count[a[j]]++;
    for (int v = 1; v <= k; v++) count[v] += count[v - 1];
    for (int j = n - 1; j >= 0; j--) b[--count[a[j]]] = a[j];
}

int main(void) {
    int a[] = {4, 1, 3, 4, 2, 9, 1, 3, 4, 0}, b[10];
    counting_sort(a, 10, 9, b);
    print_array(b, 10);
    return 0;
}
`,
    py: String.raw`def counting_sort(a, k):
    count = [0] * (k + 1)
    for x in a:
        count[x] += 1
    for v in range(1, k + 1):
        count[v] += count[v - 1]          # how many keys are <= v
    b = [None] * len(a)
    for x in reversed(a):                 # right to left keeps it stable
        count[x] -= 1
        b[count[x]] = x
    return b

print(counting_sort([4, 1, 3, 4, 2, 9, 1, 3, 4, 0], 9))
`,
  };

  C['heap-sort'] = {
    c: PRINT_C + String.raw`
void sift_down(int a[], int n, int i) {            /* 0-based: children 2i+1, 2i+2 */
    for (;;) {
        int c = 2 * i + 1;
        if (c >= n) return;
        if (c + 1 < n && a[c + 1] > a[c]) c++;
        if (a[i] >= a[c]) return;
        swap(&a[i], &a[c]); i = c;
    }
}
void heap_sort(int a[], int n) {
    for (int k = n / 2 - 1; k >= 0; k--) sift_down(a, n, k);   /* phase A: build a max-heap */
    for (int end = n - 1; end > 0; end--) {                     /* phase B */
        swap(&a[0], &a[end]);
        sift_down(a, end, 0);
    }
}

int main(void) {
    int a[] = {44, 30, 50, 22, 60, 55, 77, 55};
    heap_sort(a, 8);
    print_array(a, 8);
    return 0;
}
`,
    py: String.raw`def sift_down(a, n, i):
    while True:
        c = 2 * i + 1
        if c >= n:
            return
        if c + 1 < n and a[c + 1] > a[c]:
            c += 1
        if a[i] >= a[c]:
            return
        a[i], a[c] = a[c], a[i]
        i = c

def heap_sort(a):
    n = len(a)
    for k in range(n // 2 - 1, -1, -1):      # build a max-heap
        sift_down(a, n, k)
    for end in range(n - 1, 0, -1):          # move the max to the end, shrink the heap
        a[0], a[end] = a[end], a[0]
        sift_down(a, end, 0)
    return a

print(heap_sort([44, 30, 50, 22, 60, 55, 77, 55]))
`,
  };

  C['hash-functions'] = {
    c: String.raw`#include <stdio.h>

int division(long k, int m) { return (int)(k % m); }

int midsquare(long k, int digits) {                 /* middle 'digits' digits of k*k */
    char s[32]; long sq = k * k;
    int len = sprintf(s, "%ld", sq), start = (len - digits) / 2, h = 0;
    for (int i = start; i < start + digits; i++) h = h * 10 + (s[i] - '0');
    return h;
}

int folding(long k, int digits) {                   /* add digit groups, drop the carry */
    char s[32]; int len = sprintf(s, "%ld", k), sum = 0, mod = 1;
    for (int i = 0; i < digits; i++) mod *= 10;
    for (int i = 0; i < len; i += digits) {
        int part = 0;
        for (int j = i; j < i + digits && j < len; j++) part = part * 10 + (s[j] - '0');
        sum += part;
    }
    return sum % mod;
}

int main(void) {
    long keys[] = {3205, 7148, 2345};
    printf("   k   div  mid  fold\n");
    for (int i = 0; i < 3; i++)
        printf("%5ld %4d %4d %5d\n", keys[i], division(keys[i], 97), midsquare(keys[i], 2), folding(keys[i], 2));
    return 0;
}
`,
    py: String.raw`def division(k, m):
    return k % m

def midsquare(k, digits=2):
    s = str(k * k)
    start = (len(s) - digits) // 2
    return int(s[start:start + digits])

def folding(k, digits=2):
    s = str(k)
    total = sum(int(s[i:i + digits]) for i in range(0, len(s), digits))
    return total % 10 ** digits           # ignore the final carry

for k in (3205, 7148, 2345):
    print(k, division(k, 97), midsquare(k), folding(k))
`,
  };

  C['hash-open'] = {
    c: String.raw`#include <stdio.h>
#define M 11
#define EMPTY -1
#define DELETED -2

int T[M];

int probe(int h, int i, int k, char how) {
    if (how == 'l') return (h + i) % M;                      /* linear    */
    if (how == 'q') return (h + i * i) % M;                  /* quadratic */
    return (h + i * (1 + k % (M - 2))) % M;                  /* double hashing */
}
int insert(int k, char how) {
    int h = k % M;
    for (int i = 0; i < M; i++) {
        int loc = probe(h, i, k, how);
        if (T[loc] == EMPTY || T[loc] == DELETED) { T[loc] = k; return loc; }
        if (T[loc] == k) return loc;
    }
    return -1;                                               /* overflow */
}
int search(int k, char how) {
    int h = k % M;
    for (int i = 0; i < M; i++) {
        int loc = probe(h, i, k, how);
        if (T[loc] == k) return loc;
        if (T[loc] == EMPTY) return -1;
    }
    return -1;
}

int main(void) {
    int keys[] = {22, 31, 4, 15, 28, 17, 88, 59, 10};
    for (int i = 0; i < M; i++) T[i] = EMPTY;
    for (int i = 0; i < 9; i++) insert(keys[i], 'l');
    for (int i = 0; i < M; i++) printf("%2d: %d\n", i, T[i]);
    printf("search 59 -> %d\n", search(59, 'l'));
    return 0;
}
`,
    py: String.raw`class OpenAddressTable:
    EMPTY, DELETED = None, "DEL"

    def __init__(self, m=11, how="linear"):
        self.m, self.how = m, how
        self.t = [self.EMPTY] * m

    def probe(self, k, i):
        h = k % self.m
        if self.how == "linear":    return (h + i) % self.m
        if self.how == "quadratic": return (h + i * i) % self.m
        return (h + i * (1 + k % (self.m - 2))) % self.m      # double hashing

    def insert(self, k):
        for i in range(self.m):
            loc = self.probe(k, i)
            if self.t[loc] in (self.EMPTY, self.DELETED) or self.t[loc] == k:
                self.t[loc] = k
                return loc
        raise OverflowError("table full")

    def search(self, k):
        for i in range(self.m):
            loc = self.probe(k, i)
            if self.t[loc] == k:
                return loc
            if self.t[loc] is self.EMPTY:
                return None
        return None

    def delete(self, k):
        loc = self.search(k)
        if loc is not None:
            self.t[loc] = self.DELETED

h = OpenAddressTable(11, "linear")
for k in (22, 31, 4, 15, 28, 17, 88, 59, 10):
    h.insert(k)
print(h.t, h.search(59))
`,
  };

  C['hash-chain'] = {
    c: String.raw`#include <stdio.h>
#include <stdlib.h>
#define M 7

typedef struct Node { int key; struct Node *link; } Node;
Node *LIST[M];

void insert(int k) {
    Node *n = malloc(sizeof *n);
    n->key = k; n->link = LIST[k % M]; LIST[k % M] = n;      /* front of chain */
}
Node *search(int k) {
    for (Node *p = LIST[k % M]; p; p = p->link) if (p->key == k) return p;
    return NULL;
}
void delete_key(int k) {
    Node **pp = &LIST[k % M];
    while (*pp && (*pp)->key != k) pp = &(*pp)->link;
    if (*pp) { Node *t = *pp; *pp = t->link; free(t); }
}

int main(void) {
    int keys[] = {15, 11, 27, 8, 12, 22, 4, 36};
    for (int i = 0; i < 8; i++) insert(keys[i]);
    delete_key(22);
    for (int i = 0; i < M; i++) {
        printf("%d:", i);
        for (Node *p = LIST[i]; p; p = p->link) printf(" -> %d", p->key);
        printf("\n");
    }
    printf("36 %s\n", search(36) ? "found" : "not found");
    return 0;
}
`,
    py: String.raw`class ChainedHashTable:
    def __init__(self, m=7):
        self.m = m
        self.lists = [[] for _ in range(m)]

    def insert(self, k):
        chain = self.lists[k % self.m]
        if k not in chain:
            chain.insert(0, k)             # front of the chain

    def search(self, k):
        return k in self.lists[k % self.m]

    def delete(self, k):
        chain = self.lists[k % self.m]
        if k in chain:
            chain.remove(k)

h = ChainedHashTable(7)
for k in (15, 11, 27, 8, 12, 22, 4, 36):
    h.insert(k)
h.delete(22)
for i, chain in enumerate(h.lists):
    print(i, chain)
print("load factor =", sum(map(len, h.lists)) / h.m)
`,
  };

  C['complexity'] = {
    c: String.raw`#include <stdio.h>
#include <math.h>

/* Count basic operations for a few loop shapes instead of measuring time. */
int main(void) {
    printf("%6s %8s %8s %10s %10s %14s\n", "n", "log n", "n", "n log n", "n^2", "2^n");
    for (int n = 2; n <= 64; n *= 2) {
        long logn = 0; for (int x = n; x > 1; x /= 2) logn++;          /* O(log n) loop */
        long lin = 0;  for (int i = 0; i < n; i++) lin++;              /* O(n) loop     */
        long quad = 0; for (int i = 0; i < n; i++) for (int j = 0; j < n; j++) quad++;
        printf("%6d %8ld %8ld %10ld %10ld %14.0f\n", n, logn, lin, lin * logn, quad, pow(2, n));
    }
    return 0;
}
`,
    py: String.raw`import math, time

def count_ops(n):
    logn = 0
    x = n
    while x > 1:            # O(log n)
        x //= 2; logn += 1
    return {"log n": logn, "n": n, "n log n": n * logn, "n^2": n * n, "2^n": 2 ** n}

for n in (2, 4, 8, 16, 32, 64):
    print(n, count_ops(n))

# Real timing of an O(n^2) loop (numbers depend on your computer)
for n in (200, 400, 800):
    t = time.perf_counter()
    s = sum(i * j for i in range(n) for j in range(n))
    print(f"n={n}: {time.perf_counter() - t:.4f} s")
`,
  };
})(typeof window !== 'undefined' ? window : globalThis);
