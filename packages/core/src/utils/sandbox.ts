/** A minimal sandbox for running untrusted code paths in isolation. */
export class Sandbox {
  private readonly timeoutMs: number;
  private readonly maxMemoryMb: number;
  private readonly allowedEnv: ReadonlySet<string>;

  constructor(options: { timeoutMs?: number; maxMemoryMb?: number; allowedEnv?: readonly string[] } = {}) {
    this.timeoutMs = options.timeoutMs ?? 30_000;
    this.maxMemoryMb = options.maxMemoryMb ?? 512;
    this.allowedEnv = new Set(options.allowedEnv ?? []);
  }

  /** Run a function with the configured limits. Throws on timeout. */
  async run<T>(fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    const result = await Promise.race([
      fn(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Sandbox timeout after ${this.timeoutMs}ms`)), this.timeoutMs),
      ),
    ]);
    if (Date.now() - start > this.timeoutMs) {
      throw new Error('Sandbox timeout');
    }
    return result;
  }

  /** Returns a filtered environment object containing only the allowed keys. */
  env(): Record<string, string> {
    const out: Record<string, string> = {};
    for (const key of this.allowedEnv) {
      const v = process.env[key];
      if (v !== undefined) out[key] = v;
    }
    return out;
  }

  /** Approximate memory check. */
  checkMemory(): { usedMb: number; limitMb: number; ok: boolean } {
    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    return { usedMb: used, limitMb: this.maxMemoryMb, ok: used < this.maxMemoryMb };
  }
}
