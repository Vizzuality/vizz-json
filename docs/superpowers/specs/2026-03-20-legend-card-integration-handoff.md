# Handoff: Integrate Controls Inside Legend Visualization

## What Was Done

The params panel redesign is complete (8 commits on `main` starting from `873b6ee`):

- **Header row**: title + tier badge (traffic light colors) + visibility switch + opacity slider — working
- **Legend card**: renders legend preview above, param controls below — working but **needs rework**
- **Remaining params**: flat list below the card — working
- **Floating legend removed** from map renderer

All 24 tests passing. Dev server runs on `:3001` (`:3000` in use).

## What Needs to Change

**Current state:** `LegendCard` renders the legend preview (via `BasicLegend`/`ChoroplethLegend`/`GradientLegend`) as a block, then lists all `group: "legend"` param controls below it as a separate flat list. The controls and the legend are visually disconnected.

**Desired state:** Controls should be **integrated directly into the legend visualization** — each color swatch/stop in the legend should have its color picker inline, each break value should be editable next to its position in the legend, etc.

## Current Architecture

### Legend Card (`src/components/playground/legend-card.tsx`)
- Receives `legendConfig` (resolved with live param values), `legendParams` (inferred params with `group: "legend"`), `values`, `onChange`
- Currently dispatches to `BasicLegend`/`ChoroplethLegend`/`GradientLegend` for preview, then renders `ParamControl` for each legend param below
- The legend components are read-only visualizations (no editing capability)

### Legend Components (`src/components/legends/`)
- **BasicLegend**: vertical list of `[4x4 swatch] [label]` per item
- **ChoroplethLegend**: vertical list of `[6x4 swatch] [label]` per item
- **GradientLegend**: horizontal gradient bar + labels distributed below

All receive `readonly items: readonly LegendItem[]` where `LegendItem = { label: string, value: string | number }`.

### The Challenge: Matching Params to Legend Items

The legend items have resolved color values (after `resolveParams()`), but we need to pair each legend item with its corresponding param control. The connection exists through `@@#params.*` references in the raw `legend_config`, but the resolved version loses that mapping.

**Example (choropleth match):**
- `legend_config.items[0]` = `{ label: "High income: OECD", value: "@@#params.high_oecd_color" }` → resolves to `{ label: "High income: OECD", value: "#2563eb" }`
- `legendParams` includes `{ key: "high_oecd_color", control_type: "color_picker", group: "legend" }`

The param key and the `@@#params.*` reference share the same name, but the resolved legend config no longer contains the reference string. To pair them, we'd need either:
1. Pass the **raw** (unresolved) legend config alongside the resolved one, and match by extracting param keys from `@@#params.*` references
2. Match by value — compare each legend item's resolved color value to param values (fragile)
3. Add a `param_key` field to `LegendItem` type (schema change)

### What Each Legend Type Needs

**Basic (e.g., example 02 — vector fill):**
Each row: `[color picker] [label]` — the swatch becomes an interactive color picker

**Choropleth (e.g., example 03 — match, example 05 — classified):**
Each row: `[color picker] [label]`
Break params (if any): rendered between rows or as editable values next to labels

**Gradient (e.g., example 04 — interpolate):**
Gradient bar with color pickers positioned at each stop, stop value sliders below

### Key Files to Modify

- `src/components/playground/legend-card.tsx` — Main orchestrator, needs per-type integrated layouts
- `src/components/legends/basic-legend.tsx` — Needs editable variant or new component
- `src/components/legends/choropleth-legend.tsx` — Needs editable variant or new component
- `src/components/legends/gradient-legend.tsx` — Needs editable variant or new component
- `src/components/playground/param-control.tsx` — `ColorPickerControl` is not exported; may need to export it or create inline color pickers

### Data Available in LegendCard

```typescript
type LegendCardProps = {
  readonly legendConfig: LegendConfig | null      // resolved items (colors are hex, not @@#params)
  readonly legendParams: readonly InferredParam[]  // all params with group: "legend"
  readonly values: Record<string, unknown>         // current param values by key
  readonly onChange: (key: string, value: unknown) => void
}
```

### Example Param/Legend Pairings Across Examples

| Example | Legend Type | Legend Items | Legend Params |
|---------|-----------|-------------|---------------|
| 01 raster | basic | 1 static item | none |
| 02 vector | basic | 1 item (fill_color) | fill_color, outline_color |
| 03 choropleth | choropleth | 5 items (5 colors) | 6 colors (incl. default_color not in legend) |
| 04 graduated | gradient | 2 items (low, high) | 3 colors + 3 stops |
| 05 classified | choropleth | 3 items (3 colors) | 3 colors + 2 breaks |
| 06 circles | gradient | 2 items (same color) | 1 color |
| 07 raster fn | gradient | 2 static items | none |
| 08 deck.gl | basic | 1 item (point_color) | point_color |
| 09 conditional | choropleth | 2 items (above, below) | threshold + 2 colors |
| 10 react | gradient | 2 items (low, high) | 3 colors |

Note: Some params tagged `group: "legend"` are NOT represented in legend items (e.g., `default_color` in example 03, `color_mid` in examples 04/10, break values in 05). The integration needs to handle these "orphan" legend params gracefully.

## Git State

```
a146b19 fix: polish panel header — larger slider, more padding, traffic light badges
ad02fd2 refactor: remove floating legend panel from map renderer
d46785d feat: rewrite ParamsPanel with sections and wire playground props
9dbd6bd feat: add LegendCard component and extract ParamControl
f561b46 feat: add PanelHeader component with title, tier, visibility, opacity
371105b feat: add visibility param and legend group tags to all examples
1d965ef feat: propagate group field through param inference
f74d515 feat: add group field to ParamConfig/InferredParam, make legend_config optional
```

Branch: `main`, clean working tree.
