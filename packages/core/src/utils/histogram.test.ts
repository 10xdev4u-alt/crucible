import { describe, expect, it } from 'vitest';
import { Histogram } from './histogram.js';

describe('Histogram', () => {
  it('adds and gets counts', () => {
    const h = new Histogram();
    h.add('a');
    h.add('a');
    h.add('b');
    expect(h.get('a')).toBe(2);
    expect(h.get('b')).toBe(1);
  });

  it('returns 0 for missing keys', () => {
    const h = new Histogram();
    expect(h.get('x')).toBe(0);
  });

  it('exposes keys, values, entries', () => {
    const h = new Histogram();
    h.add('a', 2);
    h.add('b', 3);
    expect(h.keys().sort()).toEqual(['a', 'b']);
    expect(h.values().sort()).toEqual([2, 3]);
    expect(h.entries().length).toBe(2);
  });

  it('computes total', () => {
    const h = new Histogram();
    h.add('a', 2);
    h.add('b', 3);
    expect(h.total()).toBe(5);
  });

  it('renders a bar chart', () => {
    const h = new Histogram();
    h.add('security', 5);
    h.add('style', 2);
    const out = h.render({ width: 10 });
    expect(out).toContain('security');
    expect(out).toContain('style');
    expect(out).toContain('█');
  });

  it('sorts entries when requested', () => {
    const h = new Histogram();
    h.add('a', 1);
    h.add('b', 5);
    h.add('c', 3);
    const out = h.render({ width: 5, sort: (x, y) => y[1] - x[1] });
    const lines = out.split('\n');
    expect(lines[0]?.startsWith('b')).toBe(true);
  });
});
