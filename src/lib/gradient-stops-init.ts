import type { LegendItem, InferredParam } from '#/lib/types'
import type { ItemParamMapping } from '#/lib/legend-param-mapping'
import type { GradientStop } from '#/lib/gradient-types'

export function initializeGradientStops(
  items: readonly LegendItem[],
  paramMapping: ReadonlyMap<number, ItemParamMapping>,
  legendParams: readonly InferredParam[],
  values: Record<string, unknown>,
): readonly GradientStop[] {
  const colorKeys = new Set<string>()
  for (const mapping of paramMapping.values()) {
    if (mapping.valueParamKey) colorKeys.add(mapping.valueParamKey)
  }

  const thresholdParams = legendParams
    .filter((p) => p.control_type === 'slider' && !colorKeys.has(p.key))
    .sort((a, b) => {
      const aVal = typeof values[a.key] === 'number' ? (values[a.key] as number) : 0
      const bVal = typeof values[b.key] === 'number' ? (values[b.key] as number) : 0
      return aVal - bVal
    })

  const hasThresholds = thresholdParams.length > 0

  const stops: GradientStop[] = items.map((item, i) => {
    const mapping = paramMapping.get(i)
    const colorParamKey = mapping?.valueParamKey
    const thresholdParam = thresholdParams[i]
    const thresholdParamKey = thresholdParam?.key
    const dataValue =
      thresholdParamKey && typeof values[thresholdParamKey] === 'number'
        ? (values[thresholdParamKey] as number)
        : 0

    return {
      id: crypto.randomUUID(),
      color: typeof item.value === 'string' ? item.value : '#000000',
      position: 0,
      dataValue,
      label: item.label,
      colorParamKey,
      thresholdParamKey,
    }
  })

  if (!hasThresholds || stops.length === 0) {
    return stops.map((s, i) => ({
      ...s,
      position: stops.length === 1 ? 0.5 : i / (stops.length - 1),
    }))
  }

  const dataValues = stops.map((s) => s.dataValue)
  const minVal = Math.min(...dataValues)
  const maxVal = Math.max(...dataValues)
  const range = maxVal - minVal

  if (range === 0) {
    return stops.map((s, i) => ({
      ...s,
      position: stops.length === 1 ? 0.5 : i / (stops.length - 1),
    }))
  }

  return stops.map((s) => ({
    ...s,
    position: (s.dataValue - minVal) / range,
  }))
}
