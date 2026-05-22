import { describe, it, expect } from 'vitest'
import {
  extractLegendParamKeys,
  getOrphanLegendParams,
  extractSourceLegendMappings,
  getOrphanLegendParamsAcrossSources,
} from '#/lib/legend-param-mapping'
import type { InferredParam } from '#/lib/types'

describe('extractLegendParamKeys', () => {
  it('returns empty map for null config', () => {
    const result = extractLegendParamKeys(null)
    expect(result.size).toBe(0)
  })

  it('extracts valueParamKey from @@#params.* references', () => {
    const raw = {
      type: 'choropleth' as const,
      items: [
        { label: 'High', value: '@@#params.high_color' },
        { label: 'Low', value: '@@#params.low_color' },
      ],
    }
    const result = extractLegendParamKeys(raw)
    expect(result.get(0)).toEqual({ valueParamKey: 'high_color' })
    expect(result.get(1)).toEqual({ valueParamKey: 'low_color' })
  })

  it('extracts labelParamKey when label is a param reference', () => {
    const raw = {
      type: 'basic' as const,
      items: [{ label: '@@#params.label_1', value: '@@#params.color_1' }],
    }
    const result = extractLegendParamKeys(raw)
    expect(result.get(0)).toEqual({
      valueParamKey: 'color_1',
      labelParamKey: 'label_1',
    })
  })

  it('skips static items (no param references)', () => {
    const raw = {
      type: 'basic' as const,
      items: [
        { label: 'Static', value: '#ff0000' },
        { label: 'Dynamic', value: '@@#params.color_1' },
      ],
    }
    const result = extractLegendParamKeys(raw)
    expect(result.has(0)).toBe(false)
    expect(result.get(1)).toEqual({ valueParamKey: 'color_1' })
  })

  it('handles numeric values (no param reference)', () => {
    const raw = {
      type: 'gradient' as const,
      items: [{ label: 'Min', value: 0 }],
    }
    const result = extractLegendParamKeys(raw)
    expect(result.has(0)).toBe(false)
  })

  it('handles empty items array', () => {
    const raw = { type: 'basic' as const, items: [] }
    const result = extractLegendParamKeys(raw)
    expect(result.size).toBe(0)
  })
})

describe('getOrphanLegendParams', () => {
  const legendParams: readonly InferredParam[] = [
    {
      key: 'high_color',
      value: '#2563eb',
      control_type: 'color_picker',
      group: 'legend',
    },
    {
      key: 'low_color',
      value: '#dc2626',
      control_type: 'color_picker',
      group: 'legend',
    },
    {
      key: 'default_color',
      value: '#6b7280',
      control_type: 'color_picker',
      group: 'legend',
    },
  ]

  it('returns params not referenced in any item mapping', () => {
    const mapping = new Map([
      [0, { valueParamKey: 'high_color' }],
      [1, { valueParamKey: 'low_color' }],
    ])
    const orphans = getOrphanLegendParams(legendParams, mapping)
    expect(orphans).toEqual([
      {
        key: 'default_color',
        value: '#6b7280',
        control_type: 'color_picker',
        group: 'legend',
      },
    ])
  })

  it('returns empty array when all params are referenced', () => {
    const mapping = new Map([
      [0, { valueParamKey: 'high_color' }],
      [1, { valueParamKey: 'low_color' }],
      [2, { valueParamKey: 'default_color' }],
    ])
    const orphans = getOrphanLegendParams(legendParams, mapping)
    expect(orphans).toEqual([])
  })

  it('returns all params when mapping is empty', () => {
    const orphans = getOrphanLegendParams(legendParams, new Map())
    expect(orphans).toEqual(legendParams)
  })

  it('excludes gradient threshold params (slider non-color) for gradient legends', () => {
    const params: readonly InferredParam[] = [
      {
        key: 'color_1',
        value: '#ff0000',
        control_type: 'color_picker',
        group: 'legend',
      },
      {
        key: 'threshold_1',
        value: 0,
        control_type: 'slider',
        min: 0,
        max: 1000,
        group: 'legend',
      },
      {
        key: 'threshold_3',
        value: 1000,
        control_type: 'slider',
        min: 0,
        max: 1000,
        group: 'legend',
      },
    ]
    const mapping = new Map([[0, { valueParamKey: 'color_1' }]])
    const orphans = getOrphanLegendParams(params, mapping, 'gradient')
    expect(orphans).toEqual([])
  })

  it('keeps slider orphans for non-gradient legends', () => {
    const params: readonly InferredParam[] = [
      {
        key: 'color_1',
        value: '#ff0000',
        control_type: 'color_picker',
        group: 'legend',
      },
      {
        key: 'threshold_1',
        value: 0,
        control_type: 'slider',
        min: 0,
        max: 1000,
        group: 'legend',
      },
    ]
    const mapping = new Map([[0, { valueParamKey: 'color_1' }]])
    const orphans = getOrphanLegendParams(params, mapping, 'choropleth')
    expect(orphans).toEqual([
      {
        key: 'threshold_1',
        value: 0,
        control_type: 'slider',
        min: 0,
        max: 1000,
        group: 'legend',
      },
    ])
  })

  it('considers both valueParamKey and labelParamKey references', () => {
    const params: readonly InferredParam[] = [
      {
        key: 'color_1',
        value: '#ff0000',
        control_type: 'color_picker',
        group: 'legend',
      },
      {
        key: 'label_1',
        value: 'Label',
        control_type: 'text_input',
        group: 'legend',
      },
      {
        key: 'orphan',
        value: '#000',
        control_type: 'color_picker',
        group: 'legend',
      },
    ]
    const mapping = new Map([
      [0, { valueParamKey: 'color_1', labelParamKey: 'label_1' }],
    ])
    const orphans = getOrphanLegendParams(params, mapping)
    expect(orphans).toEqual([
      {
        key: 'orphan',
        value: '#000',
        control_type: 'color_picker',
        group: 'legend',
      },
    ])
  })
})

