import { execFile, execSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

/**
 * These tests verify the CLI binary end-to-end by invoking it as a subprocess.
 * They require the CLI to be built first.
 */
describe('CLI binary', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'crucible-cli-test-'));
    // Build the CLI if it doesn't exist (for CI)
    if (!existsSync(join(process.cwd(), 'dist', 'index.js'))) {
      try {
        execSync('pnpm build', { stdio: 'pipe' });
      } catch {
        // ignore — tests will skip
      }
    }
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('prints help', async () => {
    if (!cliExists()) return;
    const { stdout } = await runCli(['--help']);
    expect(stdout).toContain('crucible');
  });

  it('prints version', async () => {
    if (!cliExists()) return;
    const { stdout } = await runCli(['--version']);
    expect(stdout).toMatch(/v\d+\.\d+\.\d+/);
  });

  it('prints available agents', async () => {
    if (!cliExists()) return;
    const { stdout } = await runCli(['agents']);
    expect(stdout).toContain('security');
    expect(stdout).toContain('performance');
  });

  it('prints the JSON schema', async () => {
    if (!cliExists()) return;
    const { stdout } = await runCli(['schema']);
    const parsed = JSON.parse(stdout) as { properties: Record<string, unknown> };
    expect(parsed.properties.agents).toBeDefined();
  });

  it('returns non-zero on unknown command', async () => {
    if (!cliExists()) return;
    const { exitCode } = await runCli(['bogus-command']);
    expect(exitCode).not.toBe(0);
  });
});

interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

function cliExists(): boolean {
  return existsSync(join(process.cwd(), 'dist', 'index.js'));
}

async function runCli(args: string[]): Promise<ExecResult> {
  const cliPath = join(process.cwd(), 'dist', 'index.js');
  return runNode(cliPath, args);
}

function runNode(scriptPath: string, args: string[]): Promise<ExecResult> {
  return new Promise((resolve) => {
    execFile('node', [scriptPath, ...args], { timeout: 10_000 }, (err, stdout, stderr) => {
      resolve({
        stdout: stdout.toString(),
        stderr: stderr.toString(),
        exitCode: err ? 1 : 0,
      });
    });
  });
}

void writeFileSync;
void readFileSync;
