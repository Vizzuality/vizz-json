# buildColormap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `@@function: buildColormap` that converts gradient editor stops into a TiTiler interval colormap, making the legend the interactive source of truth for raster tile rendering.

**Architecture:** New `buildColormap` function registered in the converter alongside `setQueryParams`. It takes `[dataValue, color]` stops and returns a 128-step TiTiler interval array. The gradient editor manages stops via params; nested `@@function` resolution (already supported) lets `buildColormap` run inside `setQueryParams`'s query object. The gradient serializer is extended to sync `buildColormap.stops` when stops are added/removed.

**Tech Stack:** TypeScript, Vitest, TiTiler interval colormap format

**Spec:** `.superpowers/specs/2026-04-08-buildColormap-design.md`

---

## File Structure

| File | Responsibility |
|------|---------------|
| `src/lib/colormap.ts` | **New** — `hexToRgba`, `interpolateColormap`, colormap types |
| `tests/lib/colormap.test.ts` | **New** — Unit tests for colormap utilities |
| `src/lib/converter/functions.ts` | **Modify** — Register `buildColormap` function |
| `tests/lib/converter/functions.test.ts` | **Modify** — Add `buildColormap` tests |
| `src/lib/gradient-serializer.ts` | **Modify** — Add `buildColormap.stops` sync on add/remove |
| `tests/lib/gradient-serializer.test.ts` | **Modify** — Add serializer sync tests |
| `src/examples/07-raster-function.json` | **Modify** — Rewrite with `buildColormap` + editable params |

---

### Task 1: Colormap utilities

**Files:**
- Create: `src/lib/colormap.ts`
- Create: `tests/lib/colormap.test.ts`

- [ ] **Step 1: Write failing tests for hexToRgba**

Create `tests/lib/colormap.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { hexToRgba, interpolateColormap } from '#/lib/colormap'

describe('hexToRgba', () => {
  it('converts a hex color with hash to RGBA tuple', () => {
    expect(hexToRgba('#0E2780')).toEqual([14, 39, 128, 255])
  })

  it('handles hex without hash prefix', () => {
    expect(hexToRgba('ff0000')).toEqual([255, 0, 0, 255])
  })

  it('converts black', () => {
    expect(hexToRgba('#000000')).toEqual([0, 0, 0, 255])
  })

  it('converts white', () => {
    expect(hexToRgba('#ffffff')).toEqual([255, 255, 255, 255])
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test -- tests/lib/colormap.test.ts`
Expected: FAIL — module `#/lib/colormap` does not exist

- [ ] **Step 3: Implement hexToRgba**

Create `src/lib/colormap.ts`:

```typescript
export type Rgba = readonly [number, number, number, number]
export type ColormapStop = readonly [number, string]
export type IntervalEntry = readonly [readonly [number, number], Rgba]
export type IntervalColormap = readonly IntervalEntry[]

export function hexToRgba(hex: string): Rgba {
  const h = hex.replace('#', '')
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
    255,
  ]
}
```

- [ ] **Step 4: Run tests to verify hexToRgba passes**

Run: `pnpm test -- tests/lib/colormap.test.ts`
Expected: 4 PASS, remaining tests FAIL (interpolateColormap not yet exported)

- [ ] **Step 5: Write failing tests for interpolateColormap**

Append to the `tests/lib/colormap.test.ts` file:

```typescript
describe('interpolateColormap', () => {
  it('interpolates two stops into 128 interval entries', () => {
    const stops: ColormapStop[] = [
      [0, '#000000'],
      [100, '#ffffff'],
    ]
    const result = interpolateColormap(stops)

    expect(result).toHaveLength(128)
    expect(result[0][0][0]).toBe(0)
    expect(result[127][0][1]).toBe(100)
    expect(result[0][1]).toEqual([0, 0, 0, 255])
    expect(result[127][1]).toEqual([255, 255, 255, 255])
    const midColor = result[64][1][0]
    expect(midColor).toBeGreaterThanOrEqual(126)
    expect(midColor).toBeLessThanOrEqual(130)
  })

  it('interpolates three stops correctly', () => {
    const stops: ColormapStop[] = [
      [0, '#ff0000'],
      [50, '#00ff00'],
      [100, '#0000ff'],
    ]
    const result = interpolateColormap(stops)

    expect(result).toHaveLength(128)
    expect(result[0][1]).toEqual([255, 0, 0, 255])
    expect(result[127][1]).toEqual([0, 0, 255, 255])
    expect(result[64][1][1]).toBeGreaterThanOrEqual(250)
  })

  it('handles single stop by returning one interval', () => {
    const stops: ColormapStop[] = [[50, '#ff0000']]
    const result = interpolateColormap(stops)

    expect(result).toHaveLength(1)
    expect(result[0][0]).toEqual([50, 50])
    expect(result[0][1]).toEqual([255, 0, 0, 255])
  })

  it('returns empty array for empty input', () => {
    expect(interpolateColormap([])).toEqual([])
  })

  it('sorts stops by data value before interpolating', () => {
    const stops: ColormapStop[] = [
      [100, '#ffffff'],
      [0, '#000000'],
    ]
    const result = interpolateColormap(stops)

    expect(result[0][1]).toEqual([0, 0, 0, 255])
    expect(result[127][1]).toEqual([255, 255, 255, 255])
  })
})
```

