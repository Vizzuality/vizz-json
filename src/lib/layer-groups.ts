import type { InferredParam, LegendConfig, LegendItem } from './types'
import type { ItemParamMapping } from './legend-param-mapping'

export type LayerGroup = {
  readonly id: string
  readonly name: string
  readonly styleIndex: number
  readonly opacityParamKey: string | null
  readonly opacityLiteral: { paintKey: string; value: number } | null
  readonly visibilityParamKey: string | null
  readonly visibilityLiteral: 'visible' | 'none'
  readonly colorParams: readonly InferredParam[]
  readonly bodyParams: readonly InferredParam[]
  readonly legend: {
    type: 'basic' | 'choropleth' | 'gradient'
    items: readonly LegendItem[]
    paramMapping: ReadonlyMap<number, ItemParamMapping>
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
function collectParamRefs(node: unknown, refs: Set<string>): void {
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

function getStylesArray(
  parsedConfig: Readonly<Record<string, unknown>>,
): unknown[] | null {
  const withConfig = parsedConfig.config as Record<string, unknown> | undefined
  const styles = withConfig?.styles ?? parsedConfig.styles
  if (!Array.isArray(styles) || styles.length === 0) return null
  return styles
}

function buildId(style: StyleObject, index: number): string {
  const src = typeof style.source === 'string' ? style.source : 'layer'
  const typ = typeof style.type === 'string' ? style.type : 'style'
  return `${src}-${typ}-${index}`
}

function buildName(style: StyleObject, index: number): string {
  const src = typeof style.source === 'string' ? style.source : null
  const typ = typeof style.type === 'string' ? style.type : null
  if (!src && !typ) return `Layer ${index + 1}`
  if (!src) return typ!
  if (!typ) return src
  return `${src} · ${typ}`.trim()
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

/**
 * Assigns legend ownership to the layer group with the most overlapping
 * color-param refs. Ties resolved by lowest styleIndex.
 */
function assignLegend(
  groups: LayerGroup[],
  legendConfig: LegendConfig,
  paramMapping: ReadonlyMap<number, ItemParamMapping>,
): void {
  // Collect legend item → value-param-key mapping
  const legendValueKeys = new Set<string>()
  for (const mapping of paramMapping.values()) {
    if (mapping.valueParamKey) legendValueKeys.add(mapping.valueParamKey)
  }

  if (legendValueKeys.size === 0) {
    // No param refs in legend — assign to group 0 if any
    if (groups.length > 0) {
      const g = groups[0]
      groups[0] = {
        ...g,
        legend: {
          type: legendConfig.type,
          items: legendConfig.items,
          paramMapping,
        },
      }
    }
    return
  }

  // Count color-param overlap per group
  let bestGroup: LayerGroup | null = null
  let bestOverlap = -1

  for (const g of groups) {
    const groupColorKeys = new Set(g.colorParams.map((p) => p.key))
    let overlap = 0
    for (const key of legendValueKeys) {
      if (groupColorKeys.has(key)) overlap++
    }
    if (overlap > bestOverlap) {
      bestOverlap = overlap
      bestGroup = g
    }
  }

  if (!bestGroup) return

  const idx = groups.indexOf(bestGroup)
  groups[idx] = {
    ...bestGroup,
    legend: {
      type: legendConfig.type,
      items: legendConfig.items,
      paramMapping,
    },
  }
}

export function deriveLayerGroups(
  parsedConfig: Readonly<Record<string, unknown>> | null,
  inferredParams: readonly InferredParam[],
  legendConfig: LegendConfig | null,
  paramMapping: ReadonlyMap<number, ItemParamMapping>,
): LayerGroupsResult {
  if (!parsedConfig) {
    return { groups: [], orphans: [...inferredParams] }
  }

  const stylesArray = getStylesArray(parsedConfig)
  if (!stylesArray) {
    return { groups: [], orphans: [...inferredParams] }
  }

  // Track which param keys are claimed by at least one layer
  const claimedKeys = new Set<string>()

  const groups: LayerGroup[] = stylesArray.map((rawStyle, i) => {
    const style = (rawStyle as StyleObject | null | undefined) ?? {}

    const id = buildId(style, i)
    const name = buildName(style, i)

    // Collect all @@#params.X refs in paint, layout, filter, source-layer
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

    // Layer-scoped params: intersect inferredParams with refs
    const layerParams = inferredParams.filter((p) => refs.has(p.key))

    // Partition into color vs body (exclude opacity/visibility keys)
    const colorParams = layerParams.filter(
      (p) => p.control_type === 'color_picker',
    )
    const bodyParams = layerParams.filter(
      (p) =>
        p.control_type !== 'color_picker' &&
        p.key !== opacityParamKey &&
        p.key !== visibilityParamKey,
    )

    for (const p of layerParams) claimedKeys.add(p.key)

    return {
      id,
      name,
      styleIndex: i,
      opacityParamKey,
      opacityLiteral,
      visibilityParamKey,
      visibilityLiteral,
      colorParams,
      bodyParams,
      legend: null,
    }
  })

  // Assign legend to the most-overlapping group
  if (legendConfig) {
    assignLegend(groups, legendConfig, paramMapping)
  }

  const orphans = inferredParams.filter((p) => !claimedKeys.has(p.key))

  return { groups, orphans }
}
