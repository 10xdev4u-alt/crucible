# Crucible — Code Style Guide

Internal style guide for Crucible contributors.

## TypeScript

### Strict mode

We use the strictest TypeScript settings:

- `strict: true`
- `noUncheckedIndexedAccess: true`
- `noImplicitOverride: true`
- `noFallthroughCasesInSwitch: true`
- `verbatimModuleSyntax: false` (we use .js extensions on imports)

### Type annotations

- **Don't use `any`**. Use `unknown` if you need an unknown type, then narrow.
- **Prefer type inference** for local variables.
- **Explicit types** for function parameters and return types.
- **Type-only imports** with `import type` when you only need the type.

### Naming

- **Classes**: `PascalCase` (`Orchestrator`, `SecurityAgent`)
- **Interfaces**: `PascalCase`, no `I` prefix (`Finding`, not `IFinding`)
- **Types**: `PascalCase` (`SeverityLevel`, `ReviewRequest`)
- **Functions/variables**: `camelCase` (`dedupeFindings`, `consensusScore`)
- **Constants**: `UPPER_SNAKE_CASE` (`DEFAULT_OPTIONS`, `SEVERITY_WEIGHT`)
- **Files**: `kebab-case.ts` (`retry-policy.ts`)
- **Test files**: `<name>.test.ts`

### Imports

- Use `.js` extensions for relative imports (NodeNext requirement):

```ts
// ✅ good
import { type Finding } from '../types/finding.js';

// ❌ bad
import { type Finding } from '../types/finding';
```

- Group imports: stdlib → external → internal

```ts
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { z } from 'zod';

import { type Finding } from '../types/finding.js';
```

- Use `import type` for type-only imports:

```ts
import { type Finding, type ReviewResult } from '../types/index.js';
```

### Error handling

- Use typed error classes:

```ts
export class ProviderError extends Error {
  constructor(public provider: string, message: string) {
    super(message);
    this.name = 'ProviderError';
  }
}
```

- Catch errors at boundaries, not in the middle of a function
- Never silently swallow errors — at least log them

### Async

- Always use `async`/`await`, not `.then()`
- Use `Promise.all` for parallel operations
- Use `Promise.allSettled` when you want to wait for all but not fail on any
- Always handle promise rejections (try/catch or .catch)

### Null/undefined

- Prefer `undefined` for missing values
- Use `null` only when there's a semantic difference (e.g. "no value" vs "missing")
- Always check for `undefined` with `noUncheckedIndexedAccess`
- Use the `??` operator for defaults, `||` for fallbacks

## Code style

### Formatting

- Biome handles all formatting. Run `pnpm lint:fix` before committing.
- 100-char line width
- 2-space indentation
- Single quotes for strings
- Trailing commas in multi-line
- Semicolons required

### Naming patterns

- Boolean variables: `is*`, `has*`, `should*` (`isValid`, `hasPermission`, `shouldRetry`)
- Functions that return booleans: same pattern
- Async functions: prefix with the verb (`fetch`, `load`, `save`) or the action (`get`, `set`)
- Type guards: `is*` (`isSeverityLevel`)

### Comments

- Explain *why*, not *what* (the code shows what)
- Use JSDoc for public APIs
- Use `//` for inline comments
- Use `/* */` for block comments at the top of files

### Functions

- Keep functions small (one screen, ~50 lines)
- One function, one responsibility
- Prefer pure functions where possible
- Avoid side effects in constructors

### Tests

- Test one thing per test
- Use descriptive test names
- Use arrange/act/assert
- Don't test implementation details

## File structure

```
src/
├── types/         # Pure type definitions
├── utils/         # Stateless utility functions
├── cache/         # Stateful cache implementations
├── registry/      # Registries for agents, providers
├── orchestrator/  # The main review pipeline
├── agents/        # Built-in review agents
├── providers/     # LLM provider implementations
├── output/        # Output formatters
├── policies/      # Retry, circuit breaker
├── plugins/       # Plugin system
├── lsp/           # LSP server scaffold
└── bench/         # Performance benchmarks
```

## Dependencies

- Prefer stdlib (`node:*`) where possible
- Use `zod` for runtime validation
- Use `vitest` for tests
- Use `biome` for lint and format
- New dependencies need a justification in the PR

## See also

- [Contributing guide](/docs/contributing)
- [Architecture](/docs/architecture)
- [API reference](/docs/api)
