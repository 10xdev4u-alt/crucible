// @ts-nocheck — docs-site is a build tool, not a published package
/**
 * The Crucible docs site builder.
 *
 * Reads markdown files from `content/`, applies templates, and writes
 * static HTML to `dist/`.
 *
 * The site is intentionally framework-free — no React, Vue, or
 * Astro. Just TypeScript, a tiny markdown pipeline, and a hand-
 * written CSS theme. Production-grade and easy to host anywhere.
 */
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { marked } from 'marked';
import Prism from 'prismjs';

await import('prismjs/components/prism-typescript.js');
await import('prismjs/components/prism-javascript.js');
await import('prismjs/components/prism-json.js');
await import('prismjs/components/prism-bash.js');
await import('prismjs/components/prism-yaml.js');
await import('prismjs/components/prism-css.js');

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CONTENT_DIR = join(ROOT, 'content');
const DIST_DIR = join(ROOT, 'dist');
const THEME_DIR = join(ROOT, 'theme');

interface PageFrontmatter {
  title: string;
  description?: string;
  order?: number;
  category?: string;
  draft?: boolean;
  [key: string]: unknown;
}

interface Page {
  slug: string;
  path: string;
  frontmatter: PageFrontmatter;
  body: string;
  html: string;
}

interface SiteConfig {
  title: string;
  description: string;
  baseUrl: string;
  github: string;
  version: string;
}

const config: SiteConfig = {
  title: 'Crucible',
  description: 'Multi-agent code review orchestrator',
  baseUrl: 'https://10xdev4u-alt.github.io/crucible',
  github: 'https://github.com/10xdev4u-alt/crucible',
  version: '0.1.0',
};

// Configure marked with syntax highlighting
marked.setOptions({
  gfm: true,
  breaks: false,
  // @ts-expect-error marked-highlight integration
  highlight(code: string, lang: string): string {
    if (lang && Prism.languages[lang]) {
      // @ts-expect-error Prism typing
      return Prism.highlight(code, Prism.languages[lang], lang);
    }
    return code;
  },
});

const renderer = new marked.Renderer();
const originalCode = renderer.code.bind(renderer);
renderer.code = (code: { text: string; lang?: string; escaped?: boolean }): string => {
  const result = originalCode(code);
  const lang = code.lang ?? '';
  if (lang && (Prism.languages as Record<string, unknown>)[lang]) {
    return result.replace(/^<pre>/, `<pre data-lang="${lang}">`);
  }
  return result;
};

marked.use({ renderer });

export const readContent = (dir: string, base = ''): Page[] => {
  if (!existsSync(dir)) return [];
  const out: Page[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...readContent(fullPath, join(base, entry.name)));
    } else if (entry.name.endsWith('.md')) {
      const raw = readFileSync(fullPath, 'utf8');
      const { data, content } = matter(raw);
      const slug = base ? join(base, basename(entry.name, '.md')) : basename(entry.name, '.md');
      const html = marked.parse(content) as string;
      out.push({
        slug: slug.replace(/\\/g, '/'),
        path: fullPath,
        frontmatter: data as PageFrontmatter,
        body: content,
        html,
      });
    }
  }
  return out;
};

export const findIndex = (): Page | undefined => {
  const pages = readContent(CONTENT_DIR);
  return pages.find((p) => p.slug === 'index' || p.slug === 'README');
};

export const findNav = (): Page[] => {
  const pages = readContent(CONTENT_DIR);
  return pages
    .filter((p) => p.frontmatter.title && !p.frontmatter.draft)
    .sort((a, b) => {
      const ao = a.frontmatter.order ?? 999;
      const bo = b.frontmatter.order ?? 999;
      return ao - bo;
    });
};

