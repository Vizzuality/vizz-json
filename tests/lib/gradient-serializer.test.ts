import { describe, it, expect } from 'vitest'
import { serializeGradientToJson } from '#/lib/gradient-serializer'
import type { GradientStop } from '#/lib/gradient-types'

// All test JSON fixtures use per-source legend_config (on sources[*].legend_config).
// The legacy top-level legend_config is no longer supported by serializeGradientToJson.

const RASTER_JSON = JSON.stringify(
  {
    config: {
      sources: [
        {
          id: 'imagery',
          type: 'raster',
          tiles: [
            {
              '@@function': 'setQueryParams',
              url: 'https://titiler.xyz/cog/tiles/WebMercatorQuad/{z}/{x}/{y}.png',
              query: {
                url: 'https://example.com/data.tif',
                colormap: {
                  '@@function': 'buildColormap',
                  stops: [
                    ['@@#params.threshold_1', '@@#params.color_1'],
                    ['@@#params.threshold_2', '@@#params.color_2'],
                  ],
                },
              },
            },
          ],
          legend_config: {
            type: 'gradient',
            items: [
              { label: 'Deep ocean', value: '@@#params.color_1' },
              { label: 'Peak', value: '@@#params.color_2' },
            ],
          },
        },
      ],
      styles: [
        { source: 'imagery', type: 'raster', paint: { 'raster-opacity': 0.8 } },
      ],
    },
    params_config: [
      { key: 'threshold_1', default: -10000, group: 'legend' },
      { key: 'color_1', default: '#440154', group: 'legend' },
      { key: 'threshold_2', default: 6000, group: 'legend' },
      { key: 'color_2', default: '#fde725', group: 'legend' },
    ],
  },
  null,
  2,
)

const EXAMPLE_JSON = JSON.stringify(
  {
    config: {
      sources: [
        {
          id: 'countries',
          type: 'geojson',
          data: 'https://example.com/data.geojson',
          legend_config: {
            type: 'gradient',
            items: [
              { label: 'Low', value: '@@#params.color_1' },
              { label: 'Mid', value: '@@#params.color_2' },
              { label: 'High', value: '@@#params.color_3' },
            ],
          },
        },
      ],
      styles: [
        {
          source: 'countries',
          type: 'fill',
          paint: {
            'fill-color': [
              'interpolate',
              ['linear'],
              ['get', 'pop_est'],
              '@@#params.threshold_1',
              '@@#params.color_1',
              '@@#params.threshold_2',
              '@@#params.color_2',
              '@@#params.threshold_3',
              '@@#params.color_3',
            ],
            'fill-opacity': '@@#params.opacity',
          },
        },
      ],
    },
    params_config: [
      {
        key: 'threshold_1',
        default: 0,
        min: 0,
        max: 500000000,
        step: 1000000,
        group: 'legend',
      },
      {
        key: 'threshold_2',
        default: 50000000,
        min: 0,
        max: 1000000000,
        step: 1000000,
        group: 'legend',
      },
      {
        key: 'threshold_3',
        default: 500000000,
        min: 0,
        max: 2000000000,
        step: 10000000,
        group: 'legend',
      },
      { key: 'color_1', default: '#eff6ff', group: 'legend' },
      { key: 'color_2', default: '#3b82f6', group: 'legend' },
      { key: 'color_3', default: '#1e3a8a', group: 'legend' },
      { key: 'opacity', default: 0.8, min: 0, max: 1, step: 0.05 },
    ],
  },
  null,
  2,
)

