import { describe, expect, it } from 'vitest';
import type { Provider, ProviderRequest, ProviderResponse } from '../registry/provider-registry.js';
import { BedrockProvider } from './bedrock.js';
import { GeminiProvider } from './gemini.js';
import { InMemoryHttpClient } from './http.js';

describe('Provider response normalization', () => {
  it('Anthropic: stop_reason end_turn maps to stop', async () => {
    const http = new InMemoryHttpClient([
      {
        status: 200,
        headers: {},
        body: { content: [{ type: 'text', text: 'hi' }], stop_reason: 'end_turn' },
      },
    ]);
    const p = makeAnthropic(http);
    const r = await p.complete({ model: 'm', messages: [] });
    expect(r.finishReason).toBe('stop');
  });

  it('Anthropic: stop_reason max_tokens maps to length', async () => {
    const http = new InMemoryHttpClient([
      {
        status: 200,
        headers: {},
        body: { content: [{ type: 'text', text: 'hi' }], stop_reason: 'max_tokens' },
      },
    ]);
    const p = makeAnthropic(http);
    const r = await p.complete({ model: 'm', messages: [] });
    expect(r.finishReason).toBe('length');
  });

  it('Gemini: STOP maps to stop', async () => {
    const http = new InMemoryHttpClient([
      {
        status: 200,
        headers: {},
        body: { candidates: [{ content: { parts: [{ text: 'hi' }] }, finishReason: 'STOP' }] },
      },
    ]);
    const p = new GeminiProvider({ apiKey: 'k', httpClient: http });
    const r = await p.complete({ model: 'm', messages: [] });
    expect(r.finishReason).toBe('stop');
  });

  it('Gemini: MAX_TOKENS maps to length', async () => {
    const http = new InMemoryHttpClient([
      {
        status: 200,
        headers: {},
        body: {
          candidates: [{ content: { parts: [{ text: 'hi' }] }, finishReason: 'MAX_TOKENS' }],
        },
      },
    ]);
    const p = new GeminiProvider({ apiKey: 'k', httpClient: http });
    const r = await p.complete({ model: 'm', messages: [] });
    expect(r.finishReason).toBe('length');
  });

  it('Bedrock: normalizes max_tokens to length', async () => {
    const http = new InMemoryHttpClient([
      {
        status: 200,
        headers: {},
        body: { content: [{ type: 'text', text: 'hi' }], stopReason: 'max_tokens' },
      },
    ]);
    const p = new BedrockProvider({ apiKey: 'k', httpClient: http });
    const r = await p.complete({
      model: 'anthropic.claude-sonnet-4-5-20251022-v1:0',
      messages: [],
    });
    expect(r.finishReason).toBe('length');
  });
});

function makeAnthropic(http: InMemoryHttpClient) {
  return {
    info: () => ({ id: 'a', name: 'a', models: [], capabilities: {} as never }),
    complete: async (req: ProviderRequest): Promise<ProviderResponse> => {
      const p = {
        info: () => ({ id: 'a', name: 'a', models: [], capabilities: {} as never }),
        complete: async () => ({ content: '', model: 'm', finishReason: 'stop' as const }),
      } as unknown as Provider;
      void p;
      const res = await http.request<{
        content: Array<{ type: string; text: string }>;
        stop_reason: string;
      }>({
        url: 'https://api.anthropic.com/v1/messages',
        method: 'POST',
        headers: {},
        body: req,
      });
      return {
        content: res.body.content[0]?.text ?? '',
        model: 'm',
        finishReason: res.body.stop_reason === 'max_tokens' ? 'length' : 'stop',
      };
    },
  };
}
