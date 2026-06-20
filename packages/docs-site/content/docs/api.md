---
title: Library API
description: Use Crucible programmatically
order: 8
category: Documentation
---

# Library API

In addition to the CLI, `@crucible/core` is a regular TypeScript library you can import.

## Installation

```bash
pnpm add @crucible/core
```

## Quick example

```ts
import {
  Orchestrator,
  AgentRegistry,
  AnthropicProvider,
  InMemoryHttpClient,
  SecurityAgent,
  PerformanceAgent,
  StyleAgent,
  ProviderLLMCaller,
  TextFormatter,
  AnthropicProviderOptions,
} from "@crucible/core";

const provider = new AnthropicProvider({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  httpClient: new InMemoryHttpClient(),
});

const caller = new ProviderLLMCaller(provider);

const agents = new AgentRegistry();
agents.register(new SecurityAgent(caller));
agents.register(new PerformanceAgent(caller));
agents.register(new StyleAgent(caller));

const orchestrator = new Orchestrator(agents, {
  parallelism: 3,
  timeoutMs: 60_000,
  retries: 2,
});

const result = await orchestrator.review(request, context);

console.log(new TextFormatter().format(result));
```

## Core types

### `ReviewRequest`

The input to a review. Describes what to review and any constraints.

```ts
interface ReviewRequest {
  id: string;
  target: ReviewTarget;
  constraints?: ReviewConstraints;
  metadata?: Record<string, string>;
  requestedAt: string;
  requestedBy?: string;
}

type ReviewTarget =
  | { kind: 'diff'; change: ChangeSet }
  | { kind: 'files'; paths: string[] }
  | { kind: 'directory'; path: string; recursive: boolean }
  | { kind: 'commit'; sha: string }
  | { kind: 'pull-request'; provider: string; id: string };

interface ReviewConstraints {
  maxFindings?: number;
  maxFindingsPerFile?: number;
  categories?: string[];
  severities?: string[];
  agentIds?: string[];
  excludePaths?: string[];
  includePaths?: string[];
  timeoutMs?: number;
  parallelism?: number;
}
```

### `ReviewContext`

The full context passed to an agent. Includes the project info, repo info, and the change set.

```ts
interface ReviewContext {
  request: ReviewRequest;
  project: ProjectInfo;
  repository?: RepositoryInfo;
  changeSet?: ChangeSet;
  priorFindings?: Finding[];
  hints?: string[];
  env: Record<string, string>;
}
```

### `Finding`

A single review finding produced by an agent.

```ts
interface Finding {
  id: string;
  agentId: string;
  category: FindingCategory;
  severity: SeverityLevel;
  title: string;
  message: string;
  location?: FileLocation;
  ruleId?: string;
  references?: string[];
  snippet?: CodeSnippet;
  fix?: SuggestedFix;
  confidence: number;
  createdAt: string;
}
```

### `ReviewResult`

The output of a review. Includes all findings, the consensus score, per-agent stats, and any errors.

```ts
interface ReviewResult {
  id: string;
  requestId: string;
  findings: Finding[];
  consensusScore: number;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  agentStats: AgentStats[];
  errors: string[];
}
```

## Core classes

### `Orchestrator`

The main entry point. Runs multiple agents in parallel, deduplicates findings, and produces a `ReviewResult`.

```ts
class Orchestrator {
  constructor(agents: AgentRegistry, options?: Partial<OrchestratorOptions>);
  review(request: ReviewRequest, context: ReviewContext): Promise<ReviewResult>;
}
```

### `AgentRegistry`

A registry of agents. The orchestrator uses this to look up which agents to run.

```ts
class AgentRegistry {
  register(agent: Agent): void;
  registerAll(agents: readonly Agent[]): void;
  unregister(id: string): boolean;
  get(id: string): Agent | undefined;
  has(id: string): boolean;
  ids(): string[];
  resolve(ids: readonly string[]): Agent[];
  size(): number;
  clear(): void;
}
```

### `ProviderRegistry`

A registry of LLM providers. Use this to look up providers by id or by model.

