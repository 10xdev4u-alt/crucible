import { describe, expect, it, vi } from 'vitest';
import { EventBus } from './event-bus.js';

interface Events extends Record<string, unknown> {
  ping: { value: number };
  error: { message: string };
}

describe('EventBus', () => {
  it('emits and receives', async () => {
    const bus = new EventBus<Events>();
    const handler = vi.fn();
    bus.on('ping', handler);
    await bus.emit('ping', { value: 42 });
    expect(handler).toHaveBeenCalledWith({ value: 42 });
  });

  it('returns an unsubscribe function', async () => {
    const bus = new EventBus<Events>();
    const handler = vi.fn();
    const off = bus.on('ping', handler);
    off();
    await bus.emit('ping', { value: 1 });
    expect(handler).not.toHaveBeenCalled();
  });

  it('once fires only one time', async () => {
    const bus = new EventBus<Events>();
    const handler = vi.fn();
    bus.once('ping', handler);
    await bus.emit('ping', { value: 1 });
    await bus.emit('ping', { value: 2 });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('reports listener count', () => {
    const bus = new EventBus<Events>();
    bus.on('ping', () => {});
    bus.on('ping', () => {});
    expect(bus.listenerCount('ping')).toBe(2);
  });

  it('emits to multiple handlers in parallel', async () => {
    const bus = new EventBus<Events>();
    const order: string[] = [];
    bus.on('ping', async () => {
      order.push('a');
    });
    bus.on('ping', async () => {
      order.push('b');
    });
    await bus.emit('ping', { value: 1 });
    expect(order.sort()).toEqual(['a', 'b']);
  });
});
