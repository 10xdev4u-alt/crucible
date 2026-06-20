import type { Finding } from './finding';
import type { SeverityLevel } from './severity';

/** The contract every reviewer (specialized agent) implements. */
export interface Reviewer {
  id: string;
  name: string;
  description: string;
  categories: string[];
  defaultSeverity: SeverityLevel;
  review(context: ReviewerContext): Promise<ReviewerOutput>;
}

/** Input to a reviewer. */
export interface ReviewerContext {
  files: ReviewerFile[];
  hints?: string[];
  signal?: AbortSignal;
}

/** A file passed to a reviewer. */
export interface ReviewerFile {
  path: string;
  content: string;
  oldContent?: string;
  language?: string;
}

/** Output of a reviewer. */
export interface ReviewerOutput {
  reviewerId: string;
  findings: Finding[];
  durationMs: number;
  metadata?: Record<string, unknown>;
}
