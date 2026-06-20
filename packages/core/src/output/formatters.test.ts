import { describe, expect, it } from 'vitest';
import type { ReviewResult } from '../types/review-result.js';
import { HtmlFormatter } from './html.js';
import { JsonFormatter } from './json.js';
import { JUnitFormatter } from './junit.js';
import { MarkdownFormatter } from './markdown.js';
import { SarifFormatter } from './sarif.js';
import { TextFormatter } from './text.js';

const baseResult = (): ReviewResult => ({
  id: 'r1',
  requestId: 'rq1',
  consensusScore: 12.5,
  startedAt: '2026-06-20T00:00:00Z',
  finishedAt: '2026-06-20T00:00:01Z',
  durationMs: 1000,
  agentStats: [
    {
      agentId: 'a',
      startedAt: 't',
      finishedAt: 't',
      durationMs: 100,
      findingsCount: 2,
      errored: false,
    },
  ],
  errors: [],
  findings: [
    {
      id: 'f1',
      agentId: 'a',
      category: 'security',
      severity: 'major',
      title: 'Test issue',
      message: 'Something is wrong',
      location: { file: 'src/a.ts', line: 10 },
      ruleId: 'no-eval',
      confidence: 0.9,
      createdAt: '2026-06-20T00:00:00Z',
    },
  ],
});

describe('formatters', () => {
  it('text formatter produces readable output', () => {
    const out = new TextFormatter({ color: false }).format(baseResult());
    expect(out).toContain('Crucible Review');
    expect(out).toContain('Test issue');
    expect(out).toContain('src/a.ts:10');
    expect(out.toLowerCase()).toContain('major');
  });

  it('text formatter shows no findings when empty', () => {
    const r = baseResult();
    r.findings = [];
    const out = new TextFormatter({ color: false }).format(r);
    expect(out).toContain('No findings');
  });

  it('json formatter produces valid JSON', () => {
    const out = new JsonFormatter().format(baseResult());
    const parsed = JSON.parse(out);
    expect(parsed.id).toBe('r1');
    expect(parsed.findings).toHaveLength(1);
  });

  it('sarif formatter produces SARIF 2.1.0', () => {
    const out = new SarifFormatter().format(baseResult());
    const parsed = JSON.parse(out);
    expect(parsed.version).toBe('2.1.0');
    expect(parsed.runs[0].tool.driver.name).toBe('crucible');
    expect(parsed.runs[0].results).toHaveLength(1);
    expect(parsed.runs[0].results[0].ruleId).toBe('no-eval');
    expect(parsed.runs[0].results[0].level).toBe('error');
  });

  it('markdown formatter produces headings and code', () => {
    const out = new MarkdownFormatter().format(baseResult());
    expect(out).toContain('# Crucible Review');
    expect(out).toContain('## Findings');
    expect(out).toContain('`src/a.ts:10`');
  });

  it('html formatter produces well-formed html', () => {
    const out = new HtmlFormatter().format(baseResult());
    expect(out).toContain('<!doctype html>');
    expect(out).toContain('Crucible Review');
    expect(out).toContain('Test issue');
  });

  it('junit formatter produces xml with critical as failure', () => {
    const r = baseResult();
    r.findings[0]!.severity = 'critical';
    const out = new JUnitFormatter().format(r);
    expect(out).toContain('<?xml');
    expect(out).toContain('<failure');
    expect(out).toContain('testsuites');
  });
});
