import { describe, expect, it } from 'vitest';
import { AnthropicProvider } from './anthropic.js';
import { BedrockProvider } from './bedrock.js';
import { GeminiProvider } from './gemini.js';
import { InMemoryHttpClient } from './http.js';
import { OllamaProvider } from './ollama.js';
import { OpenAIProvider } from './openai.js';
import { OpenAICompatibleProvider } from './openai-compatible.js';

describe('Provider authentication', () => {
  it('Anthropic sends x-api-key', async () => {
    const http = new InMemoryHttpClient([
      {
        status: 200,
        headers: {},
        body: { content: [{ type: 'text', text: 'x' }], stop_reason: 'end_turn' },
      },
    ]);
    const p = new AnthropicProvider({ apiKey: 'sk-test', httpClient: http });
    await p.complete({ model: 'm', messages: [] });
    expect(http.calls[0]?.headers?.['x-api-key']).toBe('sk-test');
  });

  it('OpenAI sends Bearer token', async () => {
    const http = new InMemoryHttpClient([
      {
        status: 200,
        headers: {},
        body: {
          choices: [{ message: { content: 'x', role: 'assistant' }, finish_reason: 'stop' }],
        },
      },
    ]);
    const p = new OpenAIProvider({ apiKey: 'sk-test', httpClient: http });
    await p.complete({ model: 'm', messages: [] });
    expect(http.calls[0]?.headers?.authorization).toBe('Bearer sk-test');
  });

  it('OpenAI sends OpenAI-Organization header', async () => {
    const http = new InMemoryHttpClient([
      {
        status: 200,
        headers: {},
        body: {
          choices: [{ message: { content: 'x', role: 'assistant' }, finish_reason: 'stop' }],
        },
      },
    ]);
    const p = new OpenAIProvider({ apiKey: 'sk-test', organization: 'org-1', httpClient: http });
    await p.complete({ model: 'm', messages: [] });
    expect(http.calls[0]?.headers?.['OpenAI-Organization']).toBe('org-1');
  });

  it('Gemini sends key as query param', async () => {
    const http = new InMemoryHttpClient([
      {
        status: 200,
        headers: {},
        body: { candidates: [{ content: { parts: [{ text: 'x' }] }, finishReason: 'STOP' }] },
      },
    ]);
    const p = new GeminiProvider({ apiKey: 'gemini-key', httpClient: http });
    await p.complete({ model: 'gemini-pro', messages: [] });
    expect(http.calls[0]?.url).toContain('key=gemini-key');
  });

  it('Bedrock sends Bearer and x-amzn-region', async () => {
    const http = new InMemoryHttpClient([
      { status: 200, headers: {}, body: { content: [{ type: 'text', text: 'x' }] } },
    ]);
    const p = new BedrockProvider({ apiKey: 'aws-key', region: 'eu-west-1', httpClient: http });
    await p.complete({ model: 'anthropic.claude-sonnet-4-5-20251022-v1:0', messages: [] });
    expect(http.calls[0]?.headers?.authorization).toBe('Bearer aws-key');
    expect(http.calls[0]?.headers?.['x-amzn-region']).toBe('eu-west-1');
  });

  it('Ollama sends no auth', async () => {
    const http = new InMemoryHttpClient([
      {
        status: 200,
        headers: {},
        body: { choices: [{ message: { content: 'x' }, finish_reason: 'stop' }] },
      },
    ]);
    const p = new OllamaProvider({ httpClient: http });
    await p.complete({ model: 'm', messages: [] });
    expect(http.calls[0]?.headers?.authorization).toBeUndefined();
  });

  it('OpenAICompatible sends Bearer when apiKey is set', async () => {
    const http = new InMemoryHttpClient([
      {
        status: 200,
        headers: {},
        body: { choices: [{ message: { content: 'x' }, finish_reason: 'stop' }] },
      },
    ]);
    const p = new OpenAICompatibleProvider({
      id: 'x',
      name: 'x',
      models: [{ id: 'm' }],
      apiKey: 'k',
      httpClient: http,
    });
    await p.complete({ model: 'm', messages: [] });
    expect(http.calls[0]?.headers?.authorization).toBe('Bearer k');
  });

  it('OpenAICompatible sends no auth when apiKey is not set', async () => {
    const http = new InMemoryHttpClient([
      {
        status: 200,
        headers: {},
        body: { choices: [{ message: { content: 'x' }, finish_reason: 'stop' }] },
      },
    ]);
    const p = new OpenAICompatibleProvider({
      id: 'x',
      name: 'x',
      models: [{ id: 'm' }],
      httpClient: http,
    });
    await p.complete({ model: 'm', messages: [] });
    expect(http.calls[0]?.headers?.authorization).toBeUndefined();
  });
});
