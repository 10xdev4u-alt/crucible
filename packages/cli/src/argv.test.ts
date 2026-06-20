import { describe, expect, it } from 'vitest';
import { getBoolean, getList, getString, parseArgs } from './argv.js';

describe('parseArgs', () => {
  it('parses positionals', () => {
    const r = parseArgs(['review', 'src/']);
    expect(r.positionals).toEqual(['review', 'src/']);
  });

  it('parses --key value', () => {
    const r = parseArgs(['review', '--format', 'json']);
    expect(r.flags.format).toBe('json');
  });

  it('parses --key=value', () => {
    const r = parseArgs(['review', '--format=json']);
    expect(r.flags.format).toBe('json');
  });

  it('parses boolean flags', () => {
    const r = parseArgs(['review', '--verbose']);
    expect(r.flags.verbose).toBe(true);
  });

  it('parses short flags', () => {
    const r = parseArgs(['review', '-f', 'json']);
    expect(r.flags.format).toBe('json');
  });

  it('parses combined short flags', () => {
    const r = parseArgs(['review', '-vh']);
    expect(r.flags.verbose).toBe(true);
    expect(r.flags.help).toBe(true);
  });

  it('returns false for a missing flag', () => {
    const r = parseArgs(['review']);
    expect(getBoolean(r.flags, 'verbose')).toBe(false);
  });
});

describe('getString', () => {
  it('returns the string value when set', () => {
    expect(getString({ format: 'json' }, 'format')).toBe('json');
  });

  it('returns the fallback for missing keys', () => {
    expect(getString({}, 'format', 'text')).toBe('text');
  });

  it('returns the fallback for boolean values', () => {
    expect(getString({ format: true }, 'format', 'text')).toBe('text');
  });
});

describe('getList', () => {
  it('returns empty array for missing keys', () => {
    expect(getList({}, 'agents')).toEqual([]);
  });

  it('splits comma-separated values', () => {
    expect(getList({ agents: 'a,b,c' }, 'agents')).toEqual(['a', 'b', 'c']);
  });
});
