import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { configSchema } from '@crucible/core';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { getString } from '../argv.js';

const buildSchema = (): string => JSON.stringify(zodToJsonSchema(configSchema), null, 2);

/** Print the JSON schema for the .crucible.json config. */
export function cmdSchema(positionals: string[]): number {
  const sub = positionals[0];
  if (sub === 'write') {
    const out = resolve(
      process.cwd(),
      getString({} as Record<string, string | boolean | string[]>, 'out', 'docs/schema.json'),
    );
    mkdirSync(dirname(out), { recursive: true });
    if (existsSync(out)) {
      console.error(`Refusing to overwrite ${out} without --force`);
      return 1;
    }
    writeFileSync(out, buildSchema(), 'utf8');
    console.log(`Wrote ${out}`);
    return 0;
  }
  console.log(buildSchema());
  return 0;
}
