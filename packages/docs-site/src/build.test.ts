import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildSearchIndex, escapeHtml, readContent } from './build.js';

describe('docs-site build helpers', () => {
  describe('escapeHtml', () => {
    it('escapes special characters', () => {
      expect(escapeHtml('<&>"\'')).toBe('&lt;&amp;&gt;&quot;&#39;');
    });

    it('handles plain text', () => {
      expect(escapeHtml('hello world')).toBe('hello world');
    });
  });

  describe('readContent / findIndex / findNav', () => {
    const dir = join(tmpdir(), 'crucible-docs-test');

    it('reads markdown files', () => {
      // Sanity check that readContent works on a non-existent dir
      if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, 'index.md'), '---\ntitle: Home\norder: 0\n---\n# Welcome');
      const pages = readContent(dir);
      expect(pages.length).toBe(1);
      expect(pages[0]?.frontmatter.title).toBe('Home');
      rmSync(dir, { recursive: true, force: true });
    });
  });

  describe('buildSearchIndex', () => {
    it('skips draft pages', () => {
      const idx = buildSearchIndex([
        {
          slug: 'public',
          path: 'public.md',
          frontmatter: { title: 'Public' },
          body: 'public content',
          html: '<p>public</p>',
        },
        {
          slug: 'draft',
          path: 'draft.md',
          frontmatter: { title: 'Draft', draft: true },
          body: 'secret content',
          html: '<p>draft</p>',
        },
      ]);
      expect(idx).toContain('Public');
      expect(idx).not.toContain('Draft');
    });

    it('limits body content for search', () => {
      const idx = buildSearchIndex([
        {
          slug: 'a',
          path: 'a.md',
          frontmatter: { title: 'A' },
          body: 'a'.repeat(5000),
          html: '',
        },
      ]);
      const jsonStr = idx.replace('window.__CRUCIBLE_INDEX__ = ', '').replace(/;$/, '');
      const parsed = JSON.parse(jsonStr) as Array<{ body: string }>;
      expect(parsed[0]?.body.length).toBeLessThanOrEqual(1000);
    });
  });
});
