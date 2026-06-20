/** A simple logger that respects log levels. */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

export interface LogOptions {
  level?: LogLevel;
  prefix?: string;
  destination?: (line: string) => void;
  timestamps?: boolean;
}

const LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
};

export class Logger {
  private level: LogLevel;
  private prefix: string;
  private destination: (line: string) => void;
  private timestamps: boolean;

  constructor(options: LogOptions = {}) {
    this.level = options.level ?? 'info';
    this.prefix = options.prefix ?? '';
    this.destination = options.destination ?? ((line) => process.stderr.write(`${line}\n`));
    this.timestamps = options.timestamps ?? true;
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  child(prefix: string): Logger {
    return new Logger({
      level: this.level,
      prefix: this.prefix ? `${this.prefix}:${prefix}` : prefix,
      destination: this.destination,
      timestamps: this.timestamps,
    });
  }

  debug(message: string, ...args: unknown[]): void {
    if (LEVELS[this.level] <= LEVELS.debug) this.write('debug', message, args);
  }

  info(message: string, ...args: unknown[]): void {
    if (LEVELS[this.level] <= LEVELS.info) this.write('info', message, args);
  }

  warn(message: string, ...args: unknown[]): void {
    if (LEVELS[this.level] <= LEVELS.warn) this.write('warn', message, args);
  }

  error(message: string, ...args: unknown[]): void {
    if (LEVELS[this.level] <= LEVELS.error) this.write('error', message, args);
  }

  private write(level: LogLevel, message: string, args: unknown[]): void {
    const parts: string[] = [];
    if (this.timestamps) parts.push(new Date().toISOString());
    if (level !== 'info') parts.push(`[${level.toUpperCase()}]`);
    if (this.prefix) parts.push(`[${this.prefix}]`);
    parts.push(message);
    if (args.length > 0) {
      parts.push(args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' '));
    }
    this.destination(parts.join(' '));
  }
}

/** A no-op logger for tests. */
export class NoopLogger extends Logger {
  constructor() {
    super({
      level: 'silent',
      destination: () => {},
    });
  }
}
