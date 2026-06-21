---
title: Stability
description: How we keep Crucible stable
order: 30
category: Documentation
---

# Stability

Crucible is a production-grade tool. This page describes what "stable" means in our context and how we maintain it.

## Semver

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: breaking changes to the public API
- **MINOR**: new features, backward-compatible
- **PATCH**: bug fixes, backward-compatible

Until we hit 1.0, anything goes. After 1.0, we'll be more careful.

## What's stable

**Stable** (won't change in 0.x without a major bump):
- The `Provider` interface
- The `Agent` interface
- The `Formatter` interface
- The `ReviewResult` shape
- The CLI command surface (`crucible review`, etc.)
- The `.crucible.json` config schema
- All 16 built-in agents and their categories
- All 8 formatters

**Unstable** (may change in 0.x):
- Plugin discovery rules
- LSP server shape
- Benchmark output format
- Internal types (anything not exported from `index.ts`)

## What "production-grade" means for us

- **No data loss**: We don't silently drop findings or fail to write outputs
- **Predictable errors**: When something fails, you get a clear error message
- **Atomic operations**: Cache writes, file writes, etc. are atomic where possible
- **Bounded resources**: Caches have max sizes, parallelism has limits
- **No background daemons**: The CLI exits when done (except for `watch` and `doctor`)
- **No hidden network calls**: We never send telemetry by default

## Deprecation policy

When we deprecate something:
1. We mark it `@deprecated` in JSDoc
2. We log a warning when it's used
3. We keep it working for at least one minor version
4. We document the migration path
5. We remove in the next major

## Backward compatibility guarantees

- A `.crucible.json` written for v0.1 will work with v0.2, v0.3, etc. (we may add new fields, but won't remove or rename existing ones)
- The CLI command surface is stable: `crucible review` will always exist
- The output formats are stable: `crucible review --format sarif` will always produce SARIF

## What we DON'T guarantee

- Performance characteristics: We may refactor and slow down specific paths
- Internal types: Anything not in the public API
- Plugin discovery: Plugin format may evolve
- Internal implementations: Don't depend on them

## Backports

For security fixes only, we backport to the previous minor version. We don't backport features.

## How to stay updated

- Watch the repo for releases
- Subscribe to GitHub releases
- Read the CHANGELOG before upgrading
- Pin your version (`crucible@0.1.0` not `crucible@latest`)

## Deprecation timeline

| Version | Status | End of life |
|---|---|---|
| 0.1.x | Active | 0.3.0 |
| 0.2.x | TBD | TBD |
| 1.0.x | Future | TBD |

## See also

- [CHANGELOG](https://github.com/10xdev4u-alt/crucible/blob/main/CHANGELOG.md)
- [ROADMAP](https://github.com/10xdev4u-alt/crucible/blob/main/docs/ROADMAP.md)
- [Migration guide](/docs/migration)
