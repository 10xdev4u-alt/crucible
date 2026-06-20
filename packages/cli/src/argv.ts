/** A simple argv parser. Returns parsed args, positional args, and a list of unknown flags. */
export interface ParsedArgs {
  positionals: string[];
  flags: Record<string, string | boolean | string[]>;
  unknown: string[];
}

const SHORT_TO_LONG: Record<string, string> = {
  h: 'help',
  v: 'verbose',
  f: 'format',
  o: 'output',
  c: 'config',
  d: 'diff',
  q: 'quiet',
};

/** Parse argv. Supports --key value, --key=value, --flag (boolean), and -abc short flags. */
export function parseArgs(argv: readonly string[]): ParsedArgs {
  const out: ParsedArgs = { positionals: [], flags: {}, unknown: [] };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg.startsWith('--')) {
      const eq = arg.indexOf('=');
      if (eq !== -1) {
        const key = arg.slice(2, eq);
        const value = arg.slice(eq + 1);
        out.flags[key] = value;
        continue;
      }
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('-')) {
        out.flags[key] = next;
        i += 1;
      } else {
        out.flags[key] = true;
      }
      continue;
    }
    if (arg.startsWith('-') && arg.length > 1) {
      const body = arg.slice(1);
      if (body.length === 1) {
        const long = SHORT_TO_LONG[body] ?? body;
        const next = argv[i + 1];
        if (next !== undefined && !next.startsWith('-')) {
          out.flags[long] = next;
          i += 1;
        } else {
          out.flags[long] = true;
        }
      } else {
        for (const ch of body) {
          const long = SHORT_TO_LONG[ch] ?? ch;
          out.flags[long] = true;
        }
      }
      continue;
    }
    out.positionals.push(arg);
  }
  return out;
}

/** Get a string value from flags with a default. */
export function getString(flags: ParsedArgs['flags'], key: string, fallback = ''): string {
  const v = flags[key];
  return typeof v === 'string' ? v : fallback;
}

/** Get a boolean value from flags. */
export function getBoolean(flags: ParsedArgs['flags'], key: string): boolean {
  return flags[key] === true || flags[key] === 'true';
}

/** Get a list value from flags. */
export function getList(flags: ParsedArgs['flags'], key: string): string[] {
  const v = flags[key];
  if (v === undefined) return [];
  if (Array.isArray(v)) return v;
  if (typeof v === 'string') return v.split(',').map((s) => s.trim());
  return [];
}
