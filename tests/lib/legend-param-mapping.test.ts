import { describe, it, expect } from 'vitest'
import { extractLegendParamKeys } from '#/lib/legend-param-mapping'

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
