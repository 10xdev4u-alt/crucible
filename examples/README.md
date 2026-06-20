# Crucible — example configurations

This directory contains ready-to-use `.crucible.json` profiles for
common workflows.

## Files

### `default.crucible.json`
The default profile written by `crucible init`. Balanced coverage
across all 9 built-in agents.

### `strict.crucible.json`
For production codebases or sensitive domains (payments, auth, health).
Emphasizes security, architecture, dependency, and API contract.
Higher weight, larger model, longer cache TTL.

### `lax.crucible.json`
For prototyping, demos, and small projects. Few agents, small model,
in-memory cache. Fast feedback loop.

### `ci.crucible.json`
For CI pipelines. SARIF output for code-scanning integration,
file-backed cache, medium parallelism.

## Usage

Copy one of these files to your project root and rename it to
`.crucible.json`:

```bash
cp examples/strict.crucible.json .crucible.json
```

You can also generate a default with:

```bash
crucible init
```
