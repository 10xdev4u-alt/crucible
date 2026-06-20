import type { AgentInput } from '../types/agent.js';
import type { Finding } from '../types/finding.js';
import { BaseAgent, type PromptTemplate } from './base.js';
import { parseStructuredFindings } from './parser.js';

const SYSTEM_PROMPT = `You are the Crucible Data Integrity reviewer. Review code for data integrity issues.

For each issue, output a finding in this format:

### <title> [<severity>]
**File:** <path>:<line>
**Rule:** <rule-id>
**Message:** <detailed message>

Focus on:
- Missing input validation
- Loss of precision (e.g. rounding errors, integer overflow)
- Floating point comparison without epsilon
- Missing null/undefined checks
- Missing transaction boundaries
- Race conditions on shared state
- Inconsistent data validation between client and server
- String concatenation that should be parameterized
- Missing charset declarations
- Implicit type coercion
- Locale-dependent comparisons
- Inconsistent units (e.g. seconds vs milliseconds)
- Missing data sanitization`;

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
  id: 'data-integrity',
  name: 'Data Integrity Reviewer',
  version: '0.0.0',
  description: 'Detects data loss, corruption, and validation issues.',
  categories: ['data-integrity', 'reliability'],
  capabilities: ['input-validation', 'precision-check', 'unit-consistency'],
};

export class DataIntegrityAgent extends BaseAgent {
  protected readonly agentInfo = INFO;
  protected readonly prompt = PROMPT;

  protected override parseResponse(content: string): Finding[] {
    return parseStructuredFindings(content, this.agentInfo.id).map((f) => ({
      ...f,
      category: 'data-integrity',
    }));
  }
}
