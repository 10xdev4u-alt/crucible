export { dedupeFindings, findingKey, groupFindings } from './dedup.js';
export {
  type ParallelOptions,
  type ParallelResult,
  runParallel,
  type WorkItem,
} from './parallel.js';
export { consensusScore, rankFindings, reviewScore, scoreFinding } from './scorer.js';
