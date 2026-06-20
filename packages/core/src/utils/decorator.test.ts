import { describe, expect, it, vi } from 'vitest';
import { withRetry } from './decorator.js';

describe('withRetry', () => {
  it('succeeds on first try', async () => {
    const fn = async () => 'ok';
    expect(await withRetry(fn, { attempts: 3, delayMs: 1 })()).toBe('ok');
  });

  it('retries on failure and eventually succeeds', async () => {
    let n = 0;
    const fn = async () => {
      n += 1;
      if (n < 2) throw new Error('fail');
      return 'ok';
    };
    expect(await withRetry(fn, { attempts: 3, delayMs: 1 })()).toBe('ok');
    expect(n).toBe(2);
  });

  it('throws after max attempts', async () => {
    const fn = async () => {
      throw new Error('always');
    };
    await expect(withRetry(fn, { attempts: 2, delayMs: 1 })()).rejects.toThrow('always');
  });

  it('calls onError for each attempt', async () => {
    const onError = vi.fn();
    const fn = async () => {
      throw new Error('x');
    };
    await expect(withRetry(fn, { attempts: 3, delayMs: 1, onError })()).rejects.toThrow();
    expect(onError).toHaveBeenCalledTimes(3);
  });

  it('uses linear backoff', async () => {
    let n = 0;
    const fn = async () => {
      n += 1;
      if (n < 2) throw new Error('fail');
      return n;
    };
    expect(await withRetry(fn, { attempts: 3, delayMs: 5, backoff: 'linear' })()).toBe(2);
  });

  it('uses constant backoff', async () => {
    let n = 0;
    const fn = async () => {
      n += 1;
      if (n < 2) throw new Error('fail');
      return n;
    };
    expect(await withRetry(fn, { attempts: 2, delayMs: 1, backoff: 'constant' })()).toBe(2);
  });

  it('preserves `this` context', async () => {
    const obj = {
      value: 42,
      async run() {
        return this.value;
      },
    };
    const wrapped = withRetry(obj.run, { attempts: 2, delayMs: 1 });
    expect(await wrapped.call(obj)).toBe(42);
  });
});
