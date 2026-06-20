import { describe, expect, it } from 'vitest';
import { type ParallelResult, runParallel } from './parallel.js';

describe('runParallel', () => {
  it('runs all items and preserves order', async () => {
    const results = await runParallel([async () => 1, async () => 2, async () => 3], {
      parallelism: 3,
    });
    expect(results.map((r) => r.value)).toEqual([1, 2, 3]);
  });

  it('respects the parallelism cap', async () => {
    let active = 0;
    let maxActive = 0;
    const item = async () => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await new Promise((r) => setTimeout(r, 10));
      active -= 1;
      return active;
    };
    const items = Array.from({ length: 6 }, () => item);
    await runParallel(items, { parallelism: 2 });
    expect(maxActive).toBeLessThanOrEqual(2);
  });

  it('catches errors per item', async () => {
    const results = await runParallel(
      [
        async () => 1,
        async () => {
          throw new Error('boom');
        },
        async () => 3,
      ],
      { parallelism: 3 },
    );
    const ok = results.filter((r) => r.ok);
    const failed = results.filter((r) => !r.ok);
    expect(ok).toHaveLength(2);
    expect(failed).toHaveLength(1);
    expect(failed[0]?.error?.message).toBe('boom');
  });

  it('times out long-running items', async () => {
    const results = await runParallel([async () => new Promise((r) => setTimeout(r, 100))], {
      parallelism: 1,
      timeoutMs: 20,
    });
    const r: ParallelResult<unknown> = results[0]!;
    expect(r.ok).toBe(false);
    expect(r.error?.message).toContain('Timed out');
  });

  it('handles empty input', async () => {
    const results = await runParallel([], { parallelism: 4 });
    expect(results).toEqual([]);
  });
});
