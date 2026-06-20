import { existsSync, readdirSync, rmSync, statSync, unlinkSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { getBoolean, getString } from '../argv.js';

const CACHE_DIR = '.crucible-cache';

export function cmdCache(
  positionals: string[],
  flags: Record<string, string | boolean | string[]>,
): number {
  const sub = positionals[0];
  if (!sub || sub === 'help') {
    console.log(`crucible cache <command>

Commands:
  info    Show cache size and entry count
  clear   Delete all cache entries
  list    List cache files`);
    return 0;
  }
  const root = resolve(process.cwd(), getString(flags, 'root', '.'));
  const dir = resolve(root, CACHE_DIR);
  if (!existsSync(dir)) {
    console.log(`No cache at ${dir}`);
    return 0;
  }
  switch (sub) {
    case 'info':
      return cacheInfo(dir);
    case 'clear':
      return cacheClear(dir, getBoolean(flags, 'force'));
    case 'list':
      return cacheList(dir);
    default:
      console.error(`Unknown cache command: ${sub}`);
      return 2;
  }
}

function cacheInfo(dir: string): number {
  let total = 0;
  let count = 0;
  walk(dir, (_p, st) => {
    total += st.size;
    count += 1;
  });
  console.log(`Path:   ${dir}`);
  console.log(`Files:  ${count}`);
  console.log(`Size:   ${formatBytes(total)}`);
  return 0;
}

function cacheClear(dir: string, force: boolean): number {
  if (!force) {
    console.error('Refusing to clear cache without --force');
    return 1;
  }
  rmSync(dir, { recursive: true, force: true });
  console.log(`Cleared ${dir}`);
  return 0;
}

function cacheList(dir: string): number {
  const files: string[] = [];
  walk(dir, (p) => files.push(p));
  for (const f of files) console.log(f);
  return 0;
}

function walk(dir: string, cb: (path: string, stat: import('node:fs').Stats) => void): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) walk(p, cb);
    else if (entry.isFile()) {
      try {
        cb(p, statSync(p));
      } catch {
        /* ignore */
      }
    }
  }
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

void unlinkSync;
