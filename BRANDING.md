# Crucible — Branding

Visual and verbal identity for Crucible.

## Name

"Crucible" — a container in which metals are melted at very high temperatures. The metaphor: code refined by fire, multiple specialized reviewers in one process.

Pronunciation: `/ˈkruː.sɪ.bəl/` (KROO-si-bul).

## Tagline

> **Multi-agent code review orchestrator. Code refined by fire.**

## Voice

- **Direct** — Say what you mean, no fluff.
- **Confident** — We know what we're building.
- **Precise** — Show, don't tell. Numbers, examples, links.
- **Friendly** — We're a tool, not a sermon.

## Logo

The logo is a stylized anvil + flame, in two colors:

- **Primary**: Ember orange `#c2410c`
- **Secondary**: Burnt sienna `#7c2d12`
- **Background**: White (light) or `#0f1115` (dark)

See [docs/LOGO.md](docs/LOGO.md) for the full visual guide and SVG assets.

## Wordmark

Lowercase only. `crucible` (not `Crucible`). The logo mark precedes the wordmark.

```
⚒ crucible
```

## Color palette

| Name | Hex | Use |
|---|---|---|
| Ember | `#c2410c` | Primary brand, links, accents |
| Sienna | `#7c2d12` | Gradients, dark mode accent |
| Gold | `#fbbf24` | Highlights, ratings |
| Ink | `#111827` | Primary text (light mode) |
| Paper | `#ffffff` | Background (light mode) |
| Charcoal | `#0f1115` | Background (dark mode) |
| Ash | `#6b7280` | Muted text |

## Typography

- **Headings & body**: Inter (sans-serif)
- **Code**: JetBrains Mono (monospace)
- **Sizes**: 16px base, 1.6-1.7 line height

## Tone examples

| ✅ Do | ❌ Don't |
|---|---|
| "Crucible runs 5 specialized agents in parallel." | "Our amazing AI-powered code review tool will revolutionize your workflow!" |
| "12 commits, all CI green." | "Yay we did it!!! 🎉🎉🎉" |
| "Add a custom agent in 20 lines." | "It's super easy to add an agent, just write a few lines of code!" |
| "Cost: ~$0.24 per review with Sonnet." | "Affordable pricing for teams of all sizes!" |

## Comparisons

When comparing to other tools, lead with technical specifics:

> "Crucible runs N agents in parallel and uses a consensus scorer to rank findings. Copilot Code Review uses a single LLM pass."

Not:

> "Crucible is the best code review tool, way better than Copilot."

## Emoji

We use these sparingly:
- ⚒ anvil (in the logo)
- 🔥 fire (in the tagline)
- ✅ ❌ for examples

We don't use:
- 🎉 party emoji (too casual)
- ❤️ hearts (inappropriate for tech docs)

## Documentation style

- **Be specific.** Instead of "fast", say "10 agents in 155ms with 4-way parallelism".
- **Show code.** Every API example should have runnable code.
- **Link to source.** When documenting a function, link to its source on GitHub.
- **Use real numbers.** Benchmarks > vague claims.
- **Be honest.** If something is missing or rough, say so.