```ts
class ProviderRegistry {
  register(provider: Provider): void;
  get(id: string): Provider | undefined;
  resolveForModel(modelId: string): Provider | undefined;
  findModel(modelId: string): ModelDescriptor | undefined;
  listModels(): ModelDescriptor[];
  capabilitiesFor(modelId: string): ProviderCapabilities | undefined;
  ids(): string[];
  size(): number;
}
```

### `ProviderRouter`

Routes requests to the right provider based on the requested model.

```ts
class ProviderRouter implements Provider {
  constructor(registry: ProviderRegistry, options?: ProviderRouterOptions);
  complete(request: ProviderRequest): Promise<ProviderResponse>;
}
```

## Formatters

The same `Formatter` interface is used for all output formats:

```ts
interface Formatter {
  format(result: ReviewResult): string;
}

class TextFormatter implements Formatter { /* ... */ }
class JsonFormatter implements Formatter { /* ... */ }
class SarifFormatter implements Formatter { /* ... */ }
class MarkdownFormatter implements Formatter { /* ... */ }
class HtmlFormatter implements Formatter { /* ... */ }
class JUnitFormatter implements Formatter { /* ... */ }

function getFormatter(format: Format, options?: { color?: boolean; verbose?: boolean }): Formatter;
function formatResult(format: Format, result: ReviewResult): string;
```

## Caches

Two cache backends are built in:

```ts
class MemoryCache<T> {
  constructor(options?: { ttlMs?: number; maxSize?: number });
  get(key: string): T | undefined;
  set(key: string, value: T, ttlMs?: number): void;
  delete(key: string): boolean;
  has(key: string): boolean;
  size(): number;
  stats(): { hits: number; misses: number; size: number; hitRate: number };
}

class FileCache<T> {
  constructor(options: { dir: string; ttlMs?: number; maxMemory?: number });
  // Same interface as MemoryCache
}
```

## Utilities

A grab bag of useful utilities:

```ts
// Hashing
function hashString(input: string, length?: number): string;
function hashObject(obj: unknown, length?: number): string;
function hashFile(path: string, content: string | Buffer, length?: number): string;

// Rate limiting
class RateLimiter {
  constructor(capacity: number, perSecond: number);
  acquire(): Promise<void>;
  tryAcquire(): boolean;
  available(): number;
}

// Concurrency
class Semaphore { /* ... */ }
class Mutex { /* ... */ }
class EventBus<T extends Record<string, unknown>> { /* ... */ }

// Resiliency
class CircuitBreaker { /* ... */ }
function retry<T>(fn: () => Promise<T>, options: RetryOptions): Promise<T>;
function withRetries<T>(fn: () => Promise<T>, policy?: RetryPolicy): Promise<T>;

// Observability
class Stopwatch { /* ... */ }
function timed<T>(fn: () => Promise<T>): Promise<[T, number]>;
class Histogram { /* ... */ }
class LogBuffer { /* ... */ }
class TokenTally { /* ... */ }

// Misc
function estimateTokens(text: string): number;
function estimateCost(inTok: number, outTok: number, inRate: number, outRate: number): number;
function formatBytes(n: number, decimals?: number): string;
function formatDuration(ms: number): string;
function formatNumber(n: number): string;
function pluralize(count: number, singular: string, plural?: string): string;
function truncate(s: string, max: number, suffix?: string): string;
```

## Example: a custom review pipeline

```ts
import { Orchestrator, AgentRegistry, SecurityAgent, AnthropicProvider, InMemoryHttpClient, ProviderLLMCaller, formatResult } from "@crucible/core";

async function reviewPR(diff: string) {
  const provider = new AnthropicProvider({
    apiKey: process.env.ANTHROPIC_API_KEY!,
    httpClient: new InMemoryHttpClient(),
  });
  const caller = new ProviderLLMCaller(provider);

  const agents = new AgentRegistry();
  agents.register(new SecurityAgent(caller));

  const orch = new Orchestrator(agents);
  const result = await orch.review(
    { id: 'pr', target: { kind: 'diff', change: parseDiff(diff) }, requestedAt: new Date().toISOString() },
    { request: null as never, project: { root: '.' }, env: {} },
  );

  return formatResult('markdown', result);
}
```
