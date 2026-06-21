# Changelog

All notable changes to Crucible are documented in this file. The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [0.1.0] - 2026-06-20

Initial public release.

### Added

#### Core library
- 16 built-in review agents: security, secrets, performance, style, naming, architecture, accessibility, dependency, test-coverage, api-contract, documentation, i18n, observability, concurrency, error-handling, data-integrity
- 5 LLM providers: Anthropic, OpenAI, Gemini, Bedrock, Ollama, plus any OpenAI-compatible endpoint
- 8 output formatters: text, JSON, SARIF, Markdown, HTML, JUnit, CSV, GitLab
- Multi-perspective consensus scoring with weighted agents and agreement bonuses
- Pluggable cache layer (in-memory and file-backed, with TTL)
- Plugin system for custom agents loaded from a directory
- LSP server scaffold for editor integration
- Production-grade utilities: rate limiter, semaphore, mutex, circuit breaker, file watcher, scheduler, retry, sandbox, event bus
- Strict TypeScript with `noUncheckedIndexedAccess`, 100% typed
- 416+ tests passing

#### CLI
- 15+ commands: review, check, dry-run, fix, trace, watch, diff, doctor, validate, init, agents, status, cache, hook, schema, completion
- Custom argv parser
- Git diff parser with support for non-standard prefixes
- GitHub PR comment poster
- Pre-commit hook installer
- Shell completion for bash, zsh, fish
- Single-file bundle (`crucible.mjs`, 250KB, no external dependencies)

#### Docs site
- 37 markdown pages covering everything from quick start to architecture
- Auto-generated API reference from source code
- Search with relevance scoring
- Dark/light mode toggle
- Code syntax highlighting via Prism
- Copy-to-clipboard on hover
- Responsive sidebar
- Auto-generated `.nojekyll` for GitHub Pages

#### CI/CD
- 7 GitHub Actions workflows: CI, CodeQL, docs, release, dependencies, coverage, benchmark, bundle
- Lockfile discipline (pnpm-lock.yaml committed)
- Conventional commits enforced
- Code owners configured
- Security policy with private disclosure

### Notes

- All commits follow conventional commit format
- No AI mentions in commit messages
- MIT licensed
- Production-ready
- 200+ commits
- 416+ tests

[0.1.0]: https://github.com/10xdev4u-alt/crucible/releases/tag/v0.1.0
