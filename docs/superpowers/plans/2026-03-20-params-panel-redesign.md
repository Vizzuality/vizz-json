# Params Panel Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the params panel into a unified layer control — header row with metadata + universal controls, a legend/color card with live preview, and remaining params below. Remove the floating legend overlay.

**Architecture:** The `ParamsPanel` component is decomposed into three sub-components: `PanelHeader`, `LegendCard`, and a remaining-params section. A new `group` field on `ParamConfig` determines which params belong in the legend card. The panel receives metadata and legendConfig as new props, and inference moves upstream to `playground.tsx`.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, shadcn/ui (base-nova), Vitest

**Spec:** `docs/superpowers/specs/2026-03-20-params-panel-redesign-design.md`

**Code style:** All new/modified TypeScript files must pass `pnpm check` before commit. The project uses Prettier with no semicolons, single quotes, trailing commas. Run `pnpm check` before every commit step.

**Note:** `buildDefaultParams()` in `playground.tsx` uses raw `example.params_config` from examples (not inferred params) and remains unchanged throughout this plan. Metadata comes from the selected example, not from user-edited JSON — this is deliberate.

---

### Task 1: Type changes — add `group` to ParamConfig and InferredParam, make legend_config optional

**Files:**
- Modify: `src/lib/types.ts:1-8` (ParamConfig) and `src/lib/types.ts:49-57` (InferredParam) and `src/lib/types.ts:25-29` (LayerSchema)

- [ ] **Step 1: Add `group` field to `ParamConfig`**

In `src/lib/types.ts`, add `readonly group?: "legend"` to `ParamConfig` (after `options`):

```typescript
export type ParamConfig = {
  readonly key: string
  readonly default: unknown
  readonly min?: number
  readonly max?: number
  readonly step?: number
  readonly options?: readonly string[]
  readonly group?: 'legend'
}
```

- [ ] **Step 2: Add `group` field to `InferredParam`**

In `src/lib/types.ts`, add `readonly group?: "legend"` to `InferredParam`:

```typescript
export type InferredParam = {
  readonly key: string
  readonly value: unknown
  readonly control_type: ParamControlType
  readonly min?: number
  readonly max?: number
  readonly step?: number
  readonly options?: readonly string[]
  readonly group?: 'legend'
}
```

- [ ] **Step 3: Make `legend_config` optional in `LayerSchema`**

Change line 28 from `readonly legend_config: LegendConfig` to:

```typescript
readonly legend_config?: LegendConfig
```

- [ ] **Step 4: Run type check and format**

Run: `pnpm check && pnpm exec tsc --noEmit`
Expected: PASS (additive changes only, existing code still compiles)

- [ ] **Step 5: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: add group field to ParamConfig/InferredParam, make legend_config optional"
```

---

### Task 2: Propagate `group` through inference

**Files:**
- Modify: `src/lib/param-inference.ts:18-28`
- Modify: `tests/lib/param-inference.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `tests/lib/param-inference.test.ts`:

```typescript
it("propagates group field from ParamConfig", () => {
  const result = inferParamControl({
    key: "fill_color",
    default: "#3b82f6",
    group: "legend",
  })
  expect(result.group).toBe("legend")
})

it("leaves group undefined when not set", () => {
  const result = inferParamControl({ key: "opacity", default: 0.8 })
  expect(result.group).toBeUndefined()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- tests/lib/param-inference.test.ts`
Expected: FAIL — `group` is not propagated yet

- [ ] **Step 3: Add `group` propagation to `inferParamControl`**

In `src/lib/param-inference.ts`, update the return object in `inferParamControl` (line 19-27):

```typescript
export function inferParamControl(param: ParamConfig): InferredParam {
  return {
    key: param.key,
    value: param.default,
    control_type: inferControlType(param),
    min: param.min,
    max: param.max,
    step: param.step,
    options: param.options,
    group: param.group,
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm check && pnpm test -- tests/lib/param-inference.test.ts`
Expected: PASS — all tests green

- [ ] **Step 5: Commit**

```bash
git add src/lib/param-inference.ts tests/lib/param-inference.test.ts
git commit -m "feat: propagate group field through param inference"
```

---

### Task 3: Update all 10 example JSON files

**Files:**
- Modify: All files in `src/examples/*.json`

Each example needs:
1. `visibility` param added (with `"options": ["visible", "none"]` and corresponding `@@#params.visibility` in the style layout)
2. Color and breakpoint/threshold params tagged with `"group": "legend"`

