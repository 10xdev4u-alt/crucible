import type { AgentInput } from '../types/agent.js';
import type { Finding } from '../types/finding.js';
import { BaseAgent, type LLMCaller, type PromptTemplate } from './base.js';
import { parseStructuredFindings } from './parser.js';

const SYSTEM_PROMPT = `You are the Crucible Observability agent. Review code for observability gaps.

For each issue, output a finding in this format:

### <title> [<severity>]
**File:** <path>:<line>
**Rule:** <rule-id>
**Message:** <detailed message>

Focus on:
- Missing structured logging
- Missing metrics on critical paths
- Missing tracing spans across boundaries
- Missing error reporting (uncaught exceptions, swallowed errors)
- Missing health checks / readiness probes
- PII in logs
- Sensitive data in spans
- Missing log levels (everything at info)
- Missing correlation IDs
- Missing audit logs for sensitive operations`;

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
  id: 'observability',
  name: 'Observability Reviewer',
  version: '0.0.0',
  description: 'Detects missing logging, metrics, and tracing.',
  categories: ['observability', 'error-handling'],
  capabilities: ['log-check', 'metric-check', 'trace-check'],
};

export class ObservabilityAgent extends BaseAgent {
  protected readonly agentInfo = INFO;
  protected readonly prompt = PROMPT;

  constructor(caller: LLMCaller, defaultModel?: string) {
    super(caller, defaultModel);
  }

  protected override parseResponse(content: string): Finding[] {
    return parseStructuredFindings(content, this.agentInfo.id).map((f) => ({
      ...f,
      category: 'observability',
    }));
  }
}
