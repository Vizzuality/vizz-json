import { describe, it, expect } from 'vitest'
import { runResolutionPipeline } from '#/lib/pipeline'

describe('runResolutionPipeline', () => {
  describe('null config', () => {
    it('returns empty result when parsedConfig is null', () => {
      const result = runResolutionPipeline(null, {})
      expect(result.inferredParams).toEqual([])
      expect(result.sourceLegends).toEqual([])
      expect(result.orphanLegendParams).toEqual([])
      expect(result.metadata).toBeNull()
      expect(result.previewMode).toBe('map')
      expect(result.output).toEqual({
        kind: 'map',
        resolvedConfig: null,
        error: null,
      })
    })

    it('does NOT have rawLegendConfig, resolvedLegendConfig, or legendParamMapping keys', () => {
      const result = runResolutionPipeline(null, {}) as Record<string, unknown>
      expect(result).not.toHaveProperty('rawLegendConfig')
      expect(result).not.toHaveProperty('resolvedLegendConfig')
      expect(result).not.toHaveProperty('legendParamMapping')
    })
  })

  describe('map resolution', () => {
    it('resolves the inner .config of a wrapped schema without @@ prefixes', () => {
      const parsed = {
        config: { sources: [{ id: 's' }], styles: [{ source: 's' }] },
      }
      const result = runResolutionPipeline(parsed, {})
      expect(result.previewMode).toBe('map')
      expect(result.output.kind).toBe('map')
      if (result.output.kind === 'map') {
        expect(result.output.resolvedConfig).toEqual(parsed.config)
        expect(result.output.error).toBeNull()
      }
    })

    it('falls back to the whole parsedConfig when .config is absent', () => {
      const parsed = { sources: [{ id: 's' }], styles: [{ source: 's' }] }
      const result = runResolutionPipeline(parsed, {})
      if (result.output.kind === 'map') {
        expect(result.output.resolvedConfig).toEqual(parsed)
      }
    })

    it('substitutes @@#params.X references in the inner config', () => {
      const parsed = {
        config: { paint: { 'fill-opacity': '@@#params.opacity' } },
      }
      const result = runResolutionPipeline(parsed, { opacity: 0.7 })
      if (result.output.kind === 'map') {
        expect(result.output.resolvedConfig).toEqual({
          paint: { 'fill-opacity': 0.7 },
        })
      }
    })
  })

  describe('inferredParams', () => {
    it('infers params from params_config', () => {
      const parsed = {
        params_config: [
          { key: 'opacity', default: 0.8, min: 0, max: 1, step: 0.01 },
          { key: 'enabled', default: true },
        ],
      }
      const result = runResolutionPipeline(parsed, {})
      expect(result.inferredParams).toHaveLength(2)
      expect(result.inferredParams[0].control_type).toBe('slider')
      expect(result.inferredParams[1].control_type).toBe('switch')
    })

    it('returns empty inferredParams when params_config is missing', () => {
      const parsed = { config: { foo: 'bar' } }
      const result = runResolutionPipeline(parsed, {})
      expect(result.inferredParams).toEqual([])
    })
  })

  describe('sourceLegends — new per-source shape', () => {
    it('output has sourceLegends array (not rawLegendConfig)', () => {
      const parsed = {
        config: {
          sources: [
            {
              id: 'countries',
              legend_config: {
                type: 'choropleth',
                items: [
                  { label: 'Low', value: '@@#params.low_color' },
                  { label: 'High', value: '@@#params.high_color' },
                ],
              },
            },
          ],
          styles: [{ source: 'countries', type: 'fill' }],
        },
        params_config: [
          { key: 'low_color', default: '#0000ff', group: 'legend' },
          { key: 'high_color', default: '#ff0000', group: 'legend' },
        ],
      }
      const result = runResolutionPipeline(parsed, {
        low_color: '#0000ff',
        high_color: '#ff0000',
      })
      expect(Array.isArray(result.sourceLegends)).toBe(true)
      expect(result.sourceLegends).toHaveLength(1)
    })

    it('sourceLegend entry has sourceId, rawLegend, resolvedLegend, paramMapping, thresholdParams', () => {
      const parsed = {
        config: {
          sources: [
            {
              id: 'countries',
              legend_config: {
                type: 'choropleth',
                items: [{ label: 'Low', value: '@@#params.low_color' }],
              },
            },
          ],
          styles: [{ source: 'countries', type: 'fill' }],
        },
        params_config: [
          { key: 'low_color', default: '#0000ff', group: 'legend' },
        ],
      }
      const result = runResolutionPipeline(parsed, { low_color: '#aabbcc' })
      const entry = result.sourceLegends[0]
      expect(entry.sourceId).toBe('countries')
      expect(entry.rawLegend).toBeDefined()
      expect(entry.resolvedLegend).toBeDefined()
      expect(entry.paramMapping).toBeInstanceOf(Map)
      expect(Array.isArray(entry.thresholdParams)).toBe(true)
    })

    it('resolvedLegend has param values substituted', () => {
      const parsed = {
        config: {
          sources: [
            {
              id: 'src',
              legend_config: {
                type: 'basic',
                items: [{ label: 'Color', value: '@@#params.the_color' }],
              },
            },
          ],
          styles: [{ source: 'src', type: 'fill' }],
        },
        params_config: [
          { key: 'the_color', default: '#000000', group: 'legend' },
        ],
      }
      const result = runResolutionPipeline(parsed, { the_color: '#ff5500' })
      expect(result.sourceLegends[0].resolvedLegend.items[0].value).toBe(
        '#ff5500',
      )
    })

    it('rawLegend retains original @@#params.* references', () => {
      const parsed = {
        config: {
          sources: [
            {
              id: 'src',
              legend_config: {
                type: 'basic',
                items: [{ label: 'Color', value: '@@#params.the_color' }],
              },
            },
          ],
          styles: [{ source: 'src', type: 'fill' }],
        },
        params_config: [
          { key: 'the_color', default: '#000000', group: 'legend' },
        ],
      }
      const result = runResolutionPipeline(parsed, { the_color: '#ff5500' })
      expect(result.sourceLegends[0].rawLegend.items[0].value).toBe(
        '@@#params.the_color',
      )
    })

    it('sourceLegends is empty when no source has legend_config', () => {
      const parsed = {
        config: {
          sources: [{ id: 's', type: 'geojson' }],
          styles: [{ source: 's', type: 'fill' }],
        },
      }
      const result = runResolutionPipeline(parsed, {})
      expect(result.sourceLegends).toHaveLength(0)
    })

    it('multi-source heatmap yields sourceLegends.length === 2', () => {
      const parsed = {
        config: {
          sources: [
            {
              id: 'countries',
              type: 'geojson',
              legend_config: {
                type: 'basic',
                items: [
                  { label: 'Country fill', value: '@@#params.fill_color' },
                ],
              },
            },
            {
              id: 'capitals',
              type: 'geojson',
              legend_config: {
                type: 'gradient',
                items: [
                  {
                    label: 'Heatmap low',
                    value: '@@#params.heatmap_color_low',
                  },
                  {
                    label: 'Heatmap high',
                    value: '@@#params.heatmap_color_high',
                  },
                ],
              },
            },
          ],
          styles: [
            {
              source: 'countries',
              type: 'fill',
              paint: { 'fill-color': '@@#params.fill_color' },
            },
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
              },
            },
          ],
        },
        params_config: [
          { key: 'fill_color', default: '#dbeafe', group: 'legend' },
          { key: 'heatmap_color_low', default: '#2c7bb6', group: 'legend' },
          { key: 'heatmap_color_high', default: '#d7191c', group: 'legend' },
        ],
      }
      const result = runResolutionPipeline(parsed, {
        fill_color: '#dbeafe',
        heatmap_color_low: '#2c7bb6',
        heatmap_color_high: '#d7191c',
      })
      expect(result.sourceLegends).toHaveLength(2)
      expect(result.sourceLegends[0].sourceId).toBe('countries')
      expect(result.sourceLegends[1].sourceId).toBe('capitals')
    })

    it('thresholdParams per entry scoped to that source styles only', () => {
      // Source with threshold slider params in its styles
      const parsed = {
        config: {
          sources: [
            {
              id: 'data',
              legend_config: {
                type: 'gradient',
                items: [{ label: 'Low', value: '@@#params.color_low' }],
              },
            },
          ],
          styles: [
            {
              source: 'data',
              type: 'fill',
              paint: {
                'fill-color': [
                  'interpolate',
                  ['linear'],
                  ['get', 'value'],
                  '@@#params.threshold_1',
                  '@@#params.color_low',
                ],
              },
            },
          ],
        },
        params_config: [
          { key: 'color_low', default: '#ff0000', group: 'legend' },
          {
            key: 'threshold_1',
            default: 0,
            min: 0,
            max: 100,
            step: 1,
            group: 'legend',
          },
        ],
      }
      const result = runResolutionPipeline(parsed, {
        color_low: '#ff0000',
        threshold_1: 0,
      })
      const entry = result.sourceLegends[0]
      // threshold_1 is a slider + group=legend + referenced by data's styles + not a color stop key
      expect(entry.thresholdParams.map((p) => p.key)).toContain('threshold_1')
      // color_low is color_picker, not threshold
      expect(entry.thresholdParams.map((p) => p.key)).not.toContain('color_low')
    })
  })

  describe('orphanLegendParams', () => {
    it('reports orphan legend params not referenced by any source legend', () => {
      const parsed = {
        config: {
          sources: [
            {
              id: 'src',
              legend_config: {
                type: 'choropleth',
                items: [{ label: 'X', value: '@@#params.used' }],
              },
            },
          ],
          styles: [{ source: 'src', type: 'fill' }],
        },
        params_config: [
          { key: 'used', default: '#0000ff', group: 'legend' },
          { key: 'orphan', default: '#ff0000', group: 'legend' },
        ],
      }
      const result = runResolutionPipeline(parsed, {
        used: '#0000ff',
        orphan: '#ff0000',
      })
      expect(result.orphanLegendParams.map((p) => p.key)).toEqual(['orphan'])
    })

    it('orphanLegendParams is empty when no sources have legend_config', () => {
      // No legend params at all
      const parsed = {
        config: { sources: [{ id: 's' }], styles: [{ source: 's' }] },
        params_config: [
          { key: 'opacity', default: 0.8, min: 0, max: 1, step: 0.05 },
        ],
      }
      const result = runResolutionPipeline(parsed, {})
      expect(result.orphanLegendParams).toEqual([])
    })
  })

  describe('components preview mode', () => {
    it('detects components preview mode and resolves components branch', () => {
      const parsed = {
        metadata: {
          title: 'C',
          description: '',
          tier: 'basic',
          preview: 'components',
        },
        components: [
          {
            '@@type': 'StatCard',
            label: 'Hits',
            value: '@@#params.value',
            unit: '',
            color: '#000',
          },
        ],
        params_config: [{ key: 'value', default: '42' }],
      }
      const result = runResolutionPipeline(parsed, { value: '42' })
      expect(result.previewMode).toBe('components')
      expect(result.output.kind).toBe('components')
      if (result.output.kind === 'components') {
        expect(result.output.error).toBeNull()
        expect(Array.isArray(result.output.resolvedComponents)).toBe(true)
      }
    })

    it('returns null components when components is not an array', () => {
      const parsed = {
        metadata: {
          title: 'C',
          description: '',
          tier: 'basic',
          preview: 'components',
        },
        components: 'not-an-array',
      }
      const result = runResolutionPipeline(parsed, {})
      expect(result.output.kind).toBe('components')
      if (result.output.kind === 'components') {
        expect(result.output.resolvedComponents).toBeNull()
        expect(result.output.error).toBeNull()
      }
    })
  })

  describe('metadata', () => {
    it('exposes metadata when present', () => {
      const parsed = {
        metadata: { title: 'T', description: 'D', tier: 'advanced' },
      }
      const result = runResolutionPipeline(parsed, {})
      expect(result.metadata).toEqual({
        title: 'T',
        description: 'D',
        tier: 'advanced',
      })
    })

    it('returns null metadata and map preview when metadata absent', () => {
      const result = runResolutionPipeline({ config: {} }, {})
      expect(result.metadata).toBeNull()
      expect(result.previewMode).toBe('map')
    })
  })
})
