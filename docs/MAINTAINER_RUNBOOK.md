# Crucible — Maintainer runbook

Operational guide for the Crucible maintainers.

## Release process

1. **Choose a version** — follow [SemVer](https://semver.org/). Most releases are minor (backward-compatible features).
2. **Update the version** in `packages/core/package.json` and `packages/cli/package.json`.
3. **Update `CHANGELOG.md`** and `RELEASE_NOTES.md` with the changes.
4. **Open a PR** with the version bump. CI must pass.
5. **Tag the commit** with `v0.x.y` after merge.
6. **The release workflow** automatically:
   - Runs all CI jobs
   - Publishes `@crucible/core` to npm
   - Publishes `@crucible/cli` to npm
   - Creates a GitHub release with notes

## Hotfix process

For urgent bugfixes:

1. Branch from `main` (not a release branch).
2. Open a PR labeled `hotfix`.
3. After merge, the release workflow runs on the new tag.
4. Backport to release branches if needed.

## Triage

Issues come in to <https://github.com/10xdev4u-alt/crucible/issues>. Triage weekly:

1. **Bug reports** — confirm reproduction, label `bug`, assign to a maintainer.
2. **Feature requests** — label `enhancement`, discuss in the issue, add to roadmap if accepted.
3. **Security** — see [SECURITY.md](SECURITY.md) for the private disclosure process.
4. **Docs** — usually quick fixes; merge at will.

## Releases cadence

We aim for:
- **Minor release** every 4-6 weeks (new features)
- **Patch release** as needed (bugfixes)
- **Major release** when we break the public API (rare)

## Branching

- `main` — always green, always deployable
- `feat/*` — feature branches
- `fix/*` — bug fix branches
- `docs/*` — documentation-only changes
- `release/*` — release preparation branches

## Dependency updates

Dependabot opens PRs automatically. Review and merge weekly. For major bumps, open an issue first to discuss impact.

## CI

CI runs on every push to `main` and every PR. Workflows:

- `ci.yml` — lint, typecheck, test, build
- `docs.yml` — build docs, deploy to GitHub Pages
- `codeql.yml` — static analysis
- `release.yml` — on tag push, publish to npm
- `dependencies.yml` — weekly Dependabot run

## Troubleshooting CI

- **Lint fails** — run `pnpm lint:fix` locally and commit
- **Typecheck fails** — usually a type narrowing issue, fix the type
- **Tests fail** — check the test output, fix the test or the code
- **Build fails** — usually a dependency issue, run `pnpm install` and commit the lockfile

## Communication

- GitHub issues for bug reports and feature requests
- GitHub Discussions for questions and ideas
- Pull request reviews for code review

## Code of conduct

See [docs/CODE_OF_CONDUCT.md](docs/CODE_OF_CONDUCT.md). Be kind, be patient, be specific.
