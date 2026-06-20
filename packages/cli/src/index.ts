#!/usr/bin/env node
/**
 * Crucible CLI — multi-agent code review orchestrator.
 *
 * Run `crucible --help` to see available commands.
 */
import { run } from './program.js';

run(process.argv.slice(2)).then(
  (code: number) => process.exit(code),
  (err: unknown) => {
    console.error('crucible: unexpected error:', err);
    process.exit(1);
  },
);
