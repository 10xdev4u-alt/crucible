/** `crucible doctor` — check the environment for issues. */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

interface Check {
  name: string;
  ok: boolean;
  message: string;
  fix?: string;
}

export async function cmdDoctor(positionals: string[]): Promise<number> {
  const root = resolve(process.cwd(), positionals[0] ?? '.');
  const checks: Check[] = [];

  // Node version
  const nodeMajor = Number.parseInt(process.versions.node.split('.')[0] ?? '0', 10);
  checks.push({
    name: 'Node.js version',
    ok: nodeMajor >= 22,
    message: `Found Node ${process.versions.node} (${nodeMajor >= 22 ? 'OK' : 'need 22+'})`,
    fix: nodeMajor < 22 ? 'Install Node 22 or later: https://nodejs.org' : undefined,
  });

  // pnpm
  try {
    const pnpmVersion = execSync('pnpm --version', { encoding: 'utf8' }).trim();
    checks.push({
      name: 'pnpm',
      ok: true,
      message: `Found pnpm ${pnpmVersion}`,
    });
  } catch {
    checks.push({
      name: 'pnpm',
      ok: false,
      message: 'pnpm not found',
      fix: 'Install pnpm: npm install -g pnpm',
    });
  }

  // Git
  try {
    const gitVersion = execSync('git --version', { encoding: 'utf8' }).trim();
    const isRepo = existsSync(resolve(root, '.git'));
    checks.push({
      name: 'Git',
      ok: isRepo,
      message: `${gitVersion} (${isRepo ? 'in a git repo' : 'not in a git repo'})`,
      fix: isRepo ? undefined : 'Run `git init` in this directory',
    });
  } catch {
    checks.push({
      name: 'Git',
      ok: false,
      message: 'git not found',
      fix: 'Install Git: https://git-scm.com',
    });
  }

  // Config file
  const configPath = resolve(root, '.crucible.json');
  const configExists = existsSync(configPath);
  checks.push({
    name: 'Config file',
    ok: configExists,
    message: configExists ? 'Found .crucible.json' : 'No .crucible.json',
    fix: configExists ? undefined : 'Run `crucible init` to create one',
  });

  // API keys
  const keys = ['ANTHROPIC_API_KEY', 'OPENAI_API_KEY', 'GEMINI_API_KEY'];
  const foundKey = keys.find((k) => process.env[k]);
  if (foundKey) {
    checks.push({
      name: 'API key',
      ok: true,
      message: `Found ${foundKey}`,
    });
  } else {
    checks.push({
      name: 'API key',
      ok: false,
      message: 'No LLM API key found in environment',
      fix: `Set one of: ${keys.join(', ')}`,
    });
  }

  // Network connectivity
  try {
    await fetch('https://api.anthropic.com', { method: 'HEAD', signal: AbortSignal.timeout(5000) });
    checks.push({ name: 'Network', ok: true, message: 'Can reach api.anthropic.com' });
  } catch {
    checks.push({
      name: 'Network',
      ok: false,
      message: 'Cannot reach api.anthropic.com',
      fix: 'Check your internet connection',
    });
  }

  // Config validation (if config exists)
  if (configExists) {
    try {
      const config = JSON.parse(readFileSync(configPath, 'utf8')) as { version?: number };
      checks.push({
        name: 'Config version',
        ok: config.version === 1,
        message: `Version ${config.version ?? 'missing'}`,
        fix: config.version !== 1 ? 'Run `crucible init --force` to upgrade' : undefined,
      });
    } catch (err) {
      checks.push({
        name: 'Config validity',
        ok: false,
        message: `Config is not valid JSON: ${err instanceof Error ? err.message : String(err)}`,
        fix: 'Fix the JSON syntax in .crucible.json',
      });
    }
  }

  // Print results
  let ok = true;
  for (const c of checks) {
    const mark = c.ok ? '✓' : '✗';
    const color = c.ok ? '\x1b[32m' : '\x1b[31m';
    const reset = '\x1b[0m';
    console.log(`${color}${mark}${reset}  ${c.name}: ${c.message}`);
    if (!c.ok) {
      ok = false;
      if (c.fix) console.log(`     Fix: ${c.fix}`);
    }
  }

  console.log('');
  if (ok) {
    console.log('\x1b[32mAll checks passed.\x1b[0m');
    return 0;
  }
  console.log('\x1b[31mSome checks failed. See suggestions above.\x1b[0m');
  return 1;
}
