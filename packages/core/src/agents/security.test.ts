import { describe, expect, it, vi } from 'vitest';
import type { Provider, ProviderRequest, ProviderResponse } from '../registry/provider-registry.js';
import { SecurityAgent } from './security.js';

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

const baseInput = () => ({
  context: {
    request: {
      id: 'r1',
      target: { kind: 'files' as const, paths: [] },
      requestedAt: '2026-06-20T00:00:00Z',
    },
    project: { root: '/tmp' },
    env: {},
    changeSet: {
      base: 'a',
      head: 'b',
      files: [
        {
          path: 'src/auth.ts',
          kind: 'modified' as const,
          isBinary: false,
          additions: 1,
          deletions: 0,
          hunks: [
            {
              oldStart: 1,
              oldLines: 1,
              newStart: 1,
              newLines: 1,
              header: '@@ -1 +1 @@',
              lines: [
                {
                  kind: 'add' as const,
                  content: 'const token = req.query.token;',
                  newLineNumber: 1,
                },
              ],
            },
          ],
        },
      ],
      totalAdditions: 1,
      totalDeletions: 0,
    },
  },
});

describe('SecurityAgent', () => {
  it('returns info with the security id', () => {
    const a = new SecurityAgent(mockProvider(''));
    expect(a.info().id).toBe('security');
    expect(a.info().categories).toContain('security');
  });

  it('parses findings from the LLM response', async () => {
    const response = `### Insecure token in query string [critical]
**File:** src/auth.ts:1
**Rule:** no-token-in-query
**Message:** JWT tokens should not be passed via query string.
`;
    const a = new SecurityAgent(mockProvider(response));
    const out = await a.review(baseInput());
    expect(out.findings).toHaveLength(1);
    expect(out.findings[0]?.severity).toBe('critical');
    expect(out.findings[0]?.category).toBe('security');
    expect(out.findings[0]?.location?.line).toBe(1);
  });

  it('returns no findings for empty content', async () => {
    const a = new SecurityAgent(mockProvider(''));
    const out = await a.review(baseInput());
    expect(out.findings).toEqual([]);
  });

  it('sends the right system prompt to the provider', async () => {
    const provider = mockProvider('');
    const a = new SecurityAgent(provider);
    await a.review(baseInput());
    const call = (provider.complete as ReturnType<typeof vi.fn>).mock
      .calls[0]?.[0] as ProviderRequest;
    expect(call.systemPrompt).toContain('Security');
  });
});
