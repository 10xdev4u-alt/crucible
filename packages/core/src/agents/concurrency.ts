import type { AgentInput } from '../types/agent.js';
import type { Finding } from '../types/finding.js';
import { BaseAgent, type LLMCaller, type PromptTemplate } from './base.js';
import { parseStructuredFindings } from './parser.js';

const SYSTEM_PROMPT = `You are the Crucible Concurrency agent. Review code for concurrency hazards.

For each issue, output a finding in this format:

### <title> [<severity>]
**File:** <path>:<line>
**Rule:** <rule-id>
**Message:** <detailed message>

Focus on:
- Race conditions
- Deadlocks (lock ordering)
- Missing locks
- Over-locking (contention)
- Lost updates
- ABA problems
- Memory visibility (missing volatile/atomics)
- Time-of-check to time-of-use (TOCTOU)
- Non-idempotent retries
- Misuse of async/await
- Blocking calls in async paths
- Missing cancellation propagation
- Shared mutable state across goroutines/threads/tasks`;

const PROMPT: PromptTemplate = {
  system: SYSTEM_PROMPT,
  user: (input: AgentInput) => {
    const files = input.context.changeSet?.files ?? [];
    if (files.length === 0) return 'No files.';
    return files
      .map(
        (f) =>
          `${f.path}\n${f.hunks
            .map(
              (h) =>
                `@@ ${h.header} @@\n${h.lines.map((l) => `${l.kind === 'add' ? '+' : l.kind === 'remove' ? '-' : ' '}${l.content}`).join('\n')}`,
            )
            .join('\n\n')}`,
      )
      .join('\n\n---\n\n');
  },
};

const INFO: import('../types/agent.js').AgentInfo = {
  id: 'concurrency',
  name: 'Concurrency Reviewer',
  version: '0.0.0',
  description: 'Detects race conditions and concurrency hazards.',
  categories: ['concurrency', 'data-integrity'],
  capabilities: ['race-detection', 'lock-analysis', 'async-check'],
};

export class ConcurrencyAgent extends BaseAgent {
  protected readonly agentInfo = INFO;
  protected readonly prompt = PROMPT;

  constructor(caller: LLMCaller, defaultModel?: string) {
    super(caller, defaultModel);
  }

  protected override parseResponse(content: string): Finding[] {
    return parseStructuredFindings(content, this.agentInfo.id).map((f) => ({
      ...f,
      category: 'concurrency',
    }));
  }
}
