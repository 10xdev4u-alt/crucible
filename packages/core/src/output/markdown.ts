import type { ReviewResult } from '../types/review-result.js';
import type { Formatter } from './text.js';

/** Markdown formatter — produces a GitHub-flavored markdown report. */
export class MarkdownFormatter implements Formatter {
  format(result: ReviewResult): string {
    const lines: string[] = [];
    lines.push('# Crucible Review');
    lines.push('');
    lines.push(`- **Result ID:** \`${result.id}\``);
    lines.push(`- **Request ID:** \`${result.requestId}\``);
    lines.push(`- **Duration:** ${result.durationMs}ms`);
    lines.push(`- **Consensus score:** ${result.consensusScore.toFixed(2)}`);
    lines.push(`- **Findings:** ${result.findings.length}`);
    lines.push('');
    if (result.errors.length > 0) {
      lines.push('## Errors');
      lines.push('');
      for (const e of result.errors) lines.push(`- ${e}`);
      lines.push('');
    }
    if (result.findings.length === 0) {
      lines.push('_No findings._');
    } else {
      lines.push('## Findings');
      lines.push('');
      for (const f of result.findings) {
        lines.push(`### ${f.severity.toUpperCase()} — ${f.title} { #finding-${f.id} }`);
        lines.push('');
        lines.push(`> ${f.message}`);
        lines.push('');
        lines.push(`- **Category:** ${f.category}`);
        lines.push(`- **Agent:** \`${f.agentId}\``);
        if (f.location) {
          const loc = f.location.endLine
            ? `${f.location.file}:${f.location.line}-${f.location.endLine}`
            : `${f.location.file}:${f.location.line ?? '?'}`;
          lines.push(`- **Location:** \`${loc}\``);
        }
        if (f.ruleId) lines.push(`- **Rule:** \`${f.ruleId}\``);
        if (f.confidence !== undefined) {
          lines.push(`- **Confidence:** ${(f.confidence * 100).toFixed(0)}%`);
        }
        if (f.fix?.diff) {
          lines.push('');
          lines.push('**Suggested fix:**');
          lines.push('');
          lines.push('```diff');
          lines.push(f.fix.diff);
          lines.push('```');
        }
        lines.push('');
      }
    }
    return lines.join('\n');
  }
}
