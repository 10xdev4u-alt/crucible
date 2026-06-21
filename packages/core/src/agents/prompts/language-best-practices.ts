// @ts-nocheck — this file is documentation, not executable code
/**
 * TypeScript style rules for the style agent.
 * Loaded dynamically by StyleAgent when needed.
 */
export const TYPESCRIPT_BEST_PRACTICES = [
  'Use const for variables that are never reassigned, let otherwise',
  'Prefer interface over type for object shapes (better error messages)',
  'Use readonly for immutable properties',
  'Use as const for literal types',
  'Prefer unknown over any (forces type narrowing)',
  'Use satisfies for type-safe object literals',
  'Prefer readonly arrays: readonly T[] or ReadonlyArray<T>',
  'Use Pick, Omit, Partial for derived types',
  'Avoid any at all costs (use unknown and narrow)',
  'Use import type for type-only imports',
  'Use the ? operator for optional chaining, not &&',
  'Use ?? for nullish coalescing, not ||',
  'Prefer for...of over .forEach() when you need to break or return',
  'Use readonly on function parameters that take objects',
  'Document complex types with JSDoc',
].join('\n');

export const PYTHON_BEST_PRACTICES = [
  'Use snake_case for functions and variables',
  'Use PascalCase for classes',
  'Use UPPER_SNAKE_CASE for constants',
  'Use type hints for all public APIs',
  'Prefer dataclasses or Pydantic for data classes',
  'Use f-strings over .format() and % formatting',
  'Use with statements for resource management',
  'Document public APIs with docstrings',
].join('\n');

export const GO_BEST_PRACTICES = [
  'Use gofmt for formatting',
  'Errors should be the last return value',
  'Use context.Context as the first parameter',
  'Use defer for cleanup',
  'Avoid global state',
  'Use errors.Is and errors.As for error checking',
  'Document public APIs with comments',
  'Use table-driven tests',
  'Prefer composition over inheritance',
].join('\n');

export const RUST_BEST_PRACTICES = [
  'Use cargo fmt for formatting',
  'Use cargo clippy for linting',
  'Use Result<T, E> for recoverable errors',
  'Use ? operator for error propagation',
  'Implement From<E1> for E2 for error conversion',
  'Use &str instead of String when possible',
  'Use &[T] instead of Vec<T> when possible',
  'Use Iterator instead of indexing',
  'Use Cow for borrowed-or-owned',
  'Use Default trait for default values',
  'Document public APIs with /// comments',
].join('\n');

export const JAVA_BEST_PRACTICES = [
  'Use 4-space indentation',
  'Use Optional<T> for nullable returns',
  'Use records (Java 16+) for data classes',
  'Prefer composition over inheritance',
  'Use Stream API over loops where appropriate',
  'Use @Override for overridden methods',
  'Use final for parameters and locals when possible',
  'Use slf4j for logging',
  'Document public APIs with Javadoc',
  'Use Objects.equals and Objects.hash for null-safe operations',
].join('\n');
