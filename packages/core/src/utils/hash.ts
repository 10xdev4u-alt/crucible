import { createHash } from 'node:crypto';

/** Returns a short, stable hash for a string. */
export function hashString(input: string, length = 12): string {
  return createHash('sha256').update(input).digest('hex').slice(0, length);
}

/** Returns a stable hash for an object (sorted keys). */
export function hashObject(obj: unknown, length = 12): string {
  const json = JSON.stringify(obj, (_, value) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return Object.keys(value as Record<string, unknown>)
        .sort()
        .reduce(
          (acc, k) => {
            acc[k] = (value as Record<string, unknown>)[k];
            return acc;
          },
          {} as Record<string, unknown>,
        );
    }
    return value;
  });
  return hashString(json, length);
}

/** Returns a stable hash for a file's path + content. */
export function hashFile(path: string, content: string | Buffer, length = 12): string {
  const h = createHash('sha256');
  h.update(path);
  h.update('\0');
  h.update(content);
  return h.digest('hex').slice(0, length);
}
