import type { GradientStop } from '#/lib/gradient-types'

/**
 * Build a CSS linear-gradient value with transparent bookends.
 * Positions are computed relative to a fixed reference range (typically
 * the default threshold values). At defaults the gradient spans 0-100%
 * (no transparency). When thresholds narrow, transparent areas appear.
 */
export function buildTransparencyGradient(
  stops: readonly GradientStop[],
  rangeMin: number,
  rangeMax: number,
): string | undefined {
  if (stops.length < 2) return undefined
  const fullRange = rangeMax - rangeMin
  if (fullRange === 0) return undefined

  const sorted = [...stops].sort((a, b) => a.dataValue - b.dataValue)

  const toPct = (val: number) =>
    (
      ((Math.max(rangeMin, Math.min(rangeMax, val)) - rangeMin) / fullRange) *
      100
    ).toFixed(1)

  const firstPct = toPct(sorted[0].dataValue)
  const lastPct = toPct(sorted[sorted.length - 1].dataValue)

  const colorStops = sorted.map((s) => `${s.color} ${toPct(s.dataValue)}%`)

  return [
    'transparent 0%',
    `transparent ${firstPct}%`,
    ...colorStops,
    `transparent ${lastPct}%`,
    'transparent 100%',
  ].join(', ')
}
