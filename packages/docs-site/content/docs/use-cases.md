---
title: Use cases
description: Real-world use cases for Crucible
order: 35
category: Documentation
---

# Use cases

Concrete examples of how teams use Crucible.

## 1. Pre-PR check

**Setup**: A team of 5 developers wants to catch issues before code review.

**Config**:
```json
{
  "agents": [
    { "id": "security", "weight": 2 },
    { "id": "performance", "weight": 1 },
    { "id": "style", "weight": 0.5 }
  ],
  "output": { "format": "text" }
}
```

**Usage**:
```bash
crucible hook install
```

Now `git commit` triggers a quick review. Block critical and blocker findings, allow minor.

## 2. CI gate

**Setup**: A team wants to block PRs that introduce critical issues.

**Workflow**:
```yaml
- uses: pnpm/action-setup@v4
- run: npm install -g crucible
- name: Crucible review
  env:
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
  run: |
    crucible review --format json --output result.json
    crit=$(jq '[.findings[] | select(.severity == "critical" or .severity == "blocker")] | length' result.json)
    [ "$crit" -gt 0 ] && exit 1
```

## 3. Code scanning

**Setup**: A security team wants SARIF output for GitHub code scanning.

**Workflow**:
```yaml
- uses: pnpm/action-setup@v4
- run: npm install -g crucible
- name: Run Crucible
  env:
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
  run: crucible review --format sarif --output crucible.sarif
- uses: github/codeql-action/upload-sarif@v3
  with:
    sarif_file: crucible.sarif
```

Findings appear in the Security tab of the PR.

## 4. PR comment

**Setup**: A team wants a structured PR comment.

**Workflow**:
```yaml
- uses: pnpm/action-setup@v4
- run: npm install -g crucible
- name: Run Crucible
  env:
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
  run: crucible check --output result.json --summary summary.md
- name: Post comment
  if: always()
  run: |
    node packages/cli/dist/github.js post \
      --input summary.md \
      --pr ${{ github.event.pull_request.number }}
```

## 5. Live development feedback

**Setup**: A solo developer wants instant feedback as they code.

**Usage**:
```bash
crucible watch
```

The watch command re-reviews on file changes. Results appear in the terminal.

## 6. Local model for privacy

**Setup**: A team that handles sensitive data wants zero code to leave their machine.

**Config**:
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

**Usage**:
```bash
# Run a local Ollama instance
ollama serve

# Run Crucible with the local model
crucible review
```

All inference is local. No data leaves the machine.

## 7. Domain-specific agents

**Setup**: A fintech company wants to check for compliance with PCI-DSS.

**Custom agent**:
```ts
class PCIDSSAgent extends BaseAgent {
  protected readonly agentInfo = {
    id: "pcidss",
    name: "PCI-DSS Reviewer",
    description: "Reviews for PCI-DSS compliance issues",
    categories: ["compliance", "security"],
  };

  protected readonly prompt = {
    system: `You are a PCI-DSS compliance reviewer. Look for:
- Hardcoded card numbers (PAN)
- Unencrypted cardholder data
- Missing access logs for cardholder data access
- Insecure key management
- Missing CVV/CVC validation
...`,
    user: (input) => `Review these changes:\n\n${formatFiles(input)}`,
  };

  protected override parseResponse(content: string) {
    return parseStructuredFindings(content, this.agentInfo.id);
  }
}
```

**Register and use**:
```ts
import { PCIDSSAgent } from "./pcidss-agent.js";
agents.register(new PCIDSSAgent(caller));
```

## 8. Multi-language monorepo

**Setup**: A monorepo with TypeScript, Python, and Go packages.

**Config**:
```json
{
  "constraints": {
    "includePaths": ["packages/api/", "packages/web/"]
  }
}
```

Different agents for different languages. Or one agent that knows multiple languages.

## 9. Scheduled audit

**Setup**: A security team wants weekly security audits.

**Workflow** (`.github/workflows/weekly-audit.yml`):
```yaml
on:
  schedule:
    - cron: '0 9 * * 1'
jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: npm install -g crucible
      - name: Run security audit
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          git checkout main
          git checkout -b audit/$(date +%Y-%m-%d)
          crucible review --diff working --format sarif --output audit.sarif
          git add audit.sarif
          git commit -m "chore: weekly security audit"
          git push -u origin audit/$(date +%Y-%m-%d)
```

Open a PR with the findings. Review weekly.

## 10. Cache for repeat runs

**Setup**: CI runs Crucible on every commit, but many commits don't change reviewable code.

**Config**:
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

Repeat runs hit the cache and are instant.

## See also

- [Configuration](/docs/configuration)
- [CI examples](https://github.com/10xdev4u-alt/crucible/tree/main/.github/workflows)
- [Cookbook](/docs/cookbook)
- [Migration guide](/docs/migration)
