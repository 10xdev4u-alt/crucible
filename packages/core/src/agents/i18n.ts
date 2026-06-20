import type { AgentInput } from '../types/agent.js';
import type { Finding } from '../types/finding.js';
import { BaseAgent, type LLMCaller, type PromptTemplate } from './base.js';
import { parseStructuredFindings } from './parser.js';

const SYSTEM_PROMPT = `You are the Crucible i18n agent. Review code for internationalization issues.

For each issue, output a finding in this format:

### <title> [<severity>]
**File:** <path>:<line>
**Rule:** <rule-id>
**Message:** <detailed message>

Focus on:
- Hardcoded user-facing strings (not behind a translation function)
- Missing locale handling
- Hardcoded date/time formats
- Hardcoded number formats (decimal separator, etc.)
- Hardcoded currency symbols
- Direction (LTR/RTL) assumptions
- Hardcoded character sets or encodings
- Concatenation instead of ICU message format
- Pluralization issues
- Sorting/collating without locale awareness`;

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
  id: 'i18n',
  name: 'i18n Reviewer',
  version: '0.0.0',
  description: 'Detects internationalization and localization issues.',
  categories: ['i18n', 'compatibility'],
  capabilities: ['locale-check', 'icu-format', 'pluralization'],
};

export class I18nAgent extends BaseAgent {
  protected readonly agentInfo = INFO;
  protected readonly prompt = PROMPT;

  constructor(caller: LLMCaller, defaultModel?: string) {
    super(caller, defaultModel);
  }

  protected override parseResponse(content: string): Finding[] {
    return parseStructuredFindings(content, this.agentInfo.id).map((f) => ({
      ...f,
      category: 'best-practice',
    }));
  }
}
