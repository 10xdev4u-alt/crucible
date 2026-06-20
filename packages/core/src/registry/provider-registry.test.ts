import { describe, expect, it, vi } from 'vitest';
import type { ProviderInfo } from '../types/provider.js';
import { type Provider, ProviderRegistry, type ProviderRequest } from './provider-registry.js';

const makeProvider = (id: string, models: string[]): Provider => {
  const info: ProviderInfo = {
    id,
    name: id,
    models: models.map((m) => ({
      id: m,
      provider: id,
      contextWindow: 100_000,
      maxOutputTokens: 8_000,
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
      jsonMode: true,
    },
  };
  return {
    info: () => info,
    complete: vi.fn(async (_req: ProviderRequest) => ({
      content: 'ok',
      model: models[0] ?? 'm',
      finishReason: 'stop' as const,
    })),
  };
};

describe('ProviderRegistry', () => {
  it('registers and looks up providers', () => {
    const r = new ProviderRegistry();
    const p = makeProvider('anthropic', ['claude-opus-4-5']);
    r.register(p);
    expect(r.get('anthropic')).toBe(p);
    expect(r.has('anthropic')).toBe(true);
  });

  it('indexes models to providers', () => {
    const r = new ProviderRegistry();
    r.register(makeProvider('anthropic', ['claude-opus-4-5', 'claude-sonnet-4-5']));
    r.register(makeProvider('openai', ['gpt-5']));
    const p = r.resolveForModel('claude-opus-4-5');
    expect(p?.info().id).toBe('anthropic');
    const p2 = r.resolveForModel('gpt-5');
    expect(p2?.info().id).toBe('openai');
  });

  it('finds model descriptors by id', () => {
    const r = new ProviderRegistry();
    r.register(makeProvider('anthropic', ['claude-opus-4-5']));
    const m = r.findModel('claude-opus-4-5');
    expect(m?.provider).toBe('anthropic');
  });

  it('returns undefined for unknown models', () => {
    const r = new ProviderRegistry();
    expect(r.resolveForModel('unknown')).toBeUndefined();
    expect(r.findModel('unknown')).toBeUndefined();
  });

  it('lists all models', () => {
    const r = new ProviderRegistry();
    r.register(makeProvider('anthropic', ['a1', 'a2']));
    r.register(makeProvider('openai', ['b1']));
    expect(
      r
        .listModels()
        .map((m) => m.id)
        .sort(),
    ).toEqual(['a1', 'a2', 'b1']);
  });

  it('reports capabilities for a model', () => {
    const r = new ProviderRegistry();
    r.register(makeProvider('anthropic', ['a1']));
    expect(r.capabilitiesFor('a1')?.streaming).toBe(true);
    expect(r.capabilitiesFor('unknown')).toBeUndefined();
  });

  it('clears the registry', () => {
    const r = new ProviderRegistry();
    r.register(makeProvider('anthropic', ['a1']));
    r.clear();
    expect(r.size()).toBe(0);
    expect(r.resolveForModel('a1')).toBeUndefined();
  });
});
