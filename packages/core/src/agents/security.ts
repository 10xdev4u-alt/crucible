import type { AgentInput } from '../types/agent.js';
import type { Finding } from '../types/finding.js';
import { BaseAgent, type PromptTemplate } from './base.js';
import { parseStructuredFindings } from './parser.js';

const SYSTEM_PROMPT = `You are the Crucible Security agent. Review code for security issues.

For each issue, output a finding in this format:

### <title> [<severity>]
**File:** <path>:<line>
**Rule:** <rule-id>
**Message:** <detailed message>

Severity must be one of: blocker, critical, major, minor, info.
Rule ids use kebab-case. Focus on:
- Injection (SQL, command, XSS, template)
- Auth/authz bypasses
- Insecure deserialization
- Hardcoded secrets
- Path traversal
- SSRF
- Insecure direct object references
- Missing rate limits
- Improper error handling that leaks info
- Vulnerable dependencies
- Cryptographic misuse (weak hashes, ECB, etc.)`;

function buildUserPrompt(input: AgentInput): string {
  const files = input.context.changeSet?.files ?? [];
  if (files.length === 0) {
    return 'No files in the change set. List the project structure briefly and call out any obvious concerns.';
  }
  const parts = files
    .map((f) => {
      if (f.isBinary) return `BINARY: ${f.path}`;
      const hunks = f.hunks
        .map((h) => {
          const lines = h.lines
            .map((l) => {
              const prefix = l.kind === 'add' ? '+' : l.kind === 'remove' ? '-' : ' ';
              return `${prefix}${l.content}`;
            })
            .join('\n');
          return `@@ ${h.header} @@\n${lines}`;
        })
        .join('\n\n');
      return `${f.path} (${f.kind})\n${hunks}`;
    })
    .join('\n\n---\n\n');
  return `Review these changes for security issues:\n\n${parts}`;
}

const PROMPT: PromptTemplate = {
  system: SYSTEM_PROMPT,
  user: buildUserPrompt,
};

const INFO: import('../types/agent.js').AgentInfo = {
  id: 'security',
  name: 'Security Reviewer',
  version: '0.0.0',
  description: 'Detects security vulnerabilities and unsafe patterns.',
  categories: ['security', 'dependency', 'error-handling'],
  capabilities: ['injection-detection', 'auth-check', 'crypto-check'],
};

export class SecurityAgent extends BaseAgent {
  protected readonly agentInfo = INFO;
  protected readonly prompt = PROMPT;

  protected override parseResponse(content: string): Finding[] {
    return parseStructuredFindings(content, this.agentInfo.id).map((f) => ({
      ...f,
      category: 'security',
    }));
  }
}
