// Run: node src/lib/shelfLayout.check.ts
import assert from "node:assert/strict";
import { layoutRows } from "./shelfLayout.ts";

const W = (n: number, w = 50) => Array.from({ length: n }, () => w);

// everything fits on one row with both décors
assert.deepEqual(layoutRows(W(3), 600, 200, 150), [[0, 1, 2]]);
// row 0 reserves the left décor: 600 - 200 = 400 → 8 books, rest wrap
assert.deepEqual(layoutRows(W(10), 600, 200, 150).map((r) => r.length), [8, 2]);
// regression: last row full of books → right décor would wrap alone; books move down instead
const rows = layoutRows(W(20), 600, 200, 0 + 150);
const last = rows[rows.length - 1];
assert.ok(last.length >= 1, "last row always has a book");
assert.ok(last.reduce((s) => s + 50, 0) + 150 <= 600, "right décor fits on the last row");
assert.deepEqual(rows.flat(), [...Array(20).keys()], "every book placed once, in order");
// not measured yet → single row, no crash
assert.deepEqual(layoutRows(W(4), 0, 200, 150), [[0, 1, 2, 3]]);
assert.deepEqual(layoutRows([], 600, 200, 150), [[]]);
console.log("shelfLayout: all checks passed");
