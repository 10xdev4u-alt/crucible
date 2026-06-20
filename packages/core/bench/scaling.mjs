/* eslint-disable no-console */
/**
 * A more thorough benchmark that tests with multiple agent counts.
 */

import { Orchestrator } from '../dist/orchestrator/orchestrator.js';
import { AgentRegistry } from '../dist/registry/agent-registry.js';

const buildFakeAgent = (id, delayMs, findingCount) => ({
  info: () => ({
    id,
    name: id,
    version: '0.0.0',
    description: `fake ${id}`,
    categories: [],
    capabilities: [],
  }),
  review: async () => {
    await new Promise((r) => setTimeout(r, delayMs));
    return {
      agentId: id,
      findings: Array.from({ length: findingCount }, (_, i) => ({
        id: `${id}-${i}`,
        agentId: id,
        category: 'style',
        severity: 'minor',
        title: `f${i}`,
        message: 'm',
        location: { file: `src/f${i}.ts`, line: 1 },
        confidence: 0.5,
        createdAt: new Date().toISOString(),
      })),
      durationMs: delayMs,
    };
  },
});

const runCase = async (agentCount, parallelism, fileCount = 20) => {
  const reg = new AgentRegistry();
  for (let i = 0; i < agentCount; i++) {
    reg.register(buildFakeAgent(`a${i}`, 50, 3));
  }
  const orch = new Orchestrator(reg, { parallelism, timeoutMs: 30_000, retries: 0 });
  const files = Array.from({ length: fileCount }, (_, i) => ({
    path: `src/file${i}.ts`,
    kind: 'modified',
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
        lines: [{ kind: 'add', content: 'x', newLineNumber: 1 }],
      },
    ],
  }));
  const start = Date.now();
  await orch.review(
    {
      id: 'b',
      target: {
        kind: 'diff',
        change: { base: 'a', head: 'b', files, totalAdditions: fileCount, totalDeletions: 0 },
      },
      requestedAt: new Date().toISOString(),
    },
    { request: null, project: { root: '/tmp' }, env: {} },
  );
  return Date.now() - start;
};

const main = async () => {
  console.log('Crucible benchmark — scaling');
  console.log('');
  console.log('agents  parallelism  elapsed  speedup');
  console.log('------  -----------  -------  -------');

  for (const agentCount of [2, 4, 8, 16, 32]) {
    for (const parallelism of [1, 2, 4, 8]) {
      if (parallelism > agentCount) continue;
      const elapsed = await runCase(agentCount, parallelism);
      const ideal = 50; // 50ms per agent
      const serial = agentCount * ideal;
      const speedup = (serial / elapsed).toFixed(2);
      console.log(
        `${String(agentCount).padStart(6)}  ${String(parallelism).padStart(11)}  ${String(`${elapsed}ms`).padStart(7)}  ${speedup}x`,
      );
    }
  }
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
