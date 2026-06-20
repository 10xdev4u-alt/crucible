import { describe, expect, it } from 'vitest';
import { LogBuffer } from './log.js';

describe('LogBuffer', () => {
  it('logs at all levels', () => {
    const l = new LogBuffer();
    l.debug('d');
    l.info('i');
    l.warn('w');
    l.error('e');
    expect(l.recent()).toHaveLength(4);
    expect(l.byLevel('error')).toHaveLength(1);
  });

  it('preserves order', () => {
    const l = new LogBuffer();
    l.info('a');
    l.info('b');
    l.info('c');
    expect(l.recent().map((x) => x.message)).toEqual(['a', 'b', 'c']);
  });

  it('subscribes to new lines', () => {
    const l = new LogBuffer();
    const got: string[] = [];
    const unsub = l.subscribe((line) => got.push(line.message));
    l.info('hello');
    l.info('world');
    unsub();
    l.info('ignored');
    expect(got).toEqual(['hello', 'world']);
  });

  it('includes context when provided', () => {
    const l = new LogBuffer();
    l.info('hi', { user: 'x' });
    expect(l.recent()[0]?.context).toEqual({ user: 'x' });
  });

  it('clears', () => {
    const l = new LogBuffer();
    l.info('x');
    l.clear();
    expect(l.recent()).toEqual([]);
  });
});
