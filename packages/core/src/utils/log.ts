/** A small in-memory log buffer for keeping recent log lines in memory. */
import { CircularBuffer } from './circular.js';

export interface LogLine {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: number;
  context?: Record<string, unknown>;
}

export class LogBuffer {
  private readonly buffer: CircularBuffer<LogLine>;
  private readonly listeners = new Set<(line: LogLine) => void>();

  constructor(capacity = 1000) {
    this.buffer = new CircularBuffer<LogLine>(capacity);
  }

  log(level: LogLine['level'], message: string, context?: Record<string, unknown>): LogLine {
    const line: LogLine = { level, message, timestamp: Date.now(), ...(context ? { context } : {}) };
    this.buffer.push(line);
    for (const l of this.listeners) l(line);
    return line;
  }

  debug(message: string, context?: Record<string, unknown>): LogLine {
    return this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, unknown>): LogLine {
    return this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>): LogLine {
    return this.log('warn', message, context);
  }

  error(message: string, context?: Record<string, unknown>): LogLine {
    return this.log('error', message, context);
  }

  recent(): LogLine[] {
    return this.buffer.toArray();
  }

  byLevel(level: LogLine['level']): LogLine[] {
    return this.recent().filter((l) => l.level === level);
  }

  subscribe(listener: (line: LogLine) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  clear(): void {
    this.buffer.clear();
  }
}
