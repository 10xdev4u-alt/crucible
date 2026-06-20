import { describe, expect, it } from 'vitest';
import { formatBytes, formatDuration, formatNumber, pluralize, truncate } from './format.js';

describe('format utils', () => {
  it('formats bytes with proper units', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(500)).toBe('500 B');
    expect(formatBytes(2048)).toMatch(/KB/);
    expect(formatBytes(5 * 1024 * 1024)).toMatch(/MB/);
    expect(formatBytes(2 * 1024 * 1024 * 1024)).toMatch(/GB/);
    expect(formatBytes(3 * 1024 * 1024 * 1024 * 1024)).toMatch(/TB/);
  });

  it('formats durations', () => {
    expect(formatDuration(0.5)).toMatch(/µs/);
    expect(formatDuration(100)).toBe('100ms');
    expect(formatDuration(1500)).toMatch(/s/);
    expect(formatDuration(125_000)).toMatch(/m/);
  });

  it('formats numbers with separators', () => {
    expect(formatNumber(1234)).toBe('1,234');
    expect(formatNumber(1_234_567)).toBe('1,234,567');
  });

  it('pluralizes correctly', () => {
    expect(pluralize(0, 'apple')).toBe('apples');
    expect(pluralize(1, 'apple')).toBe('apple');
    expect(pluralize(2, 'apple')).toBe('apples');
    expect(pluralize(2, 'child', 'children')).toBe('children');
  });

  it('truncates with suffix', () => {
    expect(truncate('hello', 10)).toBe('hello');
    expect(truncate('hello world', 8)).toBe('hello w…');
    expect(truncate('hello', 5, '!!')).toBe('hello');
    expect(truncate('hello world', 8, '...')).toBe('hello...');
  });
});
