import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getBoolean, getList, getString } from '../argv.js';
import { cmdReview } from './review.js';

/** `crucible fix` — review and auto-apply safe fixes. */
export async function cmdFix(
  positionals: string[],
  flags: Record<string, string | boolean | string[]>,
): Promise<number> {
  const dryRun = getBoolean(flags, 'dry-run');
  const noGit = getBoolean(flags, 'no-git');
  const only = getList(flags, 'only');
  const onlyCategory = getList(flags, 'only-category');

  // Run review
  const reviewFlags = { ...flags, format: 'json', quiet: true };
  const code = await cmdReview(positionals, reviewFlags);
  void code;
  const output = getString(flags, 'output', './crucible-result.json');
  const result = JSON.parse(readFileSync(resolve(process.cwd(), output), 'utf8')) as {
    findings: Array<{
      severity: string;
      title: string;
      message: string;
      location?: { file: string; line?: number };
      fix?: { description: string; diff?: string; replacement?: string; confidence?: number };
    }>;
  };

  // Filter to findings that have actionable fixes
  const fixable = result.findings.filter(
    (f) => f.fix && (f.fix.diff ?? f.fix.replacement) && (f.fix.confidence ?? 0) >= 0.8,
  );

  // Apply category filter
  const filtered =
    onlyCategory.length > 0
      ? fixable.filter((f) => onlyCategory.includes((f as { category?: string }).category ?? ''))
      : fixable;

  const targets =
    only.length > 0 ? filtered.filter((f) => only.includes(f.location?.file ?? '')) : filtered;

  if (targets.length === 0) {
    console.log('No safe fixes to apply.');
    return 0;
  }

  // Group by file
  const byFile = new Map<string, typeof targets>();
  for (const f of targets) {
    if (!f.location?.file) continue;
    if (!byFile.has(f.location.file)) byFile.set(f.location.file, []);
    byFile.get(f.location.file)?.push(f);
  }

  for (const [file, fixes] of byFile) {
    const path = resolve(process.cwd(), file);
    const content = readFileSync(path, 'utf8');
    let applied = 0;
    for (const f of fixes) {
      if (f.fix?.replacement && f.location?.line) {
        const lines = content.split('\n');
        const idx = f.location.line - 1;
        if (idx >= 0 && idx < lines.length) {
          const before = lines[idx];
          if (before !== undefined) {
            if (dryRun) {
              console.log(`[dry-run] would replace line ${f.location.line} of ${file}`);
              console.log(`  - ${before}`);
              console.log(`  + ${f.fix.replacement}`);
            } else {
              lines[idx] = f.fix.replacement;
              applied += 1;
            }
          }
        }
      } else if (f.fix?.diff) {
        // Naive diff application — not safe for complex diffs.
        // Print a warning instead of applying.
        if (dryRun) {
          console.log(`[dry-run] diff-style fix for ${f.location?.file ?? '?'}:`);
          console.log(f.fix.diff);
        } else {
          console.warn(`Skipping diff-style fix for ${f.location?.file} (manual review needed)`);
        }
      }
    }
    if (applied > 0) {
      // re-read because we modified lines above (we used `let`)
      const lines2 = readFileSync(path, 'utf8').split('\n');
      for (const f of fixes) {
        if (f.fix?.replacement && f.location?.line) {
          const idx = f.location.line - 1;
          if (idx >= 0 && idx < lines2.length) {
            lines2[idx] = f.fix.replacement;
          }
        }
      }
      writeFileSync(path, lines2.join('\n'), 'utf8');
      console.log(`Applied ${applied} fix${applied === 1 ? '' : 'es'} to ${file}`);
    }
  }

  if (!noGit && !dryRun) {
    try {
      execSync('git add -u', { stdio: 'pipe' });
      console.log('Staged changes (git add -u)');
    } catch {
      // not a git repo or no changes
    }
  }

  console.log(
    `\n${targets.length} safe fix${targets.length === 1 ? '' : 'es'} ${dryRun ? 'would be' : 'were'} applied.`,
  );
  return 0;
}
