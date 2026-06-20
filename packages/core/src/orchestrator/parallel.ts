/** Options for the parallel executor. */
export interface ParallelOptions {
  parallelism: number;
  timeoutMs?: number;
  signal?: AbortSignal;
}

/** A unit of work for the parallel executor. */
export type WorkItem<T> = () => Promise<T>;

/** Result of a parallel work item, including timing and any error. */
export interface ParallelResult<T> {
  ok: boolean;
  value?: T;
  error?: Error;
  durationMs: number;
  index: number;
}

/** Run work items in parallel with bounded concurrency. */
export async function runParallel<T>(
  items: readonly WorkItem<T>[],
  options: ParallelOptions,
): Promise<ParallelResult<T>[]> {
  const results: ParallelResult<T>[] = new Array(items.length);
  let cursor = 0;

  const workers = Array.from({ length: Math.min(options.parallelism, items.length) }, async () => {
    while (true) {
      if (options.signal?.aborted) return;
      const idx = cursor++;
      if (idx >= items.length) return;
      const start = Date.now();
      try {
        const value = await withTimeout(items[idx]!(), options.timeoutMs, options.signal);
        results[idx] = { ok: true, value, durationMs: Date.now() - start, index: idx };
      } catch (err) {
        results[idx] = {
          ok: false,
          error: err instanceof Error ? err : new Error(String(err)),
          durationMs: Date.now() - start,
          index: idx,
        };
      }
    }
  });

  await Promise.all(workers);
  return results;
}

async function withTimeout<T>(promise: Promise<T>, ms?: number, signal?: AbortSignal): Promise<T> {
  if (!ms && !signal) return promise;
  return new Promise<T>((resolve, reject) => {
    const timer = ms ? setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms) : null;
    const onAbort = () => reject(new Error('Aborted'));
    if (signal) {
      if (signal.aborted) {
        if (timer) clearTimeout(timer);
        reject(new Error('Aborted'));
        return;
      }
      signal.addEventListener('abort', onAbort, { once: true });
    }
    promise.then(
      (v) => {
        if (timer) clearTimeout(timer);
        if (signal) signal.removeEventListener('abort', onAbort);
        resolve(v);
      },
      (err) => {
        if (timer) clearTimeout(timer);
        if (signal) signal.removeEventListener('abort', onAbort);
        reject(err);
      },
    );
  });
}
