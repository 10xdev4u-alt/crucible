#!/usr/bin/env node
// @ts-check
/**
 * A small dev server for the docs site.
 *
 * Usage: tsx scripts/serve.ts [port]
 */
import { createServer } from 'node:http';
import { readFileSync, statSync, existsSync } from 'node:fs';
import { join, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(__dirname, '..', 'dist');
const PORT = Number.parseInt(process.argv[2] ?? '8080', 10);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

const server = createServer((req, res) => {
  const url = req.url ?? '/';
  let path = url.split('?')[0] ?? '/';
  if (path.endsWith('/')) path += 'index.html';
  const file = join(DIST, path);
  if (!file.startsWith(DIST) || !existsSync(file) || !statSync(file).isFile()) {
    // SPA fallback
    const fallback = join(DIST, 'index.html');
    if (existsSync(fallback)) {
      const content = readFileSync(fallback);
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      res.end(content);
      return;
    }
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  const ext = extname(file);
  const content = readFileSync(file);
  res.writeHead(200, { 'content-type': MIME[ext] ?? 'application/octet-stream' });
  res.end(content);
});

server.listen(PORT, () => {
  console.log(`Docs server: http://localhost:${PORT}/`);
});
