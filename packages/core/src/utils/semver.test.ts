import { describe, expect, it } from 'vitest';
import { isValidSemver, semverBump, versionCompare } from './semver.js';

describe('semver utilities', () => {
  describe('isValidSemver', () => {
    it('accepts valid semver', () => {
      expect(isValidSemver('1.0.0')).toBe(true);
      expect(isValidSemver('0.1.0')).toBe(true);
      expect(isValidSemver('1.0.0-rc.1')).toBe(true);
      expect(isValidSemver('1.0.0+build.123')).toBe(true);
    });

    it('rejects invalid semver', () => {
      expect(isValidSemver('1.0')).toBe(false);
      expect(isValidSemver('v1.0.0')).toBe(false);
      expect(isValidSemver('foo')).toBe(false);
      expect(isValidSemver('')).toBe(false);
    });
  });

  describe('versionCompare', () => {
    it('returns negative when a < b', () => {
      expect(versionCompare('1.0.0', '2.0.0')).toBeLessThan(0);
      expect(versionCompare('1.0.0', '1.1.0')).toBeLessThan(0);
      expect(versionCompare('1.0.0', '1.0.1')).toBeLessThan(0);
    });

    it('returns 0 when equal', () => {
      expect(versionCompare('1.0.0', '1.0.0')).toBe(0);
      expect(versionCompare('1.0.0-rc.1', '1.0.0-rc.1')).toBe(0);
    });

    it('returns positive when a > b', () => {
      expect(versionCompare('2.0.0', '1.0.0')).toBeGreaterThan(0);
      expect(versionCompare('1.1.0', '1.0.0')).toBeGreaterThan(0);
    });
  });

  describe('semverBump', () => {
    it('bumps major', () => {
      expect(semverBump('1.2.3', 'major')).toBe('2.0.0');
    });

    it('bumps minor', () => {
      expect(semverBump('1.2.3', 'minor')).toBe('1.3.0');
    });

    it('bumps patch', () => {
      expect(semverBump('1.2.3', 'patch')).toBe('1.2.4');
    });

    it('handles pre-release versions', () => {
      expect(semverBump('1.0.0-rc.1', 'patch')).toBe('1.0.0');
    });
  });
});
