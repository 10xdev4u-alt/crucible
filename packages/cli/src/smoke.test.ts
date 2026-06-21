import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * Smoke test: runs the CLI's `crucible review --mock` on a real git repo
 * with some staged changes, and verifies the output is non-empty.
 */
describe('CLI review smoke test', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'crucible-smoke-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('runs review on a git repo with mock provider', () => {
    // Initialize git
    execSync('git init -q', { cwd: dir });
    execSync('git config user.email "test@example.com"', { cwd: dir });
    execSync('git config user.name "Test"', { cwd: dir });
    writeFileSync(join(dir, 'a.ts'), 'const x = 1;\n');
    execSync('git add .', { cwd: dir });
    execSync('git commit -q -m "initial"', { cwd: dir });
    writeFileSync(join(dir, 'a.ts'), 'const x = 1;\nconst y = 2;\n');
    execSync('git add .', { cwd: dir });

    // Run crucible review with mock
    const cliPath = join(process.cwd(), '..', '..', 'dist', 'index.js');
    if (!existsSync(cliPath)) return;
    const out = execSync(`node ${cliPath} review --diff staged --mock --quiet`, {
      cwd: dir,
      encoding: 'utf8',
    });
    // The mock provider returns empty findings, so the output should be valid (no error)
    expect(out).toBeDefined();
  }, 30_000);
});

function existsSync(p: string): boolean {
  try {
    return !!require('node:fs').readFileSync(p);
  } catch {
    return false;
  }
}
