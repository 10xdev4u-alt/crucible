import { describe, expect, it, vi } from 'vitest';
import { backoffDelay, DEFAULT_RETRY_POLICY, withRetries } from './retry-policy.js';

describe('retry-policy', () => {
  it('backoffDelay grows exponentially', () => {
    const d0 = backoffDelay(DEFAULT_RETRY_POLICY, 0, 0);
    const d1 = backoffDelay(DEFAULT_RETRY_POLICY, 1, 0);
    const d2 = backoffDelay(DEFAULT_RETRY_POLICY, 2, 0);
    expect(d0).toBe(100);
    expect(d1).toBe(200);
    expect(d2).toBe(400);
  });

  it('backoffDelay caps at maxDelayMs', () => {
    const d = backoffDelay(DEFAULT_RETRY_POLICY, 100, 0);
    expect(d).toBe(DEFAULT_RETRY_POLICY.maxDelayMs);
  });

  it('backoffDelay adds jitter', () => {
    const a = backoffDelay(DEFAULT_RETRY_POLICY, 1, 0.5);
    const b = backoffDelay(DEFAULT_RETRY_POLICY, 1, 0.5);
    expect(a).not.toBe(b);
  });

  it('withRetries retries then succeeds', async () => {
    let n = 0;
    const r = await withRetries(
      async () => {
        n += 1;
        if (n < 2) throw new Error('fail');
        return 'ok';
      },
      { ...DEFAULT_RETRY_POLICY, initialDelayMs: 1, maxRetries: 3 },
    );
    expect(r).toBe('ok');
    expect(n).toBe(2);
  });

  it('withRetries throws after exhausting', async () => {
    await expect(
      withRetries(
        async () => {
          throw new Error('x');
        },
        { ...DEFAULT_RETRY_POLICY, maxRetries: 2, initialDelayMs: 1 },
      ),
    ).rejects.toThrow('x');
  });

  it('withRetries respects shouldRetry', async () => {
    const shouldRetry = vi.fn(() => false);
    await expect(
      withRetries(
        async () => {
          throw new Error('x');
        },
        { ...DEFAULT_RETRY_POLICY, maxRetries: 3, initialDelayMs: 1, shouldRetry },
      ),
    ).rejects.toThrow();
    expect(shouldRetry).toHaveBeenCalled();
  });
});
