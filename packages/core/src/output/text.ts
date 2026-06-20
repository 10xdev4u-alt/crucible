import type { Finding } from '../types/finding.js';
import type { ReviewResult } from '../types/review-result.js';

export interface FormatterOptions {
  color?: boolean;
  verbose?: boolean;
}

export interface Formatter {
  format(result: ReviewResult): string;
}

const severityColor: Record<Finding['severity'], string> = {
  blocker: '\x1b[1;31m',
  critical: '\x1b[31m',
  major: '\x1b[33m',
  minor: '\x1b[36m',
  info: '\x1b[37m',
};
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';

export class TextFormatter implements Formatter {
  constructor(private readonly options: FormatterOptions = {}) {}

  format(result: ReviewResult): string {
    const useColor = this.options.color ?? process.stdout.isTTY ?? false;
    const lines: string[] = [];
    const colorize = (s: string, c: string) => (useColor ? `${c}${s}${RESET}` : s);
    const bold = (s: string) => colorize(s, BOLD);
    const dim = (s: string) => colorize(s, DIM);

    lines.push(bold('Crucible Review'));
    lines.push(dim(`  result:    ${result.id}`));
    lines.push(dim(`  request:   ${result.requestId}`));
    lines.push(dim(`  duration:  ${result.durationMs}ms`));
    lines.push(dim(`  score:     ${result.consensusScore.toFixed(2)}`));
    lines.push(dim(`  findings:  ${result.findings.length}`));
    if (result.errors.length > 0) {
      lines.push('');
      lines.push(bold('Errors'));
      for (const e of result.errors) lines.push(`  - ${e}`);
    }
    if (result.findings.length === 0) {
      lines.push('');
      lines.push(dim('No findings.'));
    } else {
      lines.push('');
      lines.push(bold('Findings'));
      for (const f of result.findings) {
        const c = severityColor[f.severity];
        const header = `${colorize(f.severity.toUpperCase().padEnd(9), c)} ${bold(f.title)}`;
        lines.push(`  ${header}`);
        lines.push(`    ${dim('category:')} ${f.category}`);
        lines.push(`    ${dim('agent:')}    ${f.agentId}`);
        if (f.location) {
          const loc = f.location.endLine
            ? `${f.location.file}:${f.location.line}-${f.location.endLine}`
            : `${f.location.file}:${f.location.line ?? '?'}`;
          lines.push(`    ${dim('location:')} ${loc}`);
        }
        if (f.ruleId) lines.push(`    ${dim('rule:')}     ${f.ruleId}`);
        if (f.confidence !== undefined) {
          lines.push(`    ${dim('conf:')}     ${(f.confidence * 100).toFixed(0)}%`);
        }
        lines.push(`    ${f.message}`);
        if (this.options.verbose && f.fix?.diff) {
          lines.push('');
          lines.push(dim('    Suggested diff:'));
          for (const dl of f.fix.diff.split('\n')) lines.push(`    ${dl}`);
        }
        lines.push('');
      }
    }
    if (this.options.verbose) {
      lines.push(bold('Agents'));
      for (const s of result.agentStats) {
        const status = s.errored ? colorize('error', '\x1b[31m') : colorize('ok', '\x1b[32m');
        lines.push(`  ${status}  ${s.agentId}  (${s.findingsCount} findings, ${s.durationMs}ms)`);
      }
    }
    return lines.join('\n');
  }
}
