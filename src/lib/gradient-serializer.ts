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
    return !/^(color_|stop_|threshold_)/.test(p.key)
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

  const updatedParsed = {
    ...parsed,
    params_config: [...preservedParams, ...newParams],
    legend_config: {
      type: 'gradient',
      items: stopsWithKeys.map((stop, i) => ({
        label: stop.label || `Stop ${i + 1}`,
        value: `@@#params.${stop.colorParamKey}`,
      })),
    },
  }

  // --- Rebuild interpolate expression ---
  const config = updatedParsed.config as Record<string, unknown> | undefined
  if (config) {
    const styles = config.styles as Record<string, unknown>[] | undefined
    if (styles) {
      const updatedStyles = styles.map((style) => {
        const paint = style.paint as Record<string, unknown> | undefined
        if (!paint) return style

        const updatedPaint = Object.fromEntries(
          Object.entries(paint).map(([prop, val]) => {
            if (Array.isArray(val) && val[0] === 'interpolate') {
              const header = val.slice(0, 3)
              const pairs = stopsWithKeys.flatMap((stop) => [
                `@@#params.${stop.thresholdParamKey}`,
                `@@#params.${stop.colorParamKey}`,
              ])
              return [prop, [...header, ...pairs]]
            }
            return [prop, val]
          }),
        )

        return { ...style, paint: updatedPaint }
      })

      return JSON.stringify(
        { ...updatedParsed, config: { ...config, styles: updatedStyles } },
        null,
        2,
      )
    }
  }

  return JSON.stringify(updatedParsed, null, 2)
}
