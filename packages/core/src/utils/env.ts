/** Sanity-check helpers used in tests and the doctor command. */
import { execSync } from 'node:child_process';

export const isMac = process.platform === 'darwin';
export const isLinux = process.platform === 'linux';
export const isWindows = process.platform === 'win32';

/** Returns the current working directory. */
export function cwd(): string {
  return process.cwd();
}

/** Returns the home directory. */
export function homeDir(): string {
  return process.env.HOME ?? process.env.USERPROFILE ?? '';
}

/** Returns the temp directory. */
export function tmpDir(): string {
  return process.env.TMPDIR ?? process.env.TMP ?? process.env.TEMP ?? '/tmp';
}

/** Returns true if a command is on PATH. */
export function commandExists(cmd: string): boolean {
  try {
    execSync(`command -v ${cmd}`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/** Returns the version of a command, or undefined if not found. */
export function commandVersion(cmd: string): string | undefined {
  try {
    return execSync(`${cmd} --version`, { encoding: 'utf8' }).trim().split('\n')[0];
  } catch {
    return undefined;
  }
}
