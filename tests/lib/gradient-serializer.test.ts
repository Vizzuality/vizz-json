import { describe, it, expect } from 'vitest'
import { serializeGradientToJson } from '#/lib/gradient-serializer'
import type { GradientStop } from '#/lib/gradient-types'

const EXAMPLE_JSON = JSON.stringify(
  {
    config: {
      source: { type: 'geojson', data: 'https://example.com/data.geojson' },
      styles: [
        {
          type: 'fill',
          paint: {
            'fill-color': [
              'interpolate',
              ['linear'],
              ['get', 'pop_est'],
              '@@#params.stop_low',
              '@@#params.color_low',
              '@@#params.stop_mid',
              '@@#params.color_mid',
              '@@#params.stop_high',
              '@@#params.color_high',
            ],
            'fill-opacity': '@@#params.opacity',
          },
        },
      ],
    },
    params_config: [
      { key: 'stop_low', default: 0, min: 0, max: 500000000, step: 1000000, group: 'legend' },
      { key: 'stop_mid', default: 50000000, min: 0, max: 1000000000, step: 1000000, group: 'legend' },
      { key: 'stop_high', default: 500000000, min: 0, max: 2000000000, step: 10000000, group: 'legend' },
      { key: 'color_low', default: '#eff6ff', group: 'legend' },
      { key: 'color_mid', default: '#3b82f6', group: 'legend' },
      { key: 'color_high', default: '#1e3a8a', group: 'legend' },
      { key: 'opacity', default: 0.8, min: 0, max: 1, step: 0.05 },
    ],
    legend_config: {
      type: 'gradient',
      items: [
        { label: 'Low', value: '@@#params.color_low' },
        { label: 'Mid', value: '@@#params.color_mid' },
        { label: 'High', value: '@@#params.color_high' },
      ],
    },
  },
  null,
  2,
)

describe('serializeGradientToJson', () => {
  it('preserves existing stops with their original keys', () => {
    const stops: GradientStop[] = [
      { id: '1', color: '#ff0000', position: 0, dataValue: 0, label: 'Low', colorParamKey: 'color_low', thresholdParamKey: 'stop_low' },
      { id: '2', color: '#00ff00', position: 0.5, dataValue: 250000000, label: 'Mid', colorParamKey: 'color_mid', thresholdParamKey: 'stop_mid' },
      { id: '3', color: '#0000ff', position: 1, dataValue: 500000000, label: 'High', colorParamKey: 'color_high', thresholdParamKey: 'stop_high' },
    ]

    const result = JSON.parse(serializeGradientToJson(EXAMPLE_JSON, stops))

    const legendItems = result.legend_config.items
    expect(legendItems).toHaveLength(3)
    expect(legendItems[0].value).toBe('@@#params.color_low')
    expect(legendItems[2].value).toBe('@@#params.color_high')

    const interpolate = result.config.styles[0].paint['fill-color']
    expect(interpolate[0]).toBe('interpolate')
    expect(interpolate[3]).toBe('@@#params.stop_low')
    expect(interpolate[4]).toBe('@@#params.color_low')
  })

  it('generates new keys for added stops', () => {
    const stops: GradientStop[] = [
      { id: '1', color: '#ff0000', position: 0, dataValue: 0, label: 'Low', colorParamKey: 'color_low', thresholdParamKey: 'stop_low' },
      { id: 'new', color: '#ffff00', position: 0.25, dataValue: 125000000, label: '' },
      { id: '3', color: '#0000ff', position: 1, dataValue: 500000000, label: 'High', colorParamKey: 'color_high', thresholdParamKey: 'stop_high' },
    ]

    const result = JSON.parse(serializeGradientToJson(EXAMPLE_JSON, stops))

    const legendItems = result.legend_config.items
    expect(legendItems).toHaveLength(3)
    expect(legendItems[1].value).toMatch(/^@@#params\.color_\d+$/)
    expect(legendItems[1].label).toBe('Stop 2')

    const paramsKeys = result.params_config.map((p: { key: string }) => p.key)
    expect(paramsKeys).toContain('color_low')
    expect(paramsKeys).toContain('stop_low')
    expect(paramsKeys).toContain('color_high')
    expect(paramsKeys).toContain('stop_high')
    expect(paramsKeys).toContain('opacity')
  })

  it('preserves non-legend params', () => {
    const stops: GradientStop[] = [
      { id: '1', color: '#ff0000', position: 0, dataValue: 0, label: 'Low', colorParamKey: 'color_low', thresholdParamKey: 'stop_low' },
      { id: '2', color: '#0000ff', position: 1, dataValue: 500000000, label: 'High', colorParamKey: 'color_high', thresholdParamKey: 'stop_high' },
    ]

    const result = JSON.parse(serializeGradientToJson(EXAMPLE_JSON, stops))

    const opacityParam = result.params_config.find(
      (p: { key: string }) => p.key === 'opacity',
    )
    expect(opacityParam).toBeDefined()
    expect(opacityParam.default).toBe(0.8)
  })

  it('removes params for deleted stops', () => {
    const stops: GradientStop[] = [
      { id: '1', color: '#ff0000', position: 0, dataValue: 0, label: 'Low', colorParamKey: 'color_low', thresholdParamKey: 'stop_low' },
      { id: '3', color: '#0000ff', position: 1, dataValue: 500000000, label: 'High', colorParamKey: 'color_high', thresholdParamKey: 'stop_high' },
    ]

    const result = JSON.parse(serializeGradientToJson(EXAMPLE_JSON, stops))

    const paramsKeys = result.params_config.map((p: { key: string }) => p.key)
    expect(paramsKeys).not.toContain('color_mid')
    expect(paramsKeys).not.toContain('stop_mid')
  })

  it('rebuilds interpolate expression in correct position order', () => {
    const stops: GradientStop[] = [
      { id: '3', color: '#0000ff', position: 1, dataValue: 500000000, label: 'High', colorParamKey: 'color_high', thresholdParamKey: 'stop_high' },
      { id: '1', color: '#ff0000', position: 0, dataValue: 0, label: 'Low', colorParamKey: 'color_low', thresholdParamKey: 'stop_low' },
    ]

    const result = JSON.parse(serializeGradientToJson(EXAMPLE_JSON, stops))

    const interpolate = result.config.styles[0].paint['fill-color']
    expect(interpolate[3]).toBe('@@#params.stop_low')
    expect(interpolate[5]).toBe('@@#params.stop_high')
  })

  it('handles JSON without interpolate expression', () => {
    const jsonWithoutInterpolate = JSON.stringify({
      config: { styles: [{ paint: { 'fill-color': '#ff0000' } }] },
      params_config: [{ key: 'color_a', default: '#ff0000', group: 'legend' }],
      legend_config: { type: 'gradient', items: [{ label: 'A', value: '@@#params.color_a' }] },
    })

    const stops: GradientStop[] = [
      { id: '1', color: '#ff0000', position: 0, dataValue: 0, label: 'A', colorParamKey: 'color_a' },
      { id: '2', color: '#0000ff', position: 1, dataValue: 100, label: 'B' },
    ]

    const result = JSON.parse(serializeGradientToJson(jsonWithoutInterpolate, stops))

    expect(result.legend_config.items).toHaveLength(2)
    expect(result.config.styles[0].paint['fill-color']).toBe('#ff0000')
  })
})
