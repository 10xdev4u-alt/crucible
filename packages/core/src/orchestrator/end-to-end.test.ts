/**
 * End-to-end integration test for the orchestrator.
 *
 * Spins up a mock provider, registers multiple agents, and verifies:
 * - parallel execution
 * - finding deduplication
 * - consensus scoring
 * - error handling
 * - constraint filtering
 * - agent timing
 */
import { describe, expect, it } from 'vitest';
import { InMemoryHttpClient } from '../providers/http.js';
import { OpenAICompatibleProvider } from '../providers/openai-compatible.js';
import { AgentRegistry } from '../registry/agent-registry.js';
import type { Agent, AgentInfo, AgentInput, AgentOutput } from '../types/agent.js';
import type { Finding } from '../types/finding.js';
import type { ReviewRequest } from '../types/review-request.js';
import { Orchestrator } from './orchestrator.js';

const baseInfo = (id: string): AgentInfo => ({
  id,
  name: id,
  version: '0.0.0',
  description: id,
  categories: [],
  capabilities: [],
});

const mkFinding = (overrides: Partial<Finding>): Finding => ({
  id: `${overrides.agentId}-f${Math.random().toString(36).slice(2, 8)}`,
  agentId: 'a',
  category: 'style',
  severity: 'minor',
  title: 't',
  message: 'm',
  confidence: 0.8,
  createdAt: '2026-06-20T00:00:00Z',
  ...overrides,
});

const mkAgent = (
  id: string,
  findings: Finding[],
  options: { delayMs?: number; throw?: boolean } = {},
): Agent => ({
  info: () => baseInfo(id),
  review: async (_input: AgentInput): Promise<AgentOutput> => {
    if (options.delayMs) await new Promise((r) => setTimeout(r, options.delayMs));
    if (options.throw) throw new Error(`${id} failed`);
    return {
      agentId: id,
      findings: findings.map((f) => ({ ...f, agentId: id })),
      durationMs: options.delayMs ?? 0,
    };
  },
});

const baseRequest = (overrides: Partial<ReviewRequest> = {}): ReviewRequest => ({
  id: 'r1',
  target: { kind: 'files', paths: ['a.ts'] },
  requestedAt: '2026-06-20T00:00:00Z',
  ...overrides,
});

