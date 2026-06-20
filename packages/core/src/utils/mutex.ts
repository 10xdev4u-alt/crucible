/** A simple async mutex for serializing access to a resource. */
export class Mutex {
  private locked = false;
  private waiters: Array<() => void> = [];

  /** Acquire the lock. Resolves when acquired. */
  async acquire(): Promise<() => void> {
    if (!this.locked) {
      this.locked = true;
      return () => this.release();
    }
    return new Promise((resolve) => {
      this.waiters.push(() => {
        this.locked = true;
        resolve(() => this.release());
      });
    });
  }

  /** Run a function under the lock. */
  async run<T>(fn: () => Promise<T>): Promise<T> {
    const release = await this.acquire();
    try {
      return await fn();
    } finally {
      release();
    }
  }

  /** True if the lock is currently held. */
  isLocked(): boolean {
    return this.locked;
  }

  /** Number of waiters. */
  waiterCount(): number {
    return this.waiters.length;
  }

  private release(): void {
    this.locked = false;
    const next = this.waiters.shift();
    if (next) next();
  }
}
