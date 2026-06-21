import { describe, expect, it } from 'vitest';
import { deterministicPick, isPowerOfTwo, nextPowerOfTwo, chunk, count, sum, product, average, median, range } from './math.js';

describe('math utilities', () => {
  describe('deterministicPick', () => {
    it('returns the same element for the same seed', () => {
      const arr = ['a', 'b', 'c', 'd'];
      expect(deterministicPick(arr, 1)).toBe(deterministicPick(arr, 1));
    });

    it('covers the array over many seeds', () => {
      const arr = [1, 2, 3, 4, 5];
      const seen = new Set<number>();
      for (let i = 0; i < 100; i++) seen.add(deterministicPick(arr, i));
      expect(seen.size).toBe(5);
    });
  });

  describe('isPowerOfTwo / nextPowerOfTwo', () => {
    it('identifies powers of two', () => {
      expect(isPowerOfTwo(1)).toBe(true);
      expect(isPowerOfTwo(2)).toBe(true);
      expect(isPowerOfTwo(4)).toBe(true);
      expect(isPowerOfTwo(1024)).toBe(true);
      expect(isPowerOfTwo(3)).toBe(false);
      expect(isPowerOfTwo(0)).toBe(false);
    });

    it('rounds up to next power of two', () => {
      expect(nextPowerOfTwo(1)).toBe(1);
      expect(nextPowerOfTwo(3)).toBe(4);
      expect(nextPowerOfTwo(5)).toBe(8);
      expect(nextPowerOfTwo(1023)).toBe(1024);
    });
  });

  describe('chunk', () => {
    it('chunks an array', () => {
      expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
      expect(chunk([1, 2, 3, 4, 5, 6], 2)).toEqual([[1, 2], [3, 4], [5, 6]]);
      expect(chunk([], 2)).toEqual([]);
    });
  });

  describe('count / sum / product / average / median / range', () => {
    it('counts elements', () => {
      expect(count([1, 2, 3, 4, 5], (n) => n > 2)).toBe(3);
    });

    it('sums', () => {
      expect(sum([1, 2, 3, 4])).toBe(10);
    });

    it('products', () => {
      expect(product([1, 2, 3, 4])).toBe(24);
    });

    it('averages', () => {
      expect(average([2, 4, 6])).toBe(4);
    });

    it('median', () => {
      expect(median([1, 2, 3, 4, 5])).toBe(3);
      expect(median([1, 2, 3, 4])).toBe(2.5);
    });

    it('range', () => {
      expect(range([3, 1, 4, 1, 5, 9, 2, 6])).toEqual([1, 9]);
    });
  });
});
