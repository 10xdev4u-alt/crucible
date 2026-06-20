import { z } from 'zod';

/** Schema for the agent section of the config. */
export const agentConfigSchema = z.object({
  id: z.string(),
  enabled: z.boolean().default(true),
  weight: z.number().min(0).max(10).default(1),
  options: z.record(z.string(), z.unknown()).default({}),
});

/** Schema for the provider section of the config. */
export const providerConfigSchema = z.object({
  id: z.string(),
  enabled: z.boolean().default(true),
  apiKeyEnv: z.string().optional(),
  baseUrl: z.string().url().optional(),
  defaultModel: z.string().optional(),
  options: z.record(z.string(), z.unknown()).default({}),
});

/** Schema for the output section of the config. */
export const outputConfigSchema = z.object({
  format: z.enum(['text', 'json', 'sarif', 'markdown', 'html', 'junit']).default('text'),
  destination: z.enum(['stdout', 'stderr', 'file']).default('stdout'),
  filePath: z.string().optional(),
  color: z.boolean().default(true),
  verbose: z.boolean().default(false),
});

/** Schema for the cache section of the config. */
export const cacheConfigSchema = z.object({
  enabled: z.boolean().default(true),
  kind: z.enum(['memory', 'file', 'sqlite']).default('memory'),
  path: z.string().optional(),
  ttlSeconds: z.number().int().positive().default(3600),
});

/** Schema for the runtime section of the config. */
export const runtimeConfigSchema = z.object({
  parallelism: z.number().int().positive().default(4),
  timeoutMs: z.number().int().positive().default(60_000),
  retries: z.number().int().nonnegative().default(2),
});

/** The full config schema. */
export const configSchema = z.object({
  version: z.literal(1),
  project: z
    .object({
      name: z.string().optional(),
      root: z.string().optional(),
    })
    .default({}),
  agents: z.array(agentConfigSchema).default([]),
  providers: z.array(providerConfigSchema).default([]),
  output: outputConfigSchema.default({
    format: 'text',
    destination: 'stdout',
    color: true,
    verbose: false,
  }),
  cache: cacheConfigSchema.default({
    enabled: true,
    kind: 'memory',
    ttlSeconds: 3600,
  }),
  runtime: runtimeConfigSchema.default({
    parallelism: 4,
    timeoutMs: 60_000,
    retries: 2,
  }),
});

export type Config = z.infer<typeof configSchema>;
export type AgentConfig = z.infer<typeof agentConfigSchema>;
export type ProviderConfig = z.infer<typeof providerConfigSchema>;
export type OutputConfig = z.infer<typeof outputConfigSchema>;
export type CacheConfig = z.infer<typeof cacheConfigSchema>;
export type RuntimeConfig = z.infer<typeof runtimeConfigSchema>;
