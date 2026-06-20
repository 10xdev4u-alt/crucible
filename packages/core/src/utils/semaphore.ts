/** A small semaphore for limiting concurrency. */
export class Semaphore {
  private available: number;
  private readonly waiters: Array<() => void> = [];

  constructor(available: number) {
    if (available < 1) throw new Error('Semaphore size must be >= 1');
    this.available = available;
  }

  /** Acquire a permit. Resolves when one is available. */
  async acquire(): Promise<void> {
    if (this.available > 0) {
      this.available -= 1;
      return;
    }
    return new Promise((resolve) => {
      this.waiters.push(resolve);
    });
  }

  /** Release a permit. Wakes one waiting caller if any. */
  release(): void {
    const next = this.waiters.shift();
    if (next) next();
    else this.available += 1;
  }

  /** Run an async function under a permit. */
  async run<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }

  /** Number of permits currently available. */
  availablePermits(): number {
    return this.available;
  }
}
