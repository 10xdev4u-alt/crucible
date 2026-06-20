import type { ChangeSet } from './file-diff';
import type { Finding } from './finding';
import type { ReviewRequest } from './review-request';

/** Information about the project being reviewed. */
export interface ProjectInfo {
  root: string;
  name?: string;
  language?: string;
  framework?: string;
  packageManager?: string;
  version?: string;
}

/** Repository information. */
export interface RepositoryInfo {
  provider: 'github' | 'gitlab' | 'bitbucket' | 'local';
  owner?: string;
  name?: string;
  branch?: string;
  defaultBranch?: string;
  remoteUrl?: string;
}

/** The full context passed to a review agent. */
export interface ReviewContext {
  request: ReviewRequest;
  project: ProjectInfo;
  repository?: RepositoryInfo;
  changeSet?: ChangeSet;
  priorFindings?: Finding[];
  hints?: string[];
  env: Record<string, string>;
}

/** Returns true if the context has any change set to review. */
export function hasChanges(ctx: ReviewContext): boolean {
  return Boolean(ctx.changeSet && ctx.changeSet.files.length > 0);
}

/** Returns the number of files in the change set, or 0 if none. */
export function fileCount(ctx: ReviewContext): number {
  return ctx.changeSet?.files.length ?? 0;
}
