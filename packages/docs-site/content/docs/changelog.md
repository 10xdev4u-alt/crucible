---
title: Changelog
description: Release history and changes
order: 19
category: Documentation
---

# Changelog

All notable changes to Crucible are documented in this file. The format is based on [Keep a Changelog](https://keepachangelog.com/).

See [CHANGELOG.md](https://github.com/10xdev4u-alt/crucible/blob/main/CHANGELOG.md) for the full file.

## v0.1.0 (unreleased)

Initial public release.

### Added

- **15 built-in review agents** — security, performance, style, architecture, accessibility, dependency, test-coverage, api-contract, documentation, i18n, observability, concurrency, error-handling, naming, data-integrity
- **5 providers** — Anthropic, OpenAI, Ollama, OpenAI-compatible, Gemini
- **6 output formatters** — text, json, sarif, markdown, html, junit
- **Multi-agent consensus** with agreement bonuses and weighted scoring
- **Pluggable cache** — in-memory and file-backed, with TTL
- **GitHub PR comment poster** with markdown summary
- **Pre-commit hook installer**
- **Git diff parser** with support for non-standard prefixes
- **Bounded parallel executor** with retries, timeouts, and circuit breaker
- **Plugin loader** for custom agents from a directory
- **LSP server scaffold** for editor integration
- **Telemetry** via opt-in event bus
- **Auto-generated API reference** from source code
- **Full docs site** with 20+ pages, search, dark mode, code highlighting
- **Strict TypeScript** with `noUncheckedIndexedAccess`
- **286+ tests** passing
- **4 CI workflows** (lint, typecheck, test, build, docs, release, CodeQL)

### Infrastructure

- pnpm monorepo with `packages/core`, `packages/cli`, `packages/docs-site`
- Biome 2.5 for lint and format
- Vitest 2.1 for tests
- GitHub Actions for CI/CD
- Conventional commits
- GitHub Pages deployment for the docs site
