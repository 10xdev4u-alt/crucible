/** A simple file watcher that polls a directory for changes. */
import { existsSync, statSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export interface WatchEvent {
  kind: 'add' | 'change' | 'remove';
  path: string;
  timestamp: number;
}

export type WatchHandler = (event: WatchEvent) => void;

export interface WatcherOptions {
  intervalMs?: number;
  ignore?: (path: string) => boolean;
}

interface FileState {
  mtimeMs: number;
  size: number;
}

/** Polls a directory tree for file system changes. */
export class FileWatcher {
  private readonly root: string;
  private readonly intervalMs: number;
  private readonly ignore?: (path: string) => boolean;
  private state = new Map<string, FileState>();
  private timer: NodeJS.Timeout | null = null;
  private readonly handlers: WatchHandler[] = [];

  constructor(root: string, options: WatcherOptions = {}) {
    this.root = root;
    this.intervalMs = options.intervalMs ?? 1000;
    if (options.ignore) this.ignore = options.ignore;
  }

  /** Start watching. */
  start(): void {
    this.snapshot();
    this.timer = setInterval(() => this.poll(), this.intervalMs);
  }

  /** Stop watching. */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /** Subscribe to events. */
  on(handler: WatchHandler): () => void {
    this.handlers.push(handler);
    return () => {
      const idx = this.handlers.indexOf(handler);
      if (idx !== -1) this.handlers.splice(idx, 1);
    };
  }

  private snapshot(): void {
    if (!existsSync(this.root)) return;
    this.walk(this.root);
  }

  private walk(dir: string): void {
    let entries: import('node:fs').Dirent[];
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const p = join(dir, entry.name);
      if (this.ignore && this.ignore(p)) continue;
      if (entry.isDirectory()) this.walk(p);
      else if (entry.isFile()) this.record(p);
    }
  }

  private record(p: string): void {
    try {
      const st = statSync(p);
      this.state.set(p, { mtimeMs: st.mtimeMs, size: st.size });
    } catch {
      this.state.delete(p);
    }
  }

  private poll(): void {
    if (!existsSync(this.root)) {
      for (const p of this.state.keys()) {
        this.emit({ kind: 'remove', path: p, timestamp: Date.now() });
        this.state.delete(p);
      }
      return;
    }
    const seen = new Set<string>();
    this.walk(this.root);
    for (const [p, s] of this.state) seen.add(p);
    const previous = new Set(this.state.keys());
    for (const p of seen) {
      if (!previous.has(p)) {
        this.emit({ kind: 'add', path: p, timestamp: Date.now() });
      }
    }
    for (const p of previous) {
      if (!seen.has(p)) {
        this.emit({ kind: 'remove', path: p, timestamp: Date.now() });
        this.state.delete(p);
      }
    }
  }

  private emit(event: WatchEvent): void {
    for (const h of this.handlers) h(event);
  }
}
