# Always-editable legend colors, persisted per chat

Status: ready-for-agent

## Problem Statement

A user editing a Config through the AI page can only change a colour by finding the matching `color_picker` param in the params panel — and for legends with many stops (gradient, choropleth), the panel fills up with a long list of duplicate colour controls that mirror what the legend already shows. The legend swatches themselves are only editable when AI happened to parameterise the colour; if AI emits a literal colour in `legend_config.items[].value`, the swatch is read-only. Worse, the gradient editor never opens in the AI surface today because `currentJson` and `onApply` are not wired through, so gradient stops are unreachable. Users want the legend to be the canonical colour-editing surface, with edits persisted per chat id.

## Solution

The legend becomes the canonical UI for editing colour params in the AI page. Param panels no longer duplicate colour controls for keys that are already shown as swatches in the legend. The AI is required to parameterise every legend colour (via style validator), guaranteeing every legend swatch is editable. Gradient editor is wired through in the AI surface; parameterised stops flow through the existing `onChange` → `setParamValues` path (free chat-scoped persistence), and literal stops write back into the message's snapshot. Colour edits persist across messages within a chat by default, but a new AI reply that explicitly changes a colour default wins over the user's prior edit.

## User Stories

1. As an AI-page user, I want every colour swatch in the legend to be editable so I never wonder whether a particular legend cell is interactive.
2. As an AI-page user, I want the params panel to stop listing the same colour controls I can already see in the legend, so the panel stays focused on non-colour knobs.
3. As an AI-page user, I want my colour edits to persist when I switch between messages within the same chat, so I don't lose tweaks every time I navigate history.
4. As an AI-page user, I want my colour edits to survive an AI reply that talks about something unrelated, so "add a hover state" doesn't reset my carefully chosen palette.
5. As an AI-page user, I want a prompt like "make the highest band red" to actually change my legend, so the AI's explicit colour intent wins over my prior edit.
6. As an AI-page user, I want gradient stop colours editable from the legend gradient editor, just like basic and choropleth legends, so the legend is uniformly interactive across types.
7. As an AI-page user, I want gradient threshold positions editable too, since the editor already supports threshold params via the same mechanism.
8. As an AI-page user, I want my edits scoped to the active chat, so opening a different chat shows that chat's palette, not the previous one.
9. As an AI-page user, I want clicking a historical assistant message to restore that message's state without my colour edits silently mutating, so message history remains a trustworthy navigation surface.
10. As an AI-page user, I want literal-colour gradient edits to persist on the message I edited from, so re-opening the legend on that message shows my changes.
11. As an AI-page user generating a fresh chat, I want AI's emitted defaults to render as-is without any leftover state interfering.
12. As an AI-page user, I want non-colour params (sliders, switches, opacity) to keep their existing behaviour — sticky across replies — since I've been relying on that.
13. As a developer reading the codebase later, I want the colour-reset rule expressed as a pure, testable helper so the behaviour can't drift without test failures.
14. As a developer reviewing AI output, I want the style validator to reject legends with literal colours so the "always editable" guarantee is enforceable at the boundary.
15. As a developer maintaining the legend components, I want the orphan-filter rule to live in a single place (the param panel / legend card boundary) so adding new legend types doesn't require touching the filter rule.
16. As a developer extending colour editing later (e.g. picker UI swap, opacity-aware swatches), I want the param-write seam to remain the single source of truth for parameterised colours.

## Implementation Decisions

- **Colour params stay alive in JSON.** Every legend-bound colour remains a `@@#params.<key>` reference in both `legend_config.items[].value` and the renderable Config tree. The legend swatch is the UI; the param key is the data. (Q1 in the grilling session.)
- **Orphan-filter rule (legend duplication suppression).** A param is hidden from the LegendCard's orphan list whenever its key appears in `legendParamMapping.valueParamKey`. The rule applies symmetrically in playground and AI page because the component is shared — playground inherits the improvement free, but no playground-specific work is undertaken. (Q2, Q7.)
- **Gradient editor Apply router.** The gradient editor splits the Apply path per-stop. Stops with a `colorParamKey` / `thresholdParamKey` write through `onChange(paramKey, value)`, which lands in `Chat.activeParamValues` via `setParamValues`. Stops without those keys (literal colours / positions) keep going through the existing `serializeGradientToJson` JSON-rewrite path. (Q3.)
- **Colour override reconciliation rule.** `Chat.activeParamValues` is chat-scoped and survives AI replies by default. On a new assistant message, for each key with `control_type === 'color_picker'` in the new message's `params_config`, the prior message's default is compared to the new default. Differ → overwrite the user's value with the new default (AI changed intent). Match → preserve the user's edit. Non-colour keys never reset on reply. (Q4-mit, Q5. ADR-0001.)
- **Reconciler is a pure module.** `reconcileParamValues(prevSnapshot, nextSnapshot, currentValues): ResolvedParams` lives under `src/lib/ai/` and is the single seam for the rule. Called from the AI-session success path only — never from the existing reseed effect that handles history-click navigation. The existing effect is reduced to "seed missing keys / drop removed keys" for the case where the user clicks an old message. (Q6.)
- **Scope: AI page only.** Playground is not actively extended — it will be removed in a later phase. Any improvement playground inherits from shared components is incidental. (Q7.)
- **Snapshot mutation for literal gradient stops.** `Message.schemaSnapshot` is normally immutable, but the gradient editor's Apply path writes back to it via `db.messages.update(messageId, { schemaSnapshot })` when literal stops are edited. Parameterised stops never touch the snapshot. (Q8. ADR-0002.)
- **AI-side enforcement of "always editable".** The style validator gains a rule: `legend_config.items[].value` must be a `@@#params.<key>` reference, not a literal CSS colour. Failure triggers the existing retry machinery. This is the contract that makes the legend's "swatch ⇒ always editable" invariant hold. (Q9.)
- **AI page wiring.** `ai-page.tsx` passes `currentJson` (the stringified active snapshot) and `onApply` to `ParamsPanel`. `onApply` parses the rewritten JSON and writes the result to the active message's `schemaSnapshot` via `db.messages.update`. This is the seam that finally opens the gradient editor in the AI surface.
- **No storage migration.** No new IndexedDB fields. `Chat.activeParamValues` (`ResolvedParams`) and `Message.schemaSnapshot` (`AiSchema`) shapes are unchanged.

