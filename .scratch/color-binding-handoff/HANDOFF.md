# Color-binding handoff

**Status:** ready-for-human
**Date:** 2026-05-21
**Branch:** `feat/color-binding-validator` (19 commits, off `v2`)
**Spec/plan/status:** `.claude/.tmp/vizz-team-20260521-color-binding/` (do NOT clean up until follow-ups below are addressed or moved here)

---

## What shipped this session

Bidirectional binding contract between layer color params and legend, enforced via a pure validator + AI server-side retry + playground UX + CI pre-flight + minimal schema additions.

### Schema (commit `c5ece7b`)

- `ParamConfig` gained optional `source?: string`. Absent = global/shared. Binds a param to a specific source.
- Function registry extended: `registerFunction(name, fn, meta?: { colorArgPaths?: string[] })`. Stored alongside the function; retrieved via `getFunctionMeta(name)`.
- `buildColormap` declares `colorArgPaths: ['stops[*][1]']`.

### Validator core (commits `9c2a299`, `7068b50`, `792896d`)

- New pure module at `src/lib/validator/` exporting `validate(snapshot, registry): readonly Diagnostic[]`.
- 10 diagnostic codes: `COLOR_LITERAL_IN_PAINT`, `COLOR_LITERAL_IN_LEGEND`, `LEGEND_LAYER_MISMATCH`, `MISSING_LEGEND_CONFIG`, `MISSING_OPACITY_PARAM`, `MISSING_VISIBILITY_PARAM`, `OPACITY_NOT_WIRED`, `VISIBILITY_NOT_WIRED`, `DEAD_PARAM`, `GHOST_REF`.
- Closed MapLibre paint-prop scope (9 props): `fill-color`, `fill-outline-color`, `circle-color`, `circle-stroke-color`, `line-color`, `heatmap-color`, `text-color`, `text-halo-color`, `icon-color`.
- Walks function `colorArgPaths` for layer-side color collection (`[*]` wildcard + `[N]` index supported).
- Opacity/visibility ref detection walks **inside** `interpolate` / `step` / `case` expressions (no false `OPACITY_NOT_WIRED` for zoom-crossfade patterns).
- Set-equality rule with two exemptions: `match` default slot (last index) and `case` else branch.
- Multi-source key-collision compromise: single-source = exact `opacity` / `visibility`; multi-source = `<sourceId>_opacity` / `<sourceId>_visibility` with `source` field. Documented in `src/lib/validator/README.md`.

### AI gate (commits `cb6a200`, `1475906`, `6e2ff6c`)

- AI route at `src/routes/api/ai-generate.ts` calls `validateAndRetry()` (pure helper at `src/lib/ai/validate-and-retry.ts`) on the post-processed envelope.
- Retry budget = exactly 1. On second failure, response payload carries `validation_failed: true` + `diagnostics: Diagnostic[]`.
- System prompt strengthened: literal colors forbidden in paint color slots; mandatory per-source `opacity` + `visibility` params; explicit `legend_config` with set-equality.

### Playground UX (commit `97d5269`)

- Validation banner pinned at the bottom of the map area (`src/containers/playground/validation-banner.tsx`). Collapsible. Click-to-jump-to-Monaco-line.
- Monaco squiggle markers per diagnostic (`src/containers/playground/monaco-markers.ts`).
- Two scaffold action buttons:
  - **"Extract literal colors → params"** — `extractLiteralColors()` in `scaffold-actions.ts`.
  - **"Scaffold legend from layer"** — `scaffoldLegendFromLayer()` in `scaffold-actions.ts`.
- Sentinel magenta render (`#ff00ff`) in `src/lib/legend-color.ts` for unresolved color refs.

### Legend card (commits `623bea4`, `ea818fa`)

- Per-source `<SourceControls />` renders an opacity slider at the top of each layer card (`src/components/legends/source-controls.tsx`).
- Visibility lives on the existing `LayerCard` header switch (single source of truth for visibility; the body switch from the initial implementation was removed to avoid divergent multi-style semantics).

### Example migration (commits `9532dd7`, `7bf4d3b`, `59871e9`, `1fdafd2`, `443bf28`, then `a65f570`, `c5c3059`, `b32eaf5`)

- All 11 shipping examples emit zero error-severity diagnostics under the final validator.
- Examples 06, 07, 12 restored to pre-migration visual semantics (zoom-crossfade preserved, raster colormap legend reinstated).

