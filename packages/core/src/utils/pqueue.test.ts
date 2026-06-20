import { describe, expect, it } from 'vitest';
import { PriorityQueue } from './pqueue.js';

describe('PriorityQueue', () => {
  it('returns the highest-priority element first (min-heap)', () => {
    const q = new PriorityQueue<number>((a, b) => a - b);
    q.push(5);
    q.push(1);
    q.push(3);
    expect(q.pop()).toBe(1);
    expect(q.pop()).toBe(3);
    expect(q.pop()).toBe(5);
    expect(q.pop()).toBeUndefined();
  });

  it('works as a max-heap with reverse comparator', () => {
    const q = new PriorityQueue<number>((a, b) => b - a);
    q.push(1);
    q.push(5);
    q.push(3);
    expect(q.pop()).toBe(5);
    expect(q.pop()).toBe(3);
    expect(q.pop()).toBe(1);
  });

  it('peeks without popping', () => {
    const q = new PriorityQueue<number>((a, b) => a - b);
    q.push(2);
    q.push(1);
    expect(q.peek()).toBe(1);
    expect(q.size()).toBe(2);
  });

  it('reports size and emptiness', () => {
    const q = new PriorityQueue<number>((a, b) => a - b);
    expect(q.isEmpty()).toBe(true);
    q.push(1);
    expect(q.isEmpty()).toBe(false);
    expect(q.size()).toBe(1);
  });

  it('handles complex types', () => {
    interface Task {
      name: string;
      priority: number;
    }
    const q = new PriorityQueue<Task>((a, b) => a.priority - b.priority);
    q.push({ name: 'low', priority: 1 });
    q.push({ name: 'high', priority: 10 });
    q.push({ name: 'mid', priority: 5 });
    expect(q.pop()?.name).toBe('low');
    expect(q.pop()?.name).toBe('mid');
    expect(q.pop()?.name).toBe('high');
  });
});
