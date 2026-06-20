import type { AgentInput } from '../types/agent.js';
import type { Finding } from '../types/finding.js';
import { BaseAgent, type LLMCaller, type PromptTemplate } from './base.js';
import { parseStructuredFindings } from './parser.js';

const SYSTEM_PROMPT = `You are the Crucible Test Coverage agent. Review changes for missing or weak tests.

For each issue, output a finding in this format:

### <title> [<severity>]
**File:** <path>:<line>
**Rule:** <rule-id>
**Message:** <detailed message>

Focus on:
- New code with no accompanying tests
- Public functions or exports without unit tests
- Branches not covered (happy path only)
- Missing edge case coverage (null, empty, max, min, off-by-one)
- Missing error-path tests
- Missing integration tests for cross-module flows
- Flaky test patterns (sleep, time-dependent, network-dependent)
- Tests that test implementation rather than behavior
- Missing assertions (test runs but doesn't check anything)`;

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
  id: 'test-coverage',
  name: 'Test Coverage Reviewer',
  version: '0.0.0',
  description: 'Detects missing or weak test coverage.',
  categories: ['testing'],
  capabilities: ['branch-coverage', 'edge-case-detection'],
};

export class TestCoverageAgent extends BaseAgent {
  protected readonly agentInfo = INFO;
  protected readonly prompt = PROMPT;

  constructor(caller: LLMCaller, defaultModel?: string) {
    super(caller, defaultModel);
  }

  protected override parseResponse(content: string): Finding[] {
    return parseStructuredFindings(content, this.agentInfo.id).map((f) => ({
      ...f,
      category: 'testing',
    }));
  }
}
