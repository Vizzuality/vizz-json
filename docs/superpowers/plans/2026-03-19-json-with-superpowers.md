# JSON with Superpowers — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a TanStack Start showcase app demonstrating the `@@` convention for dynamic JSON configurations, with a landing page and interactive playground (Monaco editor + live MapLibre/deck.gl map).

**Architecture:** TanStack Start (React) app with two routes. The converter wraps `@deck.gl/json` adding `@@#params.X` resolution. The playground wires Monaco ↔ converter ↔ react-map-gl with auto-generated shadcn/ui controls. deck.gl layers use interleaved DeckGlOverlay.

**Tech Stack:** TanStack Start, shadcn/ui, react-map-gl, MapLibre GL JS, @deck.gl/json, @deck.gl/react, Monaco Editor, Tailwind CSS, Nitro, TypeScript strict.

**Spec:** `docs/superpowers/specs/2026-03-19-json-with-superpowers-design.md`

---

## File Structure

```
my-tanstack-app/
  src/
    routes/
      __root.tsx                        # Modified: conditional layout (landing vs playground)
      index.tsx                         # Landing page
      playground.tsx                    # Playground page
    components/
      landing/
        hero-section.tsx
        problem-section.tsx
        prefix-family-section.tsx
        how-it-works-section.tsx
        works-with-section.tsx
        cta-section.tsx
      playground/
        playground-layout.tsx           # Resizable 3-panel layout
        json-editor.tsx                 # Monaco editor wrapper
        map-renderer.tsx                # react-map-gl + DeckGlOverlay (interleaved)
        params-panel.tsx                # Auto-generated controls from params_config
        legend-panel.tsx                # Renders legend_config
        example-selector.tsx            # Dropdown to switch examples
        resolved-json-viewer.tsx        # Toggle to show resolved output
        status-indicator.tsx            # Green RESOLVED / red ERROR
      legends/
        basic-legend.tsx                # Registerable via @@type
        choropleth-legend.tsx
        gradient-legend.tsx
    lib/
      converter/
        params-resolver.ts              # @@#params.X pre-processing (recursive)
        converter-config.ts             # JSONConfiguration setup + React component registry
        functions.ts                    # setQueryParams, ifParam
        index.ts                        # Public API: resolve(json, params)
      types.ts                          # LayerSchema, ParamConfig, LegendConfig, ExampleConfig
      param-inference.ts                # Infer control type from param default value
    hooks/
      use-converter.ts                  # JSON string + params → resolved config (debounced)
      use-debounced-value.ts            # Generic debounce hook
    examples/
      index.ts                          # Export all examples as array
      01-raster-opacity.json
      02-vector-fill.json
      03-choropleth-match.json
      04-graduated-interpolate.json
      05-classified-step.json
      06-data-driven-circles.json
      07-raster-function.json
      08-deckgl-scatterplot.json
      09-conditional-case.json
      10-react-components.json
  tests/
    lib/
      converter/
        params-resolver.test.ts
        functions.test.ts
      param-inference.test.ts
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `my-tanstack-app/` (entire scaffold)
- Modify: `.gitignore` (add new project)

- [ ] **Step 1: Create TanStack Start project**

Note: `start` is NOT a valid add-on — it's the base framework. Drop it from the command.

```bash
cd /Users/miguelbarrenecheasanchez/Projects/json-with-superpowers
npx @tanstack/cli@latest create my-tanstack-app --add-ons table,tanstack-query,nitro,oRPC,paraglide,t3env,eslint,compiler --package-manager pnpm
```

Expected: Scaffold created at `my-tanstack-app/` with `src/routes/`, `vite.config.ts`, etc.

- [ ] **Step 2: Verify dev server starts**

```bash
cd my-tanstack-app
pnpm install
pnpm dev
```

Expected: Dev server starts on localhost:3000 (or similar). Verify in browser, then stop.

- [ ] **Step 3: Initialize shadcn/ui**

```bash
pnpm dlx shadcn@latest init --preset b3Qx371gu --base base --template-start
```

Expected: `components.json` created, shadcn/ui configured with the specified preset.

- [ ] **Step 4: Add shadcn/ui components we'll need**

```bash
pnpm dlx shadcn@latest add button card badge separator slider switch select input popover dropdown-menu tabs resizable
```

- [ ] **Step 5: Install map/editor dependencies**

```bash
pnpm add react-map-gl maplibre-gl @deck.gl/core @deck.gl/layers @deck.gl/json @deck.gl/react @deck.gl/mapbox @monaco-editor/react
```

- [ ] **Step 6: Install test dependencies**

```bash
pnpm add -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

Add vitest config to `vite.config.ts`:
```typescript
// Add to the default export:
test: {
  environment: 'jsdom',
  include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
}
```

Add test script to `package.json`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 7: Verify everything compiles**

```bash
pnpm build
```

Expected: Build succeeds with no errors.

- [ ] **Step 8: Commit**

```bash
git add my-tanstack-app
git commit -m "feat: scaffold TanStack Start project with shadcn/ui and map dependencies"
```

---

## Task 2: TypeScript Types

**Files:**
- Create: `src/lib/types.ts`

- [ ] **Step 1: Define core types**

```typescript
// src/lib/types.ts

export type ParamConfig = {
  readonly key: string;
  readonly default: unknown;
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly options?: readonly string[];
};

export type LegendItem = {
  readonly label: string;
  readonly value: string | number;
};

export type LegendConfig = {
  readonly type: "basic" | "choropleth" | "gradient";
  readonly items: readonly LegendItem[];
};

export type LayerConfig = {
  readonly source: Record<string, unknown>;
  readonly styles: readonly Record<string, unknown>[];
};

export type LayerSchema = {
  readonly config: LayerConfig | Record<string, unknown>; // Record for deck.gl configs
  readonly params_config: readonly ParamConfig[];
  readonly legend_config: LegendConfig;
};

export type ExampleMetadata = {
  readonly title: string;
  readonly description: string;
  readonly tier: "basic" | "intermediate" | "advanced";
};

export type ExampleConfig = LayerSchema & {
  readonly metadata: ExampleMetadata;
};

export type ParamControlType =
  | "slider"
  | "color_picker"
  | "switch"
  | "text_input"
  | "select"
  | "json_editor";

export type InferredParam = {
  readonly key: string;
  readonly value: unknown;
  readonly control_type: ParamControlType;
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly options?: readonly string[];
};

export type ResolvedParams = Readonly<Record<string, unknown>>;
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: add core TypeScript types for layer schema, params, and legends"
```

