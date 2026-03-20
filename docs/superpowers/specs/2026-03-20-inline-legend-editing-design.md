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

function extractLegendParamKeys(
  rawLegendConfig: LegendConfig | null,
): ReadonlyMap<number, ItemParamMapping>
```

Logic: iterate `rawLegendConfig.items`, check if `value` or `label` is a string matching `@@#params.<key>` pattern, extract the key. Returns a map from item index to its param keys.

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
  - If this is the last row and orphan params exist, they appear below a separator labeled "Additional"
- Changes apply immediately via `onChange` (no save/cancel)
- Popover closes on click outside or Escape

**GradientLegend (single popover for entire bar):**
- The gradient bar + labels area gains the hover highlight
- Clicking anywhere opens a single `Popover` containing:
  - A vertical list of all color stops, each with a color swatch + color picker + label input
  - Orphan params (e.g., `color_mid`, numeric stop values) appear below a separator labeled "Additional", rendered using `ParamControl`
- Changes apply immediately via `onChange`

When `paramMapping` is not provided, components behave exactly as today — read-only, no hover effects, no popovers.

### LegendCard Changes

New props shape:

```typescript
type LegendCardProps = {
  readonly legendConfig: LegendConfig | null
  readonly rawLegendConfig: LegendConfig | null
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

`PlaygroundLayout` holds the parsed raw JSON before resolution. It extracts `rawLegendConfig` from the raw JSON's `legend_config` field and passes it through `ParamsPanel` → `LegendCard`.

No changes to the resolution pipeline — this is an additional read-only value threaded alongside the existing resolved config.

### Export ColorPickerControl

`ColorPickerControl` in `param-control.tsx` is currently not exported. It needs to be exported so legend components can use it inline within popovers. Alternatively, legend components can use the raw HTML5 `<input type="color">` directly (simpler, fewer cross-file dependencies). The implementation should prefer whichever keeps the legend components lighter.

### Popover UX

- **Trigger:** Click anywhere on row (basic/choropleth) or gradient area
- **Affordance:** Subtle hover highlight (`bg-muted/50`), `cursor-pointer`
- **Content:** Color picker + text input for the item's params; orphan params via `ParamControl` below a separator
- **Behavior:** Opens on click, closes on click outside or Escape. Changes apply immediately.
- **Accessibility:** Rows focusable with `tabIndex={0}`, Enter/Space triggers popover

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
| `src/components/playground/playground-layout.tsx` | Extract and pass `rawLegendConfig` from raw JSON |
| `tests/lib/legend-param-mapping.test.ts` | **New** — Tests for extraction utility |

## Out of Scope

- Changes to the JSON editor or resolution pipeline
- Changes to the map renderer
- New control types
- Schema changes to `LegendItem` or example JSON files
- Responsive/mobile layout
