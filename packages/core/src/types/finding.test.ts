import { describe, expect, it } from 'vitest';
import { FINDING_CATEGORIES, type Finding, findingAtSeverity, hasFix } from './finding.js';

const baseFinding = (overrides: Partial<Finding> = {}): Finding => ({
  id: 'f1',
  agentId: 'a1',
  category: 'style',
  severity: 'major',
  title: 'Test finding',
  message: 'Test message',
  confidence: 0.9,
  createdAt: '2026-06-20T00:00:00Z',
  ...overrides,
});

describe('finding', () => {
  describe('FINDING_CATEGORIES', () => {
    it('contains the standard categories', () => {
      expect(FINDING_CATEGORIES).toContain('security');
      expect(FINDING_CATEGORIES).toContain('performance');
      expect(FINDING_CATEGORIES).toContain('style');
      expect(FINDING_CATEGORIES).toContain('architecture');
      expect(FINDING_CATEGORIES).toContain('accessibility');
      expect(FINDING_CATEGORIES).toContain('testing');
    });

    it('has no duplicates', () => {
      const set = new Set(FINDING_CATEGORIES);
      expect(set.size).toBe(FINDING_CATEGORIES.length);
    });
  });

  describe('findingAtSeverity', () => {
    it('returns true when the finding is more severe than the level', () => {
      const f = baseFinding({ severity: 'critical' });
      expect(findingAtSeverity(f, 'major')).toBe(true);
    });

    it('returns true when the finding equals the level', () => {
      const f = baseFinding({ severity: 'major' });
      expect(findingAtSeverity(f, 'major')).toBe(true);
    });

    it('returns false when the finding is less severe than the level', () => {
      const f = baseFinding({ severity: 'minor' });
      expect(findingAtSeverity(f, 'critical')).toBe(false);
    });
  });

  describe('hasFix', () => {
    it('returns true when a diff is provided', () => {
      const f = baseFinding({ fix: { description: 'x', diff: 'y' } });
      expect(hasFix(f)).toBe(true);
    });

    it('returns true when a replacement is provided', () => {
      const f = baseFinding({ fix: { description: 'x', replacement: 'y' } });
      expect(hasFix(f)).toBe(true);
    });

    it('returns false when no fix is provided', () => {
      const f = baseFinding();
      expect(hasFix(f)).toBe(false);
    });

    it('returns false when the fix has neither diff nor replacement', () => {
      const f = baseFinding({ fix: { description: 'x' } });
      expect(hasFix(f)).toBe(false);
    });
  });
});
