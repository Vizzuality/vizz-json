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
