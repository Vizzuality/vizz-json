# Inline Legend Editing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate parameter editing directly into legend components via popovers, replacing the separated preview + controls layout.

**Architecture:** A pure extraction utility maps raw `@@#params.*` references in legend items to their param keys. Legend components gain optional edit props that enable hover highlights and row/bar popovers with inline color pickers and text inputs. Orphan legend params render below the legend in `LegendCard`.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, shadcn/ui Popover (base-ui), Vitest

**Spec:** `docs/superpowers/specs/2026-03-20-inline-legend-editing-design.md`

---

## File Structure

| File | Responsibility |
|------|----------------|
| `src/lib/legend-param-mapping.ts` | **New** — Pure functions: `extractLegendParamKeys()`, `getOrphanLegendParams()`, and the `ItemParamMapping`/`RawLegendConfig` types |
| `tests/lib/legend-param-mapping.test.ts` | **New** — Unit tests for extraction and orphan logic |
| `src/components/legends/color-input.tsx` | **New** — Shared inline `<input type="color">` component used by all editable legends |
| `src/components/legends/basic-legend.tsx` | Add optional `LegendEditProps`, row hover + popover |
| `src/components/legends/choropleth-legend.tsx` | Add optional `LegendEditProps`, row hover + popover |
| `src/components/legends/gradient-legend.tsx` | Add optional `LegendEditProps`, bar hover + single popover |
| `src/components/playground/legend-card.tsx` | Wire extraction → legend components, render orphan params below |
| `src/components/playground/params-panel.tsx` | Thread `rawLegendConfig` prop to `LegendCard` |
| `src/routes/playground.tsx` | Extract raw `legend_config` from parsed JSON, pass to `ParamsPanel` |

---

## Task 1: Param Extraction Utility — Types and `extractLegendParamKeys`

**Files:**
- Create: `src/lib/legend-param-mapping.ts`
- Create: `tests/lib/legend-param-mapping.test.ts`
- Reference: `src/lib/types.ts` (for `LegendConfig`, `LegendItem`)

- [ ] **Step 1: Write failing tests for `extractLegendParamKeys`**

Create `tests/lib/legend-param-mapping.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { extractLegendParamKeys } from '#/lib/legend-param-mapping'

describe('extractLegendParamKeys', () => {
  it('returns empty map for null config', () => {
    const result = extractLegendParamKeys(null)
    expect(result.size).toBe(0)
  })

  it('extracts valueParamKey from @@#params.* references', () => {
    const raw = {
      type: 'choropleth' as const,
      items: [
        { label: 'High', value: '@@#params.high_color' },
        { label: 'Low', value: '@@#params.low_color' },
      ],
    }
    const result = extractLegendParamKeys(raw)
    expect(result.get(0)).toEqual({ valueParamKey: 'high_color' })
    expect(result.get(1)).toEqual({ valueParamKey: 'low_color' })
  })

  it('extracts labelParamKey when label is a param reference', () => {
    const raw = {
      type: 'basic' as const,
      items: [
        { label: '@@#params.label_1', value: '@@#params.color_1' },
      ],
    }
    const result = extractLegendParamKeys(raw)
    expect(result.get(0)).toEqual({
      valueParamKey: 'color_1',
      labelParamKey: 'label_1',
    })
  })

  it('skips static items (no param references)', () => {
    const raw = {
      type: 'basic' as const,
      items: [
        { label: 'Static', value: '#ff0000' },
        { label: 'Dynamic', value: '@@#params.color_1' },
      ],
    }
    const result = extractLegendParamKeys(raw)
    expect(result.has(0)).toBe(false)
    expect(result.get(1)).toEqual({ valueParamKey: 'color_1' })
  })

  it('handles numeric values (no param reference)', () => {
    const raw = {
      type: 'gradient' as const,
      items: [{ label: 'Min', value: 0 }],
    }
    const result = extractLegendParamKeys(raw)
    expect(result.has(0)).toBe(false)
  })

  it('handles empty items array', () => {
    const raw = { type: 'basic' as const, items: [] }
    const result = extractLegendParamKeys(raw)
    expect(result.size).toBe(0)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test -- tests/lib/legend-param-mapping.test.ts`
