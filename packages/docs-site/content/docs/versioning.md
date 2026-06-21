---
title: Versioning
description: How Crucible versions
order: 31
category: Documentation
---

# Versioning

Crucible follows [Semantic Versioning](https://semver.org/).

## Current version

**0.1.0** (in development)

## Pre-1.0

Until 1.0, anything in 0.x can have breaking changes. The minor version (0.x.0) signals "this is a feature release" but doesn't guarantee API stability.

When we hit 1.0, we'll commit to:
- Public API stability for the lifetime of the 1.x line
- Clear deprecation warnings before any removal
- Migration guides for any breaking changes

## Version bumps

We bump:
- **Major** (1.0.0 → 2.0.0) — breaking changes to the public API
- **Minor** (0.1.0 → 0.2.0) — new features, backward-compatible
- **Patch** (0.1.0 → 0.1.1) — bug fixes, backward-compatible

## Release cadence

We aim for:
- **Minor release** every 4-6 weeks (new features)
- **Patch release** as needed (bugfixes)
- **Major release** when we break the public API (rare)

## Pre-release versions

For major features, we may cut a pre-release:
- `0.2.0-rc.1` — release candidate
- `0.2.0-beta.1` — beta
- `0.2.0-alpha.1` — alpha

Pre-releases are installable but flagged as unstable. To install:

```bash
npm install -g crucible@0.2.0-rc.1
```

## Version pinning

For production use, pin to a specific minor version:

```json
{
  "dependencies": {
    "crucible": "0.1.x"
  }
}
```

Or use exact versions:

```json
{
  "dependencies": {
    "crucible": "0.1.0"
  }
}
```

Avoid `crucible@latest` in production — it can break with a major release.

## Version checks

Crucible itself doesn't enforce a version check on startup. The `--version` flag works regardless of the installed version.

## Changelog

Every version has an entry in [CHANGELOG.md](https://github.com/10xdev4u-alt/crucible/blob/main/CHANGELOG.md) with:
- New features
- Bug fixes
- Breaking changes
- Deprecations
- Migration notes (if applicable)

## See also

- [Stability](/docs/stability)
- [CHANGELOG](https://github.com/10xdev4u-alt/crucible/blob/main/CHANGELOG.md)
- [ROADMAP](https://github.com/10xdev4u-alt/crucible/blob/main/docs/ROADMAP.md)
