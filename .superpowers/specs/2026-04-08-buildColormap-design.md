# buildColormap: Interactive TiTiler colormap via @@function

## Problem

The raster-function example (07) demonstrates `@@function: setQueryParams` for dynamic tile URLs. After switching to a real TiTiler COG endpoint, the colormap and rescale params work — but the gradient legend is static. It shows hardcoded hex colors that don't change when params update.

The goal: the gradient legend **drives** TiTiler tile rendering. Users edit colors and data value thresholds in the legend, and tiles re-render with the custom colormap.

## Prior art

Vizzuality's [Hudson Bay project](https://github.com/Vizzuality/eccc-hudson-bay-lowlands/pull/58) solved this with `interpolateColormap` — a function that takes `[dataValue, hexColor][]` stops and produces a 128-step TiTiler interval colormap. The interval format `[[min, max], [r, g, b, a]][]` embeds data values directly, eliminating the need for a `rescale` param.

## Design

### New `@@function: buildColormap`

Registered as a converter function alongside `setQueryParams` and `ifParam`. Takes an array of `[dataValue, color]` stops and returns a 128-entry TiTiler interval colormap.

**Input:**

```json
{
  "@@function": "buildColormap",
  "stops": [
    [-10000, "#440154"],
    [0, "#21918c"],
    [6000, "#fde725"]
  ]
}
```

**Output:**

```json
[
  [[-10000, -9874.8], [68, 1, 84, 255]],
  [[-9874.8, -9749.6], [68, 2, 85, 255]],
  ...128 entries...
  [[5875.2, 6000], [253, 231, 37, 255]]
]
```

Stop colors and thresholds can be param references (`@@#params.color_1`), resolved in Stage 1 before `buildColormap` runs in Stage 2. Nested `@@function` resolution is already supported — verified by existing tests in `packages/vizz-json/src/__tests__/handlers.test.ts`.

**Edge cases:** `buildColormap` sorts stops by data value before interpolating — handles threshold crossing when users type values via number inputs. Returns empty array for empty stops, single-entry interval for one stop (matching Hudson Bay behavior).

### Colormap utilities

New file `src/lib/colormap.ts` — ported from Hudson Bay, adapted to this project's style (immutable, no semicolons):

- `hexToRgba(hex: string): Rgba` — convert hex color to `[r, g, b, 255]` tuple
- `interpolateColormap(stops: readonly ColormapStop[]): IntervalColormap` — linearly interpolate between stops, producing 128 interval entries

Types:

```typescript
type Rgba = readonly [number, number, number, number]
type ColormapStop = readonly [number, string]  // [dataValue, hexColor]
type IntervalEntry = readonly [readonly [number, number], Rgba]
type IntervalColormap = readonly IntervalEntry[]
```

### How it nests inside setQueryParams

The `buildColormap` result (an array) gets passed as the `colormap` value inside `setQueryParams`'s `query` object. `setQueryParams` already handles objects/arrays by JSON-stringifying them via `URLSearchParams`. So the final tile URL contains `&colormap=<url-encoded JSON array>`.

```json
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
```

Resolution order:
1. **Params resolution** — `@@#params.color_1` becomes `"#440154"`, `@@#params.threshold_1` becomes `-10000`
2. **Nested function** — `buildColormap` runs with resolved stops, returns interval array
3. **Outer function** — `setQueryParams` receives the interval array as `query.colormap`, JSON-stringifies and URL-encodes it

### The editing loop

1. User edits a color in the gradient legend (color picker) or drags a stop (threshold)
2. The corresponding param (`color_1`, `threshold_1`) updates
3. Params resolution replaces the param refs in both legend items AND `buildColormap` stops
4. `buildColormap` produces a new interval colormap
5. `setQueryParams` encodes it into the tile URL
6. TiTiler renders tiles with the new colormap
7. The legend gradient bar reflects the same colors — driven by the same params

### Gradient serializer extension

The existing `serializeGradientToJson` in `src/lib/gradient-serializer.ts` updates `legend_config.items` and `params_config` when stops are added, removed, or reordered. It needs a third sync target: the `buildColormap.stops` array in the config.

The extension:
1. Walk the config tree to find `{ "@@function": "buildColormap", "stops": [...] }`
2. Rebuild the stops array from the current gradient editor state: `["@@#params.threshold_N", "@@#params.color_N"]` pairs
3. Replace the old stops with the new ones (immutable — return a new config object)

This keeps the three representations (legend items, params, buildColormap stops) in sync when users add or remove gradient stops.

### Raster-function example update

`src/examples/07-raster-function.json` becomes:

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
      "tiles": [{
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
      }],
      "tileSize": 256
    },
    "styles": [{
      "type": "raster",
      "paint": { "raster-opacity": "@@#params.opacity" },
      "layout": { "visibility": "@@#params.visibility" }
    }]
  },
  "params_config": [
    { "key": "threshold_1", "default": -10000, "min": -11000, "max": 6000, "step": 100, "group": "legend" },
    { "key": "color_1", "default": "#440154", "group": "legend" },
    { "key": "threshold_2", "default": 6000, "min": -10000, "max": 7000, "step": 100, "group": "legend" },
    { "key": "color_2", "default": "#fde725", "group": "legend" },
    { "key": "opacity", "default": 1.0, "min": 0, "max": 1, "step": 0.05 },
    { "key": "visibility", "default": "visible", "options": ["visible", "none"] }
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

The `rescale` param is removed — the interval format embeds data values directly.

## Files to modify

| File | Change |
|------|--------|
| `src/lib/colormap.ts` | **New** — `hexToRgba`, `interpolateColormap`, types |
| `src/lib/converter/functions.ts` | Register `buildColormap` function |
| `src/lib/gradient-serializer.ts` | Extend to sync `buildColormap.stops` on add/remove |
| `src/examples/07-raster-function.json` | Rewrite with `buildColormap` + editable params |
| `tests/lib/colormap.test.ts` | **New** — unit tests for `hexToRgba`, `interpolateColormap` |
| `tests/lib/converter/functions.test.ts` | Add `buildColormap` tests |
| `tests/lib/gradient-serializer.test.ts` | Add sync tests for buildColormap.stops |

## What stays unchanged

- `packages/vizz-json/` — nested function resolution already works
- `src/lib/converter/params-resolver.ts` — resolves nested param refs already
- `src/components/legends/gradient-legend.tsx` — rendering unchanged
- `src/components/legends/interactive-gradient-bar.tsx` — interaction unchanged
- `src/hooks/use-gradient-editor.ts` — state management unchanged
- `setQueryParams` — already JSON-stringifies objects in the query

## Verification

1. `pnpm test` — all tests pass including new colormap + serializer tests
2. `pnpm typecheck` — no type errors
3. `pnpm dev` → `/playground?example=raster-function`:
   - Tiles load at default zoom with 2-stop gradient (purple → yellow)
   - Change a stop color in the legend → tiles re-render with new color
   - Change a threshold value → tiles adjust (e.g., move the break point)
   - Add a stop → legend and tiles both show 3 colors, JSON updates correctly
   - Remove a stop → legend and tiles revert to fewer stops
   - Toggle opacity/visibility → still works
