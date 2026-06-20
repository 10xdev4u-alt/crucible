import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getString } from '../argv.js';

const HOOK = `#!/usr/bin/env bash
# Crucible pre-commit hook
# Runs a quick review on staged changes before commit.
set -e
if ! command -v crucible >/dev/null 2>&1; then
  echo "crucible: not on PATH; skipping pre-commit review"
  exit 0
fi
exec crucible review --diff staged --format text --severity blocker,critical --quiet
`;

export function cmdHook(positionals: string[]): number {
  const sub = positionals[0];
  if (sub !== 'install') {
    console.error('Usage: crucible hook install');
    return 1;
  }
  const root = resolve(
    process.cwd(),
    getString({} as Record<string, string | boolean | string[]>, 'root', '.'),
  );
  const gitDir = resolve(root, '.git');
  if (!existsSync(gitDir)) {
    console.error(`Not a git repository: ${root}`);
    return 1;
  }
  const hookPath = resolve(gitDir, 'hooks', 'pre-commit');
  if (existsSync(hookPath)) {
    const existing = readFileSync(hookPath, 'utf8');
    if (existing.includes('crucible review')) {
      console.log('Hook already installed.');
      return 0;
    }
    const appended = `${existing}\n\n# --- crucible ---\n${HOOK}`;
    writeFileSync(hookPath, appended, { mode: 0o755 });
    console.log(`Updated existing pre-commit hook at ${hookPath}`);
    return 0;
  }
  writeFileSync(hookPath, HOOK, { mode: 0o755 });
  console.log(`Installed pre-commit hook at ${hookPath}`);
  return 0;
}

import { writeFileSync } from 'node:fs';
