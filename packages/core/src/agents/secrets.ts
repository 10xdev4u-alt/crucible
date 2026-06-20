import type { AgentInput } from '../types/agent.js';
import type { Finding } from '../types/finding.js';
import { BaseAgent, type PromptTemplate } from './base.js';
import { parseStructuredFindings } from './parser.js';

const SYSTEM_PROMPT = `You are the Crucible Secrets Detection reviewer. Look for hardcoded secrets and credentials.

For each issue, output a finding in this format:

### <title> [<severity>]
**File:** <path>:<line>
**Rule:** <rule-id>
**Message:** <detailed message>

Focus on:
- API keys (AWS, GCP, Azure, OpenAI, Anthropic, GitHub, Stripe, etc.)
- Private keys (RSA, SSH, PGP, etc.)
- Database connection strings with passwords
- OAuth client secrets
- JWT signing secrets
- Hardcoded passwords
- Bearer tokens in source
- Service account credentials
- Webhook secrets
- Database URL with credentials
- AWS access keys
- SSH keys (BEGIN PRIVATE KEY, etc.)
- Connection strings with passwords embedded
- API tokens in .env files committed to git
- Hardcoded encryption keys`;

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
  id: 'secrets',
  name: 'Secrets Detection Reviewer',
  version: '0.0.0',
  description: 'Detects hardcoded secrets, API keys, and credentials.',
  categories: ['security', 'dependency'],
  capabilities: ['secret-scanning', 'credential-detection'],
};

export class SecretsAgent extends BaseAgent {
  protected readonly agentInfo = INFO;
  protected readonly prompt = PROMPT;

  protected override parseResponse(content: string): Finding[] {
    return parseStructuredFindings(content, this.agentInfo.id).map((f) => ({
      ...f,
      category: 'security',
    }));
  }
}
