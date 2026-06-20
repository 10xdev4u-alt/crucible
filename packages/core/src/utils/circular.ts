/** A simple circular buffer for time-series style data. */
export class CircularBuffer<T> {
  private readonly buffer: (T | undefined)[];
  private head = 0;
  private size = 0;

  constructor(public readonly capacity: number) {
    if (capacity < 1) throw new Error('capacity must be >= 1');
    this.buffer = new Array(capacity);
  }

  push(item: T): void {
    this.buffer[this.head] = item;
    this.head = (this.head + 1) % this.capacity;
    if (this.size < this.capacity) this.size += 1;
  }

  /** Get items in insertion order, oldest first. */
  toArray(): T[] {
    const out: T[] = [];
    const start = this.size < this.capacity ? 0 : this.head;
    for (let i = 0; i < this.size; i++) {
      const v = this.buffer[(start + i) % this.capacity];
      if (v !== undefined) out.push(v);
    }
    return out;
  }

  /** Returns the most recent item, or undefined if empty. */
  last(): T | undefined {
    if (this.size === 0) return undefined;
    const idx = (this.head - 1 + this.capacity) % this.capacity;
    return this.buffer[idx];
  }

  clear(): void {
    this.head = 0;
    this.size = 0;
    this.buffer.fill(undefined);
  }

  get length(): number {
    return this.size;
  }
}
