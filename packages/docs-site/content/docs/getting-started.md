---
title: Getting started
description: Install Crucible and run your first review
order: 1
category: Documentation
---

# Getting started

This guide walks you through installing Crucible, configuring it for your project, and running your first review.

## Prerequisites

- **Node.js 22+** (LTS recommended)
- **pnpm 9+** or **npm 10+** (any package manager works)
- A git repository (Crucible uses git for diff parsing)
- An API key for at least one LLM provider (Anthropic, OpenAI, etc.) — or use `--mock` for no-LLM experimentation

## Install

### From npm (once published)

```bash
npm install -g crucible
```

### From source

```bash
git clone https://github.com/10xdev4u-alt/crucible.git
cd crucible
pnpm install
pnpm build
```

## Initialize

In your project root:

```bash
crucible init
```

This writes a `.crucible.json`:

```json
{
  "version": 1,
  "project": { "name": "my-app", "root": "." },
  "agents": [
    { "id": "security", "weight": 2 },
    { "id": "performance", "weight": 1.5 },
    { "id": "style", "weight": 1 }
  ],
  "providers": [
    { "id": "anthropic", "defaultModel": "claude-sonnet-4-5" }
  ],
  "output": { "format": "text", "color": true },
  "cache": { "enabled": true, "kind": "memory", "ttlSeconds": 3600 },
  "runtime": { "parallelism": 4, "timeoutMs": 60000, "retries": 2 }
}
```

Edit it to match your project. See [Configuration](/docs/configuration/) for the full schema.

## Configure your provider

Set one of these environment variables:

```bash
# Anthropic (recommended)
export ANTHROPIC_API_KEY=sk-ant-...

# OpenAI
export OPENAI_API_KEY=sk-...

# Or use a local Ollama instance
export CRUCIBLE_OLLAMA_URL=http://localhost:11434/v1
```

## Run your first review

### With a real provider

```bash
crucible review
```

This will:
1. Find all changed files in your working tree
2. Send them to each enabled agent in parallel
3. Deduplicate and rank the findings
4. Print a summary to stdout

### With the mock provider (no API key needed)

```bash
crucible review --mock
```

This runs the full pipeline without making any LLM calls. Useful for testing your config or CI setup.

### Review specific things

```bash
# Only critical and blocker findings
crucible review --severity blocker,critical

# Only the security agent
crucible review --agents security

# Staged changes only
crucible review --diff staged

# JSON output for piping
crucible review --format json | jq '.findings[]'

# SARIF for code scanning
crucible review --format sarif --output crucible.sarif
```

## Add a pre-commit hook

```bash
crucible hook install
```

This installs a git hook that runs a quick critical-only review on staged changes before each commit. To bypass the hook for a specific commit:

```bash
git commit --no-verify
```

## Run in CI

A typical GitHub Actions workflow:

```yaml
name: crucible
on: [pull_request]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: pnpm install -g crucible
      - name: Run review
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          crucible check \
            --output crucible-result.json \
            --summary crucible-summary.md
      - name: Upload SARIF
        if: always()
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: crucible.sarif
```

## What next?

- Read the [Configuration](/docs/configuration/) guide
- Explore the [CLI reference](/docs/cli/)
- See the [library API](/api/)
- Read about [Architecture](/docs/architecture/)
- Browse [Examples](/examples/)
