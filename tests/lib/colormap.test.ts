import { describe, it, expect } from 'vitest'
import type { ColormapStop } from '#/lib/colormap'
import { hexToRgba, interpolateColormap } from '#/lib/colormap'

describe('hexToRgba', () => {
  it('converts a hex color with hash to RGBA tuple', () => {
    expect(hexToRgba('#0E2780')).toEqual([14, 39, 128, 255])
  })

  it('handles hex without hash prefix', () => {
    expect(hexToRgba('ff0000')).toEqual([255, 0, 0, 255])
  })

  it('converts black', () => {
    expect(hexToRgba('#000000')).toEqual([0, 0, 0, 255])
  })

  it('converts white', () => {
    expect(hexToRgba('#ffffff')).toEqual([255, 255, 255, 255])
  })
})

describe('interpolateColormap', () => {
  it('interpolates two stops into 16 interval entries', () => {
    const stops: ColormapStop[] = [
      [0, '#000000'],
      [100, '#ffffff'],
    ]
    const result = interpolateColormap(stops)

    expect(result).toHaveLength(16)
    expect(result[0][0][0]).toBe(0)
    expect(result[15][0][1]).toBe(100)
    expect(result[0][1]).toEqual([0, 0, 0, 255])
    expect(result[15][1]).toEqual([255, 255, 255, 255])
    const midColor = result[8][1][0]
    expect(midColor).toBeGreaterThanOrEqual(126)
    expect(midColor).toBeLessThanOrEqual(130)
  })

  it('interpolates three stops correctly', () => {
    const stops: ColormapStop[] = [
      [0, '#ff0000'],
      [50, '#00ff00'],
      [100, '#0000ff'],
    ]
    const result = interpolateColormap(stops)

    expect(result).toHaveLength(16)
    expect(result[0][1]).toEqual([255, 0, 0, 255])
    expect(result[15][1]).toEqual([0, 0, 255, 255])
    expect(result[8][1][1]).toBeGreaterThanOrEqual(250)
  })

  it('handles single stop by returning one interval', () => {
    const stops: ColormapStop[] = [[50, '#ff0000']]
    const result = interpolateColormap(stops)

    expect(result).toHaveLength(1)
    expect(result[0][0]).toEqual([50, 50])
    expect(result[0][1]).toEqual([255, 0, 0, 255])
  })

  it('returns empty array for empty input', () => {
    expect(interpolateColormap([])).toEqual([])
  })

  it('sorts stops by data value before interpolating', () => {
    const stops: ColormapStop[] = [
      [100, '#ffffff'],
      [0, '#000000'],
    ]
    const result = interpolateColormap(stops)

    expect(result[0][1]).toEqual([0, 0, 0, 255])
    expect(result[15][1]).toEqual([255, 255, 255, 255])
  })

  it('returns single interval when all stops have the same value', () => {
    const stops: ColormapStop[] = [
      [500, '#ff0000'],
      [500, '#0000ff'],
    ]
    const result = interpolateColormap(stops)

    expect(result).toHaveLength(1)
    expect(result[0][0]).toEqual([500, 500])
  })
})
