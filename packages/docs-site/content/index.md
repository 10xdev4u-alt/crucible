---
title: Crucible
description: Multi-agent code review orchestrator
order: 0
category: Home
---

# Crucible

> **Multi-agent code review orchestrator. Code refined by fire.**

Crucible runs multiple specialized LLM-powered reviewers in parallel on your code changes, aggregates their findings through a consensus scorer, and outputs structured, actionable review reports.

```bash
npm install -g crucible
crucible review
```

## Why Crucible?

A single LLM call has a limited attention budget. Different agents — security, performance, style, architecture — catch different classes of issues. Crucible uses a **consensus mechanism** to combine their findings, ranking the strongest issues by agreement.

The output feels like a panel of senior reviewers, not a single rubber-stamp.

## Highlights

- **13 specialized review agents** out of the box
- **4 providers**: Anthropic, OpenAI, Ollama, OpenAI-compatible
- **6 output formats**: text, JSON, SARIF, Markdown, HTML, JUnit
- **Multi-perspective consensus** with agreement bonuses
- **Pluggable cache** (memory or file-backed, with TTL)
- **Bounded parallel executor** with retries and timeouts
- **GitHub PR comments** with a single command
- **Pre-commit hook** for catching issues before they ship
- **TypeScript strict**, 100% typed, 270+ tests

## Quick start

### 1. Install

```bash
npm install -g crucible
```

### 2. Initialize

```bash
crucible init
```

This creates a `.crucible.json` in your project root with sensible defaults.

### 3. Set an API key

```bash
export ANTHROPIC_API_KEY=sk-...
# or
export OPENAI_API_KEY=sk-...
```

### 4. Review

```bash
# Review your working tree
crucible review

# Or review a specific directory
crucible review src/

# Or review staged changes only
crucible review --diff staged
```

## Example output

```text
Crucible Review
  result:    r1
  request:   r-1781980430112
  duration:  3.4s
  score:     12.50
  findings:  5

Findings
  CRITICAL   SQL injection in user lookup
              category: security
              location: src/db.ts:42
              rule:     no-string-concat
              The query concatenates user input directly into the SQL
              statement. Use parameterized queries instead.

  MAJOR      N+1 query in list endpoint
              category: performance
              location: src/api/list.ts:28
              The loop issues one query per item. Use a JOIN or
              `IN (...)` clause.

  ...
```

## Next steps

- [Getting started →](/docs/getting-started/)
- [Configuration →](/docs/configuration/)
- [CLI reference →](/docs/cli/)
- [API reference →](/api/)
- [Architecture →](/docs/architecture/)
