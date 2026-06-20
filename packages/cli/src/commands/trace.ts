/** `crucible trace` — show timing and per-agent details for a review. */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getString } from '../argv.js';
import { cmdReview } from './review.js';

/** `crucible trace` — review with full timing/agent info. */
export async function cmdTrace(
  positionals: string[],
  flags: Record<string, string | boolean | string[]>,
): Promise<number> {
  const reviewFlags = { ...flags, format: 'json', quiet: true };
  const code = await cmdReview(positionals, reviewFlags);
  void code;
  const output = getString(flags, 'output', './crucible-result.json');
  const result = JSON.parse(readFileSync(resolve(process.cwd(), output), 'utf8')) as {
    id: string;
    durationMs: number;
    consensusScore: number;
    findings: Array<{ agentId: string; severity: string; title: string }>;
    agentStats: Array<{
      agentId: string;
      durationMs: number;
      findingsCount: number;
      tokensUsed?: number;
      errored: boolean;
      errorMessage?: string;
    }>;
    errors: string[];
  };

  console.log(`Crucible trace`);
  console.log(`  result:    ${result.id}`);
  console.log(`  total:     ${result.durationMs}ms`);
  console.log(`  score:     ${result.consensusScore.toFixed(2)}`);
  console.log(`  findings:  ${result.findings.length}`);
  console.log('');
  console.log(`Per-agent:`);
  for (const stat of result.agentStats) {
    const status = stat.errored ? '✗' : '✓';
    const tokens = stat.tokensUsed ? `, ${stat.tokensUsed} tokens` : '';
    console.log(
      `  ${status} ${stat.agentId.padEnd(20)} ${String(stat.durationMs).padStart(6)}ms (${stat.findingsCount} findings${tokens})`,
    );
    if (stat.errored && stat.errorMessage) {
      console.log(`     error: ${stat.errorMessage}`);
    }
  }
  if (result.errors.length > 0) {
    console.log('');
    console.log(`Errors:`);
    for (const e of result.errors) console.log(`  - ${e}`);
  }
  if (result.findings.length > 0) {
    console.log('');
    console.log(`Findings by agent:`);
    const byAgent = new Map<string, number>();
    for (const f of result.findings) {
      byAgent.set(f.agentId, (byAgent.get(f.agentId) ?? 0) + 1);
    }
    for (const [agent, n] of byAgent) {
      console.log(`  ${agent}: ${n}`);
    }
  }

  // Optionally write a flame graph SVG
  const svg = getString(flags, 'flame');
  if (svg) {
    writeFileSync(
      resolve(process.cwd(), svg),
      makeFlameGraph(result.agentStats, result.durationMs),
      'utf8',
    );
    console.log(`\nWrote flame graph: ${svg}`);
  }
  return 0;
}

const makeFlameGraph = (
  agents: Array<{ agentId: string; durationMs: number; errored: boolean }>,
  totalMs: number,
): string => {
  const width = 800;
  const height = 40 + agents.length * 24;
  const x0 = 20;
  const y0 = 20;
  const barWidth = width - 40;
  const agentHeight = 18;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
  svg += `<style>text{font-family:ui-sans-serif,system-ui,sans-serif;font-size:11px;fill:#111}.dark text{fill:#e6e8eb}</style>`;
  svg += `<rect x="0" y="0" width="${width}" height="${height}" fill="#fff" rx="6"/>`;
  for (let i = 0; i < agents.length; i++) {
    const agent = agents[i]!;
    const w = Math.max(2, (agent.durationMs / totalMs) * barWidth);
    const y = y0 + i * 24;
    const color = agent.errored ? '#b91c1c' : '#c2410c';
    svg += `<rect x="${x0}" y="${y}" width="${w}" height="${agentHeight}" fill="${color}" rx="3"/>`;
    svg += `<text x="${x0 + 6}" y="${y + 13}">${agent.agentId} (${agent.durationMs}ms)</text>`;
  }
  svg += '</svg>';
  return svg;
};
