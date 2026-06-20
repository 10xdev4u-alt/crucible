# Security policy

## Supported versions

| Version | Supported           |
| ------- | ------------------- |
| 0.0.x   | :white_check_mark: yes |

## Reporting a vulnerability

Please **do not** open public GitHub issues for security
vulnerabilities. They will be visible to everyone and could be
exploited before we can fix them.

Instead, report privately:

- **Email:** security@10xdev4u-alt.dev (placeholder — use GitHub
  Security Advisories for now)
- **GitHub Security Advisories:** [Report a vulnerability][adv]

[adv]: https://github.com/10xdev4u-alt/crucible/security/advisories/new

## What to include

Please include:

- A clear description of the vulnerability
- Steps to reproduce or a proof-of-concept
- The affected version(s) and configuration
- The potential impact (e.g. code execution, info disclosure)
- Any suggested fix (optional)

## What to expect

- An acknowledgement within 72 hours
- A triage assessment within 7 days
- A fix timeline once the issue is confirmed
- A coordinated disclosure date

## Scope

The following are in scope:

- The `@crucible/core` library and `@crucible/cli` binary
- Provider integrations (Anthropic, OpenAI, Ollama, OpenAI-compatible)
- The orchestrator, agent registry, formatter pipeline
- The file-based and in-memory caches

The following are **out of scope**:

- Vulnerabilities in upstream dependencies (please report them
  upstream)
- Issues that require the attacker to already have arbitrary code
  execution
- Social engineering attacks
- Spam or rate-limiting issues (please open a regular issue)

## Hall of fame

We thank the following researchers for responsible disclosures:

- *no entries yet*