export const escapeHtml = (s: string): string =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const baseLayout = ({
  title,
  description,
  content,
  nav,
  currentSlug,
  config,
}: {
  title: string;
  description: string;
  content: string;
  nav: NavItem[];
  currentSlug: string;
  config: SiteConfig;
}): string => {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)} — ${escapeHtml(config.title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<meta name="theme-color" content="#c2410c">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/assets/theme.css">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
</head>
<body>
<header class="topbar">
  <div class="topbar-inner">
    <a class="brand" href="/">
      <span class="brand-mark">⚒</span>
      <span class="brand-name">crucible</span>
      <span class="brand-tag">v${config.version}</span>
    </a>
    <nav class="topbar-nav">
      <a href="/docs/">Docs</a>
      <a href="/api/">API</a>
      <a href="/examples/">Examples</a>
      <a href="${config.github}" target="_blank" rel="noopener">GitHub ↗</a>
      <button class="theme-toggle" aria-label="Toggle dark mode" type="button">
        <span class="theme-icon-light">☼</span>
        <span class="theme-icon-dark">☾</span>
      </button>
    </nav>
  </div>
</header>
<div class="layout">
  <aside class="sidebar">
    <input class="search" type="search" placeholder="Search docs…" aria-label="Search documentation">
    <nav class="sidenav">
      ${renderNav(nav, currentSlug)}
    </nav>
  </aside>
  <main class="main">
    <article class="content">
      ${content}
    </article>
    <footer class="page-footer">
      <p>Found an issue? <a href="${config.github}/issues/new" target="_blank" rel="noopener">Open one on GitHub →</a></p>
    </footer>
  </main>
</div>
<script src="/assets/search.js" defer></script>
<script src="/assets/theme.js" defer></script>
</body>
</html>`;
};

interface NavItem {
  title: string;
  slug: string;
  category?: string;
  order: number;
}

const renderNav = (nav: NavItem[], currentSlug: string): string => {
  const groups: Record<string, NavItem[]> = {};
  for (const item of nav) {
    const cat = item.category ?? 'General';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(item);
  }
  const out: string[] = [];
  for (const [cat, items] of Object.entries(groups)) {
    out.push(`<div class="nav-group">`);
    out.push(`<h3 class="nav-group-title">${escapeHtml(cat)}</h3>`);
    out.push(`<ul>`);
    for (const item of items) {
      const active = item.slug === currentSlug ? ' active' : '';
      const url = item.slug === 'index' ? '/' : `/${item.slug}/`;
      out.push(`<li><a class="nav-link${active}" href="${url}">${escapeHtml(item.title)}</a></li>`);
    }
    out.push(`</ul>`);
    out.push(`</div>`);
  }
  return out.join('\n');
};

export const writePage = (page: Page, nav: NavItem[]): void => {
  const title = page.frontmatter.title ?? 'Untitled';
  const description = page.frontmatter.description ?? '';
  const html = baseLayout({
    title,
    description,
    content: page.html,
    nav,
    currentSlug: page.slug,
    config,
  });
  const outPath =
    page.slug === 'index' || page.slug === 'README'
      ? join(DIST_DIR, 'index.html')
      : join(DIST_DIR, page.slug, 'index.html');
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, html, 'utf8');
  console.log(`  wrote ${relative(ROOT, outPath)}`);
};

const writeRedirect = (from: string, to: string): void => {
  const html = `<!doctype html>
<html><head><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=${to}"><title>Redirecting…</title></head>
<body><p>Redirecting to <a href="${to}">${to}</a></p></body></html>`;
  const outPath = join(DIST_DIR, from, 'index.html');
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, html, 'utf8');
};

export const buildSearchIndex = (pages: Page[]): string => {
  const index = pages
    .filter((p) => !p.frontmatter.draft)
    .map((p) => ({
      title: p.frontmatter.title ?? 'Untitled',
      description: p.frontmatter.description ?? '',
      slug: p.slug,
      url: p.slug === 'index' || p.slug === 'README' ? '/' : `/${p.slug}/`,
      body: p.body.replace(/[#*`]/g, '').slice(0, 1000),
      category: p.frontmatter.category ?? 'General',
    }));
  return `window.__CRUCIBLE_INDEX__ = ${JSON.stringify(index)};`;
};

const copyAssets = (): void => {
  const assetsDir = join(THEME_DIR, 'assets');
  if (existsSync(assetsDir)) {
    const out = join(DIST_DIR, 'assets');
    mkdirSync(out, { recursive: true });
    cpSync(assetsDir, out, { recursive: true });
    console.log(`  copied assets/`);
  }
  const favicon = join(THEME_DIR, 'favicon.svg');
  if (existsSync(favicon)) {
    cpSync(favicon, join(DIST_DIR, 'favicon.svg'));
    console.log('  copied favicon.svg');
  }
};

export const build = async (): Promise<void> => {
  console.log('Building docs site…');
  if (!existsSync(CONTENT_DIR)) {
    console.error(`No content directory at ${CONTENT_DIR}`);
    process.exit(1);
  }
  mkdirSync(DIST_DIR, { recursive: true });
  const pages = readContent(CONTENT_DIR);
  const nav: NavItem[] = pages
    .filter((p) => p.frontmatter.title && !p.frontmatter.draft)
    .map((p) => ({
      title: p.frontmatter.title ?? 'Untitled',
      slug: p.slug,
      category: p.frontmatter.category,
      order: p.frontmatter.order ?? 999,
    }));
  for (const page of pages) {
    if (page.frontmatter.draft) continue;
    writePage(page, nav);
  }
  // Search index
  mkdirSync(join(DIST_DIR, 'assets'), { recursive: true });
  writeFileSync(join(DIST_DIR, 'assets', 'search-index.js'), buildSearchIndex(pages), 'utf8');
  copyAssets();
  // Redirects
  writeRedirect('docs', '/docs/getting-started/');
  console.log(`Done. ${pages.length} pages.`);
};

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
