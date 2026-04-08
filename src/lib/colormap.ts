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

function lerpRgba(a: Rgba, b: Rgba, t: number): Rgba {
  const c = Math.max(0, Math.min(1, t))
  return [
    Math.round(a[0] + (b[0] - a[0]) * c),
    Math.round(a[1] + (b[1] - a[1]) * c),
    Math.round(a[2] + (b[2] - a[2]) * c),
    255,
  ]
}

const STEPS_PER_SEGMENT = 4

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

  if (rgbaStops[0][0] === rgbaStops[rgbaStops.length - 1][0]) {
    const rgba = rgbaStops[rgbaStops.length - 1][1]
    return [[[rgbaStops[0][0], rgbaStops[0][0]], rgba]]
  }

  const intervals: IntervalEntry[] = []

  for (let seg = 0; seg < rgbaStops.length - 1; seg++) {
    const [startVal, startRgba] = rgbaStops[seg]
    const [endVal, endRgba] = rgbaStops[seg + 1]
    const segRange = endVal - startVal

    if (segRange <= 0) continue

    for (let i = 0; i < STEPS_PER_SEGMENT; i++) {
      const t = i / STEPS_PER_SEGMENT
      const tNext = (i + 1) / STEPS_PER_SEGMENT
      const lower = startVal + segRange * t
      const upper =
        seg === rgbaStops.length - 2 && i === STEPS_PER_SEGMENT - 1
          ? endVal
          : startVal + segRange * tNext
      const rgba = lerpRgba(startRgba, endRgba, t)
      intervals.push([[lower, upper], rgba])
    }
  }

  return intervals
}
