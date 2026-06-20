import type { ChangeSet } from './file-diff';

/** What part of the codebase to review. */
export type ReviewTarget =
  | { kind: 'diff'; change: ChangeSet }
  | { kind: 'files'; paths: string[] }
  | { kind: 'directory'; path: string; recursive: boolean }
  | { kind: 'commit'; sha: string }
  | { kind: 'pull-request'; provider: string; id: string };

/** Constraints for the review run. */
export interface ReviewConstraints {
  maxFindings?: number;
  maxFindingsPerFile?: number;
  categories?: string[];
  severities?: string[];
  agentIds?: string[];
  excludePaths?: string[];
  includePaths?: string[];
  timeoutMs?: number;
  parallelism?: number;
}

/** A request to review something. */
export interface ReviewRequest {
  id: string;
  target: ReviewTarget;
  constraints?: ReviewConstraints;
  metadata?: Record<string, string>;
  requestedAt: string;
  requestedBy?: string;
}
