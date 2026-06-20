import type { AgentInput } from '../types/agent.js';
import type { Finding } from '../types/finding.js';
import { BaseAgent, type PromptTemplate } from './base.js';
import { parseStructuredFindings } from './parser.js';

const SYSTEM_PROMPT = `You are the Crucible Naming reviewer. Review code for naming clarity.

For each issue, output a finding in this format:

### <title> [<severity>]
**File:** <path>:<line>
**Rule:** <rule-id>
**Message:** <detailed message>

Focus on:
- Single-letter variables (except in tiny lambdas)
- Cryptic abbreviations
- Misleading names (variable named "data" but holds a single string)
- Inconsistent casing within the same scope
- Type names that don't match what they represent
- Function names that don't describe their action
- Boolean names that aren't obviously boolean
- Names that conflict with standard library
- Names that include type information redundantly (e.g., "strName")
- Names that are too generic in a large scope (e.g., "value", "item")`;

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
  id: 'naming',
  name: 'Naming Reviewer',
  version: '0.0.0',
  description: 'Detects unclear, misleading, or inconsistent names.',
  categories: ['style', 'maintainability', 'best-practice'],
  capabilities: ['naming', 'clarity'],
};

export class NamingAgent extends BaseAgent {
  protected readonly agentInfo = INFO;
  protected readonly prompt = PROMPT;

  protected override parseResponse(content: string): Finding[] {
    return parseStructuredFindings(content, this.agentInfo.id).map((f) => ({
      ...f,
      category: 'style',
    }));
  }
}
