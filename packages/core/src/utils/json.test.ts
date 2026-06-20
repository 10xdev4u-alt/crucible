import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { readJson, tryReadJson } from './json.js';

describe('readJson', () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'crucible-json-'));
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('returns fallback when file does not exist', () => {
    expect(readJson(join(dir, 'missing.json'), { foo: 1 })).toEqual({ foo: 1 });
  });

  it('returns parsed value when file exists', () => {
    const f = join(dir, 'a.json');
    writeFileSync(f, '{"foo": 2}', 'utf8');
    expect(readJson(f, { foo: 0 })).toEqual({ foo: 2 });
  });

  it('returns fallback on parse error', () => {
    const f = join(dir, 'b.json');
    writeFileSync(f, 'not json', 'utf8');
    expect(readJson(f, { foo: 0 })).toEqual({ foo: 0 });
  });

  it('tryReadJson returns undefined on missing or invalid', () => {
    expect(tryReadJson(join(dir, 'missing.json'))).toBeUndefined();
    const f = join(dir, 'c.json');
    writeFileSync(f, 'not json', 'utf8');
    expect(tryReadJson(f)).toBeUndefined();
  });

  it('tryReadJson returns parsed value when valid', () => {
    const f = join(dir, 'd.json');
    writeFileSync(f, '{"x": 1, "y": [1,2,3]}', 'utf8');
    expect(tryReadJson(f)).toEqual({ x: 1, y: [1, 2, 3] });
  });
});
