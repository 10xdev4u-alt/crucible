import type { Finding } from '../types/finding.js';
import type { ReviewResult } from '../types/review-result.js';
import type { Formatter } from './text.js';

const SEVERITY_COLORS: Record<Finding['severity'], string> = {
  blocker: '#7c1d3f',
  critical: '#b91c1c',
  major: '#b45309',
  minor: '#0369a1',
  info: '#525252',
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** HTML formatter — produces a self-contained styled report. */
export class HtmlFormatter implements Formatter {
  format(result: ReviewResult): string {
    const counts = countBySeverity(result.findings);
    const findings = result.findings
      .map((f) => {
        const color = SEVERITY_COLORS[f.severity];
        const loc = f.location
          ? f.location.endLine
            ? `${escapeHtml(f.location.file)}:${f.location.line}-${f.location.endLine}`
            : `${escapeHtml(f.location.file)}:${f.location.line ?? '?'}`
          : 'no location';
        const rule = f.ruleId ? escapeHtml(f.ruleId) : '—';
        return `<article class="finding">
<header>
<span class="severity" style="background:${color}">${escapeHtml(f.severity.toUpperCase())}</span>
<h2>${escapeHtml(f.title)}</h2>
</header>
<dl>
<dt>Category</dt><dd>${escapeHtml(f.category)}</dd>
<dt>Agent</dt><dd><code>${escapeHtml(f.agentId)}</code></dd>
<dt>Location</dt><dd><code>${loc}</code></dd>
<dt>Rule</dt><dd><code>${rule}</code></dd>
<dt>Confidence</dt><dd>${(f.confidence * 100).toFixed(0)}%</dd>
</dl>
<p>${escapeHtml(f.message).replace(/\n/g, '<br>')}</p>
${f.fix?.diff ? `<pre class="diff"><code>${escapeHtml(f.fix.diff)}</code></pre>` : ''}
</article>`;
      })
      .join('\n');

    const summary = Object.entries(counts)
      .map(
        ([sev, n]) =>
          `<span class="badge" style="background:${SEVERITY_COLORS[sev as Finding['severity']]}">${escapeHtml(sev)}: ${n}</span>`,
      )
      .join(' ');

    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Crucible Review — ${escapeHtml(result.id)}</title>
<style>
  :root { color-scheme: light dark; }
  body { font: 14px/1.5 -apple-system, system-ui, sans-serif; max-width: 920px; margin: 2rem auto; padding: 0 1rem; }
  h1 { margin: 0 0 0.5rem; }
  .meta { color: #666; font-size: 0.9em; margin-bottom: 1.5rem; }
  .summary { display: flex; gap: 0.5rem; flex-wrap: wrap; margin: 1rem 0 2rem; }
  .badge { color: #fff; padding: 4px 10px; border-radius: 12px; font-size: 0.85em; }
  .finding { border: 1px solid #e5e5e5; border-radius: 6px; padding: 1rem; margin-bottom: 1rem; }
  .finding header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem; }
  .severity { color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 0.75em; font-weight: 600; }
  .finding h2 { margin: 0; font-size: 1.1em; }
  dl { display: grid; grid-template-columns: max-content 1fr; gap: 0.25rem 1rem; margin: 0.5rem 0; font-size: 0.9em; }
  dt { color: #666; }
  code { font: 0.9em ui-monospace, monospace; background: #f4f4f4; padding: 0.1em 0.3em; border-radius: 3px; }
  pre.diff { background: #f8f8f8; padding: 0.75rem; border-radius: 4px; overflow-x: auto; }
</style>
</head>
<body>
<h1>Crucible Review</h1>
<p class="meta">${escapeHtml(result.id)} — ${result.durationMs}ms — score ${result.consensusScore.toFixed(2)} — ${result.findings.length} findings</p>
<div class="summary">${summary}</div>
${findings}
</body>
</html>`;
  }
}

function countBySeverity(findings: readonly Finding[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const f of findings) out[f.severity] = (out[f.severity] ?? 0) + 1;
  return out;
}