Expected: FAIL — module `#/lib/legend-param-mapping` not found

- [ ] **Step 3: Implement `extractLegendParamKeys`**

Create `src/lib/legend-param-mapping.ts`:

```typescript
import type { LegendConfig } from './types'

export type ItemParamMapping = {
  readonly valueParamKey?: string
  readonly labelParamKey?: string
}

/** Raw legend config before @@#params resolution — value/label fields may contain @@#params.* reference strings */
export type RawLegendConfig = LegendConfig

const PARAM_REF_REGEX = /^@@#params\.(.+)$/

function extractParamKey(value: string | number): string | undefined {
  if (typeof value !== 'string') return undefined
  const match = PARAM_REF_REGEX.exec(value)
  return match?.[1]
}

export function extractLegendParamKeys(
  rawLegendConfig: RawLegendConfig | null,
): ReadonlyMap<number, ItemParamMapping> {
  const map = new Map<number, ItemParamMapping>()
  if (!rawLegendConfig) return map

  for (let i = 0; i < rawLegendConfig.items.length; i++) {
    const item = rawLegendConfig.items[i]
    const valueParamKey = extractParamKey(item.value)
    const labelParamKey = extractParamKey(item.label)

    if (valueParamKey || labelParamKey) {
      map.set(i, {
        ...(valueParamKey ? { valueParamKey } : {}),
        ...(labelParamKey ? { labelParamKey } : {}),
      })
    }
  }

  return map
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test -- tests/lib/legend-param-mapping.test.ts`
Expected: All 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/legend-param-mapping.ts tests/lib/legend-param-mapping.test.ts
git commit -m "feat: add extractLegendParamKeys utility with tests"
```

---

## Task 2: `getOrphanLegendParams` Utility

**Files:**
- Modify: `src/lib/legend-param-mapping.ts`
- Modify: `tests/lib/legend-param-mapping.test.ts`

- [ ] **Step 1: Write failing tests for `getOrphanLegendParams`**

Append to `tests/lib/legend-param-mapping.test.ts`:

```typescript
import { extractLegendParamKeys, getOrphanLegendParams } from '#/lib/legend-param-mapping'
import type { InferredParam } from '#/lib/types'

