import { describe, expect, it } from 'vitest';
import { deepClone, deepMerge, omit, pick } from './objects.js';

describe('deepClone', () => {
  it('clones primitives', () => {
    expect(deepClone(42)).toBe(42);
    expect(deepClone('x')).toBe('x');
    expect(deepClone(null)).toBe(null);
  });

  it('clones arrays', () => {
    expect(deepClone([1, 2, 3])).toEqual([1, 2, 3]);
  });

  it('clones nested objects', () => {
    const o = { a: { b: { c: 1 } } };
    const c = deepClone(o);
    expect(c).toEqual(o);
    c.a.b.c = 2;
    expect(o.a.b.c).toBe(1);
  });
});

describe('deepMerge', () => {
  it('merges shallow', () => {
    expect(deepMerge({ a: 1, b: 2 }, { b: 3 })).toEqual({ a: 1, b: 3 });
  });

  it('merges deep', () => {
    const merged = deepMerge<{ a: { x: number; y: number; z?: number } }>(
      { a: { x: 1, y: 2 } },
      { a: { y: 3, z: 4 } },
    );
    expect(merged).toEqual({ a: { x: 1, y: 3, z: 4 } });
  });

  it('overwrites arrays', () => {
    expect(deepMerge({ a: [1, 2, 3] }, { a: [4] })).toEqual({ a: [4] });
  });
});

describe('pick', () => {
  it('returns only the specified keys', () => {
    const o = { a: 1, b: 2, c: 3 };
    expect(pick(o, ['a', 'c'])).toEqual({ a: 1, c: 3 });
  });
});

describe('omit', () => {
  it('removes the specified keys', () => {
    const o = { a: 1, b: 2, c: 3 };
    expect(omit(o, ['b'])).toEqual({ a: 1, c: 3 });
  });
});
