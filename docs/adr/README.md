# Architecture Decision Records

ADRs for this repo. One file per decision, numbered sequentially.

## Filename convention

`NNNN-<kebab-case-title>.md` — e.g. `0001-two-stage-resolution-pipeline.md`.

## Template

```markdown
# ADR-NNNN: <Title>

- Status: proposed | accepted | superseded by ADR-XXXX | deprecated
- Date: YYYY-MM-DD

## Context

What forces are at play? What problem are we solving?

## Decision

What did we decide? Stated plainly.

## Consequences

What changes because of this decision — good, bad, neutral.
```

ADRs are created lazily by `/grill-with-docs` when decisions crystallise during discussion. Don't backfill speculatively.
