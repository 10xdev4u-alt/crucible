---
title: Plugins
description: Extend Crucible with custom agents
order: 22
category: Documentation
---

# Plugins

Plugins are TypeScript files that export agents. Use them to share agents across projects, or to keep custom agents separate from your main code.

## Plugin file format

A plugin is a `.ts`, `.js`, `.cjs`, or `.mjs` file that exports either `agent` (one) or `agents` (many):

```ts
// my-plugin.ts
import { definePlugin, BaseAgent, type LLMCaller } from "@crucible/core";

class MyCustomAgent extends BaseAgent {
  protected readonly agentInfo = { /* ... */ };
  protected readonly prompt = { /* ... */ };
  protected override parseResponse(content: string) { /* ... */ }
}

export default definePlugin({
  agents: [new MyCustomAgent(caller)],
});
```

## Discovering plugins

```ts
import { AgentRegistry, discoverPlugins } from "@crucible/core";

const registry = new AgentRegistry();
const plugins = await discoverPlugins("./crucible-plugins");

for (const plugin of plugins) {
  for (const agent of plugin.agents) {
    registry.register(agent);
  }
}
```

`discoverPlugins(dir, { recursive: true })`:
1. Walks the directory recursively
2. Imports every `.ts`/`.js`/`.cjs`/`.mjs` file
3. Looks for an exported `agent` or `agents` field
4. Returns a `LoadedPlugin` for each successful import

Errors during loading are logged but don't stop the walker. One broken plugin doesn't break the rest.

## Plugin helpers

The library exports helpers to make defining plugins easier:

```ts
import { definePlugin, defineAgentPlugin } from "@crucible/core";

// Multiple agents
export default definePlugin({
  agents: [new Agent1(), new Agent2()],
});

// Single agent (shorthand)
export default defineAgentPlugin(new MyAgent());
```

## Where to put plugins

Common patterns:
- `crucible-plugins/` — single directory of plugin files
- `.crucible/agents/` — dotfile-style, ignored by git
- `agents/` in the project root
- A separate package in a monorepo

## A complete example

```
my-project/
├── .crucible.json
├── crucible-plugins/
│   ├── my-company-agent.ts
│   └── compliance-agent.ts
├── src/
└── package.json
```

```ts
// my-project/src/review.ts
import { AgentRegistry, AnthropicProvider, ProviderLLMCaller, discoverPlugins, Orchestrator } from "@crucible/core";

const provider = new AnthropicProvider({ apiKey: process.env.ANTHROPIC_API_KEY! });
const caller = new ProviderLLMCaller(provider);

const registry = new AgentRegistry();
const plugins = await discoverPlugins("./crucible-plugins");
for (const plugin of plugins) {
  for (const agent of plugin.agents) {
    registry.register(agent);
  }
}

const orchestrator = new Orchestrator(registry);
const result = await orchestrator.review(request, context);
```

## Hot-reloading

Plugins are loaded once at startup. To update them, restart the process.

If you need hot-reloading (e.g. for development), wrap `discoverPlugins` in a file watcher:

```ts
import { FileWatcher, discoverPlugins } from "@crucible/core";

const watcher = new FileWatcher("./crucible-plugins");
watcher.on(async (event) => {
  if (event.kind === "change" && event.path.endsWith(".ts")) {
    const plugins = await discoverPlugins("./crucible-plugins");
    // re-register
  }
});
watcher.start();
```

## Publishing plugins

You can publish plugins as npm packages:

```json
// my-plugin/package.json
{
  "name": "@my-org/crucible-plugin-compliance",
  "main": "./dist/index.js",
  "peerDependencies": {
    "@crucible/core": "^0.1.0"
  }
}
```

```ts
// my-plugin/src/index.ts
import { definePlugin, BaseAgent } from "@crucible/core";

class ComplianceAgent extends BaseAgent { /* ... */ }

export default definePlugin({
  agents: [new ComplianceAgent(caller)],
});
```

Then in your project:

```bash
pnpm add @my-org/crucible-plugin-compliance
```

```ts
import compliancePlugin from "@my-org/crucible-plugin-compliance";
// Register the plugin's agents with your registry
```

## Security considerations

Plugins are arbitrary code that runs in your process. Only load plugins from sources you trust. The plugin system doesn't sandbox plugin code.

If you want to load untrusted plugins, run them in a separate process (e.g. via `child_process.fork()`) and communicate via IPC.

## See also

- [Writing custom agents](/docs/writing-agents)
- [Custom providers](/docs/custom-providers)
- [Architecture → Extension points](/docs/architecture/#extension-points)
