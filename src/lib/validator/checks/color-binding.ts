import type { Diagnostic, ValidatorRegistry } from '../types'
import { COLOR_PAINT_PROPS } from '../color-positions'
import { walk } from '../walker'

const PARAM_REF_RE = /^@@#params\.(.+)$/
const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/
const RGB_RE = /^rgba?\(/i

function isColorLiteral(value: unknown): boolean {
  if (typeof value !== 'string') return false
  return HEX_RE.test(value) || RGB_RE.test(value)
}

function paramRefKey(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  return PARAM_REF_RE.exec(value)?.[1]
}

/**
 * Walk an array expression value for color positions.
 * Returns param refs found in color slots and any literal diagnostics.
 *
 * Exempt slots: match final default, case final else — params appearing
 * ONLY in those positions don't require a legend item.
 */
function walkColorExpression(
  expr: unknown,
  basePath: string,
): {
  paramRefs: Set<string>
  exemptRefs: Set<string>
  diagnostics: Diagnostic[]
} {
  const paramRefs = new Set<string>()
  const exemptRefs = new Set<string>()
  const diagnostics: Diagnostic[] = []

  if (!Array.isArray(expr) || expr.length === 0) {
    return { paramRefs, exemptRefs, diagnostics }
  }

  const [operator] = expr

  if (operator === 'match') {
    // ["match", input, v1, out1, v2, out2, ..., default]
    // pairs start at index 2, alternating data-value / color-output
    // last element is the default color slot (exempt)
    for (let i = 2; i < expr.length; i++) {
      const isOutput = i % 2 === 1 && i < expr.length - 1
      const isDefault = i === expr.length - 1

      if (isOutput || isDefault) {
        const slotPath = `${basePath}[${i}]`
        const slot = expr[i]
        if (isColorLiteral(slot)) {
          diagnostics.push({
            code: 'COLOR_LITERAL_IN_PAINT',
            severity: 'error',
            path: slotPath,
            message: `Color literal "${slot}" found in paint expression color slot. Use @@#params.<key> instead.`,
            meta: { literal: slot },
          })
        } else {
          const key = paramRefKey(slot)
          if (key) {
            if (isDefault) {
              exemptRefs.add(key)
            } else {
              paramRefs.add(key)
            }
          } else if (Array.isArray(slot)) {
            const nested = walkColorExpression(slot, slotPath)
            nested.paramRefs.forEach((k) => paramRefs.add(k))
            nested.exemptRefs.forEach((k) => exemptRefs.add(k))
            nested.diagnostics.forEach((d) => diagnostics.push(d))
          }
        }
      }
      // data-value slots (even indices >= 2, not the last) are skipped
    }
    return { paramRefs, exemptRefs, diagnostics }
  }

  if (operator === 'step') {
    // ["step", input, output0, threshold1, output1, threshold2, output2, ...]
    // output slots are at indices 2, 4, 6, ... (even from 2)
    for (let i = 2; i < expr.length; i++) {
      const isOutput = (i - 2) % 2 === 0
      if (isOutput) {
        const slotPath = `${basePath}[${i}]`
        const slot = expr[i]
        if (isColorLiteral(slot)) {
          diagnostics.push({
            code: 'COLOR_LITERAL_IN_PAINT',
            severity: 'error',
            path: slotPath,
            message: `Color literal "${slot}" found in paint expression color slot. Use @@#params.<key> instead.`,
            meta: { literal: slot },
          })
        } else {
          const key = paramRefKey(slot)
          if (key) paramRefs.add(key)
          else if (Array.isArray(slot)) {
            const nested = walkColorExpression(slot, slotPath)
            nested.paramRefs.forEach((k) => paramRefs.add(k))
            nested.diagnostics.forEach((d) => diagnostics.push(d))
          }
        }
      }
    }
    return { paramRefs, exemptRefs, diagnostics }
  }

  if (operator === 'interpolate' || operator === 'interpolate-rgb') {
    // ["interpolate", interpolation, input, stop0, output0, stop1, output1, ...]
    // output slots at indices 4, 6, 8, ... (even from 4)
    for (let i = 4; i < expr.length; i++) {
      const isOutput = (i - 4) % 2 === 0
      if (isOutput) {
        const slotPath = `${basePath}[${i}]`
        const slot = expr[i]
        if (isColorLiteral(slot)) {
          diagnostics.push({
            code: 'COLOR_LITERAL_IN_PAINT',
            severity: 'error',
            path: slotPath,
            message: `Color literal "${slot}" found in paint expression color slot. Use @@#params.<key> instead.`,
            meta: { literal: slot },
          })
        } else {
          const key = paramRefKey(slot)
          if (key) paramRefs.add(key)
          else if (Array.isArray(slot)) {
            const nested = walkColorExpression(slot, slotPath)
            nested.paramRefs.forEach((k) => paramRefs.add(k))
            nested.diagnostics.forEach((d) => diagnostics.push(d))
          }
        }
      }
    }
    return { paramRefs, exemptRefs, diagnostics }
  }

  if (operator === 'case') {
    // ["case", cond1, output1, cond2, output2, ..., else]
    // output slots at indices 2, 4, 6, ... (even from 2, not the last)
    // final element (last index) is the else slot (exempt)
    for (let i = 2; i < expr.length; i++) {
      const isOutput = (i - 2) % 2 === 0 && i < expr.length - 1
      const isElse = i === expr.length - 1

      if (isOutput || isElse) {
        const slotPath = `${basePath}[${i}]`
        const slot = expr[i]
        if (isColorLiteral(slot)) {
          diagnostics.push({
            code: 'COLOR_LITERAL_IN_PAINT',
            severity: 'error',
            path: slotPath,
            message: `Color literal "${slot}" found in paint expression color slot. Use @@#params.<key> instead.`,
            meta: { literal: slot },
          })
        } else {
          const key = paramRefKey(slot)
          if (key) {
            if (isElse) {
              exemptRefs.add(key)
            } else {
              paramRefs.add(key)
            }
          } else if (Array.isArray(slot)) {
            const nested = walkColorExpression(slot, slotPath)
            nested.paramRefs.forEach((k) => paramRefs.add(k))
            nested.exemptRefs.forEach((k) => exemptRefs.add(k))
            nested.diagnostics.forEach((d) => diagnostics.push(d))
          }
        }
      }
    }
    return { paramRefs, exemptRefs, diagnostics }
  }

  // Unknown expression — don't diagnose, just return empty
  return { paramRefs, exemptRefs, diagnostics }
}

/**
 * Inspect a single paint property value for color-slot violations.
 * Returns param refs found and any diagnostics.
 */
function inspectPaintValue(
  value: unknown,
  path: string,
  registry: ValidatorRegistry,
): {
  paramRefs: Set<string>
  exemptRefs: Set<string>
  diagnostics: Diagnostic[]
} {
  const paramRefs = new Set<string>()
  const exemptRefs = new Set<string>()
  const diagnostics: Diagnostic[] = []

  if (typeof value === 'string') {
    // Check for @@function: call (these are strings starting with "@@function:")
    // Actually @@function: calls in paint are object-shaped in the snapshot.
    // A bare string is either a param ref or a literal
    const key = paramRefKey(value)
    if (key) {
      paramRefs.add(key)
    } else if (isColorLiteral(value)) {
      diagnostics.push({
        code: 'COLOR_LITERAL_IN_PAINT',
        severity: 'error',
        path,
        message: `Color literal "${value}" found in paint. Use @@#params.<key> instead.`,
        meta: { literal: value },
      })
    }
    return { paramRefs, exemptRefs, diagnostics }
  }

  // Check for @@function: object
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>
    if (typeof obj['@@function'] === 'string') {
      const fnName = obj['@@function']
      const meta = registry.getFunctionMeta(fnName)
      if (meta?.colorArgPaths) {
        for (const colorPath of meta.colorArgPaths) {
          const results = walk(obj, colorPath)
          for (const { value: slotVal, path: slotRelPath } of results) {
            const slotPath = `${path}.${slotRelPath}`
            if (isColorLiteral(slotVal)) {
              diagnostics.push({
                code: 'COLOR_LITERAL_IN_PAINT',
                severity: 'error',
                path: slotPath,
                message: `Color literal "${slotVal}" found in function arg color slot. Use @@#params.<key> instead.`,
                meta: { literal: slotVal },
              })
            } else {
              const key = paramRefKey(slotVal)
              if (key) paramRefs.add(key)
            }
          }
        }
      }
    }
    return { paramRefs, exemptRefs, diagnostics }
  }

  // Array expression
  if (Array.isArray(value)) {
    const result = walkColorExpression(value, path)
    result.paramRefs.forEach((k) => paramRefs.add(k))
    result.exemptRefs.forEach((k) => exemptRefs.add(k))
    result.diagnostics.forEach((d) => diagnostics.push(d))
  }

  return { paramRefs, exemptRefs, diagnostics }
}