---

## Task 3: Params Resolver (TDD)

**Files:**
- Create: `src/lib/converter/params-resolver.ts`
- Test: `tests/lib/converter/params-resolver.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// tests/lib/converter/params-resolver.test.ts
import { describe, it, expect } from "vitest";
import { resolveParams } from "#/lib/converter/params-resolver";

describe("resolveParams", () => {
  it("resolves a simple @@#params.X string", () => {
    const json = { opacity: "@@#params.opacity" };
    const params = { opacity: 0.8 };
    expect(resolveParams(json, params)).toEqual({ opacity: 0.8 });
  });

  it("does not mutate the original object", () => {
    const json = { opacity: "@@#params.opacity" };
    const params = { opacity: 0.5 };
    const result = resolveParams(json, params);
    expect(result).not.toBe(json);
    expect(json.opacity).toBe("@@#params.opacity");
  });

  it("resolves nested objects recursively", () => {
    const json = {
      paint: {
        "fill-color": "@@#params.fill_color",
        "fill-opacity": "@@#params.opacity",
      },
    };
    const params = { fill_color: "#3b82f6", opacity: 0.7 };
    expect(resolveParams(json, params)).toEqual({
      paint: { "fill-color": "#3b82f6", "fill-opacity": 0.7 },
    });
  });

  it("resolves values inside arrays", () => {
    const json = {
      colors: ["@@#params.color1", "@@#params.color2"],
    };
    const params = { color1: "#ff0000", color2: "#00ff00" };
    expect(resolveParams(json, params)).toEqual({
      colors: ["#ff0000", "#00ff00"],
    });
  });

  it("resolves inside MapLibre expression arrays", () => {
    const json = {
      "fill-color": [
        "match",
        ["get", "category"],
        "forest", "@@#params.forest_color",
        "water", "@@#params.water_color",
        "@@#params.default_color",
      ],
    };
    const params = {
      forest_color: "#228B22",
      water_color: "#1E90FF",
      default_color: "#808080",
    };
    expect(resolveParams(json, params)).toEqual({
      "fill-color": [
        "match",
        ["get", "category"],
        "forest", "#228B22",
        "water", "#1E90FF",
        "#808080",
      ],
    });
  });

  it("passes through non-@@#params values unchanged", () => {
    const json = {
      type: "fill",
      opacity: 0.5,
      visible: true,
      data: null,
      color: "@@#params.color",
    };
    const params = { color: "#fff" };
    const result = resolveParams(json, params);
    expect(result.type).toBe("fill");
    expect(result.opacity).toBe(0.5);
    expect(result.visible).toBe(true);
    expect(result.data).toBeNull();
    expect(result.color).toBe("#fff");
  });

  it("resolves dot-notation for nested param access", () => {
    const json = { color: "@@#params.style.primary" };
    const params = { style: { primary: "#ff0" } };
    expect(resolveParams(json, params)).toEqual({ color: "#ff0" });
  });

  it("returns undefined for missing params (does not throw)", () => {
    const json = { color: "@@#params.missing" };
    const params = {};
    expect(resolveParams(json, params)).toEqual({ color: undefined });
  });

  it("does not resolve @@function, @@type, @@=, or @@# (non-params)", () => {
    const json = {
      "@@function": "setQueryParams",
      "@@type": "ScatterplotLayer",
      accessor: "@@=[lng, lat]",
      constant: "@@#GL.ONE",
    };
    const params = {};
    const result = resolveParams(json, params);
    expect(result["@@function"]).toBe("setQueryParams");
    expect(result["@@type"]).toBe("ScatterplotLayer");
    expect(result.accessor).toBe("@@=[lng, lat]");
    expect(result.constant).toBe("@@#GL.ONE");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm test -- tests/lib/converter/params-resolver.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement params resolver**

```typescript
// src/lib/converter/params-resolver.ts

const PARAMS_PREFIX = "@@#params.";

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function isParamsRef(value: unknown): value is string {
  return typeof value === "string" && value.startsWith(PARAMS_PREFIX);
}

function resolveValue(
  value: unknown,
  params: Readonly<Record<string, unknown>>
): unknown {
  if (isParamsRef(value)) {
    const path = value.slice(PARAMS_PREFIX.length);
    return getNestedValue(params as Record<string, unknown>, path);
  }

  if (Array.isArray(value)) {
    return value.map((item) => resolveValue(item, params));
  }

  if (value !== null && typeof value === "object") {
    return resolveObject(value as Record<string, unknown>, params);
  }

  return value;
}

function resolveObject(
  obj: Readonly<Record<string, unknown>>,
  params: Readonly<Record<string, unknown>>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = resolveValue(value, params);
  }
  return result;
}

