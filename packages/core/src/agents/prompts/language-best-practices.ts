# .NET
- Prefer records for DTOs
- Use `nameof` instead of magic strings
- Async methods should end with `Async` suffix
- Use `IReadOnlyList<T>` for read-only collections
- Use nullable reference types (`<Nullable>enable</Nullable>`)

# Python
- Use type hints for all public APIs
- Prefer dataclasses or Pydantic for data classes
- Use `pathlib` instead of `os.path`
- Use `ruff` for linting and `black` for formatting
- Prefer f-strings over `.format()`

# Go
- Errors should be the last return value
- Use `context.Context` for cancellation
- Defer close operations
- Use `gofmt` for formatting
- Prefer table-driven tests
- Use `any` sparingly

# Rust
- Prefer `Result<T, E>` over panic
- Use `?` operator for error propagation
- Implement `From` for error types
- Use `clippy` for linting
- Document public APIs with `///` comments
- Prefer `&str` over `String` when possible

# Java
- Use `Optional<T>` instead of null returns
- Prefer composition over inheritance
- Use records (Java 16+) for data classes
- Stream API over loops where appropriate
- Use `slf4j` for logging
