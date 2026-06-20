---
title: Writing custom agents
description: Build your own review agents
order: 14
category: Documentation
---

# Writing custom agents

This guide walks you through writing a custom review agent. There are two main approaches:

1. **Prompt-based** (recommended) — extend `BaseAgent`, provide a system prompt and a parser.
2. **Code-based** — implement the `Agent` interface directly for static analysis.

## Approach 1: Prompt-based agents

The simplest and most common way to add a new agent. You provide:
- A system prompt that sets the LLM's role
- A user prompt template that formats the diff
- A parser that extracts structured findings from the LLM's response

### Minimal example

```ts
import { BaseAgent, type LLMCaller, type PromptTemplate } from "@crucible/core";
import { parseStructuredFindings } from "@crucible/core/agents/parser.js";

const SYSTEM_PROMPT = `You are the Foo reviewer. Look for:
- Missing foo
- Improper bar usage
- Inconsistent baz

For each issue, output:
### <title> [<severity>]
**File:** <path>:<line>
**Rule:** <rule-id>
**Message:** <detailed message>`;

const PROMPT: PromptTemplate = {
  system: SYSTEM_PROMPT,
  user: (input) => {
    const files = input.context.changeSet?.files ?? [];
    return files
      .map((f) => `${f.path}\n${f.hunks.map((h) => h.lines.map((l) => l.content).join("\n")).join("\n")}`)
      .join("\n\n---\n\n");
  },
};

export class FooAgent extends BaseAgent {
  protected readonly agentInfo = {
    id: "foo",
    name: "Foo Reviewer",
    version: "1.0.0",
    description: "Detects foo-related issues",
    categories: ["foo", "bar"],
    capabilities: ["foo-detection"],
  };
  protected readonly prompt = PROMPT;

  protected override parseResponse(content: string) {
    return parseStructuredFindings(content, this.agentInfo.id).map((f) => ({
      ...f,
      category: "foo",
    }));
  }
}
```

### Register the agent

```ts
import { AgentRegistry, AnthropicProvider, ProviderLLMCaller } from "@crucible/core";
import { FooAgent } from "./foo-agent.js";

const provider = new AnthropicProvider({ apiKey: process.env.ANTHROPIC_API_KEY! });
const caller = new ProviderLLMCaller(provider);

const agents = new AgentRegistry();
agents.register(new FooAgent(caller));
```

### Use a different model per agent

```ts
new FooAgent(caller, "claude-opus-4-5"); // override default model
```

### Customize the prompt via config

In your `.crucible.json`:

```json
{
  "agents": [
    {
      "id": "foo",
      "weight": 2,
      "options": {
        "prompt": "Custom instructions for the Foo agent…"
      }
    }
  ]
}
```

To honor the override, read `options.prompt` in your agent's user function:

```ts
const PROMPT: PromptTemplate = {
  system: SYSTEM_PROMPT,
  user: (input) => {
    const customPrompt = input.context.metadata?.prompt as string | undefined;
    if (customPrompt) return customPrompt;
    // default rendering
    return …;
  },
};
```

## Approach 2: Code-based agents

For static analysis (no LLM), implement the `Agent` interface directly:

```ts
import { type Agent, type AgentInfo, type AgentInput, type AgentOutput } from "@crucible/core";
import { Finding } from "@crucible/core";

class MyStaticAnalyzer implements Agent {
  info(): AgentInfo {
    return {
      id: "my-static",
      name: "My Static Analyzer",
      version: "1.0.0",
      description: "Runs my custom AST analysis",
      categories: ["my-category"],
      capabilities: ["ast"],
    };
  }

  async review(input: AgentInput): Promise<AgentOutput> {
    const findings: Finding[] = [];
    for (const file of input.context.changeSet?.files ?? []) {
      // Run your AST analysis here
      if (file.path.endsWith(".ts")) {
        findings.push({
          id: `${this.info().id}-${file.path}`,
          agentId: this.info().id,
          category: "my-category",
          severity: "minor",
          title: "Detected issue",
          message: "Found something interesting",
          location: { file: file.path, line: 1 },
          confidence: 1.0,
          createdAt: new Date().toISOString(),
        });
      }
    }
    return {
      agentId: this.info().id,
      findings,
      durationMs: 0,
    };
  }
}
```

## Loading from a directory

Use `discoverPlugins` to load custom agents from a directory:

```ts
import { AgentRegistry, discoverPlugins, AnthropicProvider, ProviderLLMCaller } from "@crucible/core";

const provider = new AnthropicProvider({ apiKey: process.env.ANTHROPIC_API_KEY! });
const caller = new ProviderLLMCaller(provider);

const registry = new AgentRegistry();
const plugins = await discoverPlugins("./crucible-plugins");
for (const plugin of plugins) {
  for (const agent of plugin.agents) {
    registry.register(agent);
  }
}
```

Each plugin file exports an `agent` or `agents` field:

```ts
// my-plugin.ts
import { definePlugin, FooAgent } from "@crucible/core";

export default definePlugin({
  agents: [new FooAgent(caller)],
});
```

## Best practices

1. **Keep prompts focused** — one agent, one concern. Don't try to do too much.
2. **Be specific about output format** — the parser expects a specific structure. Document it in the system prompt.
3. **Test with a known input** — write tests that feed a fixed diff to your agent and check the parser.
4. **Use a small model for simple agents** — `claude-haiku-4-5` is plenty for most review tasks.
5. **Version your agents** — include the version in the `info()` return so users can see what they're running.

## See also

- [Architecture → Extension points](/docs/architecture/#extension-points)
- [Library API → Agent interface](/docs/api/#core-types)
- [Agents reference](/docs/agents/)
