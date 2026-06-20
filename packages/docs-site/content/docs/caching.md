---
title: Caching
description: How Crucible caches review results
order: 23
category: Documentation
---

# Caching

Crucible caches review results to avoid re-running the same review on the same input. Caching is opt-in and configurable.

## When to use caching

Use caching when:
- The same review will be run multiple times (e.g. in CI on every commit)
- The review is expensive (large diff, many agents, slow provider)
- The diff doesn't change between runs

Don't use caching when:
- The review is run once
- The diff changes every time
- You need real-time results (caching adds invalidation complexity)

## Configuration

```json
{
  "cache": {
    "enabled": true,
    "kind": "memory",
    "ttlSeconds": 3600
  }
}
```

| Field | Type | Default | Description |
|---|---|---|---|
| `enabled` | boolean | `true` | Whether to use the cache. |
| `kind` | string | `memory` | `memory` (in-process) or `file` (persisted to disk). |
| `path` | string | — | Where to store the file cache. Required for `file`. |
| `ttlSeconds` | number | `3600` | Time-to-live for cache entries in seconds. |

## How the cache key is computed

The cache key is a SHA-256 hash of:
- The full diff (or file contents, depending on the target)
- The list of agent IDs being run
- The constraints (severity, category, path filters)
- The provider+model combination
- The config (relevant fields only)

If any of these change, you get a fresh review.

## Cache backends

### `memory` (default)

In-process map. Fast. Lost when the process exits.

Best for: short-lived CI runs, local development.

### `file`

Persisted to disk as JSON files. Slower (disk I/O) but survives restarts.

Best for: long-running watchers, repeated invocations in the same directory.

## How to clear the cache

```bash
crucible cache clear --force
```

Or manually:
- `memory`: just restart the process
- `file`: `rm -rf .crucible-cache`

## Cache size

Default `maxSize` is 1000 entries. For most projects, this is plenty. To change:

The cache is not user-configurable via `.crucible.json` (yet). If you need a custom max size, write a small program that uses `@crucible/core/cache` directly.

## When the cache is bypassed

The cache is bypassed (always runs a fresh review) when:
- `--mock` is set
- `--no-cache` flag is set (planned, not implemented)
- The cache is disabled in config
- The TTL has expired
- The diff has changed

## Implementation

The cache is implemented as a simple `Map<string, { value, expiresAt }>`. The TTL is checked on `get`. There's no LRU eviction; entries are dropped on TTL expiry.

## See also

- [Configuration](/docs/configuration/#cache)
- [Cookbook → Local cache for repeat runs](/docs/cookbook/#recipe-local-cache-for-repeat-runs)
- [Library API → Caches](/docs/api/#caches)
