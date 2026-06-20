import { describe, expect, it } from 'vitest';
import { InMemoryHttpClient } from './http.js';
import { OpenAIProvider } from './openai.js';

describe('OpenAIProvider', () => {
  it('returns info for known models', () => {
    const p = new OpenAIProvider({ apiKey: 'k', httpClient: new InMemoryHttpClient() });
    expect(p.info().id).toBe('openai');
    expect(p.info().models.map((m) => m.id)).toContain('gpt-5');
  });

  it('throws when apiKey is missing', () => {
    expect(() => new OpenAIProvider({ apiKey: '' })).toThrow();
  });

  it('sends the right request shape to the API', async () => {
    const http = new InMemoryHttpClient([
      {
        status: 200,
        headers: {},
        body: {
          choices: [{ message: { content: 'hi', role: 'assistant' }, finish_reason: 'stop' }],
          usage: { prompt_tokens: 7, completion_tokens: 2 },
        },
      },
    ]);
    const p = new OpenAIProvider({ apiKey: 'k', httpClient: http });
    const r = await p.complete({
      model: 'gpt-5',
      messages: [{ role: 'user', content: 'hi' }],
    });
    expect(r.content).toBe('hi');
    expect(r.usage?.inputTokens).toBe(7);
    const headers = http.calls[0]?.headers;
    expect(headers?.authorization).toBe('Bearer k');
  });

  it('includes organization header when set', async () => {
    const http = new InMemoryHttpClient([
      {
        status: 200,
        headers: {},
        body: {
          choices: [{ message: { content: 'ok', role: 'assistant' }, finish_reason: 'stop' }],
        },
      },
    ]);
    const p = new OpenAIProvider({ apiKey: 'k', httpClient: http, organization: 'org-1' });
    await p.complete({ model: 'gpt-5', messages: [] });
    expect(http.calls[0]?.headers?.['OpenAI-Organization']).toBe('org-1');
  });

  it('normalizes finish reasons', async () => {
    for (const [input, expected] of [
      ['stop', 'stop'],
      ['length', 'length'],
      ['tool_calls', 'tool_calls'],
    ] as const) {
      const http = new InMemoryHttpClient([
        {
          status: 200,
          headers: {},
          body: {
            choices: [{ message: { content: 'x', role: 'assistant' }, finish_reason: input }],
          },
        },
      ]);
      const p = new OpenAIProvider({ apiKey: 'k', httpClient: http });
      const r = await p.complete({ model: 'gpt-5', messages: [] });
      expect(r.finishReason).toBe(expected);
    }
  });

  it('throws on 4xx/5xx responses', async () => {
    const http = new InMemoryHttpClient([
      { status: 429, headers: {}, body: { error: 'rate limit' } },
    ]);
    const p = new OpenAIProvider({ apiKey: 'k', httpClient: http });
    await expect(p.complete({ model: 'gpt-5', messages: [] })).rejects.toThrow(/429/);
  });

  it('throws on empty choices', async () => {
    const http = new InMemoryHttpClient([{ status: 200, headers: {}, body: { choices: [] } }]);
    const p = new OpenAIProvider({ apiKey: 'k', httpClient: http });
    await expect(p.complete({ model: 'gpt-5', messages: [] })).rejects.toThrow(/no choices/);
  });
});
