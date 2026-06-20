/** A small retry decorator for async functions. */
export function retryable(options: {
  attempts?: number;
  delayMs?: number;
  backoff?: 'linear' | 'exponential' | 'constant';
  onError?: (err: unknown, attempt: number) => void;
} = {}) {
  const attempts = options.attempts ?? 3;
  const delayMs = options.delayMs ?? 100;
  const backoff = options.backoff ?? 'exponential';

  return function decorate<T extends (...args: never[]) => Promise<unknown>>(
    _target: unknown,
    _propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>,
  ): TypedPropertyDescriptor<T> {
    const original = descriptor.value!;
    descriptor.value = (async function (this: unknown, ...args: Parameters<T>) {
      let lastErr: unknown;
      for (let i = 0; i < attempts; i++) {
        try {
          return await original.apply(this, args);
        } catch (err) {
          lastErr = err;
          if (options.onError) options.onError(err, i);
          if (i === attempts - 1) break;
          let d = delayMs;
          if (backoff === 'exponential') d = delayMs * 2 ** i;
          if (backoff === 'linear') d = delayMs * (i + 1);
          await new Promise((r) => setTimeout(r, d));
        }
      }
      throw lastErr;
    }) as T;
    return descriptor;
  };
}
