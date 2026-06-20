import { describe, expect, it, vi } from 'vitest';
import { retryable } from './decorator.js';

describe('retryable decorator', () => {
  it('succeeds on first try', async () => {
    class T {
      @retryable({ attempts: 3 })
      async run() {
        return 'ok';
      }
    }
    const t = new T();
    expect(await t.run()).toBe('ok');
  });

  it('retries on failure and eventually succeeds', async () => {
    let n = 0;
    class T {
      @retryable({ attempts: 3, delayMs: 1 })
      async run() {
        n += 1;
        if (n < 2) throw new Error('fail');
        return 'ok';
      }
    }
    const t = new T();
    expect(await t.run()).toBe('ok');
    expect(n).toBe(2);
  });

  it('throws after max attempts', async () => {
    class T {
      @retryable({ attempts: 2, delayMs: 1 })
      async run() {
        throw new Error('always');
      }
    }
    const t = new T();
    await expect(t.run()).rejects.toThrow('always');
  });

  it('calls onError for each attempt', async () => {
    const onError = vi.fn();
    class T {
      @retryable({ attempts: 3, delayMs: 1, onError })
      async run() {
        throw new Error('x');
      }
    }
    const t = new T();
    await expect(t.run()).rejects.toThrow();
    expect(onError).toHaveBeenCalledTimes(2);
  });

  it('uses linear backoff', async () => {
    let n = 0;
    class T {
      @retryable({ attempts: 3, delayMs: 5, backoff: 'linear' })
      async run() {
        n += 1;
        if (n < 2) throw new Error('fail');
        return n;
      }
    }
    const t = new T();
    expect(await t.run()).toBe(2);
  });

  it('uses constant backoff', async () => {
    let n = 0;
    class T {
      @retryable({ attempts: 2, delayMs: 1, backoff: 'constant' })
      async run() {
        n += 1;
        if (n < 2) throw new Error('fail');
        return n;
      }
    }
    const t = new T();
    expect(await t.run()).toBe(2);
  });
});
