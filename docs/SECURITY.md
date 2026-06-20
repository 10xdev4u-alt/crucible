# Crucible — Security

Crucible takes security seriously. This document describes the security model, what we do, and how to report issues.

## Threat model

Crucible is a **local CLI** that:
1. Reads your git diff (local file system)
2. Sends it to an LLM provider (network)
3. Receives structured findings back
4. Prints to stdout or writes to a file you specify

The trust boundaries are:
- Your local machine
- The LLM provider's API

Crucible does not run a server, does not accept network connections, and does not store any of your code beyond the optional file cache.

## What we do

- **No telemetry** — Crucible does not send any data anywhere by default. See [telemetry](/docs/telemetry).
- **No code execution** — Crucible does not execute user code. The optional `Sandbox` utility is for agents that need it; it is opt-in.
- **API keys via env vars** — Crucible never writes API keys to disk.
- **File cache contains only findings** — Not source code, not diffs, not secrets.
- **Dependencies are pinned** — pnpm lockfile is committed.
- **TypeScript strict** — No `any`, no implicit any, no unsafe type assertions.
- **Input validation** — All config is validated by Zod.
- **Output sanitization** — HTML formatter escapes all user content.

## What you should do

- **Set API keys in env vars, not config files** — The config supports `apiKeyEnv` for this reason.
- **Don't commit `.crucible-cache/`** — Add it to `.gitignore` (the default `.gitignore` template includes it).
- **Review findings before auto-applying** — `crucible fix` only applies fixes with `confidence >= 0.8`, but always review.
- **Use SARIF for code scanning** — SARIF is the standard for security tooling.
- **Keep Crucible updated** — Subscribe to releases for security patches.

## Reporting a vulnerability

**Do not** open public GitHub issues for security vulnerabilities.

Report privately to:
- **GitHub Security Advisories**: <https://github.com/10xdev4u-alt/crucible/security/advisories/new>
- **Email**: <security@10xdev4u-alt.dev> (placeholder)

We will respond within 72 hours and provide a timeline for a fix.

See [SECURITY.md](../SECURITY.md) for the full disclosure policy.

## Supported versions

| Version | Supported |
|---|---|
| 0.1.x | ✅ Active development |
| < 0.1 | ❌ Not supported |

## Security updates

Security updates are released as patch versions and announced in:
- GitHub releases
- The CHANGELOG
- A security advisory on GitHub

We follow responsible disclosure: fixes are released on the same day as the public advisory, or after a coordinated disclosure period if the issue is severe.

## Dependencies

We use `pnpm audit` in CI to catch known vulnerabilities. Dependabot opens PRs for security updates automatically.

## Cryptography

Crucible uses Node.js's built-in `crypto` module for hashing. No third-party crypto. SHA-256 is used for cache keys and content hashing.

## Supply chain

- pnpm lockfile is committed
- All dependencies are pinned
- CI verifies the lockfile is up to date
- Releases are signed (npm provenance)
