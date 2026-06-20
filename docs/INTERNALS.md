# Crucible — Internals

This document describes the internal implementation details of Crucible. For the public-facing architecture, see [docs/architecture.md](docs/architecture.md).

## Bootstrapping

The library exports everything from a single `index.ts`:

```ts
// packages/core/src/index.ts
export * from './agents/index.js';
export * from './cache/index.js';
export * from './lsp/index.js';
export * from './orchestrator/index.js';
export * from './output/index.js';
export * from './plugins/index.js';
export * from './policies/index.js';
export * from './providers/index.js';
export * from './registry/index.js';
export * from './types/index.js';
export * from './utils/index.js';
```

Each module has its own barrel `index.ts`. This pattern:
- Makes the public API explicit (you can see everything that ships)
- Enables tree-shaking (unused modules are dropped)
- Documents the structure (each module is a clear unit)

## Consensus scoring

The consensus algorithm is the heart of Crucible. Here's the math:

```ts
score(finding) = severityWeight(finding.severity) * finding.confidence
```

Where:
```ts
severityWeight = {
  info: 1,
  minor: 2,
  major: 5,
  critical: 10,
  blocker: 25,
}
```

For a group of similar findings (same `file:line:rule`):

```ts
consensusScore(group) = sum(score(f) for f in group) * (1 + 0.25 * (n - 1))
```

The bonus factor rewards agreement: 2 agents agreeing gives 1.25x, 3 agents gives 1.5x, 4 agents gives 1.75x.

The dedup step keeps the highest-priority finding per group (highest confidence, then highest severity on tie).

## Parallel executor

`runParallel` is a custom implementation, not based on `Promise.all`. Why?

- `Promise.all` has no built-in concurrency limit
- We need timeout support per item
- We need to preserve input order in output
- We need to handle errors per item, not fail-fast

The implementation:

```ts
const workers = Array.from({ length: parallelism }, async () => {
  while (true) {
    const idx = cursor++;
    if (idx >= items.length) return;
    const value = await withTimeout(items[idx](), timeoutMs);
    results[idx] = { ok: true, value, durationMs: Date.now() - start, index: idx };
  }
});
await Promise.all(workers);
```

Multiple workers compete for tasks from a shared cursor. When all tasks are done, `Promise.all` resolves.

## Provider abstraction

Every provider implements the same `Provider` interface:

```ts
interface Provider {
  info(): ProviderInfo;
  complete(request: ProviderRequest): Promise<ProviderResponse>;
}
```

The `Provider` doesn't know about agents, orchestrator, or anything else. It just takes messages and returns a response.

The orchestrator uses a `ProviderLLMCaller` adapter to call providers. This adapter handles:
- Wrapping the LLM response in an `AgentOutput`
- Timing the call
- Adding metadata (token usage, etc.)

## HTTP client abstraction

Providers don't use `fetch` directly. They take an `HttpClient` interface:

```ts
interface HttpClient {
  request<T>(options: { url: string; method: string; headers?: ...; body?: ...; signal?: ... }): Promise<{ status: number; body: T; headers: ... }>;
}
```

This makes providers:
- **Testable**: tests use `InMemoryHttpClient` for deterministic responses
- **Pluggable**: production uses `FetchHttpClient` (just `fetch` wrapper)
- **Extensible**: custom HttpClient can add caching, retry, observability

## Cache strategy

Two cache backends:
- `MemoryCache`: in-process, lost on restart. Fast.
- `FileCache`: persisted to disk. Slower but survives restarts.

The cache is keyed by a hash of the input (diff, agents, etc.). If the same review is requested twice, the cached result is returned.

Cache invalidation is TTL-based. There's no manual invalidation; if you need a fresh review, delete the cache or set a short TTL.

## Retry strategy

Retries are exponential backoff with jitter:

```ts
delay = min(baseMs * factor ** attempt, maxMs) ± jitter
```

Default: 100ms base, 2x factor, 30s max, 50% jitter.

The retry predicate is configurable. By default, transient errors (5xx, 429, timeouts) are retried; others are not.

## Plugin system

Plugins are TypeScript files that export agents. The plugin loader:

1. Walks a directory
2. Dynamically imports each `.ts`/`.js`/`.mjs`/`.cjs` file
3. Looks for an exported `agent` or `agents` field
4. Registers them with the agent registry

Plugin files are loaded once and cached. To update plugins, restart the process.

## Event bus

Every interesting event in the orchestrator is emitted on the event bus. The bus is in-process only; you can subscribe to events for observability.

Events are NOT currently emitted by the orchestrator itself. The event bus is exposed for users to wire up their own observability.

## Format pipeline

A formatter takes a `ReviewResult` and returns a string:

```ts
interface Formatter {
  format(result: ReviewResult): string;
}
```

Formatters are pure functions. They don't read from disk, make network calls, or have side effects. This makes them easy to test and compose.

The `getFormatter` factory returns the right formatter for a given format name:

```ts
function getFormatter(format: Format, options?): Formatter {
  switch (format) {
    case 'text': return new TextFormatter(options);
    case 'json': return new JsonFormatter();
    // ...
  }
}
```

## CLI architecture

The CLI uses a simple argv parser (no external dep) and a command-per-file structure:

```
cli/src/
├── argv.ts          # Argv parsing
├── program.ts       # Top-level dispatcher
├── commands/        # One file per command
├── git/diff.ts      # Git diff parser
└── github.ts        # PR comment poster
```

Each command is a function:

```ts
type CommandFn = (positionals: string[], flags: Record<string, ...>) => number | Promise<number>;
```

The exit code is the function's return value. This makes commands easy to test and compose.

## Build pipeline

```
core (tsc) → dist/
cli (tsc) → dist/  (depends on core/dist)
docs-site (tsx) → dist/  (consumes core types)
```

The core package must be built first because the CLI imports its types. The root `package.json` enforces this with:

```json
"build": "pnpm --filter @crucible/core run build && pnpm --filter @crucible/cli run build"
```

The docs site reads source files at build time and generates static HTML.

## Testing

We use Vitest. Tests live next to source as `*.test.ts`.

Coverage is tracked via `pnpm test --coverage`. We aim for high coverage on new code, but don't enforce a specific number.

The orchestrator has an end-to-end test (`end-to-end.test.ts`) that exercises the full pipeline with mock agents.

## See also

- [Architecture](/docs/architecture)
- [Library API](/docs/api)
- [Style guide](/docs/STYLE_GUIDE.md)
