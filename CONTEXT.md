# VizzJson — Domain Glossary

Shared vocabulary for the codebase. Use these terms exactly in code, plans, comments, and discussion. Drift is friction.

## Core concepts

**VizzJson** — JSON templating system for geospatial visualization. Resolves a parameterized JSON config against runtime values to produce a renderable spec for the chosen renderer (deck.gl, MapLibre, or Mapbox).

**Config** — Authored JSON document describing a map. Contains `params_config`, `legend_config`, and the renderable config tree. May contain `@@`-prefixed values that resolve at runtime.

**`@@` prefix convention** — Reserved value prefix marking a directive instead of a literal. Variants:

- `@@#params.<key>` — runtime param reference (dot-notation for nested keys; embedded references inside strings allowed).
- `@@function:<name>` — call into the registered function table.
- `@@type:<Type>` — instantiate a deck.gl layer or React component class.
- `@@=[<expr>]` — JS expression evaluation.
- `@@#GL.<CONST>` — OpenGL constant lookup.

**Param** — A single tunable value bound to a UI control. Each param has a `ParamConfig` (type, range, options, default) and a `value` at runtime.

**Param config / param value split** — Authoring (the `ParamConfig`) is static metadata; runtime state (`value`) is mutated by UI controls. Both feed into resolution.

## Pipeline stages

**Params resolution** — Stage 1. Walks the Config and substitutes `@@#params.X` references with the matching runtime values. Pure, immutable. Lives in `src/lib/converter/params-resolver.ts`. The renderable config tree is left untouched.

**vizz-json conversion** — Stage 2. Hands the params-resolved JSON to the `@vizzuality/vizz-json` converter, which interprets `@@function:`, `@@type:`, `@@=`, `@@#GL.`. Lives in `src/lib/converter/converter-config.ts`.

**Param inference** — Classification step that maps a `ParamConfig` to an `InferredParam` describing which UI control to render (slider, color picker, switch, select, …). Lives in `src/lib/param-inference.ts`.

**Legend binding** — The relationship between `legend_config` entries and the params they read from. Extracted via regex over the legend config; orphan params (controls present but unused by the legend) are detected here. Lives in `src/lib/legend-param-mapping.ts`.

**Resolution Pipeline** — The full sequence applied by every consumer (playground, AI page): infer controls → resolve params → run vizz-json converter → bind legend → surface orphans. Currently inlined at every call site; candidate for deepening.

## AI features

**AI session** — One round-trip with the LLM to author or edit a Config. Composed of: prompt construction (system + few-shot), streaming completion, schema validation (Zod envelope), style validation (custom rules), retry on style failure, post-process decode (envelope → `{config, params_config, legend_config, metadata}`), persistence to IndexedDB.

**ParameterizeEntry** — AI-side instruction to lift a literal value out of the renderable config tree into a `@@#params.X` reference plus a new `ParamConfig` entry. Decoded by `src/lib/ai/post-process.ts`.

**Few-shot** — Curated authored examples included verbatim in the system prompt to shape AI output. Lives in `src/lib/ai/few-shot.ts`.

**Style validator** — Post-parse correctness checks that the LLM output follows VizzJson conventions (matching `@@` prefixes, params-config consistency, legend-config consistency). Failure triggers a retry. Lives in `src/lib/ai/style-validator.ts`.

## Editing surfaces

**Playground** — Interactive editor at `/playground`: Monaco JSON editor + param controls + map + legend. Authoring the Config by hand.

**AI page** — Chat-driven editor at `/ai`: user prompts → AI session → resolved Config + params + legend. Sidebar rail switches between Chat / JSON / Config / My area panels; map is always live.

**Presentation** — Slide deck at `/presentation` walking the `@@` convention.

## Gradient binding

**Gradient binding** — Round-trip between a `buildColormap` invocation in the Config and the editable stops shown by the legend's gradient editor. Parsing stops out of the Config, mutating them, and writing back (which may inject new `@@#params.X` references) is one logical operation. Currently spread across `gradient-types`, `gradient-stops-init`, `gradient-serializer`, `gradient-css`, `use-gradient-editor`, plus 5 legend components.
