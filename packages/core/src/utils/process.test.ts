import { describe, expect, it } from 'vitest';
import { getVersion, hasCommand, os, pathExists } from './process.js';

describe('process utilities', () => {
  it('detects node', () => {
    expect(hasCommand('node')).toBe(true);
  });

  it('returns false for missing commands', () => {
    expect(hasCommand('this-command-definitely-does-not-exist-xyz-12345')).toBe(false);
  });

  it('gets node version', () => {
    const v = getVersion('node');
    expect(v).toMatch(/^v?\d+\.\d+\.\d+/);
  });

  it('returns undefined for missing commands', () => {
    expect(getVersion('this-command-definitely-does-not-exist-xyz-12345')).toBeUndefined();
  });

  it('reports OS', () => {
    expect(['macos', 'linux', 'windows', 'unknown']).toContain(os());
  });

  it('pathExists returns true for existing paths', () => {
    expect(pathExists('/tmp')).toBe(true);
    expect(pathExists('/this/does/not/exist/12345')).toBe(false);
  });
});
