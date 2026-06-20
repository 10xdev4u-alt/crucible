import { describe, expect, it } from 'vitest';
import type { ReviewRequest } from './review-request.js';

describe('review-request', () => {
  it('constructs a basic request', () => {
    const r: ReviewRequest = {
      id: 'r1',
      target: { kind: 'files', paths: ['src/a.ts'] },
      requestedAt: '2026-06-20T00:00:00Z',
    };
    expect(r.id).toBe('r1');
    expect(r.target.kind).toBe('files');
  });

  it('supports constraints', () => {
    const r: ReviewRequest = {
      id: 'r2',
      target: { kind: 'directory', path: 'src', recursive: true },
      constraints: {
        maxFindings: 50,
        categories: ['security', 'performance'],
      },
      requestedAt: '2026-06-20T00:00:00Z',
    };
    expect(r.constraints?.maxFindings).toBe(50);
    expect(r.constraints?.categories).toContain('security');
  });
});
