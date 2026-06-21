#!/usr/bin/env node
/**
 * Crucible CLI — multi-agent code review orchestrator.
 *
 * Run `crucible --help` to see available commands.
 */
import { CLI_BANNER, CLI_BANNER_MINI } from './banner.js';
import { run } from './program.js';
import { cmdVersionLong } from './commands/version-long.js';

// Show banner + extended version on --version
if (process.argv.includes('--version') || process.argv.includes('-v')) {
  console.log(CLI_BANNER);
  cmdVersionLong();
  process.exit(0);
}

if (process.argv.includes('--help') || process.argv.includes('-h') || process.argv.length === 2) {
  console.log(CLI_BANNER_MINI);
}

run(process.argv.slice(2)).then(
  (code: number) => process.exit(code),
  (err: unknown) => {
    console.error('crucible: unexpected error:', err);
    process.exit(1);
  },
);
