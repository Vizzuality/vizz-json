import { describe, it, expect } from 'vitest'
import { DEFAULT_FLUID_CONFIG } from '#/lib/fluid/types'

describe('DEFAULT_FLUID_CONFIG', () => {
  it('has sensible simulation resolution', () => {
    expect(DEFAULT_FLUID_CONFIG.simResolution).toBeGreaterThanOrEqual(64)
    expect(DEFAULT_FLUID_CONFIG.simResolution).toBeLessThanOrEqual(512)
  })

  it('has dye dissipation below 1 (ink fades)', () => {
    expect(DEFAULT_FLUID_CONFIG.dyeDissipation).toBeLessThan(1)
    expect(DEFAULT_FLUID_CONFIG.dyeDissipation).toBeGreaterThan(0.9)
  })

  it('has velocity dissipation below 1', () => {
    expect(DEFAULT_FLUID_CONFIG.velocityDissipation).toBeLessThan(1)
    expect(DEFAULT_FLUID_CONFIG.velocityDissipation).toBeGreaterThan(0.9)
  })

  it('has positive pressure iterations', () => {
    expect(DEFAULT_FLUID_CONFIG.pressureIterations).toBeGreaterThan(0)
    expect(DEFAULT_FLUID_CONFIG.pressureIterations).toBeLessThanOrEqual(50)
  })

  it('has positive curl strength', () => {
    expect(DEFAULT_FLUID_CONFIG.curl).toBeGreaterThan(0)
  })

  it('has valid splat radius range', () => {
    expect(DEFAULT_FLUID_CONFIG.splatRadiusMin).toBeGreaterThan(0)
    expect(DEFAULT_FLUID_CONFIG.splatRadiusMax).toBeGreaterThan(
      DEFAULT_FLUID_CONFIG.splatRadiusMin,
    )
  })

  it('has positive splat force', () => {
    expect(DEFAULT_FLUID_CONFIG.splatForce).toBeGreaterThan(0)
  })

  it('has valid color config ranges', () => {
    const { colorConfig } = DEFAULT_FLUID_CONFIG
    expect(colorConfig.hueMin).toBeGreaterThanOrEqual(0)
    expect(colorConfig.hueMax).toBeLessThanOrEqual(360)
    expect(colorConfig.hueMax).toBeGreaterThan(colorConfig.hueMin)
    expect(colorConfig.saturationMin).toBeGreaterThanOrEqual(0)
    expect(colorConfig.saturationMax).toBeLessThanOrEqual(100)
    expect(colorConfig.lightness).toBeGreaterThan(0)
    expect(colorConfig.lightness).toBeLessThanOrEqual(100)
  })

  it('dye fades to ~40% after 1 second at 60fps', () => {
    // 0.985^60 ≈ 0.404
    const afterOneSecond = Math.pow(DEFAULT_FLUID_CONFIG.dyeDissipation, 60)
    expect(afterOneSecond).toBeGreaterThan(0.3)
    expect(afterOneSecond).toBeLessThan(0.5)
  })

  it('dye fades to ~16% after 2 seconds at 60fps', () => {
    // 0.985^120 ≈ 0.163
    const afterTwoSeconds = Math.pow(DEFAULT_FLUID_CONFIG.dyeDissipation, 120)
    expect(afterTwoSeconds).toBeGreaterThan(0.1)
    expect(afterTwoSeconds).toBeLessThan(0.25)
  })
})
