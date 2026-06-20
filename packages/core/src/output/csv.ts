import type { Finding } from '../types/finding.js';
import type { ReviewResult } from '../types/review-result.js';
import type { Formatter } from './text.js';

const csvEscape = (s: string): string => {
  if (s.includes('"') || s.includes(',') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
};

/** CSV formatter — for spreadsheet analysis. */
export class CsvFormatter implements Formatter {
  format(result: ReviewResult): string {
    const header = [
      'id',
      'agent',
      'category',
      'severity',
      'title',
      'message',
      'file',
      'line',
      'rule',
      'confidence',
      'createdAt',
    ].join(',');
    const rows = result.findings.map((f: Finding) => {
      const loc = f.location;
      return [
        f.id,
        f.agentId,
        f.category,
        f.severity,
        f.title,
        f.message,
        loc?.file ?? '',
        loc?.line ?? '',
        f.ruleId ?? '',
        f.confidence,
        f.createdAt,
      ]
        .map((v) => csvEscape(String(v)))
        .join(',');
    });
    return [header, ...rows].join('\n');
  }
}
