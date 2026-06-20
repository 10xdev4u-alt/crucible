---
title: API reference
description: Auto-generated reference for every exported symbol
order: 0
category: API
---

# API reference

This page is generated from the source code on every build. It lists every exported symbol from `@crucible/core` with its kind and source location.

To regenerate: `pnpm --filter @crucible/docs-site run build:api`.

See the full table below.

[→ Go to the generated reference →](/docs/api-reference/)

## How to read the table

| Column | Meaning |
|---|---|
| Symbol | The exported name. |
| Kind | `function`, `class`, `type`, `interface`, `const`, `enum`, or `re-export`. |
| Source | Path and line number in the codebase. Click to jump to the source on GitHub. |

## Categories

The exports are grouped by module:

- **Agents** — `SecurityAgent`, `PerformanceAgent`, `StyleAgent`, etc.
- **Providers** — `AnthropicProvider`, `OpenAIProvider`, `OllamaProvider`, `OpenAICompatibleProvider`, `ProviderRouter`.
- **Orchestrator** — `Orchestrator`, `dedupeFindings`, `runParallel`, `consensusScore`, etc.
- **Output** — `TextFormatter`, `JsonFormatter`, `SarifFormatter`, `MarkdownFormatter`, `HtmlFormatter`, `JUnitFormatter`.
- **Cache** — `MemoryCache`, `FileCache`.
- **Registry** — `AgentRegistry`, `ProviderRegistry`.
- **Utilities** — `RateLimiter`, `Semaphore`, `Mutex`, `EventBus`, `Stopwatch`, `Histogram`, `LogBuffer`, `TokenTally`, etc.
- **Policies** — `CircuitBreaker`, `retry`, `withRetries`, `RetryPolicy`.
- **Types** — All the request, response, finding, and config types.
