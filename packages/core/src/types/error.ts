/** A custom error class for the core package. */
export class CrucibleError extends Error {
  public readonly code: string;
  public readonly details?: Record<string, unknown>;

  constructor(message: string, code: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'CrucibleError';
    this.code = code;
    if (details !== undefined) {
      this.details = details;
    }
  }
}

/** Error codes used across the core. */
export const ERROR_CODES = {
  CONFIG_INVALID: 'CONFIG_INVALID',
  CONFIG_MISSING: 'CONFIG_MISSING',
  PROVIDER_NOT_FOUND: 'PROVIDER_NOT_FOUND',
  PROVIDER_AUTH_FAILED: 'PROVIDER_AUTH_FAILED',
  PROVIDER_RATE_LIMITED: 'PROVIDER_RATE_LIMITED',
  PROVIDER_ERROR: 'PROVIDER_ERROR',
  AGENT_NOT_FOUND: 'AGENT_NOT_FOUND',
  AGENT_TIMEOUT: 'AGENT_TIMEOUT',
  AGENT_ERROR: 'AGENT_ERROR',
  REVIEW_TIMEOUT: 'REVIEW_TIMEOUT',
  REVIEW_CANCELLED: 'REVIEW_CANCELLED',
  CACHE_ERROR: 'CACHE_ERROR',
  DIFF_PARSE_ERROR: 'DIFF_PARSE_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  INTERNAL: 'INTERNAL',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/** Wraps a thrown value into a CrucibleError. */
export function wrapError(err: unknown, code: ErrorCode, message?: string): CrucibleError {
  if (err instanceof CrucibleError) return err;
  if (err instanceof Error) {
    return new CrucibleError(message ?? err.message, code, { cause: err.message });
  }
  return new CrucibleError(message ?? String(err), code);
}
