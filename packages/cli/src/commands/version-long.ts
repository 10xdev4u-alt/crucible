/** `crucible version` — enhanced version command. */
import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { VERSION } from '../banner.js';

interface PackageJson {
  name?: string;
  version?: string;
  description?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

const getCoreVersion = (): string => {
  const pkgPath = resolve(process.cwd(), 'packages', 'core', 'package.json');
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as PackageJson;
      return pkg.version ?? VERSION;
    } catch {
      return VERSION;
    }
  }
  return VERSION;
};

const getLatestNpm = (pkg: string): string | undefined => {
  try {
    const out = execSync(`npm view ${pkg} version 2>/dev/null`, { encoding: 'utf8' }).trim();
    return out;
  } catch {
    return undefined;
  }
};

const getGitCommit = (): string | undefined => {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return undefined;
  }
};

const getGitBranch = (): string | undefined => {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return undefined;
  }
};

const getNodeVersion = (): string => {
  return process.versions.node;
};

export function cmdVersionLong(): number {
  const core = getCoreVersion();
  const node = getNodeVersion();
  const commit = getGitCommit();
  const branch = getGitBranch();
  const latest = getLatestNpm('@crucible/core');

  console.log(`crucible`);
  console.log(`  version:    ${core}${latest && latest !== core ? ` (latest: ${latest})` : ''}`);
  console.log(`  node:       ${node}`);
  if (commit) console.log(`  commit:     ${commit}`);
  if (branch) console.log(`  branch:     ${branch}`);
  if (latest && latest !== core) {
    console.log('');
    console.log(`Update available: ${latest}`);
    console.log(`  Run: npm install -g crucible@latest`);
  } else {
    console.log('');
    console.log('You are on the latest version.');
  }
  return 0;
}

void join;
