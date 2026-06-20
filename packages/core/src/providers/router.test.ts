import { describe, expect, it, vi } from 'vitest';
import type { ProviderInfo } from '../types/provider.js';
import { ProviderRegistry } from '../registry/provider-registry.js';
import { ProviderRouter } from './router.js';

const dummyProvider = (id: string, models: string[]) => ({
  info: (): ProviderInfo => ({
    id,
    name: id,
    models: models.map((m) => ({
      id: m,
      provider: id,
      contextWindow: 32_000,
      maxOutputTokens: 4_000,
      supportsTools: true,
      supportsStreaming: true,
      supportsVision: false,
    })),
    capabilities: {
      streaming: true,
      tools: true,
      vision: false,
      parallelToolCalls: false,
      systemPrompt: true,
      jsonMode: false,
    },
  }),
  complete: vi.fn(async () => ({
    content: `from ${id}`,
    model: 'm',
    finishReason: 'stop' as const,
  })),
});

describe('ProviderRouter', () => {
  it('routes to the provider that owns the model', async () => {
    const reg = new ProviderRegistry();
    const a = dummyProvider('a', ['a-m1']);
    const b = dummyProvider('b', ['b-m1']);
    reg.register(a);
    reg.register(b);
    const router = new ProviderRouter(reg);
    const r = await router.complete({ model: 'b-m1', messages: [] });
    expect(r.content).toBe('from b');
  });

  it('uses preferred provider when model is unknown', async () => {
    const reg = new ProviderRegistry();
    const a = dummyProvider('a', ['a-m1']);
    const b = dummyProvider('b', ['b-m1']);
    reg.register(a);
    reg.register(b);
    const router = new ProviderRouter(reg, { preferProviderIds: ['a'] });
    const r = await router.complete({ model: 'unknown', messages: [] });
    expect(r.content).toBe('from a');
  });

  it('falls back to the configured fallback model', async () => {
    const reg = new ProviderRegistry();
    const a = dummyProvider('a', ['a-m1']);
    reg.register(a);
    const router = new ProviderRouter(reg, { fallbackModel: 'a-m1' });
    const r = await router.complete({ model: 'unknown', messages: [] });
    expect(r.content).toBe('from a');
  });

  it('throws when no provider is available', async () => {
    const reg = new ProviderRegistry();
    const router = new ProviderRouter(reg);
    await expect(router.complete({ model: 'x', messages: [] })).rejects.toThrow(/No provider/);
  });
});
