import { describe, expect, it } from 'vitest';
import { parseStructuredFindings } from './parser.js';

describe('parseStructuredFindings', () => {
  it('parses a single finding', () => {
    const content = `### Missing null check [major]
**File:** src/a.ts:42
**Rule:** null-safety
**Message:** Function may dereference null.
`;
    const findings = parseStructuredFindings(content, 'agent');
    expect(findings).toHaveLength(1);
    expect(findings[0]?.severity).toBe('major');
    expect(findings[0]?.title).toBe('Missing null check');
    expect(findings[0]?.ruleId).toBe('null-safety');
    expect(findings[0]?.location?.file).toBe('src/a.ts');
    expect(findings[0]?.location?.line).toBe(42);
  });

  it('parses multiple findings', () => {
    const content = `### First [info]
**Message:** one

### Second [critical]
**File:** x.ts:1
**Message:** two
`;
    const findings = parseStructuredFindings(content, 'a');
    expect(findings).toHaveLength(2);
    expect(findings[0]?.severity).toBe('info');
    expect(findings[1]?.severity).toBe('critical');
  });

  it('returns empty for unparseable content', () => {
    expect(parseStructuredFindings('Just a paragraph', 'a')).toEqual([]);
  });

  it('handles missing message', () => {
    const content = `### Title [minor]\n`;
    const findings = parseStructuredFindings(content, 'a');
    expect(findings[0]?.message).toBe('Title');
  });
});
