import { describe, it, expect } from 'vitest'
import { parseBgColor, calculateParticleColor } from '#/lib/fluid-simulation'

describe('parseBgColor', () => {
  it('parses rgb() format', () => {
    expect(parseBgColor('rgb(255, 255, 255)')).toEqual({ r: 255, g: 255, b: 255 })
  })

  it('parses rgba() format', () => {
    expect(parseBgColor('rgba(10, 10, 10, 1)')).toEqual({ r: 10, g: 10, b: 10 })
  })

  it('returns black for unparseable input', () => {
    expect(parseBgColor('invalid')).toEqual({ r: 0, g: 0, b: 0 })
  })
})

describe('calculateParticleColor', () => {
  it('returns green hue at zero speed', () => {
    const color = calculateParticleColor(0, true)
    expect(color.hue).toBe(130)
    expect(color.alpha).toBe(0)
  })

  it('shifts toward purple at high speed', () => {
    const color = calculateParticleColor(10, true)
    expect(color.hue).toBeCloseTo(270, 0)
  })

  it('caps saturation at 85', () => {
    const color = calculateParticleColor(10, true)
    expect(color.saturation).toBeLessThanOrEqual(85)
  })

  it('halves alpha in light mode', () => {
    const dark = calculateParticleColor(4, true)
    const light = calculateParticleColor(4, false)
    expect(light.alpha).toBeCloseTo(dark.alpha * 0.5, 2)
  })

  it('clamps alpha to maxParticleAlpha', () => {
    const color = calculateParticleColor(100, true)
    expect(color.alpha).toBeLessThanOrEqual(0.7)
  })
})
