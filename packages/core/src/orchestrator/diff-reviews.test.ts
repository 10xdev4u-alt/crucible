import { describe, expect, it } from 'vitest';
import type { Finding } from '../types/finding.js';
import type { ReviewResult } from '../types/review-result.js';
import { diffReviews } from './diff-reviews.js';

const mkFinding = (overrides: Partial<Finding>): Finding => ({
  id: 'x',
  agentId: 'a',
  category: 'style',
  severity: 'minor',
  title: 't',
  message: 'm',
  confidence: 0.5,
  createdAt: '2026-06-20T00:00:00Z',
  ...overrides,
});

const mkResult = (findings: Finding[]): ReviewResult => ({
  id: 'r1',
  requestId: 'req1',
  consensusScore: 1,
  startedAt: '2026-06-20T00:00:00Z',
  finishedAt: '2026-06-20T00:00:01Z',
  durationMs: 1000,
  agentStats: [],
  errors: [],
  findings,
});

describe('diffReviews', () => {
  it('returns empty diff for identical results', () => {
    const findings = [mkFinding({ id: 'f1', location: { file: 'a.ts', line: 1 } })];
    const r = diffReviews(mkResult(findings), mkResult(findings));
    expect(r.added).toEqual([]);
    expect(r.removed).toEqual([]);
    expect(r.changed).toEqual([]);
  });

  it('detects added findings', () => {
    const before = mkResult([]);
    const after = mkResult([mkFinding({ id: 'f1', location: { file: 'a.ts', line: 1 } })]);
    const r = diffReviews(before, after);
    expect(r.added).toHaveLength(1);
    expect(r.removed).toEqual([]);
  });

  it('detects removed findings', () => {
    const before = mkResult([mkFinding({ id: 'f1', location: { file: 'a.ts', line: 1 } })]);
    const after = mkResult([]);
    const r = diffReviews(before, after);
    expect(r.added).toEqual([]);
    expect(r.removed).toHaveLength(1);
  });

  it('detects changed findings', () => {
    const before = mkResult([
      mkFinding({ id: 'f1', location: { file: 'a.ts', line: 1 }, severity: 'minor' }),
    ]);
    const after = mkResult([
      mkFinding({ id: 'f1', location: { file: 'a.ts', line: 1 }, severity: 'major' }),
    ]);
    const r = diffReviews(before, after);
    expect(r.changed).toHaveLength(1);
    expect(r.changed[0]?.before.severity).toBe('minor');
    expect(r.changed[0]?.after.severity).toBe('major');
  });
});
