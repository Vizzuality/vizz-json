import { describe, it, expect } from 'vitest'
import { hslToRgb, speedToSplatColor } from '#/lib/fluid/color'

describe('hslToRgb', () => {
  it('converts red (0°, 100%, 50%)', () => {
    const [r, g, b] = hslToRgb(0, 100, 50)
    expect(r).toBeCloseTo(1, 2)
    expect(g).toBeCloseTo(0, 2)
    expect(b).toBeCloseTo(0, 2)
  })

  it('converts green (120°, 100%, 50%)', () => {
    const [r, g, b] = hslToRgb(120, 100, 50)
    expect(r).toBeCloseTo(0, 2)
    expect(g).toBeCloseTo(1, 2)
    expect(b).toBeCloseTo(0, 2)
  })

  it('converts blue (240°, 100%, 50%)', () => {
    const [r, g, b] = hslToRgb(240, 100, 50)
    expect(r).toBeCloseTo(0, 2)
    expect(g).toBeCloseTo(0, 2)
    expect(b).toBeCloseTo(1, 2)
  })

  it('converts white (0°, 0%, 100%)', () => {
    const [r, g, b] = hslToRgb(0, 0, 100)
    expect(r).toBeCloseTo(1, 2)
    expect(g).toBeCloseTo(1, 2)
    expect(b).toBeCloseTo(1, 2)
  })

  it('converts black (0°, 0%, 0%)', () => {
    const [r, g, b] = hslToRgb(0, 0, 0)
    expect(r).toBeCloseTo(0, 2)
    expect(g).toBeCloseTo(0, 2)
    expect(b).toBeCloseTo(0, 2)
  })

  it('handles negative hue by wrapping', () => {
    const [r1, g1, b1] = hslToRgb(-60, 100, 50)
    const [r2, g2, b2] = hslToRgb(300, 100, 50)
    expect(r1).toBeCloseTo(r2, 2)
    expect(g1).toBeCloseTo(g2, 2)
    expect(b1).toBeCloseTo(b2, 2)
  })

  it('returns values in [0, 1] range', () => {
    const [r, g, b] = hslToRgb(200, 75, 60)
    expect(r).toBeGreaterThanOrEqual(0)
    expect(r).toBeLessThanOrEqual(1)
    expect(g).toBeGreaterThanOrEqual(0)
    expect(g).toBeLessThanOrEqual(1)
    expect(b).toBeGreaterThanOrEqual(0)
    expect(b).toBeLessThanOrEqual(1)
  })
})

describe('speedToSplatColor', () => {
  it('returns green-ish hue at zero speed', () => {
    const [r, g, b] = speedToSplatColor(0, true)
    // At speed 0, hue = 130° (green-cyan), so green channel should dominate
    expect(g).toBeGreaterThan(r)
    expect(g).toBeGreaterThan(b)
  })

  it('shifts toward purple at high speed', () => {
    const [_r, g, b] = speedToSplatColor(100, true)
    // At max speed, hue = 270° (purple), so blue should be significant
    expect(b).toBeGreaterThan(g)
  })

  it('halves brightness in light mode', () => {
    const dark = speedToSplatColor(25, true)
    const light = speedToSplatColor(25, false)
    expect(light[0]).toBeCloseTo(dark[0] * 0.5, 2)
    expect(light[1]).toBeCloseTo(dark[1] * 0.5, 2)
    expect(light[2]).toBeCloseTo(dark[2] * 0.5, 2)
  })

  it('returns values in [0, 1] range', () => {
    const [r, g, b] = speedToSplatColor(30, true)
    expect(r).toBeGreaterThanOrEqual(0)
    expect(r).toBeLessThanOrEqual(1)
    expect(g).toBeGreaterThanOrEqual(0)
    expect(g).toBeLessThanOrEqual(1)
    expect(b).toBeGreaterThanOrEqual(0)
    expect(b).toBeLessThanOrEqual(1)
  })

  it('clamps speed interpolation at 1', () => {
    const a = speedToSplatColor(50, true)
    const b = speedToSplatColor(200, true)
    // Both should produce the same color since speed >= 50 maxes out t
    expect(a[0]).toBeCloseTo(b[0], 2)
    expect(a[1]).toBeCloseTo(b[1], 2)
    expect(a[2]).toBeCloseTo(b[2], 2)
  })
})
