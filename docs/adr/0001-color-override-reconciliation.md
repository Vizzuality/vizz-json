# Color overrides persist chat-wide; AI reply overrides only on default diff

> Status: **Superseded by [ADR-0003](./0003-per-message-param-values.md)** (2026-05-11). Chat-scoped persistence failed the history-navigation requirement; param values are now per-message. The reconciliation rule itself is preserved in ADR-0003.

`Chat.activeParamValues` is chat-scoped, so a user's color edit survives AI replies by default. When a new assistant message arrives, we run `reconcileParamValues(prevSnapshot, nextSnapshot, currentValues)`: for each key with `control_type === 'color_picker'`, we compare the prior message's default to the new message's default. Differ → AI explicitly changed intent → user's value is overwritten with the new default. Match → user's edit is preserved. Non-color keys are never reset on reply. The helper is called only from the AI-reply success path so manual history-click navigation never disturbs user edits.

## Considered Options

- **Always sticky (status quo before this change).** User's prior color always wins. Rejected — "make it red" should be able to win against a stale yellow edit.
- **Always reset.** Every AI reply re-seeds `activeParamValues` from new defaults. Rejected — destroys user's edits on unrelated prompts ("add hover state" should not reset colors).
- **Per-message overrides store.** New `Chat.colorOverrides: Record<messageId, …>`. Rejected — extra storage shape, garbage-collection on delete, migration cost; gains little over chat-scoped persistence.
- **Snapshot-fork on submit.** Fork `activeParamValues` into the active message's snapshot, then reseed. Rejected — state lives in two places; drift risk on next regen.

## Consequences

- Detection key is `control_type === 'color_picker'` only — not legend-binding. Non-legend color params (stroke, background) get the same treatment.
- The reconciler is a pure function under `src/lib/ai/` and is unit-tested independently of React effect timing.
- The existing reseed effect at `ai-page.tsx:114` is downgraded to "seed missing keys / drop removed keys" for history-click navigation; smart reconciliation only fires on AI-reply success.
- If the AI ships an unchanged default but the user expected it to "change colors back," the rule will surprise them. Mitigation: include the reset behaviour in any user-facing reset/clear affordance.
