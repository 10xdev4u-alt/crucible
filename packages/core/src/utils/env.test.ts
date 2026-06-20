import { describe, expect, it } from 'vitest';
import {
  commandExists,
  commandVersion,
  cwd,
  homeDir,
  isLinux,
  isMac,
  isWindows,
  tmpDir,
} from './env.js';

describe('env utilities', () => {
  it('reports platform flags', () => {
    expect([isMac, isLinux, isWindows].filter(Boolean).length).toBeGreaterThanOrEqual(1);
  });

  it('returns cwd', () => {
    expect(typeof cwd()).toBe('string');
    expect(cwd().length).toBeGreaterThan(0);
  });

  it('returns home dir', () => {
    expect(typeof homeDir()).toBe('string');
  });

  it('returns temp dir', () => {
    expect(typeof tmpDir()).toBe('string');
    expect(tmpDir().length).toBeGreaterThan(0);
  });

  it('detects common commands', () => {
    // node should be available since we're running this test in it
    expect(commandExists('node')).toBe(true);
    expect(commandExists('this-command-definitely-does-not-exist-xyz123')).toBe(false);
  });

  it('returns command version or undefined', () => {
    const v = commandVersion('node');
    expect(typeof v).toBe('string');
    expect(commandVersion('this-command-definitely-does-not-exist-xyz123')).toBeUndefined();
  });
});
