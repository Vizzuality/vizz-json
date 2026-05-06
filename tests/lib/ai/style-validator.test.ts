import { describe, it, expect } from 'vitest'
import { validateStyle } from '#/lib/ai/style-validator'

describe('validateStyle', () => {
  it('accepts an empty fragment (treated as no-op)', () => {
    expect(validateStyle({}, 'maplibre')).toEqual([])
    expect(validateStyle({}, 'mapbox')).toEqual([])
  })

  it('accepts a VizzJson-style fragment ({source, styles[]})', () => {
    const errors = validateStyle(
      {
        source: { type: 'raster', tiles: ['x'], tileSize: 256 },
        styles: [{ type: 'raster' }],
      },
      'maplibre',
    )
    expect(errors).toEqual([])
  })

  it('rejects a fragment whose source has an unknown type', () => {
    const errors = validateStyle(
      {
        source: { type: 'definitely-not-a-real-type' },
        styles: [{ type: 'raster' }],
      },
      'maplibre',
    )
    expect(errors.length).toBeGreaterThan(0)
  })

  it('rejects a fragment whose layer has an unknown type', () => {
    const errors = validateStyle(
      {
        source: { type: 'raster', tiles: ['x'], tileSize: 256 },
        styles: [{ type: 'definitely-not-a-real-layer-type' }],
      },
      'maplibre',
    )
    expect(errors.length).toBeGreaterThan(0)
  })

  it('accepts a minimal valid full style for maplibre', () => {
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

  it('accepts a minimal valid full style for mapbox', () => {
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

  it('accepts the new array sources + style.source shape', () => {
    const errors = validateStyle(
      {
        sources: [
          {
            id: 'osm',
            type: 'raster',
            tiles: ['https://a/{z}/{x}/{y}'],
            tileSize: 256,
          },
        ],
        styles: [{ source: 'osm', type: 'raster' }],
      },
      'maplibre',
    )
    expect(errors).toEqual([])
  })

  it('binds layers to their declared source.id (not the first source)', () => {
    const errors = validateStyle(
      {
        sources: [
          { id: 'a', type: 'geojson', data: 'https://a' },
          { id: 'b', type: 'geojson', data: 'https://b' },
        ],
        styles: [
          { source: 'a', type: 'fill' },
          { source: 'b', type: 'heatmap' },
        ],
      },
      'maplibre',
    )
    expect(errors).toEqual([])
  })
})
