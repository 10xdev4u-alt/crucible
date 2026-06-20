import { describe, expect, it } from 'vitest';
import type { Finding } from '../types/finding.js';
import { consensusScore, rankFindings, reviewScore, scoreFinding } from './scorer.js';

const f = (overrides: Partial<Finding>): Finding => ({
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

describe('scorer', () => {
  describe('scoreFinding', () => {
    it('multiplies severity weight by confidence', () => {
      expect(scoreFinding(f({ severity: 'major', confidence: 0.5 }))).toBeCloseTo(2.5);
      expect(scoreFinding(f({ severity: 'critical', confidence: 1 }))).toBe(10);
    });
  });

  describe('consensusScore', () => {
    it('returns 0 for empty input', () => {
      expect(consensusScore([])).toBe(0);
    });

    it('applies agreement bonus for multiple agents', () => {
      const a = f({ id: 'a', severity: 'major', confidence: 1, location: { file: 'x', line: 1 } });
      const b = f({ id: 'b', severity: 'major', confidence: 1, location: { file: 'x', line: 1 } });
      const c = f({ id: 'c', severity: 'major', confidence: 1, location: { file: 'x', line: 1 } });
      const single = consensusScore([a]);
      const triple = consensusScore([a, b, c]);
      expect(triple).toBeGreaterThan(single * 2);
    });
  });

  describe('rankFindings', () => {
    it('sorts by score descending', () => {
      const list = [
        f({ id: 'a', severity: 'info', confidence: 0.5 }),
        f({ id: 'b', severity: 'critical', confidence: 1 }),
        f({ id: 'c', severity: 'major', confidence: 0.9 }),
      ];
      const ranked = rankFindings(list);
      expect(ranked[0]?.id).toBe('b');
    });

    it('dedupes by location+rule', () => {
      const list = [
        f({ id: 'a', location: { file: 'x', line: 1 }, ruleId: 'r1', confidence: 0.5 }),
        f({ id: 'b', location: { file: 'x', line: 1 }, ruleId: 'r1', confidence: 0.9 }),
      ];
      const ranked = rankFindings(list);
      expect(ranked).toHaveLength(1);
      expect(ranked[0]?.id).toBe('b');
    });
  });

  describe('reviewScore', () => {
    it('sums ranked finding scores', () => {
      const list = [
        f({ id: 'a', severity: 'major', confidence: 1, location: { file: 'a', line: 1 } }),
        f({ id: 'b', severity: 'minor', confidence: 0.5, location: { file: 'b', line: 1 } }),
      ];
      const score = reviewScore(list);
      expect(score).toBeCloseTo(5 + 1);
    });
  });
});
