import { describe, it, expect } from 'vitest'
import {
  parseBgColor,
  calculateParticleColor,
  updateParticle,
  DEFAULT_CONFIG,
} from '#/lib/fluid-simulation'
import type { Particle, MouseState } from '#/lib/fluid-simulation'

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

describe('updateParticle', () => {
  const inactiveMouse: MouseState = { x: 0, y: 0, prevX: 0, prevY: 0, active: false }
  const bounds = { width: 400, height: 300 }

  it('applies friction to velocity', () => {
    const p: Particle = { x: 100, y: 100, vx: 10, vy: 5 }
    const result = updateParticle(p, inactiveMouse, bounds, DEFAULT_CONFIG)
    expect(result.vx).toBeCloseTo(10 * 0.96, 5)
    expect(result.vy).toBeCloseTo(5 * 0.96, 5)
  })

  it('moves particle by velocity after friction', () => {
    const p: Particle = { x: 100, y: 100, vx: 10, vy: 5 }
    const result = updateParticle(p, inactiveMouse, bounds, DEFAULT_CONFIG)
    expect(result.x).toBeCloseTo(100 + 10 * 0.96, 5)
    expect(result.y).toBeCloseTo(100 + 5 * 0.96, 5)
  })

  it('applies mouse influence when within radius', () => {
    const p: Particle = { x: 100, y: 100, vx: 0, vy: 0 }
    const mouse: MouseState = { x: 100, y: 100, prevX: 90, prevY: 100, active: true }
    const result = updateParticle(p, mouse, bounds, DEFAULT_CONFIG)
    expect(result.vx).toBeGreaterThan(0)
  })

  it('does not apply mouse influence when outside radius', () => {
    const p: Particle = { x: 0, y: 0, vx: 0, vy: 0 }
    const mouse: MouseState = { x: 200, y: 200, prevX: 190, prevY: 200, active: true }
    const result = updateParticle(p, mouse, bounds, DEFAULT_CONFIG)
    expect(result.vx).toBe(0)
    expect(result.vy).toBe(0)
  })

  it('wraps particle at right edge', () => {
    const p: Particle = { x: 399, y: 100, vx: 10, vy: 0 }
    const result = updateParticle(p, inactiveMouse, bounds, DEFAULT_CONFIG)
    expect(result.x).toBeLessThan(bounds.width)
  })

  it('wraps particle at bottom edge', () => {
    const p: Particle = { x: 100, y: 299, vx: 0, vy: 10 }
    const result = updateParticle(p, inactiveMouse, bounds, DEFAULT_CONFIG)
    expect(result.y).toBeLessThan(bounds.height)
  })

  it('returns a new object (immutability)', () => {
    const p: Particle = { x: 100, y: 100, vx: 10, vy: 5 }
    const result = updateParticle(p, inactiveMouse, bounds, DEFAULT_CONFIG)
    expect(result).not.toBe(p)
  })
})
