import { getBoolean, getString, parseArgs } from './argv.js';
import { cmdAgents } from './commands/agents.js';
import { cmdCache } from './commands/cache.js';
import { cmdCheck } from './commands/check.js';
import { cmdDiff } from './commands/diff.js';
import { cmdDryRun } from './commands/dry-run.js';
import { cmdHook } from './commands/hook.js';
import { cmdInit } from './commands/init.js';
import { cmdReview } from './commands/review.js';
import { cmdSchema } from './commands/schema.js';
import { cmdStatus } from './commands/status.js';
import { cmdVersion } from './commands/version.js';

const HELP = `crucible — multi-agent code review orchestrator

Usage: crucible <command> [options]

Commands:
  review [path]    Review a directory, file, or diff
  check [path]     Review and produce a PR summary (markdown + json)
  dry-run [path]   Review without writing any output
  diff [path]      Print the parsed git diff as JSON
  init             Initialize a .crucible.json config file
  agents           List available agents
  status [path]    Show repo status and pending changes
  cache <cmd>      Manage the local cache (info, list, clear)
  hook install     Install a pre-commit hook
  schema [write]   Print the JSON schema for .crucible.json
  version          Show the version
  help             Show this help

Common options:
  --format <name>  Output format: text, json, sarif, markdown, html, junit
  --output <file>  Write output to a file (default: stdout)
  --agents <ids>   Comma-separated list of agent ids to run
  --severity <lvls> Comma-separated severities to include
  --verbose, -v    Verbose output
  --quiet, -q      Suppress non-essential output
  --help, -h       Show help
`;

export async function run(argv: readonly string[]): Promise<number> {
  const args = parseArgs(argv);
  if (args.positionals.length === 0 || getBoolean(args.flags, 'help')) {
    console.log(HELP);
    return 0;
  }
  const cmd = args.positionals[0];
  const rest = args.positionals.slice(1);
  switch (cmd) {
    case 'review':
      return cmdReview(rest, args.flags);
    case 'init':
      return cmdInit(args.flags);
    case 'agents':
      return cmdAgents(args.flags);
    case 'status':
      return cmdStatus(rest);
    case 'cache':
      return cmdCache(rest, args.flags);
    case 'check':
      return cmdCheck(rest, args.flags);
    case 'diff':
      return cmdDiff(rest);
    case 'dry-run':
      return cmdDryRun(rest, args.flags);
    case 'hook':
      return cmdHook(rest);
    case 'schema':
      return cmdSchema(rest);
    case 'version':
    case '--version':
    case '-v':
      return cmdVersion();
    case 'help':
      console.log(HELP);
      return 0;
    default:
      console.error(`Unknown command: ${cmd}\n`);
      console.log(HELP);
      return 2;
  }
}

// Suppress unused imports warning
void getString;
