import type { AgentInput } from '../types/agent.js';
import type { Finding } from '../types/finding.js';
import { BaseAgent, type PromptTemplate } from './base.js';
import { parseStructuredFindings } from './parser.js';

const SYSTEM_PROMPT = `You are the Crucible Style agent. Review code for style and readability.

For each issue, output a finding in this format:

### <title> [<severity>]
**File:** <path>:<line>
**Rule:** <rule-id>
**Message:** <detailed message>

Focus on:
- Naming clarity (camelCase, descriptive names, consistent convention)
- Function length and complexity
- Inconsistent patterns within the file
- Magic numbers and strings
- Dead code or commented-out code
- Unused imports and variables
- Inconsistent formatting or quote style
- Inconsistent error handling
- Improper use of language idioms
- Missing or excessive comments`;

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
  id: 'style',
  name: 'Style Reviewer',
  version: '0.0.0',
  description: 'Detects style, naming, and readability issues.',
  categories: ['style', 'maintainability', 'best-practice'],
  capabilities: ['naming', 'complexity', 'idiom-check'],
};

export class StyleAgent extends BaseAgent {
  protected readonly agentInfo = INFO;
  protected readonly prompt = PROMPT;

  protected override parseResponse(content: string): Finding[] {
    return parseStructuredFindings(content, this.agentInfo.id).map((f) => ({
      ...f,
      category: 'style',
    }));
  }
}
