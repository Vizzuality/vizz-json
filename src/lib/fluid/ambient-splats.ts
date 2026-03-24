import type { FluidConfig, SplatInput } from './types'
import { DEFAULT_FLUID_CONFIG } from './types'
import { hslToRgb } from './color'

export type AmbientSplatConfig = {
  /** Minimum seconds between ambient arcs */
  readonly intervalMin: number
  /** Maximum seconds between ambient arcs */
  readonly intervalMax: number
  /** Maximum velocity magnitude per splat along the arc */
  readonly maxVelocity: number
  /** Splat radius multiplier (relative to splatRadiusMin) */
  readonly radiusScale: number
  /** Color brightness multiplier (ambient splats are subtler) */
  readonly brightnessScale: number
  /** Number of splats along the arc path */
  readonly arcSteps: number
  /** Arc radius in normalized canvas coordinates (0-1) */
  readonly arcRadius: number
  /** Arc sweep angle in radians (max arc length) */
  readonly arcSweep: number
  /** Milliseconds between each splat in the arc sequence */
  readonly arcStepDelay: number
}

export const DEFAULT_AMBIENT_CONFIG: AmbientSplatConfig = {
  intervalMin: 0.5,
  intervalMax: 1.5,
  maxVelocity: 0.04,
  radiusScale: 3.0,
  brightnessScale: 15.0,
  arcSteps: 20,
  arcRadius: 0.15,
  arcSweep: Math.PI * 0.8,
  arcStepDelay: 120,
}

/**
 * Pick a random color from the fluid palette for ambient splats.
 * Returns normalized RGB (values can exceed 1.0 for bright splats).
 */
function pickAmbientColor(
  isDark: boolean,
  random: () => number,
  fluidConfig: FluidConfig,
  ambientConfig: AmbientSplatConfig,
): readonly [number, number, number] {
  const { hueMin, hueMax, saturationMin, saturationMax, lightness } =
    fluidConfig.colorConfig

  const effectiveHueMin = isDark ? hueMin : 125
  const effectiveHueMax = isDark ? hueMax : 150
  const hue = effectiveHueMin + random() * (effectiveHueMax - effectiveHueMin)
  const saturation =
    saturationMin + random() * (saturationMax - saturationMin)

  const [r, g, b] = hslToRgb(hue, saturation, lightness)

  const baseBrightness = isDark ? 0.35 : 0.25
  const brightness = baseBrightness * ambientConfig.brightnessScale

  return [r * brightness, g * brightness, b * brightness] as const
}

/**
 * Generate a sequence of splats along a curved arc path.
 * Each splat's velocity is tangent to the arc, creating fluid motion
 * that follows a natural curve rather than a straight line.
 */
export function generateAmbientArc(
  isDark: boolean,
  random: () => number,
  fluidConfig: FluidConfig = DEFAULT_FLUID_CONFIG,
  ambientConfig: AmbientSplatConfig = DEFAULT_AMBIENT_CONFIG,
): readonly SplatInput[] {
  // Arc center — keep away from edges so the arc doesn't go off-canvas
  const margin = ambientConfig.arcRadius + 0.1
  const cx = margin + random() * (1 - 2 * margin)
  const cy = margin + random() * (1 - 2 * margin)

  // Random start angle and sweep direction
  const startAngle = random() * Math.PI * 2
  const sweep =
    (0.5 + random() * 0.5) *
    ambientConfig.arcSweep *
    (random() > 0.5 ? 1 : -1)

  // Vary the arc radius slightly
  const arcR = ambientConfig.arcRadius * (0.7 + random() * 0.6)

  // Pick one color for the whole arc
  const color = pickAmbientColor(isDark, random, fluidConfig, ambientConfig)
  const radius = fluidConfig.splatRadiusMin * ambientConfig.radiusScale

  const steps = ambientConfig.arcSteps
  const splats: SplatInput[] = []

  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1)
    const angle = startAngle + sweep * t

    // Position on the arc
    const x = cx + Math.cos(angle) * arcR
    const y = cy + Math.sin(angle) * arcR

    // Velocity is tangent to the arc (perpendicular to radius)
    const tangentAngle = angle + (sweep > 0 ? Math.PI / 2 : -Math.PI / 2)
    const speed =
      (0.5 + 0.5 * Math.sin(t * Math.PI)) * ambientConfig.maxVelocity
    const dx = Math.cos(tangentAngle) * speed
    const dy = Math.sin(tangentAngle) * speed

    splats.push({ x, y, dx, dy, color, radius })
  }

  return splats
}

/**
 * Generate a single random ambient splat (kept for simple use cases).
 */
export function generateAmbientSplat(
  isDark: boolean,
  random: () => number,
  fluidConfig: FluidConfig = DEFAULT_FLUID_CONFIG,
  ambientConfig: AmbientSplatConfig = DEFAULT_AMBIENT_CONFIG,
): SplatInput {
  const x = 0.1 + random() * 0.8
  const y = 0.1 + random() * 0.8

  const angle = random() * Math.PI * 2
  const magnitude = (0.3 + random() * 0.7) * ambientConfig.maxVelocity
  const dx = Math.cos(angle) * magnitude
  const dy = Math.sin(angle) * magnitude

  const color = pickAmbientColor(isDark, random, fluidConfig, ambientConfig)
  const radius = fluidConfig.splatRadiusMin * ambientConfig.radiusScale

  return { x, y, dx, dy, color, radius }
}

/**
 * Compute the next ambient arc delay in milliseconds.
 */
export function nextAmbientDelay(
  random: () => number,
  config: AmbientSplatConfig = DEFAULT_AMBIENT_CONFIG,
): number {
  const seconds =
    config.intervalMin + random() * (config.intervalMax - config.intervalMin)
  return seconds * 1000
}
