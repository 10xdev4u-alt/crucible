import { describe, expect, it } from 'vitest';
import { AgentRegistry } from '../registry/agent-registry.js';
import type { Agent, AgentInfo, AgentInput, AgentOutput } from '../types/agent.js';
import type { Finding } from '../types/finding.js';
import type { ReviewContext } from '../types/review-context.js';
import type { ReviewRequest } from '../types/review-request.js';
import { Orchestrator } from './orchestrator.js';

const mkFinding = (overrides: Partial<Finding>): Finding => ({
  id: 'x',
  agentId: 'a',
  category: 'style',
  severity: 'minor',
  title: 't',
  message: 'm',
  confidence: 0.5,
  createdAt: '2026-06-20T00:00:00Z',
  ...overrides,
});

const mkAgent = (
  id: string,
  findings: Finding[],
  opts: { delayMs?: number; fail?: boolean } = {},
): Agent => {
  const info: AgentInfo = {
    id,
    name: id,
    version: '0.0.0',
    description: `${id} agent`,
    categories: [],
    capabilities: [],
  };
  return {
    info: () => info,
    review: async (_input: AgentInput): Promise<AgentOutput> => {
      if (opts.delayMs) await new Promise((r) => setTimeout(r, opts.delayMs));
      if (opts.fail) throw new Error(`${id} boom`);
      return {
        agentId: id,
        findings: findings.map((f) => ({ ...f, agentId: id })),
        durationMs: 0,
      };
    },
  };
};

const baseRequest = (overrides: Partial<ReviewRequest> = {}): ReviewRequest => ({
  id: 'r1',
  target: { kind: 'files', paths: ['a.ts'] },
  requestedAt: '2026-06-20T00:00:00Z',
  ...overrides,
});

const baseContext = (overrides: Partial<ReviewContext> = {}): ReviewContext => ({
  request: baseRequest(),
  project: { root: '/tmp' },
  env: {},
  ...overrides,
});

