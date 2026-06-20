/** Convert any value to a string suitable for stable hashing. */
export function stableStringify(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'bigint') return `${value.toString()}n`;
  if (typeof value === 'function') return `[Function: ${value.name || 'anonymous'}]`;
  if (typeof value === 'symbol') return value.toString();
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  if (value instanceof Date) {
    return `Date(${value.toISOString()})`;
  }
  if (value instanceof Map) {
    const entries = [...value.entries()].map(([k, v]) => `${stableStringify(k)}=>${stableStringify(v)}`);
    return `Map(${entries.join(',')})`;
  }
  if (value instanceof Set) {
    return `Set(${[...value].map(stableStringify).join(',')})`;
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    const parts = keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`);
    return `{${parts.join(',')}}`;
  }
  return String(value);
}
