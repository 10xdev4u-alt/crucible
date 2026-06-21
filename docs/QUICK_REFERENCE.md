# Quick reference

A one-page cheat sheet for Crucible.

## Install

```bash
npm install -g crucible
```

## Common commands

```bash
crucible init                      # create .crucible.json
crucible review                    # review working tree
crucible review --diff staged      # review staged changes
crucible review --format json     # JSON output
crucible review --mock             # no LLM calls
crucible check                     # review + markdown summary
crucible fix                       # review + auto-apply fixes
crucible trace                     # per-agent timing
crucible watch                     # continuous review
crucible doctor                    # check environment
crucible validate                  # validate config
crucible agents                    # list agents
crucible status                    # repo status
crucible diff                      # show parsed diff
crucible schema                    # show config schema
crucible version                   # show version
crucible --help                    # all options
```

## Common flags

| Flag | Description |
|---|---|
| `--format <name>` | Output format (text, json, sarif, markdown, html, junit, csv, gitlab) |
| `--output <file>` | Write to file instead of stdout |
| `--agents <ids>` | Comma-separated agent ids to run |
| `--severity <lvls>` | Filter by severity (info, minor, major, critical, blocker) |
| `--category <cats>` | Filter by category (security, performance, style, etc.) |
| `--include <paths>` | Include path prefixes |
| `--exclude <paths>` | Exclude path prefixes |
| `--diff <which>` | What to review (all, staged, working) |
| `--mock` | No LLM calls |
| `--verbose`, `-v` | Verbose output |
| `--quiet`, `-q` | Suppress non-essential output |
| `--help`, `-h` | Show help |

## Configuration

```json
{
  "version": 1,
  "agents": [
    { "id": "security", "weight": 2 }
  ],
  "providers": [
    { "id": "anthropic", "defaultModel": "claude-sonnet-4-5" }
  ],
  "output": { "format": "text" },
  "cache": { "kind": "memory", "ttlSeconds": 3600 },
  "runtime": { "parallelism": 4, "timeoutMs": 60000, "retries": 2 }
}
```

## Environment variables

```bash
export ANTHROPIC_API_KEY=sk-...     # Anthropic
export OPENAI_API_KEY=sk-...        # OpenAI
export GEMINI_API_KEY=...           # Google Gemini
# AWS_* for Bedrock
```

## Programmatic usage

```ts
import { Orchestrator, AgentRegistry, AnthropicProvider, /* ... */ } from "@crucible/core";

const provider = new AnthropicProvider({ apiKey: process.env.ANTHROPIC_API_KEY! });
const caller = new ProviderLLMCaller(provider);

const agents = new AgentRegistry();
agents.register(new SecurityAgent(caller));
// ... register more agents

const orch = new Orchestrator(agents);
const result = await orch.review(request, context);
console.log(formatResult("text", result));
```

## Exit codes

| Code | Meaning |
|---|---|
| 0 | Success |
| 1 | Review found critical/blocker issues, or error |
| 2 | Invalid arguments |

## See also

- [CLI reference](/docs/cli)
- [Configuration](/docs/configuration)
- [Library API](/docs/api)
