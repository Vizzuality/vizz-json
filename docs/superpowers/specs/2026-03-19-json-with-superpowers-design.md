# JSON with Superpowers — Design Spec

**Date:** 2026-03-19
**Author:** Vizzuality Frontend Team
**Status:** Draft

## Overview

An internal showcase application demonstrating the `@@` convention — a library-agnostic JSON templating technique that turns static JSON into dynamic, parameterized configurations. Built as a TanStack Start app with two pages: a landing page presenting the convention and an interactive playground sandbox.

## Target Audience

Vizzuality internal team — developers and stakeholders familiar with mapping concepts.

## Architecture

### Tech Stack

| Layer | Technology |
|---|---|
| Framework | TanStack Start (React) + TanStack Router, Query, Table |
| Styling | Tailwind CSS (dark theme) |
| Map rendering | react-map-gl (MapLibre GL JS) + @deck.gl/react |
| JSON converter | @deck.gl/json extended with `@@#params.X` support |
| Code editor | Monaco Editor |
| Server | Nitro (via TanStack Start) |
| Build | Vinxi |
| Code quality | ESLint + React Compiler + TypeScript strict |
| i18n | Paraglide |
| Env validation | t3-env |
| API layer | oRPC |

### Dependency on @deck.gl/json

The project uses `@deck.gl/json` as a dependency and extends it with `@@#params.X` parameter injection support. This is a wrapper/plugin approach — no fork. The extension adds a pre-processing step that resolves `@@#params.*` references from a runtime params object before passing to the standard deck.gl JSON converter.

### Data Sources

Free/public sources for initial implementation:
- **Basemap:** OpenFreeMap or MapTiler free tier
- **Vector tiles:** Natural Earth via public tile servers
- **Raster COG:** AWS Open Data (e.g., Sentinel, elevation data)
- **GeoJSON:** USGS earthquake feed, Natural Earth GeoJSON
- **deck.gl data:** Public datasets from vis.gl examples

Can be swapped for Vizzuality-specific sources later.

## Pages

### 1. Landing Page (`/`)

Single-scroll page with 6 sections:

#### 1.1 Hero
- Title: "JSON with Superpowers"
- Subtitle: The `@@` convention for turning static JSON into dynamic, parameterized configurations
- Attribution: Vizzuality Frontend Team
- CTA button → playground

#### 1.2 The Problem
- Side-by-side comparison: static hardcoded JSON vs dynamic `@@` JSON
- Shows the same config with and without `@@` prefixes

#### 1.3 The @@ Prefix Family
Compact reference grid showing all 5 prefixes:

| Prefix | Purpose | Example |
|---|---|---|
| `@@#params.X` | Runtime parameter injection | `"@@#params.opacity"` → `0.8` |
| `@@function` | Named function dispatch | `"@@function": "setQueryParams"` → built URL |
| `@@type` | Class instantiation | `"@@type": "ScatterplotLayer"` → `new ScatterplotLayer()` |
| `@@=` | Inline expression → function | `"@@=[lng, lat]"` → `(d) => [d.lng, d.lat]` |
| `@@#ENUM.X` | Constant/enum resolution | `"@@#GL.ONE"` → `1` |

#### 1.4 How It Works
Architecture flow diagram:
```
CMS/API → Static JSON (with @@ placeholders) + Runtime params (from UI/state)
  → json-converter (recursive resolution)
  → Resolved config (plain JS objects)
  → ANY consumer: MapLibre, deck.gl, ArcGIS, Leaflet, Charts...
```

#### 1.5 Works With Everything
Icon grid: MapLibre, deck.gl, Charts, Any JSON — showing library-agnostic nature.

#### 1.6 CTA Footer
"Open the Playground" button with tagline: "Edit JSON. Tweak params. See it resolve live."

### 2. Playground Page (`/playground`)

Full-screen interactive sandbox.

#### Layout (3-panel split)

- **Left panel (40%):** Monaco editor showing `@@`-annotated JSON config
- **Right panel top (flexible):** Live map via react-map-gl (MapLibre + deck.gl overlay)
- **Right panel bottom (160px):** Auto-generated params panel

#### Top Bar
- Example selector dropdown (loads pre-built examples)
- Resolution status indicator (green "RESOLVED" / red "ERROR")
- "View Resolved JSON" toggle button

#### Params Panel — Auto-Generated Controls
Controls are inferred from the `params[]` array in the JSON config:
- `number` → slider (with min/max/step if specified)
- `string` matching hex color pattern → color picker
- `boolean` → toggle switch
- `string` (other) → text input
- `object` → inline JSON editor (e.g., colormap objects)
- `string` with `options` array in param definition → select dropdown

#### Key Interactions

1. **Edit JSON → map updates:** Monaco editor changes trigger debounced re-resolution through the converter. Map updates in real-time.
2. **Params panel → JSON syncs:** Changing a slider/picker updates the runtime params AND highlights the corresponding `@@#params` reference in the Monaco editor.
3. **Example switcher:** Loading a new example replaces the JSON in Monaco, regenerates the params panel, and re-renders the map.
4. **Resolved JSON toggle:** Shows the post-converter output — plain JS objects with all `@@` prefixes resolved. Makes the before/after transformation visible.
5. **Error handling:** Invalid JSON or unresolvable `@@` references show inline errors in Monaco and a red status indicator.

## Playground Examples

### Tier 1: Basic — Parameter Injection

#### Example 1: Raster — COG with Opacity
Simple raster layer demonstrating `@@#params` basics.
- **Params:** opacity (slider 0–1), visibility (toggle)
- **@@ features:** `@@#params.opacity`, `@@#params.visibility`
- **Data:** Public COG from AWS Open Data

