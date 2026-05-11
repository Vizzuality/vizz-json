# ADR-0003: Param values are per-message, not chat-scoped

- Status: accepted (supersedes ADR-0001)
- Date: 2026-05-11

## Context

ADR-0001 chose `Chat.activeParamValues` (chat-scoped) so a user's colour edit would survive AI replies by default, with a colour-default-diff rule to let the AI reclaim intent. In practice the chat-scoped model failed two expectations:

1. Clicking an older assistant message did not restore that message's state — the chat-level palette painted every message, so historical navigation felt destructive.
2. Users expected each AI reply to be a discrete "step" they could revisit, with the palette they had on that step.

The user explicitly asked: "save every new colour on each message step. And try to persist them between messages whenever we generate a new version."

The previous reseed effect on `chat.activeMessageId` change tried to bridge the gap, but it either reset edits (old form) or did nothing useful (reduced form), because the values themselves were single-scoped on the chat row.

## Decision

Param values are stored per-message on `Message.paramValues: ResolvedParams`. Each assistant message owns its palette. The chat row's `activeParamValues` field is retained as a read-only legacy fallback so existing chats migrate without data loss, but the application never writes to it again.

Concretely:

- `Message.paramValues?: ResolvedParams` — set when the message is first appended (seeded by the reconciler) and updated by `setMessageParamValues(messageId, values)` on every user edit.
- `runAiSession` reads `prevMessage.paramValues` (falling back to `chat.activeParamValues` for legacy chats, then `{}`), runs `reconcileParamValues(prevSnapshot, newSnapshot, carryForward)`, and stores the result on the new assistant message at append time. This is the only place the reconciler runs.
- `ai-page.tsx` derives the live `paramValues` from `activeMessage.paramValues ?? legacy-fallback ?? snapshot-defaults`. `handleParamChange` writes to `activeMessage`. The history-click reseed effect is removed — message rows already carry their own values.
- The colour-default-diff rule from ADR-0001 is preserved in `reconcileParamValues`. It still fires only on AI-reply success.

## Considered Options

- **Keep ADR-0001 (chat-scoped).** Rejected — failed the "history is trustworthy" requirement.
- **Per-message overrides map on Chat (`Chat.colorOverrides: Record<messageId, …>`).** Rejected for the same reasons ADR-0001 rejected it originally: extra GC step on message delete, harder to reason about than fields colocated with the message.
- **Mutate `Message.schemaSnapshot.params_config[i].default` on edit.** Rejected — collides with the reconciler's prev/next default comparison; the reconciler would mistake user edits for AI intent changes.

## Consequences

- Each message is now self-contained: snapshot + paramValues + (occasionally, via ADR-0002) snapshot mutations. History navigation is genuinely non-destructive.
- The reconciler's contract is unchanged. Existing tests cover its behaviour.
- `chat.activeParamValues` is dead-on-write but kept as a one-shot read fallback. A later cleanup PR can drop the field with a schema migration once enough sessions have written per-message values.
- Storage cost grows linearly with assistant-message count instead of being constant per chat. Acceptable: param maps are small and IndexedDB tolerates this scale; chat deletion still cascades to messages.
- ADR-0001 is superseded but retained as a historical record of the prior decision and its alternatives.
