import { describe, expect, it } from 'vitest';
import { FileInfo, findFiles, readFile, writeFile } from './fs.js';

describe('fs utilities', () => {
  describe('findFiles', () => {
    it('finds files matching a glob', () => {
      const files = findFiles('.', '*.json', { maxDepth: 1 });
      expect(files.length).toBeGreaterThan(0);
      expect(files.some((f) => f.endsWith('package.json'))).toBe(true);
    });

    it('respects maxDepth', () => {
      const shallow = findFiles('.', '*.json', { maxDepth: 1 });
      const deep = findFiles('.', '*.json', { maxDepth: 5 });
      expect(deep.length).toBeGreaterThanOrEqual(shallow.length);
    });
  });

  describe('readFile', () => {
    it('reads file content', () => {
      const content = readFile('package.json');
      expect(content).toContain('crucible');
    });

    it('returns null for missing file', () => {
      const content = readFile('this-does-not-exist-xyz123');
      expect(content).toBeNull();
    });
  });

  describe('writeFile', () => {
    it('writes file content', () => {
      const path = 'test-write-file.txt';
      const ok = writeFile(path, 'hello world');
      expect(ok).toBe(true);
      const read = readFile(path);
      expect(read).toBe('hello world');
      // Cleanup
      const { unlinkSync } = require('node:fs');
      unlinkSync(path);
    });

    it('returns false for unwritable path', () => {
      const ok = writeFile('/this/does/not/exist/file.txt', 'x');
      expect(ok).toBe(false);
    });
  });
});

void FileInfo;
