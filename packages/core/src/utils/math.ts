/** A few math utilities. */

/** Pick an element from an array deterministically based on a numeric seed. */
export function deterministicPick<T>(arr: readonly T[], seed: number): T {
  if (arr.length === 0) throw new Error('Cannot pick from empty array');
  const idx = Math.abs(Math.floor(seed)) % arr.length;
  // The previous line always returns a value since arr.length > 0
  return arr[idx] as T;
}

/** Returns true if n is a power of two. */
export function isPowerOfTwo(n: number): boolean {
  return n > 0 && (n & (n - 1)) === 0;
}

/** Returns the smallest power of two >= n. */
export function nextPowerOfTwo(n: number): number {
  if (n <= 1) return 1;
  let p = 1;
  while (p < n) p <<= 1;
  return p;
}

/** Chunk an array into groups of size n. */
export function chunk<T>(arr: readonly T[], size: number): T[][] {
  if (size <= 0) throw new Error('Chunk size must be > 0');
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

/** Count elements that match a predicate. */
export function count<T>(arr: readonly T[], pred: (item: T) => boolean): number {
  return arr.filter(pred).length;
}

/** Sum of all elements. */
export function sum(arr: readonly number[]): number {
  return arr.reduce((a, b) => a + b, 0);
}

/** Product of all elements. */
export function product(arr: readonly number[]): number {
  return arr.reduce((a, b) => a * b, 1);
}

/** Arithmetic mean. */
export function average(arr: readonly number[]): number {
  if (arr.length === 0) return 0;
  return sum(arr) / arr.length;
}

/** Median value. */
export function median(arr: readonly number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2
    : (sorted[mid] ?? 0);
}

/** [min, max] of a non-empty array. */
export function range(arr: readonly number[]): [number, number] {
  if (arr.length === 0) return [0, 0];
  let min = arr[0]!;
  let max = arr[0]!;
  for (const v of arr) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  return [min, max];
}
