# Changelog

All notable changes to Crucible are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- Initial release: multi-agent code review orchestrator
- 9 built-in review agents: security, performance, style,
  architecture, accessibility, dependency, test-coverage,
  api-contract, documentation
- 4 providers: Anthropic, OpenAI, Ollama, OpenAI-compatible
- 6 output formatters: text, json, sarif, markdown, html, junit
- CLI with `review`, `check`, `init`, `agents`, `status`, `cache`,
  `hook`, `version` commands
- Bounded parallel orchestrator with retries and timeouts
- Deduplication and consensus scoring across agent findings
- In-memory and file-backed caches
- GitHub PR comment poster
- Pre-commit hook installer
- Git diff parser for staged and working tree
- Example configurations (strict, lax, ci)

### Infrastructure
- pnpm monorepo (packages/core, packages/cli)
- TypeScript strict with `noUncheckedIndexedAccess`
- Biome 2.5 for lint and format
- Vitest 2.1 for tests (160+ tests)
- GitHub Actions CI (lint, typecheck, test, build)
- Conventional commits
