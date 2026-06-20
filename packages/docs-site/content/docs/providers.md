---
title: Providers
description: LLM provider configuration
order: 5
category: Documentation
---

# Providers

Crucible supports multiple LLM providers out of the box. You can also plug in any OpenAI-compatible endpoint.

## Built-in providers

### Anthropic

The recommended provider. Uses the Anthropic Messages API.

```json
{
  "providers": [
    {
      "id": "anthropic",
      "defaultModel": "claude-sonnet-4-5"
    }
  ]
}
```

| Variable | Required |
|---|---|
| `ANTHROPIC_API_KEY` | Yes |

Available models:

| Model | Context | Cost (in/out per 1k tokens) |
|---|---|---|
| `claude-opus-4-5` | 200k | $0.015 / $0.075 |
| `claude-sonnet-4-5` | 200k | $0.003 / $0.015 |
| `claude-haiku-4-5` | 200k | $0.0008 / $0.004 |

### OpenAI

```json
{
  "providers": [
    {
      "id": "openai",
      "defaultModel": "gpt-5"
    }
  ]
}
```

| Variable | Required |
|---|---|
| `OPENAI_API_KEY` | Yes |

Available models:

| Model | Context |
|---|---|
| `gpt-5` | 400k |
| `gpt-5-mini` | 400k |
| `o3` | 200k |

### Ollama (local)

```json
{
  "providers": [
    {
      "id": "ollama",
      "baseUrl": "http://localhost:11434/v1",
      "defaultModel": "llama3.3:70b"
    }
  ]
}
```

Ollama exposes an OpenAI-compatible API. Recommended models:

| Model | Notes |
|---|---|
| `llama3.3:70b` | Good general purpose, large. |
| `qwen2.5-coder:32b` | Strong on code review. |
| `deepseek-r1:32b` | Strong reasoning, slower. |

No API key needed.

### OpenAI-compatible

Any endpoint that follows the OpenAI Chat Completions API. Useful for:
- Custom self-hosted models
- LLM gateways (Portkey, LiteLLM, etc.)
- Regional endpoints (Azure OpenAI, Bedrock, etc.)

```json
{
  "providers": [
    {
      "id": "my-gateway",
      "baseUrl": "https://api.example.com/v1",
      "defaultModel": "model-id"
    }
  ]
}
```

If `apiKeyEnv` is set or `apiKey` is in the env, the bearer token is sent.

## Custom providers (programmatic)

You can register custom providers in code:

```ts
import { ProviderRegistry, OpenAICompatibleProvider } from "@crucible/core";

const registry = new ProviderRegistry();
registry.register(
  new OpenAICompatibleProvider({
    id: "my-provider",
    name: "My Gateway",
    baseUrl: "https://api.example.com/v1",
    apiKey: process.env.MY_API_KEY!,
    models: [
      { id: "model-1", contextWindow: 32_000, maxOutputTokens: 4_000 },
    ],
  }),
);
```

## Routing

The `ProviderRouter` lets you specify preferred providers and a fallback:

```ts
import { ProviderRouter } from "@crucible/core";

const router = new ProviderRouter(registry, {
  preferProviderIds: ["anthropic", "openai"],
  fallbackModel: "claude-haiku-4-5",
});
```

The router picks the provider that owns the requested model, falling back to preferred providers, then to the configured fallback model.

## Cost tracking

Crucible does not currently do per-request cost tracking, but the model descriptor includes `costPerInputToken` and `costPerOutputToken`. You can compute costs in your own code:

```ts
import { estimateCost } from "@crucible/core";

const cost = estimateCost(
  1000, // input tokens
  500, // output tokens
  0.000003, // cost per input token (Sonnet)
  0.000015, // cost per output token (Sonnet)
);
```
