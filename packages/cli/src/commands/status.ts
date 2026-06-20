import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { getStagedDiff, getWorkingTreeDiff } from '../git/diff.js';

export function cmdStatus(positionals: string[]): number {
  const root = resolve(process.cwd(), positionals[0] ?? '.');
  if (!existsSync(root)) {
    console.error(`Path not found: ${root}`);
    return 1;
  }
  const isGit = existsSync(resolve(root, '.git'));
  console.log(`Crucible status`);
  console.log(`  root:        ${root}`);
  console.log(`  git:         ${isGit ? 'yes' : 'no'}`);
  if (isGit) {
    const staged = getStagedDiff(root);
    const working = getWorkingTreeDiff(root);
    console.log(
      `  staged:      ${staged.files.length} files (+${staged.totalAdditions} -${staged.totalDeletions})`,
    );
    console.log(
      `  working:     ${working.files.length} files (+${working.totalAdditions} -${working.totalDeletions})`,
    );
    const configExists = existsSync(resolve(root, '.crucible.json'));
    console.log(`  config:      ${configExists ? '.crucible.json' : 'none'}`);
  }
  try {
    const stat = statSync(root);
    console.log(`  mtime:       ${stat.mtime.toISOString()}`);
  } catch {
    /* ignore */
  }
  return 0;
}
