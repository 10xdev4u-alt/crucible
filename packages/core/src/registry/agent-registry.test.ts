import { describe, expect, it, vi } from 'vitest';
import type { Agent, AgentInfo, AgentInput } from '../types/agent.js';
import { AgentRegistry } from './agent-registry.js';

const makeAgent = (id: string, findings = 0): Agent => {
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
    review: vi.fn(async (_input: AgentInput) => ({
      agentId: id,
      findings: Array.from({ length: findings }, (_, i) => ({
        id: `${id}-f${i}`,
        agentId: id,
        category: 'style' as const,
        severity: 'minor' as const,
        title: `f${i}`,
        message: 'm',
        confidence: 0.5,
        createdAt: '2026-06-20T00:00:00Z',
      })),
      durationMs: 1,
    })),
  };
};

describe('AgentRegistry', () => {
  it('registers and retrieves an agent', () => {
    const r = new AgentRegistry();
    const a = makeAgent('x');
    r.register(a);
    expect(r.get('x')).toBe(a);
  });

  it('returns true on unregister for a known id', () => {
    const r = new AgentRegistry();
    r.register(makeAgent('x'));
    expect(r.unregister('x')).toBe(true);
  });

  it('returns false on unregister for an unknown id', () => {
    const r = new AgentRegistry();
    expect(r.unregister('x')).toBe(false);
  });

  it('overwrites when re-registering the same id', () => {
    const r = new AgentRegistry();
    const a = makeAgent('x');
    const b = makeAgent('x');
    r.register(a);
    r.register(b);
    expect(r.get('x')).toBe(b);
    expect(r.size()).toBe(1);
  });

  it('lists ids and resolves by ids', () => {
    const r = new AgentRegistry();
    r.registerAll([makeAgent('a'), makeAgent('b'), makeAgent('c')]);
    expect(r.ids().sort()).toEqual(['a', 'b', 'c']);
    expect(r.resolve(['a', 'c']).map((a2) => a2.info().id)).toEqual(['a', 'c']);
    expect(r.resolve(['a', 'missing'])).toHaveLength(1);
  });

  it('returns infos for all agents', () => {
    const r = new AgentRegistry();
    r.registerAll([makeAgent('a'), makeAgent('b')]);
    expect(
      r
        .infos()
        .map((i) => i.id)
        .sort(),
    ).toEqual(['a', 'b']);
  });

  it('runs all agents and collects their output', async () => {
    const r = new AgentRegistry();
    r.registerAll([makeAgent('a', 2), makeAgent('b', 1)]);
    const input: AgentInput = {
      context: {
        request: {
          id: 'r1',
          target: { kind: 'files', paths: [] },
          requestedAt: '2026-06-20T00:00:00Z',
        },
        project: { root: '/tmp' },
        env: {},
      },
    };
    const out = await r.runAll(input);
    expect(out).toHaveLength(2);
    const byId = Object.fromEntries(out.map((o) => [o.agentId, o.findings.length]));
    expect(byId.a).toBe(2);
    expect(byId.b).toBe(1);
  });

  it('continues running other agents when one throws', async () => {
    const r = new AgentRegistry();
    const good = makeAgent('good', 1);
    const bad: Agent = {
      info: () => ({
        id: 'bad',
        name: 'bad',
        version: '0.0.0',
        description: 'bad',
        categories: [],
        capabilities: [],
      }),
      review: async () => {
        throw new Error('boom');
      },
    };
    r.registerAll([good, bad]);
    const input: AgentInput = {
      context: {
        request: {
          id: 'r1',
          target: { kind: 'files', paths: [] },
          requestedAt: '2026-06-20T00:00:00Z',
        },
        project: { root: '/tmp' },
        env: {},
      },
    };
    const out = await r.runAll(input);
    expect(out).toHaveLength(2);
    expect(out.find((o) => o.agentId === 'bad')?.findings).toEqual([]);
  });
});
