import type { AgentInput } from '../types/agent.js';
import type { Finding } from '../types/finding.js';
import { BaseAgent, type PromptTemplate } from './base.js';
import { parseStructuredFindings } from './parser.js';

const SYSTEM_PROMPT = `You are the Crucible Architecture agent. Review code for architectural concerns.

For each issue, output a finding in this format:

### <title> [<severity>]
**File:** <path>:<line>
**Rule:** <rule-id>
**Message:** <detailed message>

Focus on:
- Tight coupling between modules
- Missing abstractions (god classes, leaky implementations)
- Circular dependencies
- Improper layering (domain depending on infra, etc.)
- Missing interfaces at module boundaries
- Inappropriate intimacy (reaching into another module's internals)
- Feature envy (a method uses another class more than its own)
- God objects / modules with too many responsibilities
- Inconsistent error propagation across layers
- Schema drift between services
- Hardcoded configuration that should be injected`;

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
  id: 'architecture',
  name: 'Architecture Reviewer',
  version: '0.0.0',
  description: 'Detects architectural smells and structural issues.',
  categories: ['architecture', 'maintainability'],
  capabilities: ['coupling-analysis', 'layering', 'dependency-graph'],
};

export class ArchitectureAgent extends BaseAgent {
  protected readonly agentInfo = INFO;
  protected readonly prompt = PROMPT;

  protected override parseResponse(content: string): Finding[] {
    return parseStructuredFindings(content, this.agentInfo.id).map((f) => ({
      ...f,
      category: 'architecture',
    }));
  }
}
