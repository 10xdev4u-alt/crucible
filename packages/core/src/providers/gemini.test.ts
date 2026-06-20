import { describe, expect, it } from 'vitest';
import { GeminiProvider } from './gemini.js';
import { InMemoryHttpClient } from './http.js';

describe('GeminiProvider', () => {
  it('returns info for known models', () => {
    const p = new GeminiProvider({ apiKey: 'k', httpClient: new InMemoryHttpClient() });
    const info = p.info();
    expect(info.id).toBe('gemini');
    expect(info.models.map((m) => m.id)).toContain('gemini-2.5-pro');
    expect(info.models.map((m) => m.id)).toContain('gemini-2.5-flash');
  });

  it('throws when apiKey is missing', () => {
    expect(() => new GeminiProvider({ apiKey: '' })).toThrow();
  });

  it('sends the right request shape', async () => {
    const http = new InMemoryHttpClient([
      {
        status: 200,
        headers: {},
        body: {
          candidates: [
            {
              content: { parts: [{ text: 'hello' }] },
              finishReason: 'STOP',
            },
          ],
          usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5 },
        },
      },
    ]);
    const p = new GeminiProvider({ apiKey: 'k', httpClient: http });
    const r = await p.complete({
      model: 'gemini-2.5-flash',
      messages: [
        { role: 'system', content: 'be terse' },
        { role: 'user', content: 'hi' },
      ],
    });
    expect(r.content).toBe('hello');
    expect(r.finishReason).toBe('stop');
    expect(r.usage?.inputTokens).toBe(10);
    expect(http.calls[0]?.url).toContain('gemini-2.5-flash:generateContent');
    expect(http.calls[0]?.url).toContain('key=k');
    const body = http.calls[0]?.body as {
      systemInstruction?: { parts: Array<{ text: string }> };
      contents: unknown[];
    };
    expect(body.systemInstruction?.parts[0]?.text).toBe('be terse');
    expect(body.contents).toHaveLength(1);
  });

  it('normalizes finish reasons', async () => {
    for (const [input, expected] of [
      ['STOP', 'stop'],
      ['MAX_TOKENS', 'length'],
      ['TOOL_USE', 'tool_calls'],
    ] as const) {
      const http = new InMemoryHttpClient([
        {
          status: 200,
          headers: {},
          body: { candidates: [{ content: { parts: [{ text: 'x' }] }, finishReason: input }] },
        },
      ]);
      const p = new GeminiProvider({ apiKey: 'k', httpClient: http });
      const r = await p.complete({ model: 'gemini-2.5-flash', messages: [] });
      expect(r.finishReason).toBe(expected);
    }
  });

  it('throws on 4xx/5xx', async () => {
    const http = new InMemoryHttpClient([
      { status: 429, headers: {}, body: { error: 'rate limit' } },
    ]);
    const p = new GeminiProvider({ apiKey: 'k', httpClient: http });
    await expect(p.complete({ model: 'gemini-2.5-flash', messages: [] })).rejects.toThrow(/429/);
  });

  it('throws on empty candidates', async () => {
    const http = new InMemoryHttpClient([{ status: 200, headers: {}, body: { candidates: [] } }]);
    const p = new GeminiProvider({ apiKey: 'k', httpClient: http });
    await expect(p.complete({ model: 'gemini-2.5-flash', messages: [] })).rejects.toThrow(
      /no candidates/,
    );
  });
});
