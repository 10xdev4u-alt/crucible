/** A simple heap-based priority queue. */
export class PriorityQueue<T> {
  private readonly cmp: (a: T, b: T) => number;
  private readonly heap: T[] = [];

  constructor(cmp: (a: T, b: T) => number) {
    this.cmp = cmp;
  }

  size(): number {
    return this.heap.length;
  }

  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  peek(): T | undefined {
    return this.heap[0];
  }

  push(item: T): void {
    this.heap.push(item);
    this.bubbleUp(this.heap.length - 1);
  }

  pop(): T | undefined {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0];
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.sinkDown(0);
    }
    return top;
  }

  private bubbleUp(idx: number): void {
    while (idx > 0) {
      const parent = (idx - 1) >> 1;
      if (this.cmp(this.heap[idx]!, this.heap[parent]!) >= 0) break;
      this.swap(idx, parent);
      idx = parent;
    }
  }

  private sinkDown(idx: number): void {
    const n = this.heap.length;
    while (true) {
      const l = 2 * idx + 1;
      const r = 2 * idx + 2;
      let smallest = idx;
      if (l < n && this.cmp(this.heap[l]!, this.heap[smallest]!) < 0) smallest = l;
      if (r < n && this.cmp(this.heap[r]!, this.heap[smallest]!) < 0) smallest = r;
      if (smallest === idx) break;
      this.swap(idx, smallest);
      idx = smallest;
    }
  }

  private swap(i: number, j: number): void {
    const t = this.heap[i]!;
    this.heap[i] = this.heap[j]!;
    this.heap[j] = t;
  }
}