Add `ColormapStop` to the import at the top:

```typescript
import { hexToRgba, interpolateColormap, type ColormapStop } from '#/lib/colormap'
```

- [ ] **Step 6: Run tests to verify interpolateColormap tests fail**

Run: `pnpm test -- tests/lib/colormap.test.ts`
Expected: hexToRgba tests PASS, interpolateColormap tests FAIL

- [ ] **Step 7: Implement interpolateColormap**

Add to `src/lib/colormap.ts` after `hexToRgba`:

```typescript
const GRADIENT_STEPS = 128

export function interpolateColormap(
  stops: readonly ColormapStop[],
): IntervalColormap {
  if (stops.length === 0) return []

  const sorted = [...stops].sort((a, b) => a[0] - b[0])
  const rgbaStops = sorted.map(
    ([value, color]) => [value, hexToRgba(color)] as const,
  )

  if (rgbaStops.length === 1) {
    const [value, rgba] = rgbaStops[0]
    return [[[value, value], rgba]]
  }

  const minVal = rgbaStops[0][0]
  const maxVal = rgbaStops[rgbaStops.length - 1][0]
  const range = maxVal - minVal || 1
  const step = range / GRADIENT_STEPS

  return Array.from({ length: GRADIENT_STEPS }, (_, i) => {
    const lower = minVal + i * step
    const upper =
      i === GRADIENT_STEPS - 1 ? maxVal : minVal + (i + 1) * step
    const dataValue = i === GRADIENT_STEPS - 1 ? maxVal : lower

    let lowerIdx = rgbaStops.length - 2
    for (let s = 0; s < rgbaStops.length - 1; s++) {
      if (rgbaStops[s + 1][0] >= dataValue) {
        lowerIdx = s
        break
      }
    }
    const upperIdx = Math.min(lowerIdx + 1, rgbaStops.length - 1)

    const [lowerVal, lowerRgba] = rgbaStops[lowerIdx]
    const [upperVal, upperRgba] = rgbaStops[upperIdx]

    const segmentRange = upperVal - lowerVal || 1
    const t = Math.max(
      0,
      Math.min(1, (dataValue - lowerVal) / segmentRange),
    )

    const rgba: Rgba = [
      Math.round(lowerRgba[0] + t * (upperRgba[0] - lowerRgba[0])),
      Math.round(lowerRgba[1] + t * (upperRgba[1] - lowerRgba[1])),
      Math.round(lowerRgba[2] + t * (upperRgba[2] - lowerRgba[2])),
      255,
    ]

    return [[lower, upper], rgba] as IntervalEntry
  })
}
```

- [ ] **Step 8: Run all colormap tests**

Run: `pnpm test -- tests/lib/colormap.test.ts`
Expected: ALL PASS (9 tests)

- [ ] **Step 9: Commit**

```bash
git add src/lib/colormap.ts tests/lib/colormap.test.ts
git commit -m "feat: add colormap utilities for TiTiler interval format"
```

---

### Task 2: Register buildColormap function

**Files:**
- Modify: `src/lib/converter/functions.ts`
- Modify: `tests/lib/converter/functions.test.ts`

- [ ] **Step 1: Write failing tests for buildColormap**

Add to `tests/lib/converter/functions.test.ts` after the `ifParam` describe block:

