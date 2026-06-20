import type { Agent, AgentInfo, AgentInput, AgentOutput } from '../types/agent.js';

export class AgentRegistry {
  private readonly agents = new Map<string, Agent>();

  /** Register an agent. Overwrites if an agent with the same id is already registered. */
  register(agent: Agent): void {
    this.agents.set(agent.info().id, agent);
  }

  /** Register many agents at once. */
  registerAll(agents: readonly Agent[]): void {
    for (const a of agents) this.register(a);
  }

  /** Remove an agent by id. Returns true if it was present. */
  unregister(id: string): boolean {
    return this.agents.delete(id);
  }

  /** Get an agent by id. */
  get(id: string): Agent | undefined {
    return this.agents.get(id);
  }

  /** Returns true if an agent with this id is registered. */
  has(id: string): boolean {
    return this.agents.has(id);
  }

  /** Returns the list of registered agent ids. */
  ids(): string[] {
    return [...this.agents.keys()];
  }

  /** Returns info for all registered agents. */
  infos(): AgentInfo[] {
    return [...this.agents.values()].map((a) => a.info());
  }

  /** Returns agents matching the given ids. Skips unknown ids. */
  resolve(ids: readonly string[]): Agent[] {
    const out: Agent[] = [];
    for (const id of ids) {
      const a = this.agents.get(id);
      if (a) out.push(a);
    }
    return out;
  }

  /** Returns the number of registered agents. */
  size(): number {
    return this.agents.size;
  }

  /** Clears the registry. */
  clear(): void {
    this.agents.clear();
  }

  /** Run all registered agents with the same input. */
  async runAll(input: AgentInput): Promise<AgentOutput[]> {
    const agents = [...this.agents.values()];
    return Promise.all(
      agents.map((a) =>
        a.review(input).catch(
          (err): AgentOutput => ({
            agentId: a.info().id,
            findings: [],
            durationMs: 0,
            metadata: { error: err instanceof Error ? err.message : String(err) },
          }),
        ),
      ),
    );
  }
}
