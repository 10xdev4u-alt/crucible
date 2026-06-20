---
title: Performance
description: Performance characteristics and tuning
order: 16
category: Documentation
---

# Performance

How Crucible performs, what affects throughput, and how to tune for your workload.

## Benchmark

Run the built-in benchmark:

```bash
pnpm --filter @crucible/core run bench
```

Sample output:

```text
Crucible benchmark
  agents:      10
  parallelism: 4
  agent delay: 50ms
  findings:    5/agent
  files:       20
  elapsed:     154ms
  findings:    5
  score:       5.00
  theoretical min: 150ms
  speedup:         3.25x
```

This runs 10 fake agents (50ms delay each) through the orchestrator with 4-way parallelism.

## Throughput

For real reviews, throughput depends on:

| Factor | Impact |
|---|---|
| **Provider latency** | Dominates. Each review waits on N round-trips. |
| **Number of agents** | Linear. 10 agents ≈ 10 round-trips. |
| **Parallelism** | Linear up to your provider's rate limit. |
| **Diff size** | Sub-linear. LLM context is the bottleneck. |
| **Cache hits** | ~10x speedup on cached diffs. |

A typical review of a 200-line PR with 4 agents on `claude-sonnet-4-5`:

- **Cold**: 8-15 seconds
- **Cached**: <1 second
- **Parallelism=4 vs 1**: 3-4x faster

## Memory

- **Orchestrator**: O(1) per agent + O(n) for findings
- **MemoryCache**: O(maxSize) — default 1000 entries
- **FileCache**: streams to disk; bounded by `maxMemory` option
- **LSP server**: ~20MB baseline

For most use cases, memory is not a concern. For very large reviews, tune `maxSize` in the cache config.

## Latency

Worst-case latency = (number of agents) × (slowest agent delay) / parallelism + overhead

For 10 agents with average 5s response time and parallelism=4:
- Min: 12.5s
- Realistic (with retries): 15-20s
- With cache: <1s

## Tuning tips

### For latency-sensitive workflows

```json
{
  "runtime": {
    "parallelism": 8,
    "timeoutMs": 30000,
    "retries": 1
  }
}
```

- Higher parallelism = faster, but more API rate-limit pressure
- Lower timeout = fail-fast, but might miss good findings on slow responses
- Fewer retries = faster failure, but flakier

### For cost-sensitive workflows

```json
{
  "agents": [
    { "id": "security", "options": { "model": "claude-opus-4-5" } },
    { "id": "performance", "options": { "model": "claude-haiku-4-5" } }
  ],
  "cache": { "enabled": true, "kind": "file", "ttlSeconds": 604800 }
}
```

- Use a small model for non-critical agents
- Long cache TTL to avoid re-reviewing
- Run only critical agents on every PR; full review on merge to main

### For reliability

```json
{
  "runtime": {
    "parallelism": 4,
    "timeoutMs": 120000,
    "retries": 3
  },
  "cache": { "enabled": true, "kind": "memory", "ttlSeconds": 3600 }
}
```

- Higher retry count handles transient failures
- Longer timeout handles slow providers
- Memory cache is fastest for the same session

## Profiling

Crucible doesn't ship with a built-in profiler, but you can wrap a review:

```ts
import { performance } from "node:perf_hooks";
import { Orchestrator, /* ... */ } from "@crucible/core";

const start = performance.now();
const result = await orch.review(request, context);
const total = performance.now() - start;

console.log(`Total: ${total.toFixed(0)}ms`);
console.log(`Per agent:`);
for (const stat of result.agentStats) {
  console.log(`  ${stat.agentId}: ${stat.durationMs}ms (${stat.findingsCount} findings)`);
}
```

## Cost model

For `claude-sonnet-4-5` at $3/M input, $15/M output:

- 200-line diff = ~10K input tokens
- Average response = ~2K output tokens
- Per agent: 10K × $3/M + 2K × $15/M = $0.06
- 4 agents: ~$0.24 per review

For `claude-haiku-4-5`:
- 4 agents: ~$0.064 per review

Caching reduces this dramatically for repeat runs on the same diff.

## See also

- [Configuration](/docs/configuration/)
- [Providers](/docs/providers/)
- [Cookbook](/docs/cookbook/)
