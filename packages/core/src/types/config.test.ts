import { describe, expect, it } from 'vitest';
import { configSchema } from './config.js';

describe('config schema', () => {
  it('parses a minimal config', () => {
    const r = configSchema.parse({ version: 1 });
    expect(r.version).toBe(1);
    expect(r.agents).toEqual([]);
    expect(r.providers).toEqual([]);
  });

  it('applies sensible defaults', () => {
    const r = configSchema.parse({ version: 1 });
    expect(r.output.format).toBe('text');
    expect(r.output.color).toBe(true);
    expect(r.cache.enabled).toBe(true);
    expect(r.cache.kind).toBe('memory');
    expect(r.runtime.parallelism).toBe(4);
    expect(r.runtime.timeoutMs).toBe(60_000);
  });

  it('rejects an unknown version', () => {
    expect(() => configSchema.parse({ version: 99 })).toThrow();
  });

  it('rejects invalid runtime values', () => {
    expect(() =>
      configSchema.parse({ version: 1, runtime: { parallelism: -1, timeoutMs: 0, retries: 0 } }),
    ).toThrow();
  });

  it('parses a complete config', () => {
    const r = configSchema.parse({
      version: 1,
      project: { name: 'foo', root: '/tmp/foo' },
      agents: [{ id: 'security' }, { id: 'style', weight: 2 }],
      providers: [{ id: 'anthropic', defaultModel: 'claude-opus-4-5' }],
      output: { format: 'json', color: false },
      cache: { kind: 'sqlite', path: './cache.db' },
      runtime: { parallelism: 8, timeoutMs: 120_000, retries: 3 },
    });
    expect(r.project.name).toBe('foo');
    expect(r.agents).toHaveLength(2);
    expect(r.agents[1]?.weight).toBe(2);
    expect(r.providers[0]?.id).toBe('anthropic');
    expect(r.output.format).toBe('json');
    expect(r.cache.kind).toBe('sqlite');
    expect(r.runtime.retries).toBe(3);
  });
});