## Testing Decisions

Good tests here are tests of external behaviour: a pure function given inputs returns the expected output; a validator given a fixture accepts or rejects; a component given props renders the expected shape. None of the tests should reach into private internals or assert on React render counts.

- **`reconcileParamValues`** — table-driven unit tests under `tests/lib/ai/reconcile-param-values.test.ts`. Required cases:
  - Colour key with differing prior/next defaults → user value overwritten with new default.
  - Colour key with matching prior/next defaults → user edit preserved.
  - Non-colour key with user edit and any default delta → user edit preserved.
  - Key present in next snapshot but absent from current values → seeded with next default.
  - Key present in current values but absent from next snapshot → dropped from result.
  - First reply (no prior snapshot) → all keys seeded from new defaults; no comparisons run.
    Prior art: existing tests under `tests/lib/ai/` (e.g. `tests/lib/ai/persistence/chats.test.ts`).

- **Style validator rule** — extend `src/lib/ai/style-validator.ts` test suite. Add a failing fixture: a `legend_config` with a literal colour in `items[i].value`. Add a passing fixture: same legend with the colour as `@@#params.color_a`. Prior art: existing style-validator test file.

- **Legend orphan filter** — small component test on `LegendCard`. Render with a `paramMapping` that binds key `color_a` to item 0 and an `orphanLegendParams` array that _includes_ `color_a`. Assert: rendered orphan controls do not include `color_a`. Prior art: any existing playground container test (or first one under this path if none exists).

- **AI session reconcile integration** — skipped. Exercised by manual browser test against the AI page: edit a colour → re-prompt unrelated change → confirm colour persists. Re-prompt with explicit colour change → confirm AI default wins.

- **Gradient editor Apply router** — covered by existing serializer tests for the literal-stop path plus manual verification for the parameterised-stop path. No new unit test required.

## Out of Scope

- Any change to the playground's params/legend behaviour beyond what shared components inherit incidentally.
- Storage schema migration (no new IndexedDB fields).
- A user-facing "reset all colour edits" affordance (could be added later if requested; nothing in this PRD blocks it).
- Per-message colour override store (rejected in Q4 — `Chat.colorOverrides: Record<messageId, …>` would have given each message its own palette; chat-scoped persistence chosen instead).
- Auto-parameterising literal stops on first edit (rejected in Q8 — collides with the reconciliation rule).
- Tightening the AI prompt / few-shot to discourage colour params with non-`legend` group; the orphan-filter rule keys on binding, not on `group`.
- Updating presentation slides or guidelines pages to demonstrate the new behaviour.

## Further Notes

Two ADRs were written alongside this PRD:

- `docs/adr/0001-color-override-reconciliation.md` — records why `activeParamValues` is chat-scoped with selective colour-default-diff overwrite, and the alternatives considered.
- `docs/adr/0002-message-snapshot-mutability-for-gradient-stops.md` — records why literal gradient-stop edits are allowed to mutate `Message.schemaSnapshot`, and the alternatives considered.

The domain glossary in `CONTEXT.md` was updated with three new terms in a new "Color editing (AI surface)" section: _Legend as canonical color editor_, _Color override reconciliation_, _Snapshot mutation for literal gradient stops_. The terms should be used verbatim in code, comments, and PRs.

A natural slicing for the implementation issues:

1. Pure `reconcileParamValues` helper + tests.
2. Style-validator literal-colour rule + tests.
3. Orphan-filter in `LegendCard` + component test.
4. Gradient editor Apply router (parameterised vs literal split).
5. AI page wiring: pass `currentJson` + `onApply` to `ParamsPanel`; snapshot-write `onApply`.
6. Wire reconciler into the AI session success path.

Items 1 and 2 are independent and parallelisable. Items 3-6 touch overlapping seams in `ai-page.tsx` / `params-panel.tsx` / `legend-card.tsx` and should be sequenced.
