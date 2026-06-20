import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FileCache } from './file.js';

describe('FileCache', () => {
  let dir: string;
  let cache: FileCache<number>;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'crucible-cache-'));
    cache = new FileCache<number>({ dir, ttlMs: 60_000 });
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('persists values across instances', () => {
    cache.set('a', 1);
    const other = new FileCache<number>({ dir, ttlMs: 60_000 });
    expect(other.get('a')).toBe(1);
  });

  it('expires entries after TTL', async () => {
    cache.set('a', 1, 20);
    await new Promise((r) => setTimeout(r, 30));
    expect(cache.get('a')).toBeUndefined();
  });

  it('deletes entries from disk', () => {
    cache.set('a', 1);
    expect(cache.delete('a')).toBe(true);
    expect(cache.get('a')).toBeUndefined();
  });

  it('returns false when deleting a missing entry', () => {
    expect(cache.delete('missing')).toBe(false);
  });

  it('clears all files', () => {
    cache.set('a', 1);
    cache.set('b', 2);
    cache.clear();
    expect(cache.size()).toBe(0);
  });

  it('reports file count on disk', () => {
    cache.set('a', 1);
    cache.set('b', 2);
    expect(cache.size()).toBe(2);
  });
});
