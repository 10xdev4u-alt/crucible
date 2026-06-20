import { describe, expect, it } from 'vitest';
import { isGitHubUrl, isValidUrl, joinUrl, parseGitHubPr, parseUrl } from './url.js';

describe('url utilities', () => {
  describe('parseUrl', () => {
    it('parses valid URLs', () => {
      expect(parseUrl('https://example.com/path')?.host).toBe('example.com');
    });

    it('returns null for invalid URLs', () => {
      expect(parseUrl('not a url')).toBeNull();
    });
  });

  describe('isValidUrl', () => {
    it('returns true for valid URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
    });

    it('returns false for invalid URLs', () => {
      expect(isValidUrl('not a url')).toBe(false);
    });
  });

  describe('joinUrl', () => {
    it('joins base and path', () => {
      expect(joinUrl('https://api.example.com', 'users')).toBe('https://api.example.com/users');
    });

    it('handles trailing slash on base', () => {
      expect(joinUrl('https://api.example.com/', 'users')).toBe('https://api.example.com/users');
    });

    it('handles leading slash on path', () => {
      expect(joinUrl('https://api.example.com', '/users')).toBe('https://api.example.com/users');
    });
  });

  describe('isGitHubUrl', () => {
    it('detects github.com', () => {
      expect(isGitHubUrl('https://github.com/foo/bar')).toBe(true);
      expect(isGitHubUrl('https://www.github.com/foo/bar')).toBe(true);
    });

    it('rejects non-github URLs', () => {
      expect(isGitHubUrl('https://gitlab.com/foo/bar')).toBe(false);
    });
  });

  describe('parseGitHubPr', () => {
    it('parses a PR URL', () => {
      const r = parseGitHubPr('https://github.com/10xdev4u-alt/crucible/pull/42');
      expect(r).toEqual({ owner: '10xdev4u-alt', repo: 'crucible', number: 42 });
    });

    it('returns null for non-PR URLs', () => {
      expect(parseGitHubPr('https://github.com/foo/bar')).toBeNull();
    });
  });
});
