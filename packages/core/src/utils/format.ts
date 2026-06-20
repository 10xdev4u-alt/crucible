/** A simple byte-size formatter. */
export function formatBytes(n: number, decimals = 1): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(decimals)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(decimals)} MB`;
  if (n < 1024 * 1024 * 1024 * 1024) return `${(n / 1024 / 1024 / 1024).toFixed(decimals)} GB`;
  return `${(n / 1024 / 1024 / 1024 / 1024).toFixed(decimals)} TB`;
}

/** A simple duration formatter. */
export function formatDuration(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(0)}µs`;
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(2)}s`;
  const m = Math.floor(ms / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return `${m}m ${s}s`;
}

/** Format a number with thousand separators. */
export function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

/** Pluralize a word based on a count. */
export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}

/** Truncate a string to a maximum length with an ellipsis. */
export function truncate(s: string, max: number, suffix = '…'): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max - suffix.length)}${suffix}`;
}
