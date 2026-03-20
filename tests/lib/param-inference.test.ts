import { describe, it, expect } from 'vitest'
import { inferParamControl } from '#/lib/param-inference'

describe('inferParamControl', () => {
  it('infers slider for number defaults', () => {
    const result = inferParamControl({ key: 'opacity', default: 0.8 })
    expect(result.control_type).toBe('slider')
    expect(result.value).toBe(0.8)
  })

  it('infers color_picker for hex color strings', () => {
    const result = inferParamControl({ key: 'fill_color', default: '#3b82f6' })
    expect(result.control_type).toBe('color_picker')
  })

  it('infers switch for boolean defaults', () => {
    const result = inferParamControl({ key: 'visibility', default: true })
    expect(result.control_type).toBe('switch')
  })

  it('infers text_input for plain strings', () => {
    const result = inferParamControl({
      key: 'data_url',
      default: 'https://example.com',
    })
    expect(result.control_type).toBe('text_input')
  })

  it('infers select when options are provided', () => {
    const result = inferParamControl({
      key: 'colormap',
      default: 'viridis',
      options: ['viridis', 'plasma', 'inferno'],
    })
    expect(result.control_type).toBe('select')
    expect(result.options).toEqual(['viridis', 'plasma', 'inferno'])
  })

  it('infers json_editor for object defaults', () => {
    const result = inferParamControl({
      key: 'colormap',
      default: { '11': '#7acaff' },
    })
    expect(result.control_type).toBe('json_editor')
  })

  it('preserves min/max/step for numbers', () => {
    const result = inferParamControl({
      key: 'opacity',
      default: 0.8,
      min: 0,
      max: 1,
      step: 0.1,
    })
    expect(result.min).toBe(0)
    expect(result.max).toBe(1)
    expect(result.step).toBe(0.1)
  })

  it('infers color_picker for 3-digit hex', () => {
    const result = inferParamControl({ key: 'color', default: '#fff' })
    expect(result.control_type).toBe('color_picker')
  })

  it('propagates group field from ParamConfig', () => {
    const result = inferParamControl({
      key: 'fill_color',
      default: '#3b82f6',
      group: 'legend',
    })
    expect(result.group).toBe('legend')
  })

  it('leaves group undefined when not set', () => {
    const result = inferParamControl({ key: 'opacity', default: 0.8 })
    expect(result.group).toBeUndefined()
  })
})