describe('getOrphanLegendParams', () => {
  const legendParams: readonly InferredParam[] = [
    { key: 'high_color', value: '#2563eb', control_type: 'color_picker', group: 'legend' },
    { key: 'low_color', value: '#dc2626', control_type: 'color_picker', group: 'legend' },
    { key: 'default_color', value: '#6b7280', control_type: 'color_picker', group: 'legend' },
  ]

  it('returns params not referenced in any item mapping', () => {
    const mapping = new Map([
      [0, { valueParamKey: 'high_color' }],
      [1, { valueParamKey: 'low_color' }],
    ])
    const orphans = getOrphanLegendParams(legendParams, mapping)
    expect(orphans).toEqual([
      { key: 'default_color', value: '#6b7280', control_type: 'color_picker', group: 'legend' },
    ])
  })

  it('returns empty array when all params are referenced', () => {
    const mapping = new Map([
      [0, { valueParamKey: 'high_color' }],
      [1, { valueParamKey: 'low_color' }],
      [2, { valueParamKey: 'default_color' }],
    ])
    const orphans = getOrphanLegendParams(legendParams, mapping)
    expect(orphans).toEqual([])
  })

  it('returns all params when mapping is empty', () => {
    const orphans = getOrphanLegendParams(legendParams, new Map())
    expect(orphans).toEqual(legendParams)
  })

  it('considers both valueParamKey and labelParamKey references', () => {
    const params: readonly InferredParam[] = [
      { key: 'color_1', value: '#ff0000', control_type: 'color_picker', group: 'legend' },
      { key: 'label_1', value: 'Label', control_type: 'text_input', group: 'legend' },
      { key: 'orphan', value: '#000', control_type: 'color_picker', group: 'legend' },
    ]
    const mapping = new Map([
      [0, { valueParamKey: 'color_1', labelParamKey: 'label_1' }],
    ])
    const orphans = getOrphanLegendParams(params, mapping)
    expect(orphans).toEqual([
      { key: 'orphan', value: '#000', control_type: 'color_picker', group: 'legend' },
    ])
  })
})
```

- [ ] **Step 2: Run tests to verify new tests fail**

Run: `pnpm test -- tests/lib/legend-param-mapping.test.ts`
Expected: FAIL — `getOrphanLegendParams` is not exported

- [ ] **Step 3: Implement `getOrphanLegendParams`**

In `src/lib/legend-param-mapping.ts`, update the import to add `InferredParam`:

```typescript
import type { LegendConfig, InferredParam } from './types'
```

Then append the function:

```typescript
export function getOrphanLegendParams(
  legendParams: readonly InferredParam[],
  paramMapping: ReadonlyMap<number, ItemParamMapping>,
): readonly InferredParam[] {
  const referencedKeys = new Set<string>()
  for (const mapping of paramMapping.values()) {
    if (mapping.valueParamKey) referencedKeys.add(mapping.valueParamKey)
    if (mapping.labelParamKey) referencedKeys.add(mapping.labelParamKey)
  }
  return legendParams.filter((p) => !referencedKeys.has(p.key))
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test -- tests/lib/legend-param-mapping.test.ts`
Expected: All 10 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/legend-param-mapping.ts tests/lib/legend-param-mapping.test.ts
git commit -m "feat: add getOrphanLegendParams utility with tests"
```

---

## Task 3: Shared ColorInput Component

**Files:**
- Create: `src/components/legends/color-input.tsx`

- [ ] **Step 1: Create the shared `ColorInput` component**

Create `src/components/legends/color-input.tsx`:

```typescript
type ColorInputProps = {
  readonly value: string
  readonly onChange: (value: string) => void
}

export function ColorInput({ value, onChange }: ColorInputProps) {
  const safeValue =
    typeof value === 'string' && value.startsWith('#') ? value : '#000000'
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={safeValue}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
      />
      <span className="font-mono text-xs text-muted-foreground">
        {safeValue}
      </span>
    </div>
  )
}
```

Uses raw HTML5 `<input type="color">` instead of `ColorPickerControl` to avoid nested popovers (the legend rows themselves are already inside a popover).

- [ ] **Step 2: Commit**

```bash
git add src/components/legends/color-input.tsx
git commit -m "feat: add shared ColorInput component for legend editing"
```

---

## Task 4: BasicLegend — Inline Editing with Row Popovers

**Files:**
- Modify: `src/components/legends/basic-legend.tsx`
- Reference: `src/components/legends/color-input.tsx`
- Reference: `src/lib/legend-param-mapping.ts` (for `ItemParamMapping` type)
- Reference: `src/components/ui/popover.tsx` (for Popover primitives)
- Reference: `src/components/ui/input.tsx` (for Input)

- [ ] **Step 1: Add `LegendEditProps` and wire into `BasicLegend`**

Replace the entire `src/components/legends/basic-legend.tsx` with:

```typescript
import type { LegendItem } from '#/lib/types'
import type { ItemParamMapping } from '#/lib/legend-param-mapping'
import { ColorInput } from '#/components/legends/color-input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#/components/ui/popover'
import { Input } from '#/components/ui/input'

type BasicLegendProps = {
  readonly items: readonly LegendItem[]
  readonly paramMapping?: ReadonlyMap<number, ItemParamMapping>
  readonly values?: Record<string, unknown>
  readonly onChange?: (key: string, value: unknown) => void
}

function EditableRow({
  item,
  mapping,
  values,
  onChange,
}: {
  readonly item: LegendItem
  readonly mapping: ItemParamMapping
  readonly values: Record<string, unknown>
  readonly onChange: (key: string, value: unknown) => void
}) {
  const colorValue = mapping.valueParamKey
    ? String(values[mapping.valueParamKey] ?? item.value)
    : undefined
  const labelValue = mapping.labelParamKey
    ? String(values[mapping.labelParamKey] ?? item.label)
    : undefined

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-md px-1.5 py-1 -mx-1.5 transition-colors hover:bg-muted/50 cursor-pointer"
        >
          <div
            className="w-4 h-4 rounded-sm border border-border shrink-0"
            style={{
              backgroundColor:
                typeof item.value === 'string' ? item.value : undefined,
            }}
          />
          <span className="text-xs text-muted-foreground">{item.label}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3" side="bottom" align="start">
        <div className="flex flex-col gap-3">
          {colorValue !== undefined && mapping.valueParamKey && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">
                Color
              </label>
              <ColorInput
                value={colorValue}
                onChange={(v) => onChange(mapping.valueParamKey!, v)}
              />
            </div>
          )}
          {labelValue !== undefined && mapping.labelParamKey && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">
                Label
              </label>
              <Input
                type="text"
                value={labelValue}
                onChange={(e) =>
                  onChange(mapping.labelParamKey!, e.target.value)
                }
                className="h-8 text-xs"
              />
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function StaticRow({ item }: { readonly item: LegendItem }) {
  return (
    <div className="flex items-center gap-2 px-1.5 py-1 -mx-1.5">
      <div
        className="w-4 h-4 rounded-sm border border-border shrink-0"
        style={{
          backgroundColor:
            typeof item.value === 'string' ? item.value : undefined,
        }}
      />
      <span className="text-xs text-muted-foreground">{item.label}</span>
    </div>
  )
}

export function BasicLegend({
  items,
  paramMapping,
  values,
  onChange,
}: BasicLegendProps) {
  const isEditable = paramMapping && values && onChange

  return (
    <div className="flex flex-col gap-0.5">
      {items.map((item, i) => {
        const mapping = isEditable ? paramMapping.get(i) : undefined

        if (mapping && values && onChange) {
          return (
            <EditableRow
              key={i}
              item={item}
              mapping={mapping}
              values={values}
              onChange={onChange}
            />
          )
        }

        return <StaticRow key={i} item={item} />
      })}
    </div>
  )
}
```

- [ ] **Step 2: Verify the dev server compiles without errors**

Run: `pnpm build`
Expected: Build succeeds (or run `pnpm dev` and check for compile errors)

- [ ] **Step 3: Commit**

```bash
git add src/components/legends/basic-legend.tsx
git commit -m "feat: add inline editing with row popovers to BasicLegend"
```

---

## Task 5: ChoroplethLegend — Inline Editing with Row Popovers

**Files:**
- Modify: `src/components/legends/choropleth-legend.tsx`
- Reference: Same imports as BasicLegend

- [ ] **Step 1: Add editing support to `ChoroplethLegend`**

Replace the entire `src/components/legends/choropleth-legend.tsx` with:

```typescript
import type { LegendItem } from '#/lib/types'
import type { ItemParamMapping } from '#/lib/legend-param-mapping'
import { ColorInput } from '#/components/legends/color-input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#/components/ui/popover'
import { Input } from '#/components/ui/input'

type ChoroplethLegendProps = {
  readonly items: readonly LegendItem[]
  readonly paramMapping?: ReadonlyMap<number, ItemParamMapping>
  readonly values?: Record<string, unknown>
  readonly onChange?: (key: string, value: unknown) => void
}

function EditableRow({
  item,
  mapping,
  values,
  onChange,
}: {
  readonly item: LegendItem
  readonly mapping: ItemParamMapping
  readonly values: Record<string, unknown>
  readonly onChange: (key: string, value: unknown) => void
}) {
  const colorValue = mapping.valueParamKey
    ? String(values[mapping.valueParamKey] ?? item.value)
    : undefined
  const labelValue = mapping.labelParamKey
    ? String(values[mapping.labelParamKey] ?? item.label)
    : undefined

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-md px-1.5 py-1 -mx-1.5 transition-colors hover:bg-muted/50 cursor-pointer"
        >
          <div
            className="w-6 h-4 rounded-sm shrink-0"
            style={{
              backgroundColor:
                typeof item.value === 'string' ? item.value : undefined,
            }}
          />
          <span className="text-xs text-muted-foreground">{item.label}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3" side="bottom" align="start">
        <div className="flex flex-col gap-3">
          {colorValue !== undefined && mapping.valueParamKey && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">
                Color
              </label>
              <ColorInput
                value={colorValue}
                onChange={(v) => onChange(mapping.valueParamKey!, v)}
              />
            </div>
          )}
          {labelValue !== undefined && mapping.labelParamKey && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">
                Label
              </label>
              <Input
                type="text"
                value={labelValue}
                onChange={(e) =>
                  onChange(mapping.labelParamKey!, e.target.value)
                }
                className="h-8 text-xs"
              />
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function StaticRow({ item }: { readonly item: LegendItem }) {
  return (
    <div className="flex items-center gap-2 px-1.5 py-1 -mx-1.5">
      <div
        className="w-6 h-4 rounded-sm shrink-0"
        style={{
          backgroundColor:
            typeof item.value === 'string' ? item.value : undefined,
        }}
      />
      <span className="text-xs text-muted-foreground">{item.label}</span>
    </div>
  )
}

export function ChoroplethLegend({
  items,
  paramMapping,
  values,
  onChange,
}: ChoroplethLegendProps) {
  const isEditable = paramMapping && values && onChange

  return (
    <div className="flex flex-col gap-0.5">
      {items.map((item, i) => {
        const mapping = isEditable ? paramMapping.get(i) : undefined

        if (mapping && values && onChange) {
          return (
            <EditableRow
              key={i}
              item={item}
              mapping={mapping}
              values={values}
              onChange={onChange}
            />
          )
        }

        return <StaticRow key={i} item={item} />
      })}
    </div>
  )
}
```

Note: The only differences from BasicLegend are the swatch size (`w-6 h-4` vs `w-4 h-4`) and no border on the swatch — matching the current choropleth styling.

- [ ] **Step 2: Verify build compiles**

Run: `pnpm build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/components/legends/choropleth-legend.tsx
git commit -m "feat: add inline editing with row popovers to ChoroplethLegend"
```

---

## Task 6: GradientLegend — Inline Editing with Single Popover

**Files:**
- Modify: `src/components/legends/gradient-legend.tsx`
- Reference: Same imports pattern

- [ ] **Step 1: Add editing support to `GradientLegend`**

Replace the entire `src/components/legends/gradient-legend.tsx` with:

```typescript
import type { LegendItem } from '#/lib/types'
import type { ItemParamMapping } from '#/lib/legend-param-mapping'
import { ColorInput } from '#/components/legends/color-input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#/components/ui/popover'
import { Input } from '#/components/ui/input'

type GradientLegendProps = {
  readonly items: readonly LegendItem[]
  readonly paramMapping?: ReadonlyMap<number, ItemParamMapping>
  readonly values?: Record<string, unknown>
  readonly onChange?: (key: string, value: unknown) => void
}

function GradientBar({ items }: { readonly items: readonly LegendItem[] }) {
  const colors = items
    .map((item) => (typeof item.value === 'string' ? item.value : '#000'))
    .join(', ')

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
  )
}

function EditableGradient({
  items,
  paramMapping,
  values,
  onChange,
}: {
  readonly items: readonly LegendItem[]
  readonly paramMapping: ReadonlyMap<number, ItemParamMapping>
  readonly values: Record<string, unknown>
  readonly onChange: (key: string, value: unknown) => void
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="w-full rounded-md px-1.5 py-1 -mx-1.5 transition-colors hover:bg-muted/50 cursor-pointer"
        >
          <GradientBar items={items} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" side="bottom" align="start">
        <div className="flex flex-col gap-3">
          {items.map((item, i) => {
            const mapping = paramMapping.get(i)
            if (!mapping) return null

            const colorValue = mapping.valueParamKey
              ? String(values[mapping.valueParamKey] ?? item.value)
              : undefined
            const labelValue = mapping.labelParamKey
              ? String(values[mapping.labelParamKey] ?? item.label)
              : undefined

            return (
              <div key={i} className="flex flex-col gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {item.label}
                </span>
                {colorValue !== undefined && mapping.valueParamKey && (
                  <ColorInput
                    value={colorValue}
                    onChange={(v) => onChange(mapping.valueParamKey!, v)}
                  />
                )}
                {labelValue !== undefined && mapping.labelParamKey && (
                  <Input
                    type="text"
                    value={labelValue}
                    onChange={(e) =>
                      onChange(mapping.labelParamKey!, e.target.value)
                    }
                    className="h-8 text-xs"
                  />
                )}
              </div>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function GradientLegend({
  items,
  paramMapping,
  values,
  onChange,
}: GradientLegendProps) {
  const hasEditableItems =
    paramMapping && values && onChange && paramMapping.size > 0

  if (hasEditableItems) {
    return (
      <EditableGradient
        items={items}
        paramMapping={paramMapping}
        values={values}
        onChange={onChange}
      />
    )
  }

  return <GradientBar items={items} />
}
```

- [ ] **Step 2: Verify build compiles**

Run: `pnpm build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/components/legends/gradient-legend.tsx
git commit -m "feat: add inline editing with single popover to GradientLegend"
```

---

## Task 7: Wire LegendCard, ParamsPanel, and PlaygroundPage

This task modifies all three files together so we never commit broken code.

**Files:**
- Modify: `src/components/playground/legend-card.tsx`
- Modify: `src/components/playground/params-panel.tsx`
- Modify: `src/routes/playground.tsx`
- Reference: `src/lib/legend-param-mapping.ts`

- [ ] **Step 1: Rewrite `LegendCard` to use extraction and pass edit props**

Replace the entire `src/components/playground/legend-card.tsx` with:

```typescript
import { useMemo } from 'react'
import { BasicLegend } from '#/components/legends/basic-legend'
import { ChoroplethLegend } from '#/components/legends/choropleth-legend'
import { GradientLegend } from '#/components/legends/gradient-legend'
import { ParamControl } from '#/components/playground/param-control'
import type { LegendConfig, InferredParam } from '#/lib/types'
import type { RawLegendConfig } from '#/lib/legend-param-mapping'
import {
  extractLegendParamKeys,
  getOrphanLegendParams,
} from '#/lib/legend-param-mapping'
import { Separator } from '#/components/ui/separator'

const LEGEND_COMPONENTS = {
  basic: BasicLegend,
  choropleth: ChoroplethLegend,
  gradient: GradientLegend,
} as const

type LegendCardProps = {
  readonly legendConfig: LegendConfig | null
  readonly rawLegendConfig: RawLegendConfig | null
  readonly legendParams: readonly InferredParam[]
  readonly values: Record<string, unknown>
  readonly onChange: (key: string, value: unknown) => void
}

export function LegendCard({
  legendConfig,
  rawLegendConfig,
  legendParams,
  values,
  onChange,
}: LegendCardProps) {
  const paramMapping = useMemo(
    () => extractLegendParamKeys(rawLegendConfig),
    [rawLegendConfig],
  )

  const orphanParams = useMemo(
    () => getOrphanLegendParams(legendParams, paramMapping),
    [legendParams, paramMapping],
  )

  const hasPreview = legendConfig !== null
  const hasOrphans = orphanParams.length > 0

  if (!hasPreview && !hasOrphans) return null

  const LegendComponent = legendConfig
    ? LEGEND_COMPONENTS[legendConfig.type]
    : null

  return (
    <div className="mx-3 rounded-lg border bg-muted/30 p-3">
      {LegendComponent && legendConfig && (
        <LegendComponent
          items={legendConfig.items}
          paramMapping={paramMapping}
          values={values}
          onChange={onChange}
        />
      )}
      {hasOrphans && (
        <>
          {hasPreview && <Separator className="my-3" />}
          <div className="flex flex-col gap-2">
            {orphanParams.map((param) => {
              const currentValue = Object.prototype.hasOwnProperty.call(
                values,
                param.key,
              )
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
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Add `rawLegendConfig` to `ParamsPanel` props and pass to `LegendCard`**

In `src/components/playground/params-panel.tsx`, update the import and types:

Add to imports:
```typescript
import type { RawLegendConfig } from '#/lib/legend-param-mapping'
```

Update `ParamsPanelProps`:
```typescript
type ParamsPanelProps = {
  readonly metadata: Pick<ExampleMetadata, 'title' | 'tier'> | null
  readonly paramsConfig: readonly InferredParam[]
  readonly legendConfig: LegendConfig | null
  readonly rawLegendConfig: RawLegendConfig | null
  readonly values: ResolvedParams
  readonly onChange: (key: string, value: unknown) => void
}
```

Add `rawLegendConfig` to the destructured props and pass to `LegendCard`:
```typescript
<LegendCard
  legendConfig={legendConfig}
  rawLegendConfig={rawLegendConfig}
  legendParams={legendParams}
  values={values}
  onChange={onChange}
/>
```

- [ ] **Step 3: Extract `rawLegendConfig` in `PlaygroundPage` and pass to `ParamsPanel`**

In `src/routes/playground.tsx`, add a `useMemo` for the raw legend config (after the existing `resolvedLegendConfig` memo):

```typescript
// Extract raw legend_config BEFORE resolution (for param key mapping)
const rawLegendConfig = useMemo<RawLegendConfig | null>(() => {
  try {
    const parsed = JSON.parse(debouncedJson) as {
      legend_config?: LegendConfig
    }
    return parsed.legend_config ?? null
  } catch {
    return null
  }
}, [debouncedJson])
```

Add `RawLegendConfig` to the import from `#/lib/legend-param-mapping`:
```typescript
import type { RawLegendConfig } from '#/lib/legend-param-mapping'
```

Pass to `ParamsPanel`:
```typescript
<ParamsPanel
  metadata={currentMetadata}
  paramsConfig={currentInferredParams}
  legendConfig={resolvedLegendConfig}
  rawLegendConfig={rawLegendConfig}
  values={paramValues}
  onChange={handleParamChange}
/>
```

- [ ] **Step 4: Verify build compiles and all tests pass**

Run: `pnpm build && pnpm test`
Expected: Build succeeds, all tests pass

- [ ] **Step 5: Commit**

```bash
git add src/components/playground/legend-card.tsx src/components/playground/params-panel.tsx src/routes/playground.tsx
git commit -m "feat: wire LegendCard extraction and plumb rawLegendConfig through playground"
```

---

## Task 8: Manual Smoke Test and Polish

**Files:**
- Potentially any legend component for minor styling adjustments

- [ ] **Step 1: Run dev server and test each legend type**

Run: `pnpm dev`

Test checklist:
1. Example 02 (vector fill) — BasicLegend: click a row → popover with color picker appears
2. Example 03 (choropleth) — ChoroplethLegend: click rows → popovers; `default_color` appears as orphan below legend
3. Example 04 (graduated) — GradientLegend: click gradient bar → single popover with color stops; orphan params (`color_mid`, stops) below
4. Example 01 (raster) — BasicLegend with static item: no hover/click (read-only)
5. Example 07 (raster fn) — GradientLegend static: no hover/click
6. Changing a color in a popover updates the map live
7. Popover closes on click outside / Escape

- [ ] **Step 2: Fix any styling issues found during smoke test**

Adjust spacing, alignment, or colors as needed. Keep changes minimal.

- [ ] **Step 3: Run full test suite**

Run: `pnpm test`
Expected: All tests pass

- [ ] **Step 4: Commit any polish fixes**

```bash
git add -u
git commit -m "fix: polish inline legend editing after smoke test"
```

(Skip if no changes needed.)
