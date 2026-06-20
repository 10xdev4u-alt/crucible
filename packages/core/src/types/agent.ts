import type { Finding } from './finding.js';
import type { ReviewContext } from './review-context.js';

/** Information about an agent. */
export interface AgentInfo {
  id: string;
  name: string;
  version: string;
  description: string;
  categories: string[];
  capabilities: string[];
}

/** Input to an agent's review. */
export interface AgentInput {
  context: ReviewContext;
  signal?: AbortSignal;
}

/** Output of an agent's review. */
export interface AgentOutput {
  agentId: string;
  findings: Finding[];
  tokensUsed?: number;
  durationMs: number;
  metadata?: Record<string, unknown>;
}

/** The contract every review agent implements. */
export interface Agent {
  info(): AgentInfo;
  review(input: AgentInput): Promise<AgentOutput>;
}
