/** `crucible watch` — continuously review on file changes. */
import { resolve } from 'node:path';
import { FileWatcher, type Format, getFormatter, Orchestrator } from '@crucible/core';
import { getList, getString } from '../argv.js';
import { cmdReview } from './review.js';

export async function cmdWatch(
  positionals: string[],
  flags: Record<string, string | boolean | string[]>,
): Promise<number> {
  const root = resolve(process.cwd(), positionals[0] ?? '.');
  const _include = getList(flags, 'include');
  const exclude = getList(flags, 'exclude');
  const format = getString(flags, 'format', 'text') as Format;
  const interval = Number.parseInt(getString(flags, 'interval', '1500'), 10);

  console.log(`crucible: watching ${root} for changes…`);
  console.log(`  Press Ctrl+C to stop`);

  const watcher = new FileWatcher(root, {
    intervalMs: interval,
    ignore: (p) => {
      if (p.includes('node_modules/')) return true;
      if (p.includes('.git/')) return true;
      if (p.includes('.crucible-cache/')) return true;
      if (p.includes('dist/')) return true;
      if (p.includes('build/')) return true;
      if (exclude.some((e) => p.includes(e))) return true;
      return false;
    },
  });

  let running = false;
  let pending: NodeJS.Timeout | null = null;
  const review = async () => {
    if (running) return;
    running = true;
    try {
      const result = await cmdReview(positionals, { ...flags, quiet: true, output: '' });
      void result;
      const fs = await import('node:fs');
      const output = getString(flags, 'output', './crucible-result.json');
      if (fs.existsSync(output)) {
        const data = JSON.parse(fs.readFileSync(output, 'utf8')) as {
          findings: unknown[];
          consensusScore: number;
          durationMs: number;
        };
        if (data.findings.length > 0) {
          console.clear();
          console.log(
            getFormatter(format, { color: true, verbose: true }).format({
              id: 'watch',
              requestId: 'watch',
              findings: data.findings as never,
              consensusScore: data.consensusScore,
              startedAt: new Date().toISOString(),
              finishedAt: new Date().toISOString(),
              durationMs: data.durationMs,
              agentStats: [],
              errors: [],
            }),
          );
        } else {
          console.clear();
          console.log('✓ No issues found');
        }
      }
    } catch (err) {
      console.error('Watch error:', err);
    } finally {
      running = false;
    }
  };

  watcher.on(() => {
    if (pending) clearTimeout(pending);
    pending = setTimeout(() => void review(), 300);
  });

  watcher.start();
  // Initial review
  await review();

  // Keep alive
  await new Promise(() => {});
  return 0;
}
void Orchestrator;
void include;
