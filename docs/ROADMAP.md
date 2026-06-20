# Roadmap

This document tracks planned work. Dates are aspirational; priorities shift.

## v0.2 — Stability & polish

- [ ] Improve error messages everywhere
- [ ] Add a `--debug` flag that prints LLM requests/responses
- [ ] Better progress reporting during long reviews
- [ ] Plugin discovery (load custom agents from `.crucible/agents/`)
- [ ] LSP server scaffold (basic `textDocument/publishDiagnostics`)

## v0.3 — More providers

- [ ] Gemini direct provider (using new `@google/genai` SDK)
- [ ] AWS Bedrock provider
- [ ] Google Vertex provider
- [ ] Azure OpenAI provider
- [ ] Per-agent model selection

## v0.4 — More output formats

- [ ] GitLab Code Quality report
- [ ] Bitbucket Code Insights
- [ ] ReviewBoard-style diff comments
- [ ] Streaming JSON output for large reviews
- [ ] Plain-text "summary only" mode

## v0.5 — Smarter consensus

- [ ] Configurable agreement threshold
- [ ] Agent weighting by historical accuracy
- [ ] Cross-agent reasoning (ask one agent to verify another's finding)
- [ ] Suppression of known false positives (per-rule allow-lists)
- [ ] Per-file severity thresholds

## v0.6 — Domain-specific agents

- [ ] Database migration reviewer (extends #7 from the brainstorm)
- [ ] Frontend performance reviewer (bundle size, render cost)
- [ ] Auth-flow reviewer (authn, authz, session management)
- [ ] Payments reviewer (PCI compliance, idempotency)
- [ ] ML/AI code reviewer (prompt injection, data leakage)

## v0.7 — Editor integration

- [ ] VS Code extension
- [ ] JetBrains plugin
- [ ] Neovim plugin
- [ ] `textDocument/inlineValue` for inline annotations
- [ ] `workspace/executeCommand` for "review this file"

## v0.8 — Telemetry & insights

- [ ] Local-first telemetry (off by default)
- [ ] Web dashboard (optional self-hosted)
- [ ] Trend analysis: "you introduced 12 issues this week, mostly X"
- [ ] Team-level rollup reports

## v1.0 — Stable API

- [ ] Freeze the public API
- [ ] Comprehensive documentation site (Astro + Starlight?)
- [ ] Migration guide from Copilot Code Review / Bugbot
- [ ] Benchmark against human reviewers (anecdotal)

## Beyond v1.0

- Hosted version (optional)
- Self-hosted with admin UI
- Custom agent marketplace
- IDE-agnostic review protocol (think LSP for review)
- Schema-aware migration reviews (the original #7 idea)

Have an idea? Open an issue or a discussion.
