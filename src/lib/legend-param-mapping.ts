import type { LegendConfig, InferredParam } from './types'

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

export function getOrphanLegendParams(
  legendParams: readonly InferredParam[],
  paramMapping: ReadonlyMap<number, ItemParamMapping>,
  legendType?: string,
): readonly InferredParam[] {
  const referencedKeys = new Set<string>()
  const colorKeys = new Set<string>()
  for (const mapping of paramMapping.values()) {
    if (mapping.valueParamKey) {
      referencedKeys.add(mapping.valueParamKey)
      colorKeys.add(mapping.valueParamKey)
    }
    if (mapping.labelParamKey) referencedKeys.add(mapping.labelParamKey)
  }
  return legendParams.filter((p) => {
    if (referencedKeys.has(p.key)) return false
    if (
      legendType === 'gradient' &&
      p.control_type === 'slider' &&
      !colorKeys.has(p.key)
    )
      return false
    return true
  })
}

function readSourcesArray(
  parsedConfig: Readonly<Record<string, unknown>>,
): readonly Record<string, unknown>[] | null {
  const withConfig = parsedConfig.config as Record<string, unknown> | undefined
  const sources = withConfig?.sources ?? parsedConfig.sources
  if (!Array.isArray(sources)) return null
  return sources as readonly Record<string, unknown>[]
}

export function extractSourceLegendMappings(
  parsedConfig: Readonly<Record<string, unknown>> | null,
): readonly {
  sourceId: string
  rawLegend: RawLegendConfig
  paramMapping: ReadonlyMap<number, ItemParamMapping>
}[] {
  if (!parsedConfig) return []
  const sources = readSourcesArray(parsedConfig)
  if (!sources) return []
  const out: {
    sourceId: string
    rawLegend: RawLegendConfig
    paramMapping: ReadonlyMap<number, ItemParamMapping>
  }[] = []
  for (const src of sources) {
    if (typeof src.id !== 'string') continue
    const legend = src.legend_config as RawLegendConfig | undefined
    if (!legend) continue
    out.push({
      sourceId: src.id,
      rawLegend: legend,
      paramMapping: extractLegendParamKeys(legend),
    })
  }
  return out
}

export function getOrphanLegendParamsAcrossSources(
  legendParams: readonly InferredParam[],
  perSource: readonly {
    paramMapping: ReadonlyMap<number, ItemParamMapping>
    rawLegend: RawLegendConfig
  }[],
): readonly InferredParam[] {
  const referencedKeys = new Set<string>()
  const colorKeys = new Set<string>()
  const hasGradient = perSource.some((s) => s.rawLegend.type === 'gradient')
  for (const { paramMapping } of perSource) {
    for (const m of paramMapping.values()) {
      if (m.valueParamKey) {
        referencedKeys.add(m.valueParamKey)
        colorKeys.add(m.valueParamKey)
      }
      if (m.labelParamKey) referencedKeys.add(m.labelParamKey)
    }
  }
  return legendParams.filter((p) => {
    if (referencedKeys.has(p.key)) return false
    if (hasGradient && p.control_type === 'slider' && !colorKeys.has(p.key))
      return false
    return true
  })
}