```typescript
describe('buildColormap', () => {
  const fn = registeredFunctions.buildColormap

  it('produces a 128-entry interval colormap from two stops', () => {
    const result = fn({
      stops: [
        [0, '#000000'],
        [100, '#ffffff'],
      ],
    }) as unknown[][]

    expect(result).toHaveLength(128)
    expect(result[0][0]).toEqual([0, expect.any(Number)])
    expect(result[0][1]).toEqual([0, 0, 0, 255])
    expect(result[127][1]).toEqual([255, 255, 255, 255])
  })

  it('sorts stops by data value', () => {
    const result = fn({
      stops: [
        [100, '#ffffff'],
        [0, '#000000'],
      ],
    }) as unknown[][]

    expect(result[0][1]).toEqual([0, 0, 0, 255])
    expect(result[127][1]).toEqual([255, 255, 255, 255])
  })

  it('returns empty array for empty stops', () => {
    expect(fn({ stops: [] })).toEqual([])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- tests/lib/converter/functions.test.ts`
Expected: FAIL — `registeredFunctions.buildColormap` is undefined

- [ ] **Step 3: Implement buildColormap and register it**

In `src/lib/converter/functions.ts`, add the import at the top:

```typescript
import { interpolateColormap, type ColormapStop } from '#/lib/colormap'
```

Add the type and function before the `registeredFunctions` export:

```typescript
type BuildColormapProps = {
  readonly stops: readonly ColormapStop[]
}

function buildColormap({ stops }: BuildColormapProps): unknown {
  return interpolateColormap(stops)
}
```

Add `buildColormap` to the `registeredFunctions` object:

```typescript
export const registeredFunctions: Readonly<
  Record<string, (props: any) => unknown>
> = {
  setQueryParams,
  ifParam,
  buildColormap,
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test -- tests/lib/converter/functions.test.ts`
Expected: ALL PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/converter/functions.ts tests/lib/converter/functions.test.ts
git commit -m "feat: register buildColormap @@function in converter"
```

---

### Task 3: Extend gradient serializer to sync buildColormap.stops

**Files:**
- Modify: `src/lib/gradient-serializer.ts`
- Modify: `tests/lib/gradient-serializer.test.ts`

- [ ] **Step 1: Write failing test for buildColormap.stops sync**

Add a new test fixture and tests at the end of `tests/lib/gradient-serializer.test.ts`:

```typescript
const RASTER_JSON = JSON.stringify(
  {
    config: {
      source: {
        type: 'raster',
        tiles: [
          {
            '@@function': 'setQueryParams',
            url: 'https://titiler.xyz/cog/tiles/WebMercatorQuad/{z}/{x}/{y}.png',
            query: {
              url: 'https://example.com/data.tif',
              colormap: {
                '@@function': 'buildColormap',
                stops: [
                  ['@@#params.threshold_1', '@@#params.color_1'],
                  ['@@#params.threshold_2', '@@#params.color_2'],
                ],
              },
            },
          },
        ],
      },
      styles: [{ type: 'raster', paint: { 'raster-opacity': 0.8 } }],
    },
    params_config: [
      { key: 'threshold_1', default: -10000, group: 'legend' },
      { key: 'color_1', default: '#440154', group: 'legend' },
      { key: 'threshold_2', default: 6000, group: 'legend' },
      { key: 'color_2', default: '#fde725', group: 'legend' },
    ],
    legend_config: {
      type: 'gradient',
      items: [
        { label: 'Deep ocean', value: '@@#params.color_1' },
        { label: 'Peak', value: '@@#params.color_2' },
      ],
    },
  },
  null,
  2,
)

