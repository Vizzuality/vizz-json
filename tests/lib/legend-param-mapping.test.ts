import { describe, it, expect } from 'vitest'
import {
  extractLegendParamKeys,
  getOrphanLegendParams,
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
    const mapping = new Map([
      [0, { valueParamKey: 'color_1' }],
    ])
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
    const mapping = new Map([
      [0, { valueParamKey: 'color_1' }],
    ])
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
