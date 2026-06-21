---
title: Tutorials
description: Step-by-step tutorials
order: 36
category: Documentation
---

# Tutorials

Step-by-step tutorials for common workflows.

## Tutorial 1: Your first 5 minutes with Crucible

By the end of this tutorial, you'll have run Crucible on a real project and seen findings.

### Step 1: Install
```bash
npm install -g crucible
```

### Step 2: Initialize
```bash
cd your-project
crucible init
```

### Step 3: Set an API key
```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

### Step 4: Make a change
```bash
echo 'console.log("hello")' > test.js
```

### Step 5: Review
```bash
crucible review
```

You should see something like:
```
Crucible Review
  result:    ...
  duration:  5.2s
  findings:  0

No findings.
```

### Step 6: Make a worse change
```bash
cat > test.js << 'EOF'
const API_KEY = "sk-1234";
const query = `SELECT * FROM users WHERE name = '${name}'`;
EOF
crucible review
```

Now you should see findings for the hardcoded key and the SQL injection.

### Step 7: Try different formats
```bash
crucible review --format json --output result.json
cat result.json | jq '.findings'
```

## Tutorial 2: Adding Crucible to your CI

By the end of this tutorial, you'll have Crucible running on every PR.

### Step 1: Add a workflow
Create `.github/workflows/crucible.yml`:

```yaml
name: Crucible review

on:
  pull_request:
    branches: [main]

jobs:
  review:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write

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
          crucible check --output result.json --summary summary.md

      - name: Post PR comment
        if: always()
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          node packages/cli/dist/github.js post \
            --input summary.md \
            --pr ${{ github.event.pull_request.number }}

      - name: Upload SARIF
        if: always()
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: crucible.sarif

      - name: Fail on critical
        if: always()
        run: |
          crit=$(jq '[.findings[] | select(.severity == "critical" or .severity == "blocker")] | length' result.json)
          if [ "$crit" -gt 0 ]; then
            echo "Found $crit critical/blocker findings"
            exit 1
          fi
```

### Step 2: Add the secret
In your GitHub repo, go to Settings → Secrets and variables → Actions → New repository secret. Add:
- Name: `ANTHROPIC_API_KEY`
- Value: your API key

### Step 3: Open a PR
Open a PR. Crucible runs, posts a comment, and the SARIF shows up in the Security tab.

## Tutorial 3: Writing a custom agent

By the end of this tutorial, you'll have a custom agent that catches issues specific to your project.

### Step 1: Create the agent file
Create `crucible-plugins/company-agent.ts`:

```ts
import { BaseAgent, type LLMCaller, type PromptTemplate } from "@crucible/core";

const SYSTEM_PROMPT = `You are a reviewer for ACME Corp. Look for:
- Hardcoded customer IDs
- Missing audit log statements
- Use of forbidden APIs
- Inconsistent error messages

For each issue, output:
### <title> [<severity>]
**File:** <path>:<line>
**Rule:** <rule-id>
**Message:** <detailed message>`;

const PROMPT = {
  system: SYSTEM_PROMPT,
  user: (input) => {
    // Format the diff for the LLM
    return formatDiff(input.context.changeSet);
  },
};

class CompanyAgent extends BaseAgent {
  protected readonly agentInfo = {
    id: "company",
    name: "ACME Corp Reviewer",
    version: "1.0.0",
    description: "Reviews for ACME Corp-specific issues",
    categories: ["company"],
    capabilities: ["acme-rules"],
  };
  protected readonly prompt = PROMPT;
  protected override parseResponse(content: string) {
    // Use the default parser
    return parseStructuredFindings(content, this.agentInfo.id);
  }
}

export default {
  agent: new CompanyAgent(caller),
};
```

### Step 2: Register the plugin
In your `crucible.ts`:

```ts
import { discoverPlugins, AgentRegistry } from "@crucible/core";

const registry = new AgentRegistry();
const plugins = await discoverPlugins("./crucible-plugins");
for (const plugin of plugins) {
  for (const agent of plugin.agents) {
    registry.register(agent);
  }
}
```

### Step 3: Run
```bash
crucible review
```

Your custom agent now runs alongside the built-in ones.

## Tutorial 4: Building a release pipeline

By the end of this tutorial, you'll have Crucible as part of your release process.

### Step 1: Add a release workflow
Create `.github/workflows/release.yml`:

```yaml
name: Release
on:
  push:
    tags: ['v*']

permissions:
  contents: write
  packages: write

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          registry-url: https://registry.npmjs.org/
      - run: npm install -g crucible
      - name: Pre-release review
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          crucible review --diff ${{ github.ref_name }} --format json --output pre-release.json
          crit=$(jq '[.findings[] | select(.severity == "critical" or .severity == "blocker")] | length' pre-release.json)
          if [ "$crit" -gt 0 ]; then
            echo "Pre-release review found $crit critical issues. Aborting."
            exit 1
          fi
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### Step 2: Tag a release
```bash
git tag v1.0.0
git push --tags
```

The release workflow runs Crucible, then publishes. If Crucible finds critical issues, the publish is aborted.

## Tutorial 5: Custom formatters

By the end of this tutorial, you'll have a custom formatter that outputs Slack messages.

### Step 1: Write the formatter
```ts
import type { ReviewResult } from "@crucible/core";

class SlackFormatter {
  format(result: ReviewResult): string {
    if (result.findings.length === 0) {
      return "✅ No issues found";
    }
    const lines = result.findings.map((f) => {
      const icon = severityIcon(f.severity);
      const loc = f.location?.file ?? "?";
      return `${icon} *${f.severity}* in \`${loc}\`: ${f.title}`;
    });
    return lines.join("\n");
  }
}

function severityIcon(s: string): string {
  return { blocker: "🚨", critical: "🚨", major: "⚠️", minor: "💡", info: "ℹ️" }[s] ?? "•";
}
```

### Step 2: Use it
```ts
import { Orchestrator } from "@crucible/core";
import { SlackFormatter } from "./slack-formatter.js";

const result = await orch.review(request, context);
const slackMessage = new SlackFormatter().format(result);

// Post to Slack
await fetch(process.env.SLACK_WEBHOOK_URL!, {
  method: "POST",
  body: JSON.stringify({ text: slackMessage }),
});
```

## See also

- [Getting started](/docs/getting-started)
- [Configuration](/docs/configuration)
- [Writing custom agents](/docs/writing-agents)
- [Cookbook](/docs/cookbook)
