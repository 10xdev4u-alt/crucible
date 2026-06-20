import { getString } from '../argv.js';
import { cmdReview } from './review.js';

/** `crucible dry-run` — same as review but doesn't write any output. */
export async function cmdDryRun(positionals: string[], flags: Record<string, string | boolean | string[]>): Promise<number> {
  const summary = await cmdReview(positionals, { ...flags, quiet: true, output: '' });
  const out = getString(flags, 'output');
  if (!out) return summary;
  // When --output is set, behave like review
  return cmdReview(positionals, flags);
}
