---
title: Architecture
description: How Crucible is put together
order: 7
category: Documentation
---

# Architecture

Crucible is a multi-agent code review orchestrator. This page explains the high-level architecture, the data flow, and the extension points.

## Goals

- **Parallel by default** — multiple review agents run concurrently.
- **Pluggable everywhere** — providers, agents, formatters, and caches are all swappable.
- **No magic** — every step in the pipeline is inspectable and testable.
- **Type-safe** — strict TypeScript, no `any`, explicit interfaces.
- **CI-friendly** — exits non-zero on critical findings, supports SARIF, JUnit, and JSON output.

## Module layout

```
packages/core/
  src/
    types/         # Domain model (Finding, ReviewRequest, etc.)
    utils/         # Hashing, rate limit, scheduler, sandbox, tokens
    cache/         # MemoryCache, FileCache (TTL-based)
    registry/      # AgentRegistry, ProviderRegistry
    orchestrator/  # Dedup, scorer, parallel, Orchestrator
    agents/        # Built-in review agents (13 specialized)
    providers/     # Anthropic, OpenAI, Ollama, OpenAI-compatible
    output/        # Text, JSON, SARIF, Markdown, HTML, JUnit formatters
    policies/      # Retry, circuit breaker
```

## Data flow

```
            ┌──────────────────┐
            │ ReviewRequest    │   User / CLI
            │ + ReviewContext  │
            └─────────┬────────┘
                      │
                      ▼
            ┌──────────────────┐
            │  Orchestrator    │   packages/core
            └─────────┬────────┘
                      │  for each agent (parallel)
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
   ┌────────┐    ┌────────┐    ┌────────┐
   │Agent 1 │    │Agent 2 │    │Agent N │
   └───┬────┘    └───┬────┘    └───┬────┘
       │             │             │
       └─────────────┼─────────────┘
                     ▼
            ┌──────────────────┐
            │  Dedup + Score   │
            └─────────┬────────┘
                      ▼
            ┌──────────────────┐
            │  ReviewResult    │
            └─────────┬────────┘
                      ▼
            ┌──────────────────┐
            │   Formatter      │   text/json/sarif/...
            └─────────┬────────┘
                      ▼
                  stdout/file
```

## Extension points

### Add a new agent

```ts
import { BaseAgent, ProviderLLMCaller } from "@crucible/core";

class MyAgent extends BaseAgent {
  protected readonly agentInfo = {
    id: "my-agent",
    name: "My Reviewer",
    version: "1.0.0",
    description: "Reviews for my specific concern",
    categories: ["..."],
    capabilities: ["..."],
  };
  protected readonly prompt = {
    system: "...",
    user: (input) => "...",
  };
  protected override parseResponse(content: string) {
    return [];
  }
}

const agents = new AgentRegistry();
agents.register(new MyAgent(caller));
```

### Add a new provider

```ts
import { type Provider, type ProviderRequest, type ProviderResponse } from "@crucible/core";

class MyProvider implements Provider {
  info() { /* ProviderInfo */ }
  async complete(req: ProviderRequest): Promise<ProviderResponse> { /* ... */ }
}

const providers = new ProviderRegistry();
providers.register(new MyProvider());
```

### Add a new formatter

```ts
import { type Formatter, type ReviewResult } from "@crucible/core";

class MyFormatter implements Formatter {
  format(result: ReviewResult): string { /* ... */ }
}
```

### Add a new cache backend

Implement the cache interface:

```ts
import { MemoryCache } from "@crucible/core"; // or implement your own

class MyCache<T> {
  get(key: string): T | undefined { /* ... */ }
  set(key: string, value: T, ttlMs?: number): void { /* ... */ }
  delete(key: string): boolean { /* ... */ }
  has(key: string): boolean { /* ... */ }
  size(): number { /* ... */ }
  clear(): void { /* ... */ }
}
```

## Consensus algorithm

Findings are grouped by `(file, line, ruleId)`. For each group:

1. The highest-confidence finding wins (or highest severity on tie).
2. The score is the sum of `severityWeight * confidence` across all findings in the group, multiplied by `(1 + 0.25 * (n - 1))` as an "agreement bonus."

This rewards findings that multiple agents agree on, even if no single agent is 100% confident.

## Retry & timeout strategy

The orchestrator wraps each agent call in a retry loop (configurable retries) and a timeout (configurable `timeoutMs`). The parallel executor also enforces a timeout for the whole parallel batch.

Errors from individual agents do not stop the review — they are collected in `result.errors` and reported alongside the findings.

## Performance

- The orchestrator does not spawn N processes. Agents run in the same Node.js process. For 10 agents with `parallelism: 4`, four agents run concurrently, then the next four, etc.
- Findings are deduped in O(n) time using a `Map`.
- The cache is TTL-based with O(1) `get` and `set`.

Benchmarks (10 agents, 50ms delay each, 4-way parallelism): **155ms wall time** for a 10-agent review with 5 findings each. 3.25x speedup vs. serial.

## Security

- The orchestrator never executes arbitrary user code. The sandbox utility (`@crucible/core/utils/sandbox`) is available for agents that need it, but it's opt-in.
- Provider API keys are passed via the `apiKey` option and never written to disk by Crucible.
- File-based cache stores serialized findings — no source code.
