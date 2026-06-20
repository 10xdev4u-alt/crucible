import { describe, expect, it } from 'vitest';
import { Stopwatch, timed } from './stopwatch.js';

describe('Stopwatch', () => {
  it('measures elapsed time', async () => {
    const s = new Stopwatch();
    s.start();
    await new Promise((r) => setTimeout(r, 10));
    s.stop();
    expect(s.elapsed()).toBeGreaterThanOrEqual(10);
  });

  it('accumulates across start/stop cycles', async () => {
    const s = new Stopwatch();
    s.start();
    await new Promise((r) => setTimeout(r, 5));
    s.stop();
    const first = s.elapsed();
    s.start();
    await new Promise((r) => setTimeout(r, 5));
    s.stop();
    expect(s.elapsed()).toBeGreaterThan(first);
  });

  it('resets', () => {
    const s = new Stopwatch();
    s.start();
    s.reset();
    expect(s.elapsed()).toBe(0);
  });

  it('formats as ms/s/m', async () => {
    const s = new Stopwatch();
    s.start();
    await new Promise((r) => setTimeout(r, 5));
    s.stop();
    expect(s.format()).toMatch(/ms$/);
  });

  it('timed returns result and ms', async () => {
    const [r, ms] = await timed(async () => {
      await new Promise((res) => setTimeout(res, 10));
      return 'ok';
    });
    expect(r).toBe('ok');
    expect(ms).toBeGreaterThanOrEqual(10);
  });
});
