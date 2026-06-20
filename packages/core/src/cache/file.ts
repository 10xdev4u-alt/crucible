import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { MemoryCache } from './memory.js';

/** A file-based cache that stores entries as JSON files. */
export class FileCache<T = unknown> {
  private readonly dir: string;
  private readonly memory: MemoryCache<T>;
  private readonly ttlMs: number;

  constructor(options: { dir: string; ttlMs?: number; maxMemory?: number }) {
    this.dir = options.dir;
    this.ttlMs = options.ttlMs ?? 60_000;
    this.memory = new MemoryCache<T>({ ttlMs: options.ttlMs, maxSize: options.maxMemory ?? 500 });
    if (!existsSync(this.dir)) {
      mkdirSync(this.dir, { recursive: true });
    }
  }

  get(key: string): T | undefined {
    const cached = this.memory.get(key);
    if (cached !== undefined) return cached;
    const file = this.pathFor(key);
    if (!existsSync(file)) return undefined;
    try {
      const raw = readFileSync(file, 'utf8');
      const parsed = JSON.parse(raw) as { expiresAt: number; value: T };
      if (Date.now() > parsed.expiresAt) {
        try {
          unlinkSync(file);
        } catch {
          /* ignore */
        }
        return undefined;
      }
      this.memory.set(key, parsed.value);
      return parsed.value;
    } catch {
      return undefined;
    }
  }

  set(key: string, value: T, ttlMs?: number): void {
    const expiresAt = Date.now() + (ttlMs ?? this.ttlMs);
    const file = this.pathFor(key);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, JSON.stringify({ expiresAt, value }), 'utf8');
    this.memory.set(key, value, ttlMs);
  }

  delete(key: string): boolean {
    this.memory.delete(key);
    const file = this.pathFor(key);
    if (existsSync(file)) {
      unlinkSync(file);
      return true;
    }
    return false;
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  clear(): void {
    this.memory.clear();
    if (!existsSync(this.dir)) return;
    for (const f of readdirSync(this.dir, { recursive: true, withFileTypes: true })) {
      if (f.isFile()) {
        try {
          unlinkSync(join(f.parentPath ?? f.path, f.name));
        } catch {
          /* ignore */
        }
      }
    }
  }

  size(): number {
    if (!existsSync(this.dir)) return 0;
    let n = 0;
    for (const f of readdirSync(this.dir, { recursive: true, withFileTypes: true })) {
      if (f.isFile()) n += 1;
    }
    return n;
  }

  private pathFor(key: string): string {
    const safe = key.replace(/[^a-zA-Z0-9_-]/g, '_');
    return join(this.dir, `${safe}.json`);
  }
}
