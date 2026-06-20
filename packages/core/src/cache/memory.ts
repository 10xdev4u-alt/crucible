/** A simple in-memory cache with TTL. */
export class MemoryCache<T = unknown> {
  private store = new Map<string, { value: T; expiresAt: number }>();
  private readonly ttlMs: number;
  private readonly maxSize: number;
  private hits = 0;
  private misses = 0;

  constructor(options: { ttlMs?: number; maxSize?: number } = {}) {
    this.ttlMs = options.ttlMs ?? 60_000;
    this.maxSize = options.maxSize ?? 1000;
  }

  /** Get a value by key. Returns undefined if missing or expired. */
  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses += 1;
      return undefined;
    }
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.misses += 1;
      return undefined;
    }
    this.hits += 1;
    return entry.value;
  }

  /** Set a value with the default TTL. */
  set(key: string, value: T, ttlMs?: number): void {
    if (this.store.size >= this.maxSize && !this.store.has(key)) {
      const first = this.store.keys().next().value;
      if (first !== undefined) this.store.delete(first);
    }
    this.store.set(key, { value, expiresAt: Date.now() + (ttlMs ?? this.ttlMs) });
  }

  /** Delete a key. Returns true if it existed. */
  delete(key: string): boolean {
    return this.store.delete(key);
  }

  /** Returns true if the key exists and is not expired. */
  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  /** Clear all entries. */
  clear(): void {
    this.store.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /** Returns the current number of entries. */
  size(): number {
    return this.store.size;
  }

  /** Returns cache hit/miss statistics. */
  stats(): { hits: number; misses: number; size: number; hitRate: number } {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.store.size,
      hitRate: total === 0 ? 0 : this.hits / total,
    };
  }
}
