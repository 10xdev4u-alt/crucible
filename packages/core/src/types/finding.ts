import type { SeverityLevel } from './severity';

/** A location within a file. Line is 1-based, column is 0-based. */
export interface FileLocation {
  file: string;
  line: number;
  column?: number;
  endLine?: number;
  endColumn?: number;
}

/** A category for grouping findings. */
export const FINDING_CATEGORIES = [
  'security',
  'performance',
  'style',
  'architecture',
  'accessibility',
  'testing',
  'documentation',
  'dependency',
  'api-contract',
  'data-integrity',
  'error-handling',
  'concurrency',
  'observability',
  'maintainability',
  'compatibility',
  'best-practice',
] as const;

export type FindingCategory = (typeof FINDING_CATEGORIES)[number];

/** A code snippet to attach to a finding for context. */
export interface CodeSnippet {
  language?: string;
  before?: string;
  highlight?: string;
  after?: string;
}

/** A suggested fix for a finding. */
export interface SuggestedFix {
  description: string;
  diff?: string;
  replacement?: string;
  confidence?: number;
}

/** A single review finding produced by an agent. */
export interface Finding {
  id: string;
  agentId: string;
  category: FindingCategory;
  severity: SeverityLevel;
  title: string;
  message: string;
  location?: FileLocation;
  ruleId?: string;
  references?: string[];
  snippet?: CodeSnippet;
  fix?: SuggestedFix;
  confidence: number;
  createdAt: string;
}

/** Returns true if the given finding is at least as severe as the level. */
export function findingAtSeverity(finding: Finding, level: SeverityLevel): boolean {
  const weights: Record<SeverityLevel, number> = {
    info: 1,
    minor: 2,
    major: 5,
    critical: 10,
    blocker: 25,
  };
  return weights[finding.severity] >= weights[level];
}

/** Returns true if the finding has an actionable fix. */
export function hasFix(finding: Finding): boolean {
  return Boolean(finding.fix && (finding.fix.diff ?? finding.fix.replacement));
}
