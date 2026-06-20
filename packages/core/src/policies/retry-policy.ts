/** A simple retry policy for an agent. */
export interface RetryPolicy {
  /** Max number of retries (in addition to the first attempt). */
  maxRetries: number;
  /** Initial delay in ms. */
  initialDelayMs: number;
  /** Maximum delay in ms. */
  maxDelayMs: number;
  /** Multiplier for the backoff. */
  backoffMultiplier: number;
  /** Optional predicate to decide whether an error is retryable. */
  shouldRetry?: (error: unknown, attempt: number) => boolean;
}

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxRetries: 3,
  initialDelayMs: 100,
  maxDelayMs: 30_000,
  backoffMultiplier: 2,
};

/** Compute the next delay given an attempt number. */
export function backoffDelay(policy: RetryPolicy, attempt: number, jitter = 0.1): number {
  const base = policy.initialDelayMs * policy.backoffMultiplier ** attempt;
  const cap = policy.maxDelayMs;
  const bounded = Math.min(base, cap);
  if (jitter === 0) return bounded;
  const jitterAmount = bounded * jitter;
  return bounded - jitterAmount + Math.random() * 2 * jitterAmount;
}

/** Run a function with retries according to a policy. */
export async function withRetries<T>(fn: () => Promise<T>, policy: RetryPolicy = DEFAULT_RETRY_POLICY): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= policy.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt === policy.maxRetries) break;
      if (policy.shouldRetry && !policy.shouldRetry(err, attempt)) throw err;
      const delay = backoffDelay(policy, attempt);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastError;
}
