import { describe, it, expect } from 'vitest'
import { initializeGradientStops } from '#/lib/gradient-stops-init'
import type { LegendItem, InferredParam } from '#/lib/types'
import type { ItemParamMapping } from '#/lib/legend-param-mapping'

describe('initializeGradientStops', () => {
  it('creates stops from legend items with param mapping', () => {
    const items: LegendItem[] = [
      { label: 'Low', value: '#eff6ff' },
      { label: 'Mid', value: '#3b82f6' },
      { label: 'High', value: '#1e3a8a' },
    ]
    const paramMapping = new Map<number, ItemParamMapping>([
      [0, { valueParamKey: 'color_1' }],
      [1, { valueParamKey: 'color_2' }],
      [2, { valueParamKey: 'color_3' }],
    ])
    const legendParams: InferredParam[] = [
      {
        key: 'threshold_1',
        value: 0,
        control_type: 'slider',
        group: 'legend',
        min: 0,
        max: 500000000,
        step: 1000000,
      },
      {
        key: 'threshold_2',
        value: 50000000,
        control_type: 'slider',
        group: 'legend',
        min: 0,
        max: 1000000000,
        step: 1000000,
      },
      {
        key: 'threshold_3',
        value: 500000000,
        control_type: 'slider',
        group: 'legend',
        min: 0,
        max: 2000000000,
        step: 10000000,
      },
      {
        key: 'color_1',
        value: '#eff6ff',
        control_type: 'color_picker',
        group: 'legend',
      },
      {
        key: 'color_2',
        value: '#3b82f6',
        control_type: 'color_picker',
        group: 'legend',
      },
      {
        key: 'color_3',
        value: '#1e3a8a',
        control_type: 'color_picker',
        group: 'legend',
      },
    ]
    const values: Record<string, unknown> = {
      threshold_1: 0,
      threshold_2: 50000000,
      threshold_3: 500000000,
      color_1: '#eff6ff',
      color_2: '#3b82f6',
      color_3: '#1e3a8a',
    }

    const stops = initializeGradientStops(
      items,
      paramMapping,
      legendParams,
      values,
    )

    expect(stops).toHaveLength(3)
    expect(stops[0].color).toBe('#eff6ff')
    expect(stops[0].label).toBe('Low')
    expect(stops[0].colorParamKey).toBe('color_1')
    expect(stops[0].thresholdParamKey).toBe('threshold_1')
    expect(stops[0].dataValue).toBe(0)
    expect(stops[0].position).toBe(0)

    expect(stops[1].position).toBe(0.1) // 50M / 500M = 0.1
    expect(stops[1].thresholdParamKey).toBe('threshold_2')

    expect(stops[2].position).toBe(1)
    expect(stops[2].dataValue).toBe(500000000)
  })

  it('distributes positions evenly when no threshold params exist', () => {
    const items: LegendItem[] = [
      { label: 'A', value: '#ff0000' },
      { label: 'B', value: '#00ff00' },
      { label: 'C', value: '#0000ff' },
    ]
    const paramMapping = new Map<number, ItemParamMapping>([
      [0, { valueParamKey: 'color_a' }],
      [1, { valueParamKey: 'color_b' }],
      [2, { valueParamKey: 'color_c' }],
    ])
    const legendParams: InferredParam[] = [
      {
        key: 'color_a',
        value: '#ff0000',
        control_type: 'color_picker',
        group: 'legend',
      },
      {
        key: 'color_b',
        value: '#00ff00',
        control_type: 'color_picker',
        group: 'legend',
      },
      {
        key: 'color_c',
        value: '#0000ff',
        control_type: 'color_picker',
        group: 'legend',
      },
    ]
    const values: Record<string, unknown> = {
      color_a: '#ff0000',
      color_b: '#00ff00',
      color_c: '#0000ff',
    }

    const stops = initializeGradientStops(
      items,
      paramMapping,
      legendParams,
      values,
    )

    expect(stops[0].position).toBe(0)
    expect(stops[1].position).toBe(0.5)
    expect(stops[2].position).toBe(1)
    expect(stops[0].thresholdParamKey).toBeUndefined()
  })

  it('assigns unique IDs to each stop', () => {
    const items: LegendItem[] = [
      { label: 'A', value: '#ff0000' },
      { label: 'B', value: '#0000ff' },
    ]
    const paramMapping = new Map<number, ItemParamMapping>()
    const stops = initializeGradientStops(items, paramMapping, [], {})

    const ids = stops.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('handles single item', () => {
    const items: LegendItem[] = [{ label: 'Only', value: '#ff0000' }]
    const paramMapping = new Map<number, ItemParamMapping>()
    const stops = initializeGradientStops(items, paramMapping, [], {})

    expect(stops).toHaveLength(1)
    expect(stops[0].position).toBe(0.5)
  })
})
