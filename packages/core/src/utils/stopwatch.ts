/** A simple stopwatch for timing operations. */
export class Stopwatch {
  private startedAt: number | null = null;
  private elapsedMs = 0;

  start(): this {
    this.startedAt = Date.now();
    return this;
  }

  stop(): this {
    if (this.startedAt !== null) {
      this.elapsedMs += Date.now() - this.startedAt;
      this.startedAt = null;
    }
    return this;
  }

  reset(): this {
    this.elapsedMs = 0;
    this.startedAt = null;
    return this;
  }

  /** Returns elapsed time in milliseconds. */
  elapsed(): number {
    if (this.startedAt !== null) {
      return this.elapsedMs + (Date.now() - this.startedAt);
    }
    return this.elapsedMs;
  }

  /** Format the elapsed time as a human-friendly string. */
  format(): string {
    const ms = this.elapsed();
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60_000) return `${(ms / 1000).toFixed(2)}s`;
    const m = Math.floor(ms / 60_000);
    const s = Math.floor((ms % 60_000) / 1000);
    return `${m}m${s}s`;
  }
}

/** Run a function and time it. Returns [result, ms]. */
export async function timed<T>(fn: () => Promise<T>): Promise<[T, number]> {
  const start = Date.now();
  const result = await fn();
  return [result, Date.now() - start];
}
