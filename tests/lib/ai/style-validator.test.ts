import { describe, it, expect } from 'vitest'
import { validateStyle } from '#/lib/ai/style-validator'

describe('validateStyle', () => {
  it('rejects a totally empty object for maplibre', () => {
    const errors = validateStyle({}, 'maplibre')
    expect(errors.length).toBeGreaterThan(0)
  })

  it('rejects a totally empty object for mapbox', () => {
    const errors = validateStyle({}, 'mapbox')
    expect(errors.length).toBeGreaterThan(0)
  })

  it('accepts a minimal valid style for maplibre', () => {
    const errors = validateStyle(
      {
        version: 8,
        sources: { osm: { type: 'raster', tiles: ['x'], tileSize: 256 } },
        layers: [{ id: 'l', type: 'raster', source: 'osm' }],
      },
      'maplibre',
    )
    expect(errors).toEqual([])
  })

  it('accepts a minimal valid style for mapbox', () => {
    const errors = validateStyle(
      {
        version: 8,
        sources: { osm: { type: 'raster', tiles: ['x'], tileSize: 256 } },
        layers: [{ id: 'l', type: 'raster', source: 'osm' }],
      },
      'mapbox',
    )
    expect(errors).toEqual([])
  })
})