#### Example 2: Vector — Simple Fill
Vector fill layer with parameterized color and opacity.
- **Params:** fillColor (picker), outlineColor (picker), opacity (slider)
- **@@ features:** `@@#params.fillColor`, `@@#params.opacity`, `@@#params.outlineColor`
- **Data:** Natural Earth countries

### Tier 2: Intermediate — MapLibre Expressions + Params

#### Example 3: Choropleth — `match` Expression
Country polygons colored by category using `match`. Each category color is parameterized.
- **Params:** forestColor, waterColor, urbanColor, defaultColor (all pickers)
- **Expressions:** `match`, `get`
- **Data:** Natural Earth with land cover categories

#### Example 4: Graduated — `interpolate` Expression
Continuous color ramp based on a numeric property. Breakpoint stops and colors are parameterized.
- **Params:** stopLow/stopMid/stopHigh (sliders), colorLow/colorMid/colorHigh (pickers)
- **Expressions:** `interpolate` (linear), `get`
- **Data:** Country polygons with population data

#### Example 5: Classified Breaks — `step` Expression
Discrete color classes with parameterized thresholds.
- **Params:** break1/break2 (sliders), color1/color2/color3 (pickers)
- **Expressions:** `step`, `get`
- **Data:** USGS earthquake feed (point data with magnitude)

#### Example 6: Data-Driven Circles — Zoom + Property
Circle radius scales with both zoom level and a data property using nested `interpolate`.
- **Params:** scaleLow (slider), scaleHigh (slider), color (picker)
- **Expressions:** `interpolate` (linear), `get`, `zoom`, `*` (math)
- **Data:** Cities with population

### Tier 3: Advanced — Full @@ Family

#### Example 7: Raster COG — `@@function` URL Builder
TiTiler raster with `@@function` to build tile URLs from parameterized colormap and rescale values.
- **Params:** colormap (select), rescale (range slider), opacity (slider)
- **@@ features:** `@@function` (setQueryParams), `@@#params`
- **Data:** Public COG via TiTiler

#### Example 8: deck.gl — ScatterplotLayer
Full deck.gl layer using `@@type` for class instantiation and `@@=` for accessor expressions.
- **Params:** dataUrl (text), scale (slider), pointColor (picker), opacity (slider)
- **@@ features:** `@@type`, `@@=`, `@@#params`
- **Data:** Public earthquake/city dataset

#### Example 9: Conditional Styling — `case` + `@@function`
Multi-layer config with conditional logic combining MapLibre `case` expression and `@@function`.
- **Params:** threshold (slider), aboveColor/belowColor (pickers), showLabels (toggle)
- **Expressions:** `case`, `get`, `>` (comparison)
- **@@ features:** `@@function` (ifParam), `@@#params`
- **Data:** Country polygons with numeric indicator

### Expression Coverage Matrix

| Example | match | interpolate | step | case | get | zoom | math | @@func | @@type | @@= |
|---|---|---|---|---|---|---|---|---|---|---|
| 1. Raster | — | — | — | — | — | — | — | — | — | — |
| 2. Vector Fill | — | — | — | — | — | — | — | — | — | — |
| 3. Choropleth | ✓ | — | — | — | ✓ | — | — | — | — | — |
| 4. Graduated | — | ✓ | — | — | ✓ | — | — | — | — | — |
| 5. Classified | — | — | ✓ | — | ✓ | — | — | — | — | — |
| 6. Data-Driven | — | ✓ | — | — | ✓ | ✓ | ✓ | — | — | — |
| 7. Raster+func | — | — | — | — | — | — | — | ✓ | — | — |
| 8. deck.gl | — | — | — | — | — | — | — | — | ✓ | ✓ |
| 9. Conditional | — | — | — | ✓ | ✓ | — | ✓ | ✓ | — | — |

## Key Components

### ParamsExtension
Wraps `@deck.gl/json`'s `JSONConverter` to add `@@#params.X` resolution as a pre-processing step before standard `@@` resolution.

### ParamsPanel
React component that reads the `params[]` array from the JSON config and auto-generates UI controls based on type inference:
- Number → slider
- Hex color string → color picker
- Boolean → toggle
- String → text input
- Object with `options` → select dropdown

### MapRenderer
React component using react-map-gl that accepts resolved config and renders MapLibre layers. For deck.gl examples, uses `@deck.gl/react`'s `DeckGL` component overlaid on the MapLibre map via react-map-gl's interleaving support.

### ExampleStore
Holds the 9 pre-built example configs as static JSON files. Each example is a single JSON file with a canonical structure:
```json
{
  "metadata": { "title": "...", "description": "...", "tier": "basic|intermediate|advanced" },
  "params": [
    { "key": "opacity", "default": 0.8 },
    { "key": "fillColor", "default": "#3b82f6" }
  ],
  "source": { ... },
  "styles": [ ... ]
}
```
The `params` array is always embedded in the config — no separate files. The `ParamsPanel` reads `config.params` to auto-generate controls.

## Non-Goals (Parked for Later)

- **JSON Schema proposal for MapLibre style spec** — Research complete (gap confirmed, MapLibre TSC supports it), but implementation deferred to a future iteration.
- **Custom converter fork** — Using `@deck.gl/json` as dependency, not forking.
- **Authentication/multi-user** — Internal tool, no auth needed.
- **Persistence/saving** — Examples are read-only presets. User edits are ephemeral (session only).
