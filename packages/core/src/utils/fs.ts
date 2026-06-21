import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';

export interface FileInfo {
  path: string;
  size: number;
  mtime: number;
  isDirectory: boolean;
}

/** Find files matching a glob pattern. */
export function findFiles(
  root: string,
  pattern: string,
  options: { maxDepth?: number; includeDirs?: boolean } = {},
): string[] {
  const out: string[] = [];
  const regex = globToRegex(pattern);
  const maxDepth = options.maxDepth ?? 10;

  const walk = (dir: string, depth: number): void => {
    if (depth > maxDepth) return;
    let entries: import('node:fs').Dirent[];
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.name.startsWith('.') && entry.name !== '.crucible.json') continue;
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'build')
        continue;
      const p = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (options.includeDirs) {
          const rel = relative(process.cwd(), p);
          if (regex.test(rel.replace(/\\/g, '/'))) out.push(rel);
        }
        walk(p, depth + 1);
      } else if (entry.isFile()) {
        const rel = relative(process.cwd(), p);
        if (regex.test(rel.replace(/\\/g, '/'))) out.push(rel);
      }
    }
  };

  walk(root, 0);
  return out.sort();
}

const globToRegex = (glob: string): RegExp => {
  // Simple glob: * matches anything except /, ** matches anything
  const escaped = glob
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '.*')
    .replace(/\*/g, '[^/]*');
  return new RegExp(`^${escaped}$`);
};

/** Read a file, returning null if not found. */
export function readFile(path: string): string | null {
  if (!existsSync(path)) return null;
  try {
    return readFileSync(path, 'utf8');
  } catch {
    return null;
  }
}

/** Write a file, returning true on success. */
export function writeFile(path: string, content: string): boolean {
  try {
    if (dirname(path) !== '.') {
      // Recursive mkdir would be ideal, but skip for now
    }
    writeFileSync(path, content, 'utf8');
    return true;
  } catch {
    return false;
  }
}

/** Get file info. */
export function fileInfo(path: string): FileInfo | null {
  if (!existsSync(path)) return null;
  try {
    const st = statSync(path);
    return {
      path,
      size: st.size,
      mtime: st.mtimeMs,
      isDirectory: st.isDirectory(),
    };
  } catch {
    return null;
  }
}

void sep;
