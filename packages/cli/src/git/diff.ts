import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ChangeSet, FileDiff, Hunk } from '@crucible/core';

const UNIFIED_DIFF_HEADER = /^diff --git [aci]\/(.+?) [bwci]\/(.+?)$/;
const NEW_FILE_MODE = /^new file mode/;
const DELETED_FILE_MODE = /^deleted file mode/;
const RENAME_FROM = /^rename from (.+)$/;
const RENAME_TO = /^rename to (.+)$/;
const BINARY = /^Binary files/;
const HUNK_HEADER = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/;

/** Get the diff for the working tree against HEAD. Returns empty ChangeSet if no diff. */
export function getWorkingTreeDiff(root: string, base = 'HEAD'): ChangeSet {
  let raw = '';
  try {
    raw = execSync(`git diff --no-color --no-ext-diff ${base}`, { cwd: root, encoding: 'utf8' });
  } catch {
    raw = '';
  }
  if (!raw.trim()) {
    return { base, head: 'working', files: [], totalAdditions: 0, totalDeletions: 0 };
  }
  return parseDiff(raw, base, 'working');
}

/** Get the diff for staged changes. */
export function getStagedDiff(root: string): ChangeSet {
  let raw = '';
  try {
    raw = execSync('git diff --no-color --no-ext-diff --staged', { cwd: root, encoding: 'utf8' });
  } catch {
    raw = '';
  }
  if (!raw.trim()) {
    return { base: 'index', head: 'index', files: [], totalAdditions: 0, totalDeletions: 0 };
  }
  return parseDiff(raw, 'index', 'index');
}

/** Get the diff between two refs. */
export function getDiffBetweenRefs(root: string, base: string, head: string): ChangeSet {
  let raw = '';
  try {
    raw = execSync(`git diff --no-color --no-ext-diff ${base}...${head}`, {
      cwd: root,
      encoding: 'utf8',
    });
  } catch {
    raw = '';
  }
  if (!raw.trim()) {
    return { base, head, files: [], totalAdditions: 0, totalDeletions: 0 };
  }
  return parseDiff(raw, base, head);
}

/** Parse a unified diff into a ChangeSet. */
export function parseDiff(raw: string, base: string, head: string): ChangeSet {
  const files: FileDiff[] = [];
  const lines = raw.split('\n');
  let i = 0;
  let totalAdditions = 0;
  let totalDeletions = 0;
  while (i < lines.length) {
    const line = lines[i]!;
    const headerMatch = line.match(UNIFIED_DIFF_HEADER);
    if (!headerMatch) {
      i += 1;
      continue;
    }
    const oldPath = headerMatch[1]!;
    const newPath = headerMatch[2]!;
    const file: FileDiff = {
      path: newPath,
      kind: 'modified',
      isBinary: false,
      hunks: [],
      additions: 0,
      deletions: 0,
    };
    if (oldPath !== newPath) {
      file.oldPath = oldPath;
      file.kind = 'renamed';
    }
    i += 1;
    while (i < lines.length) {
      const l = lines[i]!;
      if (l.startsWith('diff --git ')) break;
      if (NEW_FILE_MODE.test(l)) file.kind = 'added';
      else if (DELETED_FILE_MODE.test(l)) file.kind = 'deleted';
      else if (BINARY.test(l)) file.isBinary = true;
      const renFrom = l.match(RENAME_FROM);
      if (renFrom) {
        file.kind = 'renamed';
        file.oldPath = renFrom[1]!;
      }
      const renTo = l.match(RENAME_TO);
      if (renTo) {
        file.path = renTo[1]!;
      }
      const hunkMatch = l.match(HUNK_HEADER);
      if (hunkMatch) {
        const hunk: Hunk = {
          oldStart: Number.parseInt(hunkMatch[1]!, 10),
          oldLines: Number.parseInt(hunkMatch[2] ?? '1', 10),
          newStart: Number.parseInt(hunkMatch[3]!, 10),
          newLines: Number.parseInt(hunkMatch[4] ?? '1', 10),
          header: l,
          lines: [],
        };
        i += 1;
        let oldLine = hunk.oldStart;
        let newLine = hunk.newStart;
        while (i < lines.length) {
          const hl = lines[i]!;
          if (hl.startsWith('diff --git ') || hl.startsWith('@@ ')) break;
          if (hl.startsWith('+') && !hl.startsWith('+++')) {
            hunk.lines.push({ kind: 'add', content: hl.slice(1), newLineNumber: newLine });
            newLine += 1;
            file.additions += 1;
            totalAdditions += 1;
          } else if (hl.startsWith('-') && !hl.startsWith('---')) {
            hunk.lines.push({ kind: 'remove', content: hl.slice(1), oldLineNumber: oldLine });
            oldLine += 1;
            file.deletions += 1;
            totalDeletions += 1;
          } else if (hl.startsWith('\\ No newline')) {
            hunk.lines.push({ kind: 'no-newline', content: '' });
          } else if (hl.startsWith(' ')) {
            hunk.lines.push({
              kind: 'context',
              content: hl.slice(1),
              oldLineNumber: oldLine,
              newLineNumber: newLine,
            });
            oldLine += 1;
            newLine += 1;
          } else if (hl === '') {
            // Blank line — likely end of file marker
            i += 1;
            continue;
          } else {
            break;
          }
          i += 1;
        }
        file.hunks.push(hunk);
        continue;
      }
      i += 1;
    }
    files.push(file);
  }
  return { base, head, files, totalAdditions, totalDeletions };
}

/** Reads a file's full content (or null if not found or binary). */
export function readFileText(path: string): string | null {
  if (!existsSync(path)) return null;
  try {
    return readFileSync(path, 'utf8');
  } catch {
    return null;
  }
}

/** Resolves a path within a root, returning an absolute path. */
export function resolveInRoot(root: string, p: string): string {
  if (p.startsWith('/')) return p;
  return join(root, p);
}
