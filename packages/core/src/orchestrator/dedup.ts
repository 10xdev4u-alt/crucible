import type { Finding } from '../types/finding.js';

/** Returns a stable key for a finding based on its location and rule. */
export function findingKey(f: Finding): string {
  const loc = f.location;
  if (loc) {
    return `${loc.file}:${loc.line}:${f.ruleId ?? f.title}`;
  }
  return `*:${f.ruleId ?? f.title}`;
}

/** Deduplicate findings that share the same key. */
export function dedupeFindings(findings: readonly Finding[]): Finding[] {
  const map = new Map<string, Finding>();
  for (const f of findings) {
    const key = findingKey(f);
    const existing = map.get(key);
    if (!existing) {
      map.set(key, f);
      continue;
    }
    // Keep the finding with the higher confidence, breaking ties by severity
    if (isHigherPriority(f, existing)) {
      map.set(key, f);
    }
  }
  return [...map.values()];
}

function isHigherPriority(a: Finding, b: Finding): boolean {
  if (a.confidence !== b.confidence) return a.confidence > b.confidence;
  const aSev = severityRank(a.severity);
  const bSev = severityRank(b.severity);
  return aSev > bSev;
}

function severityRank(s: Finding['severity']): number {
  return { info: 1, minor: 2, major: 5, critical: 10, blocker: 25 }[s];
}

/** Group findings by their key. Useful for consensus analysis. */
export function groupFindings(findings: readonly Finding[]): Map<string, Finding[]> {
  const out = new Map<string, Finding[]>();
  for (const f of findings) {
    const k = findingKey(f);
    const list = out.get(k);
    if (list) list.push(f);
    else out.set(k, [f]);
  }
  return out;
}
