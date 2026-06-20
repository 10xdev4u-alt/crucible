import type { AgentInput } from '../types/agent.js';
import type { Finding } from '../types/finding.js';
import { BaseAgent, type LLMCaller, type PromptTemplate } from './base.js';
import { parseStructuredFindings } from './parser.js';

const SYSTEM_PROMPT = `You are the Crucible Documentation agent. Review changes for documentation issues.

For each issue, output a finding in this format:

### <title> [<severity>]
**File:** <path>:<line>
**Rule:** <rule-id>
**Message:** <detailed message>

Focus on:
- New public APIs without JSDoc / TSDoc
- Outdated comments that no longer match the code
- Missing README updates for new features
- Missing CHANGELOG entries
- Undocumented breaking changes
- Inconsistent terminology in docs
- Example code that no longer runs
- Missing error documentation
- Missing parameter descriptions
- Broken or stale doc links`;

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
  id: 'documentation',
  name: 'Documentation Reviewer',
  version: '0.0.0',
  description: 'Detects documentation gaps and stale comments.',
  categories: ['documentation'],
  capabilities: ['jsdoc-check', 'readme-diff', 'comment-freshness'],
};

export class DocumentationAgent extends BaseAgent {
  protected readonly agentInfo = INFO;
  protected readonly prompt = PROMPT;

  constructor(caller: LLMCaller, defaultModel?: string) {
    super(caller, defaultModel);
  }

  protected override parseResponse(content: string): Finding[] {
    return parseStructuredFindings(content, this.agentInfo.id).map((f) => ({
      ...f,
      category: 'documentation',
    }));
  }
}
