---
title: API reference
description: Programmatic API
order: 0
category: API
---

# API reference

Use Crucible programmatically. See [Library API](/docs/api/) for the full guide.

## Quick start

```ts
import { Orchestrator, AgentRegistry, AnthropicProvider, /* ... */ } from "@crucible/core";

const provider = new AnthropicProvider({ apiKey: process.env.ANTHROPIC_API_KEY! });
const caller = new ProviderLLMCaller(provider);

const agents = new AgentRegistry();
agents.register(new SecurityAgent(caller));
agents.register(new PerformanceAgent(caller));

const orch = new Orchestrator(agents);
const result = await orch.review(request, context);
```

For the full reference, see [Library API → Quick example](/docs/api/#quick-example).
