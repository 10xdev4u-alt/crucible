import { describe, expect, it, vi } from 'vitest';
import { isTransientError, retry } from './retry.js';

describe('retry', () => {
  it('returns the value on success', async () => {
    const r = await retry(async () => 42, { retries: 3 });
    expect(r).toBe(42);
  });

  it('retries on failure and eventually succeeds', async () => {
    let attempts = 0;
    const r = await retry(
      async () => {
        attempts += 1;
        if (attempts < 3) throw new Error('fail');
        return 'ok';
      },
      { retries: 5, baseMs: 1 },
    );
    expect(r).toBe('ok');
    expect(attempts).toBe(3);
  });

  it('throws after exhausting retries', async () => {
    await expect(
      retry(async () => {
        throw new Error('always');
      }, { retries: 2, baseMs: 1 }),
    ).rejects.toThrow('always');
  });

  it('calls onRetry', async () => {
    const onRetry = vi.fn();
    await expect(
      retry(
        async () => {
          throw new Error('x');
        },
        { retries: 2, baseMs: 1, onRetry },
      ),
    ).rejects.toThrow();
    expect(onRetry).toHaveBeenCalledTimes(2);
  });

  it('respects shouldRetry', async () => {
    const shouldRetry = vi.fn(() => false);
    await expect(
      retry(
        async () => {
          throw new Error('x');
        },
        { retries: 3, baseMs: 1, shouldRetry },
      ),
    ).rejects.toThrow('x');
    expect(shouldRetry).toHaveBeenCalledTimes(1);
  });
});

describe('isTransientError', () => {
  it('detects rate limits', () => {
    expect(isTransientError(new Error('rate limit exceeded'))).toBe(true);
  });

  it('detects timeouts', () => {
    expect(isTransientError(new Error('Request timed out'))).toBe(true);
  });

  it('detects 429/5xx', () => {
    expect(isTransientError(new Error('HTTP 429'))).toBe(true);
    expect(isTransientError(new Error('HTTP 503'))).toBe(true);
  });

  it('returns false for non-transient errors', () => {
    expect(isTransientError(new Error('not found'))).toBe(false);
    expect(isTransientError(new Error('parse failed'))).toBe(false);
  });
});