type SourceColorInfo = {
  /** param keys appearing in non-exempt color slots */
  layerColorParams: Set<string>
  /** param keys appearing ONLY in exempt slots */
  exemptOnlyParams: Set<string>
  diagnostics: Diagnostic[]
}

function checkSourceColorBinding(
  source: Record<string, unknown>,
  sourceIndex: number,
  styles: readonly Record<string, unknown>[],
  registry: ValidatorRegistry,
): SourceColorInfo {
  const sourceId = source.id as string
  const layerColorParams = new Set<string>()
  // Track all exempt refs; if a key also appears as non-exempt, it moves to layerColorParams
  const exemptCandidates = new Set<string>()
  const diagnostics: Diagnostic[] = []

  const sourceStyles = styles.filter((s) => s.source === sourceId)

  for (let si = 0; si < sourceStyles.length; si++) {
    const style = sourceStyles[si]
    const styleIndex = styles.indexOf(style)
    const paint = style.paint as Record<string, unknown> | undefined
    if (!paint) continue

    for (const prop of COLOR_PAINT_PROPS) {
      if (!(prop in paint)) continue
      const paintPath = `config.sources[${sourceIndex}].styles[${styleIndex}].paint.${prop}`
      const result = inspectPaintValue(paint[prop], paintPath, registry)

      result.paramRefs.forEach((k) => {
        layerColorParams.add(k)
        exemptCandidates.delete(k) // once non-exempt, always non-exempt
      })
      result.exemptRefs.forEach((k) => {
        if (!layerColorParams.has(k)) {
          exemptCandidates.add(k)
        }
      })
      result.diagnostics.forEach((d) => diagnostics.push(d))
    }
  }

  return { layerColorParams, exemptOnlyParams: exemptCandidates, diagnostics }
}