// ------------------------------------------------------------------ NEW: extractSourceLegendMappings

describe('extractSourceLegendMappings', () => {
  it('returns empty array for null config', () => {
    const result = extractSourceLegendMappings(null)
    expect(result).toEqual([])
  })

  it('returns empty array when sources have no legend_config', () => {
    const config = {
      config: {
        sources: [
          { id: 'a', type: 'geojson' },
          { id: 'b', type: 'geojson' },
        ],
      },
    }
    const result = extractSourceLegendMappings(config)
    expect(result).toEqual([])
  })

  it('returns empty array when no sources array present', () => {
    const result = extractSourceLegendMappings({ config: {} })
    expect(result).toEqual([])
  })

  it('returns entries only for sources that have legend_config', () => {
    const config = {
      config: {
        sources: [
          {
            id: 'with-legend',
            type: 'geojson',
            legend_config: {
              type: 'basic' as const,
              items: [{ label: 'A', value: '@@#params.color_a' }],
            },
          },
          { id: 'no-legend', type: 'geojson' },
        ],
      },
    }
    const result = extractSourceLegendMappings(config)
    expect(result).toHaveLength(1)
    expect(result[0].sourceId).toBe('with-legend')
  })

  it('returns separate entries for each source with a legend_config', () => {
    const config = {
      config: {
        sources: [
          {
            id: 'src_a',
            legend_config: {
              type: 'basic' as const,
              items: [{ label: 'A', value: '@@#params.color_a' }],
            },
          },
          {
            id: 'src_b',
            legend_config: {
              type: 'gradient' as const,
              items: [
                { label: 'Low', value: '@@#params.color_low' },
                { label: 'High', value: '@@#params.color_high' },
              ],
            },
          },
        ],
      },
    }
    const result = extractSourceLegendMappings(config)
    expect(result).toHaveLength(2)
    expect(result[0].sourceId).toBe('src_a')
    expect(result[1].sourceId).toBe('src_b')
  })

  it('each entry has rawLegend and paramMapping', () => {
    const config = {
      sources: [
        {
          id: 'main',
          legend_config: {
            type: 'choropleth' as const,
            items: [
              { label: 'High', value: '@@#params.high_color' },
              { label: 'Static', value: '#fff' },
            ],
          },
        },
      ],
    }
    const result = extractSourceLegendMappings(config)
    expect(result).toHaveLength(1)
    expect(result[0].rawLegend.type).toBe('choropleth')
    expect(result[0].rawLegend.items).toHaveLength(2)
    // paramMapping should map item 0 (has param ref), not item 1 (static)
    expect(result[0].paramMapping.get(0)).toEqual({
      valueParamKey: 'high_color',
    })
    expect(result[0].paramMapping.has(1)).toBe(false)
  })

  it('works with top-level sources (no config wrapper)', () => {
    const config = {
      sources: [
        {
          id: 'direct',
          legend_config: {
            type: 'basic' as const,
            items: [{ label: 'A', value: '@@#params.color_a' }],
          },
        },
      ],
    }
    const result = extractSourceLegendMappings(config)
    expect(result).toHaveLength(1)
    expect(result[0].sourceId).toBe('direct')
  })
})

