import { describe, expect, it } from 'vitest';
import { Sandbox } from './sandbox.js';

describe('Sandbox', () => {
  it('runs a successful function', async () => {
    const s = new Sandbox();
    const r = await s.run(async () => 42);
    expect(r).toBe(42);
  });

  it('throws on timeout', async () => {
    const s = new Sandbox({ timeoutMs: 30 });
    await expect(
      s.run(async () => {
        await new Promise((r) => setTimeout(r, 100));
        return 1;
      }),
    ).rejects.toThrow(/timeout/);
  });

  it('returns only allowed env keys', () => {
    process.env.CRUCIBLE_TEST_ALLOWED = 'yes';
    process.env.CRUCIBLE_TEST_DENIED = 'no';
    const s = new Sandbox({ allowedEnv: ['CRUCIBLE_TEST_ALLOWED'] });
    const env = s.env();
    expect(env.CRUCIBLE_TEST_ALLOWED).toBe('yes');
    expect(env.CRUCIBLE_TEST_DENIED).toBeUndefined();
    delete process.env.CRUCIBLE_TEST_ALLOWED;
    delete process.env.CRUCIBLE_TEST_DENIED;
  });

  it('checks memory usage', () => {
    const s = new Sandbox({ maxMemoryMb: 1024 * 1024 });
    const r = s.checkMemory();
    expect(r.usedMb).toBeGreaterThan(0);
    expect(r.ok).toBe(true);
  });
});
