---
title: Example configurations
description: Ready-to-use .crucible.json profiles
order: 1
category: Examples
---

# Example configurations

Ready-to-use `.crucible.json` profiles. Copy one to your project root and rename it.

## Strict

For production codebases or sensitive domains (payments, auth, health). Emphasizes security, architecture, dependency, and API contract. Higher weight, larger model, longer cache TTL.

```json
{
  "version": 1,
  "project": { "name": "strict", "root": "." },
  "agents": [
    { "id": "security", "weight": 2 },
    { "id": "performance", "weight": 1.5 },
    { "id": "architecture", "weight": 2 },
    { "id": "dependency", "weight": 1.5 },
    { "id": "api-contract", "weight": 2 },
    { "id": "test-coverage", "weight": 1.5 },
    { "id": "accessibility", "weight": 1 },
    { "id": "style", "weight": 0.5 },
    { "id": "documentation", "weight": 0.5 }
  ],
  "providers": [{ "id": "anthropic", "defaultModel": "claude-opus-4-5" }],
  "output": { "format": "text", "color": true, "verbose": false },
  "cache": { "enabled": true, "kind": "file", "ttlSeconds": 86400 },
  "runtime": { "parallelism": 6, "timeoutMs": 120000, "retries": 2 }
}
```

## Lax

For prototyping, demos, and small projects. Few agents, small model, in-memory cache. Fast feedback loop.

```json
{
  "version": 1,
  "project": { "name": "lax", "root": "." },
  "agents": [
    { "id": "security", "weight": 1 },
    { "id": "style", "weight": 1 },
    { "id": "performance", "weight": 1 }
  ],
  "providers": [{ "id": "anthropic", "defaultModel": "claude-haiku-4-5" }],
  "output": { "format": "text", "color": true, "verbose": false },
  "cache": { "enabled": true, "kind": "memory", "ttlSeconds": 3600 },
  "runtime": { "parallelism": 3, "timeoutMs": 60000, "retries": 1 }
}
```

## CI

For CI pipelines. SARIF output for code-scanning integration, file-backed cache, medium parallelism.

```json
{
  "version": 1,
  "project": { "name": "ci", "root": "." },
  "agents": [
    { "id": "security", "weight": 2 },
    { "id": "performance", "weight": 1 },
    { "id": "api-contract", "weight": 2 },
    { "id": "test-coverage", "weight": 1.5 },
    { "id": "dependency", "weight": 1 }
  ],
  "providers": [{ "id": "anthropic", "defaultModel": "claude-sonnet-4-5" }],
  "output": { "format": "sarif", "color": false, "verbose": false },
  "cache": { "enabled": true, "kind": "file", "ttlSeconds": 86400 },
  "runtime": { "parallelism": 4, "timeoutMs": 90000, "retries": 2 }
}
```

## Local (Ollama)

For fully local, free inference. No data leaves your machine.

```json
{
  "version": 1,
  "project": { "name": "local", "root": "." },
  "agents": [
    { "id": "security", "weight": 2 },
    { "id": "performance", "weight": 1 },
    { "id": "style", "weight": 1 },
    { "id": "architecture", "weight": 1 }
  ],
  "providers": [
    {
      "id": "ollama",
      "baseUrl": "http://localhost:11434/v1",
      "defaultModel": "qwen2.5-coder:32b"
    }
  ],
  "output": { "format": "text", "color": true, "verbose": false },
  "cache": { "enabled": true, "kind": "memory", "ttlSeconds": 3600 },
  "runtime": { "parallelism": 2, "timeoutMs": 180000, "retries": 1 }
}
```

## Frontend (web)

For web/frontend projects. Adds accessibility, de-emphasizes backend-specific agents.

```json
{
  "version": 1,
  "project": { "name": "web", "root": "." },
  "agents": [
    { "id": "accessibility", "weight": 2 },
    { "id": "performance", "weight": 2 },
    { "id": "security", "weight": 1.5 },
    { "id": "style", "weight": 1 },
    { "id": "dependency", "weight": 1.5 },
    { "id": "architecture", "weight": 1 }
  ],
  "providers": [{ "id": "anthropic", "defaultModel": "claude-sonnet-4-5" }],
  "output": { "format": "text", "color": true, "verbose": false },
  "cache": { "enabled": true, "kind": "file", "ttlSeconds": 3600 },
  "runtime": { "parallelism": 4, "timeoutMs": 60000, "retries": 2 }
}
```

## Data pipeline

For data engineering / ETL projects. Emphasizes error handling, observability, and data integrity.

```json
{
  "version": 1,
  "project": { "name": "data-pipeline", "root": "." },
  "agents": [
    { "id": "error-handling", "weight": 2 },
    { "id": "observability", "weight": 2 },
    { "id": "performance", "weight": 1.5 },
    { "id": "security", "weight": 1 },
    { "id": "test-coverage", "weight": 1.5 },
    { "id": "dependency", "weight": 1 }
  ],
  "providers": [{ "id": "anthropic", "defaultModel": "claude-sonnet-4-5" }],
  "output": { "format": "text", "color": true, "verbose": false },
  "cache": { "enabled": true, "kind": "file", "ttlSeconds": 86400 },
  "runtime": { "parallelism": 4, "timeoutMs": 120000, "retries": 2 }
}
```
