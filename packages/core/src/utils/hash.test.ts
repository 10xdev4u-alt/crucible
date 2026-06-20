import { describe, expect, it } from 'vitest';
import { hashFile, hashObject, hashString } from './hash.js';

describe('hash', () => {
  describe('hashString', () => {
    it('returns a hex string of the requested length', () => {
      const h = hashString('hello');
      expect(h).toMatch(/^[0-9a-f]+$/);
      expect(h.length).toBe(12);
    });

    it('produces the same hash for the same input', () => {
      expect(hashString('hello')).toBe(hashString('hello'));
    });

    it('produces different hashes for different inputs', () => {
      expect(hashString('hello')).not.toBe(hashString('world'));
    });

    it('honors a custom length', () => {
      expect(hashString('hi', 4).length).toBe(4);
      expect(hashString('hi', 32).length).toBe(32);
    });
  });

  describe('hashObject', () => {
    it('produces the same hash regardless of key order', () => {
      const a = { foo: 1, bar: 2 };
      const b = { bar: 2, foo: 1 };
      expect(hashObject(a)).toBe(hashObject(b));
    });

    it('produces different hashes for different content', () => {
      expect(hashObject({ x: 1 })).not.toBe(hashObject({ x: 2 }));
    });
  });

  describe('hashFile', () => {
    it('changes when the path changes', () => {
      expect(hashFile('a.ts', 'content')).not.toBe(hashFile('b.ts', 'content'));
    });

    it('changes when the content changes', () => {
      expect(hashFile('a.ts', 'one')).not.toBe(hashFile('a.ts', 'two'));
    });
  });
});
