---
title: Security model
description: What Crucible does (and doesn't) do to keep your code safe
order: 24
category: Documentation
---

# Security model

Crucible is a tool that reads your code and sends it to a third party (the LLM provider). This page describes the security implications.

## What Crucible does

- **Reads your local git diff** or specified files
- **Sends the diff** to the configured LLM provider
- **Receives structured findings** (titles, messages, locations)
- **Prints or writes** the findings to your chosen output

That's it. No code execution, no network access beyond the provider API.

## What Crucible does NOT do

- **No telemetry** by default. See [telemetry](/docs/telemetry).
- **No code execution**. Agents do not run your code. The `Sandbox` utility is opt-in and not used by built-in agents.
- **No persistence beyond the cache**. The file cache contains only findings (titles, messages, locations), not source code. (See [caching](/docs/caching).)
- **No automatic git operations**. `crucible fix` modifies files but doesn't `git commit` or `git push` automatically.
- **No automatic PR comments**. You have to opt-in to PR comments via `crucible check`.

## Threats

### Threat 1: Code leak to LLM provider

Your diff is sent to the provider. The provider's privacy policy applies.

**Mitigations:**
- Use a self-hosted model (Ollama, vLLM) to keep code on your machine
- Use a provider with a clear data policy (Anthropic, OpenAI both state they don't train on your data by default for API usage)
- Use `--mock` to never call the LLM

### Threat 2: Malicious agent

A custom agent could exfiltrate data. Built-in agents are vetted, but if you load plugins, you're trusting the plugin author.

**Mitigations:**
- Only load plugins from sources you trust
- Review the agent's prompt and parser code
- Run Crucible in a sandbox if you're paranoid

### Threat 3: Malicious output

A compromised LLM provider could return malicious output (e.g., a "fix" that introduces a vulnerability). Crucible passes the output through, with minimal validation.

**Mitigations:**
- Always review `crucible fix` output before applying
- Use `--dry-run` to preview changes
- Review PR comments before merging
- Pin the LLM provider to a trusted one

### Threat 4: Supply chain attack

A malicious dependency could compromise Crucible.

**Mitigations:**
- pnpm lockfile is committed (and verified in CI)
- Use `pnpm audit` to check for known vulnerabilities
- Dependabot opens PRs for security updates
- All dependencies are pinned to specific versions

### Threat 5: Configuration injection

A `.crucible.json` could contain malicious settings.

**Mitigations:**
- Validate the config with Zod (Crucible does this automatically)
- Don't commit `.crucible.json` if you don't trust everyone with repo write access
- Review the config in PRs (it's code)

## Trust boundaries

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  Your code   │ ──→  │   Crucible   │ ──→  │ LLM provider │
│  (local)     │      │  (local)     │      │  (network)   │
└──────────────┘      └──────────────┘      └──────────────┘
                           │
                           ↓
                    ┌──────────────┐
                    │  Findings    │
                    │  (local)     │
                    └──────────────┘
```

Crucible reads your code locally, sends the diff to the provider, gets findings back, and prints them locally. The only network egress is to the LLM provider.

## API key handling

API keys are read from environment variables, never from config files:

```bash
export ANTHROPIC_API_KEY=sk-...
```

Crucible does not write API keys to disk. They are kept in memory only.

If you set the `apiKeyEnv` field in config, Crucible reads the env var at request time. The config file should NOT contain actual API keys.

## File cache security

The file cache contains only:
- Finding titles
- Finding messages
- File paths and line numbers
- Agent IDs
- Timestamps

It does NOT contain:
- Source code
- Diffs
- API keys
- User-identifying information

The cache is just JSON files. If you're paranoid, don't enable the file cache.

## PR comment security

`crucible check` posts a comment to the PR. The comment contains only the findings summary, not the diff. Anyone with read access to the PR can see the comment.

To post comments, Crucible needs a GitHub token with `pull-requests: write` permission. Use a fine-grained token if possible.

## Sandboxing

Crucible itself does not sandbox anything. The `Sandbox` utility is for agents that need to run untrusted code (e.g. to do AST analysis). It does not provide a security boundary against a malicious agent.

If you load untrusted plugins, run Crucible in a container or VM.

## See also

- [SECURITY.md](https://github.com/10xdev4u-alt/crucible/blob/main/SECURITY.md) — disclosure policy
- [Telemetry](/docs/telemetry) — what we (don't) collect
- [Privacy](/docs/telemetry) — same page
- [Configuration](/docs/configuration) — how to set API keys safely
