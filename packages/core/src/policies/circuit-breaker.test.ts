import { describe, expect, it, vi } from 'vitest';
import { CircuitBreaker } from './circuit-breaker.js';

describe('CircuitBreaker', () => {
  it('starts closed', () => {
    const cb = new CircuitBreaker();
    expect(cb.getState()).toBe('closed');
    expect(cb.canCall()).toBe(true);
  });

  it('opens after threshold failures', () => {
    const cb = new CircuitBreaker({ failureThreshold: 3 });
    cb.fail();
    cb.fail();
    cb.fail();
    expect(cb.getState()).toBe('open');
    expect(cb.canCall()).toBe(false);
  });

  it('half-opens after cooldown', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 2, cooldownMs: 10 });
    cb.fail();
    cb.fail();
    expect(cb.canCall()).toBe(false);
    await new Promise((r) => setTimeout(r, 15));
    expect(cb.canCall()).toBe(true);
    expect(cb.getState()).toBe('half-open');
  });

  it('closes on success after half-open', () => {
    const cb = new CircuitBreaker({ failureThreshold: 1, cooldownMs: 0 });
    cb.fail();
    expect(cb.getState()).toBe('open');
    cb.canCall();
    cb.succeed();
    expect(cb.getState()).toBe('closed');
  });

  it('re-opens on failure in half-open', () => {
    const cb = new CircuitBreaker({ failureThreshold: 1, cooldownMs: 0 });
    cb.fail();
    cb.canCall();
    cb.fail();
    expect(cb.getState()).toBe('open');
  });

  it('emits state change events', () => {
    const onStateChange = vi.fn();
    const cb = new CircuitBreaker({ failureThreshold: 1, onStateChange });
    cb.fail();
    expect(onStateChange).toHaveBeenCalledWith('open');
  });

  it('resets failure count on success', () => {
    const cb = new CircuitBreaker({ failureThreshold: 3 });
    cb.fail();
    cb.fail();
    cb.succeed();
    expect(cb.getFailureCount()).toBe(0);
  });
});
