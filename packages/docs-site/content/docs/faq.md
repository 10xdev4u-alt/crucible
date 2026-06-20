---
title: FAQ
description: Frequently asked questions
order: 11
category: Documentation
---

# FAQ

## What is Crucible?

A multi-agent code review orchestrator. It runs several specialized LLM-powered reviewers in parallel on your changes and aggregates their findings.

## Why "multi-agent"?

A single LLM call has a limited attention budget. Different reviewers can focus on different concerns (security, performance, style, architecture) and catch issues that a general-purpose reviewer would miss. Crucible uses a consensus mechanism to combine their findings.

## How is this different from Copilot Code Review, Cursor Bugbot, etc.?

Crucible is open source, framework-agnostic, and provider-agnostic. You can plug in your own LLM, run it locally with Ollama, or use a hosted endpoint via OpenAI-compatible APIs. The output formats (SARIF, JUnit, HTML, etc.) integrate with your existing CI tooling.

## Which model should I use?

- **Balanced quality and cost**: `claude-sonnet-4-5` (Anthropic) or `gpt-5-mini` (OpenAI).
- **Highest quality**: `claude-opus-4-5` or `gpt-5`.
- **Cheapest**: `claude-haiku-4-5` or `gpt-5-nano`.
- **Fully local**: any Ollama model that supports tool use (e.g. `qwen2.5-coder:32b`).

## How much does a review cost?

It depends on the size of the diff and the model. A typical review of a 200-line diff with Sonnet is in the $0.05–$0.15 range.

You can enable caching (`cache: { enabled: true, kind: "file" }`) to avoid re-reviewing unchanged files.

## Can I write my own agents?

Yes. See the [Agents](/docs/agents/) page. An agent is a class that extends `BaseAgent` and implements `parseResponse()`.

## Can I use a different model for each agent?

Yes, via the `options.model` field in your config:

```json
{
  "agents": [
    { "id": "security", "options": { "model": "claude-opus-4-5" } },
    { "id": "style", "options": { "model": "claude-haiku-4-5" } }
  ]
}
```

## How does the consensus work?

Findings with the same `(file, line, ruleId)` are grouped. The highest-confidence finding (or highest severity on tie) is kept. The score is the sum of `severity * confidence` for each finding in the group, multiplied by an "agreement bonus" that grows with the number of agents that agreed.

## Can Crucible auto-fix issues?

Not in v0.1. The findings include a `fix` field with a suggested diff, but applying it is up to you (or a follow-up tool).

## Is it fast?

Reviews take 10–60 seconds for typical PRs, depending on the model and parallelism. The orchestrator runs agents in parallel and uses caching to skip unchanged files on subsequent runs.

Benchmark: 10 agents with 4-way parallelism completes in **~155ms** for synthetic 5-finding-per-agent diffs.

## What's the license?

MIT.

## How can I contribute?

See [CONTRIBUTING](https://github.com/10xdev4u-alt/crucible/blob/main/docs/CONTRIBUTING.md) and the issue tracker. We welcome new agents, new providers, new formatters, and bug reports.

## Will my code be sent to a third party?

Only if you configure a hosted provider (Anthropic, OpenAI). With Ollama or another local model, your code never leaves your machine. Crucible itself does not collect telemetry by default.
