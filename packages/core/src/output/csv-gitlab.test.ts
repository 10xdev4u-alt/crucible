import { describe, expect, it } from 'vitest';
import type { ReviewResult } from '../types/review-result.js';
import { CsvFormatter } from './csv.js';
import { GitLabFormatter } from './gitlab.js';

const baseResult = (findings: ReviewResult['findings']): ReviewResult => ({
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

describe('CsvFormatter', () => {
  it('emits a header row', () => {
    const out = new CsvFormatter().format(baseResult([]));
    expect(out.split('\n')[0]).toContain('id,agent,category,severity');
  });

  it('handles empty findings', () => {
    const out = new CsvFormatter().format(baseResult([]));
    expect(out.split('\n')).toHaveLength(1);
  });

  it('escapes commas, quotes, and newlines in fields', () => {
    const out = new CsvFormatter().format(
      baseResult([
        {
          id: 'f1',
          agentId: 'a',
          category: 'style',
          severity: 'minor',
          title: 'Title, with comma',
          message: 'Has "quotes" and\nnewlines',
          location: { file: 'a.ts', line: 1 },
          ruleId: 'r1',
          confidence: 0.5,
          createdAt: '2026-06-20T00:00:00Z',
        },
      ]),
    );
    expect(out).toContain('"Title, with comma"');
    expect(out).toContain('"Has ""quotes"" and\nnewlines"');
  });
});

describe('GitLabFormatter', () => {
  it('emits a JSON array', () => {
    const out = new GitLabFormatter().format(baseResult([]));
    const parsed = JSON.parse(out) as unknown[];
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toEqual([]);
  });

  it('maps severity correctly', () => {
    const out = new GitLabFormatter().format(
      baseResult([
        {
          id: 'f1',
          agentId: 'a',
          category: 'security',
          severity: 'critical',
          title: 't',
          message: 'm',
          location: { file: 'a.ts', line: 42 },
          ruleId: 'r1',
          confidence: 0.9,
          createdAt: '2026-06-20T00:00:00Z',
        },
      ]),
    );
    const issues = JSON.parse(out) as Array<{
      severity: string;
      location: { path: string; lines: { begin: number } };
    }>;
    expect(issues[0]?.severity).toBe('critical');
    expect(issues[0]?.location.path).toBe('a.ts');
    expect(issues[0]?.location.lines.begin).toBe(42);
  });
});