### CI pre-flight (commit `5c6125e`)

- `tests/lib/validator/example-validation.test.ts` walks every `src/examples/*.ts` and asserts zero error-severity diagnostics. Fails CI on regression. 11 named test cases.

### Verified

- `pnpm test` — 60 files, 604 tests, all green.
- `pnpm typecheck` — clean (exit 0).
- `pnpm lint` — clean (exit 0).

---

## Open bug — AI consistently emits broken `match` shape

### Symptom (P.AMO's report)

After asking the AI to change colors on a choropleth example (snapshot below), legend swatches did not update the map.

### Diagnosis

The AI emitted a snapshot where the `legend_config` items reference `@@#params.<key>_color` refs and the matching `params_config` entries are declared, but the paint `match` expression outputs are **hardcoded hex literals** — the params are never wired into the layer paint.

```jsonc
// AI-produced snapshot (broken)
"fill-color": [
  "match", ["get", "income_grp"],
  "1. High income: OECD",     "#FCFFA4",   // ← should be "@@#params.high_oecd_color"
  "2. High income: nonOECD",  "#FCA50A",   // ← should be "@@#params.high_non_oecd_color"
  "3. Upper middle income",   "#DD513A",   // ← should be "@@#params.upper_middle_color"
  "4. Lower middle income",   "#8B1C62",   // ← should be "@@#params.lower_middle_color"
  "5. Low income",            "#2D0B59",   // ← should be "@@#params.low_income_color"
  "#ffffff"                                 // ← fallback, also literal
],
```

Editing a legend swatch flips `params.values[<key>]` → legend re-renders → map paint reads the unchanged literal → user sees nothing change on the map.

### Validator behavior

The validator catches this perfectly: **11 errors** — 6× `COLOR_LITERAL_IN_PAINT` + 5× `LEGEND_LAYER_MISMATCH (direction: legend-only)`. Re-confirm next session by piping the snapshot through `validate(snap, { getFunctionMeta })`.

The AI route's 1-retry budget did not save this generation: gpt-5.2 emitted the same broken shape on the second pass. Response was returned with `validation_failed: true` and the banner should appear at the bottom of the map.

### Open question: is the banner actually rendering for this user?

P.AMO did not confirm whether the banner appears for this snapshot. Two possibilities:

- **A.** Banner renders, P.AMO didn't notice it. The 11-error count should be visible at the bottom of the map. **First action next session: ask P.AMO to confirm whether the banner is visible for this snapshot.**
- **B.** Banner does not render — bug in Row 6 wiring between the route's `validation_failed` payload and the playground's `useConverter` validator call. The playground may be calling `validate()` on its parsed snapshot independently of the route response, in which case the banner should still appear (the snapshot itself has 11 errors regardless of how it arrived). If it doesn't, trace `useConverter` → `validate()` → banner render path.

---

## Follow-up 1 — Strengthen AI prompt for `match` outputs

### Why

gpt-5.2 parameterized only the legend (likely because the few-shot examples emphasize legend parameterization) and left the `match` outputs as literals. The system-prompt rule "literal colors are forbidden in every paint color position" is present but not modeled in the few-shot.

### Action

- Add a few-shot example in `src/lib/ai/few-shot.ts` that explicitly models a `match` expression with `@@#params.X_color` refs at every output slot AND a matching `legend_config` AND a `parameterize` declaration covering both. The current few-shot pulls from examples 1, 4, 6, 11, 12 — example 03 (choropleth-match) is the canonical case for `match` and is NOT in the current few-shot rotation. Adding 03 (or a synthetic version of it) is the natural fix.
- Verify few-shot derivation logic in `src/lib/ai/few-shot.ts` produces both the legend parameterize entries AND the paint-output parameterize entries when run against example 03.

### Estimated scope

1 file (`few-shot.ts`), no schema changes, ~20-40 lines. Sonnet refactorer. After the change, ask the AI to regenerate P.AMO's choropleth and confirm the paint outputs come back as `@@#params.X` refs.

---

## Follow-up 2 — New scaffold action: "Wire layer to existing legend params"

### Why

The existing two scaffold actions don't reconcile the case where:

- Legend has param refs (`@@#params.high_oecd_color`, ...).
- Paint expression has literal outputs in the same ordinal positions.
- The user wants to wire the existing legend params into the existing paint slots (not create new `auto_color_N` keys).

### Action

