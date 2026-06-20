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

  private walk(dir: string, target: Map<string, FileState>): void {
    let entries: import('node:fs').Dirent[];
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const p = join(dir, entry.name);
      if (this.ignore && this.ignore(p)) continue;
      if (entry.isDirectory()) this.walk(p, target);
      else if (entry.isFile()) this.record(p, target);
    }
  }

  private record(p: string, target: Map<string, FileState>): void {
    try {
      const st = statSync(p);
      target.set(p, { mtimeMs: st.mtimeMs, size: st.size });
    } catch {
      target.delete(p);
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
    const fresh = new Map<string, FileState>();
    this.walk(this.root, fresh);
    const previous = new Map(this.state);
    for (const [p, s] of fresh) {
      const old = previous.get(p);
      if (!old) {
        this.emit({ kind: 'add', path: p, timestamp: Date.now() });
      } else if (old.mtimeMs !== s.mtimeMs || old.size !== s.size) {
        this.emit({ kind: 'change', path: p, timestamp: Date.now() });
      }
    }
    for (const p of previous.keys()) {
      if (!fresh.has(p)) {
        this.emit({ kind: 'remove', path: p, timestamp: Date.now() });
      }
    }
    this.state = fresh;
  }

  private emit(event: WatchEvent): void {
    for (const h of this.handlers) h(event);
  }
}
