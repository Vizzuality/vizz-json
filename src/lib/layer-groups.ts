import type { InferredParam, LegendItem, SourceConfig } from './types'
import type { ItemParamMapping } from './legend-param-mapping'
import type { SourceLegendEntry } from '#/lib/pipeline/types'

export type LayerGroupStyle = {
  readonly index: number
  readonly name: string
  readonly opacityParamKey: string | null
  readonly opacityLiteral: { paintKey: string; value: number } | null
  readonly visibilityParamKey: string | null
  readonly visibilityLiteral: 'visible' | 'none'
  readonly colorParams: readonly InferredParam[]
  readonly bodyParams: readonly InferredParam[]
}

export type LayerGroup = {
  readonly id: string
  readonly name: string
  readonly sourceIndex: number
  readonly styles: readonly LayerGroupStyle[]
  readonly legend: {
    readonly type: 'basic' | 'choropleth' | 'gradient'
    readonly items: readonly LegendItem[]
    readonly paramMapping: ReadonlyMap<number, ItemParamMapping>
    /** Slider params with group='legend' that belong to this source's styles — used by gradient editor */
    readonly thresholdParams: readonly InferredParam[]
  } | null
}

export type LayerGroupsResult = {
  readonly groups: readonly LayerGroup[]
  readonly orphans: readonly InferredParam[]
}

const PARAM_REF_PREFIX = '@@#params.'

/** Extract a param key from a string value if it starts with @@#params. */
function extractParamRef(value: unknown): string | null {
  if (typeof value !== 'string') return null
  if (!value.startsWith(PARAM_REF_PREFIX)) return null
  return value.slice(PARAM_REF_PREFIX.length)
}

/** Walk any JSON value and collect all @@#params.X keys referenced */
export function collectParamRefs(node: unknown, refs: Set<string>): void {
  if (typeof node === 'string') {
    const key = extractParamRef(node)
    if (key) refs.add(key)
    return
  }
  if (Array.isArray(node)) {
    for (const item of node) collectParamRefs(item, refs)
    return
  }
  if (node !== null && typeof node === 'object') {
    for (const val of Object.values(node as Record<string, unknown>)) {
      collectParamRefs(val, refs)
    }
  }
}

type StyleObject = Record<string, unknown>

function getSourcesArray(
  parsedConfig: Readonly<Record<string, unknown>>,
): unknown[] | null {
  const withConfig = parsedConfig.config as Record<string, unknown> | undefined
  const sources = withConfig?.sources ?? parsedConfig.sources
  if (!Array.isArray(sources) || sources.length === 0) return null
  return sources
}

function getStylesArray(
  parsedConfig: Readonly<Record<string, unknown>>,
): unknown[] | null {
  const withConfig = parsedConfig.config as Record<string, unknown> | undefined
  const styles = withConfig?.styles ?? parsedConfig.styles
  if (!Array.isArray(styles) || styles.length === 0) return null
  return styles
}

function detectOpacity(style: StyleObject): {
  opacityParamKey: string | null
  opacityLiteral: { paintKey: string; value: number } | null
} {
  const paint = style.paint as Record<string, unknown> | undefined
  if (!paint) return { opacityParamKey: null, opacityLiteral: null }

  const keys = Object.keys(paint).sort()
  for (const key of keys) {
    if (!key.toLowerCase().endsWith('-opacity')) continue
    const val = paint[key]
    const paramKey = extractParamRef(val)
    if (paramKey) return { opacityParamKey: paramKey, opacityLiteral: null }
    if (typeof val === 'number') {
      return {
        opacityParamKey: null,
        opacityLiteral: { paintKey: key, value: val },
      }
    }
  }
  return { opacityParamKey: null, opacityLiteral: null }
}

function detectVisibility(style: StyleObject): {
  visibilityParamKey: string | null
  visibilityLiteral: 'visible' | 'none'
} {
  const layout = style.layout as Record<string, unknown> | undefined
  const raw = layout?.visibility
  const paramKey = extractParamRef(raw)
  if (paramKey)
    return { visibilityParamKey: paramKey, visibilityLiteral: 'visible' }
  if (raw === 'none')
    return { visibilityParamKey: null, visibilityLiteral: 'none' }
  return { visibilityParamKey: null, visibilityLiteral: 'visible' }
}