Add a third scaffold action — proposed label: "Wire layer to legend params (by ordinal)" — that:

1. Walks each source's paint color expressions.
2. For each color-output slot (in the closed paint-prop list, identified by expression type — `match` outputs at odd indices ≥ 3 + last index, `step` outputs at odd indices ≥ 2, etc.), enumerates the slots in order.
3. Walks the source's `legend_config.items[].value` for `@@#params.X_color` refs and enumerates them in order.
4. If the counts match: replaces each literal at the paint output slot with the corresponding legend param ref. Also moves the literal's value into the matching `params_config` entry's `default` so the visual result is identical pre/post-action.
5. If the counts differ: emits a warning ("Cannot auto-wire — N paint outputs but M legend params; please align manually") and does not mutate.

Surface this button in the validation banner when `LEGEND_LAYER_MISMATCH (direction: legend-only)` AND `COLOR_LITERAL_IN_PAINT` diagnostics are both present.

### Estimated scope

1 file (`src/containers/playground/scaffold-actions.ts`), plus tests at `tests/containers/playground/scaffold-actions.test.ts`. ~80-120 lines. Sonnet implementer.

### Risk

Ordinal matching can be wrong when legend ordering doesn't align with paint expression ordering. Mitigation: warn-only when counts mismatch; require explicit user click; show a preview/diff before applying.

---

## Follow-up 3 — Row 8 nits logged for follow-up

From the final review (verdict: `CHANGES-REQUESTED`, both blockers closed by `6e2ff6c` + `ea818fa`):

1. `src/routes/api/ai-generate.ts` constant `MAX_VALIDATION_RETRIES = 2` is named misleadingly — it is the SCHEMA-retry attempt count (actual: 2 retries on JSON/schema/style + 1 separate color-binding retry via helper). Rename to `MAX_SCHEMA_ATTEMPTS = 3` and add a one-line comment distinguishing it from the color-binding retry.
2. Validator `src/lib/validator/index.ts:32-48` wraps each check in `try { ... } catch { /* skip */ }`. A logic bug inside a check is silently absorbed instead of surfaced. Consider re-throwing in dev mode (gated by `import.meta.env.DEV`) or logging the swallowed error.
3. `tests/lib/validator/example-validation.test.ts` passes example 10 trivially because the `ComponentExample` shape has no `config.sources`. Add an inline comment explaining why this is expected (so a future maintainer doesn't conclude the test is wrong).
4. `src/containers/playground/scaffold-actions.ts:416` hardcodes `fnObj['stops']` instead of walking the function's declared `colorArgPaths`. This means the "Extract literal colors" scaffold will silently fail for any color-producing function other than `buildColormap`. Generalize when the second such function ships.
5. `src/containers/ai/layers/layer-card.tsx` `hasAnyContent()` has a stale comment referencing the now-removed body visibility switch (per Row 8b reviewer note). One-line comment update.

---

## Files to read on next session

- This handoff (`.scratch/color-binding-handoff/HANDOFF.md`).
- Spec: `.claude/.tmp/vizz-team-20260521-color-binding/spec.md`.
- Plan: `.claude/.tmp/vizz-team-20260521-color-binding/plan.md`.
- Status log: `.claude/.tmp/vizz-team-20260521-color-binding/status.md`.
- AI route: `src/routes/api/ai-generate.ts`.
- AI prompt + few-shot: `src/lib/ai/system-prompt.ts`, `src/lib/ai/few-shot.ts`.
- Validator: `src/lib/validator/` (especially `checks/color-binding.ts` and the README).
- Scaffold actions: `src/containers/playground/scaffold-actions.ts`.

## Branch status

Do NOT merge to `main` until at least Follow-up 1 is addressed. The AI consistently emits invalid snapshots for `match`-based choropleth examples, which means a user asking the AI to change colors on these will hit the broken shape immediately. Follow-up 2 is nice-to-have but Follow-up 1 (few-shot strengthening) is the blocker for a positive user experience.

A working branch state can be confirmed with:

```bash
git checkout feat/color-binding-validator
pnpm install
pnpm typecheck
pnpm lint
pnpm test
```

All three commands should be green.

## Open question to ask P.AMO next session

1. Did the validation banner appear at the bottom of the map for the broken choropleth snapshot? (Determines whether Row 6 banner wiring is OK or whether it needs a separate debug pass.)
2. Approve Follow-up 1 + Follow-up 2 in order, or different priorities?
