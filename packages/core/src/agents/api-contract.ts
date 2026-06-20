import type { AgentInput } from '../types/agent.js';
import type { Finding } from '../types/finding.js';
import { BaseAgent, type PromptTemplate } from './base.js';
import { parseStructuredFindings } from './parser.js';

const SYSTEM_PROMPT = `You are the Crucible API Contract agent. Review changes for API contract issues.

For each issue, output a finding in this format:

### <title> [<severity>]
**File:** <path>:<line>
**Rule:** <rule-id>
**Message:** <detailed message>

Focus on:
- Breaking changes to public APIs (signature changes, removals, renames)
- Missing or changed error responses
- Inconsistent naming across endpoints
- Missing input validation
- Missing pagination on list endpoints
- Missing or inconsistent authentication
- Missing rate limiting hints
- Inconsistent status codes
- Missing OpenAPI / schema doc updates
- Backwards-incompatible response shape changes
- Non-idiomatic REST (or GraphQL) usage`;

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
  id: 'api-contract',
  name: 'API Contract Reviewer',
  version: '0.0.0',
  description: 'Detects API contract violations and breaking changes.',
  categories: ['api-contract', 'compatibility'],
  capabilities: ['rest-check', 'graphql-check', 'openapi-diff'],
};

export class ApiContractAgent extends BaseAgent {
  protected readonly agentInfo = INFO;
  protected readonly prompt = PROMPT;

  protected override parseResponse(content: string): Finding[] {
    return parseStructuredFindings(content, this.agentInfo.id).map((f) => ({
      ...f,
      category: 'api-contract',
    }));
  }
}
