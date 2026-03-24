import type { FluidConfig } from './types'
import { DEFAULT_FLUID_CONFIG } from './types'

/**
 * Convert HSL to RGB (all values normalized 0-1).
 * h is in degrees (0-360), s and l are percentages (0-100).
 */
export function hslToRgb(
  h: number,
  s: number,
  l: number,
): readonly [number, number, number] {
  const sNorm = s / 100
  const lNorm = l / 100

  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm
  const hPrime = (((h % 360) + 360) % 360) / 60
  const x = c * (1 - Math.abs((hPrime % 2) - 1))
  const m = lNorm - c / 2

  let r1 = 0
  let g1 = 0
  let b1 = 0

  if (hPrime < 1) {
    r1 = c
    g1 = x
  } else if (hPrime < 2) {
    r1 = x
    g1 = c
  } else if (hPrime < 3) {
    g1 = c
    b1 = x
  } else if (hPrime < 4) {
    g1 = x
    b1 = c
  } else if (hPrime < 5) {
    r1 = x
    b1 = c
  } else {
    r1 = c
    b1 = x
  }

  return [r1 + m, g1 + m, b1 + m] as const
}

/**
 * Map mouse speed to an ink splat color (normalized RGB 0-1).
 * Uses green→purple hue shift based on speed.
 * Light mode halves brightness.
 */
export function speedToSplatColor(
  speed: number,
  isDark: boolean,
  config: FluidConfig = DEFAULT_FLUID_CONFIG,
): readonly [number, number, number] {
  const { hueMin, hueMax, saturationMin, saturationMax, lightness } =
    config.colorConfig

  const t = Math.min(speed / 50, 1)
  // Light mode stays close to the site's primary green (~140°);
  // dark mode uses full green→purple range
  const effectiveHueMax = isDark ? hueMax : 168
  const effectiveHueMin = isDark ? hueMin : 148
  const hue = effectiveHueMin + t * (effectiveHueMax - effectiveHueMin)
  const saturation = saturationMin + t * (saturationMax - saturationMin)

  const [r, g, b] = hslToRgb(hue, saturation, lightness)

  const brightness = isDark ? 0.35 : 0.25
  return [r * brightness, g * brightness, b * brightness] as const
}
