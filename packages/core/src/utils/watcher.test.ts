import { mkdtempSync, rmSync, writeFileSync, utimesSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FileWatcher } from './watcher.js';

describe('FileWatcher', () => {
  let dir: string;
  let watcher: FileWatcher;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'crucible-watcher-'));
  });

  afterEach(() => {
    watcher?.stop();
    rmSync(dir, { recursive: true, force: true });
  });

  it('emits add events for new files', async () => {
    const events: string[] = [];
    watcher = new FileWatcher(dir, { intervalMs: 50 });
    watcher.on((e) => events.push(`${e.kind}:${e.path}`));
    watcher.start();
    const f = join(dir, 'a.txt');
    writeFileSync(f, 'hello');
    await new Promise((r) => setTimeout(r, 100));
    expect(events.some((e) => e.startsWith('add:'))).toBe(true);
  });

  it('emits change events when a file is modified', async () => {
    const f = join(dir, 'a.txt');
    writeFileSync(f, 'hello');
    const events: string[] = [];
    watcher = new FileWatcher(dir, { intervalMs: 50 });
    watcher.on((e) => events.push(`${e.kind}:${e.path}`));
    watcher.start();
    await new Promise((r) => setTimeout(r, 100));
    writeFileSync(f, 'hello world');
    utimesSync(f, new Date(), new Date(Date.now() + 1000));
    await new Promise((r) => setTimeout(r, 150));
    expect(events.some((e) => e.startsWith('change:'))).toBe(true);
  });

  it('respects ignore filter', async () => {
    const events: string[] = [];
    watcher = new FileWatcher(dir, { intervalMs: 50, ignore: (p) => p.endsWith('.ignore') });
    watcher.on((e) => events.push(`${e.kind}:${e.path}`));
    watcher.start();
    writeFileSync(join(dir, 'a.ignore'), 'x');
    writeFileSync(join(dir, 'b.txt'), 'y');
    await new Promise((r) => setTimeout(r, 100));
    expect(events.some((e) => e.includes('a.ignore'))).toBe(false);
    expect(events.some((e) => e.includes('b.txt'))).toBe(true);
  });
});
