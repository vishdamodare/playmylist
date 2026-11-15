/**
 * Greedy-fills shelf rows with book indices. Row 0 reserves room for the left décor, the last row
 * must also fit the right décor — if it doesn't, books move down so no row is ever décor-only.
 */
export function layoutRows(widths: number[], avail: number, left: number, right: number): number[][] {
  if (!widths.length) return [[]];
  if (avail <= 0) return [widths.map((_, i) => i)]; // not measured yet
  const rows: number[][] = [[]];
  let used = left;
  widths.forEach((w, i) => {
    if (rows[rows.length - 1].length && used + w > avail) {
      rows.push([]);
      used = 0;
    }
    rows[rows.length - 1].push(i);
    used += w;
  });
  const lastUsed = () =>
    (rows.length === 1 ? left : 0) + rows[rows.length - 1].reduce((sum, i) => sum + widths[i], 0);
  while (lastUsed() + right > avail && rows[rows.length - 1].length > 1) {
    const moved: number[] = [];
    while (lastUsed() + right > avail && rows[rows.length - 1].length > 1) moved.unshift(rows[rows.length - 1].pop()!);
    rows.push(moved);
  }
  return rows;
}
