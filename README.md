# Crucible

> Multi-agent code review orchestrator. Code refined by fire.

Crucible runs several specialized LLM-powered reviewers in parallel
on your changes and aggregates their findings through a consensus
scorer. It feels like a panel of senior reviewers — not a single
rubber-stamp.

## Install

```bash
pnpm add -g crucible
```

## Usage

```bash
# Initialize a config file
crucible init

# Review your staged changes
crucible review

# Output as SARIF for code scanning
crucible review --format sarif --output crucible.sarif
```

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)
- [FAQ](docs/FAQ.md)
- [Logo / branding](docs/LOGO.md)
- [Changelog](CHANGELOG.md)
- [Contributing](docs/CONTRIBUTING.md)

## License

MIT
