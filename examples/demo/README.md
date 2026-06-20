# Crucible Demo

A small example project for Crucible — used to test the pipeline end-to-end.

The `src/example.ts` file contains several intentional issues for Crucible to find:

- Hardcoded API key (secrets agent)
- SQL injection (security agent)
- O(n²) duplicate detection (performance agent)
- Cryptic function names (naming agent)
- Missing error handling (error-handling agent)
- Magic numbers (style agent)

## Run it

```bash
cd examples/demo
git init
git add .
git commit -m "initial"
# Edit src/example.ts to add more issues
cd ../..
pnpm install
pnpm --filter @crucible/cli build
cd examples/demo
ANTHROPIC_API_KEY=sk-... node ../../packages/cli/dist/index.js review
```

## What you'll see

Crucible will report 6+ findings across multiple agents, with consensus scores showing which issues are most important.

The output formats include:
- `text` — human-readable with colors
- `json` — machine-readable
- `sarif` — for code scanning
- `markdown` — for PR comments
- `html` — for browsers
- `junit` — for CI test reports
- `csv` — for spreadsheets
- `gitlab` — for GitLab Code Quality

## Try different formats

```bash
# JSON
crucible review --format json --output result.json

# SARIF for GitHub code scanning
crucible review --format sarif --output crucible.sarif

# CSV for analysis
crucible review --format csv --output findings.csv
```

## Use the doctor command

```bash
crucible doctor
```

This checks your environment and suggests fixes.
