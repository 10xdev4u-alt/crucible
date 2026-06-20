# Crucible

> Multi-agent code review orchestrator. Code refined by fire.

[![CI](https://github.com/10xdev4u-alt/crucible/actions/workflows/ci.yml/badge.svg)](https://github.com/10xdev4u-alt/crucible/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node 22+](https://img.shields.io/badge/node-%E2%89%A522-green.svg)](https://nodejs.org)

A CLI + library that runs **multiple specialized review agents in
parallel** on a diff, aggregates their findings through a **consensus
scorer**, and outputs structured, actionable review reports.

## Why

Single-pass LLM review misses things. Different agents (security,
performance, style, architecture) catch different classes of issues.
A consensus mechanism ranks the strongest findings. The output
feels like a panel of senior reviewers — not a single rubber-stamp.

## Features

- **9 specialized reviewers** out of the box: security, performance,
  style, architecture, accessibility, dependency, test coverage,
  API contract, documentation
- **Multi-perspective consensus** — findings are scored and
  ranked across all agents
- **6 output formats** — text, JSON, SARIF, Markdown, HTML, JUnit
- **4 providers** — Anthropic, OpenAI, Ollama, OpenAI-compatible
- **CI integration** — pre-commit hook, GitHub PR comments, SARIF
  for code scanning
- **Configurable** — `.crucible.json` for agents, providers,
  runtime, output, cache
- **Bounded parallel** — control concurrency, retries, timeouts
- **Pluggable cache** — in-memory or file-backed
- **TypeScript strict** — built with `noUncheckedIndexedAccess`,
  100% typed

## Quick start

```bash
# Install (once published)
npm install -g crucible

# Or use directly via npx
npx crucible review
```

In a git repository with uncommitted changes:

```bash
# Generate a default config
crucible init

# Run all agents on the working tree
crucible review

# Only critical/blocker findings, as SARIF
crucible review --severity blocker,critical --format sarif --output crucible.sarif
```

## Usage examples

### Local development

```bash
# Quick review of staged changes
crucible review --diff staged

# Run a single agent
crucible review --agents security

# JSON output for piping
crucible review --format json | jq '.findings[].severity'
```

### CI / GitHub Actions

```yaml
# .github/workflows/crucible.yml
- name: Crucible review
  env:
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  run: |
    crucible check --output crucible-result.json --summary crucible-summary.md
- name: Post PR comment
  if: always()
  run: |
    node packages/cli/dist/github.js post --input crucible-summary.md --pr ${{ github.event.pull_request.number }}
```

### Pre-commit hook

```bash
crucible hook install
```

This installs a hook that runs a quick critical-only review on
staged changes before each commit.

## Configuration

A `.crucible.json` controls everything:

```json
{
  "version": 1,
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

See [`examples/`](examples/) for strict, lax, and CI profiles.

## Commands

```
crucible review [path]    Review a directory, file, or diff
crucible check [path]     Review and produce a PR summary
crucible init             Initialize a .crucible.json config file
crucible agents           List available agents
crucible status [path]    Show repo status and pending changes
crucible cache <cmd>      Manage the local cache
crucible hook install     Install a pre-commit hook
crucible version          Show the version
```

## Library usage

```ts
import {
  Orchestrator,
  AgentRegistry,
  AnthropicProvider,
  InMemoryHttpClient,
  SecurityAgent,
  PerformanceAgent,
  StyleAgent,
  ProviderLLMCaller,
  TextFormatter,
} from "@crucible/core";

const provider = new AnthropicProvider({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  httpClient: new InMemoryHttpClient(),
});
const caller = new ProviderLLMCaller(provider);

const agents = new AgentRegistry();
agents.register(new SecurityAgent(caller));
agents.register(new PerformanceAgent(caller));
agents.register(new StyleAgent(caller));

const orchestrator = new Orchestrator(agents, { parallelism: 3 });
const result = await orchestrator.review(request, context);
console.log(new TextFormatter().format(result));
```

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     CLI (crucible)                       │
└────────────────────────┬─────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────┐
│                      Orchestrator                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                │
│  │ Security │  │   Perf   │  │   Style  │   (parallel)   │
│  └─────┬────┘  └────┬─────┘  └────┬─────┘                │
│        └─────────────┼─────────────┘                      │
│              ┌───────▼────────┐                          │
│              │   Dedup+Score  │                          │
│              └───────┬────────┘                          │
│                      ▼                                   │
│         ┌──────────────────────┐                        │
│         │     Formatter        │   (text/json/sarif/...) │
│         └──────────────────────┘                        │
└──────────────────────────────────────────────────────────┘
```

## License

MIT — see [`LICENSE`](LICENSE).
