import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  AccessibilityAgent,
  AgentRegistry,
  AnthropicProvider,
  ApiContractAgent,
  ArchitectureAgent,
  DependencyAgent,
  DocumentationAgent,
  type Finding,
  type Format,
  getFormatter,
  InMemoryHttpClient,
  Orchestrator,
  PerformanceAgent,
  ProviderLLMCaller,
  ProviderRegistry,
  ProviderRouter,
  type ReviewRequest,
  SecurityAgent,
  StyleAgent,
  TestCoverageAgent,
} from '@crucible/core';
import { getBoolean, getList, getString } from '../argv.js';
import { getStagedDiff, getWorkingTreeDiff } from '../git/diff.js';

interface ReviewFlags {
  format: Format;
  outputFile?: string;
  agents: string[];
  categories: string[];
  severities: string[];
  excludePaths: string[];
  includePaths: string[];
  verbose: boolean;
  quiet: boolean;
  diff: 'all' | 'staged' | 'working';
  config?: string;
  mock: boolean;
}

function readFlags(flags: Record<string, string | boolean | string[]>): ReviewFlags {
  return {
    format: getString(flags, 'format', 'text') as Format,
    ...(typeof flags.output === 'string' ? { outputFile: flags.output } : {}),
    agents: getList(flags, 'agents'),
    categories: getList(flags, 'category'),
    severities: getList(flags, 'severity'),
    excludePaths: getList(flags, 'exclude'),
    includePaths: getList(flags, 'include'),
    verbose: getBoolean(flags, 'verbose'),
    quiet: getBoolean(flags, 'quiet'),
    diff: getString(flags, 'diff', 'all') as 'all' | 'staged' | 'working',
    ...(typeof flags.config === 'string' ? { config: flags.config } : {}),
    mock: getBoolean(flags, 'mock'),
  };
}

function loadConfig(path?: string): Record<string, unknown> | null {
  if (!path) path = resolve(process.cwd(), '.crucible.json');
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function buildAgents(mock: boolean, requested: string[]): AgentRegistry {
  const reg = new AgentRegistry();
  const caller = mock
    ? new ProviderLLMCaller({
        info: () => ({
          id: 'mock',
          name: 'mock',
          models: [],
          capabilities: {
            streaming: false,
            tools: false,
            vision: false,
            parallelToolCalls: false,
            systemPrompt: true,
            jsonMode: false,
          },
        }),
        complete: async () => ({ content: '', model: 'mock', finishReason: 'stop' }),
      })
    : new ProviderLLMCaller(
        new AnthropicProvider({
          apiKey: process.env.ANTHROPIC_API_KEY ?? 'missing-key',
          httpClient: new InMemoryHttpClient(),
        }),
      );

  const all: { id: string; ctor: (c: ProviderLLMCaller) => unknown }[] = [
    { id: 'security', ctor: (c) => new SecurityAgent(c) },
    { id: 'performance', ctor: (c) => new PerformanceAgent(c) },
    { id: 'style', ctor: (c) => new StyleAgent(c) },
    { id: 'architecture', ctor: (c) => new ArchitectureAgent(c) },
    { id: 'accessibility', ctor: (c) => new AccessibilityAgent(c) },
    { id: 'dependency', ctor: (c) => new DependencyAgent(c) },
    { id: 'test-coverage', ctor: (c) => new TestCoverageAgent(c) },
    { id: 'api-contract', ctor: (c) => new ApiContractAgent(c) },
    { id: 'documentation', ctor: (c) => new DocumentationAgent(c) },
  ];
  for (const { id, ctor } of all) {
    if (requested.length > 0 && !requested.includes(id)) continue;
    reg.register(ctor(caller) as never);
  }
  return reg;
}

function buildProviders(): ProviderRegistry {
  const reg = new ProviderRegistry();
  if (process.env.ANTHROPIC_API_KEY) {
    reg.register(
      new AnthropicProvider({
        apiKey: process.env.ANTHROPIC_API_KEY,
        httpClient: new InMemoryHttpClient(),
      }),
    );
  }
  if (Object.keys(reg).length === 0) {
    // Force a router so reports can be generated even without a configured provider.
    reg.register({
      info: () => ({
        id: 'router',
        name: 'router',
        models: [],
        capabilities: {
          streaming: false,
          tools: false,
          vision: false,
          parallelToolCalls: false,
          systemPrompt: true,
          jsonMode: false,
        },
      }),
      complete: async () => ({ content: '', model: 'none', finishReason: 'stop' }),
    });
  }
  return reg;
}

export async function cmdReview(
  positionals: string[],
  flags: Record<string, string | boolean | string[]>,
): Promise<number> {
  void buildProviders; // kept for future provider configuration wiring
  const opts = readFlags(flags);
  const config = loadConfig(opts.config);
  const requestedAgents = opts.agents.length > 0 ? opts.agents : [];
  const target = positionals[0] ?? '.';
  const root = resolve(process.cwd(), target);

  const changeSet =
    opts.diff === 'staged'
      ? getStagedDiff(root)
      : opts.diff === 'working'
        ? getWorkingTreeDiff(root)
        : mergeChanges(getStagedDiff(root), getWorkingTreeDiff(root));

  if (changeSet.files.length === 0) {
    if (!opts.quiet) console.error('No changes to review.');
    return 0;
  }

  const request: ReviewRequest = {
    id: `r-${Date.now()}`,
    target: { kind: 'diff', change: changeSet },
    requestedAt: new Date().toISOString(),
    constraints: {
      ...(requestedAgents.length > 0 ? { agentIds: requestedAgents } : {}),
      ...(opts.severities.length > 0 ? { severities: opts.severities } : {}),
      ...(opts.categories.length > 0 ? { categories: opts.categories } : {}),
      ...(opts.excludePaths.length > 0 ? { excludePaths: opts.excludePaths } : {}),
      ...(opts.includePaths.length > 0 ? { includePaths: opts.includePaths } : {}),
    },
  };

  const agents = buildAgents(opts.mock, requestedAgents);
  const orchestrator = new Orchestrator(agents, { parallelism: 4, timeoutMs: 60_000, retries: 1 });
  const result = await orchestrator.review(request, {
    request,
    project: { root, name: (config?.project as { name?: string } | undefined)?.name ?? '' },
    repository: { provider: 'local' },
    changeSet,
    env: { ...process.env } as Record<string, string>,
  });

  const formatter = getFormatter(opts.format, { color: !opts.outputFile, verbose: opts.verbose });
  const out = formatter.format(result);
  if (opts.outputFile) {
    writeFileSync(opts.outputFile, out, 'utf8');
    if (!opts.quiet) console.error(`Wrote ${opts.outputFile}`);
  } else {
    process.stdout.write(`${out}\n`);
  }
  const critical = result.findings.filter(
    (f: Finding) => f.severity === 'critical' || f.severity === 'blocker',
  ).length;
  return critical > 0 ? 1 : 0;
}

function mergeChanges(
  a: ReturnType<typeof getStagedDiff>,
  b: ReturnType<typeof getWorkingTreeDiff>,
) {
  return a.files.length > 0 ? a : b;
}
void ProviderRouter; // suppress unused
