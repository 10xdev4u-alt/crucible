# Crucible

> Multi-agent code review orchestrator. Code refined by fire.

Crucible is a complete, production-grade, open source multi-agent code review orchestrator.

## Features

- **16 built-in review agents** — security, secrets, performance, style, naming, architecture, accessibility, dependency, test-coverage, api-contract, documentation, i18n, observability, concurrency, error-handling, data-integrity
- **5 LLM providers** — Anthropic, OpenAI, Gemini, Bedrock, Ollama, plus any OpenAI-compatible endpoint
- **8 output formats** — text, JSON, SARIF, Markdown, HTML, JUnit, CSV, GitLab
- **Multi-perspective consensus** — findings are scored and ranked across agents
- **15+ CLI commands** — review, check, fix, trace, watch, doctor, hook, init, and more
- **Pluggable cache** — in-memory or file-backed
- **TypeScript strict** — no `any`, 100% typed, 400+ tests
- **Production-grade** — retries, circuit breaker, rate limiting, timeouts
- **Open source** — MIT license
- **Docs site** — 30+ pages, search, dark mode

## Install

```bash
npm install -g crucible
```

## Quick start

```bash
crucible init                        # generate .crucible.json
export ANTHROPIC_API_KEY=sk-...     # set an API key
crucible review                     # review your changes
```

## Documentation

- [Getting started](https://github.com/10xdev4u-alt/crucible/blob/main/docs/CONTRIBUTING.md)
- [CLI reference](https://github.com/10xdev4u-alt/crucible/blob/main/packages/docs-site/content/docs/cli.md)
- [Library API](https://github.com/10xdev4u-alt/crucible/blob/main/packages/docs-site/content/docs/api.md)
- [Architecture](https://github.com/10xdev4u-alt/crucible/blob/main/packages/docs-site/content/docs/architecture.md)
- [Migration guide](https://github.com/10xdev4u-alt/crucible/blob/main/packages/docs-site/content/docs/migration.md)
- [Cookbook](https://github.com/10xdev4u-alt/crucible/blob/main/packages/docs-site/content/docs/cookbook.md)

## Repository layout

```
crucible/
├── packages/
│   ├── core/         # @crucible/core — the library
│   ├── cli/          # The `crucible` command
│   └── docs-site/    # Static site generator
├── docs/              # Markdown documentation
├── examples/          # Example configurations
├── scripts/           # Build/release scripts
└── .github/           # CI workflows + templates
```

## Status

200 commits. 400+ tests passing. All CI jobs green.

## License

MIT — see [LICENSE](LICENSE).

## Maintainers

- [princetheprogrammerbtw](https://github.com/10xdev4u-alt)

See [MAINTAINERS](https://github.com/10xdev4u-alt/crucible/blob/main/docs/MAINTAINERS.md) for the full team.

## Contributing

See [CONTRIBUTING.md](https://github.com/10xdev4u-alt/crucible/blob/main/docs/CONTRIBUTING.md).

## Security

See [SECURITY.md](https://github.com/10xdev4u-alt/crucible/blob/main/SECURITY.md).

## Acknowledgments

Built with ⚒ by princetheprogrammerbtw.

Inspired by the multi-agent review pattern pioneered by tools like Codebuff, but built for production use from day one.
