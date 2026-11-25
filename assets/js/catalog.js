/* DSA Lab · catalog.js — the topics, in the order students meet them.
   Simulations register themselves into these topics (see assets/js/sims/*). */
(function (g) {
  'use strict';
  const DSA = g.DSA;
  const T = (id, title, short, schaum, blurb, icon) => DSA.topic({ id, title, short, schaum, blurb, icon });

  T('arrays', 'Arrays & Matrices', 'Arrays', 'Schaum Ch. 4',
    'Linear arrays, traversal, insertion and deletion with shifting, 2-D address calculation, matrix multiplication and sparse matrices.',
    '<rect x="3" y="9" width="5" height="6" rx="1"/><rect x="9.5" y="9" width="5" height="6" rx="1"/><rect x="16" y="9" width="5" height="6" rx="1"/>');
  T('linked', 'Linked Lists', 'Linked lists', 'Schaum Ch. 5',
    'Nodes and pointers: memory representation with INFO / LINK / AVAIL, singly, circular, header, two-way lists and polynomials.',
    '<rect x="2" y="9" width="6" height="6" rx="1"/><rect x="16" y="9" width="6" height="6" rx="1"/><path d="M8 12h6m-2-2 2 2-2 2"/>');
  T('stacks', 'Stacks', 'Stacks', 'Schaum Ch. 6',
    'LIFO lists: stacks in an array and as a linked list, overflow / underflow, and bracket matching.',
    '<rect x="6" y="4" width="12" height="4" rx="1"/><rect x="6" y="10" width="12" height="4" rx="1"/><rect x="6" y="16" width="12" height="4" rx="1"/>');
  T('expr', 'Polish Notation', 'Infix · Postfix · Prefix', 'Schaum Ch. 6',
    'Infix → postfix and infix → prefix conversion with an operator stack, and evaluating postfix and prefix expressions.',
    '<path d="M7 5c-3 4-3 10 0 14M17 5c3 4 3 10 0 14"/><path d="M10 12h4M12 10v4"/>');
  T('queues', 'Queues & Deques', 'Queues', 'Schaum Ch. 6',
    'FIFO lists: linear and circular queues, linked queues, double-ended queues and priority queues.',
    '<rect x="2" y="9" width="4" height="6" rx="1"/><rect x="8" y="9" width="4" height="6" rx="1"/><rect x="14" y="9" width="4" height="6" rx="1"/><path d="M20 12h2M0 12h1"/>');
  T('recursion', 'Recursion', 'Recursion', 'Schaum Ch. 6',
    'Watch the call stack grow and unwind: factorial, Fibonacci, GCD, power, Ackermann and the Towers of Hanoi.',
    '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/>');
  T('strings', 'Strings & Pattern Matching', 'Strings', 'Schaum Ch. 3',
    'String operations (SUBSTRING, INDEX, INSERT, DELETE, REPLACE) and pattern matching: brute force and the table-driven (KMP) method.',
    '<path d="M4 18 8 6l4 12M5.5 14h5M14 10h6M14 14h4"/>');
  T('search', 'Searching', 'Searching', 'Schaum Ch. 4 & 9',
    'Linear search with a sentinel, binary search with BEG / MID / END, and interpolation search.',
    '<circle cx="10" cy="10" r="6"/><path d="m20 20-5.5-5.5"/>');
  T('sort', 'Sorting', 'Sorting', 'Schaum Ch. 4, 6, 7 & 9',
    'Bubble, selection, insertion, Shell, merge, quick, heap, counting and radix sort — with bars that move.',
    '<path d="M5 20V14M10 20V10M15 20V7M20 20V4"/>');
  T('hashing', 'Hashing', 'Hashing', 'Schaum Ch. 9',
    'Hash functions (division, mid-square, folding) and collision resolution: linear, quadratic, double hashing and chaining.',
    '<path d="M9 3 7 21M17 3l-2 18M4 9h17M3 15h17"/>');
  T('trees', 'Binary Trees', 'Binary trees', 'Schaum Ch. 7',
    'Traversals (recursive and with a stack), array and linked representations, expression trees, threaded trees and general trees.',
    '<circle cx="12" cy="5" r="2.5"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="m10.5 7-3 8.7M13.5 7l3 8.7"/>');
  T('searchtrees', 'Search Trees', 'BST · AVL · B-tree', 'Schaum Ch. 7',
    'Binary search trees, AVL rotations and B-trees: search, insert and delete, step by step.',
    '<circle cx="12" cy="5" r="2.5"/><circle cx="7" cy="12" r="2.5"/><circle cx="17" cy="12" r="2.5"/><circle cx="4" cy="19" r="2"/><circle cx="10" cy="19" r="2"/><path d="m10.4 6.8-2 3M13.6 6.8l2 3M6 14l-1.2 3M8 14l1.2 3"/>');
  T('heaps', 'Heaps & Huffman', 'Heaps', 'Schaum Ch. 7',
    'Max- and min-heaps in an array, heap insertion and deletion, and Huffman’s algorithm for optimal codes.',
    '<path d="M12 3 21 20H3z"/><path d="M8 14h8"/>');
  T('graphs', 'Graphs', 'Graphs', 'Schaum Ch. 8',
    'Adjacency matrix and lists, Warshall, Floyd shortest paths, BFS, DFS, topological sort, Dijkstra, Prim and Kruskal.',
    '<circle cx="5" cy="6" r="2.5"/><circle cx="19" cy="6" r="2.5"/><circle cx="12" cy="19" r="2.5"/><path d="M7.5 6h9M6.3 8.2l4.4 8.6M17.7 8.2l-4.4 8.6"/>');
  T('analysis', 'Complexity', 'Big-O', 'Schaum Ch. 1–2',
    'How running time grows: race the common complexity classes against each other as n increases.',
    '<path d="M4 20V4M4 20h16"/><path d="M6 18c5-1 9-5 12-13"/>');
})(typeof window !== 'undefined' ? window : globalThis);
