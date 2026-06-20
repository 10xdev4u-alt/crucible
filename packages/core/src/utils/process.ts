/** Cross-platform process utilities. */
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';

/** Check if a command is available on the system. */
export function hasCommand(cmd: string): boolean {
  const cmd_check = process.platform === 'win32' ? `where ${cmd}` : `command -v ${cmd}`;
  try {
    execSync(cmd_check, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/** Get the version of a command, or undefined. */
export function getVersion(cmd: string, versionFlag = '--version'): string | undefined {
  try {
    return (
      execSync(`${cmd} ${versionFlag}`, { encoding: 'utf8' }).trim().split('\n')[0] ?? undefined
    );
  } catch {
    return undefined;
  }
}

/** Check if a path exists. */
export function pathExists(p: string): boolean {
  return existsSync(p);
}

/** Get the OS as a normalized string. */
export function os(): 'macos' | 'linux' | 'windows' | 'unknown' {
  if (process.platform === 'darwin') return 'macos';
  if (process.platform === 'linux') return 'linux';
  if (process.platform === 'win32') return 'windows';
  return 'unknown';
}
