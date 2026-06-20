import { describe, expect, it } from 'vitest';
import { BedrockProvider } from './bedrock.js';
import { InMemoryHttpClient } from './http.js';

describe('BedrockProvider', () => {
  it('returns info for known models', () => {
    const p = new BedrockProvider({ apiKey: 'k', httpClient: new InMemoryHttpClient() });
    const info = p.info();
    expect(info.id).toBe('bedrock');
    expect(info.models.map((m) => m.id).some((id) => id.startsWith('anthropic.'))).toBe(true);
  });

  it('throws when apiKey is missing', () => {
    expect(() => new BedrockProvider({ apiKey: '' })).toThrow();
  });

  it('handles Anthropic models on Bedrock', async () => {
    const http = new InMemoryHttpClient([
      {
        status: 200,
        headers: {},
        body: {
          content: [{ type: 'text', text: 'hello' }],
          stopReason: 'end_turn',
        },
      },
    ]);
    const p = new BedrockProvider({ apiKey: 'k', httpClient: http });
    const r = await p.complete({
      model: 'anthropic.claude-sonnet-4-5-20251022-v1:0',
      messages: [{ role: 'user', content: 'hi' }],
    });
    expect(r.content).toBe('hello');
    expect(r.finishReason).toBe('stop');
  });

  it('handles Amazon Nova models', async () => {
    const http = new InMemoryHttpClient([
      {
        status: 200,
        headers: {},
        body: { outputText: 'pong' },
      },
    ]);
    const p = new BedrockProvider({ apiKey: 'k', httpClient: http });
    const r = await p.complete({
      model: 'amazon.nova-pro-v1:0',
      messages: [{ role: 'user', content: 'ping' }],
    });
    expect(r.content).toBe('pong');
  });

  it('handles Meta Llama models', async () => {
    const http = new InMemoryHttpClient([
      {
        status: 200,
        headers: {},
        body: { generation: 'pong' },
      },
    ]);
    const p = new BedrockProvider({ apiKey: 'k', httpClient: http });
    const r = await p.complete({
      model: 'meta.llama3-3-70b-instruct-v1:0',
      messages: [{ role: 'user', content: 'ping' }],
    });
    expect(r.content).toBe('pong');
  });

  it('throws on unsupported model', async () => {
    const p = new BedrockProvider({ apiKey: 'k', httpClient: new InMemoryHttpClient() });
    await expect(p.complete({ model: 'unknown.model-v1', messages: [] })).rejects.toThrow(
      /Unsupported Bedrock/,
    );
  });

  it('throws on 4xx/5xx', async () => {
    const http = new InMemoryHttpClient([{ status: 500, headers: {}, body: { error: 'fail' } }]);
    const p = new BedrockProvider({ apiKey: 'k', httpClient: http });
    await expect(
      p.complete({ model: 'anthropic.claude-sonnet-4-5-20251022-v1:0', messages: [] }),
    ).rejects.toThrow(/500/);
  });
});
