import { describe, it, expect } from 'vitest'
import { validateLegendColors, validateStyle } from '#/lib/ai/style-validator'

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

describe('validateLegendColors', () => {
  it('rejects legend items whose value is a literal CSS colour', () => {
    const errors = validateLegendColors({
      type: 'basic',
      items: [{ label: 'A', value: '#ff0000' }],
    })
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].message).toMatch(/literal/i)
  })

  it('accepts legend items whose value is a @@#params reference', () => {
    const errors = validateLegendColors({
      type: 'basic',
      items: [{ label: 'A', value: '@@#params.color_a' }],
    })
    expect(errors).toEqual([])
  })

  it('returns no errors when legend_config is undefined', () => {
    expect(validateLegendColors(undefined)).toEqual([])
  })

  it('reports the offending item index in the message', () => {
    const errors = validateLegendColors({
      type: 'choropleth',
      items: [
        { label: 'A', value: '@@#params.color_a' },
        { label: 'B', value: 'rgb(0,0,0)' },
      ],
    })
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toMatch(/items\[1\]/)
  })

  it('ignores numeric values (gradient thresholds)', () => {
    const errors = validateLegendColors({
      type: 'gradient',
      items: [
        { label: '0', value: 0 },
        { label: '1', value: 1 },
      ],
    })
    expect(errors).toEqual([])
  })
})
