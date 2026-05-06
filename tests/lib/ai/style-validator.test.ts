import { describe, it, expect } from 'vitest'
import { validateStyle } from '#/lib/ai/style-validator'

describe('validateStyle', () => {
  it('accepts an empty fragment (treated as no-op)', () => {
    expect(validateStyle({}, 'maplibre')).toEqual([])
    expect(validateStyle({}, 'mapbox')).toEqual([])
  })

  it('rejects a fragment whose source has an unknown type', () => {
    const errors = validateStyle(
      {
        sources: [{ id: 'main', type: 'definitely-not-a-real-type' }],
        styles: [{ source: 'main', type: 'raster' }],
      },
      'maplibre',
    )
    expect(errors.length).toBeGreaterThan(0)
  })

  it('rejects a fragment whose layer has an unknown type', () => {
    const errors = validateStyle(
      {
        sources: [{ id: 'main', type: 'raster', tiles: ['x'], tileSize: 256 }],
        styles: [{ source: 'main', type: 'definitely-not-a-real-layer-type' }],
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

  it('rejects duplicate source ids', () => {
    const errors = validateStyle(
      {
        sources: [
          { id: 'dup', type: 'geojson', data: 'https://a' },
          { id: 'dup', type: 'geojson', data: 'https://b' },
        ],
        styles: [{ source: 'dup', type: 'fill' }],
      },
      'maplibre',
    )
    expect(errors.some((e) => /duplicate source id/i.test(e.message))).toBe(
      true,
    )
  })

  it('rejects styles whose source field references an unknown source id', () => {
    const errors = validateStyle(
      {
        sources: [{ id: 'a', type: 'geojson', data: 'https://a' }],
        styles: [{ source: 'b', type: 'fill' }],
      },
      'maplibre',
    )
    expect(
      errors.some(
        (e) => /unknown source/i.test(e.message) && /"b"/.test(e.message),
      ),
    ).toBe(true)
  })
})
