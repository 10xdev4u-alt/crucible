---
title: Output formats
description: All the ways Crucible can format your review
order: 25
category: Documentation
---

# Output formats

Crucible produces review results in many formats. Choose the one that fits your workflow.

## Format comparison

| Format | Best for | Human-readable | Machine-readable | CI integration |
|---|---|---|---|---|
| `text` | Terminal output, manual review | ✅ | ❌ | Manual |
| `json` | Piping, scripting | ❌ | ✅ | Custom |
| `sarif` | GitHub code scanning, code scanning tools | ❌ | ✅ | GitHub |
| `markdown` | PR comments, documentation | ✅ | ✅ | GitHub PR |
| `html` | Browser viewing, archiving | ✅ | ✅ | Artifact |
| `junit` | CI test reports | ❌ | ✅ | Jenkins, GitLab |
| `csv` | Spreadsheets, data analysis | ❌ | ✅ | Custom |
| `gitlab` | GitLab Code Quality | ❌ | ✅ | GitLab |

## Choosing a format

**For local development:**
```bash
crucible review                          # text (default)
crucible review --format json | jq .    # parse with jq
```

**For CI:**
```bash
crucible review --format sarif --output crucible.sarif
crucible review --format junit --output junit.xml
crucible review --format gitlab --output codequality.json
```

**For PR comments:**
```bash
crucible check --summary crucible-summary.md
# Then use crucible-github or the github CLI to post it
```

**For spreadsheets / analysis:**
```bash
crucible review --format csv --output findings.csv
```

**For browsers / archives:**
```bash
crucible review --format html --output review.html
```

## Format details

### text

Default. ANSI colors when stdout is a TTY, plain text otherwise. Sections:
- Header with summary metrics
- Per-finding details (severity, category, location, rule, confidence)
- Optional verbose mode with per-agent stats

Disable colors: `NO_COLOR=1` or `--no-color` (planned).

### json

Full `ReviewResult` as JSON. Pipe to `jq` for filtering:

```bash
crucible review --format json | jq '[.findings[] | select(.severity == "critical")]'
```

### sarif

[SARIF 2.1.0](https://docs.oasis-open.org/sarif/sarif/v2.1.0/) for GitHub code scanning and other static analysis tools.

Upload to GitHub:
```yaml
- uses: github/codeql-action/upload-sarif@v3
  with:
    sarif_file: crucible.sarif
```

### markdown

GitHub-flavored markdown. Use for PR comments or documentation.

```bash
crucible check --summary review.md
# Or directly:
crucible review --format markdown --output review.md
```

### html

Self-contained HTML report. Renders well in any browser, no external deps (besides fonts).

```bash
crucible review --format html --output review.html
```

### junit

JUnit XML. Critical and blocker findings become `<failure>` elements.

```bash
crucible review --format junit --output junit.xml
```

### csv

Spreadsheet-friendly. One row per finding.

```bash
crucible review --format csv --output findings.csv
```

Columns: `id,agent,category,severity,title,message,file,line,rule,confidence,createdAt`.

### gitlab

GitLab Code Quality report format. JSON array of issues.

```bash
crucible review --format gitlab --output codequality.json
```

GitLab auto-detects this file in CI.

## Custom formatters

Implement the `Formatter` interface:

```ts
import type { Formatter, ReviewResult } from "@crucible/core";

class MyFormatter implements Formatter {
  format(result: ReviewResult): string {
    return `Found ${result.findings.length} issues`;
  }
}
```

Then register it:

```ts
import { getFormatter } from "@crucible/core";
// ... or use it directly:
const out = new MyFormatter().format(result);
```

## See also

- [Reference → Output formats](/docs/output-formats)
- [Library API → Formatters](/docs/api/#formatters)
