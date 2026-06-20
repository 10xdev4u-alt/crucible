/**
 * Severity levels for review findings.
 *
 * Ordered from least to most severe. Numeric values are used for
 * sorting, comparison, and weighted scoring.
 */
export const SEVERITY_LEVELS = ['info', 'minor', 'major', 'critical', 'blocker'] as const;

export type SeverityLevel = (typeof SEVERITY_LEVELS)[number];

/** Numeric weight for a severity level. Higher = more severe. */
export const SEVERITY_WEIGHT: Record<SeverityLevel, number> = {
  info: 1,
  minor: 2,
  major: 5,
  critical: 10,
  blocker: 25,
};

/** Returns true if `a` is at least as severe as `b`. */
export function severityAtLeast(a: SeverityLevel, b: SeverityLevel): boolean {
  return SEVERITY_WEIGHT[a] >= SEVERITY_WEIGHT[b];
}

/** Returns true if the given string is a valid severity level. */
export function isSeverityLevel(value: unknown): value is SeverityLevel {
  return (
    typeof value === 'string' && (SEVERITY_LEVELS as readonly string[]).includes(value)
  );
}

/** Returns the more severe of two severity levels. */
export function maxSeverity(a: SeverityLevel, b: SeverityLevel): SeverityLevel {
  return SEVERITY_WEIGHT[a] >= SEVERITY_WEIGHT[b] ? a : b;
}
