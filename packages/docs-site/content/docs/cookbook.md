---
title: Cookbook
description: Production recipes for common scenarios
order: 15
category: Documentation
---

# Cookbook

Battle-tested recipes for common production scenarios.

## Recipe: Monorepo review

Review only the packages that changed in a monorepo.

```bash
# In your monorepo root
crucible review --include packages/api,packages/web
```

```json
{
  "constraints": {
    "includePaths": ["packages/api/", "packages/web/"],
    "excludePaths": ["packages/*/dist/", "packages/*/node_modules/"]
  }
}
```

## Recipe: Differential review (PR diff only)

By default, Crucible reviews the working tree. To review only what's in a PR:

```bash
# Get the diff between main and the current branch
git diff origin/main...HEAD > /tmp/pr.diff

# Pass it to Crucible (via env var or wrapper)
crucible review --mock  # for testing the pipeline
```

(Direct file-diff support is on the roadmap.)

## Recipe: Fail on specific rules

Fail CI only if a specific rule is violated.

```bash
#!/usr/bin/env bash
set -e
crucible review --format json --output result.json

# Fail if any "no-string-concat" finding
hits=$(jq '[.findings[] | select(.ruleId == "no-string-concat")] | length' result.json)
[ "$hits" -gt 0 ] && exit 1 || exit 0
```

## Recipe: Severity-based exit codes

```bash
#!/usr/bin/env bash
result=$(crucible review --format json)
crit=$(echo "$result" | jq '[.findings[] | select(.severity == "critical" or .severity == "blocker")] | length')
major=$(echo "$result" | jq '[.findings[] | select(.severity == "major")] | length')

if [ "$crit" -gt 0 ]; then exit 2  # critical/blocker
elif [ "$major" -gt 5 ]; then exit 1  # > 5 majors
else exit 0
fi
```

## Recipe: Per-package review agents

Different agents for different parts of your monorepo.

```json
{
  "version": 1,
  "agents": [
    {
      "id": "security",
      "weight": 2,
      "options": { "model": "claude-opus-4-5" }
    },
    {
      "id": "api-contract",
      "weight": 2,
      "includePaths": ["packages/api/"]
    }
  ]
}
```

## Recipe: Stale PR cleaner

Run Crucible on PRs that haven't been touched in 7 days and post a comment if new findings exist.

```yaml
# .github/workflows/stale-pr-check.yml
name: Stale PR check
on:
  schedule:
    - cron: '0 9 * * *'

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: pnpm/action-setup@v4
      - run: npm install -g crucible
      - name: Find stale PRs
        id: stale
        uses: actions/stale@v9
        with:
          days-before-stale: 7
          days-before-close: 14
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      - name: Run review
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          git checkout ${{ github.event.pull_request.head.sha }} || exit 0
          crucible check --summary review.md
      - name: Post comment
        if: always()
        uses: marocchino/sticky-pull-request-comment@v2
        with:
          header: crucible
          path: review.md
```

## Recipe: Pre-commit hook with allow-list

Allow specific patterns to bypass the hook.

```bash
#!/usr/bin/env bash
# .git/hooks/pre-commit
# Run Crucible, allow if message contains [skip-review]
if git log -1 --pretty=%B | grep -q '\[skip-review\]'; then
  echo "Skipping Crucible review (commit message contains [skip-review])"
  exit 0
fi
exec crucible review --diff staged --severity blocker,critical --quiet
```

## Recipe: Watch mode for live feedback

Run Crucible on every file change.

```ts
import { FileWatcher, Orchestrator, /* ... */ } from "@crucible/core";

const watcher = new FileWatcher("./src", { intervalMs: 1000 });
const orch = new Orchestrator(agents);

watcher.on(async (event) => {
  if (event.kind === "change" && event.path.endsWith(".ts")) {
    const result = await orch.review(request, context);
    if (result.findings.length > 0) {
      console.clear();
      console.log(formatResult("text", result));
    }
  }
});

watcher.start();
```

## Recipe: Comment on Slack with severity breakdown

```bash
#!/usr/bin/env bash
result=$(crucible review --format json)

msg=$(echo "$result" | jq -r '
  "Crucible review of \`$REPO\`:",
  (.findings | group_by(.severity) | map("  *\(.key)*: \(length)") | join("\n")),
  "Total: \(.findings | length) findings"
')

curl -X POST -H "Content-Type: application/json" \
  -d "$(jq -n --arg text "$msg" '{text: $text}')" \
  "$SLACK_WEBHOOK_URL"
```

## Recipe: Local cache for repeat runs

Enable file cache to speed up repeated reviews.

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

Then warm the cache once:

```bash
crucible review  # warm
crucible review  # instant — all cache hits
```

## Recipe: Telemetry

Track review metrics with the events bus.

```ts
import { EventBus, Orchestrator } from "@crucible/core";

type Events = {
  review_complete: { findings: number; score: number; durationMs: number };
};

const bus = new EventBus<Events>();
bus.on("review_complete", (e) => {
  // Send to your metrics backend
  fetch("https://metrics.example.com/events", {
    method: "POST",
    body: JSON.stringify(e),
  });
});

const orch = new Orchestrator(agents);
// Hook the bus into the orchestrator's events
```

## Recipe: A/B testing agents

Run two different models for the same agent and compare.

```ts
const agentA = new SecurityAgent(new ProviderLLMCaller(anthropicProvider), "claude-opus-4-5");
const agentB = new SecurityAgent(new ProviderLLMCaller(anthropicProvider), "claude-sonnet-4-5");

const agents = new AgentRegistry();
agents.register(agentA);
agents.register(agentB);

const result = await orch.review(request, context);
// Findings will have different agentIds — compare them
const fromA = result.findings.filter((f) => f.agentId === "security");
const fromB = result.findings.filter((f) => f.agentId === "security"); // both have same id!
```

(Hint: subclass with different IDs to differentiate.)

## See also

- [Examples](/docs/examples/)
- [Recipes](/examples/recipes/)
- [Configuration](/docs/configuration/)
