import { getString } from '../argv.js';
import { formatPRComment } from '../github.js';
import { cmdReview } from './review.js';

/** Convenience command: review and post to GitHub. */
export async function cmdCheck(
  positionals: string[],
  flags: Record<string, string | boolean | string[]>,
): Promise<number> {
  const code = await cmdReview(positionals, { ...flags, format: 'json' });
  if (code !== 0) {
    // Continue to post even on findings — PR comments shouldn't fail CI.
  }
  const jsonPath = getString(flags, 'output', './crucible-result.json');
  const mdPath = getString(flags, 'summary', './crucible-summary.md');
  const { readFileSync, writeFileSync } = await import('node:fs');
  if (!jsonPath) return code;
  const result = JSON.parse(readFileSync(jsonPath, 'utf8')) as {
    findings: Array<{
      severity: string;
      title: string;
      message: string;
      location?: { file: string; line?: number };
    }>;
    consensusScore: number;
  };
  const findings = result.findings.map((f) => ({
    severity: f.severity,
    title: f.title,
    message: f.message,
    ...(f.location?.file ? { file: f.location.file } : {}),
    ...(f.location?.line !== undefined ? { line: f.location.line } : {}),
  }));
  const summary = formatPRComment(findings, result.consensusScore);
  writeFileSync(mdPath, summary, 'utf8');
  return code;
}
