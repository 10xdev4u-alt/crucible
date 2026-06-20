import { describe, expect, it } from 'vitest';
import {
  isSeverityLevel,
  maxSeverity,
  SEVERITY_LEVELS,
  SEVERITY_WEIGHT,
  type SeverityLevel,
  severityAtLeast,
} from './severity.js';

describe('severity', () => {
  describe('SEVERITY_LEVELS', () => {
    it('lists levels in ascending order of weight', () => {
      for (let i = 0; i < SEVERITY_LEVELS.length - 1; i++) {
        const a = SEVERITY_LEVELS[i] as SeverityLevel;
        const b = SEVERITY_LEVELS[i + 1] as SeverityLevel;
        expect(SEVERITY_WEIGHT[a]).toBeLessThan(SEVERITY_WEIGHT[b]);
      }
    });

    it('is frozen as a const tuple', () => {
      expect(SEVERITY_LEVELS.length).toBe(5);
      expect(SEVERITY_LEVELS[0]).toBe('info');
      expect(SEVERITY_LEVELS[4]).toBe('blocker');
    });
  });

  describe('SEVERITY_WEIGHT', () => {
    it('assigns strictly positive weights', () => {
      for (const level of SEVERITY_LEVELS) {
        expect(SEVERITY_WEIGHT[level]).toBeGreaterThan(0);
      }
    });
  });

  describe('severityAtLeast', () => {
    it('returns true when a is more severe', () => {
      expect(severityAtLeast('critical', 'major')).toBe(true);
    });

    it('returns true when a equals b', () => {
      expect(severityAtLeast('major', 'major')).toBe(true);
    });

    it('returns false when a is less severe', () => {
      expect(severityAtLeast('minor', 'critical')).toBe(false);
    });
  });

  describe('isSeverityLevel', () => {
    it('returns true for valid levels', () => {
      for (const level of SEVERITY_LEVELS) {
        expect(isSeverityLevel(level)).toBe(true);
      }
    });

    it('returns false for invalid strings', () => {
      expect(isSeverityLevel('urgent')).toBe(false);
      expect(isSeverityLevel('')).toBe(false);
      expect(isSeverityLevel('INFO')).toBe(false);
    });

    it('returns false for non-strings', () => {
      expect(isSeverityLevel(1)).toBe(false);
      expect(isSeverityLevel(null)).toBe(false);
      expect(isSeverityLevel(undefined)).toBe(false);
      expect(isSeverityLevel({})).toBe(false);
    });
  });

  describe('maxSeverity', () => {
    it('returns the more severe level', () => {
      expect(maxSeverity('minor', 'critical')).toBe('critical');
      expect(maxSeverity('blocker', 'info')).toBe('blocker');
    });

    it('returns the level when equal', () => {
      expect(maxSeverity('major', 'major')).toBe('major');
    });
  });
});
