import type { Finding } from '../types/finding.js';

const FINDING_HEADER = /^(.+?)\s+\[(critical|major|minor|info|blocker)\]/i;
const FINDING_FILE = /\*\*File:\*\*\s+`?([^\s`:]+?)(?::(\d+))?`?\s*(?:\n|$)/i;
const FINDING_RULE = /\*\*Rule:\*\*\s+`?([a-z0-9-]+)`?/i;
const FINDING_BODY = /\*\*Message:\*\*\s+([\s\S]+?)(?=\n###|\n---|\n$)/i;

/** Parse findings from a structured LLM response. */
export function parseStructuredFindings(content: string, agentId: string): Finding[] {
  const out: Finding[] = [];
  // Normalize: ensure the first heading is preceded by a newline.
  const normalized = content.startsWith('###') ? `\n${content}` : content;
  const chunks = normalized.split(/\n###\s+/).slice(1);
  for (const chunk of chunks) {
    const headMatch = chunk.match(FINDING_HEADER);
    if (!headMatch) continue;
    const title = headMatch[1]?.trim() ?? 'Untitled';
    const severity = headMatch[2]?.toLowerCase() as Finding['severity'];
    const fileMatch = chunk.match(FINDING_FILE);
    const ruleMatch = chunk.match(FINDING_RULE);
    const bodyMatch = chunk.match(FINDING_BODY);
    const path = fileMatch?.[1]?.trim();
    const lineStr = fileMatch?.[2];
    const lineNum = lineStr ? Number.parseInt(lineStr, 10) : NaN;
    const line: number | null = Number.isFinite(lineNum) ? lineNum : null;
    const ruleId = ruleMatch?.[1];
    const message = bodyMatch?.[1]?.trim() ?? title;
    const finding: Finding = {
      id: `${agentId}-${out.length}-${Math.random().toString(36).slice(2, 8)}`,
      agentId,
      category: 'best-practice',
      severity,
      title,
      message,
      confidence: 0.8,
      createdAt: new Date().toISOString(),
    };
    if (ruleId) finding.ruleId = ruleId;
    if (path) {
      const location: { file: string; line?: number } = { file: path };
      if (line !== null) location.line = line;
      finding.location = location;
    }
    out.push(finding);
  }
  return out;
}
