# Contributing

This list has one job: be the clearest map of **next-state prediction** anywhere. Contributions that sharpen that map are very welcome.

## The one rule

**Every entry must say what the system treats as the next state.** That discipline is the entire point of the list — it's what turns a pile of links into a map. A PR that adds a paper without its next-state tag will be asked to add one.

## Adding a work

1. Add an object to [`docs/works.js`](docs/works.js) — that file is the single source of truth that powers both the website and the comparison table. Keep the fields:

   | field | meaning |
   |-------|---------|
   | `state` | **the next-state highlight** — what this system predicts as "the next state" (one phrase) |
   | `space` | `text` · `token` · `pixel` · `latent` · `abstract` |
   | `cond` | `obs` (observational) or `act` (action-conditioned / interventional) |
   | `unc` | `deterministic` · `softmax` · `gaussian` · `categorical` · `diffusion` · `energy` |
   | `obj` | `reconstruction` · `value-equivalent` · `contrastive` · `energy` · `likelihood` |
   | `x`, `y` | position on the landscape map: `x` 0 (raw pixels) → 1 (abstract); `y` 0 (observational) → 1 (action-conditioned) |
   | `ladder` | 0–5, the Next-State Ladder level |
   | `group` | `foundations` · `control` · `jepa` · `video` · `llm` · `survey` |

2. Add the matching entry to [`README.md`](README.md) in the right section, using the existing format:

   ```markdown
   - **[Name](url)** — Org, Year, Venue. One-line description of the idea.
     > 🟢 **Next state:** <what it predicts> · **Space:** `latent` · **Cond:** `interventional`
   ```

3. If it belongs in the [comparison table](README.md#comparison-table) and [timeline](README.md#timeline), add it there too.

## Quality bar

- **Primary sources.** Link the paper, project page, or official blog — not a news rehash.
- **Be accurate about the next state.** If you're not sure whether it's observational or interventional, ask in the PR. The single most common mistake is calling something action-conditioned when it only predicts observations.
- **One landmark per lineage gets a ⭐.** Don't inflate.
- **Keep prose tight.** One sharp sentence beats a paragraph.

## Other contributions

- Corrections to dates, venues, or links — always welcome, no ceremony.
- Better figures, a clearer framing, an open problem we missed — open an issue first to discuss.
- New *perspectives* (e.g. world models in neuroscience, RL theory, causality) — propose a section.

By contributing you agree to release your contribution under [CC0 1.0](LICENSE).
