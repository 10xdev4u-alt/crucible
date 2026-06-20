import type { Finding } from '../types/finding.js';
import type { ReviewResult } from '../types/review-result.js';
import type { Formatter } from './text.js';

const SEVERITY_MAP: Record<Finding['severity'], string> = {
  blocker: 'blocker',
  critical: 'critical',
  major: 'major',
  minor: 'minor',
  info: 'info',
};

/** GitLab Code Quality report formatter. */
export class GitLabFormatter implements Formatter {
  format(result: ReviewResult): string {
    const issues = result.findings.map((f: Finding) => {
      const loc = f.location;
      const lines: Record<string, unknown> = {
        type: 'issue',
        check_name: f.ruleId ?? 'crucible',
        description: `${f.title}\n\n${f.message}`,
        severity: SEVERITY_MAP[f.severity],
        categories: [f.category],
        fingerprint: f.id,
      };
      if (loc?.file) {
        lines.location = {
          path: loc.file,
          ...(loc.line ? { lines: { begin: loc.line, end: loc.endLine ?? loc.line } } : {}),
        };
      }
      return lines;
    });
    return JSON.stringify(issues, null, 2);
  }
}
