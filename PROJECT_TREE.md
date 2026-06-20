# Crucible — Project tree

This is the high-level structure of the repository. For details, see the relevant docs.

```
crucible/
├── packages/
│   ├── core/                 # The library (99 source files)
│   │   ├── src/
│   │   │   ├── agents/         # 15 built-in review agents
│   │   │   ├── cache/          # MemoryCache, FileCache
│   │   │   ├── lsp/            # LSP server scaffold
│   │   │   ├── orchestrator/   # Pipeline + dedup + scoring + parallel
│   │   │   ├── output/         # 6 formatters
│   │   │   ├── policies/       # retry, circuit breaker
│   │   │   ├── plugins/        # Plugin loader
│   │   │   ├── providers/      # 5 LLM providers
│   │   │   ├── registry/       # AgentRegistry, ProviderRegistry
│   │   │   ├── types/          # Domain types
│   │   │   └── utils/          # 18 utility modules
│   │   ├── bench/              # Orchestrator benchmark
│   │   └── dist/               # Built output
│   │
│   ├── cli/                  # The `crucible` command (12 commands)
│   │   └── src/
│   │       ├── commands/        # review, check, init, agents, etc.
│   │       ├── git/             # Git diff parser
│   │       ├── argv.ts          # Argv parser
│   │       ├── github.ts        # PR comment poster
│   │       ├── program.ts       # CLI entry point
│   │       └── index.ts         # Binary entry
│   │
│   └── docs-site/            # Static site generator
│       ├── content/            # Markdown source
│       ├── theme/              # CSS, JS, favicon
│       ├── src/                # Build scripts
│       └── dist/               # Built HTML site
│
├── docs/                     # Markdown docs
├── examples/                 # 3 example configs
├── .github/                  # CI workflows + templates
├── README.md
├── CHANGELOG.md
├── LICENSE
├── STATUS.md
├── SECURITY.md
├── RELEASE_CHECKLIST.md
└── package.json              # Workspace root
```

## What lives where

- **Library code** → `packages/core/src/`
- **CLI code** → `packages/cli/src/`
- **Docs site** → `packages/docs-site/`
- **Markdown docs** → `docs/`
- **Examples** → `examples/`
- **CI** → `.github/workflows/`
- **Public assets** → repo root

## Naming conventions

- **Files**: `kebab-case.ts` for multi-word, `single.ts` for single-word
- **Classes**: `PascalCase`
- **Functions/variables**: `camelCase`
- **Types**: `PascalCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Test files**: `*.test.ts` next to source
- **Type files**: `types/*.ts` (just types, no logic)

## How to add a new module

1. **Agent**: `packages/core/src/agents/<name>.ts` + `packages/core/src/agents/<name>.test.ts`. Register in `agents/index.ts`.
2. **Provider**: `packages/core/src/providers/<name>.ts` + test. Register in `providers/index.ts`.
3. **Formatter**: `packages/core/src/output/<name>.ts` + test. Add to `output/index.ts:getFormatter()`.
4. **Utility**: `packages/core/src/utils/<name>.ts` + test. Add to `utils/index.ts`.
5. **CLI command**: `packages/cli/src/commands/<name>.ts`. Add to `program.ts`.

Each addition should come with:
- Code
- Tests (≥80% coverage on new code)
- Docs update (either in `docs/` or `packages/docs-site/content/`)
- Type check passing
- Lint passing
