# Crucible — Build Plan

A multi-agent code review orchestrator. Code refined by fire.

## Concept

A CLI + library that runs **multiple specialized review agents in parallel**
on a diff, aggregates their findings through a **consensus scorer**, and
outputs structured, actionable review reports.

## Why

Single-pass LLM review misses things. Different agents (security, perf,
style, architecture) catch different classes of issues. A consensus
mechanism ranks the strongest findings. The output feels like a panel of
senior reviewers — not a single rubber-stamp.

## Architecture

```
crucible/
├── packages/
│   ├── core/           # Orchestration, types, registry
│   ├── agents/         # Built-in review agents
│   ├── output/         # Output formatters (text, json, sarif, html)
│   ├── providers/      # Model providers (anthropic, openai, ollama)
│   ├── cli/            # CLI binary
│   └── lsp/            # LSP server
├── examples/           # Example configs and outputs
├── docs/               # Documentation
└── tools/              # Internal scripts
```

## Phases

1. **Foundation** (15 commits) — repo, tooling, CI, docs skeleton
2. **Core types** (15 commits) — domain model, interfaces, tests
3. **Orchestrator** (20 commits) — pipeline, registry, cache, runner
4. **Providers** (15 commits) — anthropic, openai, ollama, compat
5. **Built-in agents** (20 commits) — 10 specialized reviewers
6. **Output formatters** (10 commits) — text, json, sarif, markdown, html
7. **CLI** (20 commits) — commands, flags, integration
8. **Integrations** (15 commits) — github, gitlab, lsp, hooks
9. **Polish** (15 commits) — telemetry, docs, examples

**Target: ~145 commits**

## Conventions

- Conventional commits, one-liner
- No AI mention in commit messages
- TypeScript strict
- Biome for lint/format
- Vitest for tests
- pnpm workspaces
- Node 22+

## Out of scope (for now)

- Web UI
- Hosted service
- Self-hosted mode
