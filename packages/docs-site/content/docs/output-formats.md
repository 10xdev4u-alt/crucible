---
title: Output formats
description: text, JSON, SARIF, Markdown, HTML, JUnit
order: 6
category: Documentation
---

# Output formats

Crucible produces structured review reports in six formats. Choose the one that fits your pipeline.

## `text`

Default. Human-readable terminal output with ANSI colors.

```text
Crucible Review
  result:    r1
  request:   r-1781980430112
  duration:  3.4s
  score:     12.50
  findings:  5

Findings
  CRITICAL   SQL injection
              category: security
              location: src/db.ts:42
              rule:     no-string-concat
              Use parameterized queries.

  MAJOR      N+1 query
              category: performance
              location: src/api/list.ts:28
              Use a JOIN or IN clause.
```

Disable colors for non-TTY output with `NO_COLOR=1` or `--no-color`.

## `json`

Machine-readable. The full `ReviewResult` object as JSON.

```json
{
  "id": "r1",
  "requestId": "r-1781980430112",
  "findings": [
    {
      "id": "f1",
      "agentId": "security",
      "category": "security",
      "severity": "critical",
      "title": "SQL injection",
      "message": "...",
      "location": { "file": "src/db.ts", "line": 42 },
      "ruleId": "no-string-concat",
      "confidence": 0.95,
      "createdAt": "2026-06-20T..."
    }
  ],
  "consensusScore": 12.5,
  "durationMs": 3400,
  "agentStats": [...],
  "errors": []
}
```

Use for piping:

```bash
crucible review --format json | jq '.findings[] | select(.severity == "critical")'
```

## `sarif`

[SARIF 2.1.0](https://docs.oasis-open.org/sarif/sarif/v2.1.0/) for GitHub code scanning.

```json
{
  "version": "2.1.0",
  "runs": [
    {
      "tool": { "driver": { "name": "crucible", ... } },
      "results": [
        {
          "ruleId": "no-string-concat",
          "level": "error",
          "message": { "text": "SQL injection..." },
          "locations": [
            { "physicalLocation": { "artifactLocation": { "uri": "src/db.ts" }, "region": { "startLine": 42 } } }
          ]
        }
      ]
    }
  ]
}
```

Upload to GitHub code scanning:

```yaml
- name: Upload SARIF
  if: always()
  uses: github/codeql-action/upload-sarif@v3
  with:
    sarif_file: crucible.sarif
```

## `markdown`

GitHub-flavored markdown report.

```markdown
# Crucible Review

- **Result ID:** `r1`
- **Request ID:** `r-1781980430112`
- **Duration:** 3400ms
- **Consensus score:** 12.50
- **Findings:** 5

## Findings

### CRITICAL — SQL injection { #finding-f1 }

> Use parameterized queries.

- **Category:** security
- **Agent:** `security`
- **Location:** `src/db.ts:42`
- **Rule:** `no-string-concat`
- **Confidence:** 95%
```

Perfect for posting on PRs.

## `html`

A self-contained styled HTML report. Renders well in any browser, no external dependencies.

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Crucible Review — r1</title>
  <style>...</style>
</head>
<body>
  <h1>Crucible Review</h1>
  <div class="summary">...</div>
  <article class="finding">...</article>
</body>
</html>
```

Open in a browser or upload as a CI artifact.

## `junit`

JUnit XML for CI test reporting. Critical and blocker findings become `<failure>` elements.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="crucible" tests="5" failures="1">
  <testsuite name="r1" tests="5" failures="1">
    <testcase classname="src/db.ts" name="critical: SQL injection">
      <failure type="critical" message="SQL injection">
        Use parameterized queries.
      </failure>
    </testcase>
  </testsuite>
</testsuites>
```

Use with Jenkins, GitLab CI, CircleCI, or any tool that consumes JUnit XML.

## Choosing a format

| Pipeline | Recommended format |
|---|---|
| Local dev | `text` |
| CI status check | `text` + non-zero exit on critical |
| GitHub PR comment | `markdown` (via `check` command) |
| Code scanning | `sarif` |
| Test reporting | `junit` |
| Slack/Discord bot | `json` (format yourself) |
| Documentation site | `html` |
| Piping to `jq` | `json` |
