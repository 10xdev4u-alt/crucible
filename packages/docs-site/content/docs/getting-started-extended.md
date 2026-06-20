---
title: Getting started — extended
description: Detailed walkthrough with examples
order: 29
category: Documentation
---

# Getting started — extended

A more detailed walkthrough than [Getting started](/docs/getting-started). Use this if you want a complete walkthrough with all the options.

## Step 1: Install

```bash
npm install -g crucible
```

Or from source:

```bash
git clone https://github.com/10xdev4u-alt/crucible.git
cd crucible
pnpm install
pnpm build
```

Verify:

```bash
crucible --version
# crucible v0.1.0
```

## Step 2: Initialize

```bash
cd your-project
crucible init
```

This creates `.crucible.json`:

```json
{
  "version": 1,
  "project": { "name": "my-app", "root": "." },
  "agents": [
    { "id": "security", "weight": 2 },
    { "id": "performance", "weight": 1.5 },
    { "id": "style", "weight": 1 },
    { "id": "architecture", "weight": 1.5 },
    { "id": "accessibility", "weight": 1 },
    { "id": "dependency", "weight": 1 },
    { "id": "test-coverage", "weight": 1 },
    { "id": "api-contract", "weight": 1.5 },
    { "id": "documentation", "weight": 0.5 }
  ],
  "providers": [
    { "id": "anthropic", "defaultModel": "claude-sonnet-4-5" }
  ],
  "output": { "format": "text", "destination": "stdout", "color": true, "verbose": false },
  "cache": { "enabled": true, "kind": "memory", "ttlSeconds": 3600 },
  "runtime": { "parallelism": 4, "timeoutMs": 60000, "retries": 2 }
}
```

## Step 3: Set an API key

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

Or in your `.bashrc` / `.zshrc` for persistence.

For other providers, see the [Providers reference](/docs/providers).

## Step 4: Run your first review

```bash
crucible review
```

This will:
1. Find your git diff
2. Send it to the LLM
3. Print findings to stdout

Sample output:

```
Crucible Review
  result:    abc123
  request:   r-1234567890
  duration:  12.3s
  score:     8.50
  findings:  4

Findings
  CRITICAL   SQL injection
              category: security
              location: src/db.ts:42
              rule:     no-string-concat
              Use parameterized queries.
```

## Step 5: Iterate

Now that the basics work, try:

### Different output formats

```bash
crucible review --format json     # machine-readable
crucible review --format sarif    # code scanning
crucible review --format markdown # for PR comments
crucible review --format html     # for browser viewing
```

### Different agents

```bash
crucible review --agents security           # one agent
crucible review --agents security,perf     # two agents
crucible review --severity blocker,critical # filter by severity
```

### Different scopes

```bash
crucible review src/                    # one directory
crucible review --include src/api/        # include path prefix
crucible review --exclude dist,node_modules # exclude paths
```

### Pre-commit

```bash
crucible hook install
```

Now `git commit` will run Crucible first.

### CI

Add a workflow:

```yaml
# .github/workflows/crucible.yml
- uses: pnpm/action-setup@v4
- run: npm install -g crucible
- run: crucible check --output result.json --summary summary.md
```

## Step 6: Customize

Now that you have the basics, customize Crucible for your project:

### Add custom agents

See [Writing custom agents](/docs/writing-agents). Custom agents let you review for things specific to your project (your company's compliance rules, your team's coding standards, etc.).

### Use a different model

```bash
export ANTHROPIC_API_KEY=sk-...
crucible review  # uses Claude Sonnet 4.5 by default
```

Or override per-agent:

```json
{
  "agents": [
    { "id": "security", "options": { "model": "claude-opus-4-5" } },
    { "id": "style", "options": { "model": "claude-haiku-4-5" } }
  ]
}
```

### Run on a local model

```json
{
  "providers": [
    {
      "id": "ollama",
      "baseUrl": "http://localhost:11434/v1",
      "defaultModel": "qwen2.5-coder:32b"
    }
  ]
}
```

### Use a cache for repeat runs

```json
{
  "cache": {
    "enabled": true,
    "kind": "file",
    "path": "./.crucible-cache",
    "ttlSeconds": 86400
  }
}
```

## Step 7: Production hardening

For production use, consider:

- **Pin a specific model version** to avoid regressions
- **Use a file-backed cache** for faster repeat runs
- **Run with `--mock`** in test environments to avoid API costs
- **Set up SARIF output** for GitHub code scanning
- **Configure retries and timeouts** for slow providers
- **Use a secrets manager** (Vault, AWS Secrets Manager) for API keys in production

See [Performance](/docs/performance) and [Security model](/docs/security) for details.

## Common next steps

- [Configuration guide](/docs/configuration) — full schema
- [CLI reference](/docs/cli) — every command
- [Library API](/docs/api) — programmatic usage
- [Architecture](/docs/architecture) — how it works internally
- [Cookbook](/docs/cookbook) — production recipes

## See also

- [Quick start](/docs/getting-started) — the 5-minute version
- [Migration guide](/docs/migration) — from other tools
- [Examples](/docs/examples) — example configurations
- [FAQ](/docs/faq) — frequently asked questions
