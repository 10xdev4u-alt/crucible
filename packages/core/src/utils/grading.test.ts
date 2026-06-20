import { describe, expect, it } from 'vitest';
import { gradeForScore, riskScore, summarize } from './grading.js';

describe('grading', () => {
  it('gradeForScore maps to letter grades', () => {
    expect(gradeForScore(0)).toBe('A+');
    expect(gradeForScore(1)).toBe('A');
    expect(gradeForScore(10)).toBe('B');
    expect(gradeForScore(20)).toBe('C');
    expect(gradeForScore(40)).toBe('D');
    expect(gradeForScore(100)).toBe('F');
  });

  it('riskScore normalizes to 0-100', () => {
    expect(riskScore([])).toBe(0);
    expect(riskScore([{ severity: 'info', confidence: 1 }])).toBe(1);
    expect(riskScore([{ severity: 'blocker', confidence: 1 }])).toBe(25);
    expect(
      riskScore(Array.from({ length: 20 }, () => ({ severity: 'blocker', confidence: 1 }))),
    ).toBe(100);
  });

  it('summarize handles all cases', () => {
    expect(summarize(0, 0, 0)).toContain('Clean');
    expect(summarize(1, 1, 50)).toContain('critical');
    expect(summarize(5, 0, 35)).toContain('Significant');
    expect(summarize(2, 0, 15)).toContain('few');
    expect(summarize(1, 0, 5)).toContain('Minor');
  });
});
