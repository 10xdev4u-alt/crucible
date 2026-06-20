/** A small diff utility for comparing two review results. */
import type { Finding } from '../types/finding.js';
import type { ReviewResult } from '../types/review-result.js';

export interface FindingDiff {
  added: Finding[];
  removed: Finding[];
  changed: Array<{ before: Finding; after: Finding }>;
}

const findingKey = (f: Finding): string => {
  const loc = f.location;
  if (loc) {
    return `${loc.file}:${loc.line ?? '?'}:${f.ruleId ?? f.title}`;
  }
  return `*:${f.ruleId ?? f.title}`;
};

const byKey = (findings: readonly Finding[]): Map<string, Finding> => {
  const out = new Map<string, Finding>();
  for (const f of findings) out.set(findingKey(f), f);
  return out;
};

/** Compare two review results. */
export function diffReviews(before: ReviewResult, after: ReviewResult): FindingDiff {
  const beforeMap = byKey(before.findings);
  const afterMap = byKey(after.findings);
  const added: Finding[] = [];
  const removed: Finding[] = [];
  const changed: Array<{ before: Finding; after: Finding }> = [];

  for (const [key, afterF] of afterMap) {
    const beforeF = beforeMap.get(key);
    if (!beforeF) {
      added.push(afterF);
    } else if (
      beforeF.severity !== afterF.severity ||
      beforeF.message !== afterF.message ||
      beforeF.confidence !== afterF.confidence
    ) {
      changed.push({ before: beforeF, after: afterF });
    }
  }
  for (const [key, beforeF] of beforeMap) {
    if (!afterMap.has(key)) {
      removed.push(beforeF);
    }
  }
  return { added, removed, changed };
}
