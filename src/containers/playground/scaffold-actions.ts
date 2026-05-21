/**
 * Pure scaffold actions for the validation banner.
 * No I/O, no React, no validator deps.
 * Both functions return NEW snapshots (immutable structural copies).
 */
import type {
  LayerSchema,
  ParamConfig,
  LegendConfig,
  LegendItem,
} from '#/lib/types'
import { COLOR_PAINT_PROPS } from '#/lib/validator/color-positions'

const PARAM_REF_RE = /^@@#params\.(.+)$/
const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/
const RGB_RE = /^rgba?\(/i

function isColorLiteral(value: unknown): value is string {
  if (typeof value !== 'string') return false
  return HEX_RE.test(value) || RGB_RE.test(value)
}

function isParamRef(value: unknown): value is string {
  return typeof value === 'string' && PARAM_REF_RE.test(value)
}

function paramRefKey(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  return PARAM_REF_RE.exec(value)?.[1]
}

function humanize(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

// ── Key generation ────────────────────────────────────────────────────────────

function nextAutoColorKey(existingKeys: Set<string>): string {
  let n = 1
  while (existingKeys.has(`auto_color_${n}`)) n++
  return `auto_color_${n}`
}

// ── Expression slot walking ───────────────────────────────────────────────────

type SlotReplacer = (literal: string) => string

/**
 * Walk a MapLibre paint expression, replace literal color slots with param refs.
 * Returns the replaced expression.
 */
function replaceColorLiteralsInExpr(
  expr: unknown,
  replacer: SlotReplacer,
): unknown {
  if (!Array.isArray(expr) || expr.length === 0) return expr
  const [op] = expr

  if (op === 'match') {
    // ["match", input, v1, out1, v2, out2, ..., default]
    const next = [...expr]
    for (let i = 2; i < next.length; i++) {
      const isOutput = i % 2 === 1 && i < next.length - 1
      const isDefault = i === next.length - 1
      if (isOutput || isDefault) {
        const slot = next[i]
        if (isColorLiteral(slot)) {
          next[i] = replacer(slot)
        } else if (Array.isArray(slot)) {
          next[i] = replaceColorLiteralsInExpr(slot, replacer)
        }
      }
    }
    return next
  }

  if (op === 'step') {
    // ["step", input, out0, threshold1, out1, ...]
    const next = [...expr]
    for (let i = 2; i < next.length; i++) {
      if ((i - 2) % 2 === 0) {
        const slot = next[i]
        if (isColorLiteral(slot)) {
          next[i] = replacer(slot)
        } else if (Array.isArray(slot)) {
          next[i] = replaceColorLiteralsInExpr(slot, replacer)
        }
      }
    }
    return next
  }

  if (op === 'interpolate' || op === 'interpolate-rgb') {
    // ["interpolate", interp, input, stop0, out0, stop1, out1, ...]
    const next = [...expr]
    for (let i = 4; i < next.length; i++) {
      if ((i - 4) % 2 === 0) {
        const slot = next[i]
        if (isColorLiteral(slot)) {
          next[i] = replacer(slot)
        } else if (Array.isArray(slot)) {
          next[i] = replaceColorLiteralsInExpr(slot, replacer)
        }
      }
    }
    return next
  }

  if (op === 'case') {
    // ["case", cond1, out1, cond2, out2, ..., else]
    const next = [...expr]
    for (let i = 2; i < next.length; i++) {
      const isOutput = (i - 2) % 2 === 0 && i < next.length - 1
      const isElse = i === next.length - 1
      if (isOutput || isElse) {
        const slot = next[i]
        if (isColorLiteral(slot)) {
          next[i] = replacer(slot)
        } else if (Array.isArray(slot)) {
          next[i] = replaceColorLiteralsInExpr(slot, replacer)
        }
      }
    }
    return next
  }

  return expr
}

// ── extractLiteralColors ──────────────────────────────────────────────────────

/**
 * Walk every color paint position. For each literal color, invent a unique
 * `auto_color_<N>` key, replace the literal with `@@#params.<key>`, and
 * append a params_config entry + legend_config item.
 */
export function extractLiteralColors(snapshot: LayerSchema): LayerSchema {
  const existingKeys = new Set(snapshot.params_config.map((p) => p.key))
  const newParams: ParamConfig[] = []

  const config = snapshot.config as {
    sources: Record<string, unknown>[]
    styles: Record<string, unknown>[]
  }

  const styles = Array.isArray(config.styles) ? [...config.styles] : []
  const sources = Array.isArray(config.sources) ? [...config.sources] : []

  // Mutate copies of styles
  const newStyles = styles.map((style) => {
    const paint = style.paint as Record<string, unknown> | undefined
    if (!paint) return style

    let changed = false
    const newPaint: Record<string, unknown> = { ...paint }

    for (const prop of COLOR_PAINT_PROPS) {
      const val = paint[prop]
      if (val === undefined) continue

      if (isColorLiteral(val)) {
        const key = nextAutoColorKey(existingKeys)
        existingKeys.add(key)
        const sourceId = style.source as string | undefined
        newParams.push({
          key,
          default: val,
          source: sourceId,
          group: 'legend',
        })
        newPaint[prop] = `@@#params.${key}`
        changed = true
      } else if (Array.isArray(val)) {
        const replaced = replaceColorLiteralsInExpr(val, (literal) => {
          const key = nextAutoColorKey(existingKeys)
          existingKeys.add(key)
          const sourceId = style.source as string | undefined
          newParams.push({
            key,
            default: literal,
            source: sourceId,
            group: 'legend',
          })
          return `@@#params.${key}`
        })
        if (replaced !== val) {
          newPaint[prop] = replaced
          changed = true
        }
      }
    }

    return changed ? { ...style, paint: newPaint } : style
  })

  if (newParams.length === 0) return snapshot

  // Append legend_config items for the new params, grouped by source
  const newSources = sources.map((source) => {
    const sourceId = source.id as string
    const paramsForSource = newParams.filter((p) => p.source === sourceId)
    if (paramsForSource.length === 0) return source

    const existingLegend = source.legend_config as LegendConfig | undefined
    const existingItems: readonly LegendItem[] = existingLegend?.items ?? []
    const newItems: LegendItem[] = paramsForSource.map((p) => ({
      label: `Auto color ${newParams.indexOf(p) + 1}`,
      value: `@@#params.${p.key}`,
    }))
    const legend: LegendConfig = {
      type: existingLegend?.type ?? 'basic',
      items: [...existingItems, ...newItems],
    }
    return { ...source, legend_config: legend }
  })

  return {
    ...snapshot,
    config: {
      ...config,
      sources: newSources,
      styles: newStyles,
    },
    params_config: [...snapshot.params_config, ...newParams],
  }
}

// ── scaffoldLegendFromLayer ───────────────────────────────────────────────────

type FunctionMetaLookup = (
  name: string,
) => { colorArgPaths?: readonly string[] } | undefined

/**
 * Collect param refs from color slots of a paint expression.
 * Returns (ref, inputValue) pairs for gradient stops, just refs for match/step.
 */
type ColorRef = { ref: string; input?: number }

function collectColorRefsFromExpr(expr: unknown): ColorRef[] {
  if (!Array.isArray(expr) || expr.length === 0) return []
  const [op] = expr

  if (op === 'match') {
    const refs: ColorRef[] = []
    for (let i = 2; i < expr.length - 1; i += 2) {
      const output = expr[i + 1]
      const key = paramRefKey(output)
      if (key) refs.push({ ref: key })
    }
    return refs
  }

  if (op === 'step') {
    const refs: ColorRef[] = []
    // out0 is at index 2, then (threshold, outN) pairs at 3,4 / 5,6 ...
    const out0 = expr[2]
    const key0 = paramRefKey(out0)
    if (key0) refs.push({ ref: key0 })
    for (let i = 3; i + 1 < expr.length; i += 2) {
      const threshold = expr[i] as number
      const output = expr[i + 1]
      const key = paramRefKey(output)
      if (key) refs.push({ ref: key, input: threshold })
    }
    return refs
  }

  if (op === 'interpolate' || op === 'interpolate-rgb') {
    const refs: ColorRef[] = []
    // ["interpolate", interp, input, stop0, out0, stop1, out1, ...]
    for (let i = 3; i + 1 < expr.length; i += 2) {
      const stop = expr[i] as number
      const output = expr[i + 1]
      const key = paramRefKey(output)
      if (key) refs.push({ ref: key, input: stop })
    }
    return refs
  }

  if (op === 'case') {
    const refs: ColorRef[] = []
    for (let i = 2; i < expr.length - 1; i += 2) {
      const output = expr[i]
      const key = paramRefKey(output)
      if (key) refs.push({ ref: key })
    }
    return refs
  }

  return []
}

type ExprType =
  | 'match'
  | 'step'
  | 'interpolate'
  | 'case'
  | 'bare-ref'
  | 'function'
  | 'unknown'

function classifyExpr(value: unknown): ExprType {
  if (isParamRef(value)) return 'bare-ref'
  if (!Array.isArray(value) || value.length === 0) return 'unknown'
  const op = value[0]
  if (op === 'match') return 'match'
  if (op === 'step') return 'step'
  if (op === 'interpolate' || op === 'interpolate-rgb') return 'interpolate'
  if (op === 'case') return 'case'
  return 'unknown'
}

function deriveLegendForSource(
  source: Record<string, unknown>,
  styles: Record<string, unknown>[],
  getFunctionMeta?: FunctionMetaLookup,
): LegendConfig | null {
  const sourceId = source.id as string
  const sourceStyles = styles.filter((s) => s.source === sourceId)

  // Find the first color paint expression across all styles for this source
  for (const style of sourceStyles) {
    const paint = style.paint as Record<string, unknown> | undefined
    if (!paint) continue

    for (const prop of COLOR_PAINT_PROPS) {
      const val = paint[prop]
      if (val === undefined) continue

      const exprType = classifyExpr(val)

      if (exprType === 'bare-ref') {
        const key = paramRefKey(val)!
        return {
          type: 'basic',
          items: [{ label: humanize(key), value: `@@#params.${key}` }],
        }
      }

      if (exprType === 'interpolate') {
        const refs = collectColorRefsFromExpr(val)
        if (refs.length === 0) continue
        return {
          type: 'gradient',
          items: refs.map(({ ref, input }) => ({
            label: humanize(ref),
            value: `@@#params.${ref}`,
            ...(input !== undefined ? { threshold: input } : {}),
          })),
        }
      }

      if (exprType === 'match' || exprType === 'case') {
        const refs = collectColorRefsFromExpr(val)
        if (refs.length === 0) continue
        return {
          type: 'choropleth',
          items: refs.map(({ ref }) => ({
            label: humanize(ref),
            value: `@@#params.${ref}`,
          })),
        }
      }

      if (exprType === 'step') {
        const refs = collectColorRefsFromExpr(val)
        if (refs.length === 0) continue
        return {
          type: 'choropleth',
          items: refs.map(({ ref, input }) => ({
            label: input !== undefined ? `≥ ${input}` : humanize(ref),
            value: `@@#params.${ref}`,
          })),
        }
      }
    }
  }

  // Check for function calls in the source object itself (e.g. buildColormap)
  if (getFunctionMeta) {
    const fnLegend = deriveLegendFromFunctionCall(source, getFunctionMeta)
    if (fnLegend) return fnLegend
  }

  return null
}

function deriveLegendFromFunctionCall(
  node: unknown,
  getFunctionMeta: FunctionMetaLookup,
): LegendConfig | null {
  if (!node || typeof node !== 'object' || Array.isArray(node)) return null
  const obj = node as Record<string, unknown>

  // Walk looking for @@function objects with colorArgPaths
  for (const [, val] of Object.entries(obj)) {
    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      const fnObj = val as Record<string, unknown>
      if (typeof fnObj['@@function'] === 'string') {
        const meta = getFunctionMeta(fnObj['@@function'])
        if (meta?.colorArgPaths) {
          // Collect stop refs from the args
          const refs: ColorRef[] = []
          for (const argPath of meta.colorArgPaths) {
            // Simple case: stops[*][1] — walk the stops array
            const stops = fnObj['stops'] as unknown[] | undefined
            if (Array.isArray(stops)) {
              for (const stop of stops) {
                if (Array.isArray(stop) && stop.length >= 2) {
                  const key = paramRefKey(stop[1])
                  if (key) refs.push({ ref: key, input: stop[0] as number })
                }
              }
            }
            void argPath
          }
          if (refs.length > 0) {
            return {
              type: 'gradient',
              items: refs.map(({ ref, input }) => ({
                label: humanize(ref),
                value: `@@#params.${ref}`,
                ...(input !== undefined ? { threshold: input } : {}),
              })),
            }
          }
        }
      }
      // Recurse
      const nested = deriveLegendFromFunctionCall(val, getFunctionMeta)
      if (nested) return nested
    }
  }

  return null
}

/**
 * For each source: inspect color paint expression(s), derive a legend_config,
 * and insert it — replacing any existing block (replace semantics, not patch).
 */
export function scaffoldLegendFromLayer(
  snapshot: LayerSchema,
  getFunctionMeta?: FunctionMetaLookup,
): LayerSchema {
  const config = snapshot.config as {
    sources: Record<string, unknown>[]
    styles: Record<string, unknown>[]
  }

  const styles = Array.isArray(config.styles) ? config.styles : []
  const sources = Array.isArray(config.sources) ? config.sources : []

  const newSources = sources.map((source) => {
    const derived = deriveLegendForSource(source, styles, getFunctionMeta)
    if (!derived) return source
    // Replace semantics
    return { ...source, legend_config: derived }
  })

  // If nothing changed, newSources entries are the same references
  if (newSources.every((s, i) => s === sources[i])) return snapshot

  return {
    ...snapshot,
    config: { ...config, sources: newSources },
    params_config: snapshot.params_config,
  }
}