// ------------------------------------------------------------------ NEW: getOrphanLegendParamsAcrossSources

describe('getOrphanLegendParamsAcrossSources', () => {
  const makeParams = (
    keys: string[],
    controlType: 'color_picker' | 'slider' = 'color_picker',
  ): readonly InferredParam[] =>
    keys.map((key) => ({
      key,
      value: '#ff0000',
      control_type: controlType,
      group: 'legend' as const,
    }))

  it('returns all params when perSource is empty', () => {
    const params = makeParams(['color_a', 'color_b'])
    const orphans = getOrphanLegendParamsAcrossSources(params, [])
    expect(orphans.map((p) => p.key)).toEqual(['color_a', 'color_b'])
  })

  it('param referenced by any source mapping is not orphan', () => {
    const params = makeParams(['color_a', 'color_b', 'unused'])
    const perSource = [
      {
        paramMapping: new Map([[0, { valueParamKey: 'color_a' }]]),
        rawLegend: {
          type: 'basic' as const,
          items: [{ label: 'A', value: '@@#params.color_a' }],
        },
      },
      {
        paramMapping: new Map([[0, { valueParamKey: 'color_b' }]]),
        rawLegend: {
          type: 'basic' as const,
          items: [{ label: 'B', value: '@@#params.color_b' }],
        },
      },
    ]
    const orphans = getOrphanLegendParamsAcrossSources(params, perSource)
    expect(orphans.map((p) => p.key)).toEqual(['unused'])
  })

  it('gradient threshold filter applied when ANY source legend is gradient', () => {
    const colorParams = makeParams(['color_a'], 'color_picker')
    const sliderParams = makeParams(['threshold_1'], 'slider')
    const params = [...colorParams, ...sliderParams]

    const perSource = [
      {
        paramMapping: new Map([[0, { valueParamKey: 'color_a' }]]),
        rawLegend: {
          type: 'gradient' as const,
          items: [{ label: 'A', value: '@@#params.color_a' }],
        },
      },
    ]
    // threshold_1 is a slider not referenced in colorKeys, but gradient => filtered
    const orphans = getOrphanLegendParamsAcrossSources(params, perSource)
    expect(orphans.map((p) => p.key)).not.toContain('threshold_1')
  })

  it('slider params NOT filtered when no source has gradient legend', () => {
    const params: readonly InferredParam[] = [
      {
        key: 'color_a',
        value: '#ff0000',
        control_type: 'color_picker',
        group: 'legend',
      },
      {
        key: 'slider_orphan',
        value: 5,
        control_type: 'slider',
        group: 'legend',
      },
    ]
    const perSource = [
      {
        paramMapping: new Map([[0, { valueParamKey: 'color_a' }]]),
        rawLegend: {
          type: 'basic' as const,
          items: [{ label: 'A', value: '@@#params.color_a' }],
        },
      },
    ]
    const orphans = getOrphanLegendParamsAcrossSources(params, perSource)
    expect(orphans.map((p) => p.key)).toContain('slider_orphan')
  })

  it('empty params returns empty orphans', () => {
    const orphans = getOrphanLegendParamsAcrossSources([], [])
    expect(orphans).toEqual([])
  })

  it('labelParamKey references also prevent orphan status', () => {
    const params: readonly InferredParam[] = [
      {
        key: 'label_1',
        value: 'Label',
        control_type: 'text_input',
        group: 'legend',
      },
      {
        key: 'orphan',
        value: '#000',
        control_type: 'color_picker',
        group: 'legend',
      },
    ]
    const perSource = [
      {
        paramMapping: new Map([[0, { labelParamKey: 'label_1' }]]),
        rawLegend: {
          type: 'basic' as const,
          items: [{ label: '@@#params.label_1', value: '#fff' }],
        },
      },
    ]
    const orphans = getOrphanLegendParamsAcrossSources(params, perSource)
    expect(orphans.map((p) => p.key)).not.toContain('label_1')
    expect(orphans.map((p) => p.key)).toContain('orphan')
  })
})
