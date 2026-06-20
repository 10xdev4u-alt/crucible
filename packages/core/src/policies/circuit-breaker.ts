/** Circuit breaker states. */
export type CircuitState = 'closed' | 'open' | 'half-open';

/** A simple circuit breaker. */
export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private consecutiveFailures = 0;
  private openedAt = 0;
  private readonly failureThreshold: number;
  private readonly cooldownMs: number;
  private readonly onStateChange?: (state: CircuitState) => void;

  constructor(options: { failureThreshold?: number; cooldownMs?: number; onStateChange?: (s: CircuitState) => void } = {}) {
    this.failureThreshold = options.failureThreshold ?? 5;
    this.cooldownMs = options.cooldownMs ?? 30_000;
    if (options.onStateChange) this.onStateChange = options.onStateChange;
  }

  /** Returns true if calls should be allowed. */
  canCall(): boolean {
    if (this.state === 'closed') return true;
    if (this.state === 'open') {
      if (Date.now() - this.openedAt >= this.cooldownMs) {
        this.transition('half-open');
        return true;
      }
      return false;
    }
    // half-open: allow one trial
    return true;
  }

  /** Report a successful call. */
  succeed(): void {
    this.consecutiveFailures = 0;
    if (this.state !== 'closed') this.transition('closed');
  }

  /** Report a failed call. */
  fail(): void {
    this.consecutiveFailures += 1;
    if (this.state === 'half-open' || this.consecutiveFailures >= this.failureThreshold) {
      this.openedAt = Date.now();
      this.transition('open');
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  getFailureCount(): number {
    return this.consecutiveFailures;
  }

  private transition(next: CircuitState): void {
    if (this.state === next) return;
    this.state = next;
    if (this.onStateChange) this.onStateChange(next);
  }
}
