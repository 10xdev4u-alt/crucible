import { describe, expect, it } from 'vitest';
import { RateLimiter } from './rate-limit.js';

describe('rate-limit', () => {
  it('starts at capacity', () => {
    const r = new RateLimiter(5, 1);
    expect(r.available()).toBe(5);
  });

  it('consumes tokens on tryAcquire', () => {
    const r = new RateLimiter(2, 1);
    expect(r.tryAcquire()).toBe(true);
    expect(r.tryAcquire()).toBe(true);
    expect(r.tryAcquire()).toBe(false);
  });

  it('refills tokens over time', async () => {
    const r = new RateLimiter(1, 100); // 100 per second = 1 per 10ms
    expect(r.tryAcquire()).toBe(true);
    expect(r.tryAcquire()).toBe(false);
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(r.tryAcquire()).toBe(true);
  });

  it('rejects invalid configuration', () => {
    expect(() => new RateLimiter(0, 1)).toThrow();
    expect(() => new RateLimiter(1, 0)).toThrow();
    expect(() => new RateLimiter(-1, 1)).toThrow();
  });

  it('caps tokens at capacity', async () => {
    const r = new RateLimiter(2, 1000);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(r.available()).toBeLessThanOrEqual(2);
  });
});
