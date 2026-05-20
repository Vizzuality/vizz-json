import { describe, it, expect } from 'vitest'
import {
  validateLegendColors,
  validateParameterizeTargets,
  validateStyle,
} from '#/lib/ai/style-validator'

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

// validateLegendColors now receives { style } — walks per-source legend_config

describe('validateLegendColors', () => {
  it('returns no errors when no sources are present', () => {
    const errors = validateLegendColors({ style: {} })
    expect(errors).toEqual([])
  })

  it('returns no errors when sources have no legend_config', () => {
    const errors = validateLegendColors({
      style: {
        sources: [
          { id: 'a', type: 'geojson' },
          { id: 'b', type: 'geojson' },
        ],
        styles: [{ source: 'a', type: 'fill' }],
      },
    })
    expect(errors).toEqual([])
  })

  it('accepts legend items whose value is a @@#params reference', () => {
    const errors = validateLegendColors({
      style: {
        sources: [
          {
            id: 'main',
            type: 'geojson',
            legend_config: {
              type: 'basic',
              items: [{ label: 'A', value: '@@#params.color_a' }],
            },
          },
        ],
      },
    })
    expect(errors).toEqual([])
  })

  it('rejects legend items whose value is a literal CSS colour', () => {
    const errors = validateLegendColors({
      style: {
        sources: [
          {
            id: 'src',
            legend_config: {
              type: 'basic',
              items: [{ label: 'A', value: '#ff0000' }],
            },
          },
        ],
      },
    })
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].message).toMatch(/literal/i)
  })

  it('error message includes source id hint', () => {
    const errors = validateLegendColors({
      style: {
        sources: [
          {
            id: 'countries',
            legend_config: {
              type: 'choropleth',
              items: [{ label: 'High', value: '#ff0000' }],
            },
          },
        ],
      },
    })
    expect(errors[0].message).toContain('"countries"')
  })

  it('two sources with literal hex produce 2 errors, each scoped to their source', () => {
    const errors = validateLegendColors({
      style: {
        sources: [
          {
            id: 'src_a',
            legend_config: {
              type: 'basic',
              items: [{ label: 'A', value: '#ff0000' }],
            },
          },
          {
            id: 'src_b',
            legend_config: {
              type: 'choropleth',
              items: [{ label: 'B', value: 'rgb(0,0,255)' }],
            },
          },
        ],
      },
    })
    expect(errors).toHaveLength(2)
    expect(errors[0].message).toContain('"src_a"')
    expect(errors[1].message).toContain('"src_b"')
  })

  it('reports offending item index in the message', () => {
    const errors = validateLegendColors({
      style: {
        sources: [
          {
            id: 'main',
            legend_config: {
              type: 'choropleth',
              items: [
                { label: 'A', value: '@@#params.color_a' },
                { label: 'B', value: 'rgb(0,0,0)' },
              ],
            },
          },
        ],
      },
    })
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toMatch(/items\[1\]/)
  })

  it('ignores numeric values (gradient thresholds)', () => {
    const errors = validateLegendColors({
      style: {
        sources: [
          {
            id: 'g',
            legend_config: {
              type: 'gradient',
              items: [
                { label: '0', value: 0 },
                { label: '1', value: 1 },
              ],
            },
          },
        ],
      },
    })
    expect(errors).toEqual([])
  })

  it('handles sources array entry that is not an object gracefully', () => {
    // Defensive: malformed sources entry must not throw
    const errors = validateLegendColors({
      style: {
        sources: [
          null,
          {
            id: 'valid',
            legend_config: {
              type: 'basic',
              items: [{ label: 'A', value: '@@#params.c' }],
            },
          },
        ],
      },
    })
    expect(errors).toEqual([])
  })

  it('style with no sources array returns no errors', () => {
    const errors = validateLegendColors({ style: { styles: [] } })
    expect(errors).toEqual([])
  })
})

describe('validateParameterizeTargets', () => {
  const matchStyle = {
    sources: [{ id: 'wdpa', type: 'vector', url: 'mapbox://x' }],
    styles: [
      {
        source: 'wdpa',
        type: 'fill',
        paint: {
          'fill-color': [
            'match',
            ['get', 'IUCN_CAT'],
            'Ia',
            '#0b3c5d',
            'Ib',
            '#1f78b4',
            '#9ca3af',
          ],
        },
      },
    ],
  }

  it('accepts parameterize entries that target output colour slots', () => {
    const errors = validateParameterizeTargets({
      style: matchStyle,
      parameterize: [
        { path: 'styles[0].paint.fill-color[3]' },
        { path: 'styles[0].paint.fill-color[5]' },
        { path: 'styles[0].paint.fill-color[6]' },
      ],
    })
    expect(errors).toEqual([])
  })

  it('rejects parameterize entries that target match label slots', () => {
    const errors = validateParameterizeTargets({
      style: matchStyle,
      parameterize: [{ path: 'styles[0].paint.fill-color[4]' }],
    })
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toMatch(/match.+label/i)
    expect(errors[0].message).toContain('"Ib"')
  })

  it('rejects parameterize entries targeting the input expression slot', () => {
    const errors = validateParameterizeTargets({
      style: matchStyle,
      parameterize: [{ path: 'styles[0].paint.fill-color[1]' }],
    })
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toMatch(/match.+input/i)
  })

  it('ignores parameterize entries pointing outside any match expression', () => {
    const errors = validateParameterizeTargets({
      style: {
        sources: [{ id: 'a', type: 'geojson', data: 'https://a' }],
        styles: [{ source: 'a', type: 'fill', paint: { 'fill-opacity': 0.5 } }],
      },
      parameterize: [{ path: 'styles[0].paint.fill-opacity' }],
    })
    expect(errors).toEqual([])
  })
})
