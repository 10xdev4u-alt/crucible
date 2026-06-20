import { describe, expect, it } from 'vitest';
import { parseDiff } from './diff.js';

const SAMPLE = `diff --git a/src/a.ts b/src/a.ts
index 111..222 100644
--- a/src/a.ts
+++ b/src/a.ts
@@ -1,3 +1,4 @@
 line1
-old line
+new line
+added line
 line3
diff --git a/src/b.ts b/src/b.ts
new file mode 100644
index 000..333
--- /dev/null
+++ b/src/b.ts
@@ -0,0 +1,2 @@
+hello
+world
diff --git a/src/old.ts b/src/renamed.ts
similarity index 90%
rename from src/old.ts
rename to src/renamed.ts
index 444..555 100644
--- a/src/old.ts
+++ b/src/renamed.ts
@@ -1 +1 @@
-old content
+new content
`;

describe('parseDiff', () => {
  it('parses a multi-file diff', () => {
    const r = parseDiff(SAMPLE, 'a', 'b');
    expect(r.files).toHaveLength(3);
    expect(r.files[0]?.path).toBe('src/a.ts');
    expect(r.files[0]?.kind).toBe('modified');
    expect(r.files[0]?.additions).toBe(2);
    expect(r.files[0]?.deletions).toBe(1);
    expect(r.files[1]?.kind).toBe('added');
    expect(r.files[2]?.kind).toBe('renamed');
  });

  it('returns empty ChangeSet for empty input', () => {
    const r = parseDiff('', 'a', 'b');
    expect(r.files).toEqual([]);
  });

  it('parses hunk header numbers', () => {
    const r = parseDiff(SAMPLE, 'a', 'b');
    const hunk = r.files[0]?.hunks[0];
    expect(hunk?.oldStart).toBe(1);
    expect(hunk?.newStart).toBe(1);
  });

  it('marks hunks with add/remove/context lines', () => {
    const r = parseDiff(SAMPLE, 'a', 'b');
    const lines = r.files[0]?.hunks[0]?.lines ?? [];
    expect(lines.some((l) => l.kind === 'add')).toBe(true);
    expect(lines.some((l) => l.kind === 'remove')).toBe(true);
    expect(lines.some((l) => l.kind === 'context')).toBe(true);
  });
});
