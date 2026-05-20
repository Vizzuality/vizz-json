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

function collectStringRefs(node: unknown, out: Set<string>): void {
  if (typeof node === 'string') {
    if (node.startsWith('@@#params.')) out.add(node)
    return
  }
  if (Array.isArray(node)) {
    for (const item of node) collectStringRefs(item, out)
    return
  }
  if (node !== null && typeof node === 'object') {
    for (const v of Object.values(node as Record<string, unknown>)) {
      collectStringRefs(v, out)
    }
  }
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
  //
  // Scope rewrites by sourceId AND by paint props whose interpolate
  // currently references one of the managed param refs (the keys this
  // legend owns). This protects unrelated styles on the same or other
  // sources (e.g. zoom-driven heatmap-radius, another layer's gradient).
  const config = parsed.config as Record<string, unknown> | undefined

  const rawSources = config?.sources as readonly unknown[] | undefined
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

  // Build the set of param refs this legend currently owns. Harvested from
  // both the incoming stops (existing keys the user kept) and the matched
  // source's current legend_config items (catches the case where stops were
  // wiped but legend still references them).
  const managedRefs = new Set<string>()
  for (const stop of stopsWithKeys) {
    managedRefs.add(`@@#params.${stop.colorParamKey}`)
    if (stop.thresholdParamKey) {
      managedRefs.add(`@@#params.${stop.thresholdParamKey}`)
    }
  }
  const matchedSource = rawSources.find(
    (src) => (src as { id?: unknown }).id === sourceId,
  ) as Record<string, unknown> | undefined
  const currentLegend = matchedSource?.legend_config as
    | { items?: readonly { value?: unknown }[] }
    | undefined
  if (currentLegend?.items) {
    for (const item of currentLegend.items) {
      if (typeof item.value === 'string' && item.value.startsWith('@@#params.'))
        managedRefs.add(item.value)
    }
  }

  let newStylesArr = config?.styles as Record<string, unknown>[] | undefined
  if (sourceHasThresholds && newStylesArr) {
    const interpolatePairs = stopsWithKeys.flatMap((stop) => [
      `@@#params.${stop.thresholdParamKey}`,
      `@@#params.${stop.colorParamKey}`,
    ])
    newStylesArr = newStylesArr.map((style) => {
      if (style.source !== sourceId) return style
      const paint = style.paint as Record<string, unknown> | undefined
      if (!paint) return style

      const newPaint = Object.fromEntries(
        Object.entries(paint).map(([prop, val]) => {
          if (!Array.isArray(val) || val[0] !== 'interpolate')
            return [prop, val]
          const refs = new Set<string>()
          collectStringRefs(val, refs)
          const owns = [...refs].some((r) => managedRefs.has(r))
          if (!owns) return [prop, val]
          return [prop, [...val.slice(0, 3), ...interpolatePairs]]
        }),
      )
      return { ...style, paint: newPaint }
    })
  }

  // Sync buildColormap inside the matched source only — keeps other sources
  // (which may have their own buildColormap on unrelated params) untouched.
  const newSourcesArr = rawSources.map((src) => {
    const s = src as Record<string, unknown>
    if (s.id !== sourceId) return s
    let next: Record<string, unknown> = s
    if (sourceHasThresholds) {
      next = syncBuildColormapStops(
        s,
        stopsWithKeys.map((stop) => ({
          colorParamKey: stop.colorParamKey,
          thresholdParamKey: stop.thresholdParamKey as string,
        })),
      ) as Record<string, unknown>
    }
    return { ...next, legend_config: newLegendConfig }
  })

  const finalConfig = {
    ...(config ?? {}),
    ...(newStylesArr ? { styles: newStylesArr } : {}),
    sources: newSourcesArr,
  }

  const result = {
    ...parsed,
    config: finalConfig,
    params_config: newParamsConfig,
  }

  return JSON.stringify(result, null, 2)
}
