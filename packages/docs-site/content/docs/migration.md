---
title: Migration guide
description: Migrate from other review tools to Crucible
order: 18
category: Documentation
---

# Migration guide

How to switch from another review tool to Crucible.

## From Copilot Code Review

GitHub's Copilot Code Review uses a single LLM pass. Crucible is multi-agent.

**Conceptual changes:**
- Findings are deduped and ranked across multiple agents
- Each agent has its own category and prompt
- You can mix providers (Anthropic + Ollama, etc.)

**Migration steps:**

1. Disable Copilot Code Review on your repo (Settings → Code & automation → Code review).
2. Install Crucible: `npm install -g crucible`
3. Add a workflow:

```yaml
- uses: pnpm/action-setup@v4
- run: npm install -g crucible
- name: Review
  env:
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
  run: crucible check --output result.json --summary summary.md
```

4. (Optional) Post a PR comment using `node packages/cli/dist/github.js post`.

## From Cursor Bugbot

Bugbot focuses on common bug patterns. Crucible has more agents (security, perf, a11y, etc.).

**Differences:**
- Bugbot runs once per PR. Crucible runs in CI on every push.
- Bugbot has fixed agents. Crucible is pluggable.
- Bugbot is managed; Crucible is self-hosted.

**Migration steps:**

1. Cancel Bugbot subscription.
2. Add Crucible to CI (see above).
3. Map Bugbot's categories to Crucible's: `bug` → `concurrency` + `error-handling`, `perf` → `performance`, etc.

## From SonarQube / CodeClimate

These are static analysis tools, not LLM-based. They have different tradeoffs.

**When to keep them:**
- If you need a deterministic, reproducible analysis
- If you need to enforce specific code-quality gates
- If you need enterprise compliance reports

**When to add Crucible:**
- For subjective, judgment-based reviews
- For architectural feedback
- For documentation quality
- For security beyond what static analysis catches

**Run them together:** Use SonarQube for hard checks (complexity, duplication, coverage) and Crucible for soft reviews (clarity, design, intent).

## From ESLint / Biome

Linters are syntactic, not semantic. They can't tell you "this function is hard to understand" or "this design pattern is wrong".

**Run them together:**

```json
{
  "scripts": {
    "lint": "biome check . && crucible review --severity blocker,critical --quiet"
  }
}
```

This runs Biome first (fast, catches syntax), then Crucible (slow, catches design).

## From a custom review script

If you have a one-off review script:

1. Move the prompt into a Crucible agent:

```ts
class MyExistingReviewer extends BaseAgent {
  // ...
  protected readonly prompt = {
    system: myExistingSystemPrompt,
    user: formatMyExistingDiff,
  };
}
```

2. Replace the script's call to the LLM with `orch.review()`.
3. Replace the script's JSON output with a Crucible formatter (`text`, `json`, `sarif`, etc.).
4. Plug the new agent into your existing `AgentRegistry`.

## Rollback

Crucible is non-destructive by default:
- It doesn't write to your files (unless you use `crucible fix`)
- It doesn't push to your repo
- It doesn't modify your git history
- It only writes to `.crucible-cache/` and the output files you specify

To roll back:
1. Remove Crucible from your CI workflow
2. `npm uninstall -g crucible`
3. `rm .crucible.json .crucible-cache/`

## Side-by-side comparison

| Feature | Crucible | Copilot CR | Cursor Bugbot | SonarQube | CodeClimate |
|---|---|---|---|---|---|
| Multi-agent | ✅ | ❌ | ❌ | ❌ | ❌ |
| Self-hosted | ✅ | ❌ | ❌ | ✅ | ❌ |
| Open source | ✅ | ❌ | ❌ | ✅ (community) | ❌ |
| Pluggable providers | ✅ | ❌ | ❌ | N/A | N/A |
| Custom agents | ✅ | ❌ | ❌ | ✅ (rules) | ✅ (rules) |
| SARIF output | ✅ | ❌ | ❌ | ✅ | ✅ |
| JUnit output | ✅ | ❌ | ❌ | ❌ | ❌ |
| Local model | ✅ | ❌ | ❌ | ❌ | ❌ |
| Pre-commit hook | ✅ | ❌ | ❌ | ✅ | ❌ |
| PR comments | ✅ | ✅ | ✅ | ❌ | ❌ |
| Free | ✅ | ❌ | ❌ | ❌ (community = free) | ❌ |

## Need help?

Open an issue: https://github.com/10xdev4u-alt/crucible/issues
