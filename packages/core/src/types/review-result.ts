import type { Finding } from './finding.js';

/** Statistics about a single agent's contribution to a review. */
export interface AgentStats {
  agentId: string;
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  findingsCount: number;
  tokensUsed?: number;
  modelUsed?: string;
  errored: boolean;
  errorMessage?: string;
}

/** The aggregated result of a review. */
export interface ReviewResult {
  id: string;
  requestId: string;
  findings: Finding[];
  consensusScore: number;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  agentStats: AgentStats[];
  errors: string[];
}

/** Returns the count of findings grouped by severity. */
export function countBySeverity(findings: Finding[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const f of findings) {
    counts[f.severity] = (counts[f.severity] ?? 0) + 1;
  }
  return counts;
}

/** Returns the count of findings grouped by category. */
export function countByCategory(findings: Finding[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const f of findings) {
    counts[f.category] = (counts[f.category] ?? 0) + 1;
  }
  return counts;
}

/** Returns the count of findings grouped by agent id. */
export function countByAgent(findings: Finding[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const f of findings) {
    counts[f.agentId] = (counts[f.agentId] ?? 0) + 1;
  }
  return counts;
}
