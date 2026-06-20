import type { AgentInput } from '../types/agent.js';
import type { Finding } from '../types/finding.js';
import { BaseAgent, type LLMCaller, type PromptTemplate } from './base.js';
import { parseStructuredFindings } from './parser.js';

const SYSTEM_PROMPT = `You are the Crucible Performance agent. Review code for performance issues.

For each issue, output a finding in this format:

### <title> [<severity>]
**File:** <path>:<line>
**Rule:** <rule-id>
**Message:** <detailed message>

Focus on:
- O(n^2) or worse algorithms on hot paths
- N+1 queries
- Missing memoization where it would help
- Synchronous I/O on the request path
- Large object allocations in tight loops
- Unnecessary re-renders
- Bundle size bloat (importing entire libraries)
- Missing indexes implied by query patterns
- Memory leaks (event listeners not removed, timers not cleared)
- Inefficient string concatenation in loops`;

const PROMPT: PromptTemplate = {
  system: SYSTEM_PROMPT,
  user: (input: AgentInput) => {
    const files = input.context.changeSet?.files ?? [];
    if (files.length === 0) return 'No files. Brief overview is fine.';
    return files
      .map(
        (f) =>
          `${f.path} (${f.kind})\n${f.hunks
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
  id: 'performance',
  name: 'Performance Reviewer',
  version: '0.0.0',
  description: 'Detects performance bottlenecks and inefficiencies.',
  categories: ['performance', 'concurrency', 'observability'],
  capabilities: ['complexity-analysis', 'hot-path-detection', 'memory-analysis'],
};

export class PerformanceAgent extends BaseAgent {
  protected readonly agentInfo = INFO;
  protected readonly prompt = PROMPT;

  constructor(caller: LLMCaller, defaultModel?: string) {
    super(caller, defaultModel);
  }

  protected override parseResponse(content: string): Finding[] {
    return parseStructuredFindings(content, this.agentInfo.id).map((f) => ({
      ...f,
      category: 'performance',
    }));
  }
}
