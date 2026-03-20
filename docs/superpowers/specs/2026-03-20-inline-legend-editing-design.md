# Inline Legend Editing

## Goal

Integrate parameter editing directly into the legend visualization components. Instead of rendering a legend preview with a separate control list below, each legend item becomes interactive — clicking a row (basic/choropleth) or the gradient bar opens a popover with the relevant controls.

## Current State

- `LegendCard` renders a read-only legend preview, then a flat list of `ParamControl` items below it
- Legend components (`BasicLegend`, `ChoroplethLegend`, `GradientLegend`) are read-only: they receive `readonly LegendItem[]` and render swatches/labels
- The resolved `legendConfig` loses `@@#params.*` references, so legend items can't be paired with their source params
- `ColorPickerControl` in `param-control.tsx` is not exported

## Design

### Param Extraction Utility

A pure function that takes the raw (unresolved) legend config and extracts `@@#params.*` references per item:

```typescript
type ItemParamMapping = {
  readonly valueParamKey?: string
  readonly labelParamKey?: string
}

/** Raw legend config before @@#params resolution — items may contain param references as string values */
type RawLegendConfig = LegendConfig

function extractLegendParamKeys(
  rawLegendConfig: RawLegendConfig | null,
): ReadonlyMap<number, ItemParamMapping>
```

Logic: iterate `rawLegendConfig.items`, check if `value` or `label` is a string matching `@@#params.<key>` pattern, extract the key. Returns a map from item index to its param keys.

**Intentional simplification:** This only checks direct string references on the `value` and `label` fields of each `LegendItem`. The current `LegendItem` type constrains both fields to `string | number`, so nested/array patterns are not possible. If the type evolves to allow nested structures, this function would need to be updated.

A second helper computes orphan params — legend params not referenced by any item:

```typescript
function getOrphanLegendParams(
  legendParams: readonly InferredParam[],
  paramMapping: ReadonlyMap<number, ItemParamMapping>,
): readonly InferredParam[]
```

Filters `legendParams` to those whose `key` does not appear in any `ItemParamMapping`.

Both functions live in a new file: `src/lib/legend-param-mapping.ts`.

### Legend Component Changes

Each legend component gains optional editing props:

```typescript
type LegendEditProps = {
  readonly paramMapping?: ReadonlyMap<number, ItemParamMapping>
  readonly orphanParams?: readonly InferredParam[]
  readonly values?: Record<string, unknown>
  readonly onChange?: (key: string, value: unknown) => void
}
```

When `paramMapping` is provided, the component enters edit mode.

**BasicLegend & ChoroplethLegend (row-level popovers):**
- Each row gains a hover highlight (`bg-muted/50` transition, `cursor-pointer`)
- Rows are focusable (`tabIndex={0}`, Enter/Space opens popover)
- Clicking a row opens a `Popover` anchored to that row containing:
  - Color picker (HTML5 `<input type="color">`) for the `valueParamKey`, if present
  - Text input for the `labelParamKey`, if present
  - Orphan params do NOT appear inside row popovers (see below)
- Changes apply immediately via `onChange` (no save/cancel)
- Popover closes on click outside or Escape

**GradientLegend (single popover for entire bar):**
- The gradient bar + labels area gains the hover highlight
- Clicking anywhere opens a single `Popover` containing:
  - A vertical list of all color stops, each with a color swatch + color picker + label input
- Changes apply immediately via `onChange`
- Orphan params do NOT appear inside the gradient popover (see below)

**Orphan params (all legend types):**

Orphan params (legend-group params not referenced by any item, e.g., `default_color` in example 03, `color_mid` in example 04) render in a dedicated section **below the legend component** inside the `LegendCard` container — not inside any item's popover. This avoids confusing UX where unrelated controls appear inside a specific item's popover. Each orphan param renders using `ParamControl` with its label, separated from the legend by a thin divider.

This is a V1 simplification. In the gradient case, orphan params like `color_mid` are arguably integral to the gradient and could be promoted into the gradient popover in a future iteration.

