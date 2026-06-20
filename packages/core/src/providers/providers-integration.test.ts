import { describe, expect, it } from 'vitest';
import { ProviderRegistry } from '../registry/provider-registry.js';
import { AnthropicProvider } from './anthropic.js';
import { GeminiProvider } from './gemini.js';
import { InMemoryHttpClient } from './http.js';
import { OllamaProvider } from './ollama.js';
import { OpenAIProvider } from './openai.js';
import { OpenAICompatibleProvider } from './openai-compatible.js';
import { ProviderRouter } from './router.js';

const dummy = (id: string) => ({
  info: () => ({
    id,
    name: id,
    models: [
      {
        id: `${id}-m1`,
        provider: id,
        contextWindow: 100_000,
        maxOutputTokens: 4_000,
        supportsTools: true,
        supportsStreaming: true,
        supportsVision: false,
      },
    ],
    capabilities: {
      streaming: false,
      tools: false,
      vision: false,
      parallelToolCalls: false,
      systemPrompt: true,
      jsonMode: false,
    },
  }),
  complete: async () => ({ content: `from ${id}`, model: 'm', finishReason: 'stop' as const }),
});

describe('ProviderRouter integration', () => {
  it('finds the right provider by model id', async () => {
    const reg = new ProviderRegistry();
    reg.register(dummy('a'));
    reg.register(dummy('b'));
    const router = new ProviderRouter(reg);
    const r = await router.complete({ model: 'b-m1', messages: [] });
    expect(r.content).toBe('from b');
  });

  it('falls back to preferred provider when model is unknown', async () => {
    const reg = new ProviderRegistry();
    reg.register(dummy('a'));
    reg.register(dummy('b'));
    const router = new ProviderRouter(reg, { preferProviderIds: ['b'] });
    const r = await router.complete({ model: 'unknown', messages: [] });
    expect(r.content).toBe('from b');
  });

  it('uses fallback model when nothing else matches', async () => {
    const reg = new ProviderRegistry();
    reg.register(dummy('a'));
    const router = new ProviderRouter(reg, { fallbackModel: 'a-m1' });
    const r = await router.complete({ model: 'unknown', messages: [] });
    expect(r.content).toBe('from a');
  });
});

describe('All providers expose the Provider interface', () => {
  const providers = [
    {
      name: 'Anthropic',
      ctor: () => new AnthropicProvider({ apiKey: 'k', httpClient: new InMemoryHttpClient() }),
    },
    {
      name: 'OpenAI',
      ctor: () => new OpenAIProvider({ apiKey: 'k', httpClient: new InMemoryHttpClient() }),
    },
    {
      name: 'Gemini',
      ctor: () => new GeminiProvider({ apiKey: 'k', httpClient: new InMemoryHttpClient() }),
    },
    { name: 'Ollama', ctor: () => new OllamaProvider({ httpClient: new InMemoryHttpClient() }) },
    {
      name: 'OpenAICompatible',
      ctor: () =>
        new OpenAICompatibleProvider({
          id: 'x',
          name: 'x',
          models: [{ id: 'm' }],
          httpClient: new InMemoryHttpClient(),
        }),
    },
  ];

  for (const { name, ctor } of providers) {
    it(`${name} returns a ProviderInfo`, () => {
      const p = ctor();
      const info = p.info();
      expect(info.id).toBeTruthy();
      expect(Array.isArray(info.models)).toBe(true);
    });
  }
});
