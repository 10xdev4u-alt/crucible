import { describe, expect, it } from 'vitest';
import { fileCount, hasChanges, type ReviewContext } from './review-context';

const baseCtx = (overrides: Partial<ReviewContext> = {}): ReviewContext => ({
  request: {
    id: 'r1',
    target: { kind: 'files', paths: [] },
    requestedAt: '2026-06-20T00:00:00Z',
  },
  project: { root: '/tmp' },
  env: {},
  ...overrides,
});

describe('review-context', () => {
  describe('hasChanges', () => {
    it('returns false when there is no change set', () => {
      expect(hasChanges(baseCtx())).toBe(false);
    });

    it('returns false when the change set is empty', () => {
      expect(
        hasChanges(
          baseCtx({ changeSet: { base: 'a', head: 'b', files: [], totalAdditions: 0, totalDeletions: 0 } }),
        ),
      ).toBe(false);
    });

    it('returns true when the change set has files', () => {
      expect(
        hasChanges(
          baseCtx({
            changeSet: {
              base: 'a',
              head: 'b',
              files: [{ path: 'a.ts', kind: 'modified', isBinary: false, hunks: [], additions: 1, deletions: 0 }],
              totalAdditions: 1,
              totalDeletions: 0,
            },
          }),
        ),
      ).toBe(true);
    });
  });

  describe('fileCount', () => {
    it('returns 0 when there is no change set', () => {
      expect(fileCount(baseCtx())).toBe(0);
    });

    it('returns the number of files in the change set', () => {
      expect(
        fileCount(
          baseCtx({
            changeSet: {
              base: 'a',
              head: 'b',
              files: [
                { path: 'a.ts', kind: 'modified', isBinary: false, hunks: [], additions: 1, deletions: 0 },
                { path: 'b.ts', kind: 'modified', isBinary: false, hunks: [], additions: 1, deletions: 0 },
              ],
              totalAdditions: 2,
              totalDeletions: 0,
            },
          }),
        ),
      ).toBe(2);
    });
  });
});
