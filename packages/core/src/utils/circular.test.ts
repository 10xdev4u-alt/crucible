import { describe, expect, it } from 'vitest';
import { CircularBuffer } from './circular.js';

describe('CircularBuffer', () => {
  it('starts empty', () => {
    const b = new CircularBuffer<number>(3);
    expect(b.length).toBe(0);
    expect(b.last()).toBeUndefined();
    expect(b.toArray()).toEqual([]);
  });

  it('preserves order under capacity', () => {
    const b = new CircularBuffer<number>(3);
    b.push(1);
    b.push(2);
    expect(b.length).toBe(2);
    expect(b.toArray()).toEqual([1, 2]);
    expect(b.last()).toBe(2);
  });

  it('overwrites oldest when full', () => {
    const b = new CircularBuffer<number>(3);
    b.push(1);
    b.push(2);
    b.push(3);
    b.push(4);
    expect(b.length).toBe(3);
    expect(b.toArray()).toEqual([2, 3, 4]);
    expect(b.last()).toBe(4);
  });

  it('rejects invalid capacity', () => {
    expect(() => new CircularBuffer(0)).toThrow();
  });

  it('clears', () => {
    const b = new CircularBuffer<number>(3);
    b.push(1);
    b.push(2);
    b.clear();
    expect(b.length).toBe(0);
  });
});
