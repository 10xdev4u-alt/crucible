---
title: Configuration
description: Configure Crucible with .crucible.json
order: 2
category: Documentation
---

# Configuration

Crucible is configured via a `.crucible.json` file in your project root. Run `crucible init` to generate one with sensible defaults.

## Schema

```json
{
  "version": 1,
  "project": { "name": "my-app", "root": "." },
  "agents": [
    { "id": "security", "weight": 2, "enabled": true, "options": {} }
  ],
  "providers": [
    { "id": "anthropic", "defaultModel": "claude-sonnet-4-5" }
  ],
  "output": { "format": "text", "color": true, "verbose": false },
  "cache": { "enabled": true, "kind": "memory", "ttlSeconds": 3600 },
  "runtime": { "parallelism": 4, "timeoutMs": 60000, "retries": 2 }
}
```

## Top-level fields

| Field | Type | Description |
|---|---|---|
| `version` | `1` | Schema version. Currently only `1` is supported. |
| `project` | object | Project metadata. |
| `project.name` | string? | Display name. |
| `project.root` | string? | Project root, relative to the config file. |
| `agents` | AgentConfig[] | List of agents to run. |
| `providers` | ProviderConfig[] | List of LLM providers. |
| `output` | object | Output formatting. |
| `cache` | object | Cache configuration. |
| `runtime` | object | Runtime behavior. |

## Agents

```json
{
  "id": "security",
  "weight": 2,
  "enabled": true,
  "options": {
    "model": "claude-opus-4-5",
    "prompt": "Custom prompt…"
  }
}
```

| Field | Type | Description |
|---|---|---|
| `id` | string | One of the built-in agent ids (see [Agents](/docs/agents/)). |
| `weight` | number (0-10) | How much this agent's findings count toward the consensus score. Default: 1. |
| `enabled` | boolean | Set to `false` to disable without removing. Default: `true`. |
| `options.model` | string? | Override the default model for this agent. |
| `options.prompt` | string? | Override the agent's system prompt. |

## Providers

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

| Field | Type | Description |
|---|---|---|
| `id` | string | Provider id (`anthropic`, `openai`, `ollama`, or a custom one). |
| `enabled` | boolean | Default: `true`. |
| `apiKeyEnv` | string? | Name of the environment variable containing the API key. Default: `${ID}_API_KEY` (uppercased). |
| `baseUrl` | string? | Override the API base URL. |
| `defaultModel` | string? | Default model id for this provider. |
| `options` | object | Provider-specific options. |

## Output

```json
{
  "format": "text",
  "destination": "stdout",
  "filePath": "./crucible-report.md",
  "color": true,
  "verbose": false
}
```

| Field | Type | Description |
|---|---|---|
| `format` | string | One of `text`, `json`, `sarif`, `markdown`, `html`, `junit`. |
| `destination` | string | `stdout`, `stderr`, or `file`. |
| `filePath` | string? | Path to write to (when destination is `file`). |
| `color` | boolean | Enable ANSI color in text output. Default: `true` if TTY. |
| `verbose` | boolean | Include per-agent stats in the output. Default: `false`. |

## Cache

```json
{
  "enabled": true,
  "kind": "memory",
  "path": "./.crucible-cache",
  "ttlSeconds": 3600
}
```

| Field | Type | Description |
|---|---|---|
| `enabled` | boolean | Default: `true`. |
| `kind` | string | `memory` or `file`. |
| `path` | string? | Cache directory (when kind is `file`). |
| `ttlSeconds` | number | Time-to-live for cache entries. Default: 3600. |

## Runtime

```json
{
  "parallelism": 4,
  "timeoutMs": 60000,
  "retries": 2
}
```

| Field | Type | Description |
|---|---|---|
| `parallelism` | number (1-32) | How many agents to run concurrently. Default: 4. |
| `timeoutMs` | number | Per-agent timeout in milliseconds. Default: 60000. |
| `retries` | number (0-5) | Number of retries per agent on failure. Default: 2. |

## Profiles

Three example profiles are in the [`examples/`](https://github.com/10xdev4u-alt/crucible/tree/main/examples) directory:

### `strict.crucible.json`
For production codebases or sensitive domains (payments, auth, health). Higher weight, larger model, longer cache TTL.

### `lax.crucible.json`
For prototyping, demos, and small projects. Few agents, small model, in-memory cache. Fast feedback loop.

### `ci.crucible.json`
For CI pipelines. SARIF output for code-scanning integration, file-backed cache, medium parallelism.

## Validation

Crucible validates your config against a Zod schema. If validation fails, you'll see a helpful error message:

```text
crucible: invalid config: providers.0.id: Invalid input
```

Run `crucible schema` to print the full JSON schema. Pipe it to a tool like `jq` to inspect it:

```bash
crucible schema | jq '.properties.agents.items'
```

## Environment variables

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Anthropic API key (or set `apiKeyEnv` in config). |
| `OPENAI_API_KEY` | OpenAI API key. |
| `GITHUB_TOKEN` | For `crucible check` PR comment posting. |
| `GITHUB_REPOSITORY` | `<owner>/<repo>` (auto-set in GitHub Actions). |
| `PR_NUMBER` | PR number (auto-set in GitHub Actions). |
