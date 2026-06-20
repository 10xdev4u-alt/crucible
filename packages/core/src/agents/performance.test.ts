import { describe, expect, it, vi } from 'vitest';
import type { Provider, ProviderRequest, ProviderResponse } from '../registry/provider-registry.js';
import { PerformanceAgent } from './performance.js';

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

describe('PerformanceAgent', () => {
  it('has the performance id', () => {
    const a = new PerformanceAgent(mockProvider(''));
    expect(a.info().id).toBe('performance');
    expect(a.info().categories).toContain('performance');
  });

  it('classifies findings as performance', async () => {
    const a = new PerformanceAgent(
      mockProvider('### O(n^2) loop [major]\n**File:** a.ts:1\n**Message:** nested loop'),
    );
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
    expect(out.findings[0]?.category).toBe('performance');
  });
});
