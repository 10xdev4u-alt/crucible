import { describe, expect, it } from 'vitest';
import { MemoryCache } from './memory.js';

describe('MemoryCache', () => {
  it('stores and retrieves a value', () => {
    const c = new MemoryCache<number>();
    c.set('a', 1);
    expect(c.get('a')).toBe(1);
  });

  it('returns undefined for missing keys', () => {
    const c = new MemoryCache<number>();
    expect(c.get('missing')).toBeUndefined();
  });

  it('expires entries after TTL', async () => {
    const c = new MemoryCache<number>({ ttlMs: 20 });
    c.set('a', 1);
    expect(c.get('a')).toBe(1);
    await new Promise((r) => setTimeout(r, 30));
    expect(c.get('a')).toBeUndefined();
  });

  it('honors per-entry TTL override', async () => {
    const c = new MemoryCache<number>({ ttlMs: 100 });
    c.set('a', 1, 20);
    await new Promise((r) => setTimeout(r, 30));
    expect(c.get('a')).toBeUndefined();
  });

  it('deletes entries', () => {
    const c = new MemoryCache<number>();
    c.set('a', 1);
    expect(c.delete('a')).toBe(true);
    expect(c.get('a')).toBeUndefined();
  });

  it('tracks hit and miss counts', () => {
    const c = new MemoryCache<number>();
    c.set('a', 1);
    c.get('a');
    c.get('a');
    c.get('missing');
    const s = c.stats();
    expect(s.hits).toBe(2);
    expect(s.misses).toBe(1);
    expect(s.hitRate).toBeCloseTo(2 / 3);
  });

  it('enforces max size with LRU-ish eviction', () => {
    const c = new MemoryCache<number>({ maxSize: 2 });
    c.set('a', 1);
    c.set('b', 2);
    c.set('c', 3);
    expect(c.size()).toBe(2);
  });

  it('clears all entries and stats', () => {
    const c = new MemoryCache<number>();
    c.set('a', 1);
    c.get('a');
    c.clear();
    expect(c.size()).toBe(0);
    expect(c.stats().hits).toBe(0);
  });
});
