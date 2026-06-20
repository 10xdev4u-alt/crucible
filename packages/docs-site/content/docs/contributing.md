---
title: Contributing
description: How to contribute to Crucible
order: 12
category: Documentation
---

# Contributing

Thanks for your interest in contributing to Crucible.

## Development setup

```bash
git clone https://github.com/10xdev4u-alt/crucible.git
cd crucible
pnpm install
pnpm test
pnpm lint
pnpm typecheck
pnpm build
```

Requires **Node 22+** and **pnpm 9+**.

## Project structure

```
crucible/
  packages/
    core/         # The orchestrator, agents, providers, formatters
    cli/          # The `crucible` command-line interface
    docs-site/    # The docs site (markdown → static HTML)
  docs/            # Additional documentation
  examples/        # Example .crucible.json profiles
  .github/         # CI workflows
```

## Pull requests

- One feature or fix per PR.
- Add tests for new behavior.
- Update docs if relevant.
- Follow the commit message conventions.

## Commit messages

We use [Conventional Commits](https://www.conventionalcommits.org/). Each commit should be a single, focused change with a one-line subject.

Format: `type(scope): short description`

Types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `ci`, `perf`, `build`, `style`.

Examples:

```text
feat: add security agent
fix: handle undefined work item in parallel executor
docs: add troubleshooting guide
test: add github commenter tests
```

## Code style

- TypeScript strict, no `any`.
- Biome for lint and format.
- Run `pnpm lint:fix` before committing.
- Use `.js` extensions in imports (NodeNext requirement).
- Keep modules small and focused.

## Testing

- Vitest. Tests live next to source as `*.test.ts`.
- Aim for 100% coverage on new code.
- Run `pnpm test` to verify before pushing.

## Adding a new agent

1. Create `packages/core/src/agents/my-agent.ts`:

```ts
import { BaseAgent, type LLMCaller, type PromptTemplate } from "./base.js";
import { parseStructuredFindings } from "./parser.js";

const SYSTEM_PROMPT = "...";
const PROMPT: PromptTemplate = { system: SYSTEM_PROMPT, user: (i) => "..." };

export class MyAgent extends BaseAgent {
  protected readonly agentInfo = { id: "my-agent", ... };
  protected readonly prompt = PROMPT;
  protected override parseResponse(content: string) {
    return parseStructuredFindings(content, this.agentInfo.id);
  }
}
```

2. Add it to `packages/core/src/agents/index.ts`.
3. Add tests in `my-agent.test.ts`.
4. Add a CLI entry in `packages/cli/src/commands/agents.ts`.
5. Update `docs/agents.md` and `docs-site/content/docs/agents.md`.

## Adding a new provider

1. Create `packages/core/src/providers/my-provider.ts`.
2. Implement the `Provider` interface.
3. Add to `packages/core/src/providers/index.ts`.
4. Add tests.
5. Document in `docs-site/content/docs/providers.md`.

## Adding a new output format

1. Create `packages/core/src/output/my-format.ts`.
2. Implement the `Formatter` interface.
3. Add to `packages/core/src/output/index.ts` (in `getFormatter`).
4. Add tests.
5. Document in `docs-site/content/docs/output-formats.md`.

## Adding a new CLI command

1. Create `packages/cli/src/commands/my-command.ts`.
2. Export a `cmdXxx(positionals, flags): number` (or `Promise<number>`).
3. Register it in `packages/cli/src/program.ts`.
4. Add to the `HELP` text.
5. Add tests.
6. Document in `docs-site/content/docs/cli.md`.

## Updating the docs site

1. Edit the relevant `.md` file in `packages/docs-site/content/`.
2. Run `pnpm --filter @crucible/docs-site build`.
3. Preview locally (the site is fully static — open `dist/index.html`).
4. Commit.

## Release process

Releases are automated via the `.github/workflows/release.yml` workflow. To cut a release:

1. Update the version in `packages/core/package.json` and `packages/cli/package.json`.
2. Update `CHANGELOG.md` and `RELEASE_NOTES.md`.
3. Tag: `git tag v0.1.0 && git push --tags`.
4. The release workflow will publish to npm and create a GitHub release.

## Reporting issues

Use GitHub issues. Please include:
- A clear description
- Steps to reproduce
- Expected vs actual behavior
- Your environment (OS, Node, pnpm version)

For security issues, see [SECURITY.md](https://github.com/10xdev4u-alt/crucible/blob/main/SECURITY.md).

## Code of conduct

See [docs/CODE_OF_CONDUCT.md](https://github.com/10xdev4u-alt/crucible/blob/main/docs/CODE_OF_CONDUCT.md).