describe('serializeGradientToJson', () => {
  it('preserves existing stops with their original keys', () => {
    const stops: GradientStop[] = [
      {
        id: '1',
        color: '#ff0000',
        position: 0,
        dataValue: 0,
        label: 'Low',
        colorParamKey: 'color_1',
        thresholdParamKey: 'threshold_1',
      },
      {
        id: '2',
        color: '#00ff00',
        position: 0.5,
        dataValue: 250000000,
        label: 'Mid',
        colorParamKey: 'color_2',
        thresholdParamKey: 'threshold_2',
      },
      {
        id: '3',
        color: '#0000ff',
        position: 1,
        dataValue: 500000000,
        label: 'High',
        colorParamKey: 'color_3',
        thresholdParamKey: 'threshold_3',
      },
    ]

    const result = JSON.parse(
      serializeGradientToJson(EXAMPLE_JSON, stops, 'countries'),
    )

    // legend_config must be on the matching source, not top-level
    const source = result.config.sources[0]
    expect(source.id).toBe('countries')
    const legendItems = source.legend_config.items
    expect(legendItems).toHaveLength(3)
    expect(legendItems[0].value).toBe('@@#params.color_1')
    expect(legendItems[2].value).toBe('@@#params.color_3')

    // Top-level legend_config must NOT exist
    expect(result).not.toHaveProperty('legend_config')

    const interpolate = result.config.styles[0].paint['fill-color']
    expect(interpolate[0]).toBe('interpolate')
    expect(interpolate[3]).toBe('@@#params.threshold_1')
    expect(interpolate[4]).toBe('@@#params.color_1')
  })

  it('generates new keys for added stops', () => {
    const stops: GradientStop[] = [
      {
        id: '1',
        color: '#ff0000',
        position: 0,
        dataValue: 0,
        label: 'Low',
        colorParamKey: 'color_1',
        thresholdParamKey: 'threshold_1',
      },
      {
        id: 'new',
        color: '#ffff00',
        position: 0.25,
        dataValue: 125000000,
        label: '',
      },
      {
        id: '3',
        color: '#0000ff',
        position: 1,
        dataValue: 500000000,
        label: 'High',
        colorParamKey: 'color_3',
        thresholdParamKey: 'threshold_3',
      },
    ]

    const result = JSON.parse(
      serializeGradientToJson(EXAMPLE_JSON, stops, 'countries'),
    )

    const legendItems = result.config.sources[0].legend_config.items
    expect(legendItems).toHaveLength(3)
    expect(legendItems[1].value).toMatch(/^@@#params\.color_\d+$/)
    expect(legendItems[1].label).toBe('')

    const paramsKeys = result.params_config.map((p: { key: string }) => p.key)
    expect(paramsKeys).toContain('color_1')
    expect(paramsKeys).toContain('threshold_1')
    expect(paramsKeys).toContain('color_3')
    expect(paramsKeys).toContain('threshold_3')
    expect(paramsKeys).toContain('opacity')
  })

  it('preserves non-legend params', () => {
    const stops: GradientStop[] = [
      {
        id: '1',
        color: '#ff0000',
        position: 0,
        dataValue: 0,
        label: 'Low',
        colorParamKey: 'color_1',
        thresholdParamKey: 'threshold_1',
      },
      {
        id: '2',
        color: '#0000ff',
        position: 1,
        dataValue: 500000000,
        label: 'High',
        colorParamKey: 'color_3',
        thresholdParamKey: 'threshold_3',
      },
    ]

    const result = JSON.parse(
      serializeGradientToJson(EXAMPLE_JSON, stops, 'countries'),
    )

    const opacityParam = result.params_config.find(
      (p: { key: string }) => p.key === 'opacity',
    )
    expect(opacityParam).toBeDefined()
    expect(opacityParam.default).toBe(0.8)
  })

  it('removes params for deleted stops', () => {
    const stops: GradientStop[] = [
      {
        id: '1',
        color: '#ff0000',
        position: 0,
        dataValue: 0,
        label: 'Low',
        colorParamKey: 'color_1',
        thresholdParamKey: 'threshold_1',
      },
      {
        id: '3',
        color: '#0000ff',
        position: 1,
        dataValue: 500000000,
        label: 'High',
        colorParamKey: 'color_3',
        thresholdParamKey: 'threshold_3',
      },
    ]

    const result = JSON.parse(
      serializeGradientToJson(EXAMPLE_JSON, stops, 'countries'),
    )

    const paramsKeys = result.params_config.map((p: { key: string }) => p.key)
    expect(paramsKeys).not.toContain('color_2')
    expect(paramsKeys).not.toContain('threshold_2')
  })

  it('rebuilds interpolate expression in correct position order', () => {
    const stops: GradientStop[] = [
      {
        id: '3',
        color: '#0000ff',
        position: 1,
        dataValue: 500000000,
        label: 'High',
        colorParamKey: 'color_3',
        thresholdParamKey: 'threshold_3',
      },
      {
        id: '1',
        color: '#ff0000',
        position: 0,
        dataValue: 0,
        label: 'Low',
        colorParamKey: 'color_1',
        thresholdParamKey: 'threshold_1',
      },
    ]

    const result = JSON.parse(
      serializeGradientToJson(EXAMPLE_JSON, stops, 'countries'),
    )

    const interpolate = result.config.styles[0].paint['fill-color']
    expect(interpolate[3]).toBe('@@#params.threshold_1')
    expect(interpolate[5]).toBe('@@#params.threshold_3')
  })

  it('handles JSON without interpolate expression', () => {
    const jsonWithoutInterpolate = JSON.stringify({
      config: {
        sources: [
          {
            id: 'layer',
            legend_config: {
              type: 'gradient',
              items: [{ label: 'A', value: '@@#params.color_a' }],
            },
          },
        ],
        styles: [{ source: 'layer', paint: { 'fill-color': '#ff0000' } }],
      },
      params_config: [{ key: 'color_a', default: '#ff0000', group: 'legend' }],
    })

    const stops: GradientStop[] = [
      {
        id: '1',
        color: '#ff0000',
        position: 0,
        dataValue: 0,
        label: 'A',
        colorParamKey: 'color_a',
      },
      { id: '2', color: '#0000ff', position: 1, dataValue: 100, label: 'B' },
    ]

    const result = JSON.parse(
      serializeGradientToJson(jsonWithoutInterpolate, stops, 'layer'),
    )

    expect(result.config.sources[0].legend_config.items).toHaveLength(2)
    expect(result.config.styles[0].paint['fill-color']).toBe('#ff0000')
  })

  it('writes legend_config into the matched source, not at top-level', () => {
    const stops: GradientStop[] = [
      {
        id: '1',
        color: '#ff0000',
        position: 0,
        dataValue: 0,
        label: 'Low',
        colorParamKey: 'color_1',
        thresholdParamKey: 'threshold_1',
      },
    ]
    const result = JSON.parse(
      serializeGradientToJson(EXAMPLE_JSON, stops, 'countries'),
    )
    // Source has the legend
    expect(result.config.sources[0]).toHaveProperty('legend_config')
    // Top level must not
    expect(result).not.toHaveProperty('legend_config')
  })

  it('other sources are untouched when only one source is updated', () => {
    const multiSourceJson = JSON.stringify({
      config: {
        sources: [
          {
            id: 'src_a',
            type: 'geojson',
            legend_config: {
              type: 'gradient',
              items: [{ label: 'A', value: '@@#params.color_a' }],
            },
          },
          {
            id: 'src_b',
            type: 'geojson',
            myProp: 'original-value',
          },
        ],
        styles: [
          {
            source: 'src_a',
            type: 'fill',
            paint: { 'fill-color': '@@#params.color_a' },
          },
          { source: 'src_b', type: 'fill' },
        ],
      },
      params_config: [{ key: 'color_a', default: '#ff0000', group: 'legend' }],
    })

    const stops: GradientStop[] = [
      {
        id: '1',
        color: '#00ff00',
        position: 0,
        dataValue: 0,
        label: 'A',
        colorParamKey: 'color_a',
      },
    ]

    const result = JSON.parse(
      serializeGradientToJson(multiSourceJson, stops, 'src_a'),
    )
    // src_b must remain unchanged
    expect(result.config.sources[1].myProp).toBe('original-value')
    expect(result.config.sources[1]).not.toHaveProperty('legend_config')
  })

  describe('guard throws', () => {
    it('throws when sourceId does not match any source', () => {
      const stops: GradientStop[] = [
        {
          id: '1',
          color: '#ff0000',
          position: 0,
          dataValue: 0,
          label: 'Low',
          colorParamKey: 'color_1',
          thresholdParamKey: 'threshold_1',
        },
      ]
      expect(() =>
        serializeGradientToJson(EXAMPLE_JSON, stops, 'nonexistent-source'),
      ).toThrow(
        'serializeGradientToJson: no source with id "nonexistent-source"',
      )
    })

    it('throws when config.sources is missing or not an array', () => {
      const noSourcesJson = JSON.stringify({
        config: {
          styles: [{ source: 'x', type: 'fill' }],
        },
        params_config: [],
      })
      const stops: GradientStop[] = [
        {
          id: '1',
          color: '#ff0000',
          position: 0,
          dataValue: 0,
          label: 'Low',
          colorParamKey: 'color_1',
          thresholdParamKey: 'threshold_1',
        },
      ]
      expect(() => serializeGradientToJson(noSourcesJson, stops, 'x')).toThrow(
        'serializeGradientToJson: config.sources is missing or not an array',
      )
    })
  })
})

describe('serializeGradientToJson with buildColormap', () => {
  it('syncs buildColormap.stops when stops are preserved', () => {
    const stops: GradientStop[] = [
      {
        id: '1',
        color: '#440154',
        position: 0,
        dataValue: -10000,
        label: 'Deep ocean',
        colorParamKey: 'color_1',
        thresholdParamKey: 'threshold_1',
      },
      {
        id: '2',
        color: '#fde725',
        position: 1,
        dataValue: 6000,
        label: 'Peak',
        colorParamKey: 'color_2',
        thresholdParamKey: 'threshold_2',
      },
    ]

    const result = JSON.parse(
      serializeGradientToJson(RASTER_JSON, stops, 'imagery'),
    )

    const colormapFn = result.config.sources[0].tiles[0].query.colormap
    expect(colormapFn['@@function']).toBe('buildColormap')
    expect(colormapFn.stops).toEqual([
      ['@@#params.threshold_1', '@@#params.color_1'],
      ['@@#params.threshold_2', '@@#params.color_2'],
    ])
  })

  it('adds new stop to buildColormap.stops when a stop is added', () => {
    const stops: GradientStop[] = [
      {
        id: '1',
        color: '#440154',
        position: 0,
        dataValue: -10000,
        label: 'Deep ocean',
        colorParamKey: 'color_1',
        thresholdParamKey: 'threshold_1',
      },
      {
        id: 'new',
        color: '#21918c',
        position: 0.5,
        dataValue: -2000,
        label: 'Shelf',
      },
      {
        id: '2',
        color: '#fde725',
        position: 1,
        dataValue: 6000,
        label: 'Peak',
        colorParamKey: 'color_2',
        thresholdParamKey: 'threshold_2',
      },
    ]

    const result = JSON.parse(
      serializeGradientToJson(RASTER_JSON, stops, 'imagery'),
    )

    const colormapFn = result.config.sources[0].tiles[0].query.colormap
    expect(colormapFn.stops).toHaveLength(3)
    expect(colormapFn.stops[0]).toEqual([
      '@@#params.threshold_1',
      '@@#params.color_1',
    ])
    expect(colormapFn.stops[1][0]).toMatch(/^@@#params\.threshold_\d+$/)
    expect(colormapFn.stops[1][1]).toMatch(/^@@#params\.color_\d+$/)
    expect(colormapFn.stops[2]).toEqual([
      '@@#params.threshold_2',
      '@@#params.color_2',
    ])
  })

  it('removes stop from buildColormap.stops when a stop is deleted', () => {
    const stops: GradientStop[] = [
      {
        id: '1',
        color: '#440154',
        position: 0,
        dataValue: -10000,
        label: 'Deep ocean',
        colorParamKey: 'color_1',
        thresholdParamKey: 'threshold_1',
      },
    ]

    const result = JSON.parse(
      serializeGradientToJson(RASTER_JSON, stops, 'imagery'),
    )

    const colormapFn = result.config.sources[0].tiles[0].query.colormap
    expect(colormapFn.stops).toHaveLength(1)
    expect(colormapFn.stops[0]).toEqual([
      '@@#params.threshold_1',
      '@@#params.color_1',
    ])
  })

  it('leaves config unchanged when no buildColormap exists', () => {
    const stops: GradientStop[] = [
      {
        id: '1',
        color: '#ff0000',
        position: 0,
        dataValue: 0,
        label: 'Low',
        colorParamKey: 'color_1',
        thresholdParamKey: 'threshold_1',
      },
      {
        id: '3',
        color: '#0000ff',
        position: 1,
        dataValue: 500000000,
        label: 'High',
        colorParamKey: 'color_3',
        thresholdParamKey: 'threshold_3',
      },
    ]

    const result = JSON.parse(
      serializeGradientToJson(EXAMPLE_JSON, stops, 'countries'),
    )

    // Should still have interpolate expression, no buildColormap
    const interpolate = result.config.styles[0].paint['fill-color']
    expect(interpolate[0]).toBe('interpolate')
  })
})

// Regression: when the source schema has NO threshold params (e.g. example 11,
// where heatmap-color interpolates on heatmap-density rather than a data
// property bound to params), applying an edit through the gradient editor must
// not fabricate threshold params or rewrite the interpolate expressions.
describe('serializeGradientToJson — source without thresholds', () => {
  const NO_THRESHOLD_JSON = JSON.stringify({
    config: {
      sources: [
        {
          id: 'capitals',
          type: 'geojson',
          data: 'https://x',
          legend_config: {
            type: 'gradient',
            items: [
              { label: 'Heatmap low', value: '@@#params.heatmap_color_low' },
              { label: 'Heatmap high', value: '@@#params.heatmap_color_high' },
            ],
          },
        },
      ],
      styles: [
        {
          source: 'capitals',
          type: 'heatmap',
          paint: {
            'heatmap-color': [
              'interpolate',
              ['linear'],
              ['heatmap-density'],
              0,
              'rgba(0,0,0,0)',
              0.2,
              '@@#params.heatmap_color_low',
              1.0,
              '@@#params.heatmap_color_high',
            ],
            'heatmap-opacity': '@@#params.heatmap_opacity',
          },
        },
      ],
    },
    params_config: [
      { key: 'heatmap_color_low', default: '#2c7bb6', group: 'legend' },
      { key: 'heatmap_color_high', default: '#d7191c', group: 'legend' },
      {
        key: 'heatmap_opacity',
        default: 0.85,
        min: 0,
        max: 1,
        step: 0.05,
      },
    ],
  })

  it('does not fabricate threshold_* params when source has none', () => {
    const stops: GradientStop[] = [
      {
        id: '1',
        color: '#00ff00',
        position: 0,
        dataValue: 0,
        label: 'Heatmap low',
        colorParamKey: 'heatmap_color_low',
      },
      {
        id: '2',
        color: '#d7191c',
        position: 1,
        dataValue: 0,
        label: 'Heatmap high',
        colorParamKey: 'heatmap_color_high',
      },
    ]

    const result = JSON.parse(
      serializeGradientToJson(NO_THRESHOLD_JSON, stops, 'capitals'),
    )

    const paramsKeys = result.params_config.map((p: { key: string }) => p.key)
    expect(paramsKeys).not.toContain('threshold_1')
    expect(paramsKeys).not.toContain('threshold_2')
    // Existing color params still present (with updated defaults)
    expect(paramsKeys).toContain('heatmap_color_low')
    expect(paramsKeys).toContain('heatmap_color_high')
    // Non-legend params untouched
    expect(paramsKeys).toContain('heatmap_opacity')

    const low = result.params_config.find(
      (p: { key: string }) => p.key === 'heatmap_color_low',
    )
    expect(low.default).toBe('#00ff00')
  })

  it('leaves the original interpolate expression untouched', () => {
    const stops: GradientStop[] = [
      {
        id: '1',
        color: '#00ff00',
        position: 0,
        dataValue: 0,
        label: 'Heatmap low',
        colorParamKey: 'heatmap_color_low',
      },
      {
        id: '2',
        color: '#d7191c',
        position: 1,
        dataValue: 0,
        label: 'Heatmap high',
        colorParamKey: 'heatmap_color_high',
      },
    ]

    const result = JSON.parse(
      serializeGradientToJson(NO_THRESHOLD_JSON, stops, 'capitals'),
    )

    const heatmapColor = result.config.styles[0].paint['heatmap-color']
    // Untouched: still anchored on heatmap-density with original numeric inputs
    expect(heatmapColor[0]).toBe('interpolate')
    expect(heatmapColor[2]).toEqual(['heatmap-density'])
    expect(heatmapColor[3]).toBe(0)
    expect(heatmapColor[5]).toBe(0.2)
    expect(heatmapColor[7]).toBe(1.0)
    // Param refs preserved at their original positions
    expect(heatmapColor[6]).toBe('@@#params.heatmap_color_low')
    expect(heatmapColor[8]).toBe('@@#params.heatmap_color_high')
  })

  it('updates source legend_config items to match new stop order/colors', () => {
    const stops: GradientStop[] = [
      {
        id: '1',
        color: '#00ff00',
        position: 0,
        dataValue: 0,
        label: 'Heatmap low',
        colorParamKey: 'heatmap_color_low',
      },
      {
        id: '2',
        color: '#d7191c',
        position: 1,
        dataValue: 0,
        label: 'Heatmap high',
        colorParamKey: 'heatmap_color_high',
      },
    ]

    const result = JSON.parse(
      serializeGradientToJson(NO_THRESHOLD_JSON, stops, 'capitals'),
    )

    expect(result.config.sources[0].legend_config.items).toEqual([
      { label: 'Heatmap low', value: '@@#params.heatmap_color_low' },
      { label: 'Heatmap high', value: '@@#params.heatmap_color_high' },
    ])
    // Must NOT be at top-level
    expect(result).not.toHaveProperty('legend_config')
  })
})
