import { describe, expect, it } from 'vitest';
import type { Finding } from '../types/finding.js';
import { dedupeFindings, findingKey, groupFindings } from './dedup.js';

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

describe('dedup', () => {
  describe('findingKey', () => {
    it('uses file:line:rule when location is present', () => {
      const k = findingKey(f({ location: { file: 'a.ts', line: 10 }, ruleId: 'no-var' }));
      expect(k).toBe('a.ts:10:no-var');
    });

    it('falls back to title when no location', () => {
      const k = findingKey(f({ title: 'untitled' }));
      expect(k).toBe('*:untitled');
    });
  });

  describe('dedupeFindings', () => {
    it('keeps the higher-confidence finding on tie', () => {
      const list = [
        f({ id: 'a', confidence: 0.5, location: { file: 'x', line: 1 } }),
        f({ id: 'b', confidence: 0.9, location: { file: 'x', line: 1 } }),
      ];
      const out = dedupeFindings(list);
      expect(out).toHaveLength(1);
      expect(out[0]?.id).toBe('b');
    });

    it('breaks confidence ties with severity', () => {
      const list = [
        f({ id: 'a', confidence: 0.5, severity: 'minor', location: { file: 'x', line: 1 } }),
        f({ id: 'b', confidence: 0.5, severity: 'major', location: { file: 'x', line: 1 } }),
      ];
      const out = dedupeFindings(list);
      expect(out[0]?.id).toBe('b');
    });

    it('returns unique findings unchanged', () => {
      const list = [
        f({ id: 'a', location: { file: 'x', line: 1 } }),
        f({ id: 'b', location: { file: 'x', line: 2 } }),
      ];
      expect(dedupeFindings(list)).toHaveLength(2);
    });
  });

  describe('groupFindings', () => {
    it('groups by key', () => {
      const list = [
        f({ id: 'a', location: { file: 'x', line: 1 }, ruleId: 'r1' }),
        f({ id: 'b', location: { file: 'x', line: 1 }, ruleId: 'r1' }),
        f({ id: 'c', location: { file: 'x', line: 2 }, ruleId: 'r1' }),
      ];
      const groups = groupFindings(list);
      expect(groups.size).toBe(2);
      expect(groups.get('x:1:r1')).toHaveLength(2);
      expect(groups.get('x:2:r1')).toHaveLength(1);
    });
  });
});