- [ ] **Step 1: Verify `01-raster-opacity.json` — no changes needed**

Already has both `opacity` and `visibility` params. The legend has a static value (`"visible"`, not a `@@#params.*` reference), so no params need `group: "legend"`. **No file modification required.**

- [ ] **Step 2: Update `02-vector-fill.json`**

Add visibility param + layout to styles. Tag `fill_color` and `outline_color` with `group: "legend"`:

```json
{
  "metadata": {
    "title": "Vector — Simple Fill",
    "description": "Vector fill layer with parameterized color and opacity",
    "tier": "basic"
  },
  "config": {
    "source": {
      "type": "geojson",
      "data": "https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_50m_admin_0_countries.geojson"
    },
    "styles": [
      {
        "type": "fill",
        "paint": {
          "fill-color": "@@#params.fill_color",
          "fill-opacity": "@@#params.opacity",
          "fill-outline-color": "@@#params.outline_color"
        },
        "layout": {
          "visibility": "@@#params.visibility"
        }
      }
    ]
  },
  "params_config": [
    { "key": "fill_color", "default": "#3b82f6", "group": "legend" },
    { "key": "outline_color", "default": "#1e3a5f", "group": "legend" },
    { "key": "opacity", "default": 0.7, "min": 0, "max": 1, "step": 0.05 },
    { "key": "visibility", "default": "visible", "options": ["visible", "none"] }
  ],
  "legend_config": {
    "type": "basic",
    "items": [
      { "label": "Countries", "value": "@@#params.fill_color" }
    ]
  }
}
```

- [ ] **Step 3: Update `03-choropleth-match.json`**

Add visibility. Tag all 6 color params with `group: "legend"`:

Replace `params_config` with:
```json
"params_config": [
  { "key": "high_oecd_color", "default": "#2563eb", "group": "legend" },
  { "key": "high_non_oecd_color", "default": "#60a5fa", "group": "legend" },
  { "key": "upper_middle_color", "default": "#fbbf24", "group": "legend" },
  { "key": "lower_middle_color", "default": "#f97316", "group": "legend" },
  { "key": "low_income_color", "default": "#dc2626", "group": "legend" },
  { "key": "default_color", "default": "#6b7280", "group": "legend" },
  { "key": "opacity", "default": 0.8, "min": 0, "max": 1, "step": 0.05 },
  { "key": "visibility", "default": "visible", "options": ["visible", "none"] }
]
```

Add `"layout": { "visibility": "@@#params.visibility" }` as a sibling of `"paint"` inside `styles[0]`.

- [ ] **Step 4: Update `04-graduated-interpolate.json`**

Add visibility. Tag color stops AND value stops with `group: "legend"` (they define the gradient):

```json
"params_config": [
  { "key": "stop_low", "default": 0, "min": 0, "max": 500000000, "step": 1000000, "group": "legend" },
  { "key": "stop_mid", "default": 50000000, "min": 0, "max": 1000000000, "step": 1000000, "group": "legend" },
  { "key": "stop_high", "default": 500000000, "min": 0, "max": 2000000000, "step": 10000000, "group": "legend" },
  { "key": "color_low", "default": "#eff6ff", "group": "legend" },
  { "key": "color_mid", "default": "#3b82f6", "group": "legend" },
  { "key": "color_high", "default": "#1e3a8a", "group": "legend" },
  { "key": "opacity", "default": 0.8, "min": 0, "max": 1, "step": 0.05 },
  { "key": "visibility", "default": "visible", "options": ["visible", "none"] }
]
```

Add `"layout": { "visibility": "@@#params.visibility" }` as a sibling of `"paint"` inside `styles[0]`.

- [ ] **Step 5: Update `05-classified-step.json`**

Add visibility. Tag colors and breaks with `group: "legend"`:

```json
"params_config": [
  { "key": "color1", "default": "#22c55e", "group": "legend" },
  { "key": "color2", "default": "#eab308", "group": "legend" },
  { "key": "color3", "default": "#ef4444", "group": "legend" },
  { "key": "break1", "default": 3, "min": 0, "max": 10, "step": 0.5, "group": "legend" },
  { "key": "break2", "default": 5, "min": 0, "max": 10, "step": 0.5, "group": "legend" },
  { "key": "opacity", "default": 0.8, "min": 0, "max": 1, "step": 0.05 },
  { "key": "visibility", "default": "visible", "options": ["visible", "none"] }
]
```

