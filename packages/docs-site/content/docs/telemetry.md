---
title: Telemetry
description: How Crucible handles observability
order: 17
category: Documentation
---

# Telemetry

Crucible does **not** collect telemetry by default. You opt in.

## Why opt-in?

Code review is sensitive. The diffs you review may contain:
- Business logic
- API keys (in extreme cases)
- Customer data
- PII

The last thing you want is a third party (us) collecting that. So Crucible ships with **zero telemetry**.

## What you can collect locally

Crucible emits events to an in-process `EventBus` that you can subscribe to:

```ts
import { EventBus, Orchestrator } from "@crucible/core";

type Events = {
  review_complete: { findings: number; score: number; durationMs: number };
};

const bus = new EventBus<Events>();
bus.on("review_complete", (e) => {
  console.log(`Review took ${e.durationMs}ms, found ${e.findings} findings`);
});
```

This works in-process only. No data leaves your machine unless you send it.

## What you can collect remotely

You can pipe events to your own backend:

```ts
bus.on("review_complete", async (e) => {
  await fetch("https://metrics.example.com/events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...e, repo: process.env.GITHUB_REPOSITORY }),
  });
});
```

If you do this, you own the data. Crucible doesn't see it.

## What we (Crucible maintainers) would love

If you're using Crucible in production and want to help us improve it, we have a **completely opt-in** feedback mechanism:

```bash
crucible review --feedback https://your-feedback-endpoint.example.com
```

This sends:
- The agent IDs that ran
- The number of findings (not their content)
- The duration in ms
- The Crucible version

It does **not** send your diff, your code, or your findings' content. This is opt-in and off by default.

We'd use aggregated data to:
- See which agents are most used
- Track performance regressions
- Prioritize new features

If you'd rather not share even this, just don't pass `--feedback`. We respect that.

## See also

- [Configuration](/docs/configuration/)
- [Library API → EventBus](/docs/api/#utilities)
- [Cookbook → Telemetry recipe](/docs/cookbook/#recipe-telemetry)
