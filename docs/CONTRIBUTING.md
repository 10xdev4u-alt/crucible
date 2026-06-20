# Contributing

Thanks for your interest in contributing to Crucible.

## Development

```bash
pnpm install
pnpm test
pnpm lint
pnpm typecheck
pnpm build
```

## Pull requests

- One feature or fix per PR
- Add tests for new behavior
- Update docs if relevant
- Follow the commit message conventions

## Commit messages

We use [Conventional Commits](https://www.conventionalcommits.org/).
Each commit should be a single, focused change with a one-line subject.

Format: `type(scope): short description`

Types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `ci`, `perf`, `build`, `style`.

## Reporting issues

Please include:
- A clear description
- Steps to reproduce
- Expected vs actual behavior
- Your environment (OS, Node, pnpm version)
