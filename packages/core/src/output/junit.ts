import type { ReviewResult } from '../types/review-result.js';
import type { Formatter } from './text.js';

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** JUnit XML formatter for CI test reporting. */
export class JUnitFormatter implements Formatter {
  format(result: ReviewResult): string {
    const failures = result.findings.filter(
      (f) => f.severity === 'blocker' || f.severity === 'critical',
    );
    const lines: string[] = [];
    lines.push('<?xml version="1.0" encoding="UTF-8"?>');
    lines.push(
      `<testsuites name="crucible" tests="${result.findings.length}" failures="${failures.length}">`,
    );
    lines.push(
      `<testsuite name="${xmlEscape(result.id)}" tests="${result.findings.length}" failures="${failures.length}">`,
    );
    for (const f of result.findings) {
      const isFailure = f.severity === 'blocker' || f.severity === 'critical';
      const classname = f.location?.file ?? f.category;
      const name = `${f.severity}: ${f.title}`;
      lines.push(`<testcase classname="${xmlEscape(classname)}" name="${xmlEscape(name)}">`);
      if (isFailure) {
        lines.push(
          `<failure type="${f.severity}" message="${xmlEscape(f.title)}">${xmlEscape(f.message)}</failure>`,
        );
      }
      lines.push('</testcase>');
    }
    lines.push('</testsuite>');
    lines.push('</testsuites>');
    return lines.join('\n');
  }
}
