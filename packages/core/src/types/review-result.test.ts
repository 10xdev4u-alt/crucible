import { describe, expect, it } from 'vitest';
import {
  countByAgent,
  countByCategory,
  countBySeverity,
  type Finding,
} from './review-result';

const mk = (overrides: Partial<Finding>): Finding => ({
  id: 'x',
  agentId: 'a1',
  category: 'style',
  severity: 'minor',
  title: 't',
  message: 'm',
  confidence: 0.5,
  createdAt: '2026-06-20T00:00:00Z',
  ...overrides,
});

describe('review-result', () => {
  describe('countBySeverity', () => {
    it('groups findings by severity', () => {
      const fs = [mk({ severity: 'major' }), mk({ severity: 'major' }), mk({ severity: 'minor' })];
      expect(countBySeverity(fs)).toEqual({ major: 2, minor: 1 });
    });

    it('returns empty object for empty input', () => {
      expect(countBySeverity([])).toEqual({});
    });
  });

  describe('countByCategory', () => {
    it('groups findings by category', () => {
      const fs = [mk({ category: 'security' }), mk({ category: 'security' }), mk({ category: 'style' })];
      expect(countByCategory(fs)).toEqual({ security: 2, style: 1 });
    });
  });

  describe('countByAgent', () => {
    it('groups findings by agentId', () => {
      const fs = [mk({ agentId: 'a1' }), mk({ agentId: 'a1' }), mk({ agentId: 'a2' })];
      expect(countByAgent(fs)).toEqual({ a1: 2, a2: 1 });
    });
  });
});
