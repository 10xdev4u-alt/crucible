import { describe, expect, it } from 'vitest';
import { Semaphore } from './semaphore.js';

describe('Semaphore', () => {
  it('rejects invalid size', () => {
    expect(() => new Semaphore(0)).toThrow();
    expect(() => new Semaphore(-1)).toThrow();
  });

  it('acquires and releases', async () => {
    const s = new Semaphore(1);
    await s.acquire();
    expect(s.availablePermits()).toBe(0);
    s.release();
    expect(s.availablePermits()).toBe(1);
  });

  it('runs under a permit', async () => {
    const s = new Semaphore(2);
    const r = await s.run(async () => 42);
    expect(r).toBe(42);
  });

  it('blocks when no permits are available', async () => {
    const s = new Semaphore(1);
    await s.acquire();
    let acquired = false;
    const p = s.acquire().then(() => {
      acquired = true;
    });
    await new Promise((r) => setTimeout(r, 10));
    expect(acquired).toBe(false);
    s.release();
    await p;
    expect(acquired).toBe(true);
  });
});