Add `"layout": { "visibility": "@@#params.visibility" }` as a sibling of `"paint"` inside `styles[0]`.

- [ ] **Step 6: Update `06-data-driven-circles.json`**

Add visibility. Tag `color` with `group: "legend"`. `scale_low` and `scale_high` are size params — not legend. Keep them ungrouped:

```json
"params_config": [
  { "key": "scale_low", "default": 0.000001 },
  { "key": "scale_high", "default": 0.00001 },
  { "key": "color", "default": "#3b82f6", "group": "legend" },
  { "key": "opacity", "default": 0.7, "min": 0, "max": 1, "step": 0.05 },
  { "key": "visibility", "default": "visible", "options": ["visible", "none"] }
]
```

Add `"layout": { "visibility": "@@#params.visibility" }` as a sibling of `"paint"` inside `styles[0]`.

- [ ] **Step 7: Update `07-raster-function.json`**

Add visibility. Legend has static colors (not param references) — no params need `group: "legend"`. `colormap` and `rescale` are data-source params, not legend:

```json
"params_config": [
  { "key": "colormap", "default": "viridis", "options": ["viridis", "plasma", "inferno", "magma", "cividis"] },
  { "key": "rescale", "default": "0,3000" },
  { "key": "opacity", "default": 1.0, "min": 0, "max": 1, "step": 0.05 },
  { "key": "visibility", "default": "visible", "options": ["visible", "none"] }
]
```

Add `"layout": { "visibility": "@@#params.visibility" }` as a sibling of `"paint"` inside `styles[0]`.

- [ ] **Step 8: Update `08-deckgl-scatterplot.json`**

Add visibility. Tag `point_color` with `group: "legend"`. `radius` is a size param:

For deck.gl layers, visibility works differently. Add a `"visible": "@@#params.visibility"` pattern. Actually, deck.gl uses a `visible` boolean property. For deck.gl, change the visibility param to a boolean switch instead:

```json
"params_config": [
  { "key": "radius", "default": 5000, "min": 1000, "max": 50000, "step": 1000 },
  { "key": "point_color", "default": "#ef4444", "group": "legend" },
  { "key": "opacity", "default": 0.8, "min": 0, "max": 1, "step": 0.05 },
  { "key": "visibility", "default": "visible", "options": ["visible", "none"] }
]
```

For deck.gl, we can use a `@@function` or simply not wire visibility into the config (since deck.gl doesn't use MapLibre's `layout.visibility`). For simplicity, include the param but don't wire it into the deck.gl config — it demonstrates the universal control pattern even if this specific layer type doesn't use it natively.

- [ ] **Step 9: Update `09-conditional-case.json`**

Add visibility. Tag `above_color`, `below_color`, and `threshold` with `group: "legend"` (threshold determines the classification boundary):

```json
"params_config": [
  { "key": "threshold", "default": 50000000, "min": 1000000, "max": 1000000000, "step": 1000000, "group": "legend" },
  { "key": "above_color", "default": "#dc2626", "group": "legend" },
  { "key": "below_color", "default": "#3b82f6", "group": "legend" },
  { "key": "opacity", "default": 0.7, "min": 0, "max": 1, "step": 0.05 },
  { "key": "visibility", "default": "visible", "options": ["visible", "none"] }
]
```

Add `"layout": { "visibility": "@@#params.visibility" }` as a sibling of `"paint"` inside `styles[0]`.

- [ ] **Step 10: Update `10-react-components.json`**

Add visibility. Tag `color_low`, `color_mid`, `color_high` with `group: "legend"`. `legend_title` and `show_legend` are display-meta params — keep ungrouped:

```json
"params_config": [
  { "key": "color_low", "default": "#eff6ff", "group": "legend" },
  { "key": "color_mid", "default": "#3b82f6", "group": "legend" },
  { "key": "color_high", "default": "#1e3a8a", "group": "legend" },
  { "key": "opacity", "default": 0.8, "min": 0, "max": 1, "step": 0.05 },
  { "key": "visibility", "default": "visible", "options": ["visible", "none"] },
  { "key": "legend_title", "default": "Population Density" },
  { "key": "show_legend", "default": true }
]
```

Add `"layout": { "visibility": "@@#params.visibility" }` as a sibling of `"paint"` inside `styles[0]`.

