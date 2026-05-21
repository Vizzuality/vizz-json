import type { Diagnostic } from '../types'
import { OPACITY_PAINT_PROPS } from '../color-positions'

const PARAM_REF_RE = /^@@#params\.(.+)$/

function paramRefKey(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  return PARAM_REF_RE.exec(value)?.[1]
}

/**
 * Recursively collect all @@#params.X keys from a value.
 * Handles nested MapLibre expressions (arrays) so refs in interpolate/step/case
 * are not missed.
 */
function collectParamRefsDeep(value: unknown): string[] {
  if (typeof value === 'string') {
    const key = paramRefKey(value)
    return key ? [key] : []
  }
  if (Array.isArray(value)) {
    return value.flatMap(collectParamRefsDeep)
  }
  return []
}

/**
 * For single-source snapshots: require exact key 'opacity' / 'visibility'.
 * For multi-source snapshots: for each source S, require ONE ParamConfig with
 * source === S.id and a key matching opacity/visibility by suffix or exact name.
 *
 * This is a v2 compromise — see src/lib/validator/README.md for full explanation.
 */
function isOpacityParam(
  p: { key: string; default: unknown; source?: string; options?: unknown },
  sourceId: string,
  isSingleSource: boolean,
): boolean {
  if (isSingleSource) {
    return p.key === 'opacity'
  }
  // Multi-source: match by source binding and key pattern
  if (p.source !== sourceId) return false
  return (
    p.key === 'opacity' ||
    p.key.endsWith('_opacity') ||
    p.key.endsWith('.opacity')
  )
}

function isVisibilityParam(
  p: { key: string; default: unknown; source?: string; options?: unknown },
  sourceId: string,
  isSingleSource: boolean,
): boolean {
  if (isSingleSource) {
    return p.key === 'visibility'
  }
  // Multi-source: match by source binding and key pattern
  if (p.source !== sourceId) return false
  return (
    p.key === 'visibility' ||
    p.key.endsWith('_visibility') ||
    p.key.endsWith('.visibility')
  )
}

/**
 * Collect all @@#params.X refs in the paint + layout of styles belonging to a source.
 */
function collectStyleRefs(
  sourceId: string,
  styles: readonly Record<string, unknown>[],
): {
  opacityPropRefs: Set<string>
  layoutVisibilityRefs: Set<string>
} {
  const opacityPropRefs = new Set<string>()
  const layoutVisibilityRefs = new Set<string>()

  for (const style of styles) {
    if (style.source !== sourceId) continue

    const paint = style.paint as Record<string, unknown> | undefined
    if (paint) {
      for (const prop of OPACITY_PAINT_PROPS) {
        for (const key of collectParamRefsDeep(paint[prop])) {
          opacityPropRefs.add(key)
        }
      }
    }

    const layout = style.layout as Record<string, unknown> | undefined
    if (layout) {
      for (const key of collectParamRefsDeep(layout.visibility)) {
        layoutVisibilityRefs.add(key)
      }
    }
  }

  return { opacityPropRefs, layoutVisibilityRefs }
}

export function checkOpacityVisibility(
  snapshot: unknown,
): readonly Diagnostic[] {
  const diagnostics: Diagnostic[] = []

  if (!snapshot || typeof snapshot !== 'object') return diagnostics

  const snap = snapshot as Record<string, unknown>
  const config = snap.config as Record<string, unknown> | undefined
  if (!config) return diagnostics

  const sources = config.sources
  const styles = config.styles
  const paramsConfig = snap.params_config

  if (!Array.isArray(sources)) return diagnostics

  const allStyles: readonly Record<string, unknown>[] = Array.isArray(styles)
    ? (styles as Record<string, unknown>[])
    : []

  const allParams: readonly {
    key: string
    default: unknown
    source?: string
    options?: unknown
  }[] = Array.isArray(paramsConfig) ? paramsConfig : []

  const isSingleSource = sources.length <= 1

  for (let si = 0; si < sources.length; si++) {
    const source = sources[si] as Record<string, unknown>
    if (typeof source.id !== 'string') continue
    const sourceId = source.id
    const sourcePath = `config.sources[${si}]`

    const opacityParam = allParams.find((p) =>
      isOpacityParam(p, sourceId, isSingleSource),
    )
    const visibilityParam = allParams.find((p) =>
      isVisibilityParam(p, sourceId, isSingleSource),
    )

    // MISSING_OPACITY_PARAM
    if (!opacityParam) {
      diagnostics.push({
        code: 'MISSING_OPACITY_PARAM',
        severity: 'error',
        path: sourcePath,
        message: `Source "${sourceId}" has no opacity param in params_config.`,
        meta: { sourceId },
      })
    }

    // MISSING_VISIBILITY_PARAM
    if (!visibilityParam) {
      diagnostics.push({
        code: 'MISSING_VISIBILITY_PARAM',
        severity: 'error',
        path: sourcePath,
        message: `Source "${sourceId}" has no visibility param in params_config.`,
        meta: { sourceId },
      })
    }

    const { opacityPropRefs, layoutVisibilityRefs } = collectStyleRefs(
      sourceId,
      allStyles,
    )

    // OPACITY_NOT_WIRED: opacity param exists but its key is not referenced in any opacity paint prop
    if (opacityParam) {
      if (!opacityPropRefs.has(opacityParam.key)) {
        diagnostics.push({
          code: 'OPACITY_NOT_WIRED',
          severity: 'error',
          path: sourcePath,
          message: `Opacity param "${opacityParam.key}" exists but is not wired to any opacity paint property for source "${sourceId}".`,
          meta: { sourceId, paramKey: opacityParam.key },
        })
      }
    }

    // VISIBILITY_NOT_WIRED: visibility param exists but its key is not referenced in layout.visibility
    if (visibilityParam) {
      if (!layoutVisibilityRefs.has(visibilityParam.key)) {
        diagnostics.push({
          code: 'VISIBILITY_NOT_WIRED',
          severity: 'error',
          path: sourcePath,
          message: `Visibility param "${visibilityParam.key}" exists but is not wired to layout.visibility for source "${sourceId}".`,
          meta: { sourceId, paramKey: visibilityParam.key },
        })
      }
    }
  }

  return diagnostics
}