describe('Orchestrator', () => {
  it('runs multiple agents and aggregates findings', async () => {
    const reg = new AgentRegistry();
    reg.registerAll([
      mkAgent('a', [mkFinding({ id: 'f1', location: { file: 'a.ts', line: 1 } })]),
      mkAgent('b', [mkFinding({ id: 'f2', location: { file: 'a.ts', line: 2 } })]),
    ]);
    const orch = new Orchestrator(reg, { parallelism: 2 });
    const result = await orch.review(baseRequest(), baseContext());
    expect(result.findings).toHaveLength(2);
    expect(result.agentStats).toHaveLength(2);
  });

  it('returns empty result when no agents are registered', async () => {
    const reg = new AgentRegistry();
    const orch = new Orchestrator(reg);
    const result = await orch.review(baseRequest(), baseContext());
    expect(result.findings).toEqual([]);
    expect(result.errors).toContain('no agents available');
  });

  it('records errors from failed agents but continues with others', async () => {
    const reg = new AgentRegistry();
    reg.registerAll([
      mkAgent('good', [mkFinding({ id: 'f1' })]),
      mkAgent('bad', [], { fail: true }),
    ]);
    const orch = new Orchestrator(reg, { parallelism: 2, retries: 0 });
    const result = await orch.review(baseRequest(), baseContext());
    expect(result.findings).toHaveLength(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('bad');
    const bad = result.agentStats.find((s) => s.agentId === 'bad');
    expect(bad?.errored).toBe(true);
  });

  it('deduplicates overlapping findings', async () => {
    const reg = new AgentRegistry();
    const sameLocation = { file: 'a.ts', line: 1 };
    reg.registerAll([
      mkAgent('a', [mkFinding({ id: 'f1', location: sameLocation, ruleId: 'r1' })]),
      mkAgent('b', [mkFinding({ id: 'f2', location: sameLocation, ruleId: 'r1' })]),
    ]);
    const orch = new Orchestrator(reg);
    const result = await orch.review(baseRequest(), baseContext());
    expect(result.findings).toHaveLength(1);
  });

  it('filters by severity', async () => {
    const reg = new AgentRegistry();
    reg.register(
      mkAgent('a', [
        mkFinding({ id: 'f1', severity: 'major' }),
        mkFinding({ id: 'f2', severity: 'minor' }),
      ]),
    );
    const orch = new Orchestrator(reg);
    const result = await orch.review(
      baseRequest({ constraints: { severities: ['major', 'critical'] } }),
      baseContext(),
    );
    expect(result.findings.map((f) => f.id)).toEqual(['f1']);
  });

  it('filters by category', async () => {
    const reg = new AgentRegistry();
    reg.register(
      mkAgent('a', [
        mkFinding({ id: 'f1', category: 'security' }),
        mkFinding({ id: 'f2', category: 'style' }),
      ]),
    );
    const orch = new Orchestrator(reg);
    const result = await orch.review(
      baseRequest({ constraints: { categories: ['security'] } }),
      baseContext(),
    );
    expect(result.findings.map((f) => f.id)).toEqual(['f1']);
  });

  it('filters by excluded paths', async () => {
    const reg = new AgentRegistry();
    reg.register(
      mkAgent('a', [
        mkFinding({ id: 'f1', location: { file: 'src/a.ts', line: 1 } }),
        mkFinding({ id: 'f2', location: { file: 'dist/a.ts', line: 1 } }),
      ]),
    );
    const orch = new Orchestrator(reg);
    const result = await orch.review(
      baseRequest({ constraints: { excludePaths: ['dist'] } }),
      baseContext(),
    );
    expect(result.findings.map((f) => f.id)).toEqual(['f1']);
  });

  it('honors maxFindings', async () => {
    const reg = new AgentRegistry();
    const findings = Array.from({ length: 10 }, (_, i) =>
      mkFinding({ id: `f${i}`, location: { file: `f${i}.ts`, line: 1 } }),
    );
    reg.register(mkAgent('a', findings));
    const orch = new Orchestrator(reg);
    const result = await orch.review(
      baseRequest({ constraints: { maxFindings: 3 } }),
      baseContext(),
    );
    expect(result.findings).toHaveLength(3);
  });

  it('retries on agent failure when retries > 0', async () => {
    let attempts = 0;
    const flaky: Agent = {
      info: () => ({
        id: 'flaky',
        name: 'flaky',
        version: '0.0.0',
        description: 'flaky',
        categories: [],
        capabilities: [],
      }),
      review: async () => {
        attempts += 1;
        if (attempts < 2) throw new Error('transient');
        return { agentId: 'flaky', findings: [mkFinding({ id: 'f1' })], durationMs: 0 };
      },
    };
    const reg = new AgentRegistry();
    reg.register(flaky);
    const orch = new Orchestrator(reg, { retries: 2 });
    const result = await orch.review(baseRequest(), baseContext());
    expect(attempts).toBe(2);
    expect(result.findings).toHaveLength(1);
  });

  it('only runs agents in the agentIds constraint', async () => {
    const reg = new AgentRegistry();
    reg.registerAll([
      mkAgent('a', [mkFinding({ id: 'f1' })]),
      mkAgent('b', [mkFinding({ id: 'f2' })]),
    ]);
    const orch = new Orchestrator(reg);
    const result = await orch.review(
      baseRequest({ constraints: { agentIds: ['a'] } }),
      baseContext(),
    );
    expect(result.agentStats).toHaveLength(1);
    expect(result.agentStats[0]?.agentId).toBe('a');
  });

  it('computes a consensus score', async () => {
    const reg = new AgentRegistry();
    reg.register(mkAgent('a', [mkFinding({ id: 'f1', severity: 'major', confidence: 1 })]));
    const orch = new Orchestrator(reg);
    const result = await orch.review(baseRequest(), baseContext());
    expect(result.consensusScore).toBeGreaterThan(0);
  });

  it('records durationMs', async () => {
    const reg = new AgentRegistry();
    reg.register(mkAgent('a', [], { delayMs: 10 }));
    const orch = new Orchestrator(reg);
    const result = await orch.review(baseRequest(), baseContext());
    expect(result.durationMs).toBeGreaterThanOrEqual(10);
  });
});