- [ ] **Step 11: Run all tests**

Run: `pnpm test`
Expected: PASS — JSON changes don't break existing tests

- [ ] **Step 12: Commit**

```bash
git add src/examples/
git commit -m "feat: add visibility param and legend group tags to all examples"
```

---

### Task 4: Build the `PanelHeader` component

**Files:**
- Create: `src/components/playground/panel-header.tsx`

- [ ] **Step 1: Create `PanelHeader` component**

```typescript
import { Slider } from '#/components/ui/slider'
import { Switch } from '#/components/ui/switch'
import { Badge } from '#/components/ui/badge'
import type { ExampleMetadata, InferredParam } from '#/lib/types'

type PanelHeaderProps = {
  readonly metadata: Pick<ExampleMetadata, 'title' | 'tier'> | null
  readonly opacityParam: InferredParam | undefined
  readonly visibilityParam: InferredParam | undefined
  readonly opacityValue: unknown
  readonly visibilityValue: unknown
  readonly onChange: (key: string, value: unknown) => void
}

const TIER_VARIANT = {
  basic: 'secondary',
  intermediate: 'outline',
  advanced: 'default',
} as const

export function PanelHeader({
  metadata,
  opacityParam,
  visibilityParam,
  opacityValue,
  visibilityValue,
  onChange,
}: PanelHeaderProps) {
  const isVisible = visibilityValue === 'visible'

  return (
    <div className="flex items-center gap-2 border-b px-3 py-2">
      {metadata && (
        <>
          <span className="truncate text-sm font-medium">{metadata.title}</span>
          <Badge variant={TIER_VARIANT[metadata.tier]}>{metadata.tier}</Badge>
        </>
      )}
      <div className="ml-auto flex items-center gap-3">
        {visibilityParam && (
          <Switch
            checked={isVisible}
            onCheckedChange={(checked) =>
              onChange('visibility', checked ? 'visible' : 'none')
            }
          />
        )}
        {opacityParam && (
          <div className="flex items-center gap-2">
            <Slider
              value={[typeof opacityValue === 'number' ? opacityValue : 1]}
              min={opacityParam.min ?? 0}
              max={opacityParam.max ?? 1}
              step={opacityParam.step ?? 0.05}
              onValueChange={(v) => onChange('opacity', v[0])}
              className="w-[100px]"
            />
            <span className="w-8 shrink-0 text-right font-mono text-xs text-muted-foreground">
              {(typeof opacityValue === 'number' ? opacityValue : 1).toFixed(2)}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify it compiles and formats**

Run: `pnpm check && pnpm exec tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/playground/panel-header.tsx
git commit -m "feat: add PanelHeader component with title, tier, visibility, opacity"
```

---

### Task 5: Build the `LegendCard` component

**Files:**
- Create: `src/components/playground/legend-card.tsx`

This component renders the legend preview + grouped controls, with layout adapting to legend type.

- [ ] **Step 1: Extract `ParamControl` and `ColorPickerControl` into a shared file**

The `LegendCard` and the remaining params section both need `ParamControl`. Extract it from `params-panel.tsx` into `src/components/playground/param-control.tsx`.

Create `src/components/playground/param-control.tsx` containing the `ColorPickerControl` (lines 46-72 of params-panel.tsx) and `ParamControl` (lines 78-192 of params-panel.tsx) components. Export `ParamControl`.

The file should contain:
- All the imports needed (Slider, Switch, Input, Select/*, Popover/*, InferredParam type)
- `ColorPickerControl` (internal, not exported)
- `ParamControl` (exported)
- The `ParamControlProps` type (exported)

**Important:** Do NOT remove the original functions from `params-panel.tsx` yet — they are still used by the current `ParamsPanel`. Task 6 will replace the entire file.

- [ ] **Step 2: Create `LegendCard` component**

```typescript
import { BasicLegend } from '#/components/legends/basic-legend'
import { ChoroplethLegend } from '#/components/legends/choropleth-legend'
import { GradientLegend } from '#/components/legends/gradient-legend'
import type { LegendConfig, InferredParam } from '#/lib/types'
import { ParamControl } from '#/components/playground/param-control'

const LEGEND_COMPONENTS = {
  basic: BasicLegend,
  choropleth: ChoroplethLegend,
  gradient: GradientLegend,
} as const

