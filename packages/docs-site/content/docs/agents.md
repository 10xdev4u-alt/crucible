---
title: Built-in agents
description: The 13 specialized reviewers
order: 4
category: Documentation
---

# Built-in agents

Crucible ships with 13 specialized review agents. Each one focuses on a different class of issues and is implemented as a prompt template + a parser that turns the LLM response into structured findings.

## The agents

| Agent | Categories | What it catches |
|---|---|---|
| `security` | security, dependency, error-handling | SQL injection, XSS, auth bypasses, hardcoded secrets, weak crypto, SSRF |
| `performance` | performance, concurrency, observability | O(n²) loops, N+1 queries, memory leaks, sync I/O on the request path |
| `style` | style, maintainability, best-practice | Naming, magic numbers, function length, idiom mismatches |
| `architecture` | architecture, maintainability | Coupling, circular deps, leaky abstractions, layering violations |
| `accessibility` | accessibility | Missing alt text, ARIA, focus management, semantic HTML |
| `dependency` | dependency, compatibility | License issues, CVE-prone packages, version pinning, transitive risk |
| `test-coverage` | testing | Missing tests, edge cases, error paths, flaky patterns |
| `api-contract` | api-contract, compatibility | Breaking changes, inconsistent error responses, missing pagination |
| `documentation` | documentation | Missing JSDoc, stale comments, broken examples |
| `i18n` | i18n, compatibility | Hardcoded strings, locale issues, direction assumptions |
| `observability` | observability, error-handling | Missing logs, metrics, traces, correlation IDs |
| `concurrency` | concurrency, data-integrity | Race conditions, deadlocks, ABA, missing locks |
| `error-handling` | error-handling, reliability | Swallowed exceptions, wrong exception types, leaking stack traces |

## How an agent works

Each agent is a TypeScript class that extends `BaseAgent`:

```ts
import { BaseAgent } from "@crucible/core";

class MyAgent extends BaseAgent {
  protected readonly agentInfo = {
    id: "my-agent",
    name: "My Reviewer",
    version: "1.0.0",
    description: "Reviews for X",
    categories: ["my-category"],
    capabilities: ["x-detection"],
  };

  protected readonly prompt = {
    system: "You are a senior engineer who reviews for X. ...",
    user: (input) => `Review these changes:\n\n${formatFiles(input)}`,
  };

  protected override parseResponse(content: string): Finding[] {
    return parseStructuredFindings(content, this.agentInfo.id);
  }
}
```

The orchestrator calls `agent.review(input)`, which:
1. Sends the system + user prompt to the LLM.
2. Parses the response into `Finding` objects.
3. Returns the findings with metadata.

## The parser

The default parser expects a structured response:

```markdown
### <title> [<severity>]
**File:** <path>:<line>
**Rule:** <rule-id>
**Message:** <detailed message>
```

Example:

```markdown
### SQL injection [critical]
**File:** src/db.ts:42
**Rule:** no-string-concat
**Message:** User input concatenated into SQL string. Use parameterized queries.
```

The parser extracts each `### ...` block and creates a `Finding` object.

## Writing a custom agent

See the [API reference](/api/) for the full `Agent` interface. You can:

1. **Extend `BaseAgent`** if you want a prompt-based agent.
2. **Implement the `Agent` interface directly** if you need full control (e.g. for a code-analysis-based agent that doesn't use an LLM).

To register a custom agent:

```ts
import { AgentRegistry } from "@crucible/core";
import { MyAgent } from "./my-agent.js";

const registry = new AgentRegistry();
registry.register(new MyAgent(caller));
```

## Weighting

Use the `weight` field in your config to adjust how much an agent's findings count toward the consensus score. Default is 1.

```json
{
  "agents": [
    { "id": "security", "weight": 2 },
    { "id": "style", "weight": 0.5 }
  ]
}
```

A higher weight means the agent's findings rank higher in the consensus calculation.

## Disabling agents

Use `enabled: false` to skip an agent without removing its config:

```json
{
  "agents": [
    { "id": "documentation", "enabled": false }
  ]
}
```
