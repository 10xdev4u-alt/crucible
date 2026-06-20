# Crucible

> Multi-agent code review orchestrator. Code refined by fire.

A CLI + library that runs multiple specialized review agents in parallel
on a diff, aggregates their findings through a consensus scorer, and
outputs structured, actionable review reports.

## Why

Single-pass LLM review misses things. Different agents (security, perf,
style, architecture) catch different classes of issues. A consensus
mechanism ranks the strongest findings. The output feels like a panel
of senior reviewers — not a single rubber-stamp.

## Status

In active development. See `docs/PLAN.md` for the build plan.

## License

MIT — see `LICENSE`.
