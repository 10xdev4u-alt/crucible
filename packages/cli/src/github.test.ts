import { describe, expect, it, vi } from 'vitest';
import { formatPRComment, GitHubCommenter } from './github.js';

describe('GitHubCommenter', () => {
  const fetchMock = (response: { status: number; body?: unknown }) =>
    vi.fn(async () => ({
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      text: async () => (typeof response.body === 'string' ? response.body : JSON.stringify(response.body ?? {})),
      json: async () => response.body ?? {},
    })) as unknown as typeof fetch;

  it('posts a comment via the GitHub API', async () => {
    const f = fetchMock({ status: 201, body: { id: 1, html_url: 'https://gh/c/1' } });
    const c = new GitHubCommenter({ token: 'tkn', fetchImpl: f });
    const r = await c.postComment({ owner: 'me', repo: 'crucible', prNumber: 7, body: 'hi' });
    expect(r.id).toBe(1);
    expect(r.url).toBe('https://gh/c/1');
    expect(f).toHaveBeenCalled();
  });

  it('throws on non-2xx', async () => {
    const f = fetchMock({ status: 401, body: { message: 'unauth' } });
    const c = new GitHubCommenter({ token: 'tkn', fetchImpl: f });
    await expect(
      c.postComment({ owner: 'me', repo: 'crucible', prNumber: 1, body: 'x' }),
    ).rejects.toThrow(/401/);
  });
});

describe('formatPRComment', () => {
  it('handles empty findings', () => {
    const s = formatPRComment([], 0);
    expect(s).toContain('Crucible review');
    expect(s).toContain('No findings');
  });

  it('includes severity breakdown', () => {
    const s = formatPRComment(
      [
        { severity: 'critical', title: 'A', message: 'm', file: 'a.ts', line: 1 },
        { severity: 'major', title: 'B', message: 'm', file: 'b.ts', line: 2 },
      ],
      10,
    );
    expect(s).toContain('critical');
    expect(s).toContain('major');
    expect(s).toContain('a.ts');
  });

  it('truncates long messages', () => {
    const s = formatPRComment(
      [{ severity: 'minor', title: 'x', message: 'y'.repeat(500) }],
      1,
    );
    expect(s).toContain('...');
  });
});
