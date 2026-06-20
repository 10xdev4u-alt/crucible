/** A small histogram utility for severity distribution. */
export class Histogram {
  private readonly counts = new Map<string, number>();

  add(key: string, n = 1): void {
    this.counts.set(key, (this.counts.get(key) ?? 0) + n);
  }

  get(key: string): number {
    return this.counts.get(key) ?? 0;
  }

  keys(): string[] {
    return [...this.counts.keys()];
  }

  values(): number[] {
    return [...this.counts.values()];
  }

  entries(): Array<[string, number]> {
    return [...this.counts.entries()];
  }

  total(): number {
    let s = 0;
    for (const v of this.counts.values()) s += v;
    return s;
  }

  /** Render as a horizontal bar chart for the terminal. */
  render(options: { max?: number; width?: number; sort?: (a: [string, number], b: [string, number]) => number } = {}): string {
    const width = options.width ?? 30;
    const max = options.max ?? Math.max(1, ...this.counts.values());
    const entries = [...this.counts.entries()];
    if (options.sort) entries.sort(options.sort);
    const lines: string[] = [];
    for (const [k, v] of entries) {
      const barLen = Math.max(0, Math.round((v / max) * width));
      const bar = '█'.repeat(barLen) + '░'.repeat(width - barLen);
      lines.push(`${k.padEnd(12)} ${bar} ${v}`);
    }
    return lines.join('\n');
  }

  clear(): void {
    this.counts.clear();
  }
}
