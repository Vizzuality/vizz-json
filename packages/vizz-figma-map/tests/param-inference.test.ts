import { describe, it, expect } from 'vitest'
import { inferParamControl } from '../src/ui/lib/param-inference'

describe('inferParamControl', () => {
  it('infers select when options is provided', () => {
    const r = inferParamControl({
      key: 'visibility',
      default: 'visible',
      options: ['visible', 'none'],
    })
    expect(r.control_type).toBe('select')
    expect(r.options).toEqual(['visible', 'none'])
    expect(r.value).toBe('visible')
  })

  it('infers switch for boolean defaults', () => {
    const r = inferParamControl({ key: 'enabled', default: true })
    expect(r.control_type).toBe('switch')
  })

  it('infers slider for numeric defaults', () => {
    const r = inferParamControl({
      key: 'opacity',
      default: 0.7,
      min: 0,
      max: 1,
      step: 0.05,
    })
    expect(r.control_type).toBe('slider')
    expect(r.min).toBe(0)
    expect(r.max).toBe(1)
    expect(r.step).toBe(0.05)
  })

  it('infers color_picker for hex string defaults', () => {
    const r = inferParamControl({ key: 'fill_color', default: '#3b82f6' })
    expect(r.control_type).toBe('color_picker')
  })

  it('infers text_input for non-hex strings', () => {
    const r = inferParamControl({ key: 'label', default: 'hello' })
    expect(r.control_type).toBe('text_input')
  })
})
