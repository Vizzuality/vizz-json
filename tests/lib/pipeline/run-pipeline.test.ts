import { describe, it, expect } from 'vitest'
import { runResolutionPipeline } from '#/lib/pipeline'

describe('runResolutionPipeline', () => {
  it('returns empty result when parsedConfig is null', () => {
    const result = runResolutionPipeline(null, {})
    expect(result.inferredParams).toEqual([])
    expect(result.rawLegendConfig).toBeNull()
    expect(result.resolvedLegendConfig).toBeNull()
    expect(result.legendParamMapping.size).toBe(0)
    expect(result.orphanLegendParams).toEqual([])
    expect(result.metadata).toBeNull()
    expect(result.previewMode).toBe('map')
    expect(result.output).toEqual({
      kind: 'map',
      resolvedConfig: null,
      error: null,
    })
  })

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

  it('preserves rawLegendConfig before resolution and resolves resolvedLegendConfig', () => {
    const parsed = {
      legend_config: {
        type: 'choropleth',
        items: [
          { label: 'Low', value: '@@#params.low_color' },
          { label: 'High', value: '@@#params.high_color' },
        ],
      },
    }
    const result = runResolutionPipeline(parsed, {
      low_color: '#0000ff',
      high_color: '#ff0000',
    })
    expect(result.rawLegendConfig).toEqual(parsed.legend_config)
    expect(result.resolvedLegendConfig).toEqual({
      type: 'choropleth',
      items: [
        { label: 'Low', value: '#0000ff' },
        { label: 'High', value: '#ff0000' },
      ],
    })
  })

  it('builds legendParamMapping from raw legend config', () => {
    const parsed = {
      legend_config: {
        type: 'choropleth',
        items: [
          { label: 'A', value: '@@#params.a' },
          { label: 'B', value: 'static' },
        ],
      },
    }
    const result = runResolutionPipeline(parsed, { a: '#ff0000' })
    expect(result.legendParamMapping.get(0)).toEqual({ valueParamKey: 'a' })
    expect(result.legendParamMapping.has(1)).toBe(false)
  })

  it('reports orphan legend params not referenced by the legend config', () => {
    const parsed = {
      params_config: [
        { key: 'used', default: '#0000ff', group: 'legend' },
        { key: 'orphan', default: '#ff0000', group: 'legend' },
      ],
      legend_config: {
        type: 'choropleth',
        items: [{ label: 'X', value: '@@#params.used' }],
      },
    }
    const result = runResolutionPipeline(parsed, {
      used: '#0000ff',
      orphan: '#ff0000',
    })
    expect(result.orphanLegendParams.map((p) => p.key)).toEqual(['orphan'])
  })

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
