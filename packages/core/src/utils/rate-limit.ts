/** A simple token-bucket rate limiter. */
export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly capacity: number;
  private readonly refillPerMs: number;

  /** Construct a rate limiter. `capacity` is the max burst; `perSecond` is the sustained rate. */
  constructor(capacity: number, perSecond: number) {
    if (capacity <= 0) throw new Error('capacity must be > 0');
    if (perSecond <= 0) throw new Error('perSecond must be > 0');
    this.capacity = capacity;
    this.refillPerMs = perSecond / 1000;
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  /** Acquire a token, waiting if necessary. Resolves when a token is available. */
  async acquire(): Promise<void> {
    while (true) {
      this.refill();
      if (this.tokens >= 1) {
        this.tokens -= 1;
        return;
      }
      const needed = 1 - this.tokens;
      const wait = Math.ceil(needed / this.refillPerMs);
      await new Promise((r) => setTimeout(r, wait));
    }
  }

  /** Try to acquire without waiting. Returns true if a token was acquired. */
  tryAcquire(): boolean {
    this.refill();
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }
    return false;
  }

  /** Returns the current number of available tokens (approximately). */
  available(): number {
    this.refill();
    return this.tokens;
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    if (elapsed > 0) {
      this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.refillPerMs);
      this.lastRefill = now;
    }
  }
}
