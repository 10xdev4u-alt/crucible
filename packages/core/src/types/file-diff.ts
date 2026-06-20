/** A single line range within a hunk. 0-based, half-open. */
export interface LineRange {
  start: number;
  end: number;
}

/** A line in a file diff, with classification. */
export type DiffLineKind = 'context' | 'add' | 'remove' | 'no-newline';

export interface DiffLine {
  kind: DiffLineKind;
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

/** A hunk represents a contiguous block of changes within a file. */
export interface Hunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  header: string;
  lines: DiffLine[];
}

/** The kind of change a file underwent. */
export type FileChangeKind = 'added' | 'modified' | 'deleted' | 'renamed' | 'copied';

/** A diff for a single file. */
export interface FileDiff {
  path: string;
  oldPath?: string;
  kind: FileChangeKind;
  isBinary: boolean;
  hunks: Hunk[];
  additions: number;
  deletions: number;
}

/** A diff for an entire change set. */
export interface ChangeSet {
  base: string;
  head: string;
  files: FileDiff[];
  totalAdditions: number;
  totalDeletions: number;
}

/** Returns the total number of changed lines (additions + deletions) in a hunk. */
export function hunkChangeCount(hunk: Hunk): number {
  return hunk.lines.filter((l) => l.kind === 'add' || l.kind === 'remove').length;
}

/** Returns the total number of changed lines in a file diff. */
export function fileChangeCount(file: FileDiff): number {
  return file.additions + file.deletions;
}

/** Returns the total number of changed lines in a change set. */
export function changeSetCount(set: ChangeSet): number {
  return set.totalAdditions + set.totalDeletions;
}
