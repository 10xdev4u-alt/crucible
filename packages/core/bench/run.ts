/* eslint-disable no-console */
/**
 * A small benchmark for the Crucible orchestrator.
 *
 * Runs N fake agents against a synthetic ChangeSet, measures
 * throughput, and reports timing.
 *
 * Usage:
 *   pnpm --filter @crucible/core run bench
 *   # or
 *   tsx packages/core/bench/run.ts
 */
import { AgentRegistry } from '../src/registry/agent-registry.js';
import { Orchestrator } from '../src/orchestrator/orchestrator.js';
import type { Agent, AgentInfo, AgentInput, AgentOutput } from '../src/types/agent.js';
import type { Finding } from '../src/types/finding.js';
import type { ChangeSet } from '../src/types/file-diff.js';
import type { ReviewRequest } from '../src/types/review-request.js';

const buildFakeAgent = (id: string, delayMs: number, findingCount: number): Agent => {
  const info: AgentInfo = {
    id,
    name: id,
    version: '0.0.0',
    description: `fake ${id}`,
    categories: [],
    capabilities: [],
  };
  return {
    info: () => info,
    review: async (_input: AgentInput): Promise<AgentOutput> => {
      await new Promise((r) => setTimeout(r, delayMs));
      const findings: Finding[] = Array.from({ length: findingCount }, (_, i) => ({
        id: `${id}-${i}`,
        agentId: id,
        category: 'style' as const,
        severity: 'minor' as const,
        title: `f${i}`,
        message: 'm',
        location: { file: 'src/a.ts', line: i + 1 },
        confidence: 0.5,
        createdAt: new Date().toISOString(),
      }));
      return { agentId: id, findings, durationMs: delayMs };
    },
  };
};

const buildChangeSet = (fileCount: number): ChangeSet => ({
  base: 'a',
  head: 'b',
  files: Array.from({ length: fileCount }, (_, i) => ({
    path: `src/file${i}.ts`,
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
        lines: [{ kind: 'add' as const, content: 'x', newLineNumber: 1 }],
      },
    ],
  })),
  totalAdditions: fileCount,
  totalDeletions: 0,
});

const main = async () => {
  const AGENT_COUNT = 10;
  const AGENT_DELAY_MS = 50;
  const FINDINGS_PER_AGENT = 5;
  const FILE_COUNT = 20;
  const PARALLELISM = 4;
  const RETRIES = 1;

  const reg = new AgentRegistry();
  for (let i = 0; i < AGENT_COUNT; i++) {
    reg.register(buildFakeAgent(`bench-agent-${i}`, AGENT_DELAY_MS, FINDINGS_PER_AGENT));
  }

  const orch = new Orchestrator(reg, { parallelism: PARALLELISM, timeoutMs: 30_000, retries: RETRIES });
  const request: ReviewRequest = {
    id: 'bench',
    target: { kind: 'diff', change: buildChangeSet(FILE_COUNT) },
    requestedAt: new Date().toISOString(),
  };
  const ctx = { request, project: { root: '/tmp' }, env: {} };

  const start = Date.now();
  const result = await orch.review(request, ctx);
  const elapsed = Date.now() - start;

  console.log(`Crucible benchmark`);
  console.log(`  agents:      ${AGENT_COUNT}`);
  console.log(`  parallelism: ${PARALLELISM}`);
  console.log(`  agent delay: ${AGENT_DELAY_MS}ms`);
  console.log(`  findings:    ${FINDINGS_PER_AGENT}/agent`);
  console.log(`  files:       ${FILE_COUNT}`);
  console.log(`  elapsed:     ${elapsed}ms`);
  console.log(`  findings:    ${result.findings.length}`);
  console.log(`  score:       ${result.consensusScore.toFixed(2)}`);

  const expectedMin = Math.ceil(AGENT_COUNT / PARALLELISM) * AGENT_DELAY_MS;
  const speedup = (AGENT_COUNT * AGENT_DELAY_MS) / elapsed;
  console.log(`  theoretical min: ${expectedMin}ms`);
  console.log(`  speedup:         ${speedup.toFixed(2)}x`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
