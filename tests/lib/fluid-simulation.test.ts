import { describe, it, expect } from 'vitest'
import { parseBgColor } from '#/lib/fluid-simulation'

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
