---
title: Examples
description: Real-world Crucible recipes
order: 9
category: Documentation
---

# Examples

Real-world recipes for using Crucible.

## Pre-commit gate

Block critical and blocker findings before any commit can land.

```bash
crucible hook install
```

The installed hook runs `crucible review --diff staged --severity blocker,critical --quiet`. To bypass it for a specific commit:

```bash
git commit --no-verify -m "WIP"
```

## GitHub Actions with PR comment

A complete workflow that runs a review and posts the result as a PR comment.

```yaml
name: Crucible review
on:
  pull_request:
    branches: [main]

permissions:
  contents: read
  pull-requests: write

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version: 22

      - run: npm install -g crucible

      - name: Run review
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          crucible check \
            --output crucible-result.json \
            --summary crucible-summary.md

      - name: Upload SARIF
        if: always()
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: crucible.sarif

      - name: Post PR comment
        if: always()
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          node packages/cli/dist/github.js post \
            --input crucible-summary.md \
            --pr ${{ github.event.pull_request.number }}

      - name: Fail on critical
        run: |
          critical=$(jq '[.findings[] | select(.severity == "critical" or .severity == "blocker")] | length' crucible-result.json)
          if [ "$critical" -gt 0 ]; then
            echo "Found $critical critical/blocker findings"
            exit 1
          fi
```

## Review only changed files

By default, Crucible reviews all uncommitted changes. To review only files in a specific directory:

```bash
crucible review src/auth/
```

Or use the include/exclude constraints in your config:

```json
{
  "agents": [...],
  "constraints": {
    "includePaths": ["src/"],
    "excludePaths": ["src/generated/", "dist/"]
  }
}
```

## Custom agent for your domain

Write a domain-specific agent (e.g. for your company's compliance rules):

```ts
import { BaseAgent, type LLMCaller, type PromptTemplate } from "@crucible/core";

const SYSTEM_PROMPT = `You are a compliance reviewer for ACME Corp.
Check for:
- PII in log statements
- Missing GDPR consent markers
- Data retention policy violations
- Cross-border data transfer without approval

Output findings in the standard format:
### <title> [<severity>]
**File:** <path>:<line>
**Rule:** <rule-id>
**Message:** <detailed message>`;

const PROMPT = {
  system: SYSTEM_PROMPT,
  user: (input) => `Review these changes:\n\n${formatFiles(input)}`,
};

export class ComplianceAgent extends BaseAgent {
  protected readonly agentInfo = {
    id: "compliance",
    name: "Compliance Reviewer",
    version: "1.0.0",
    description: "ACME Corp compliance rules",
    categories: ["compliance"],
    capabilities: ["gdpr", "pii"],
  };
  protected readonly prompt = PROMPT;

  protected override parseResponse(content: string) {
    return parseStructuredFindings(content, this.agentInfo.id);
  }
}
```

Register it:

```ts
const agents = new AgentRegistry();
agents.register(new ComplianceAgent(caller));
```

## Piping findings to a Slack bot

```bash
crucible review --format json | jq -r '
  .findings[] |
  select(.severity == "critical" or .severity == "blocker") |
  "🚨 \(.severity) in \(.location.file):\(.location.line) — \(.title)"
' | curl -X POST -d @- https://hooks.slack.com/services/...
```

## Use a local model for privacy-sensitive code

```json
{
  "providers": [
    {
      "id": "ollama",
      "baseUrl": "http://localhost:11434/v1",
      "defaultModel": "qwen2.5-coder:32b"
    }
  ]
}
```

No data leaves your machine.

## Per-agent model selection

Different agents, different models. Override per agent:

```json
{
  "agents": [
    { "id": "security", "weight": 2, "options": { "model": "claude-opus-4-5" } },
    { "id": "style", "weight": 0.5, "options": { "model": "claude-haiku-4-5" } }
  ]
}
```

## Programmatic usage in a CI script

```ts
import { Orchestrator, AgentRegistry, ... } from "@crucible/core";

const orch = new Orchestrator(agents, { parallelism: 4 });
const result = await orch.review(request, context);

if (result.findings.some(f => f.severity === "critical")) {
  process.exitCode = 1;
}

console.log(formatResult("markdown", result));
```

See [Library API](/docs/api/) for the full surface.