describe('orchestrator end-to-end', () => {
  it('runs multiple agents and aggregates findings', async () => {
    const reg = new AgentRegistry();
    reg.registerAll([
      mkAgent('a', [mkFinding({ agentId: 'a', id: 'a1', location: { file: 'a.ts', line: 1 } })]),
      mkAgent('b', [mkFinding({ agentId: 'b', id: 'b1', location: { file: 'a.ts', line: 2 } })]),
      mkAgent('c', [mkFinding({ agentId: 'c', id: 'c1', location: { file: 'a.ts', line: 3 } })]),
    ]);
    const orch = new Orchestrator(reg, { parallelism: 3, timeoutMs: 5000, retries: 0 });
    const result = await orch.review(baseRequest(), {
      request: null as never,
      project: { root: '/tmp' },
      env: {},
    });
    expect(result.findings).toHaveLength(3);
    expect(result.agentStats).toHaveLength(3);
    expect(result.errors).toEqual([]);
  });

  it('deduplicates findings from multiple agents at the same location', async () => {
    const reg = new AgentRegistry();
    reg.registerAll([
      mkAgent('a', [
        mkFinding({ agentId: 'a', id: 'a1', location: { file: 'x.ts', line: 5 }, ruleId: 'r1' }),
      ]),
      mkAgent('b', [
        mkFinding({ agentId: 'b', id: 'b1', location: { file: 'x.ts', line: 5 }, ruleId: 'r1' }),
      ]),
      mkAgent('c', [
        mkFinding({ agentId: 'c', id: 'c1', location: { file: 'x.ts', line: 5 }, ruleId: 'r1' }),
      ]),
    ]);
    const orch = new Orchestrator(reg);
    const result = await orch.review(baseRequest(), {
      request: null as never,
      project: { root: '/tmp' },
      env: {},
    });
    expect(result.findings).toHaveLength(1);
    expect(result.consensusScore).toBeGreaterThan(0);
  });

  it('continues when individual agents fail', async () => {
    const reg = new AgentRegistry();
    reg.registerAll([
      mkAgent('good', [mkFinding({ agentId: 'good', id: 'g1' })]),
      mkAgent('bad1', [], { throw: true }),
      mkAgent('bad2', [], { throw: true }),
    ]);
    const orch = new Orchestrator(reg, { retries: 0 });
    const result = await orch.review(baseRequest(), {
      request: null as never,
      project: { root: '/tmp' },
      env: {},
    });
    expect(result.findings).toHaveLength(1);
    expect(result.errors.length).toBe(2);
    const bad = result.agentStats.filter((s) => s.errored);
    expect(bad).toHaveLength(2);
  });

  it('retries failed agents when retries > 0', async () => {
    let attempts = 0;
    const flaky: Agent = {
      info: () => baseInfo('flaky'),
      review: async () => {
        attempts += 1;
        if (attempts < 2) throw new Error('transient');
        return {
          agentId: 'flaky',
          findings: [mkFinding({ agentId: 'flaky', id: 'f1' })],
          durationMs: 0,
        };
      },
    };
    const reg = new AgentRegistry();
    reg.register(flaky);
    const orch = new Orchestrator(reg, { retries: 2 });
    const result = await orch.review(baseRequest(), {
      request: null as never,
      project: { root: '/tmp' },
      env: {},
    });
    expect(attempts).toBe(2);
    expect(result.findings).toHaveLength(1);
  });

  it('respects agentIds constraint', async () => {
    const reg = new AgentRegistry();
    reg.registerAll([
      mkAgent('a', [mkFinding({ agentId: 'a', id: 'a1' })]),
      mkAgent('b', [mkFinding({ agentId: 'b', id: 'b1' })]),
    ]);
    const orch = new Orchestrator(reg);
    const result = await orch.review(baseRequest({ constraints: { agentIds: ['a'] } }), {
      request: null as never,
      project: { root: '/tmp' },
      env: {},
    });
    expect(result.agentStats).toHaveLength(1);
    expect(result.agentStats[0]?.agentId).toBe('a');
  });

  it('respects severity filter', async () => {
    const reg = new AgentRegistry();
    reg.register(
      mkAgent('a', [
        mkFinding({
          agentId: 'a',
          id: '1',
          severity: 'critical',
          location: { file: 'a.ts', line: 1 },
        }),
        mkFinding({ agentId: 'a', id: '2', severity: 'info', location: { file: 'a.ts', line: 2 } }),
        mkFinding({
          agentId: 'a',
          id: '3',
          severity: 'blocker',
          location: { file: 'a.ts', line: 3 },
        }),
      ]),
    );
    const orch = new Orchestrator(reg);
    const result = await orch.review(
      baseRequest({ constraints: { severities: ['blocker', 'critical'] } }),
      { request: null as never, project: { root: '/tmp' }, env: {} },
    );
    const sevs = result.findings.map((f) => f.severity).sort();
    expect(sevs).toContain('blocker');
    expect(sevs).toContain('critical');
    expect(sevs).not.toContain('info');
  });

  it('runs agents in parallel', async () => {
    const reg = new AgentRegistry();
    for (let i = 0; i < 4; i++) {
      reg.register(mkAgent(`a${i}`, [], { delayMs: 100 }));
    }
    const orch = new Orchestrator(reg, { parallelism: 4 });
    const start = Date.now();
    await orch.review(baseRequest(), {
      request: null as never,
      project: { root: '/tmp' },
      env: {},
    });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(250); // 4 agents × 100ms / 4 parallel ≈ 100ms
  });

  it('integrates with a real provider via the OpenAI-compatible interface', async () => {
    const http = new InMemoryHttpClient([
      {
        status: 200,
        headers: {},
        body: {
          choices: [
            {
              message: {
                role: 'assistant',
                content: '### Test [major]\n**File:** a.ts:1\n**Message:** x',
              },
              finish_reason: 'stop',
            },
          ],
          usage: { prompt_tokens: 10, completion_tokens: 5 },
        },
      },
    ]);
    const provider = new OpenAICompatibleProvider({
      id: 'mock',
      name: 'mock',
      baseUrl: 'https://example.com/v1',
      apiKey: 'k',
      models: [{ id: 'm1' }],
      httpClient: http,
    });
    expect(provider.info().id).toBe('mock');
    const r = await provider.complete({ model: 'm1', messages: [] });
    expect(r.content).toContain('Test');
  });
});
