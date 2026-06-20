---
title: Recipes
description: Common Crucible recipes
order: 0
category: Examples
---

# Recipes

Common, copy-pasteable recipes.

## Get the count of critical findings

```bash
crucible review --format json | \
  jq '[.findings[] | select(.severity == "critical" or .severity == "blocker")] | length'
```

## Fail CI on any critical finding

```bash
crit=$(crucible review --format json | jq '[.findings[] | select(.severity == "critical" or .severity == "blocker")] | length')
[ "$crit" -gt 0 ] && exit 1 || exit 0
```

## Only review files matching a glob

```json
{
  "constraints": {
    "includePaths": ["src/", "lib/"],
    "excludePaths": ["src/generated/", "dist/", "node_modules/"]
  }
}
```

## Use a different model for each agent

```json
{
  "agents": [
    { "id": "security", "options": { "model": "claude-opus-4-5" } },
    { "id": "performance", "options": { "model": "claude-sonnet-4-5" } },
    { "id": "style", "options": { "model": "claude-haiku-4-5" } }
  ]
}
```

## Cache review results across CI runs

```json
{
  "cache": {
    "enabled": true,
    "kind": "file",
    "path": "./.crucible-cache",
    "ttlSeconds": 86400
  }
}
```

## Run Crucible in a pre-push hook

```bash
cat > .git/hooks/pre-push <<'EOF'
#!/usr/bin/env bash
exec crucible review --diff working --severity blocker,critical --quiet
EOF
chmod +x .git/hooks/pre-push
```

## Send a Slack notification on critical findings

```bash
crit=$(crucible review --format json | jq -r '
  .findings[] |
  select(.severity == "critical" or .severity == "blocker") |
  "🚨 *\(.severity)* in `\(.location.file):\(.location.line // "?")` — \(.title)"
')

if [ -n "$crit" ]; then
  curl -X POST -H "Content-Type: application/json" \
    -d "{\"text\": \"$crit\"}" \
    "$SLACK_WEBHOOK_URL"
fi
```

## Use a custom prompt with the security agent

```json
{
  "agents": [
    {
      "id": "security",
      "weight": 2,
      "options": {
        "prompt": "You are reviewing for ACME Corp. Pay special attention to auth in /src/auth/."
      }
    }
  ]
}
```

## Pipe the SARIF output to a code-scanning dashboard

```bash
crucible review --format sarif --output crucible.sarif
curl -X POST -H "Content-Type: application/sarif+json" \
  --data @crucible.sarif \
  https://api.your-scanning-tool.example.com/upload
```

## Watch mode (re-review on file change)

```ts
import { FileWatcher, Orchestrator, /* ... */ } from "@crucible/core";

const watcher = new FileWatcher("./src", { intervalMs: 2000 });
const orch = new Orchestrator(agents);
watcher.on(async (e) => {
  console.log(`${e.kind}: ${e.path}`);
  if (e.kind === "change") {
    const result = await orch.review(request, context);
    console.log(formatResult("text", result));
  }
});
watcher.start();
```

## Integrate with a custom code analyzer

```ts
import { type Agent, type AgentInput, type AgentOutput } from "@crucible/core";

class MyAnalyzer implements Agent {
  info() {
    return {
      id: "my-analyzer",
      name: "My Static Analyzer",
      version: "1.0.0",
      description: "Runs my custom AST analysis",
      categories: ["custom"],
      capabilities: ["ast"],
    };
  }

  async review(input: AgentInput): Promise<AgentOutput> {
    const findings = [];
    for (const file of input.context.changeSet?.files ?? []) {
      // Run your analyzer here
    }
    return { agentId: "my-analyzer", findings, durationMs: 0 };
  }
}
```

See [Library API](/docs/api/) for more.