type LegendCardProps = {
  readonly legendConfig: LegendConfig | null
  readonly legendParams: readonly InferredParam[]
  readonly values: Record<string, unknown>
  readonly onChange: (key: string, value: unknown) => void
}

export function LegendCard({
  legendConfig,
  legendParams,
  values,
  onChange,
}: LegendCardProps) {
  const hasPreview = legendConfig !== null
  const hasControls = legendParams.length > 0

  if (!hasPreview && !hasControls) return null

  const LegendComponent = legendConfig
    ? LEGEND_COMPONENTS[legendConfig.type]
    : null

  return (
    <div className="mx-3 rounded-lg border bg-muted/30 p-3">
      {LegendComponent && legendConfig && (
        <div className="mb-3">
          <LegendComponent items={legendConfig.items} />
        </div>
      )}
      {hasControls && (
        <div className="flex flex-col gap-2">
          {legendParams.map((param) => {
            const currentValue = Object.prototype.hasOwnProperty.call(values, param.key)
              ? values[param.key]
              : param.value

            return (
              <div key={param.key} className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">
                  {param.key}
                </label>
                <ParamControl
                  inferred={param}
                  currentValue={currentValue}
                  onChange={(newValue) => onChange(param.key, newValue)}
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Verify it compiles and formats**

Run: `pnpm check && pnpm exec tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/playground/param-control.tsx src/components/playground/legend-card.tsx
git commit -m "feat: add LegendCard component and extract ParamControl"
```

---

### Task 6: Rewrite `ParamsPanel` and wire `playground.tsx` (atomic)

These must be done together so the build compiles after the commit.

**Files:**
- Modify: `src/components/playground/params-panel.tsx`
- Modify: `src/routes/playground.tsx`

- [ ] **Step 1: Rewrite `ParamsPanel`**

Replace the entire `params-panel.tsx` content. The new component:
- Receives the expanded props (metadata, legendConfig, inferred params, values, onChange)
- Partitions params into: opacity, visibility, legend group, and remaining
- Renders `PanelHeader` + `LegendCard` + remaining params list

```typescript
import { PanelHeader } from './panel-header'
import { LegendCard } from './legend-card'
import { ParamControl } from './param-control'
import type {
  ExampleMetadata,
  InferredParam,
  LegendConfig,
  ResolvedParams,
} from '#/lib/types'

type ParamsPanelProps = {
  readonly metadata: Pick<ExampleMetadata, 'title' | 'tier'> | null
  readonly paramsConfig: readonly InferredParam[]
  readonly legendConfig: LegendConfig | null
  readonly values: ResolvedParams
  readonly onChange: (key: string, value: unknown) => void
}

const HEADER_KEYS = new Set(['opacity', 'visibility'])

export function ParamsPanel({
  metadata,
  paramsConfig,
  legendConfig,
  values,
  onChange,
}: ParamsPanelProps) {
  const opacityParam = paramsConfig.find((p) => p.key === 'opacity')
  const visibilityParam = paramsConfig.find((p) => p.key === 'visibility')
  const legendParams = paramsConfig.filter(
    (p) => p.group === 'legend' && !HEADER_KEYS.has(p.key),
  )
  const remainingParams = paramsConfig.filter(
    (p) => p.group !== 'legend' && !HEADER_KEYS.has(p.key),
  )

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <PanelHeader
        metadata={metadata}
        opacityParam={opacityParam}
        visibilityParam={visibilityParam}
        opacityValue={values.opacity}
        visibilityValue={values.visibility}
        onChange={onChange}
      />
      <div className="flex flex-col gap-3 py-3">
        <LegendCard
          legendConfig={legendConfig}
          legendParams={legendParams}
          values={values}
          onChange={onChange}
        />
        {remainingParams.length > 0 && (
          <div className="flex flex-col gap-3 px-3">
            {remainingParams.map((param) => {
              const currentValue = Object.prototype.hasOwnProperty.call(values, param.key)
                ? values[param.key]
                : param.value

              return (
                <div key={param.key} className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    {param.key}
                  </label>
                  <ParamControl
                    inferred={param}
                    currentValue={currentValue}
                    onChange={(newValue) => onChange(param.key, newValue)}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Update `playground.tsx` to wire new props**

In `src/routes/playground.tsx`:

1. Add import: `import { inferParamControl } from '#/lib/param-inference'`
2. Add `InferredParam` to the existing type import from `'#/lib/types'`

3. Replace `currentParamsConfig` memo with one that returns `InferredParam[]`:

```typescript
const currentInferredParams = useMemo<readonly InferredParam[]>(() => {
  try {
    const parsed = JSON.parse(debouncedJson) as {
      params_config?: readonly ParamConfig[]
    }
    return (parsed.params_config ?? []).map(inferParamControl)
  } catch {
    return []
  }
}, [debouncedJson])
```

4. Add metadata memo (metadata reflects the selected example, not user edits — deliberate):

```typescript
const currentMetadata = useMemo(() => {
  const example = examples[selectedExampleIndex]
  return example?.metadata ?? null
}, [selectedExampleIndex])
```

5. Update the `<ParamsPanel>` usage to pass new props:

```tsx
<ParamsPanel
  metadata={currentMetadata}
  paramsConfig={currentInferredParams}
  legendConfig={resolvedLegendConfig}
  values={paramValues}
  onChange={handleParamChange}
/>
```

Note: `buildDefaultParams()` remains unchanged — it uses raw `example.params_config` directly, not the inferred params.

- [ ] **Step 3: Verify it compiles and tests pass**

Run: `pnpm check && pnpm exec tsc --noEmit && pnpm test`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/playground/params-panel.tsx src/routes/playground.tsx
git commit -m "feat: rewrite ParamsPanel with sections and wire playground props"
```

---

### Task 7: Remove floating legend from map renderer

**Files:**
- Modify: `src/components/playground/map-renderer.tsx`
- Delete: `src/components/playground/legend-panel.tsx`

- [ ] **Step 1: Remove `LegendPanel` import and usage from `map-renderer.tsx`**

1. Remove the `import { LegendPanel } from './legend-panel'` line
2. Remove the `import type { LegendConfig } from '#/lib/types'` line
3. Remove `readonly legendConfig: LegendConfig | null` from the `MapRendererProps` type
4. Remove `legendConfig` from the destructured props in `MapRenderer`
5. Remove `<LegendPanel config={legendConfig} />` from the JSX

- [ ] **Step 2: Update `playground.tsx` to stop passing `legendConfig` to `MapRenderer`**

In `src/routes/playground.tsx`, remove the `legendConfig` prop from the `<MapRenderer>` JSX:

```tsx
<MapRenderer
  resolvedConfig={resolved}
  error={error}
/>
```

- [ ] **Step 3: Delete `legend-panel.tsx`**

Delete `src/components/playground/legend-panel.tsx`.

- [ ] **Step 4: Verify it compiles, formats, and tests pass**

Run: `pnpm check && pnpm exec tsc --noEmit && pnpm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/playground/map-renderer.tsx src/routes/playground.tsx
git rm src/components/playground/legend-panel.tsx
git commit -m "refactor: remove floating legend panel from map renderer"
```

---

### Task 8: Visual verification and polish

**Files:**
- Potentially modify: any of the new components for visual tweaks

- [ ] **Step 1: Run dev server**

Run: `pnpm dev`

- [ ] **Step 2: Verify each example in the playground**

Open `http://localhost:3000/playground` and test:
1. Example 01 (raster): header shows title + "basic" badge + visibility switch + opacity slider
2. Example 02 (vector fill): legend card shows basic swatches with color pickers
3. Example 03 (choropleth): legend card shows choropleth strips with 6 color pickers
4. Example 04 (graduated): legend card shows gradient bar with color/stop controls
5. Example 05 (classified): legend card shows choropleth + break controls
6. Example 06 (circles): legend card with single color; scale params below in remaining section
7. Example 07 (raster function): legend card with static preview; colormap/rescale below
8. Example 08 (deck.gl): legend card with point_color; radius below
9. Example 09 (conditional): legend card with threshold + 2 colors
10. Example 10 (react components): legend card with 3 colors; legend_title/show_legend below

Verify:
- Header row always shows title + tier
- Visibility toggle works (layer appears/disappears)
- Opacity slider works (layer opacity changes)
- Color pickers in legend card update the legend preview live
- Remaining params render correctly below the card
- No visual regressions

- [ ] **Step 3: Run lint and format**

Run: `pnpm check`

- [ ] **Step 4: Run all tests**

Run: `pnpm test`
Expected: PASS

- [ ] **Step 5: Fix any issues found during verification**

Address visual or functional issues.

- [ ] **Step 6: Commit any polish changes**

```bash
git add -A
git commit -m "fix: polish params panel visual details"
```
