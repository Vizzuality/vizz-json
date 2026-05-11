# Message snapshots are user-mutable for literal gradient stops

`Message.schemaSnapshot` is normally an immutable record of what the AI returned — clicking a prior message restores that state verbatim. We're carving out one exception: when the gradient editor in the AI surface applies edits to stops that have no `colorParamKey` / `thresholdParamKey`, the new stops are serialised back into `Message.schemaSnapshot` via `db.messages.update(messageId, { schemaSnapshot })`. Parameterised stops continue to flow through `onChange` → `setParamValues` and never touch the snapshot. We accept this trade-off because the "always-editable colors" UX requirement outweighs the "message = AI truth" invariant for the narrow case of literal-color gradients (which the style validator now actively discourages).

## Considered Options

- **Forbid literal-stop edits in AI.** Editor opens but Apply is disabled with a note when any stop is literal. Rejected — violates "always editable" feature requirement.
- **Auto-parameterise on first edit.** Convert literal stops to new `@@#params.X` refs + appended `params_config` entries. Rejected — collides with the colour-override reconciliation rule, which keys on prior-vs-new defaults; ad-hoc param injection muddies that comparison.
- **Defer gradient editor in AI to a later phase.** Rejected — feature ask was explicit about gradient coverage.

## Consequences

- A message's `schemaSnapshot` is no longer guaranteed to equal the AI's original output. Any future debugging / replay / export feature that assumes "snapshot = AI truth" must read with that caveat in mind.
- The new style-validator rule (ADR-implicit: `legend_config.items[].value` must never be a literal colour) keeps literal-stop edits exceptional. If AI consistently parameterises, the snapshot-write path is almost never exercised.
- Snapshot writes happen at gradient-editor Apply time only — no live-typing mutations.
