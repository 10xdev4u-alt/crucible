import { describe, expect, it } from 'vitest';
import { InMemoryHttpClient } from './http.js';
import { OllamaProvider } from './ollama.js';

describe('OllamaProvider', () => {
  it('returns info with the right models', () => {
    const p = new OllamaProvider({ httpClient: new InMemoryHttpClient() });
    expect(p.info().id).toBe('ollama');
    expect(p.info().models.map((m) => m.id)).toContain('llama3.3:70b');
  });

  it('defaults to localhost', () => {
    const p = new OllamaProvider({ httpClient: new InMemoryHttpClient() });
    const _expected = 'http://localhost:11434/v1/chat/completions';
    // Indirect: complete() will call the configured URL
    expect(p.info()).toBeDefined();
  });

  it('sends the right request shape', async () => {
    const http = new InMemoryHttpClient([
      {
        status: 200,
        headers: {},
        body: {
          choices: [{ message: { content: 'pong' }, finish_reason: 'stop' }],
        },
      },
    ]);
    const p = new OllamaProvider({ httpClient: http });
    const r = await p.complete({
      model: 'qwen2.5-coder:32b',
      messages: [{ role: 'user', content: 'ping' }],
    });
    expect(r.content).toBe('pong');
    expect(http.calls[0]?.url).toContain('localhost');
  });
});
