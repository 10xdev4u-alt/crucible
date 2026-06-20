import { describe, expect, it } from 'vitest';
import { Mutex } from './mutex.js';

describe('Mutex', () => {
  it('starts unlocked', () => {
    const m = new Mutex();
    expect(m.isLocked()).toBe(false);
  });

  it('locks on acquire and unlocks on release', async () => {
    const m = new Mutex();
    const release = await m.acquire();
    expect(m.isLocked()).toBe(true);
    release();
    expect(m.isLocked()).toBe(false);
  });

  it('serializes run()', async () => {
    const m = new Mutex();
    const order: number[] = [];
    const a = m.run(async () => {
      order.push(1);
      await new Promise((r) => setTimeout(r, 5));
      order.push(2);
    });
    const b = m.run(async () => {
      order.push(3);
      order.push(4);
    });
    await Promise.all([a, b]);
    expect(order).toEqual([1, 2, 3, 4]);
  });

  it('reports waiter count', async () => {
    const m = new Mutex();
    await m.acquire();
    const w1 = m.acquire();
    const w2 = m.acquire();
    expect(m.waiterCount()).toBe(2);
    void w1;
    void w2;
  });
});
