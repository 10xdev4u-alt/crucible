import { describe, expect, it } from 'vitest';
import { stableStringify } from './stable-stringify.js';

describe('stableStringify', () => {
  it('serializes primitives', () => {
    expect(stableStringify('a')).toBe('"a"');
    expect(stableStringify(42)).toBe('42');
    expect(stableStringify(true)).toBe('true');
    expect(stableStringify(null)).toBe('null');
    expect(stableStringify(undefined)).toBe('undefined');
  });

  it('serializes arrays', () => {
    expect(stableStringify([1, 2, 3])).toBe('[1,2,3]');
    expect(stableStringify(['a', 'b'])).toBe('["a","b"]');
  });

  it('sorts object keys', () => {
    expect(stableStringify({ b: 1, a: 2 })).toBe('{"a":2,"b":1}');
  });

  it('handles nested structures', () => {
    expect(stableStringify({ a: { y: 1, x: 2 } })).toBe('{"a":{"x":2,"y":1}}');
  });

  it('handles dates and maps and sets', () => {
    const d = new Date('2026-06-20T00:00:00Z');
    expect(stableStringify(d)).toBe('Date(2026-06-20T00:00:00.000Z)');
    expect(stableStringify(new Map([['a', 1]]))).toBe('Map("a"=>1)');
    expect(stableStringify(new Set([1, 2]))).toBe('Set(1,2)');
  });

  it('produces the same output for equivalent objects with different key order', () => {
    expect(stableStringify({ a: 1, b: 2 })).toBe(stableStringify({ b: 2, a: 1 }));
  });
});
