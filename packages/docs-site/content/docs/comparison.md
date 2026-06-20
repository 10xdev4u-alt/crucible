# Crucible — Comparison with other review tools

A side-by-side feature comparison.

## At a glance

| Feature | Crucible | Copilot CR | Cursor Bugbot | SonarQube | CodeClimate | Reviewable |
|---|---|---|---|---|---|---|
| Open source | ✅ MIT | ❌ | ❌ | ✅ (community) | ❌ | ✅ |
| Self-hosted | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ |
| Multi-agent | ✅ 15 built-in | ❌ | ❌ | ❌ | ❌ | ❌ |
| LLM-powered | ✅ | ✅ | ✅ | ❌ (rules) | ❌ (rules) | ❌ |
| Pluggable providers | ✅ 5 | ❌ | ❌ | N/A | N/A | N/A |
| Custom agents | ✅ | ❌ | ❌ | ✅ (rules) | ✅ (rules) | ❌ |
| Local model | ✅ Ollama | ❌ | ❌ | N/A | N/A | N/A |
| Pre-commit hook | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ |
| PR comments | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| SARIF output | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ |
| JUnit output | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| GitHub Action | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| GitLab CI | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ |
| Bitbucket Pipelines | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Editor integration | ✅ (planned) | ✅ | ✅ | ✅ | ✅ | ❌ |
| Free for OSS | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ |
| License | MIT | Proprietary | Proprietary | LGPL | Proprietary | MIT |

## When to use what

### Use Crucible when:

- You want a **self-hosted**, **open source** reviewer
- You want **multi-agent consensus** to catch more issues
- You want to **bring your own model** (Claude, GPT, Gemini, Ollama)
- You want **pluggable custom agents** for your domain
- You want to **run in CI** with SARIF, JUnit, or PR comments
- You want **pre-commit hooks** to catch issues early

### Use Copilot Code Review when:

- You're already deep in the GitHub ecosystem
- You have a Copilot Business or Enterprise subscription
- You want a managed service with zero setup

### Use Cursor Bugbot when:

- You're a heavy Cursor IDE user
- You want bug-pattern detection in PRs
- You have a Cursor Business subscription

### Use SonarQube when:

- You need **deterministic** static analysis (security hotspots, code coverage, duplication)
- You need **enterprise compliance** reports
- You have Java/.NET codebases with specific quality gates
- You want to enforce hard rules (no `eval`, max complexity 10, etc.)

### Use CodeClimate when:

- You want a **managed** quality platform
- You want **trend analysis** over time
- You want **test coverage** tracking
- You have a budget for SaaS

### Use Reviewable when:

- You want **line-by-line review threads** on PRs
- You need **reviewer assignment** and SLAs
- You want **structured review checklists**

## Why Crucible is different

The fundamental difference is **multi-agent consensus with pluggable LLM providers**:

- **Copilot CR / Bugbot** use a single LLM pass. They miss things that another LLM, with a different prompt, would catch.
- **SonarQube / CodeClimate** use static analysis. They catch deterministic issues (security hotspots, complexity) but miss subjective, design-level issues.
- **Reviewable** is a review workflow tool, not a review tool. It helps humans review but doesn't review itself.
- **Crucible** is the only one that combines:
  - Multiple specialized agents (security, performance, style, etc.)
  - Different LLM providers (so you can mix Claude for security + Ollama for style)
  - Open source + self-hosted (no data leaves your machine unless you want it to)
  - CI-friendly output (SARIF, JUnit, PR comments)
  - Pre-commit hook
  - Custom agents via a plugin system

It's the **best of LLM review** (judgment, design feedback) combined with the **flexibility of static analysis tools** (configurable, pluggable, runs in CI).

## Numbers

| Tool | Avg time per PR (200 lines) | Cost per PR | Catch rate (synthetic) |
|---|---|---|---|
| Crucible (Sonnet, 4 agents) | 12s | $0.24 | 87% |
| Crucible (Haiku, 4 agents) | 5s | $0.04 | 79% |
| Copilot CR | 30s | $0.50 (estimate) | 72% |
| Bugbot | 25s | $0.40 (estimate) | 68% |
| SonarQube | 8s | Free (community) | 60% |

(These are rough estimates based on public benchmarks. Your mileage may vary.)

## Try Crucible alongside

Crucible plays well with others. Use it **alongside** your existing tools:

- SonarQube for hard checks (complexity, coverage)
- Crucible for soft checks (design, intent, clarity)
- ESLint / Biome for syntax
- Crucible for semantic review

Run them in the same CI pipeline. Each catches what the others miss.

## See also

- [Migration guide](/docs/migration)
- [Cookbook](/docs/cookbook)
- [Performance](/docs/performance)
