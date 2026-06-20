/** Generate shell completion scripts for bash, zsh, and fish. */
import { writeFileSync } from 'node:fs';

const COMMANDS = [
  'review',
  'check',
  'dry-run',
  'fix',
  'trace',
  'init',
  'agents',
  'status',
  'cache',
  'hook',
  'schema',
  'diff',
  'version',
  'help',
];

const FLAGS = [
  '--format',
  '--output',
  '--agents',
  '--severity',
  '--category',
  '--exclude',
  '--include',
  '--verbose',
  '-v',
  '--quiet',
  '-q',
  '--help',
  '-h',
  '--mock',
  '--diff',
  '--config',
  '--root',
  '--which',
  '--out',
  '--no-git',
  '--dry-run',
  '--only',
  '--only-category',
  '--input',
  '--pr',
  '--owner',
  '--repo',
  '--token',
  '--summary',
  '--flame',
  '--list',
  '--sort',
];

export function generateBashCompletion(): string {
  return `# Crucible bash completion
_crucible() {
  local cur prev commands
  COMPREPLY=()
  cur="\${COMP_WORDS[COMP_CWORD]}"
  prev="\${COMP_WORDS[COMP_CWORD-1]}"

  commands="${COMMANDS.join(' ')}"

  if [ $COMP_CWORD -eq 1 ]; then
    COMPREPLY=( $(compgen -W "\${commands}" -- "\${cur}") )
    return 0
  fi

  if [[ "\${cur}" == -* ]]; then
    COMPREPLY=( $(compgen -W "${FLAGS.join(' ')}" -- "\${cur}") )
    return 0
  fi

  case "\${prev}" in
    --format)
      COMPREPLY=( $(compgen -W "text json sarif markdown html junit" -- \${cur}) )
      return 0
      ;;
    --severity)
      COMPREPLY=( $(compgen -W "info minor major critical blocker" -- \${cur}) )
      return 0
      ;;
  esac

  COMPREPLY=()
}
complete -F _crucible crucible
`;
}

export function generateZshCompletion(): string {
  return `#compdef crucible
_crucible() {
  local -a commands
  commands=(
    ${COMMANDS.map((c) => `'${c}:${c} command'`).join('\n    ')}
  )

  _arguments -C \\
    '1: :->cmd' \\
    '*:: :->args' \\
    '--format[Output format]:format:(text json sarif markdown html junit)' \\
    '--output[Output file]:file:_files' \\
    '--agents[Agents to run]:agents:' \\
    '--severity[Severity filter]:severity:(info minor major critical blocker)' \\
    '--category[Category filter]:category:' \\
    '--mock[Use mock provider]' \\
    '--verbose[Verbose output]' \\
    '--quiet[Suppress output]' \\
    '--help[Show help]'

  case $state in
    cmd)
      _describe 'command' commands
      ;;
  esac
}

_crucible "$@"
`;
}

export function generateFishCompletion(): string {
  return `# Crucible fish completion
${COMMANDS.map((c) => `complete -c crucible -n "__fish_use_subcommand" -a "${c}" -d "${c} command"`).join('\n')}

${FLAGS.map((f) => `complete -c crucible -l "${f.replace(/^--/, '')}"`).join('\n')}
`;
}

export function cmdCompletion(
  positionals: string[],
  flags: Record<string, string | boolean | string[]>,
): number {
  const shell = positionals[0] ?? 'bash';
  let script: string;
  switch (shell) {
    case 'bash':
      script = generateBashCompletion();
      break;
    case 'zsh':
      script = generateZshCompletion();
      break;
    case 'fish':
      script = generateFishCompletion();
      break;
    default:
      console.error(`Unknown shell: ${shell}. Use bash, zsh, or fish.`);
      return 2;
  }
  const out =
    (flags.out as string | undefined) ?? (shell === 'zsh' ? '_crucible' : `crucible.${shell}`);
  writeFileSync(out, script, 'utf8');
  console.log(`Wrote ${out}`);
  console.log(`\nTo enable, source it in your shell config:`);
  if (shell === 'bash') console.log(`  source ${out}`);
  if (shell === 'zsh') console.log(`  # Add to your fpath:  fpath=($(dirname ${out}) $fpath)`);
  return 0;
}
