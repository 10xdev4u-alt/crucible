import { describe, expect, it } from 'vitest';
import { AnthropicProvider } from './anthropic.js';
import { OpenAIProvider } from './openai.js';
import { OllamaProvider } from './ollama.js';
import { OpenAICompatibleProvider } from './openai-compatible.js';
import { GeminiProvider } from './gemini.js';
import { BedrockProvider } from './bedrock.js';
import { InMemoryHttpClient } from './http.js';

const make200 = (body: unknown) => ({ status: 200, headers: {}, body });

describe('Provider error handling', () => {
  it('Anthropic returns content for a 200 response', async () => {
    const p = new AnthropicProvider({
      apiKey: 'k',
      httpClient: new InMemoryHttpClient([make200({ content: [{ type: 'text', text: 'x' }], stop_reason: 'end_turn' } as never)]),
    });
    const r = await p.complete({ model: 'm', messages: [{ role: 'user', content: 'hi' }] });
    expect(r.content.length).toBeGreaterThan(0);
    expect(r.finishReason).toBe('stop');
  });

  it('OpenAI returns content for a 200 response', async () => {
    const p = new OpenAIProvider({
      apiKey: 'k',
      httpClient: new InMemoryHttpClient([make200({ choices: [{ message: { content: 'x', role: 'assistant' }, finish_reason: 'stop' }] } as never)]),
    });
    const r = await p.complete({ model: 'm', messages: [{ role: 'user', content: 'hi' }] });
    expect(r.content.length).toBeGreaterThan(0);
  });

  it('Gemini returns content for a 200 response', async () => {
    const p = new GeminiProvider({
      apiKey: 'k',
      httpClient: new InMemoryHttpClient([make200({ candidates: [{ content: { parts: [{ text: 'x' }] }, finishReason: 'STOP' }] } as never)]),
    });
    const r = await p.complete({ model: 'm', messages: [{ role: 'user', content: 'hi' }] });
    expect(r.content.length).toBeGreaterThan(0);
  });

  it('Ollama returns content for a 200 response', async () => {
    const p = new OllamaProvider({
      httpClient: new InMemoryHttpClient([make200({ choices: [{ message: { content: 'x' }, finish_reason: 'stop' }] } as never)]),
    });
    const r = await p.complete({ model: 'm', messages: [{ role: 'user', content: 'hi' }] });
    expect(r.content.length).toBeGreaterThan(0);
  });

  it('OpenAICompatible returns content for a 200 response', async () => {
    const p = new OpenAICompatibleProvider({
      id: 'x',
      name: 'x',
      models: [{ id: 'm' }],
      httpClient: new InMemoryHttpClient([make200({ choices: [{ message: { content: 'x' }, finish_reason: 'stop' }] } as never)]),
    });
    const r = await p.complete({ model: 'm', messages: [{ role: 'user', content: 'hi' }] });
    expect(r.content.length).toBeGreaterThan(0);
  });

  it('Bedrock (Anthropic) returns content for a 200 response', async () => {
    const p = new BedrockProvider({
      apiKey: 'k',
      httpClient: new InMemoryHttpClient([make200({ content: [{ type: 'text', text: 'x' }] } as never)]),
    });
    const r = await p.complete({ model: 'anthropic.claude-sonnet-4-5-20251022-v1:0', messages: [] });
    expect(r.content.length).toBeGreaterThan(0);
  });

  it('Bedrock (Amazon Nova) returns content for a 200 response', async () => {
    const p = new BedrockProvider({
      apiKey: 'k',
      httpClient: new InMemoryHttpClient([make200({ outputText: 'pong' } as never)]),
    });
    const r = await p.complete({ model: 'amazon.nova-pro-v1:0', messages: [] });
    expect(r.content).toBe('pong');
  });

  it('Bedrock (Meta Llama) returns content for a 200 response', async () => {
    const p = new BedrockProvider({
      apiKey: 'k',
      httpClient: new InMemoryHttpClient([make200({ generation: 'pong' } as never)]),
    });
    const r = await p.complete({ model: 'meta.llama3-3-70b-instruct-v1:0', messages: [] });
    expect(r.content).toBe('pong');
  });

  it('Bedrock throws on unsupported model', async () => {
    const p = new BedrockProvider({ apiKey: 'k', httpClient: new InMemoryHttpClient([]) });
    await expect(p.complete({ model: 'unknown.model-v1', messages: [] })).rejects.toThrow(/Unsupported Bedrock/);
  });

  it('Anthropic throws on 401', async () => {
    const p = new AnthropicProvider({
      apiKey: 'k',
      httpClient: new InMemoryHttpClient([{ status: 401, headers: {}, body: { error: 'unauth' } }]),
    });
    await expect(p.complete({ model: 'm', messages: [] })).rejects.toThrow(/401/);
  });

  it('Anthropic throws on 500', async () => {
    const p = new AnthropicProvider({
      apiKey: 'k',
      httpClient: new InMemoryHttpClient([{ status: 500, headers: {}, body: { error: 'fail' } }]),
    });
    await expect(p.complete({ model: 'm', messages: [] })).rejects.toThrow(/500/);
  });

  it('OpenAI throws on 429', async () => {
    const p = new OpenAIProvider({
      apiKey: 'k',
      httpClient: new InMemoryHttpClient([{ status: 429, headers: {}, body: { error: 'rate' } }]),
    });
    await expect(p.complete({ model: 'm', messages: [] })).rejects.toThrow(/429/);
  });

  it('Gemini throws on 400', async () => {
    const p = new GeminiProvider({
      apiKey: 'k',
      httpClient: new InMemoryHttpClient([{ status: 400, headers: {}, body: { error: 'bad' } }]),
    });
    await expect(p.complete({ model: 'm', messages: [] })).rejects.toThrow(/400/);
  });
});
