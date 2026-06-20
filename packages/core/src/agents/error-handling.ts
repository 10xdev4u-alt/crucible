import type { AgentInput } from '../types/agent.js';
import type { Finding } from '../types/finding.js';
import { BaseAgent, type PromptTemplate } from './base.js';
import { parseStructuredFindings } from './parser.js';

const SYSTEM_PROMPT = `You are the Crucible Error Handling agent. Review code for error handling issues.

For each issue, output a finding in this format:

### <title> [<severity>]
**File:** <path>:<line>
**Rule:** <rule-id>
**Message:** <detailed message>

Focus on:
- Swallowed exceptions (empty catch blocks)
- Caught but not logged
- Catching the wrong exception type
- Re-throwing without context
- Returning error values when exceptions are idiomatic (or vice versa)
- Generic exception types when specific ones exist
- Inconsistent error handling across the codebase
- Unhandled promise rejections
- Missing cleanup in finally blocks
- Error messages that leak sensitive info (stack traces, file paths)
- User-facing error messages that expose internals
- Retry logic without backoff
- Missing error context (just the message, no surrounding state)`;

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
  id: 'error-handling',
  name: 'Error Handling Reviewer',
  version: '0.0.0',
  description: 'Detects swallowed, lost, or poorly handled errors.',
  categories: ['error-handling', 'reliability'],
  capabilities: ['catch-block-analysis', 'promise-check', 'retry-pattern'],
};

export class ErrorHandlingAgent extends BaseAgent {
  protected readonly agentInfo = INFO;
  protected readonly prompt = PROMPT;

  protected override parseResponse(content: string): Finding[] {
    return parseStructuredFindings(content, this.agentInfo.id).map((f) => ({
      ...f,
      category: 'error-handling',
    }));
  }
}
