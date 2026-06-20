---
title: Custom providers
description: Build your own LLM provider
order: 21
category: Documentation
---

# Custom providers

If the built-in providers don't fit your needs, you can write your own. The `Provider` interface is small.

## The interface

```ts
interface Provider {
  info(): ProviderInfo;
  complete(request: ProviderRequest): Promise<ProviderResponse>;
}
```

That's it. Implement those two methods and you can plug your provider into any agent.

## Minimal example

A simple echo provider (useful for testing):

```ts
import type { Provider, ProviderInfo, ProviderRequest, ProviderResponse } from "@crucible/core";

class EchoProvider implements Provider {
  info(): ProviderInfo {
    return {
      id: "echo",
      name: "Echo Provider",
      models: [{ id: "echo-1", provider: "echo", contextWindow: 8192, maxOutputTokens: 4096, supportsTools: false, supportsStreaming: false, supportsVision: false }],
      capabilities: { streaming: false, tools: false, vision: false, parallelToolCalls: false, systemPrompt: true, jsonMode: false },
    };
  }

  async complete(request: ProviderRequest): Promise<ProviderResponse> {
    return {
      content: `Echo: ${request.messages.map((m) => m.content).join(" ")}`,
      model: request.model,
      finishReason: "stop",
    };
  }
}
```

Register it:

```ts
import { ProviderRegistry, SecurityAgent, ProviderLLMCaller } from "@crucible/core";

const registry = new ProviderRegistry();
registry.register(new EchoProvider());

const caller = new ProviderLLMCaller(/* any provider from the registry */);

const agents = new AgentRegistry();
agents.register(new SecurityAgent(caller));
// ...
```

## Real-world example: Cohere

Cohere has a different API shape than OpenAI. Here's how you'd adapt it:

```ts
import type { Provider, ProviderInfo, ProviderRequest, ProviderResponse } from "@crucible/core";
import { type HttpClient } from "@crucible/core/providers/http.js";

class CohereProvider implements Provider {
  constructor(
    private readonly apiKey: string,
    private readonly httpClient: HttpClient,
    private readonly defaultModel = "command-r-plus",
  ) {}

  info(): ProviderInfo {
    return {
      id: "cohere",
      name: "Cohere",
      models: [
        { id: "command-r-plus", provider: "cohere", contextWindow: 128_000, maxOutputTokens: 4_000, supportsTools: true, supportsStreaming: true, supportsVision: false },
        { id: "command-r", provider: "cohere", contextWindow: 128_000, maxOutputTokens: 4_000, supportsTools: true, supportsStreaming: true, supportsVision: false },
      ],
      capabilities: { streaming: true, tools: true, vision: false, parallelToolCalls: false, systemPrompt: true, jsonMode: false },
    };
  }

  async complete(request: ProviderRequest): Promise<ProviderResponse> {
    const lastUser = [...request.messages].reverse().find((m) => m.role === "user");
    const systemPrompt = request.systemPrompt ?? request.messages.find((m) => m.role === "system")?.content;

    const body: Record<string, unknown> = {
      model: request.model || this.defaultModel,
      message: lastUser?.content ?? "",
      ...(systemPrompt ? { preamble: systemPrompt } : {}),
      ...(request.maxOutputTokens ? { max_tokens: request.maxOutputTokens } : {}),
    };

    const res = await this.httpClient.request<{
      text: string;
      finish_reason: string;
      meta?: { tokens?: { input_tokens: number; output_tokens: number } };
    }>({
      url: "https://api.cohere.ai/v1/chat",
      method: "POST",
      headers: { authorization: `Bearer ${this.apiKey}`, "content-type": "application/json" },
      body,
      signal: request.signal,
    });

    if (res.status >= 400) throw new Error(`Cohere API ${res.status}`);

    return {
      content: res.body.text,
      model: request.model || this.defaultModel,
      finishReason: res.body.finish_reason === "MAX_TOKENS" ? "length" : "stop",
      usage: res.body.meta?.tokens
        ? { inputTokens: res.body.meta.tokens.input_tokens, outputTokens: res.body.meta.tokens.output_tokens }
        : undefined,
    };
  }
}
```

## Custom HTTP client

If you need to add caching, retry, or observability to all your HTTP calls, you can write a custom `HttpClient`:

```ts
import type { HttpClient, HttpResponse } from "@crucible/core/providers/http.js";

class CachingHttpClient implements HttpClient {
  private readonly cache = new Map<string, { body: unknown; expiresAt: number }>();
  private readonly inner: HttpClient;

  constructor(inner: HttpClient, private readonly ttlMs = 60_000) {
    this.inner = inner;
  }

  async request<T>(options: { url: string; method: string; headers?: Record<string, string>; body?: unknown; signal?: AbortSignal }): Promise<HttpResponse<T>> {
    const key = `${options.method}:${options.url}:${JSON.stringify(options.body ?? null)}`;
    if (options.method === "GET") {
      const cached = this.cache.get(key);
      if (cached && cached.expiresAt > Date.now()) {
        return { status: 200, headers: {}, body: cached.body as T };
      }
    }
    const res = await this.inner.request<T>(options);
    if (options.method === "GET" && res.status === 200) {
      this.cache.set(key, { body: res.body, expiresAt: Date.now() + this.ttlMs });
    }
    return res;
  }
}
```

Use it:

```ts
const cachingClient = new CachingHttpClient(new FetchHttpClient(), 5 * 60_000);
const provider = new OpenAICompatibleProvider({
  id: "openai",
  name: "OpenAI",
  baseUrl: "https://api.openai.com/v1",
  apiKey: process.env.OPENAI_API_KEY!,
  models: [{ id: "gpt-5" }],
  httpClient: cachingClient,
});
```

## Caching in agents

You can also cache at the agent level. Wrap the provider in a caching layer:

```ts
import { ProviderLLMCaller } from "@crucible/core";

class CachingCaller implements ProviderLLMCaller {
  private readonly cache = new Map<string, string>();
  constructor(private readonly inner: ProviderLLMCaller) {}

  async complete(request) {
    const key = JSON.stringify({ model: request.model, messages: request.messages });
    if (this.cache.has(key)) {
      return { content: this.cache.get(key)!, model: request.model, finishReason: "stop" };
    }
    const res = await this.inner.complete(request);
    this.cache.set(key, res.content);
    return res;
  }
}
```

## Multiple providers in one orchestrator

You can register multiple providers and let Crucible route by model:

```ts
import { ProviderRegistry, ProviderRouter } from "@crucible/core";

const registry = new ProviderRegistry();
registry.register(new AnthropicProvider({ apiKey: process.env.ANTHROPIC_API_KEY! }));
registry.register(new OpenAIProvider({ apiKey: process.env.OPENAI_API_KEY! }));
registry.register(new GeminiProvider({ apiKey: process.env.GEMINI_API_KEY! }));

const router = new ProviderRouter(registry, { preferProviderIds: ["anthropic", "openai"] });
```

Crucible will:
1. Look for the requested model across all providers
2. Fall back to the preferred provider if the model is unknown
3. Fall back to a default model if nothing matches

## See also

- [Providers reference](/docs/providers)
- [Library API → Provider interface](/docs/api/#core-types)
- [Writing custom agents](/docs/writing-agents)
