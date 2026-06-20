import { describe, expect, it } from 'vitest';
import { AnthropicProvider } from './anthropic.js';
import { InMemoryHttpClient } from './http.js';

describe('AnthropicProvider', () => {
  it('returns info for known models', () => {
    const p = new AnthropicProvider({ apiKey: 'k', httpClient: new InMemoryHttpClient() });
    const info = p.info();
    expect(info.id).toBe('anthropic');
    expect(info.models.map((m) => m.id)).toContain('claude-opus-4-5');
    expect(info.models.map((m) => m.id)).toContain('claude-sonnet-4-5');
  });

  it('throws when apiKey is missing', () => {
    expect(() => new AnthropicProvider({ apiKey: '' })).toThrow();
  });

  it('sends the right request shape to the API', async () => {
    const http = new InMemoryHttpClient([
      {
        status: 200,
        headers: {},
        body: {
          content: [{ type: 'text', text: 'hello' }],
          stop_reason: 'end_turn',
          usage: { input_tokens: 10, output_tokens: 5 },
        },
      },
    ]);
    const p = new AnthropicProvider({ apiKey: 'k', httpClient: http });
    const r = await p.complete({
      model: 'claude-sonnet-4-5',
      messages: [
        { role: 'system', content: 'be terse' },
        { role: 'user', content: 'hi' },
      ],
    });
    expect(r.content).toBe('hello');
    expect(r.finishReason).toBe('stop');
    expect(r.usage?.inputTokens).toBe(10);
    expect(http.calls).toHaveLength(1);
    const call = http.calls[0]!;
    expect(call.url).toContain('anthropic.com');
    expect(call.method).toBe('POST');
    expect(call.headers?.['x-api-key']).toBe('k');
    const body = call.body as { system?: string; messages: unknown[] };
    expect(body.system).toBe('be terse');
    expect(body.messages).toHaveLength(1);
  });

  it('normalizes finish reasons', async () => {
    const cases = [
      ['end_turn', 'stop'],
      ['max_tokens', 'length'],
      ['tool_use', 'tool_calls'],
      ['unknown', 'stop'],
    ] as const;
    for (const [input, expected] of cases) {
      const http = new InMemoryHttpClient([
        {
          status: 200,
          headers: {},
          body: {
            content: [{ type: 'text', text: 'x' }],
            stop_reason: input,
            usage: { input_tokens: 0, output_tokens: 0 },
          },
        },
      ]);
      const p = new AnthropicProvider({ apiKey: 'k', httpClient: http });
      const r = await p.complete({ model: 'claude-sonnet-4-5', messages: [] });
      expect(r.finishReason).toBe(expected);
    }
  });

  it('throws on 4xx/5xx responses', async () => {
    const http = new InMemoryHttpClient([
      { status: 401, headers: {}, body: { error: 'unauthorized' } },
    ]);
    const p = new AnthropicProvider({ apiKey: 'k', httpClient: http });
    await expect(p.complete({ model: 'claude-sonnet-4-5', messages: [] })).rejects.toThrow(/401/);
  });
});
