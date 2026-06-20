/** Compute a simple letter grade (A-F) for a review based on the consensus score. */
export function gradeForScore(score: number): string {
  if (score <= 0) return 'A+';
  if (score < 5) return 'A';
  if (score < 15) return 'B';
  if (score < 30) return 'C';
  if (score < 60) return 'D';
  return 'F';
}

/** Compute a 0-100 risk score from a list of findings. */
export function riskScore(findings: readonly { severity: string; confidence: number }[]): number {
  const weights: Record<string, number> = {
    info: 1,
    minor: 2,
    major: 5,
    critical: 10,
    blocker: 25,
  };
  const total = findings.reduce((acc, f) => acc + (weights[f.severity] ?? 0) * f.confidence, 0);
  // Map 0-100+ to 0-100
  return Math.min(100, Math.round(total));
}

/** A short human-friendly summary of the review. */
export function summarize(findingsCount: number, criticalCount: number, score: number): string {
  if (findingsCount === 0) return 'Clean review. No issues found.';
  if (criticalCount > 0)
    return `${criticalCount} critical issue${criticalCount === 1 ? '' : 's'} need attention.`;
  if (score > 30) return 'Significant findings. Review carefully.';
  if (score > 10) return 'A few findings worth addressing.';
  return 'Minor findings only.';
}
