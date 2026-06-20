import { describe, expect, it } from 'vitest';
import type { Agent, AgentInfo, AgentInput, AgentOutput } from '../types/agent.js';
import { defineAgentPlugin, definePlugin, discoverPlugins } from './loader.js';

const mkAgent = (id: string): Agent => {
  const info: AgentInfo = {
    id,
    name: id,
    version: '0.0.0',
    description: id,
    categories: [],
    capabilities: [],
  };
  return {
    info: () => info,
    review: async (_input: AgentInput): Promise<AgentOutput> => ({
      agentId: id,
      findings: [],
      durationMs: 0,
    }),
  };
};

describe('plugin loader', () => {
  it('returns empty when directory does not exist', async () => {
    const plugins = await discoverPlugins(`/tmp/crucible-nonexistent-${Date.now()}`);
    expect(plugins).toEqual([]);
  });

  it('definePlugin returns the definition', () => {
    const a = mkAgent('a');
    const p = definePlugin({ agents: [a] });
    expect(p.agents).toHaveLength(1);
  });

  it('defineAgentPlugin returns the agent', () => {
    const a = mkAgent('a');
    const p = defineAgentPlugin(a);
    expect(p.agent).toBe(a);
  });
});
