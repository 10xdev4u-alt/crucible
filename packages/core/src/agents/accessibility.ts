import type { AgentInput } from '../types/agent.js';
import type { Finding } from '../types/finding.js';
import { BaseAgent, type LLMCaller, type PromptTemplate } from './base.js';
import { parseStructuredFindings } from './parser.js';

const SYSTEM_PROMPT = `You are the Crucible Accessibility agent. Review code for accessibility issues.

For each issue, output a finding in this format:

### <title> [<severity>]
**File:** <path>:<line>
**Rule:** <rule-id>
**Message:** <detailed message>

Focus on:
- Missing alt text on images
- Missing form labels
- Insufficient color contrast
- Non-semantic HTML (div-soup, missing landmarks)
- Missing keyboard handlers for clickable non-button elements
- Missing ARIA where needed
- Improper heading hierarchy
- Focus management issues
- Screen-reader-only text that is not actually hidden
- Inaccessible error messaging
- Auto-playing media without controls
- Missing skip links`;

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
  id: 'accessibility',
  name: 'Accessibility Reviewer',
  version: '0.0.0',
  description: 'Detects accessibility (a11y) issues.',
  categories: ['accessibility'],
  capabilities: ['wcag', 'aria', 'semantic-html'],
};

export class AccessibilityAgent extends BaseAgent {
  protected readonly agentInfo = INFO;
  protected readonly prompt = PROMPT;

  constructor(caller: LLMCaller, defaultModel?: string) {
    super(caller, defaultModel);
  }

  protected override parseResponse(content: string): Finding[] {
    return parseStructuredFindings(content, this.agentInfo.id).map((f) => ({
      ...f,
      category: 'accessibility',
    }));
  }
}
