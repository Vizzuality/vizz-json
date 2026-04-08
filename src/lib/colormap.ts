export type Rgba = readonly [number, number, number, number]
export type ColormapStop = readonly [number, string]
export type IntervalEntry = readonly [readonly [number, number], Rgba]
export type IntervalColormap = readonly IntervalEntry[]

export function hexToRgba(hex: string): Rgba {
  const h = hex.replace('#', '')
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
    255,
  ]
}

const GRADIENT_STEPS = 16

export function interpolateColormap(
  stops: readonly ColormapStop[],
): IntervalColormap {
  if (stops.length === 0) return []

  const sorted = [...stops].sort((a, b) => a[0] - b[0])
  const rgbaStops = sorted.map(
    ([value, color]) => [value, hexToRgba(color)] as const,
  )

  if (rgbaStops.length === 1) {
    const [value, rgba] = rgbaStops[0]
    return [[[value, value], rgba]]
  }

  const minVal = rgbaStops[0][0]
  const maxVal = rgbaStops[rgbaStops.length - 1][0]

  if (minVal === maxVal) {
    const rgba = rgbaStops[rgbaStops.length - 1][1]
    return [[[minVal, maxVal], rgba]]
  }

  const range = maxVal - minVal
  const step = range / GRADIENT_STEPS

  return Array.from({ length: GRADIENT_STEPS }, (_, i) => {
    const lower = minVal + i * step
    const upper = i === GRADIENT_STEPS - 1 ? maxVal : minVal + (i + 1) * step
    const dataValue = i === GRADIENT_STEPS - 1 ? maxVal : lower

    let lowerIdx = rgbaStops.length - 2
    for (let s = 0; s < rgbaStops.length - 1; s++) {
      if (rgbaStops[s + 1][0] >= dataValue) {
        lowerIdx = s
        break
      }
    }
    const upperIdx = Math.min(lowerIdx + 1, rgbaStops.length - 1)

    const [lowerVal, lowerRgba] = rgbaStops[lowerIdx]
    const [upperVal, upperRgba] = rgbaStops[upperIdx]

    const segmentRange = upperVal - lowerVal || 1
    const t = Math.max(0, Math.min(1, (dataValue - lowerVal) / segmentRange))

    const rgba: Rgba = [
      Math.round(lowerRgba[0] + t * (upperRgba[0] - lowerRgba[0])),
      Math.round(lowerRgba[1] + t * (upperRgba[1] - lowerRgba[1])),
      Math.round(lowerRgba[2] + t * (upperRgba[2] - lowerRgba[2])),
      255,
    ]

    return [[lower, upper], rgba] as IntervalEntry
  })
}
