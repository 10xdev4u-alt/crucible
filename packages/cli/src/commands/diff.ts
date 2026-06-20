import { existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getString } from '../argv.js';
import { getStagedDiff, getWorkingTreeDiff } from '../git/diff.js';

/** `crucible diff` — show the parsed diff as JSON for piping. */
export function cmdDiff(positionals: string[]): number {
  const root = resolve(process.cwd(), positionals[0] ?? '.');
  if (!existsSync(root)) {
    console.error(`Path not found: ${root}`);
    return 1;
  }
  const which = getString({} as Record<string, string | boolean | string[]>, 'which', 'all');
  const set =
    which === 'staged'
      ? getStagedDiff(root)
      : which === 'working'
        ? getWorkingTreeDiff(root)
        : merge(getStagedDiff(root), getWorkingTreeDiff(root));
  const out = getString({} as Record<string, string | boolean | string[]>, 'output');
  const json = JSON.stringify(set, null, 2);
  if (out) {
    writeFileSync(resolve(process.cwd(), out), json, 'utf8');
    return 0;
  }
  console.log(json);
  return 0;
}

function merge(
  a: ReturnType<typeof getStagedDiff>,
  b: ReturnType<typeof getWorkingTreeDiff>,
): ReturnType<typeof getStagedDiff> {
  return a.files.length > 0 ? a : b;
}
