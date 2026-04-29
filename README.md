# VizzJson

A JSON templating system for geospatial visualization using the `@@` prefix convention. Define parameterized MapLibre/deck.gl map configurations in plain JSON and resolve them at runtime with live controls.

Built as an internal [Vizzuality](https://www.vizzuality.com/) showcase.

## The `@@` Prefix Convention

VizzJson introduces a set of prefixes that turn static JSON into dynamic, parameterized configurations:

| Prefix        | Purpose                                  | Example                          |
| ------------- | ---------------------------------------- | -------------------------------- |
| `@@#params.X` | Runtime parameter (dot notation)         | `"opacity": "@@#params.opacity"` |
| `@@function:` | Call a registered function               | `"@@function:setQueryParams"`    |
| `@@type:`     | Instantiate a deck.gl layer or component | `"@@type:ScatterplotLayer"`      |
| `@@=[expr]`   | Evaluate a JS expression                 | `"@@=[props.value * 2]"`         |
| `@@#GL.`      | OpenGL constant                          | `"@@#GL.POINTS"`                 |

### Quick Example

```json
{
  "config": {
    "source": {
      "type": "raster",
      "tiles": ["https://tiles.example.com/{z}/{y}/{x}.jpg"]
    },
    "styles": [
      {
        "type": "raster",
        "paint": { "raster-opacity": "@@#params.opacity" },
        "layout": { "visibility": "@@#params.visibility" }
      }
    ]
  },
  "params_config": [
    { "key": "opacity", "default": 0.8, "min": 0, "max": 1, "step": 0.05 },
    {
      "key": "visibility",
      "default": "visible",
      "options": ["visible", "none"]
    }
  ]
}
```

The playground auto-infers UI controls from `params_config` — sliders for numeric ranges, dropdowns for options, color pickers for hex values, switches for booleans.

## Resolution Pipeline

```
JSON config
  → parse & extract params_config
  → render parameter controls
  → user adjusts params
  → Stage 1: resolveParams() — replaces @@#params.* with values
  → Stage 2: JSONConverter — resolves @@function:, @@type:, @@=[], @@#GL.
  → map renders + legend resolves
```

All resolution is immutable — original configs are never mutated.

## Getting Started

```bash
pnpm install
pnpm dev        # Dev server on http://localhost:3000
```

## Commands

| Command           | Description                |
| ----------------- | -------------------------- |
| `pnpm dev`        | Dev server on :3000        |
| `pnpm build`      | Production build           |
| `pnpm test`       | Run all tests (vitest)     |
| `pnpm test:watch` | Tests in watch mode        |
| `pnpm lint`       | ESLint check               |
| `pnpm format`     | Prettier check             |
| `pnpm check`      | Auto-fix lint + formatting |
| `pnpm typecheck`  | TypeScript type checking   |

## Routes

| Route           | Description                                                                        |
| --------------- | ---------------------------------------------------------------------------------- |
| `/`             | Landing page                                                                       |
| `/playground`   | Interactive editor with Monaco, parameter controls, map renderer, and legend panel |
| `/presentation` | Full-screen slide deck walking through the system                                  |
| `/guidelines`   | Documentation for params, functions, types, expressions, and legends               |

## Project Structure

```
src/
├── lib/converter/           # Core resolution engine
│   ├── index.ts             #   resolveConfig() entry point
│   ├── params-resolver.ts   #   Stage 1: @@#params.* resolution
│   └── converter-config.ts  #   Stage 2: deck.gl JSONConverter
├── lib/param-inference.ts   # Auto-detect UI control type from param config
├── lib/types.ts             # Core types (LayerSchema, ParamConfig, etc.)
├── examples/                # 9 progressive JSON configs (basic → advanced)
├── hooks/use-converter.ts   # React hook wrapping resolveConfig()
├── components/                 # Pure UI / cross-cutting
│   ├── ui/                     #   shadcn primitives
│   ├── legends/                #   Basic, choropleth, gradient legend components
│   └── resolver/               #   React components registered as @@type targets
├── containers/                 # Feature/business components
│   ├── layout/                 #   Header, footer, theme + locale switchers
│   ├── landing/                #   Landing page sections
│   ├── playground/             #   Monaco editor, map, param controls, legend
│   ├── presentation/           #   Slide deck components
│   └── guidelines/             #   Guidelines page sections
└── routes/                     # File-based routing (TanStack Router)
```

## Tech Stack

- **Framework:** TanStack Start (full-stack React 19) with file-based routing
- **Mapping:** MapLibre GL + deck.gl via react-map-gl
- **Editor:** Monaco Editor
- **Styling:** Tailwind CSS v4 + shadcn/ui (base-nova)
- **Testing:** Vitest + Playwright
- **i18n:** Paraglide.js

## Examples

The playground includes 9 progressive examples in `src/examples/`:

| #   | Example                          | Tier         |
| --- | -------------------------------- | ------------ |
| 01  | Raster Opacity & Visibility      | Basic        |
| 02  | Vector Fill Color                | Intermediate |
| 03  | Choropleth Match Expression      | Intermediate |
| 04  | Graduated Interpolate            | Intermediate |
| 05  | Classified Step Expression       | Intermediate |
| 06  | Data-Driven Circles              | Intermediate |
| 07  | Raster with Registered Functions | Advanced     |
| 09  | Conditional Case Expression      | Advanced     |
| 10  | React Component Composition      | Advanced     |

## Testing

Tests live in `tests/` mirroring the `src/` structure. Core converter logic has full coverage — params resolution, function calls, immutability verification, nested object/array handling.

```bash
pnpm test                                          # All tests
pnpm test -- tests/lib/converter/functions.test.ts  # Single file
```

## Releases

The core resolution engine is published to npm as [`@vizzuality/vizz-json`](https://www.npmjs.com/package/@vizzuality/vizz-json).

```bash
npm install @vizzuality/vizz-json
```

It exposes two entry points:

| Entry | Import                        | Description                                 |
| ----- | ----------------------------- | ------------------------------------------- |
| Main  | `@vizzuality/vizz-json`       | `resolveConfig()`, `resolveParams()`, types |
| React | `@vizzuality/vizz-json/react` | React hook and components                   |

Releases are automated via [Release Please](https://github.com/googleapis/release-please). Merging to `main` triggers a release PR; merging the release PR publishes to npm and creates a GitHub release.

The package changelog lives at [`packages/vizz-json/CHANGELOG.md`](packages/vizz-json/CHANGELOG.md).

## License

MIT
