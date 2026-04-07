import { describe, it, expect } from 'vitest'
import { interpolateHexColor, positionToDataValue } from '#/lib/gradient-types'

describe('interpolateHexColor', () => {
  it('returns first color at t=0', () => {
    expect(interpolateHexColor('#000000', '#ffffff', 0)).toBe('#000000')
  })

  it('returns second color at t=1', () => {
    expect(interpolateHexColor('#000000', '#ffffff', 1)).toBe('#ffffff')
  })

  it('returns midpoint color at t=0.5', () => {
    expect(interpolateHexColor('#000000', '#ffffff', 0.5)).toBe('#808080')
  })

  it('interpolates non-trivial colors', () => {
    expect(interpolateHexColor('#ff0000', '#0000ff', 0.5)).toBe('#800080')
  })

  it('clamps t below 0', () => {
    expect(interpolateHexColor('#000000', '#ffffff', -0.5)).toBe('#000000')
  })

  it('clamps t above 1', () => {
    expect(interpolateHexColor('#000000', '#ffffff', 1.5)).toBe('#ffffff')
  })
})

describe('positionToDataValue', () => {
  it('returns min at position 0', () => {
    expect(positionToDataValue(0, 0, 1000)).toBe(0)
  })

  it('returns max at position 1', () => {
    expect(positionToDataValue(1, 0, 1000)).toBe(1000)
  })

  it('interpolates linearly at 0.5', () => {
    expect(positionToDataValue(0.5, 0, 1000000)).toBe(500000)
  })

  it('handles equal min and max', () => {
    expect(positionToDataValue(0.5, 100, 100)).toBe(100)
  })
})
