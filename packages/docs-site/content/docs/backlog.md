---
title: Backlog
description: Future ideas, not yet committed to a release
order: 32
category: Documentation
---

# Backlog

A collection of ideas that might become features. No commitment, no timeline. If something here is interesting, open an issue or a PR.

## Agent ideas

- **Migration reviewer** — Suggests code changes for major framework upgrades
- **Test flakiness detector** — Identifies tests that use sleeps, time dependencies, network calls
- **Bundle size analyzer** — Reviews imports for tree-shaking opportunities
- **License compliance** — Detects incompatible licenses in dependencies
- **SQL query reviewer** — Validates SQL for performance, security
- **GraphQL schema validator** — Checks for deprecated fields, missing pagination
- **CSS lint agent** — Reviews for unused selectors, specificity issues
- **Regex safety** — Detects ReDoS vulnerabilities
- **Memory leak detector** — Identifies common memory leak patterns
- **Multi-file change reviewer** — Reviews changes that span multiple files

## Provider ideas

- **Cohere** — Already prototyped in docs
- **Mistral** — Native Mistral API
- **AI21** — Jurassic-2
- **Hugging Face** — Inference API
- **Replicate** — Cloud-hosted open models
- **Together.ai** — Open model API
- **Fireworks.ai** — Fast inference
- **OpenRouter** — Unified API for many models

## CLI features

- **`crucible why`** — Explain why a specific finding was made
- **`crucible explain <finding-id>`** — Show the prompt/response that produced it
- **`crucible tune`** — Interactive config tuning
- **`crucible auth`** — Manage API keys (login, logout, switch)
- **`crucible search`** — Search past findings
- **`crucible replay`** — Re-run a review with different settings
- **`crucible compare`** — Diff two reviews
- **`crucible publish`** — Publish a plugin to npm
- **`cruible stats`** — Usage statistics
- **`cruible team`** — Team-level config (shared agents, shared rules)

## Integration ideas

- **VS Code extension** — Full editor integration
- **JetBrains plugin** — IntelliJ, WebStorm, GoLand
- **Neovim plugin** — Lua-based
- **Sublime Text package** — Python-based
- **GitLab CI/CD template** — Quick setup
- **Bitbucket Pipelines** — Quick setup
- **CircleCI orb** — Quick setup
- **Jenkins plugin** — Quick setup
- **Azure DevOps extension** — Quick setup

## Performance ideas

- **Streaming responses** — Stream LLM tokens as they arrive
- **Incremental analysis** — Only re-review changed files
- **Smart caching** — Cache based on content hash, not just input hash
- **Parallel providers** — Use multiple providers for diversity
- **Prompt compression** — Shrink prompts to save tokens
- **Result deduplication across runs** — If the same finding appears in N runs, only show it once
- **Background prefetching** — Pre-warm the cache while you code

## Observability ideas

- **OpenTelemetry integration** — Native tracing
- **Prometheus metrics** — Expose review metrics
- **Sentry integration** — Crash reporting
- **Datadog integration** — APM
- **Custom metrics endpoint** — Push findings to your own backend
- **Web dashboard** — Browse past reviews
- **Slack bot** — Review PRs from Slack

## Advanced features

- **Multi-repository review** — Review across repos
- **Branch comparison** — Review the diff between any two branches
- **Time-travel reviews** — Review a past commit
- **Auto-merge** — Auto-merge PRs that pass review
- **Code suggestions** — Suggest code changes (not just issues)
- **Test generation** — Generate tests for untested code
- **Documentation generation** — Generate JSDoc for undocumented code

## How to add to the backlog

Open an issue with the `backlog` label. Or add to this file in a PR.

## How to promote from backlog

When something is ready:
1. Move it to the [ROADMAP](https://github.com/10xdev4u-alt/crucible/blob/main/docs/ROADMAP.md)
2. Assign a milestone (or create one)
3. Add to the [GitHub Projects](https://github.com/10xdev4u-alt/crucible/projects) board

## See also

- [ROADMAP](https://github.com/10xdev4u-alt/crucible/blob/main/docs/ROADMAP.md) — committed work
- [CHANGELOG](https://github.com/10xdev4u-alt/crucible/blob/main/CHANGELOG.md) — what's shipped
- [GitHub issues](https://github.com/10xdev4u-alt/crucible/issues) — discussion
