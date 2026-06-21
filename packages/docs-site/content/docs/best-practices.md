---
title: Best practices
description: Code review best practices that Crucible encourages
order: 34
category: Documentation
---

# Best practices

Code review best practices that Crucible encourages and detects. Each one is backed by a dedicated agent.

## General

- **DRY** — Don't Repeat Yourself. Extract common logic.
- **KISS** — Keep It Simple, Stupid. Favor clarity over cleverness.
- **YAGNI** — You Aren't Gonna Need It. Don't add features speculatively.
- **Boy Scout Rule** — Leave the code better than you found it.

## Naming

- Names should reveal intent. `getUserById` not `fetch`.
- Use pronounceable names. `genymdhms` is a disease.
- Avoid mental mapping. `n` for "number of users" requires the reader to translate.
- Class names are nouns. Method names are verbs. Property names are nouns.
- Pick one word per concept. `fetch`, `retrieve`, `get` for the same thing is confusing.

## Functions

- Functions should do one thing.
- Functions should be small. (20 lines is a good target.)
- Function arguments should be few. (3 is a good maximum.)
- Functions should have no side effects (where possible).
- Prefer pure functions for the same input → same output.

## Comments

- Comments should explain *why*, not *what*.
- Don't comment bad code — rewrite it.
- Use comments to explain non-obvious decisions.
- Keep comments up to date when you change the code.

## Error handling

- Use exceptions, not return codes.
- Don't return null. Use `Optional`, `Maybe`, or exceptions.
- Don't pass null. Validate at boundaries.
- Throw early, catch late.
- Include context in error messages.

## Testing

- Test one thing per test.
- Tests should be fast.
- Tests should be independent.
- Tests should be deterministic.
- Use descriptive test names.

## Concurrency

- Shared state is the enemy. Prefer immutability.
- Use locks, but use them sparingly.
- Document thread-safety guarantees.
- Test concurrent code with race-detection tools.

## Security

- Validate input at boundaries.
- Don't trust user input.
- Use parameterized queries.
- Use prepared statements.
- Don't log secrets.
- Use HTTPS.
- Use environment variables for secrets.

## Performance

- Don't optimize prematurely.
- Measure first.
- Cache when appropriate.
- Use the right data structure.
- Profile, don't guess.

## Code review

- Review small changes. (Under 400 lines is a good target.)
- Review in pairs.
- Be kind. Critique the code, not the author.
- Ask questions. Don't assume.
- Praise good work.

## What Crucible does

Crucible's built-in agents encode many of these best practices as structured prompts. When you run `crucible review`, the agents look for:

- Bad names (style, naming agents)
- Long functions (style, architecture agents)
- Missing tests (test-coverage agent)
- Hardcoded secrets (secrets agent)
- Race conditions (concurrency agent)
- Swallowed exceptions (error-handling agent)
- Missing logging (observability agent)
- N+1 queries (performance agent)
- ... and more.

## What Crucible doesn't do

Crucible is a tool, not a replacement for human review. The best reviews combine:
- Automated checks (Crucible, linters, static analysis)
- Human reviewers (your team)
- Domain expertise (senior engineers who know the codebase)

## See also

- [Agents reference](/docs/agents)
- [Writing custom agents](/docs/writing-agents)
- [Cookbook](/docs/cookbook)
