---
title: Troubleshooting
description: Common issues and how to fix them
order: 10
category: Documentation
---

# Troubleshooting

Common issues and how to fix them.

## "ANTHROPIC_API_KEY is not set"

Crucible needs an API key to talk to a provider. Set one in your environment:

```bash
export ANTHROPIC_API_KEY=sk-...
```

Or use the `--mock` flag for a no-op review that runs the pipeline without making any LLM calls.

## "No changes to review"

The orchestrator couldn't find any git changes. Make sure you're in a git repository with uncommitted changes:

```bash
git status
git diff
```

If you want to review a specific commit or branch, see [Examples](/docs/examples/).

## "Provider not found for model"

The model id passed to `--model` doesn't match any registered provider. Check the available models:

```bash
crucible agents
```

## "Cannot find module '@crucible/core'"

You're trying to import the core library from a project that doesn't have it as a dependency. Install it:

```bash
pnpm add @crucible/core
```

For a self-built version (this repo):

```bash
pnpm install
pnpm build
```

## "frozen-lockfile" errors in CI

Your `pnpm-lock.yaml` is out of date. Run locally:

```bash
pnpm install
git add pnpm-lock.yaml
git commit -m "build: update lockfile"
```

## Tests are slow

Vitest runs in parallel by default. To run a single file:

```bash
pnpm --filter @crucible/core test -- src/output/text.test.ts
```

## Output is empty

Make sure your `findings` array is non-empty. If you're using `--mock`, the mock provider returns empty content. Set a real provider and API key to get real findings.

## Pre-commit hook blocks commits

The hook runs `crucible review --severity blocker,critical`. If it blocks a commit you want to force, run:

```bash
git commit --no-verify
```

To remove the hook entirely:

```bash
rm .git/hooks/pre-commit
```

## "diff parser failed"

If the diff parser can't read your diff, file an issue with a sample. The parser supports standard `git diff` output (unified format with `a/` and `b/` or `i/` and `w/` prefixes). For exotic formats, the parser regex in [`packages/cli/src/git/diff.ts`](https://github.com/10xdev4u-alt/crucible/blob/main/packages/cli/src/git/diff.ts) can be extended.

## "fatal: not a git repository"

The CLI requires a git repo to compute diffs. Either `git init` or pass a `ChangeSet` programmatically.

## Reviews are too slow

- Reduce `parallelism` if you have rate limits.
- Increase `cache.ttlSeconds` to cache more aggressively.
- Use a smaller model (`claude-haiku-4-5` instead of `claude-opus-4-5`).
- Use Ollama for local, free inference.

## Costs are too high

- Use `claude-haiku-4-5` for most agents.
- Reserve `claude-opus-4-5` for security (highest weight).
- Enable caching to avoid re-reviewing unchanged files.
- Set `maxFindings` to truncate the report.

## Getting more help

- File an issue: https://github.com/10xdev4u-alt/crucible/issues
- Read the [architecture doc](/docs/architecture/)
- Check the [CHANGELOG](https://github.com/10xdev4u-alt/crucible/blob/main/CHANGELOG.md)
