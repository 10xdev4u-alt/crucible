import { existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const TEMPLATE = JSON.stringify(
  {
    version: 1,
    project: { name: '', root: '.' },
    agents: [
      { id: 'security', weight: 2 },
      { id: 'performance', weight: 1.5 },
      { id: 'style', weight: 1 },
      { id: 'architecture', weight: 1.5 },
      { id: 'accessibility', weight: 1 },
      { id: 'dependency', weight: 1 },
      { id: 'test-coverage', weight: 1 },
      { id: 'api-contract', weight: 1.5 },
      { id: 'documentation', weight: 0.5 },
    ],
    providers: [{ id: 'anthropic', defaultModel: 'claude-sonnet-4-5' }],
    output: { format: 'text', destination: 'stdout', color: true, verbose: false },
    cache: { enabled: true, kind: 'memory', ttlSeconds: 3600 },
    runtime: { parallelism: 4, timeoutMs: 60_000, retries: 2 },
  },
  null,
  2,
);

export function cmdInit(flags: Record<string, string | boolean | string[]>): number {
  const target = resolve(process.cwd(), '.crucible.json');
  if (existsSync(target) && flags.force !== true) {
    console.error(`Config already exists: ${target}\nUse --force to overwrite.`);
    return 1;
  }
  writeFileSync(target, `${TEMPLATE}\n`, 'utf8');
  console.log(`Wrote ${target}`);
  console.log('Edit it to customize agents, providers, and output.');
  return 0;
}
