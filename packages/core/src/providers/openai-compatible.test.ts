import { describe, expect, it } from 'vitest';
import { InMemoryHttpClient } from './http.js';
import { OpenAICompatibleProvider } from './openai-compatible.js';

describe('OpenAICompatibleProvider', () => {
  const models = [{ id: 'm1' }, { id: 'm2', displayName: 'M2' }];

  it('rejects empty id', () => {
    expect(() => new OpenAICompatibleProvider({ id: '', name: 'x', models })).toThrow();
  });

  it('rejects empty models', () => {
    expect(() => new OpenAICompatibleProvider({ id: 'x', name: 'X', models: [] })).toThrow();
  });

  it('builds info from configured models', () => {
    const p = new OpenAICompatibleProvider({
      id: 'tok',
      name: 'TokenRouter',
      models,
      httpClient: new InMemoryHttpClient(),
    });
    expect(p.info().id).toBe('tok');
    expect(p.info().models.map((m) => m.id)).toEqual(['m1', 'm2']);
    expect(p.info().models[1]?.displayName).toBe('M2');
  });

  it('sends the bearer token when apiKey is set', async () => {
    const http = new InMemoryHttpClient([
      {
        status: 200,
        headers: {},
        body: { choices: [{ message: { content: 'ok' }, finish_reason: 'stop' }] },
      },
    ]);
    const p = new OpenAICompatibleProvider({
      id: 'tok',
      name: 'TokenRouter',
      models,
      apiKey: 'secret',
      httpClient: http,
    });
    await p.complete({ model: 'm1', messages: [] });
    expect(http.calls[0]?.headers?.authorization).toBe('Bearer secret');
  });

  it('works without an apiKey', async () => {
    const http = new InMemoryHttpClient([
      {
        status: 200,
        headers: {},
        body: { choices: [{ message: { content: 'ok' }, finish_reason: 'stop' }] },
      },
    ]);
    const p = new OpenAICompatibleProvider({
      id: 'local',
      name: 'Local',
      models,
      httpClient: http,
    });
    await p.complete({ model: 'm1', messages: [] });
    expect(http.calls[0]?.headers?.authorization).toBeUndefined();
  });

  it('includes extra headers', async () => {
    const http = new InMemoryHttpClient([
      {
        status: 200,
        headers: {},
        body: { choices: [{ message: { content: 'ok' }, finish_reason: 'stop' }] },
      },
    ]);
    const p = new OpenAICompatibleProvider({
      id: 'tok',
      name: 'TokenRouter',
      models,
      apiKey: 'k',
      httpClient: http,
      headers: { 'x-custom': '1' },
    });
    await p.complete({ model: 'm1', messages: [] });
    expect(http.calls[0]?.headers?.['x-custom']).toBe('1');
  });
});
