---
title: CLI reference
description: All Crucible commands and flags
order: 3
category: Documentation
---

# CLI reference

The `crucible` command is the primary user interface. This page documents every subcommand and flag.

## Global usage

```bash
crucible <command> [options]
```

Most commands accept these common flags:

| Flag | Description |
|---|---|
| `--format <name>` | Output format: `text`, `json`, `sarif`, `markdown`, `html`, `junit` |
| `--output <file>` | Write output to a file instead of stdout |
| `--agents <ids>` | Comma-separated list of agent ids to run |
| `--severity <lvls>` | Comma-separated severities to include |
| `--category <cats>` | Comma-separated categories to include |
| `--exclude <paths>` | Comma-separated path prefixes to exclude |
| `--include <paths>` | Comma-separated path prefixes to include |
| `--verbose`, `-v` | Verbose output |
| `--quiet`, `-q` | Suppress non-essential output |
| `--help`, `-h` | Show help |
| `--mock` | Run without making LLM calls |

## `crucible review`

Review code changes.

```bash
crucible review [path] [options]
```

Review the working tree by default. If `path` is given, reviews that path instead.

| Flag | Description |
|---|---|
| `--diff <which>` | What to review: `all`, `staged`, or `working`. Default: `all`. |

**Examples:**

```bash
crucible review                          # review working tree
crucible review --diff staged            # review staged changes
crucible review src/api/                 # review a specific directory
crucible review --agents security,perf   # only two agents
crucible review --severity blocker,critical --format json
crucible review --format sarif --output crucible.sarif
```

## `crucible check`

Review and produce a PR summary (markdown + JSON). Used in CI.

```bash
crucible check [path] [options]
```

Same flags as `review`, plus:

| Flag | Description |
|---|---|
| `--output <file>` | Path for the JSON result file. Default: `crucible-result.json`. |
| `--summary <file>` | Path for the markdown summary file. Default: `crucible-summary.md`. |

The summary is in the format expected by GitHub PR comments.

## `crucible dry-run`

Review without writing any output to stdout. Useful for testing.

```bash
crucible dry-run [path] [options]
```

## `crucible init`

Initialize a `.crucible.json` config file.

```bash
crucible init [--force]
```

| Flag | Description |
|---|---|
| `--force` | Overwrite an existing config. |

## `crucible agents`

List available built-in agents.

```bash
crucible agents [--category <cat>] [--verbose]
```

| Flag | Description |
|---|---|
| `--category <cat>` | Filter by category. |
| `--verbose` | Show categories and capabilities. |

## `crucible status`

Show repo status and pending changes.

```bash
crucible status [path]
```

Outputs:
- Whether the path is a git repo
- Number of staged and working-tree changes
- Whether `.crucible.json` exists
- Last modified time

## `crucible cache`

Manage the local cache.

```bash
crucible cache <command> [--root <path>]
```

| Subcommand | Description |
|---|---|
| `info` | Show cache size and entry count. |
| `list` | List all cache files. |
| `clear` | Delete all cache entries (requires `--force`). |

## `crucible hook`

Install a pre-commit hook.

```bash
crucible hook install
```

The hook runs `crucible review --diff staged --severity blocker,critical --quiet` before each commit. If the review finds issues, the commit is blocked.

To remove the hook, delete `.git/hooks/pre-commit`.

## `crucible schema`

Print the JSON schema for the config.

```bash
crucible schema
crucible schema write --out docs/schema.json
```

## `crucible diff`

Print the parsed git diff as JSON. Useful for piping.

```bash
crucible diff [path] [--which staged|working|all]
crucible diff --output diff.json
```

## `crucible version`

Show the version.

```bash
crucible version
crucible --version
crucible -v
```

## `crucible help`

Show the help text.

```bash
crucible help
crucible --help
crucible -h
```

## Exit codes

| Code | Meaning |
|---|---|
| `0` | Success (no critical/blocker findings). |
| `1` | Review found critical/blocker findings, or an error occurred. |
| `2` | Invalid command-line arguments. |

## Environment variables

See [Configuration → Environment variables](/docs/configuration/#environment-variables).
