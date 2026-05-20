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

function syncBuildColormapStops(
  node: unknown,
  stopsWithKeys: readonly {
    colorParamKey: string
    thresholdParamKey: string
  }[],
): unknown {
  if (Array.isArray(node)) {
    return node.map((item) => syncBuildColormapStops(item, stopsWithKeys))
  }

  if (node !== null && typeof node === 'object') {
    const obj = node as Record<string, unknown>

    if (obj['@@function'] === 'buildColormap' && Array.isArray(obj.stops)) {
      return {
        ...obj,
        stops: stopsWithKeys.map((stop) => [
          `@@#params.${stop.thresholdParamKey}`,
          `@@#params.${stop.colorParamKey}`,
        ]),
      }
    }

    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [
        key,
        syncBuildColormapStops(value, stopsWithKeys),
      ]),
    )
  }

  return node
}

type ParamEntry = Record<string, unknown> & { key: string; group?: string }

export function serializeGradientToJson(
  currentJson: string,
  stops: readonly GradientStop[],
  sourceId: string,
): string {
  const parsed = JSON.parse(currentJson) as Record<string, unknown>
  const sortedStops = [...stops].sort((a, b) => a.position - b.position)

  // Source gradients that do not bind any stop to a threshold param (e.g.
  // heatmap-color anchored on heatmap-density, or legends decoupled from a
  // data property) must NOT be retro-fitted with synthetic threshold params.
  // Fabricating them produces all-zero defaults, collapses the legend bar to
  // a single point (renders as transparent), and breaks maplibre interpolate
  // expressions ("Input/output pairs must be defined using literal numeric
  // values"). Detect the no-threshold case up front and skip both the
  // threshold-param generation and the interpolate rewrite.
  const sourceHasThresholds = sortedStops.some(
    (s) => s.thresholdParamKey !== undefined,
  )

  const allExistingKeys = (
    (parsed.params_config as ParamEntry[] | undefined) ?? []
  ).map((p) => p.key)

  let colorIdx = findNextAvailableIndex(allExistingKeys, 'color_')
  let thresholdIdx = findNextAvailableIndex(allExistingKeys, 'threshold_')

  const stopsWithKeys = sortedStops.map((stop) => {
    const colorParamKey = stop.colorParamKey ?? `color_${colorIdx++}`
    const thresholdParamKey = sourceHasThresholds
      ? (stop.thresholdParamKey ?? `threshold_${thresholdIdx++}`)
      : undefined
    return { ...stop, colorParamKey, thresholdParamKey }
  })

  // --- Rebuild params_config ---
  const oldParams = (parsed.params_config as ParamEntry[] | undefined) ?? []
  const newKeysSet = new Set<string>(
    stopsWithKeys.flatMap((s) =>
      s.thresholdParamKey
        ? [s.colorParamKey, s.thresholdParamKey]
        : [s.colorParamKey],
    ),
  )

  const preservedParams = oldParams.filter((p) => {
    if (p.group !== 'legend') return true
    if (newKeysSet.has(p.key)) return false
    return !/^(color_|threshold_)/.test(p.key)
  })

  const oldParamsByKey = new Map(oldParams.map((p) => [p.key, p]))

  const allDataValues = stopsWithKeys.map((s) => s.dataValue)
  const dataMin = Math.min(...allDataValues)
  const dataMax = Math.max(...allDataValues)
  const dataRange = dataMax - dataMin || 1

  const existingThresholds = stopsWithKeys
    .map((s) =>
      s.thresholdParamKey ? oldParamsByKey.get(s.thresholdParamKey) : undefined,
    )
    .filter((p) => p != null)

  const sharedMin =
    existingThresholds.length > 0
      ? Math.min(
          ...existingThresholds
            .map((p) => p.min as number | undefined)
            .filter((v) => v != null),
        )
      : Math.floor(dataMin - dataRange * 0.1)

  const sharedMax =
    existingThresholds.length > 0
      ? Math.max(
          ...existingThresholds
            .map((p) => p.max as number | undefined)
            .filter((v) => v != null),
        )
      : Math.ceil(dataMax + dataRange * 0.1)

  const sharedStep =
    existingThresholds.length > 0 && existingThresholds[0].step != null
      ? (existingThresholds[0].step as number)
      : Math.max(Math.round(dataRange / 100), 1)

  const newParams: ParamEntry[] = stopsWithKeys.flatMap((stop) => {
    const colorParam: ParamEntry = {
      key: stop.colorParamKey,
      default: stop.color,
      group: 'legend',
    }
    if (!stop.thresholdParamKey) return [colorParam]
    return [
      {
        key: stop.thresholdParamKey,
        default: stop.dataValue,
        min: sharedMin,
        max: sharedMax,
        step: sharedStep,
        group: 'legend',
      },
      colorParam,
    ]
  })

  const newParamsConfig = [...preservedParams, ...newParams]

  const newLegendConfig = {
    type: 'gradient',
    items: stopsWithKeys.map((stop) => ({
      label: stop.label,
      value: `@@#params.${stop.colorParamKey}`,
    })),
  }

  // --- Rebuild interpolate expression (immutable) ---
  // Only when the source had threshold params: in that case the interpolate
  // is data-driven and its [threshold, color] pairs need to match the new
  // stop list. Without thresholds the interpolate inputs are not parameters
  // (e.g. heatmap-density, zoom literals) and must be left alone.
  const config = parsed.config as Record<string, unknown> | undefined

  let newConfig = config
  if (sourceHasThresholds && config) {
    const interpolatePairs = stopsWithKeys.flatMap((stop) => [
      `@@#params.${stop.thresholdParamKey}`,
      `@@#params.${stop.colorParamKey}`,
    ])
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

  const syncedConfig = sourceHasThresholds
    ? syncBuildColormapStops(
        newConfig ?? config,
        stopsWithKeys.map((s) => ({
          colorParamKey: s.colorParamKey,
          thresholdParamKey: s.thresholdParamKey as string,
        })),
      )
    : (newConfig ?? config)

  // Write legend_config into the matching source (per-source model),
  // not at the top level.
  const configObj = syncedConfig as Record<string, unknown>
  const rawSources = configObj.sources as readonly unknown[] | undefined

  if (!Array.isArray(rawSources)) {
    throw new Error(
      'serializeGradientToJson: config.sources is missing or not an array',
    )
  }

  const matched = rawSources.some(
    (src) => (src as { id?: unknown }).id === sourceId,
  )
  if (!matched) {
    throw new Error(
      `serializeGradientToJson: no source with id "${sourceId}" in config.sources`,
    )
  }

  const newSources = rawSources.map((src) =>
    (src as { id?: unknown }).id === sourceId
      ? { ...(src as Record<string, unknown>), legend_config: newLegendConfig }
      : src,
  )

  const finalConfig = { ...configObj, sources: newSources }

  const result = {
    ...parsed,
    config: finalConfig,
    params_config: newParamsConfig,
  }

  return JSON.stringify(result, null, 2)
}