describe('serializeGradientToJson with buildColormap', () => {
  it('syncs buildColormap.stops when stops are preserved', () => {
    const stops: GradientStop[] = [
      {
        id: '1',
        color: '#440154',
        position: 0,
        dataValue: -10000,
        label: 'Deep ocean',
        colorParamKey: 'color_1',
        thresholdParamKey: 'threshold_1',
      },
      {
        id: '2',
        color: '#fde725',
        position: 1,
        dataValue: 6000,
        label: 'Peak',
        colorParamKey: 'color_2',
        thresholdParamKey: 'threshold_2',
      },
    ]

    const result = JSON.parse(serializeGradientToJson(RASTER_JSON, stops))

    const colormapFn =
      result.config.source.tiles[0].query.colormap
    expect(colormapFn['@@function']).toBe('buildColormap')
    expect(colormapFn.stops).toEqual([
      ['@@#params.threshold_1', '@@#params.color_1'],
      ['@@#params.threshold_2', '@@#params.color_2'],
    ])
  })

  it('adds new stop to buildColormap.stops when a stop is added', () => {
    const stops: GradientStop[] = [
      {
        id: '1',
        color: '#440154',
        position: 0,
        dataValue: -10000,
        label: 'Deep ocean',
        colorParamKey: 'color_1',
        thresholdParamKey: 'threshold_1',
      },
      {
        id: 'new',
        color: '#21918c',
        position: 0.5,
        dataValue: -2000,
        label: 'Shelf',
      },
      {
        id: '2',
        color: '#fde725',
        position: 1,
        dataValue: 6000,
        label: 'Peak',
        colorParamKey: 'color_2',
        thresholdParamKey: 'threshold_2',
      },
    ]

    const result = JSON.parse(serializeGradientToJson(RASTER_JSON, stops))

    const colormapFn =
      result.config.source.tiles[0].query.colormap
    expect(colormapFn.stops).toHaveLength(3)
    expect(colormapFn.stops[0]).toEqual([
      '@@#params.threshold_1',
      '@@#params.color_1',
    ])
    expect(colormapFn.stops[1][0]).toMatch(/^@@#params\.threshold_\d+$/)
    expect(colormapFn.stops[1][1]).toMatch(/^@@#params\.color_\d+$/)
    expect(colormapFn.stops[2]).toEqual([
      '@@#params.threshold_2',
      '@@#params.color_2',
    ])
  })

  it('removes stop from buildColormap.stops when a stop is deleted', () => {
    const stops: GradientStop[] = [
      {
        id: '1',
        color: '#440154',
        position: 0,
        dataValue: -10000,
        label: 'Deep ocean',
        colorParamKey: 'color_1',
        thresholdParamKey: 'threshold_1',
      },
    ]

    const result = JSON.parse(serializeGradientToJson(RASTER_JSON, stops))

    const colormapFn =
      result.config.source.tiles[0].query.colormap
    expect(colormapFn.stops).toHaveLength(1)
    expect(colormapFn.stops[0]).toEqual([
      '@@#params.threshold_1',
      '@@#params.color_1',
    ])
  })

  it('leaves config unchanged when no buildColormap exists', () => {
    const stops: GradientStop[] = [
      {
        id: '1',
        color: '#ff0000',
        position: 0,
        dataValue: 0,
        label: 'Low',
        colorParamKey: 'color_1',
        thresholdParamKey: 'threshold_1',
      },
      {
        id: '3',
        color: '#0000ff',
        position: 1,
        dataValue: 500000000,
        label: 'High',
        colorParamKey: 'color_3',
        thresholdParamKey: 'threshold_3',
      },
    ]

    const result = JSON.parse(serializeGradientToJson(EXAMPLE_JSON, stops))

    // Should still have interpolate expression, no buildColormap
    const interpolate = result.config.styles[0].paint['fill-color']
    expect(interpolate[0]).toBe('interpolate')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test -- tests/lib/gradient-serializer.test.ts`
Expected: FAIL — buildColormap.stops not synced (first new test fails)

- [ ] **Step 3: Add buildColormap.stops sync to the serializer**

In `src/lib/gradient-serializer.ts`, add a helper function after `findNextAvailableIndex`:

```typescript
function syncBuildColormapStops(
  node: unknown,
  stopsWithKeys: readonly { colorParamKey: string; thresholdParamKey: string }[],
): unknown {
  if (Array.isArray(node)) {
    return node.map((item) =>
      syncBuildColormapStops(item, stopsWithKeys),
    )
  }

  if (node !== null && typeof node === 'object') {
    const obj = node as Record<string, unknown>

    if (
      obj['@@function'] === 'buildColormap' &&
      Array.isArray(obj.stops)
    ) {
      return {
        ...obj,
        stops: stopsWithKeys.map((stop) => [
          `@@#params.${stop.thresholdParamKey}`,
          `@@#params.${stop.colorParamKey}`,
        ]),
      }
    }

    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [
        key,
        syncBuildColormapStops(value, stopsWithKeys),
      ]),
    )
  }

  return node
}
```

Then in `serializeGradientToJson`, after the interpolate rebuild block (after line 102), add the buildColormap sync before building the result:

Replace the current result-building block (lines 104–111):

```typescript
  const result = {
    ...parsed,
    ...(newConfig !== config ? { config: newConfig } : {}),
    params_config: newParamsConfig,
    legend_config: newLegendConfig,
  }

  return JSON.stringify(result, null, 2)
```

With:

```typescript
  const syncedConfig = syncBuildColormapStops(
    newConfig ?? config,
    stopsWithKeys,
  )

  const result = {
    ...parsed,
    config: syncedConfig,
    params_config: newParamsConfig,
    legend_config: newLegendConfig,
  }

  return JSON.stringify(result, null, 2)
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test -- tests/lib/gradient-serializer.test.ts`
Expected: ALL PASS (10 tests — 6 existing + 4 new)

- [ ] **Step 5: Run full test suite**

Run: `pnpm test`
Expected: ALL PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/gradient-serializer.ts tests/lib/gradient-serializer.test.ts
git commit -m "feat: sync buildColormap.stops in gradient serializer"
```

---

### Task 4: Update raster-function example

**Files:**
- Modify: `src/examples/07-raster-function.json`

- [ ] **Step 1: Rewrite the example with buildColormap**

Replace the entire content of `src/examples/07-raster-function.json`:

```json
{
  "metadata": {
    "title": "@@function — Interactive Raster Colormap",
    "description": "Edit the gradient legend to change how TiTiler renders this COG",
    "tier": "advanced"
  },
  "config": {
    "source": {
      "type": "raster",
      "tiles": [
        {
          "@@function": "setQueryParams",
          "url": "https://titiler.xyz/cog/tiles/WebMercatorQuad/{z}/{x}/{y}.png",
          "query": {
            "url": "https://data.source.coop/alexgleith/gebco-2024/GEBCO_2024.tif",
            "colormap": {
              "@@function": "buildColormap",
              "stops": [
                ["@@#params.threshold_1", "@@#params.color_1"],
                ["@@#params.threshold_2", "@@#params.color_2"]
              ]
            }
          }
        }
      ],
      "tileSize": 256
    },
    "styles": [
      {
        "type": "raster",
        "paint": {
          "raster-opacity": "@@#params.opacity"
        },
        "layout": {
          "visibility": "@@#params.visibility"
        }
      }
    ]
  },
  "params_config": [
    {
      "key": "threshold_1",
      "default": -10000,
      "min": -11000,
      "max": 6000,
      "step": 100,
      "group": "legend"
    },
    { "key": "color_1", "default": "#440154", "group": "legend" },
    {
      "key": "threshold_2",
      "default": 6000,
      "min": -10000,
      "max": 7000,
      "step": 100,
      "group": "legend"
    },
    { "key": "color_2", "default": "#fde725", "group": "legend" },
    { "key": "opacity", "default": 1.0, "min": 0, "max": 1, "step": 0.05 },
    {
      "key": "visibility",
      "default": "visible",
      "options": ["visible", "none"]
    }
  ],
  "legend_config": {
    "type": "gradient",
    "items": [
      { "label": "Deep ocean", "value": "@@#params.color_1" },
      { "label": "Peak", "value": "@@#params.color_2" }
    ]
  }
}
```

- [ ] **Step 2: Run all tests and typecheck**

Run: `pnpm test && pnpm typecheck`
Expected: ALL PASS, no type errors

- [ ] **Step 3: Commit**

```bash
git add src/examples/07-raster-function.json
git commit -m "feat: rewrite raster-function example with interactive buildColormap"
```

---

### Task 5: Verify end-to-end

- [ ] **Step 1: Run full test suite**

Run: `pnpm test`
Expected: ALL PASS

- [ ] **Step 2: Run typecheck and lint**

Run: `pnpm typecheck && pnpm lint`
Expected: Clean

- [ ] **Step 3: Manual verification**

Run: `pnpm dev`
Open: `http://localhost:3000/playground?example=raster-function`

Verify:
- Tiles load at default zoom (global bathymetry/elevation visible)
- Click the gradient legend → gradient editor opens
- Change a stop color → tiles re-render with the new color
- Edit a threshold value → tile color breaks shift
- Add a stop (click gradient bar) → legend and tiles both show 3 colors
- Remove a stop → legend and tiles revert
- Toggle opacity and visibility → still works
- Switch to raw JSON tab → buildColormap.stops updated with new param refs

- [ ] **Step 4: Final commit (if any manual fixes needed)**

```bash
git add -u
git commit -m "fix: adjustments from manual verification"
```
