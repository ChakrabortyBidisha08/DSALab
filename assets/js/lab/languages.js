/* DSA Lab · lab/languages.js — the languages the Code Lab knows about.
   run: how a file is executed
     'js' | 'ts' | 'web'     in this browser tab
     'python' | 'ruby' | 'r' | 'sql'   in-browser WebAssembly runtimes
     'remote'                sent to an online compiler (Wandbox, with Compiler Explorer as backup)
     'none'                  plain files (Markdown, JSON, text)
   wandbox: the language name used by wandbox.org/api/list.json (any case). */
(function (g) {
  'use strict';
  const DSA = g.DSA;
  const L = (id, name, ext, monaco, run, more) => Object.assign({ id, name, ext, monaco, run }, more || {});

  const T = {
    c: `#include <stdio.h>

int main(void) {
    int n;
    printf("Hello from C!\\n");
    /* Type a number in the Input box, then press Run (Ctrl+Enter). */
    if (scanf("%d", &n) == 1)
        printf("You typed %d; its square is %d\\n", n, n * n);
    return 0;
}
`,
    cpp: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    vector<int> v = {5, 2, 9, 1, 7};
    sort(v.begin(), v.end());
    for (int x : v) cout << x << ' ';
    cout << "\\nHello from C++!" << endl;
    return 0;
}
`,
    java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        System.out.println("Hello from Java!");
        if (in.hasNextInt()) {
            int n = in.nextInt();
            System.out.println(n + " squared is " + (n * n));
        }
    }
}
`,
    python: `# Python runs right here in your browser (Pyodide).
def greet(name):
    return f"Hello, {name}!"

print(greet("DSA Lab"))
nums = [5, 2, 9, 1, 7]
print("sorted:", sorted(nums))

# input() reads lines from the Input box
try:
    n = int(input("Enter a number: "))
    print(n, "squared is", n * n)
except EOFError:
    print("(no input given)")
`,
    javascript: `// JavaScript runs in a background worker; console.log prints to the terminal.
const nums = [5, 2, 9, 1, 7];
console.log("sorted:", [...nums].sort((a, b) => a - b));

// readline() / prompt() read lines from the Input box
const line = readline();
console.log("You typed:", line ?? "(nothing)");
`,
    typescript: `interface Point { x: number; y: number }

function dist(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

console.log("distance =", dist({ x: 0, y: 0 }, { x: 3, y: 4 }));
`,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>My page</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h1>Hello, web!</h1>
  <button id="btn">Click me</button>
  <p id="out"></p>
  <script src="script.js"></script>
</body>
</html>
`,
    css: `body {
  font-family: system-ui, sans-serif;
  margin: 2rem;
  background: #f4f7fc;
  color: #0c1530;
}
h1 { color: #0b97b0; }
button { padding: .6rem 1rem; border-radius: 8px; border: 0; background: #0b97b0; color: #fff; }
`,
    webjs: `let clicks = 0;
document.getElementById("btn").addEventListener("click", () => {
  clicks++;
  document.getElementById("out").textContent = "Clicked " + clicks + " time(s)";
  console.log("click", clicks);   // shows in the terminal too
});
`,
    ruby: `# Ruby runs in your browser (ruby.wasm).
nums = [5, 2, 9, 1, 7]
puts "sorted: #{nums.sort.inspect}"
line = gets
puts "You typed: #{line ? line.chomp : '(nothing)'}"
`,
    r: `# R runs in your browser (webR).
x <- c(5, 2, 9, 1, 7)
print(sort(x))
cat("mean =", mean(x), "\\n")
summary(x)
`,
    sql: `-- SQLite runs in your browser (sql.js). Each run starts with an empty database.
CREATE TABLE student (roll INTEGER PRIMARY KEY, name TEXT, marks INTEGER);
INSERT INTO student VALUES (1, 'Asha', 87), (2, 'Rahul', 72), (3, 'Meera', 91), (4, 'Imran', 65);

SELECT name, marks FROM student WHERE marks > 70 ORDER BY marks DESC;
SELECT COUNT(*) AS students, AVG(marks) AS average FROM student;
`,
    rust: `use std::io::{self, Read};

fn main() {
    let mut v = vec![5, 2, 9, 1, 7];
    v.sort();
    println!("sorted: {:?}", v);
    let mut input = String::new();
    io::stdin().read_to_string(&mut input).unwrap();
    println!("You typed: {}", input.trim());
}
`,
    go: `package main

import "fmt"

func main() {
\tnums := []int{5, 2, 9, 1, 7}
\tfmt.Println("Hello from Go!", nums)
\tvar n int
\tif _, err := fmt.Scan(&n); err == nil {
\t\tfmt.Println(n, "squared is", n*n)
\t}
}
`,
    csharp: `using System;

class Program {
    static void Main() {
        Console.WriteLine("Hello from C#!");
        string line = Console.ReadLine();
        Console.WriteLine("You typed: " + (line ?? "(nothing)"));
    }
}
`,
    php: `<?php
$nums = [5, 2, 9, 1, 7];
sort($nums);
echo "sorted: " . implode(", ", $nums) . "\\n";
$line = fgets(STDIN);
echo "You typed: " . ($line === false ? "(nothing)" : trim($line)) . "\\n";
`,
    swift: `let nums = [5, 2, 9, 1, 7]
print("sorted:", nums.sorted())
if let line = readLine() {
    print("You typed:", line)
}
`,
    haskell: `import Data.List (sort)

main :: IO ()
main = do
  print (sort [5, 2, 9, 1, 7 :: Int])
  putStrLn "Hello from Haskell!"
`,
    bash: `#!/bin/bash
echo "Hello from Bash!"
for i in 1 2 3; do echo "line $i"; done
read name
echo "You typed: $name"
`,
    lua: `local t = {5, 2, 9, 1, 7}
table.sort(t)
print("sorted: " .. table.concat(t, ", "))
`,
    perl: `my @n = sort { $a <=> $b } (5, 2, 9, 1, 7);
print "sorted: @n\\n";
`,
    kotlin: `fun main() {
    println("Hello from Kotlin!")
}
`,
    scala: `object Main extends App {
  println(List(5, 2, 9, 1, 7).sorted)
}
`,
    pascal: `program Hello;
begin
  writeln('Hello from Pascal!');
end.
`,
    markdown: `# Notes\n\nWrite anything here. Markdown files are not run.\n`,
  };

  DSA.LANGS = [
    L('c', 'C', ['c', 'h'], 'c', 'remote', { wandbox: ['C'], godbolt: 'c', tpl: T.c, file: 'main.c' }),
    L('cpp', 'C++', ['cpp', 'cc', 'cxx', 'hpp'], 'cpp', 'remote', { wandbox: ['C++'], godbolt: 'c++', tpl: T.cpp, file: 'main.cpp' }),
    L('java', 'Java', ['java'], 'java', 'remote', { wandbox: ['Java'], tpl: T.java, file: 'Main.java' }),
    L('python', 'Python', ['py'], 'python', 'python', { wandbox: ['Python'], tpl: T.python, file: 'main.py' }),
    L('javascript', 'JavaScript', ['js', 'mjs'], 'javascript', 'js', { wandbox: ['JavaScript'], tpl: T.javascript, file: 'main.js' }),
    L('typescript', 'TypeScript', ['ts'], 'typescript', 'ts', { wandbox: ['TypeScript'], tpl: T.typescript, file: 'main.ts' }),
    L('html', 'HTML', ['html', 'htm'], 'html', 'web', { tpl: T.html, file: 'index.html' }),
    L('css', 'CSS', ['css'], 'css', 'web', { tpl: T.css, file: 'style.css' }),
    L('ruby', 'Ruby', ['rb'], 'ruby', 'ruby', { wandbox: ['Ruby'], tpl: T.ruby, file: 'main.rb' }),
    L('r', 'R', ['r'], 'r', 'r', { wandbox: ['R'], tpl: T.r, file: 'main.r' }),
    L('sql', 'SQL (SQLite)', ['sql'], 'sql', 'sql', { wandbox: ['SQL'], tpl: T.sql, file: 'query.sql' }),
    L('rust', 'Rust', ['rs'], 'rust', 'remote', { wandbox: ['Rust'], godbolt: 'rust', tpl: T.rust, file: 'main.rs' }),
    L('go', 'Go', ['go'], 'go', 'remote', { wandbox: ['Go'], godbolt: 'go', tpl: T.go, file: 'main.go' }),
    L('csharp', 'C#', ['cs'], 'csharp', 'remote', { wandbox: ['C#', 'CSharp'], tpl: T.csharp, file: 'Program.cs' }),
    L('php', 'PHP', ['php'], 'php', 'remote', { wandbox: ['PHP'], tpl: T.php, file: 'main.php' }),
    L('swift', 'Swift', ['swift'], 'swift', 'remote', { wandbox: ['Swift'], tpl: T.swift, file: 'main.swift' }),
    L('kotlin', 'Kotlin', ['kt'], 'kotlin', 'remote', { wandbox: ['Kotlin'], tpl: T.kotlin, file: 'main.kt' }),
    L('haskell', 'Haskell', ['hs'], 'plaintext', 'remote', { wandbox: ['Haskell'], tpl: T.haskell, file: 'main.hs' }),
    L('scala', 'Scala', ['scala'], 'scala', 'remote', { wandbox: ['Scala'], tpl: T.scala, file: 'Main.scala' }),
    L('perl', 'Perl', ['pl'], 'perl', 'remote', { wandbox: ['Perl'], tpl: T.perl, file: 'main.pl' }),
    L('lua', 'Lua', ['lua'], 'lua', 'remote', { wandbox: ['Lua'], tpl: T.lua, file: 'main.lua' }),
    L('bash', 'Bash', ['sh', 'bash'], 'shell', 'remote', { wandbox: ['Bash script', 'Bash'], tpl: T.bash, file: 'script.sh' }),
    L('pascal', 'Pascal', ['pas'], 'pascal', 'remote', { wandbox: ['Pascal'], tpl: T.pascal, file: 'main.pas' }),
    L('d', 'D', ['d'], 'plaintext', 'remote', { wandbox: ['D'] }),
    L('julia', 'Julia', ['jl'], 'julia', 'remote', { wandbox: ['Julia'] }),
    L('elixir', 'Elixir', ['ex', 'exs'], 'elixir', 'remote', { wandbox: ['Elixir'] }),
    L('erlang', 'Erlang', ['erl'], 'plaintext', 'remote', { wandbox: ['Erlang'] }),
    L('nim', 'Nim', ['nim'], 'plaintext', 'remote', { wandbox: ['Nim'] }),
    L('ocaml', 'OCaml', ['ml'], 'plaintext', 'remote', { wandbox: ['OCaml'] }),
    L('crystal', 'Crystal', ['cr'], 'plaintext', 'remote', { wandbox: ['Crystal'] }),
    L('zig', 'Zig', ['zig'], 'plaintext', 'remote', { wandbox: ['Zig'] }),
    L('groovy', 'Groovy', ['groovy'], 'plaintext', 'remote', { wandbox: ['Groovy'] }),
    L('lisp', 'Common Lisp', ['lisp', 'lsp'], 'plaintext', 'remote', { wandbox: ['Lisp', 'Common Lisp'] }),
    L('markdown', 'Markdown', ['md'], 'markdown', 'none', { tpl: T.markdown, file: 'notes.md' }),
    L('json', 'JSON', ['json'], 'json', 'none'),
    L('text', 'Plain text', ['txt'], 'plaintext', 'none'),
  ];
  DSA.LANG = Object.fromEntries(DSA.LANGS.map((l) => [l.id, l]));
  DSA.TEMPLATES = T;
  DSA.langOfFile = (name) => {
    const ext = String(name).split('.').pop().toLowerCase();
    if (!String(name).includes('.')) return DSA.LANG.text;
    return DSA.LANGS.find((l) => l.ext.includes(ext)) || DSA.LANG.text;
  };
  /* The command line shown in the terminal before each run. */
  DSA.cmdLine = (lang, file) => ({
    c: `gcc ${file} -o main -lm && ./main`, cpp: `g++ ${file} -o main && ./main`, java: `javac ${file} && java Main`,
    python: `python3 ${file}`, javascript: `node ${file}`, typescript: `tsc ${file} && node ${file.replace(/\.ts$/, '.js')}`,
    ruby: `ruby ${file}`, r: `Rscript ${file}`, sql: `sqlite3 :memory: < ${file}`, rust: `rustc ${file} && ./main`, go: `go run ${file}`,
    csharp: `csc ${file} && mono Program.exe`, php: `php ${file}`, swift: `swift ${file}`, bash: `bash ${file}`,
  }[lang.id] || `run ${file}`);
})(window);
