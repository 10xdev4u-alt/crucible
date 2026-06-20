import { describe, expect, it } from 'vitest';
import { estimateCost, estimateTokens, formatCost, TokenTally } from './tokens.js';

describe('tokens', () => {
  it('estimates tokens by character count', () => {
    expect(estimateTokens('')).toBe(0);
    expect(estimateTokens('abcd')).toBe(1);
    expect(estimateTokens('a'.repeat(100))).toBe(25);
  });

  it('estimates cost', () => {
    const cost = estimateCost(1000, 500, 0.000003, 0.000015);
    expect(cost).toBeCloseTo(0.003 + 0.0075);
  });

  it('formats cost', () => {
    expect(formatCost(0)).toBe('$0.000000');
    expect(formatCost(0.5)).toMatch(/\$/);
  });

  it('TokenTally tracks input/output/cost', () => {
    const t = new TokenTally();
    t.record(100, 50, 0.000003, 0.000015);
    t.record(200, 100, 0.000003, 0.000015);
    const s = t.total();
    expect(s.input).toBe(300);
    expect(s.output).toBe(150);
    expect(s.total).toBe(450);
  });

  it('TokenTally merges and resets', () => {
    const a = new TokenTally();
    a.record(100, 50);
    const b = new TokenTally();
    b.record(200, 100);
    a.merge(b);
    expect(a.total().input).toBe(300);
    a.reset();
    expect(a.total().input).toBe(0);
  });
});
