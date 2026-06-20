---
title: Configuration reference
description: Complete .crucible.json schema
order: 26
category: Documentation
---

# Configuration reference

The complete `.crucible.json` schema, generated from the Zod definition.

The config file is validated when Crucible starts. Invalid configs produce a clear error message. To print the JSON schema for editor tooling:

```bash
crucible schema > crucible.schema.json
```

## Top-level

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `version` | `1` | ✅ | — | Schema version. |
| `project` | object | ❌ | `{}` | Project metadata. |
| `agents` | AgentConfig[] | ❌ | `[]` | List of agents. |
| `providers` | ProviderConfig[] | ❌ | `[]` | List of LLM providers. |
| `output` | object | ❌ | (see below) | Output formatting. |
| `cache` | object | ❌ | (see below) | Cache configuration. |
| `runtime` | object | ❌ | (see below) | Runtime behavior. |

## Project

```json
{
  "project": {
    "name": "my-app",
    "root": "."
  }
}
```

| Field | Type | Description |
|---|---|---|
| `name` | string | Display name for the project. |
| `root` | string | Path to the project root, relative to the config file. |

## Agent

```json
{
  "id": "security",
  "weight": 2,
  "enabled": true,
  "options": {
    "model": "claude-opus-4-5",
    "prompt": "Custom instructions…"
  }
}
```

| Field | Type | Default | Description |
|---|---|---|---|
| `id` | string | (required) | The agent's id. See the agents reference. |
| `weight` | number (0-10) | `1` | How much this agent's findings count toward the consensus. |
| `enabled` | boolean | `true` | Whether the agent runs. |
| `options` | object | `{}` | Agent-specific options. |

The `options` object's schema depends on the agent. Built-in agents recognize:
- `model`: string — override the default model
- `prompt`: string — override the system prompt

Custom agents can define their own `options` schema.

## Provider

```json
{
  "id": "anthropic",
  "enabled": true,
  "apiKeyEnv": "ANTHROPIC_API_KEY",
  "baseUrl": "https://api.anthropic.com",
  "defaultModel": "claude-sonnet-4-5",
  "options": {}
}
```

| Field | Type | Default | Description |
|---|---|---|---|
| `id` | string | (required) | Provider id. One of `anthropic`, `openai`, `gemini`, `bedrock`, `ollama`, or a custom id. |
| `enabled` | boolean | `true` | Whether the provider is enabled. |
| `apiKeyEnv` | string | `${ID}_API_KEY` (uppercased) | Environment variable containing the API key. |
| `baseUrl` | string | provider-specific | API base URL. |
| `defaultModel` | string | (provider-specific) | Default model id. |
| `options` | object | `{}` | Provider-specific options. |

## Output

```json
{
  "output": {
    "format": "text",
    "destination": "stdout",
    "filePath": "./crucible-report.md",
    "color": true,
    "verbose": false
  }
}
```

| Field | Type | Default | Description |
|---|---|---|---|
| `format` | `text` \| `json` \| `sarif` \| `markdown` \| `html` \| `junit` \| `csv` \| `gitlab` | `text` | Output format. |
| `destination` | `stdout` \| `stderr` \| `file` | `stdout` | Where to write. |
| `filePath` | string | — | Path to write to (when destination is `file`). |
| `color` | boolean | auto | Use ANSI colors in text output. |
| `verbose` | boolean | `false` | Include per-agent stats in the output. |

## Cache

```json
{
  "cache": {
    "enabled": true,
    "kind": "memory",
    "path": "./.crucible-cache",
    "ttlSeconds": 3600
  }
}
```

| Field | Type | Default | Description |
|---|---|---|---|
| `enabled` | boolean | `true` | Whether to use the cache. |
| `kind` | `memory` \| `file` | `memory` | Cache backend. |
| `path` | string | — | Required when `kind` is `file`. |
| `ttlSeconds` | number | `3600` | Time-to-live in seconds. |

## Runtime

```json
{
  "runtime": {
    "parallelism": 4,
    "timeoutMs": 60000,
    "retries": 2
  }
}
```

| Field | Type | Default | Description |
|---|---|---|---|
| `parallelism` | number (1-32) | `4` | How many agents to run concurrently. |
| `timeoutMs` | number | `60000` | Per-agent timeout in milliseconds. |
| `retries` | number (0-5) | `2` | Number of retries per agent on failure. |

## Constraint (per review)

The `constraints` field is passed per-review (not in the config). It can include:

| Field | Type | Description |
|---|---|---|
| `maxFindings` | number | Truncate the report. |
| `maxFindingsPerFile` | number | Max findings per file. |
| `categories` | string[] | Filter by category. |
| `severities` | string[] | Filter by severity. |
| `agentIds` | string[] | Only run these agents. |
| `excludePaths` | string[] | Skip files matching these prefixes. |
| `includePaths` | string[] | Only review files matching these prefixes. |
| `timeoutMs` | number | Override the per-agent timeout. |
| `parallelism` | number | Override the parallelism. |

## Complete example

```json
{
  "version": 1,
  "project": {
    "name": "production-app",
    "root": "."
  },
  "agents": [
    {
      "id": "security",
      "weight": 2,
      "options": { "model": "claude-opus-4-5" }
    },
    {
      "id": "performance",
      "weight": 1.5,
      "options": { "model": "claude-sonnet-4-5" }
    },
    {
      "id": "style",
      "weight": 1
    },
    {
      "id": "test-coverage",
      "enabled": true
    }
  ],
  "providers": [
    {
      "id": "anthropic",
      "defaultModel": "claude-sonnet-4-5"
    }
  ],
  "output": {
    "format": "text",
    "color": true,
    "verbose": false
  },
  "cache": {
    "enabled": true,
    "kind": "file",
    "path": "./.crucible-cache",
    "ttlSeconds": 86400
  },
  "runtime": {
    "parallelism": 4,
    "timeoutMs": 60000,
    "retries": 2
  }
}
```

## See also

- [Configuration guide](/docs/configuration)
- [Reference → output formats](/docs/output-formats)
- [CLI reference](/docs/cli)
