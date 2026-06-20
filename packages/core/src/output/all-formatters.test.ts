import { describe, expect, it } from 'vitest';
import type { ReviewResult } from '../types/review-result.js';
import { CsvFormatter } from './csv.js';
import { GitLabFormatter } from './gitlab.js';
import { HtmlFormatter } from './html.js';
import { type Format, formatResult, getFormatter } from './index.js';
import { JsonFormatter } from './json.js';
import { JUnitFormatter } from './junit.js';
import { MarkdownFormatter } from './markdown.js';
import { SarifFormatter } from './sarif.js';
import { TextFormatter } from './text.js';

const baseResult = (overrides: Partial<ReviewResult> = {}): ReviewResult => ({
  id: 'r1',
  requestId: 'req1',
  consensusScore: 12.5,
  startedAt: '2026-06-20T00:00:00Z',
  finishedAt: '2026-06-20T00:00:01Z',
  durationMs: 1000,
  agentStats: [],
  errors: [],
  findings: [
    {
      id: 'f1',
      agentId: 'security',
      category: 'security',
      severity: 'critical',
      title: 'SQL injection',
      message: 'User input concatenated into SQL string',
      location: { file: 'src/db.ts', line: 42 },
      ruleId: 'no-string-concat',
      confidence: 0.95,
      createdAt: '2026-06-20T00:00:00Z',
    },
  ],
  ...overrides,
});

describe('All formatters handle the same finding', () => {
  const formats: Format[] = ['text', 'json', 'sarif', 'markdown', 'html', 'junit', 'csv', 'gitlab'];

  for (const format of formats) {
    it(`${format} formatter produces non-empty output`, () => {
      const out = formatResult(format, baseResult());
      expect(out.length).toBeGreaterThan(0);
    });
  }

  for (const format of formats) {
    it(`${format} formatter handles empty findings`, () => {
      const r = baseResult({ findings: [] });
      const out = formatResult(format, r);
      expect(out.length).toBeGreaterThan(0);
    });
  }
});

describe('getFormatter returns the right class', () => {
  it('returns TextFormatter for text', () => {
    expect(getFormatter('text')).toBeInstanceOf(TextFormatter);
  });
  it('returns JsonFormatter for json', () => {
    expect(getFormatter('json')).toBeInstanceOf(JsonFormatter);
  });
  it('returns SarifFormatter for sarif', () => {
    expect(getFormatter('sarif')).toBeInstanceOf(SarifFormatter);
  });
  it('returns MarkdownFormatter for markdown', () => {
    expect(getFormatter('markdown')).toBeInstanceOf(MarkdownFormatter);
  });
  it('returns JUnitFormatter for junit', () => {
    expect(getFormatter('junit')).toBeInstanceOf(JUnitFormatter);
  });
  it('returns HtmlFormatter for html', () => {
    expect(getFormatter('html')).toBeInstanceOf(HtmlFormatter);
  });
  it('returns CsvFormatter for csv', () => {
    expect(getFormatter('csv')).toBeInstanceOf(CsvFormatter);
  });
  it('returns GitLabFormatter for gitlab', () => {
    expect(getFormatter('gitlab')).toBeInstanceOf(GitLabFormatter);
  });
});

describe('Each formatter is pure and deterministic', () => {
  for (const format of [
    'text',
    'json',
    'sarif',
    'markdown',
    'html',
    'junit',
    'csv',
    'gitlab',
  ] as Format[]) {
    it(`${format} produces the same output for the same input`, () => {
      const r = baseResult();
      const a = formatResult(format, r);
      const b = formatResult(format, r);
      expect(a).toBe(b);
    });
  }
});