export function resolveParams(
  json: Readonly<Record<string, unknown>>,
  params: Readonly<Record<string, unknown>>
): Record<string, unknown> {
  return resolveObject(json, params);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm test -- tests/lib/converter/params-resolver.test.ts
```

Expected: All 9 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/converter/params-resolver.ts tests/lib/converter/params-resolver.test.ts
git commit -m "feat: implement @@#params resolver with recursive resolution"
```

---

## Task 4: Registered Functions (TDD)

**Files:**
- Create: `src/lib/converter/functions.ts`
- Test: `tests/lib/converter/functions.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// tests/lib/converter/functions.test.ts
import { describe, it, expect } from "vitest";
import { registeredFunctions } from "#/lib/converter/functions";

describe("setQueryParams", () => {
  const fn = registeredFunctions.setQueryParams;

  it("appends query params to a URL", () => {
    const result = fn({
      url: "https://example.com/tiles",
      query: { colormap: "viridis", rescale: "0,100" },
    });
    expect(result).toContain("https://example.com/tiles?");
    expect(result).toContain("colormap=viridis");
    expect(result).toContain("rescale=0%2C100");
  });

  it("serializes object values as JSON", () => {
    const result = fn({
      url: "https://example.com",
      query: { colormap: { "11": "#7acaff", "17": "#000dff" } },
    });
    const url = new URL(result as string);
    const colormap = url.searchParams.get("colormap");
    expect(JSON.parse(colormap!)).toEqual({ "11": "#7acaff", "17": "#000dff" });
  });
});

describe("ifParam", () => {
  const fn = registeredFunctions.ifParam;

  it("returns 'then' when condition is truthy", () => {
    expect(fn({ condition: true, then: "visible", else: "none" })).toBe("visible");
  });

  it("returns 'else' when condition is falsy", () => {
    expect(fn({ condition: false, then: "visible", else: "none" })).toBe("none");
  });

  it("returns 'else' when condition is 0", () => {
    expect(fn({ condition: 0, then: "yes", else: "no" })).toBe("no");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm test -- tests/lib/converter/functions.test.ts
```

- [ ] **Step 3: Implement registered functions**

```typescript
// src/lib/converter/functions.ts

type SetQueryParamsProps = {
  readonly url: string;
  readonly query: Readonly<Record<string, unknown>>;
};

type IfParamProps = {
  readonly condition: unknown;
  readonly then: unknown;
  readonly else: unknown;
};

function setQueryParams({ url, query }: SetQueryParamsProps): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    const serialized =
      typeof value === "object" && value !== null
        ? JSON.stringify(value)
        : String(value);
    params.set(key, serialized);
  }
  return `${url}?${params.toString()}`;
}

function ifParam({ condition, then: thenValue, else: elseValue }: IfParamProps): unknown {
  return condition ? thenValue : elseValue;
}

export const registeredFunctions: Readonly<Record<string, (props: any) => unknown>> = {
  setQueryParams,
  ifParam,
};
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm test -- tests/lib/converter/functions.test.ts
```

Expected: All 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/converter/functions.ts tests/lib/converter/functions.test.ts
git commit -m "feat: implement registered functions (setQueryParams, ifParam)"
```

---

## Task 5: Converter Config & Public API

**Files:**
- Create: `src/lib/converter/converter-config.ts`
- Create: `src/lib/converter/index.ts`

- [ ] **Step 1: Create converter config**

```typescript
// src/lib/converter/converter-config.ts
import { JSONConfiguration, JSONConverter } from "@deck.gl/json";
import { ScatterplotLayer, HexagonLayer, GeoJsonLayer } from "@deck.gl/layers";
import { registeredFunctions } from "./functions";

export function createConverterConfig() {
  return new JSONConfiguration({
    classes: {
      ScatterplotLayer,
      HexagonLayer,
      GeoJsonLayer,
    },
    functions: { ...registeredFunctions },
    enumerations: {},
    constants: {},
    reactComponents: {},
  });
}

export function createConverter() {
  const configuration = createConverterConfig();
  return new JSONConverter({ configuration });
}
```

- [ ] **Step 2: Create public API**

```typescript
// src/lib/converter/index.ts
import { resolveParams } from "./params-resolver";
import { createConverter } from "./converter-config";
import type { ResolvedParams } from "../types";

export { resolveParams } from "./params-resolver";
export { createConverter, createConverterConfig } from "./converter-config";
export { registeredFunctions } from "./functions";

let converterInstance: ReturnType<typeof createConverter> | null = null;

function getConverter() {
  if (!converterInstance) {
    converterInstance = createConverter();
  }
  return converterInstance;
}

// Call this after registering React components (Task 16) to reset the singleton
export function resetConverter() {
  converterInstance = null;
}

function hasRemainingPrefixes(obj: unknown): boolean {
  if (typeof obj === "string") return obj.startsWith("@@");
  if (Array.isArray(obj)) return obj.some(hasRemainingPrefixes);
  if (obj !== null && typeof obj === "object") {
    return Object.entries(obj as Record<string, unknown>).some(
      ([k, v]) => k.startsWith("@@") || hasRemainingPrefixes(v)
    );
  }
  return false;
}

export function resolveConfig(
  config: Readonly<Record<string, unknown>>,
  params: ResolvedParams
): Record<string, unknown> {
  // Step 1: Resolve @@#params.X references
  const paramsResolved = resolveParams(config, params);

  // Step 2: Let @deck.gl/json handle @@type, @@function, @@=, @@#
  if (hasRemainingPrefixes(paramsResolved)) {
    return getConverter().convert(paramsResolved) as Record<string, unknown>;
  }

  return paramsResolved;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/converter/
git commit -m "feat: add converter config and public API combining params + deck.gl resolution"
```

---

## Task 6: Param Inference (TDD)

**Files:**
- Create: `src/lib/param-inference.ts`
- Test: `tests/lib/param-inference.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// tests/lib/param-inference.test.ts
import { describe, it, expect } from "vitest";
import { inferParamControl } from "#/lib/param-inference";

describe("inferParamControl", () => {
  it("infers slider for number defaults", () => {
    const result = inferParamControl({ key: "opacity", default: 0.8 });
    expect(result.control_type).toBe("slider");
    expect(result.value).toBe(0.8);
  });

  it("infers color_picker for hex color strings", () => {
    const result = inferParamControl({ key: "fill_color", default: "#3b82f6" });
    expect(result.control_type).toBe("color_picker");
  });

  it("infers switch for boolean defaults", () => {
    const result = inferParamControl({ key: "visibility", default: true });
    expect(result.control_type).toBe("switch");
  });

  it("infers text_input for plain strings", () => {
    const result = inferParamControl({ key: "data_url", default: "https://example.com" });
    expect(result.control_type).toBe("text_input");
  });

  it("infers select when options are provided", () => {
    const result = inferParamControl({
      key: "colormap",
      default: "viridis",
      options: ["viridis", "plasma", "inferno"],
    });
    expect(result.control_type).toBe("select");
    expect(result.options).toEqual(["viridis", "plasma", "inferno"]);
  });

  it("infers json_editor for object defaults", () => {
    const result = inferParamControl({
      key: "colormap",
      default: { "11": "#7acaff" },
    });
    expect(result.control_type).toBe("json_editor");
  });

  it("preserves min/max/step for numbers", () => {
    const result = inferParamControl({
      key: "opacity",
      default: 0.8,
      min: 0,
      max: 1,
      step: 0.1,
    });
    expect(result.min).toBe(0);
    expect(result.max).toBe(1);
    expect(result.step).toBe(0.1);
  });

  it("infers color_picker for 3-digit hex", () => {
    const result = inferParamControl({ key: "color", default: "#fff" });
    expect(result.control_type).toBe("color_picker");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm test -- tests/lib/param-inference.test.ts
```

- [ ] **Step 3: Implement param inference**

```typescript
// src/lib/param-inference.ts
import type { ParamConfig, InferredParam, ParamControlType } from "./types";

const HEX_COLOR_REGEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

function inferControlType(param: ParamConfig): ParamControlType {
  if (param.options && param.options.length > 0) {
    return "select";
  }

  const value = param.default;

  if (typeof value === "boolean") {
    return "switch";
  }

  if (typeof value === "number") {
    return "slider";
  }

  if (typeof value === "string" && HEX_COLOR_REGEX.test(value)) {
    return "color_picker";
  }

  if (typeof value === "string") {
    return "text_input";
  }

  if (typeof value === "object" && value !== null) {
    return "json_editor";
  }

  return "text_input";
}

export function inferParamControl(param: ParamConfig): InferredParam {
  return {
    key: param.key,
    value: param.default,
    control_type: inferControlType(param),
    min: param.min,
    max: param.max,
    step: param.step,
    options: param.options,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm test -- tests/lib/param-inference.test.ts
```

Expected: All 8 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/param-inference.ts tests/lib/param-inference.test.ts
git commit -m "feat: implement param control type inference from default values"
```

---

## Task 7: Hooks — useConverter & useDebouncedValue

**Files:**
- Create: `src/hooks/use-debounced-value.ts`
- Create: `src/hooks/use-converter.ts`

- [ ] **Step 1: Create debounce hook**

```typescript
// src/hooks/use-debounced-value.ts
import { useState, useEffect } from "react";

export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
```

- [ ] **Step 2: Create converter hook**

```typescript
// src/hooks/use-converter.ts
import { useMemo } from "react";
import { resolveConfig } from "#/lib/converter";
import type { ResolvedParams } from "#/lib/types";

type ConverterResult = {
  readonly resolved: Record<string, unknown> | null;
  readonly error: string | null;
};

export function useConverter(
  jsonString: string,
  params: ResolvedParams
): ConverterResult {
  return useMemo(() => {
    try {
      const parsed = JSON.parse(jsonString);
      const config = parsed.config ?? parsed;
      const resolved = resolveConfig(config, params);
      return { resolved, error: null };
    } catch (err) {
      return {
        resolved: null,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }, [jsonString, params]);
}
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/
git commit -m "feat: add useConverter and useDebouncedValue hooks"
```

---

## Task 8: Playground Route & Layout

**Files:**
- Create: `src/routes/playground.tsx`
- Create: `src/components/playground/playground-layout.tsx`
- Create: `src/components/playground/status-indicator.tsx`
- Modify: `src/routes/__root.tsx` (conditional layout)

- [ ] **Step 1: Create status indicator**

```typescript
// src/components/playground/status-indicator.tsx
import { Badge } from "#/components/ui/badge";

type StatusIndicatorProps = {
  readonly error: string | null;
};

export function StatusIndicator({ error }: StatusIndicatorProps) {
  if (error) {
    return (
      <Badge variant="destructive" className="gap-1.5">
        <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
        ERROR
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="gap-1.5 bg-green-950 text-green-400 border-green-800">
      <span className="h-2 w-2 rounded-full bg-green-400" />
      RESOLVED
    </Badge>
  );
}
```

- [ ] **Step 2: Create playground layout shell**

Use shadcn `ResizablePanelGroup` for the 3-panel layout. Left panel (editor) = 40%, right panel = 60% split vertically between map and params.

```typescript
// src/components/playground/playground-layout.tsx
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "#/components/ui/resizable";

type PlaygroundLayoutProps = {
  readonly topBar: React.ReactNode;
  readonly editor: React.ReactNode;
  readonly map: React.ReactNode;
  readonly params: React.ReactNode;
};

export function PlaygroundLayout({
  topBar,
  editor,
  map,
  params,
}: PlaygroundLayoutProps) {
  return (
    <div className="flex flex-col h-screen bg-background">
      {topBar}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={40} minSize={25}>
          {editor}
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={60} minSize={30}>
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={70} minSize={30}>
              {map}
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={30} minSize={15}>
              {params}
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
```

- [ ] **Step 3: Create playground route (skeleton)**

```typescript
// src/routes/playground.tsx
import { createFileRoute } from "@tanstack/react-router";
import { PlaygroundLayout } from "#/components/playground/playground-layout";

export const Route = createFileRoute("/playground")({
  component: PlaygroundPage,
});

function PlaygroundPage() {
  return (
    <PlaygroundLayout
      topBar={<div className="h-12 border-b bg-background px-4 flex items-center text-sm text-muted-foreground">Playground — loading...</div>}
      editor={<div className="h-full bg-[#1e1e1e] p-4 text-muted-foreground">Editor placeholder</div>}
      map={<div className="h-full bg-slate-900 flex items-center justify-center text-muted-foreground">Map placeholder</div>}
      params={<div className="h-full bg-background p-4 text-muted-foreground">Params placeholder</div>}
    />
  );
}
```

- [ ] **Step 4: Modify root layout for playground**

The playground needs full-screen layout (no Header/Footer). Modify `__root.tsx` to conditionally render Header/Footer based on the route. Check the generated `__root.tsx` for the exact structure, then wrap children:

```typescript
// In the RootDocument component, check if current path is /playground
// If so, render children without Header/Footer wrapper
// Use useRouterState() to check current location
```

The exact edit depends on the generated `__root.tsx`. Key change: wrap `<Header>` and `<Footer>` in a conditional that checks `location.pathname !== '/playground'`.

- [ ] **Step 5: Verify in browser**

```bash
pnpm dev
```

Navigate to `/playground`. Expected: 3-panel layout renders with placeholders.

- [ ] **Step 6: Commit**

```bash
git add src/routes/playground.tsx src/components/playground/ src/routes/__root.tsx
git commit -m "feat: add playground route with resizable 3-panel layout"
```

---

## Task 9: Monaco Editor Component

**Files:**
- Create: `src/components/playground/json-editor.tsx`

- [ ] **Step 1: Create Monaco editor wrapper**

```typescript
// src/components/playground/json-editor.tsx
import Editor, { type OnMount } from "@monaco-editor/react";
import { useCallback, useRef } from "react";

type JsonEditorProps = {
  readonly value: string;
  readonly onChange: (value: string) => void;
};

export function JsonEditor({ value, onChange }: JsonEditorProps) {
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

  const handleMount: OnMount = useCallback((editor) => {
    editorRef.current = editor;
  }, []);

  const handleChange = useCallback(
    (newValue: string | undefined) => {
      if (newValue !== undefined) {
        onChange(newValue);
      }
    },
    [onChange]
  );

  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-1.5 border-b bg-background flex justify-between items-center">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
          @@ Config JSON
        </span>
        <span className="text-[11px] text-muted-foreground/50">config.json</span>
      </div>
      <div className="flex-1">
        <Editor
          defaultLanguage="json"
          theme="vs-dark"
          value={value}
          onChange={handleChange}
          onMount={handleMount}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: "on",
          }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/playground/json-editor.tsx
git commit -m "feat: add Monaco JSON editor component"
```

---

## Task 10: Map Renderer Component

**Files:**
- Create: `src/components/playground/map-renderer.tsx`

- [ ] **Step 1: Create map renderer with react-map-gl + deck.gl interleaved overlay**

```typescript
// src/components/playground/map-renderer.tsx
import { Map, useControl } from "react-map-gl/maplibre";
import { MapboxOverlay } from "@deck.gl/mapbox";
import type { MapboxOverlayProps } from "@deck.gl/mapbox";
import "maplibre-gl/dist/maplibre-gl.css";

const BASEMAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
const INITIAL_VIEW = {
  longitude: 0,
  latitude: 20,
  zoom: 2,
};

function DeckGlOverlay(props: MapboxOverlayProps) {
  const overlay = useControl(() => new MapboxOverlay({ ...props, interleaved: true }));
  overlay.setProps({ ...props, interleaved: true });
  return null;
}

type MapRendererProps = {
  readonly resolvedConfig: Record<string, unknown> | null;
  readonly error: string | null;
};

export function MapRenderer({ resolvedConfig, error }: MapRendererProps) {
  // Extract MapLibre sources/styles from resolved config
  // For deck.gl configs, extract layers for the overlay
  // This is a simplified version — full implementation will parse resolvedConfig
  // to determine whether to add MapLibre layers or deck.gl layers

  return (
    <div className="h-full w-full relative">
      <Map
        initialViewState={INITIAL_VIEW}
        style={{ width: "100%", height: "100%" }}
        mapStyle={BASEMAP_STYLE}
      >
        <DeckGlOverlay layers={[]} />
      </Map>
      {error && (
        <div className="absolute top-2 left-2 right-2 bg-destructive/90 text-destructive-foreground px-3 py-2 rounded text-xs font-mono">
          {error}
        </div>
      )}
    </div>
  );
}
```

Note: The `MapRenderer` will need iteration in Task 14 (wiring) to properly handle both MapLibre source/style configs and deck.gl layer configs from the resolved JSON.

- [ ] **Step 2: Commit**

```bash
git add src/components/playground/map-renderer.tsx
git commit -m "feat: add MapRenderer with react-map-gl and interleaved deck.gl overlay"
```

---

## Task 11: Params Panel Component

**Files:**
- Create: `src/components/playground/params-panel.tsx`

- [ ] **Step 1: Create params panel with auto-generated shadcn/ui controls**

```typescript
// src/components/playground/params-panel.tsx
import { useCallback } from "react";
import { Slider } from "#/components/ui/slider";
import { Switch } from "#/components/ui/switch";
import { Input } from "#/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "#/components/ui/popover";
import { inferParamControl } from "#/lib/param-inference";
import type { ParamConfig, ResolvedParams } from "#/lib/types";

type ParamsPanelProps = {
  readonly paramsConfig: readonly ParamConfig[];
  readonly values: ResolvedParams;
  readonly onChange: (key: string, value: unknown) => void;
};

function ColorPickerControl({
  value,
  onChange,
}: {
  readonly value: string;
  readonly onChange: (v: string) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-md border-2 border-border"
            style={{ backgroundColor: value }}
          />
          <span className="text-xs font-mono text-muted-foreground">{value}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-32 h-32 cursor-pointer"
        />
      </PopoverContent>
    </Popover>
  );
}

function ParamControl({
  param,
  value,
  onChange,
}: {
  readonly param: ParamConfig;
  readonly value: unknown;
  readonly onChange: (value: unknown) => void;
}) {
  const inferred = inferParamControl(param);

  switch (inferred.control_type) {
    case "slider":
      return (
        <div className="flex items-center gap-3">
          <Slider
            value={[value as number]}
            onValueChange={([v]) => onChange(v)}
            min={inferred.min ?? 0}
            max={inferred.max ?? 1}
            step={inferred.step ?? 0.01}
            className="flex-1"
          />
          <span className="text-xs font-mono text-muted-foreground w-10 text-right">
            {(value as number).toFixed(2)}
          </span>
        </div>
      );

    case "color_picker":
      return (
        <ColorPickerControl
          value={value as string}
          onChange={onChange}
        />
      );

    case "switch":
      return (
        <Switch
          checked={value as boolean}
          onCheckedChange={onChange}
        />
      );

    case "select":
      return (
        <Select value={value as string} onValueChange={onChange}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {inferred.options?.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case "text_input":
      return (
        <Input
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 text-xs font-mono"
        />
      );

    case "json_editor":
      return (
        <Input
          value={JSON.stringify(value)}
          onChange={(e) => {
            try {
              onChange(JSON.parse(e.target.value));
            } catch {
              // ignore invalid JSON while typing
            }
          }}
          className="h-8 text-xs font-mono"
        />
      );
  }
}

export function ParamsPanel({ paramsConfig, values, onChange }: ParamsPanelProps) {
  return (
    <div className="h-full overflow-auto p-4">
      <div className="flex justify-between items-center mb-3">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
          Runtime Parameters
        </span>
        <span className="text-[11px] text-muted-foreground/50">
          Auto-generated from params_config
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {paramsConfig.map((param) => (
          <div key={param.key}>
            <label className="text-xs text-muted-foreground block mb-1.5">
              {param.key}
            </label>
            <ParamControl
              param={param}
              value={values[param.key] ?? param.default}
              onChange={(v) => onChange(param.key, v)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/playground/params-panel.tsx
git commit -m "feat: add ParamsPanel with auto-generated controls from params_config"
```

---

## Task 12: Legend Components

**Files:**
- Create: `src/components/legends/basic-legend.tsx`
- Create: `src/components/legends/choropleth-legend.tsx`
- Create: `src/components/legends/gradient-legend.tsx`
- Create: `src/components/playground/legend-panel.tsx`

- [ ] **Step 1: Create basic legend**

```typescript
// src/components/legends/basic-legend.tsx
import type { LegendItem } from "#/lib/types";

type BasicLegendProps = {
  readonly items: readonly LegendItem[];
};

export function BasicLegend({ items }: BasicLegendProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-sm border border-border"
            style={{ backgroundColor: typeof item.value === "string" ? item.value : undefined }}
          />
          <span className="text-xs text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create choropleth legend**

```typescript
// src/components/legends/choropleth-legend.tsx
import type { LegendItem } from "#/lib/types";

type ChoroplethLegendProps = {
  readonly items: readonly LegendItem[];
};

export function ChoroplethLegend({ items }: ChoroplethLegendProps) {
  return (
    <div className="flex flex-col gap-1">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className="w-6 h-4 rounded-sm"
            style={{ backgroundColor: typeof item.value === "string" ? item.value : undefined }}
          />
          <span className="text-xs text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create gradient legend**

```typescript
// src/components/legends/gradient-legend.tsx
import type { LegendItem } from "#/lib/types";

type GradientLegendProps = {
  readonly items: readonly LegendItem[];
};

export function GradientLegend({ items }: GradientLegendProps) {
  const colors = items
    .map((item) => (typeof item.value === "string" ? item.value : "#000"))
    .join(", ");

  return (
    <div>
      <div
        className="h-4 w-full rounded-sm"
        style={{ background: `linear-gradient(to right, ${colors})` }}
      />
      <div className="flex justify-between mt-1">
        {items.map((item, i) => (
          <span key={i} className="text-[10px] text-muted-foreground">
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create legend panel (delegates to legend type)**

```typescript
// src/components/playground/legend-panel.tsx
import type { LegendConfig } from "#/lib/types";
import { BasicLegend } from "#/components/legends/basic-legend";
import { ChoroplethLegend } from "#/components/legends/choropleth-legend";
import { GradientLegend } from "#/components/legends/gradient-legend";

type LegendPanelProps = {
  readonly config: LegendConfig | null;
};

const LEGEND_COMPONENTS = {
  basic: BasicLegend,
  choropleth: ChoroplethLegend,
  gradient: GradientLegend,
} as const;

export function LegendPanel({ config }: LegendPanelProps) {
  if (!config) return null;

  const LegendComponent = LEGEND_COMPONENTS[config.type];

  return (
    <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur border rounded-lg p-3 min-w-[140px]">
      <LegendComponent items={config.items} />
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/legends/ src/components/playground/legend-panel.tsx
git commit -m "feat: add legend components (basic, choropleth, gradient) and legend panel"
```

---

## Task 13: Example Store & Selector

**Files:**
- Create: `src/examples/index.ts`
- Create: `src/examples/01-raster-opacity.json`
- Create: `src/examples/02-vector-fill.json`
- Create: `src/components/playground/example-selector.tsx`

Start with 2 basic examples to get the pipeline working end-to-end. More examples in Tasks 15-17.

- [ ] **Step 1: Create Example 1 — Raster Opacity**

```json
// src/examples/01-raster-opacity.json
{
  "metadata": {
    "title": "Raster — COG with Opacity",
    "description": "Simple raster layer with parameterized opacity and visibility",
    "tier": "basic"
  },
  "config": {
    "source": {
      "type": "raster",
      "tiles": [
        "https://s2downloads.eox.at/demo/Sentinel-2/3857/{z}/{x}/{y}.png"
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
    { "key": "opacity", "default": 0.8, "min": 0, "max": 1, "step": 0.05 },
    { "key": "visibility", "default": "visible", "options": ["visible", "none"] }
  ],
  "legend_config": {
    "type": "basic",
    "items": [{ "label": "Sentinel-2 Imagery", "value": "visible" }]
  }
}
```

- [ ] **Step 2: Create Example 2 — Vector Fill**

```json
// src/examples/02-vector-fill.json
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
        }
      }
    ]
  },
  "params_config": [
    { "key": "fill_color", "default": "#3b82f6" },
    { "key": "outline_color", "default": "#1e3a5f" },
    { "key": "opacity", "default": 0.7, "min": 0, "max": 1, "step": 0.05 }
  ],
  "legend_config": {
    "type": "basic",
    "items": [
      { "label": "Countries", "value": "@@#params.fill_color" }
    ]
  }
}
```

- [ ] **Step 3: Create example store index**

```typescript
// src/examples/index.ts
import type { ExampleConfig } from "#/lib/types";

import example01 from "./01-raster-opacity.json";
import example02 from "./02-vector-fill.json";

export const examples: readonly ExampleConfig[] = [
  example01 as ExampleConfig,
  example02 as ExampleConfig,
];

export function getExampleById(index: number): ExampleConfig | undefined {
  return examples[index];
}
```

- [ ] **Step 4: Create example selector dropdown**

```typescript
// src/components/playground/example-selector.tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import { Badge } from "#/components/ui/badge";
import { examples } from "#/examples";

type ExampleSelectorProps = {
  readonly selectedIndex: number;
  readonly onSelect: (index: number) => void;
};

const TIER_COLORS = {
  basic: "bg-green-950 text-green-400 border-green-800",
  intermediate: "bg-yellow-950 text-yellow-400 border-yellow-800",
  advanced: "bg-orange-950 text-orange-400 border-orange-800",
} as const;

export function ExampleSelector({ selectedIndex, onSelect }: ExampleSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-muted-foreground uppercase tracking-wider">
        Example:
      </span>
      <Select
        value={String(selectedIndex)}
        onValueChange={(v) => onSelect(Number(v))}
      >
        <SelectTrigger className="h-8 w-[280px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {examples.map((ex, i) => (
            <SelectItem key={i} value={String(i)} className="text-xs">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${TIER_COLORS[ex.metadata.tier]}`}>
                  {ex.metadata.tier}
                </Badge>
                {ex.metadata.title}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/examples/ src/components/playground/example-selector.tsx
git commit -m "feat: add example store with 2 basic examples and selector dropdown"
```

---

## Task 14: Resolved JSON Viewer & Full Playground Wiring

**Files:**
- Create: `src/components/playground/resolved-json-viewer.tsx`
- Modify: `src/routes/playground.tsx` (full wiring)
- Modify: `src/components/playground/map-renderer.tsx` (handle resolved configs)

This is the integration task — wiring all components together with state management.

- [ ] **Step 1: Create resolved JSON viewer**

```typescript
// src/components/playground/resolved-json-viewer.tsx
import Editor from "@monaco-editor/react";

type ResolvedJsonViewerProps = {
  readonly resolved: Record<string, unknown> | null;
  readonly visible: boolean;
};

export function ResolvedJsonViewer({ resolved, visible }: ResolvedJsonViewerProps) {
  if (!visible || !resolved) return null;

  return (
    <div className="absolute inset-0 z-10 bg-background/95 backdrop-blur">
      <div className="px-3 py-1.5 border-b flex justify-between items-center">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
          Resolved Output
        </span>
        <span className="text-[11px] text-muted-foreground/50">read-only</span>
      </div>
      <Editor
        defaultLanguage="json"
        theme="vs-dark"
        value={JSON.stringify(resolved, null, 2)}
        options={{
          readOnly: true,
          minimap: { enabled: false },
          fontSize: 12,
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
        }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Enhance MapRenderer to handle resolved layer configs**

Rewrite `src/components/playground/map-renderer.tsx` with a `useMapLayers` hook that manages the full MapLibre source/layer lifecycle. Key pattern:

```typescript
// src/components/playground/map-renderer.tsx
import { Map, useMap } from "react-map-gl/maplibre";
import { MapboxOverlay } from "@deck.gl/mapbox";
import type { MapboxOverlayProps } from "@deck.gl/mapbox";
import { useEffect, useRef, useCallback } from "react";
import "maplibre-gl/dist/maplibre-gl.css";

const SOURCE_ID = "playground-source";
const BASEMAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
const INITIAL_VIEW = { longitude: 0, latitude: 20, zoom: 2 };

function DeckGlOverlay(props: MapboxOverlayProps) {
  const overlay = useControl(() => new MapboxOverlay({ ...props, interleaved: true }));
  overlay.setProps({ ...props, interleaved: true });
  return null;
}

function isDeckGlConfig(config: Record<string, unknown>): boolean {
  return "@@type" in config || "layers" in config;
}

function useMapLayers(
  resolvedConfig: Record<string, unknown> | null
) {
  const { current: map } = useMap();
  const layerIdsRef = useRef<string[]>([]);

  const clearLayers = useCallback(() => {
    if (!map) return;
    // Remove layers first (reverse order), then source
    for (const id of [...layerIdsRef.current].reverse()) {
      if (map.getLayer(id)) map.removeLayer(id);
    }
    layerIdsRef.current = [];
    if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
  }, [map]);

  useEffect(() => {
    if (!map || !resolvedConfig) return;
    // Skip deck.gl configs — those go through the overlay
    if (isDeckGlConfig(resolvedConfig)) return;

    const source = resolvedConfig.source as Record<string, unknown> | undefined;
    const styles = resolvedConfig.styles as Record<string, unknown>[] | undefined;
    if (!source || !styles) return;

    // Clear previous layers
    clearLayers();

    // Add source
    map.addSource(SOURCE_ID, source as maplibregl.SourceSpecification);

    // Add layers
    styles.forEach((style, i) => {
      const layerId = `playground-layer-${i}`;
      map.addLayer({
        id: layerId,
        source: SOURCE_ID,
        ...style,
      } as maplibregl.LayerSpecification);
      layerIdsRef.current.push(layerId);
    });

    return () => clearLayers();
  }, [map, resolvedConfig, clearLayers]);
}

// ... rest of MapRenderer component uses useMapLayers + DeckGlOverlay
```

For deck.gl configs: detect via `isDeckGlConfig()`, extract the layer instance from `resolvedConfig` (the converter returns an instantiated layer via `@@type`), and pass it as `layers={[resolvedConfig]}` to `DeckGlOverlay`.

The `useMapLayers` hook runs on every `resolvedConfig` change: clears old layers/source, adds new ones. Uses a stable `SOURCE_ID` so there's always at most one playground source.

- [ ] **Step 3: Wire playground route with full state management**

Update `src/routes/playground.tsx` to:
1. State: `selectedExampleIndex`, `jsonString`, `paramValues`, `showResolved`
2. When example changes: update `jsonString` from example, reset `paramValues` from `params_config` defaults
3. Use `useDebouncedValue(jsonString, 300)` for editor changes
4. Use `useConverter(debouncedJson, paramValues)` to get resolved config
5. Pass resolved config to `MapRenderer`
6. Pass `params_config` + `paramValues` to `ParamsPanel`
7. Render `LegendPanel` with resolved `legend_config` — **important:** `legend_config` items can contain `@@#params` references in their `value` and `label` fields. Run `resolveParams(example.legend_config, paramValues)` before passing to `LegendPanel` so legend colors/labels update reactively when params change.
8. Top bar: `ExampleSelector` + `StatusIndicator` + resolved JSON toggle button

- [ ] **Step 4: Verify in browser**

```bash
pnpm dev
```

Navigate to `/playground`. Expected: Example selector works, editor shows JSON, map renders layers, params panel shows controls, changing params updates the map.

- [ ] **Step 5: Commit**

```bash
git add src/routes/playground.tsx src/components/playground/
git commit -m "feat: wire playground with full state management and live resolution"
```

---

## Task 15: Intermediate Examples (3-6)

**Files:**
- Create: `src/examples/03-choropleth-match.json`
- Create: `src/examples/04-graduated-interpolate.json`
- Create: `src/examples/05-classified-step.json`
- Create: `src/examples/06-data-driven-circles.json`
- Modify: `src/examples/index.ts`

- [ ] **Step 1: Create Example 3 — Choropleth (match)**

Uses `match` expression with parameterized category colors. Data: Natural Earth countries with `income_grp` property.

```json
{
  "metadata": { "title": "Choropleth — match Expression", "description": "Category colors via match expression", "tier": "intermediate" },
  "config": {
    "source": {
      "type": "geojson",
      "data": "https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_50m_admin_0_countries.geojson"
    },
    "styles": [{
      "type": "fill",
      "paint": {
        "fill-color": [
          "match", ["get", "income_grp"],
          "1. High income: OECD", "@@#params.high_oecd_color",
          "2. High income: nonOECD", "@@#params.high_non_oecd_color",
          "3. Upper middle income", "@@#params.upper_middle_color",
          "4. Lower middle income", "@@#params.lower_middle_color",
          "5. Low income", "@@#params.low_income_color",
          "@@#params.default_color"
        ],
        "fill-opacity": "@@#params.opacity"
      }
    }]
  },
  "params_config": [
    { "key": "high_oecd_color", "default": "#2563eb" },
    { "key": "high_non_oecd_color", "default": "#60a5fa" },
    { "key": "upper_middle_color", "default": "#fbbf24" },
    { "key": "lower_middle_color", "default": "#f97316" },
    { "key": "low_income_color", "default": "#dc2626" },
    { "key": "default_color", "default": "#6b7280" },
    { "key": "opacity", "default": 0.8, "min": 0, "max": 1, "step": 0.05 }
  ],
  "legend_config": {
    "type": "choropleth",
    "items": [
      { "label": "High income: OECD", "value": "@@#params.high_oecd_color" },
      { "label": "High income: non-OECD", "value": "@@#params.high_non_oecd_color" },
      { "label": "Upper middle income", "value": "@@#params.upper_middle_color" },
      { "label": "Lower middle income", "value": "@@#params.lower_middle_color" },
      { "label": "Low income", "value": "@@#params.low_income_color" }
    ]
  }
}
```

- [ ] **Step 2: Create Example 4 — Graduated (interpolate)**

Uses `interpolate` with parameterized stops and colors. Data: countries with `pop_est`.

- [ ] **Step 3: Create Example 5 — Classified Breaks (step)**

Uses `step` with parameterized thresholds. Data: USGS earthquake GeoJSON feed.

- [ ] **Step 4: Create Example 6 — Data-Driven Circles (zoom + property)**

Uses nested `interpolate` with zoom and property-based scaling.

- [ ] **Step 5: Update example store index**

Add imports for examples 03-06 in `src/examples/index.ts`.

- [ ] **Step 6: Verify all intermediate examples in browser**

Load each example in the playground, verify expressions resolve correctly and params update the map.

- [ ] **Step 7: Commit**

```bash
git add src/examples/
git commit -m "feat: add intermediate examples (choropleth, graduated, classified, data-driven)"
```

---

## Task 16: Advanced Examples (7-10)

**Files:**
- Create: `src/examples/07-raster-function.json`
- Create: `src/examples/08-deckgl-scatterplot.json`
- Create: `src/examples/09-conditional-case.json`
- Create: `src/examples/10-react-components.json`
- Modify: `src/examples/index.ts`
- Modify: `src/lib/converter/converter-config.ts` (register React legend components)

- [ ] **Step 1: Create Example 7 — Raster with @@function**

Uses `@@function: "setQueryParams"` to build TiTiler tile URLs.

- [ ] **Step 2: Create Example 8 — deck.gl ScatterplotLayer**

Uses `@@type: "ScatterplotLayer"`, `@@=[longitude, latitude]` for position accessor.

- [ ] **Step 3: Create Example 9 — Conditional (case + @@function)**

Uses `case` expression with `@@#params.threshold` and `@@function: "ifParam"`.

- [ ] **Step 4: Create Example 10 — React Components via @@type**

Uses `@@type: "GradientLegend"` to render a legend component from JSON.

- [ ] **Step 5: Register React legend components in converter config**

```typescript
// Update src/lib/converter/converter-config.ts
import { GradientLegend } from "#/components/legends/gradient-legend";
import { ChoroplethLegend } from "#/components/legends/choropleth-legend";
import { BasicLegend } from "#/components/legends/basic-legend";

// In createConverterConfig():
reactComponents: {
  GradientLegend,
  ChoroplethLegend,
  BasicLegend,
},
```

- [ ] **Step 6: Update example store index**

- [ ] **Step 7: Verify all advanced examples in browser**

- [ ] **Step 8: Commit**

```bash
git add src/examples/ src/lib/converter/converter-config.ts
git commit -m "feat: add advanced examples (@@function, @@type, case, React components)"
```

---

## Task 17: Landing Page

**Files:**
- Create: `src/components/landing/hero-section.tsx`
- Create: `src/components/landing/problem-section.tsx`
- Create: `src/components/landing/prefix-family-section.tsx`
- Create: `src/components/landing/how-it-works-section.tsx`
- Create: `src/components/landing/works-with-section.tsx`
- Create: `src/components/landing/cta-section.tsx`
- Modify: `src/routes/index.tsx`

Use the `superpowers:frontend-design` skill for this task to ensure high design quality.

- [ ] **Step 1: Create all 6 landing page section components**

Each component is a self-contained section using shadcn/ui Card, Badge, Separator, etc. Content comes directly from the spec:

1. **HeroSection** — Title "JSON with Superpowers", subtitle, Vizzuality attribution, CTA Button linking to `/playground`
2. **ProblemSection** — Side-by-side code blocks: static vs dynamic JSON
3. **PrefixFamilySection** — 5-row grid showing each `@@` prefix with description and example
4. **HowItWorksSection** — Architecture flow diagram (CMS → @@ → converter → resolved → consumer)
5. **WorksWithSection** — 4-card icon grid: MapLibre, deck.gl, Charts, Any JSON
6. **CtaSection** — "Open the Playground" button with tagline

- [ ] **Step 2: Update index route**

```typescript
// src/routes/index.tsx
import { createFileRoute } from "@tanstack/react-router";
import { HeroSection } from "#/components/landing/hero-section";
import { ProblemSection } from "#/components/landing/problem-section";
import { PrefixFamilySection } from "#/components/landing/prefix-family-section";
import { HowItWorksSection } from "#/components/landing/how-it-works-section";
import { WorksWithSection } from "#/components/landing/works-with-section";
import { CtaSection } from "#/components/landing/cta-section";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      <HeroSection />
      <ProblemSection />
      <PrefixFamilySection />
      <HowItWorksSection />
      <WorksWithSection />
      <CtaSection />
    </main>
  );
}
```

- [ ] **Step 3: Verify landing page in browser**

```bash
pnpm dev
```

Navigate to `/`. Expected: All 6 sections render correctly with dark theme.

- [ ] **Step 4: Commit**

```bash
git add src/components/landing/ src/routes/index.tsx
git commit -m "feat: add landing page with all 6 sections"
```

---

## Task 18: Final Verification & Cleanup

- [ ] **Step 1: Run full test suite**

```bash
pnpm test
```

Expected: All tests pass.

- [ ] **Step 2: Run linter**

```bash
pnpm lint
```

Fix any lint errors.

- [ ] **Step 3: Run build**

```bash
pnpm build
```

Expected: Production build succeeds.

- [ ] **Step 4: Manual smoke test**

1. Navigate to `/` — landing page renders correctly
2. Click "Try the Playground" — navigates to `/playground`
3. Load each of the 10 examples via the selector
4. For each example: verify map renders, params panel shows controls, editing params updates the map
5. Edit JSON in Monaco — verify map updates on save
6. Toggle "View Resolved JSON" — verify resolved output is shown
7. Introduce a JSON syntax error — verify red ERROR status indicator

- [ ] **Step 5: Commit any fixes**

```bash
git add -A
git commit -m "chore: final cleanup and lint fixes"
```
