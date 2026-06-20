/** Deep clone a value using JSON round-trip. Fast but doesn't handle cycles. */
export function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/** Deep merge two plain objects (right wins). */
export function deepMerge<T extends Record<string, unknown>>(left: T, right: Partial<T>): T {
  const out: Record<string, unknown> = { ...left };
  for (const [k, v] of Object.entries(right)) {
    if (
      v !== null &&
      typeof v === 'object' &&
      !Array.isArray(v) &&
      out[k] !== null &&
      typeof out[k] === 'object' &&
      !Array.isArray(out[k])
    ) {
      out[k] = deepMerge(out[k] as Record<string, unknown>, v as Record<string, unknown>);
    } else {
      out[k] = v;
    }
  }
  return out as T;
}

/** Pick a subset of keys from an object. */
export function pick<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: readonly K[],
): Pick<T, K> {
  const out = {} as Pick<T, K>;
  for (const k of keys) out[k] = obj[k];
  return out;
}

/** Omit a subset of keys from an object. */
export function omit<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: readonly K[],
): Omit<T, K> {
  const out = { ...obj };
  for (const k of keys) delete out[k];
  return out;
}
