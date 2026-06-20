import type { Finding } from '../types/finding.js';

const severityScore: Record<Finding['severity'], number> = {
  info: 1,
  minor: 2,
  major: 5,
  critical: 10,
  blocker: 25,
};

/** Compute a weighted score for a single finding. */
export function scoreFinding(f: Finding): number {
  return severityScore[f.severity] * f.confidence;
}

/** Compute a consensus score for a group of similar findings. */
export function consensusScore(findings: readonly Finding[]): number {
  if (findings.length === 0) return 0;
  const sum = findings.reduce((acc, f2) => acc + scoreFinding(f2), 0);
  // Bonus when multiple agents agree on the same issue.
  const agreementBonus = 1 + 0.25 * (findings.length - 1);
  return sum * agreementBonus;
}

/** Rank findings by consensus score, descending. */
export function rankFindings(findings: readonly Finding[]): Finding[] {
  const byKey = new Map<string, Finding[]>();
  for (const f of findings) {
    const k = `${f.location?.file ?? '*'}:${f.location?.line ?? 0}:${f.ruleId ?? f.title}`;
    const list = byKey.get(k);
    if (list) list.push(f);
    else byKey.set(k, [f]);
  }
  const out: Finding[] = [];
  for (const group of byKey.values()) {
    const top = group.reduce((a, b) => (scoreFinding(a) >= scoreFinding(b) ? a : b));
    out.push(top);
  }
  return out.sort((a, b) => scoreFinding(b) - scoreFinding(a));
}

/** Compute the overall consensus score for a review (sum of ranked scores). */
export function reviewScore(findings: readonly Finding[]): number {
  return rankFindings(findings).reduce((acc, f) => acc + scoreFinding(f), 0);
}
