import type { GradientStop } from '#/lib/gradient-types'

function findNextAvailableIndex(
  existingKeys: readonly string[],
  prefix: string,
): number {
  let n = 1
  while (existingKeys.some((k) => k === `${prefix}${n}`)) {
    n++
  }
  return n
}

type ParamEntry = Record<string, unknown> & { key: string; group?: string }

export function serializeGradientToJson(
  currentJson: string,
  stops: readonly GradientStop[],
): string {
  const parsed = JSON.parse(currentJson) as Record<string, unknown>
  const sortedStops = [...stops].sort((a, b) => a.position - b.position)

  const allExistingKeys = (
    (parsed.params_config as ParamEntry[] | undefined) ?? []
  ).map((p) => p.key)

  let colorIdx = findNextAvailableIndex(allExistingKeys, 'color_')
  let thresholdIdx = findNextAvailableIndex(allExistingKeys, 'threshold_')

  const stopsWithKeys = sortedStops.map((stop) => {
    const colorParamKey = stop.colorParamKey ?? `color_${colorIdx++}`
    const thresholdParamKey = stop.thresholdParamKey ?? `threshold_${thresholdIdx++}`
    return { ...stop, colorParamKey, thresholdParamKey }
  })

  // --- Rebuild params_config ---
  const oldParams = (parsed.params_config as ParamEntry[] | undefined) ?? []
  const newKeysSet = new Set(
    stopsWithKeys.flatMap((s) => [s.colorParamKey, s.thresholdParamKey]),
  )

  const preservedParams = oldParams.filter((p) => {
    if (p.group !== 'legend') return true
    if (newKeysSet.has(p.key)) return false
    return !/^(color_|threshold_)/.test(p.key)
  })

  const newParams: ParamEntry[] = stopsWithKeys.flatMap((stop) => [
    {
      key: stop.thresholdParamKey,
      default: stop.dataValue,
      min: 0,
      max: Math.max(stop.dataValue * 2, 1),
      step: Math.max(Math.round(stop.dataValue / 100), 1),
      group: 'legend',
    },
    {
      key: stop.colorParamKey,
      default: stop.color,
      group: 'legend',
    },
  ])

  const newParamsConfig = [...preservedParams, ...newParams]

  const newLegendConfig = {
    type: 'gradient',
    items: stopsWithKeys.map((stop) => ({
      label: stop.label,
      value: `@@#params.${stop.colorParamKey}`,
    })),
  }

  // --- Rebuild interpolate expression (immutable) ---
  const config = parsed.config as Record<string, unknown> | undefined
  const interpolatePairs = stopsWithKeys.flatMap((stop) => [
    `@@#params.${stop.thresholdParamKey}`,
    `@@#params.${stop.colorParamKey}`,
  ])

  let newConfig = config
  if (config) {
    const styles = config.styles as Record<string, unknown>[] | undefined
    if (styles) {
      const newStyles = styles.map((style) => {
        const paint = style.paint as Record<string, unknown> | undefined
        if (!paint) return style

        const newPaint = Object.fromEntries(
          Object.entries(paint).map(([prop, val]) => {
            if (Array.isArray(val) && val[0] === 'interpolate') {
              return [prop, [...val.slice(0, 3), ...interpolatePairs]]
            }
            return [prop, val]
          }),
        )
        return { ...style, paint: newPaint }
      })
      newConfig = { ...config, styles: newStyles }
    }
  }

  const result = {
    ...parsed,
    ...(newConfig !== config ? { config: newConfig } : {}),
    params_config: newParamsConfig,
    legend_config: newLegendConfig,
  }

  return JSON.stringify(result, null, 2)
}
