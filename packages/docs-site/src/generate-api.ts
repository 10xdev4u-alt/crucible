/**
 * Generates an API reference page from the core package's source code.
 *
 * Scans for `export` statements, extracts JSDoc comments, and writes a
 * markdown table of every exported symbol.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..', '..');
const CORE_SRC = join(ROOT, 'packages', 'core', 'src');
const _TEMPLATE = join(__dirname, '..', 'content', 'api', 'reference.template.md');
const _OUTPUT = join(__dirname, '..', 'content', 'api', 'reference.md');

interface ExportInfo {
  name: string;
  kind: 'function' | 'class' | 'type' | 'interface' | 'const' | 're-export' | 'enum';
  source: string;
  doc: string;
  line: number;
}

const KINDS = {
  FUNCTION: /^export\s+(?:async\s+)?function\s+(\w+)/,
  CLASS: /^export\s+(?:abstract\s+)?class\s+(\w+)/,
  TYPE: /^export\s+type\s+(\w+)/,
  INTERFACE: /^export\s+interface\s+(\w+)/,
  CONST: /^export\s+const\s+(\w+)/,
  REEXPORT: /^export\s+(?:\*|{[^}]+})\s+from/,
  ENUM: /^export\s+(?:const\s+)?enum\s+(\w+)/,
};

const detectKind = (line: string): { kind: ExportInfo['kind']; name: string } | null => {
  for (const [kind, re] of Object.entries(KINDS) as Array<[ExportInfo['kind'], RegExp]>) {
    const m = line.match(re);
    if (m) return { kind, name: m[1] ?? '<unknown>' };
  }
  return null;
};

const extractDoc = (lines: string[], lineIdx: number): string => {
  const doc: string[] = [];
  let i = lineIdx - 1;
  while (i >= 0) {
    const line = lines[i] ?? '';
    const m = line.match(/^\s*\*\s?(.*)$/);
    if (m) {
      doc.unshift((m[1] ?? '').trim());
      i -= 1;
      continue;
    }
    if (line.match(/^\s*\/\*\*/)) {
      // start of block
      break;
    }
    if (line.trim() === '' || line.match(/^\s*\*\/$/)) {
      i -= 1;
      continue;
    }
    break;
  }
  return doc
    .filter((l) => l.length > 0)
    .slice(0, 2)
    .join(' ');
};

const walk = (dir: string, out: ExportInfo[] = []): ExportInfo[] => {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '__tests__' || entry.name === 'test' || entry.name === 'node_modules')
        continue;
      walk(fullPath, out);
      continue;
    }
    if (!entry.name.endsWith('.ts')) continue;
    if (entry.name.endsWith('.test.ts')) continue;
    if (entry.name === 'index.ts') {
      // Count re-exports
      const content = readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i] ?? '';
        // Skip `export * from` and `export type * from`
        if (/^export\s+\*\s+from/.test(line)) continue;
        const m = line.match(/^export\s+\{([^}]+)\}\s+from/);
        if (m) {
          const names = (m[1] ?? '')
            .split(',')
            .map(
              (s) =>
                s
                  .trim()
                  .split(/\s+as\s+/)
                  .pop()
                  ?.trim() ?? s.trim(),
            )
            .filter((n) => n && !n.startsWith('type '));
          for (const name of names) {
            out.push({
              name,
              kind: 're-export',
              source: relative(ROOT, fullPath),
              doc: '',
              line: i + 1,
            });
          }
        }
      }
      continue;
    }
    const content = readFileSync(fullPath, 'utf8');
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? '';
      if (!line.startsWith('export')) continue;
      const detected = detectKind(line);
      if (!detected) continue;
      const doc = extractDoc(lines, i);
      out.push({
        name: detected.name,
        kind: detected.kind,
        source: relative(ROOT, fullPath),
        doc,
        line: i + 1,
      });
    }
  }
  return out;
};

const generate = (): void => {
  console.log('Generating API reference…');
  const exports = walk(CORE_SRC);
  exports.sort((a, b) => a.name.localeCompare(b.name));
  const rows = exports
    .map((e) => {
      const _doc = e.doc || `\`${e.kind}\` from \`${e.source}\``;
      return `| \`${e.name}\` | ${e.kind} | [${e.source}:${e.line}](https://github.com/10xdev4u-alt/crucible/blob/main/${e.source}#L${e.line}) |`;
    })
    .join('\n');
  // Write to docs/api-reference.md (the user-facing page)
  const template = readFileSync(
    join(__dirname, '..', 'content', 'docs', 'api-reference.template.md'),
    'utf8',
  );
  const output = template.replace(
    /<!-- BEGIN api-table -->[\s\S]*<!-- END api-table -->/,
    `<!-- BEGIN api-table -->\n| Symbol | Kind | Source |\n|---|---|---|\n${rows}\n<!-- END api-table -->`,
  );
  writeFileSync(join(__dirname, '..', 'content', 'docs', 'api-reference.md'), output, 'utf8');
  console.log(`Wrote docs/api-reference.md (${exports.length} exports)`);
};

generate();
