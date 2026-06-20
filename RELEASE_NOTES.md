# Release notes

This file tracks noteworthy changes per release. The [CHANGELOG.md](../CHANGELOG.md) has the full list.

## v0.1.0 (unreleased)

Initial public release.

### Highlights

- **13 built-in review agents** — security, performance, style, architecture, accessibility, dependency, test-coverage, api-contract, documentation, i18n, observability, concurrency, error-handling.
- **4 providers** — Anthropic, OpenAI, Ollama, OpenAI-compatible.
- **6 output formatters** — text, json, sarif, markdown, html, junit.
- **Multi-agent consensus** — findings from N agents are deduped, scored, and ranked.
- **Pluggable cache** — in-memory or file-backed, with TTL.
- **GitHub PR comments** — auto-post a summary to the PR.
- **Pre-commit hook** — install with one command.
- **CI integration** — SARIF output for code scanning, JUnit for test reporting.

### Stats

- 126+ commits
- 270+ tests passing
- TypeScript strict
- 100% typed (no `any`)
- Zero external runtime deps in core beyond zod

### What's next

- LSP server for editor integration
- More providers (Gemini direct, Bedrock, Vertex)
- Plugin discovery (load custom agents from a directory)
- Multi-repo review (compare against multiple base branches)
- Schema migration review (the "AI migration co-pilot" idea from research)
