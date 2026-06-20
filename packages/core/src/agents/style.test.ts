import { describe, expect, it, vi } from 'vitest';
import type { Provider, ProviderRequest, ProviderResponse } from '../registry/provider-registry.js';
import { StyleAgent } from './style.js';

const mockProvider = (content: string): Provider => ({
  info: () => ({
    id: 'mock',
    name: 'mock',
    capabilities: {
      streaming: false,
      tools: false,
      vision: false,
      parallelToolCalls: false,
      systemPrompt: true,
      jsonMode: false,
    },
    models: [],
  }),
  complete: vi.fn(
    async (_req: ProviderRequest): Promise<ProviderResponse> => ({
      content,
      model: 'm',
      finishReason: 'stop',
    }),
  ),
});

describe('StyleAgent', () => {
  it('classifies findings as style', async () => {
    const a = new StyleAgent(mockProvider('### Bad name [minor]\n**Message:** x'));
    const out = await a.review({
      context: {
        request: {
          id: 'r1',
          target: { kind: 'files', paths: [] },
          requestedAt: '2026-06-20T00:00:00Z',
        },
        project: { root: '/tmp' },
        env: {},
      },
    });
    expect(out.findings[0]?.category).toBe('style');
  });
});
