/** `crucible validate` — validate the .crucible.json against the schema. */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { configSchema } from '@crucible/core';
import { getString } from '../argv.js';

export function cmdValidate(positionals: string[], flags: Record<string, string | boolean | string[]>): number {
  const configPath = resolve(
    process.cwd(),
    positionals[0] ?? getString(flags, 'config', '.crucible.json'),
  );
  if (!existsSync(configPath)) {
    console.error(`Config not found: ${configPath}`);
    return 1;
  }
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(configPath, 'utf8'));
  } catch (err) {
    console.error(`Config is not valid JSON: ${err instanceof Error ? err.message : String(err)}`);
    return 1;
  }
  const result = configSchema.safeParse(raw);
  if (!result.success) {
    console.error('Config validation failed:');
    for (const issue of result.error.issues) {
      const path = issue.path.length > 0 ? issue.path.join('.') : '(root)';
      console.error(`  ${path}: ${issue.message}`);
    }
    return 1;
  }
  console.log(`✓ ${configPath} is valid`);
  console.log(`  ${result.data.agents.length} agents configured`);
  console.log(`  ${result.data.providers.length} providers configured`);
  console.log(`  cache: ${result.data.cache.enabled ? `${result.data.cache.kind} (TTL ${result.data.cache.ttlSeconds}s)` : 'disabled'}`);
  console.log(`  runtime: parallelism=${result.data.runtime.parallelism}, timeoutMs=${result.data.runtime.timeoutMs}, retries=${result.data.runtime.retries}`);
  return 0;
}
