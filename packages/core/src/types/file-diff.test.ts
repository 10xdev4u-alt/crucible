import { describe, expect, it } from 'vitest';
import {
  changeSetCount,
  fileChangeCount,
  hunkChangeCount,
  type ChangeSet,
  type FileDiff,
  type Hunk,
} from './file-diff';

const makeHunk = (lines: Array<{ kind: 'add' | 'remove' | 'context'; content: string }>): Hunk => ({
  oldStart: 1,
  oldLines: lines.length,
  newStart: 1,
  newLines: lines.length,
  header: '@@ -1 +1 @@',
  lines,
});

describe('file-diff', () => {
  describe('hunkChangeCount', () => {
    it('counts only added and removed lines', () => {
      const h = makeHunk([
        { kind: 'context', content: 'a' },
        { kind: 'add', content: 'b' },
        { kind: 'remove', content: 'c' },
        { kind: 'context', content: 'd' },
      ]);
      expect(hunkChangeCount(h)).toBe(2);
    });

    it('returns zero for hunks with no changes', () => {
      const h = makeHunk([{ kind: 'context', content: 'a' }]);
      expect(hunkChangeCount(h)).toBe(0);
    });
  });

  describe('fileChangeCount', () => {
    it('sums additions and deletions', () => {
      const f: FileDiff = {
        path: 'a.ts',
        kind: 'modified',
        isBinary: false,
        hunks: [],
        additions: 10,
        deletions: 5,
      };
      expect(fileChangeCount(f)).toBe(15);
    });
  });

  describe('changeSetCount', () => {
    it('sums total additions and deletions', () => {
      const s: ChangeSet = {
        base: 'abc',
        head: 'def',
        files: [],
        totalAdditions: 50,
        totalDeletions: 20,
      };
      expect(changeSetCount(s)).toBe(70);
    });
  });
});
