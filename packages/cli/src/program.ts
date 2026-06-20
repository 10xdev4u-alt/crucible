import { getBoolean, getString, parseArgs } from './argv.js';
import { cmdAgents } from './commands/agents.js';
import { cmdInit } from './commands/init.js';
import { cmdReview } from './commands/review.js';
import { cmdVersion } from './commands/version.js';

const HELP = `crucible — multi-agent code review orchestrator

Usage: crucible <command> [options]

Commands:
  review [path]    Review a directory, file, or diff
  init             Initialize a .crucible.json config file
  agents           List available agents
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