When `paramMapping` is not provided, components behave exactly as today — read-only, no hover effects, no popovers.

### LegendCard Changes

New props shape:

```typescript
type LegendCardProps = {
  readonly legendConfig: LegendConfig | null
  readonly rawLegendConfig: RawLegendConfig | null
  readonly legendParams: readonly InferredParam[]
  readonly values: Record<string, unknown>
  readonly onChange: (key: string, value: unknown) => void
}
```

LegendCard:
1. Calls `extractLegendParamKeys(rawLegendConfig)` to get the mapping
2. Calls `getOrphanLegendParams(legendParams, paramMapping)` to get orphans
3. Passes `paramMapping`, `orphanParams`, `values`, `onChange` to the legend component
4. Removes the flat `ParamControl` list currently rendered below the preview

### Plumbing the Raw Config

`PlaygroundPage` (the route component at `src/routes/playground.tsx`) already parses the raw JSON in a `useMemo` that extracts `legend_config` for resolution. A similar `useMemo` extracts the raw `legend_config` **before** resolution and passes it as `rawLegendConfig` through `ParamsPanel` → `LegendCard`.

`PlaygroundLayout` is a pure layout shell (slots only) and does not change.

No changes to the resolution pipeline — this is an additional read-only value threaded alongside the existing resolved config.

### Color Picker Inside Popovers

Legend row popovers already live inside a `Popover`. The existing `ColorPickerControl` in `param-control.tsx` itself wraps a `Popover`, which would create nested popovers. Instead, legend popovers should use a raw HTML5 `<input type="color">` directly for color editing. This is simpler, avoids nested-popover complexity, and keeps the legend components lighter.

### Popover UX

- **Trigger:** Click anywhere on row (basic/choropleth) or gradient area
- **Affordance:** Subtle hover highlight (`bg-muted/50`), `cursor-pointer`
- **Content:** Inline `<input type="color">` + text input for the item's params (no nested popovers)
- **Behavior:** Opens on click, closes on click outside or Escape. Changes apply immediately.
- **Accessibility:** Rows focusable with `tabIndex={0}`, Enter/Space triggers popover. V1 relies on browser default tab order within popovers; arrow key navigation between rows is out of scope.
- **Popover width:** Matches the legend card width for visual consistency (`w-full` relative to trigger)

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Legend item has no param references (static) | Row renders without hover/click — stays read-only |
| Item has `valueParamKey` but no `labelParamKey` | Popover shows only color picker |
| Item has `labelParamKey` but no `valueParamKey` | Popover shows only text input |
| All items are static, but orphan params exist | Orphan params render in a small section below the legend |
| No `paramMapping` prop provided | Fully read-only (current behavior preserved) |
| `rawLegendConfig` is null | No param extraction, legend renders read-only |

## Files to Modify

| File | Change |
|------|--------|
| `src/lib/legend-param-mapping.ts` | **New** — `extractLegendParamKeys()` + `getOrphanLegendParams()` |
| `src/components/legends/basic-legend.tsx` | Add optional edit props, hover highlight, row popovers |
| `src/components/legends/choropleth-legend.tsx` | Add optional edit props, hover highlight, row popovers |
| `src/components/legends/gradient-legend.tsx` | Add optional edit props, hover highlight, single popover |
| `src/components/playground/legend-card.tsx` | Add `rawLegendConfig` prop, compute mapping, remove flat control list |
| `src/components/playground/params-panel.tsx` | Thread `rawLegendConfig` to `LegendCard` |
| `src/routes/playground.tsx` | Extract `rawLegendConfig` from raw JSON, pass through `ParamsPanel` |
| `tests/lib/legend-param-mapping.test.ts` | **New** — Tests for extraction utility |

## Out of Scope

- Changes to the JSON editor or resolution pipeline
- Changes to the map renderer
- New control types
- Schema changes to `LegendItem` or example JSON files
- Responsive/mobile layout
