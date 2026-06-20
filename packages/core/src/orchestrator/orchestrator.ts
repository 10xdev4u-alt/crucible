import type { AgentRegistry } from '../registry/agent-registry.js';
import type { Agent, AgentOutput } from '../types/agent.js';
import type { Finding } from '../types/finding.js';
import type { ReviewContext } from '../types/review-context.js';
import type { ReviewRequest } from '../types/review-request.js';
import type { AgentStats, ReviewResult } from '../types/review-result.js';
import { dedupeFindings } from './dedup.js';
import { runParallel } from './parallel.js';
import { reviewScore } from './scorer.js';

/** Options for the orchestrator. */
export interface OrchestratorOptions {
  parallelism: number;
  timeoutMs: number;
  retries: number;
}

/** Default options. */
export const DEFAULT_OPTIONS: OrchestratorOptions = {
  parallelism: 4,
  timeoutMs: 60_000,
  retries: 1,
};

/** The main orchestrator that runs multiple review agents in parallel. */
export class Orchestrator {
  private readonly agents: AgentRegistry;
  private readonly options: OrchestratorOptions;

  constructor(agents: AgentRegistry, options: Partial<OrchestratorOptions> = {}) {
    this.agents = agents;
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /** Run a review. Returns a result with all findings, consensus, and per-agent stats. */
  async review(request: ReviewRequest, context: ReviewContext): Promise<ReviewResult> {
    const startedAt = new Date().toISOString();
    const startMs = Date.now();
    const agents = this.agents.resolve(request.constraints?.agentIds ?? this.agents.ids());
    if (agents.length === 0) {
      return {
        id: cryptoId(),
        requestId: request.id,
        findings: [],
        consensusScore: 0,
        startedAt,
        finishedAt: new Date().toISOString(),
        durationMs: Date.now() - startMs,
        agentStats: [],
        errors: ['no agents available'],
      };
    }

    const stats: AgentStats[] = [];
    const outputs = await runParallel(
      agents.map((a) => () => this.runOne(a, request, context)),
      {
        parallelism: this.options.parallelism,
        timeoutMs: this.options.timeoutMs,
      },
    );

    const allFindings: Finding[] = [];
    const errors: string[] = [];
    for (const r of outputs) {
      const agent = agents[r.index];
      if (!agent) continue;
      if (r.ok && r.value) {
        allFindings.push(...r.value.findings);
        if (r.value.error) {
          errors.push(`${agent.info().id}: ${r.value.error}`);
          stats.push({
            agentId: agent.info().id,
            startedAt: r.value.startedAt,
            finishedAt: r.value.finishedAt,
            durationMs: r.value.durationMs,
            findingsCount: 0,
            errored: true,
            errorMessage: r.value.error,
          });
        } else {
          stats.push({
            agentId: agent.info().id,
            startedAt: r.value.startedAt,
            finishedAt: r.value.finishedAt,
            durationMs: r.value.durationMs,
            findingsCount: r.value.findings.length,
            tokensUsed: r.value.tokensUsed,
            errored: false,
          });
        }
      } else {
        const err = r.error;
        const msg = err?.message ?? 'unknown';
        errors.push(`${agent.info().id}: ${msg}`);
        stats.push({
          agentId: agent.info().id,
          startedAt: new Date(startMs + r.durationMs).toISOString(),
          finishedAt: new Date(startMs + r.durationMs).toISOString(),
          durationMs: r.durationMs,
          findingsCount: 0,
          errored: true,
          errorMessage: msg,
        });
      }
    }

    const deduped = dedupeFindings(allFindings);
    const filtered = applyConstraints(deduped, request.constraints);

    return {
      id: cryptoId(),
      requestId: request.id,
      findings: filtered,
      consensusScore: reviewScore(filtered),
      startedAt,
      finishedAt: new Date().toISOString(),
      durationMs: Date.now() - startMs,
      agentStats: stats,
      errors,
    };
  }

  private async runOne(
    agent: Agent,
    _request: ReviewRequest,
    context: ReviewContext,
  ): Promise<AgentOutput & { startedAt: string; finishedAt: string; error?: string }> {
    const startedAt = new Date().toISOString();
    let lastErr: unknown;
    for (let attempt = 0; attempt <= this.options.retries; attempt++) {
      try {
        const out = await agent.review({ context });
        return {
          ...out,
          startedAt,
          finishedAt: new Date().toISOString(),
        };
      } catch (err) {
        lastErr = err;
        if (attempt === this.options.retries) break;
      }
    }
    return {
      agentId: agent.info().id,
      findings: [],
      durationMs: 0,
      startedAt,
      finishedAt: new Date().toISOString(),
      error: lastErr instanceof Error ? lastErr.message : String(lastErr),
    };
  }
}

function applyConstraints(
  findings: Finding[],
  constraints: ReviewRequest['constraints'],
): Finding[] {
  if (!constraints) return findings;
  let out = findings;
  if (constraints.severities && constraints.severities.length > 0) {
    const allowed = new Set(constraints.severities);
    out = out.filter((f) => allowed.has(f.severity));
  }
  if (constraints.categories && constraints.categories.length > 0) {
    const allowed = new Set(constraints.categories);
    out = out.filter((f) => allowed.has(f.category));
  }
  if (constraints.excludePaths && constraints.excludePaths.length > 0) {
    out = out.filter((f) => {
      const path = f.location?.file;
      if (!path) return true;
      return !constraints.excludePaths?.some((p) => path.startsWith(p));
    });
  }
  if (constraints.includePaths && constraints.includePaths.length > 0) {
    out = out.filter((f) => {
      const path = f.location?.file;
      if (!path) return true;
      return constraints.includePaths?.some((p) => path.startsWith(p));
    });
  }
  if (constraints.maxFindings && out.length > constraints.maxFindings) {
    out = out.slice(0, constraints.maxFindings);
  }
  return out;
}

function cryptoId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
