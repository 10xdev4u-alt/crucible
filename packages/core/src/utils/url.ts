/** A small URL helper. */
export function parseUrl(url: string): URL | null {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

export function isValidUrl(url: string): boolean {
  return parseUrl(url) !== null;
}

export function joinUrl(base: string, path: string): string {
  const u = parseUrl(base);
  if (!u) return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
  const p = path.replace(/^\//, '');
  return `${u.origin}${u.pathname.replace(/\/$/, '')}/${p}`;
}

export function isGitHubUrl(url: string): boolean {
  return /^https?:\/\/(www\.)?github\.com\//.test(url);
}

export function parseGitHubPr(url: string): { owner: string; repo: string; number: number } | null {
  const m = url.match(/^https?:\/\/(www\.)?github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
  if (!m) return null;
  return { owner: m[2]!, repo: m[3]!, number: Number.parseInt(m[4]!, 10) };
}
