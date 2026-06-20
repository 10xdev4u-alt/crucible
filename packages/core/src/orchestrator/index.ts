export { dedupeFindings, findingKey, groupFindings } from './dedup.js';
export { DEFAULT_OPTIONS, Orchestrator, type OrchestratorOptions } from './orchestrator.js';
export {
  type ParallelOptions,
  type ParallelResult,
  runParallel,
  type WorkItem,
} from './parallel.js';
export { consensusScore, rankFindings, reviewScore, scoreFinding } from './scorer.js';
