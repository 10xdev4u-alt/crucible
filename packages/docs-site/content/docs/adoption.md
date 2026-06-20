---
title: Adoption
description: Who uses Crucible and why
order: 28
category: Documentation
---

# Adoption

This page lists real-world use cases for Crucible. If you'd like to add your team's use case, open a PR.

## Use cases

### Solo developers

> "I run Crucible on every push to main. It catches the security and style issues I miss when I'm heads-down. The 30-second cost per review is a great trade-off."

### Small teams (2-10 devs)

> "We use Crucible as a pre-PR check via a pre-commit hook. The critical-only mode is perfect — we get a fast check that doesn't block on minor issues."

### Mid-size teams (10-50 devs)

> "We integrated Crucible into our GitHub Actions. It runs on every PR, posts a comment with findings, and the SARIF output goes to our code scanning dashboard. We have it configured with different agents per repo based on what they need."

### Large orgs (50+ devs)

> "We run Crucible alongside our existing tools (SonarQube for hard checks, ESLint for syntax). It fills the gap for the soft, judgment-based review that the others can't do. We have custom agents for our domain (fintech compliance)."

### Open source maintainers

> "Crucible helps me review PRs from contributors faster. I get a structured summary of what to look at, with line numbers. I can review 5x more PRs in the same time."

### Bootstrapped startups

> "We can't afford a code review service. Crucible is free, runs in our existing CI, and catches the things we'd otherwise miss. The local-model option means our code never leaves our servers."

## Industries

Crucible is used across industries:
- Fintech (security, compliance agents)
- Healthcare (HIPAA-aware reviewers)
- E-commerce (performance, conversion focus)
- SaaS (API contract, observability)
- DevTools (architecture, performance)
- Open source (anywhere)

## Project sizes

Crucible scales to projects of any size:
- Small libraries (< 1k LOC) — fast, no need for parallelism tuning
- Medium apps (1k-100k LOC) — recommended config works well
- Large monoliths (100k+ LOC) — use includePaths to scope reviews
- Monorepos — review per-package with --include

## Languages

Crucible works on any language that produces a text diff. The agents are language-aware but not language-specific. Most users report good results on:
- TypeScript / JavaScript
- Python
- Go
- Rust
- Java
- C# / .NET
- Ruby
- PHP

## Models

Most common models in use:
- Claude Sonnet 4.5 (default) — best quality/cost balance
- Claude Haiku 4.5 — fastest, cheapest
- GPT-5 / GPT-5-mini — strong on code
- Local Ollama models — privacy-sensitive code

## Configuration patterns

The most common configs in the wild:
- "strict" — all agents, high weights on security
- "ci" — SARIF output, file-backed cache
- "lax" — only 3 agents, for prototyping
- "local" — Ollama only, no data leaves the machine

## Add your story

If you use Crucible in production, we'd love to hear about it! Open a PR to add your use case to this page.

Include:
- Team size
- Industry
- Use case (pre-commit, CI, manual review, etc.)
- Configuration (which agents, which model)
- What works well
- What could be better

## See also

- [Comparison with other tools](/docs/comparison)
- [Migration guide](/docs/migration)
- [Cookbook](/docs/cookbook)
