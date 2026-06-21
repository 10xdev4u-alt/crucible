---
title: Glossary
description: Terms used in Crucible
order: 33
category: Documentation
---

# Glossary

Terms used throughout Crucible, defined in one place.

## Agent

A specialized reviewer. Crucible ships with 16 built-in agents. Each has a focused prompt template and produces findings in a specific category.

## Agent registry

A collection of agents. The orchestrator uses the registry to look up which agents to run. See `AgentRegistry`.

## Cache

A store of past review results, keyed by a hash of the input. Caches can be in-memory or file-backed. Caches have a TTL and a max size.

## Change set

The set of changes being reviewed. Usually a git diff, but can also be a list of files, a directory, or a single commit.

## Consensus score

A number representing how strongly multiple agents agree on a finding. Higher = more agreement = more important.

## Diff

A textual representation of changes. Git diffs are the most common input. Crucible parses unified diffs.

## Finding

A single review issue. Has a severity, category, location, message, and (optionally) a fix.

## Formatter

A component that converts a `ReviewResult` to a string in a specific format. Formatters are pure functions.

## LLM

Large Language Model. Crucible uses LLMs to generate review findings. Examples: Claude, GPT, Gemini, Llama.

## LSP

Language Server Protocol. A standard for editor-tool integration. Crucible has an LSP scaffold.

## Multi-agent

A pattern where multiple specialized agents work on the same problem. Crucible's core idea.

## Orchestrator

The central class that coordinates agents. See `Orchestrator`.

## Output

The result of a review. The orchestrator produces a `ReviewResult`, which is then formatted by a formatter.

## Plugin

A user-defined extension. Plugins can add agents, providers, formatters, or anything else.

## Provider

A wrapper around an LLM API. Crucible ships with 5 providers (Anthropic, OpenAI, Gemini, Bedrock, Ollama) plus an OpenAI-compatible adapter.

## Review

The full process of running agents on a change set and producing findings.

## Review result

The output of a review. Includes findings, per-agent stats, errors, and metadata.

## SARIF

Static Analysis Results Interchange Format. A JSON-based format for code scanning tools.

## Severity

How important a finding is. Crucible has 5: info, minor, major, critical, blocker.

## Zod

A TypeScript library for runtime validation. Crucible uses Zod to validate config files.

## See also

- [CLI reference](/docs/cli)
- [Configuration reference](/docs/configuration-reference)
- [Architecture](/docs/architecture)
