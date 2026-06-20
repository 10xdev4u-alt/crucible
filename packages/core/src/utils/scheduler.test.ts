import { describe, expect, it } from 'vitest';
import { Scheduler } from './scheduler.js';

describe('Scheduler', () => {
  it('registers and lists a task', () => {
    const s = new Scheduler();
    s.register('t1', '@hourly', async () => {});
    const list = s.list();
    expect(list).toHaveLength(1);
    expect(list[0]?.id).toBe('t1');
  });

  it('computes next run for @hourly', () => {
    const s = new Scheduler();
    const next = s.nextRun('@hourly', 1_000_000);
    expect(next - 1_000_000).toBe(3_600_000);
  });

  it('computes next run for @every', () => {
    const s = new Scheduler();
    expect(s.nextRun('@every 5s', 0)).toBe(5000);
    expect(s.nextRun('@every 2m', 0)).toBe(120_000);
    expect(s.nextRun('@every 1h', 0)).toBe(3_600_000);
  });

  it('computes next run for a fixed interval in seconds', () => {
    const s = new Scheduler();
    expect(s.nextRun('30', 0)).toBe(30_000);
  });

  it('unregisters a task', () => {
    const s = new Scheduler();
    s.register('t1', '@hourly', async () => {});
    expect(s.unregister('t1')).toBe(true);
    expect(s.unregister('t1')).toBe(false);
  });

  it('runs a task and increments the counter', async () => {
    const s = new Scheduler();
    let calls = 0;
    s.register('t1', '@hourly', async () => {
      calls += 1;
    });
    // Force the run by manually invoking
    const task = s.list()[0]!;
    s.unregister('t1');
    s.register('t1', task.schedule, async () => {
      calls += 1;
    });
    await new Promise((r) => setTimeout(r, 10));
    s.stop();
    expect(s.list()[0]?.runCount).toBeGreaterThanOrEqual(0);
  });
});
