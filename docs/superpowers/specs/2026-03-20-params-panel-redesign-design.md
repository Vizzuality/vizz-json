# Params Panel Redesign

## Goal

Redesign the params panel to serve as a unified layer control — combining metadata, universal controls, legend visualization, and parameter editing into a single cohesive panel. Remove the floating legend overlay from the map.

## Current State

- Params panel: flat 2-column grid of inferred controls
- Legend: absolute-positioned overlay on map (bottom-left, semi-transparent)
- Opacity exists in every example; visibility only in example 01
- 3 legend types: basic, choropleth, gradient
- 6 control types: slider, color_picker, switch, select, text_input, json_editor

## Design

### Panel Structure (top to bottom)

```
+---------------------------------------------+
| [Title]  [Tier]       [Visibility] [Opacity] |  <- header row
+---------------------------------------------+
| +- Color/Legend Card ---------------------+ |
| | [Live legend preview]                   | |  <- gradient bar / swatches / choropleth
| | [Color + breakpoint controls]           | |  <- layout adapts to legend type
| +-----------------------------------------+ |
+---------------------------------------------+
| [Remaining params]                          |  <- flat list, one per row
| [...]                                       |
+---------------------------------------------+
```

Scrollable if content overflows. Color card only renders when `group: "legend"` params exist. Remaining section only renders when ungrouped params exist (excluding opacity/visibility).

### Section 1: Header Row

A single row containing:
- **Title**: from `metadata.title`, truncated with ellipsis if too long
- **Tier badge**: small shadcn badge (basic/intermediate/advanced) with subtle color coding
- **Visibility**: rendered as a Switch toggle in the header, recognized by key `visibility` in `params_config`. MapLibre expects string values `"visible"/"none"`, so the Switch maps `checked=true` to `"visible"` and `checked=false` to `"none"` before writing to `paramValues`.
- **Opacity**: compact slider (~120px) with value badge, recognized by key `opacity` in `params_config`

Opacity and visibility remain in `params_config` in the JSON (the JSON config is the product). The panel recognizes them by key and renders them in the header instead of the grid — **bypassing the standard inference pipeline**. They still feed into `paramValues` identically.

**Header always renders** even if there are no params — it shows metadata (title + tier). If opacity/visibility are absent from `params_config`, their controls simply don't appear in the header.

### Section 2: Color/Legend Card

A visually distinct card (bordered container, slight background tint) grouping all legend-related params.

**Top of card**: live legend preview — renders the resolved legend matching `legend_config.type`.

**Below the preview**: controls for params tagged with `group: "legend"`. Internal layout adapts to legend type:

- **Basic**: vertical list — each row is `[swatch] [label] [color picker]` inline
- **Choropleth**: vertical list, with break/threshold controls interspersed between color rows
- **Gradient**: gradient bar preview at top, then color stops listed vertically with position value controls alongside

Legend preview updates live as the user changes colors/breakpoints — same `resolveParams()` pipeline, rendered inside the card instead of floating on the map.

**Edge cases:**

| `legend_config` present | `group:"legend"` params exist | Behavior |
|---|---|---|
| Yes | Yes | Full card (preview + controls) |
| Yes | No | Preview-only card (no controls below) |
| No | Yes | Controls-only card (no preview) |
| No | No | No card rendered |

### Section 3: Remaining Params

Params not tagged with `group: "legend"` and not `opacity`/`visibility` render below the color card.

- Same control inference as today (slider, select, text input, switch, etc.)
- Single column layout — one param per row, full width
- No forced grouping, straightforward list
- Often empty or 1-2 controls (radius, colormap, rescale, etc.)

If natural groupings are found during implementation (e.g., `scale_factor_low` + `scale_factor_high`), additional group values will be added.

### Type Changes

```typescript
type ParamConfig = {
  readonly key: string;
  readonly default: unknown;
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly options?: readonly string[];
  readonly group?: "legend";  // omitted = general
};

// InferredParam (existing flat structure) gains the group field
type InferredParam = {
  readonly key: string;
  readonly value: unknown;
  readonly control_type: ParamControlType;
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly options?: readonly string[];
  readonly group?: "legend";  // passed through from ParamConfig
};
```

`inferParamControl()` in `param-inference.ts` must propagate `group` from the input `ParamConfig` to the output `InferredParam`.

No `"general"` value needed — absence of `group` means general. Only `"legend"` is explicit for now; more group values may be added if natural patterns emerge.

**`legend_config` optionality:** `LayerSchema.legend_config` is currently required in the type. Since the playground already handles it as potentially absent (runtime safety for user-edited JSON), the type should be updated to `legend_config?: LegendConfig` to match reality. This ripples into `ExampleConfig` (which extends `LayerSchema`) — all code accessing `example.legend_config` without a null check will need updating. The convention for representing absence is `null` (not `undefined`), matching the existing playground code.

### Component Props Contract

The redesigned `ParamsPanel` needs additional props beyond the current `paramsConfig`, `values`, `onChange`:

```typescript
type ParamsPanelProps = {
  readonly metadata: Pick<ExampleMetadata, 'title' | 'tier'> | null;
  readonly paramsConfig: readonly InferredParam[];
  readonly legendConfig: LegendConfig | null;
  readonly values: Record<string, unknown>;
  readonly onChange: (key: string, value: unknown) => void;
};
```

Inference currently happens inline inside `ParamsPanel`. Since the panel now receives `InferredParam[]`, inference moves upstream — likely a `useMemo` in `playground.tsx` that calls `inferParamControl()` on each `ParamConfig`.

### Example Updates

All 10 examples updated:
- Add `opacity` and `visibility` params to every example (currently only example 01 has visibility)
- Tag color pickers and breakpoint/threshold params with `group: "legend"`
- Other params found to share natural groups get tagged accordingly

### Removals

- Remove `LegendPanel` component from `map-renderer.tsx` (floating overlay on map)
- Remove `legend-panel.tsx` (dispatcher component)
- Keep individual legend components (`basic-legend.tsx`, `choropleth-legend.tsx`, `gradient-legend.tsx`) — reused inside the color card

## Out of Scope

- Changes to the JSON editor or resolution pipeline
- Changes to the map renderer beyond removing the legend overlay
- New control types
- Responsive/mobile layout
