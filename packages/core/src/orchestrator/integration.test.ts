import { describe, expect, it } from 'vitest';
import { dedupeFindings } from './dedup.js';
import { groupFindings } from './dedup.js';
import { findingKey } from './dedup.js';
import { runParallel } from './parallel.js';
import { rankFindings } from './scorer.js';
import { reviewScore } from './scorer.js';
import { scoreFinding } from './scorer.js';
import { consensusScore } from './scorer.js';
import type { Finding } from '../types/finding.js';

const mk = (overrides: Partial<Finding>): Finding => ({
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

describe('integration: dedup + score + rank', () => {
  it('groups overlapping findings from different agents and ranks them', () => {
    const a = mk({ id: 'a1', agentId: 'security', severity: 'major', confidence: 0.9, location: { file: 'a.ts', line: 1 }, ruleId: 'r1' });
    const b = mk({ id: 'b1', agentId: 'style', severity: 'minor', confidence: 0.6, location: { file: 'a.ts', line: 1 }, ruleId: 'r1' });
    const c = mk({ id: 'c1', agentId: 'security', severity: 'critical', confidence: 0.95, location: { file: 'b.ts', line: 5 }, ruleId: 'r2' });
    const all = [a, b, c];
    const deduped = dedupeFindings(all);
    expect(deduped).toHaveLength(2);
    const ranked = rankFindings(deduped);
    expect(ranked[0]?.id).toBe('c1');
  });

  it('consensus score is higher when more agents agree', () => {
    const findings = [
      mk({ id: 'a', location: { file: 'a.ts', line: 1 } }),
      mk({ id: 'b', location: { file: 'a.ts', line: 1 } }),
      mk({ id: 'c', location: { file: 'a.ts', line: 1 } }),
    ];
    const single = consensusScore([findings[0]!]);
    const triple = consensusScore(findings);
    expect(triple).toBeGreaterThan(single * 2);
  });

  it('groups findings by key', () => {
    const findings = [
      mk({ id: 'a', location: { file: 'x.ts', line: 1 }, ruleId: 'r1' }),
      mk({ id: 'b', location: { file: 'x.ts', line: 1 }, ruleId: 'r1' }),
      mk({ id: 'c', location: { file: 'y.ts', line: 1 }, ruleId: 'r1' }),
    ];
    const groups = groupFindings(findings);
    expect(groups.size).toBe(2);
  });

  it('findingKey uses file:line:rule when location present', () => {
    const k = findingKey(mk({ location: { file: 'a.ts', line: 5 }, ruleId: 'r1' }));
    expect(k).toBe('a.ts:5:r1');
  });

  it('scoreFinding multiplies severity weight by confidence', () => {
    expect(scoreFinding(mk({ severity: 'blocker', confidence: 1 }))).toBe(25);
    expect(scoreFinding(mk({ severity: 'major', confidence: 0.5 }))).toBeCloseTo(2.5);
  });

  it('reviewScore sums ranked finding scores', () => {
    const findings = [
      mk({ id: 'a', location: { file: 'a.ts', line: 1 }, severity: 'critical', confidence: 1 }),
      mk({ id: 'b', location: { file: 'b.ts', line: 1 }, severity: 'major', confidence: 0.5 }),
    ];
    const s = reviewScore(findings);
    expect(s).toBeGreaterThan(10);
  });

  it('runParallel runs work in parallel', async () => {
    const start = Date.now();
    await runParallel(
      Array.from({ length: 4 }, () => async () => {
        await new Promise((r) => setTimeout(r, 50));
      }),
      { parallelism: 4 },
    );
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(150);
  });
});