function buildStyleForSource(
  rawStyle: unknown,
  globalIndex: number,
  inferredParams: readonly InferredParam[],
): LayerGroupStyle {
  const style = (rawStyle as StyleObject | null | undefined) ?? {}

  const refs = new Set<string>()
  collectParamRefs(style.paint, refs)
  collectParamRefs(style.layout, refs)
  collectParamRefs(style.filter, refs)
  if (typeof style['source-layer'] === 'string') {
    const key = extractParamRef(style['source-layer'])
    if (key) refs.add(key)
  }

  const { opacityParamKey, opacityLiteral } = detectOpacity(style)
  const { visibilityParamKey, visibilityLiteral } = detectVisibility(style)

  const layerParams = inferredParams.filter((p) => refs.has(p.key))
  const colorParams = layerParams.filter(
    (p) => p.control_type === 'color_picker',
  )
  const bodyParams = layerParams.filter(
    (p) =>
      p.control_type !== 'color_picker' &&
      p.key !== opacityParamKey &&
      p.key !== visibilityParamKey,
  )

  const typ = typeof style.type === 'string' ? style.type : 'style'

  return {
    index: globalIndex,
    name: typ,
    opacityParamKey,
    opacityLiteral,
    visibilityParamKey,
    visibilityLiteral,
    colorParams,
    bodyParams,
  }
}

export function deriveLayerGroups(
  parsedConfig: Readonly<Record<string, unknown>> | null,
  inferredParams: readonly InferredParam[],
  sourceLegends: readonly SourceLegendEntry[],
): LayerGroupsResult {
  if (!parsedConfig) {
    return { groups: [], orphans: [...inferredParams] }
  }

  const sourcesArray = getSourcesArray(parsedConfig)
  const stylesArray = getStylesArray(parsedConfig)

  if (!sourcesArray || !stylesArray) {
    return { groups: [], orphans: [...inferredParams] }
  }

  // Build a lookup from sourceId → SourceLegendEntry for O(1) access
  const legendBySourceId = new Map<string, SourceLegendEntry>()
  for (const entry of sourceLegends) {
    legendBySourceId.set(entry.sourceId, entry)
  }

  // Track which param keys are claimed by at least one source's styles
  const claimedKeys = new Set<string>()

  const groups: LayerGroup[] = []

  for (let si = 0; si < sourcesArray.length; si++) {
    const rawSource = sourcesArray[si] as SourceConfig | null | undefined
    if (!rawSource || typeof rawSource.id !== 'string') continue

    const sourceId = rawSource.id

    // Find all styles whose `source` matches this source's id
    const sourceStyles: { rawStyle: unknown; globalIndex: number }[] = []
    for (let ti = 0; ti < stylesArray.length; ti++) {
      const rawStyle = stylesArray[ti] as StyleObject | null | undefined
      if (rawStyle && rawStyle.source === sourceId) {
        sourceStyles.push({ rawStyle, globalIndex: ti })
      }
    }

    // Skip sources with no matching styles
    if (sourceStyles.length === 0) continue

    // Build LayerGroupStyle for each style
    const groupStyles = sourceStyles.map(({ rawStyle, globalIndex }) =>
      buildStyleForSource(rawStyle, globalIndex, inferredParams),
    )

    // Aggregate all param keys claimed by this source's styles
    for (const gs of groupStyles) {
      for (const p of gs.colorParams) claimedKeys.add(p.key)
      for (const p of gs.bodyParams) claimedKeys.add(p.key)
      if (gs.opacityParamKey) claimedKeys.add(gs.opacityParamKey)
      if (gs.visibilityParamKey) claimedKeys.add(gs.visibilityParamKey)
    }

    // Build legend from per-source resolved legend entry
    const legendEntry = legendBySourceId.get(sourceId)
    let legend: LayerGroup['legend'] = null

    if (legendEntry) {
      legend = {
        type: legendEntry.resolvedLegend.type,
        items: legendEntry.resolvedLegend.items,
        paramMapping: legendEntry.paramMapping,
        thresholdParams: legendEntry.thresholdParams,
      }
    }

    groups.push({
      id: sourceId,
      name: sourceId,
      sourceIndex: si,
      styles: groupStyles,
      legend,
    })
  }

  const orphans = inferredParams.filter((p) => !claimedKeys.has(p.key))

  return { groups, orphans }
}
