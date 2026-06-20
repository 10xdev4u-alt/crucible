/** A tiny retry helper with exponential backoff. */
export interface RetryOptions {
  retries: number;
  baseMs?: number;
  maxMs?: number;
  factor?: number;
  jitter?: boolean;
  onRetry?: (err: unknown, attempt: number) => void;
  shouldRetry?: (err: unknown) => boolean;
}

export async function retry<T>(fn: () => Promise<T>, options: RetryOptions): Promise<T> {
  const base = options.baseMs ?? 100;
  const factor = options.factor ?? 2;
  const max = options.maxMs ?? 30_000;
  const jitter = options.jitter ?? true;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= options.retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt === options.retries) break;
      if (options.shouldRetry && !options.shouldRetry(err)) throw err;
      if (options.onRetry) options.onRetry(err, attempt);
      let delay = base * factor ** attempt;
      if (jitter) delay = delay / 2 + Math.random() * (delay / 2);
      delay = Math.min(delay, max);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

/** Returns true if the error looks like a transient network or rate-limit issue. */
export function isTransientError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  if (msg.includes('rate limit') || msg.includes('rate_limit')) return true;
  if (msg.includes('timeout') || msg.includes('timed out')) return true;
  if (msg.includes('econnreset') || msg.includes('econnrefused')) return true;
  if (msg.includes('429') || msg.includes('503') || msg.includes('504')) return true;
  return false;
}