function checkLegendColorBinding(
  source: Record<string, unknown>,
  sourceIndex: number,
): {
  legendColorParams: Set<string>
  diagnostics: Diagnostic[]
} {
  const legendColorParams = new Set<string>()
  const diagnostics: Diagnostic[] = []

  const legendConfig = source.legend_config as
    | {
        type: string
        items: readonly { label: string; value: unknown }[]
      }
    | undefined

  if (!legendConfig) return { legendColorParams, diagnostics }

  for (let i = 0; i < legendConfig.items.length; i++) {
    const item = legendConfig.items[i]
    const itemPath = `config.sources[${sourceIndex}].legend_config.items[${i}].value`

    // Numeric values are threshold items (gradient), not color slots
    if (typeof item.value === 'number') continue

    if (typeof item.value === 'string') {
      const key = paramRefKey(item.value)
      if (key) {
        legendColorParams.add(key)
      } else if (isColorLiteral(item.value)) {
        diagnostics.push({
          code: 'COLOR_LITERAL_IN_LEGEND',
          severity: 'error',
          path: itemPath,
          message: `Color literal "${item.value}" in legend item. Use @@#params.<key> instead.`,
          meta: { literal: item.value },
        })
      }
    }
  }

  return { legendColorParams, diagnostics }
}

export function checkColorBinding(
  snapshot: unknown,
  registry: ValidatorRegistry,
): readonly Diagnostic[] {
  const diagnostics: Diagnostic[] = []

  if (!snapshot || typeof snapshot !== 'object') return diagnostics

  const snap = snapshot as Record<string, unknown>
  const config = snap.config as Record<string, unknown> | undefined
  if (!config) return diagnostics

  const sources = config.sources
  const styles = config.styles
  if (!Array.isArray(sources)) return diagnostics

  const allStyles: readonly Record<string, unknown>[] = Array.isArray(styles)
    ? (styles as Record<string, unknown>[])
    : []

  for (let si = 0; si < sources.length; si++) {
    const source = sources[si] as Record<string, unknown>
    if (typeof source.id !== 'string') continue

    // Check for missing legend_config
    if (!source.legend_config) {
      const isRaster = source.type === 'raster'
      diagnostics.push({
        code: 'MISSING_LEGEND_CONFIG',
        severity: isRaster ? 'warn' : 'error',
        path: `config.sources[${si}]`,
        message: `Source "${source.id}" has no legend_config.`,
        meta: { sourceId: source.id },
      })
      // Still check layer color binding even without legend
    }

    const layerInfo = checkSourceColorBinding(source, si, allStyles, registry)
    layerInfo.diagnostics.forEach((d) => diagnostics.push(d))

    const legendInfo = checkLegendColorBinding(source, si)
    legendInfo.diagnostics.forEach((d) => diagnostics.push(d))

    // Set-equality check: LEGEND_LAYER_MISMATCH
    const { layerColorParams, exemptOnlyParams } = layerInfo
    const { legendColorParams } = legendInfo

    // Layer-only: in layer but not in legend (excluding exempt-only)
    for (const key of layerColorParams) {
      if (!legendColorParams.has(key)) {
        diagnostics.push({
          code: 'LEGEND_LAYER_MISMATCH',
          severity: 'error',
          path: `config.sources[${si}].legend_config`,
          message: `Color param "@@#params.${key}" appears in paint but not in legend_config.items.`,
          meta: { direction: 'layer-only', key },
        })
      }
    }

    // Legend-only: in legend but not in layer (and not just exempt)
    for (const key of legendColorParams) {
      if (!layerColorParams.has(key) && !exemptOnlyParams.has(key)) {
        diagnostics.push({
          code: 'LEGEND_LAYER_MISMATCH',
          severity: 'error',
          path: `config.sources[${si}].legend_config`,
          message: `Color param "@@#params.${key}" appears in legend_config but not in paint.`,
          meta: { direction: 'legend-only', key },
        })
      }
    }
  }

  return diagnostics
}
