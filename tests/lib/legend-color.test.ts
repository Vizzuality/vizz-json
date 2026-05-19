import { describe, it, expect } from 'vitest'
import { isValidCssColor, resolveItemColor } from '#/lib/legend-color'

describe('isValidCssColor', () => {
  describe('accepts valid hex colors', () => {
    it('accepts 3-char hex', () => expect(isValidCssColor('#f00')).toBe(true))
    it('accepts 6-char hex', () =>
      expect(isValidCssColor('#ff0000')).toBe(true))
    it('accepts 4-char hex with alpha', () =>
      expect(isValidCssColor('#f00f')).toBe(true))
    it('accepts 8-char hex with alpha', () =>
      expect(isValidCssColor('#ff0000ff')).toBe(true))
    it('accepts uppercase hex', () =>
      expect(isValidCssColor('#FF0000')).toBe(true))
  })

  describe('accepts functional color notations', () => {
    it('accepts rgb()', () =>
      expect(isValidCssColor('rgb(255, 0, 0)')).toBe(true))
    it('accepts rgba()', () =>
      expect(isValidCssColor('rgba(255, 0, 0, 0.5)')).toBe(true))
    it('accepts hsl()', () =>
      expect(isValidCssColor('hsl(120, 100%, 50%)')).toBe(true))
    it('accepts hsla()', () =>
      expect(isValidCssColor('hsla(120, 100%, 50%, 0.3)')).toBe(true))
    it('accepts oklch()', () =>
      expect(isValidCssColor('oklch(0.7 0.15 30)')).toBe(true))
    it('accepts oklab()', () =>
      expect(isValidCssColor('oklab(0.5 0.1 -0.1)')).toBe(true))
    it('accepts lab()', () =>
      expect(isValidCssColor('lab(50% 40 -20)')).toBe(true))
    it('accepts lch()', () =>
      expect(isValidCssColor('lch(50% 30 120)')).toBe(true))
    it('accepts color()', () =>
      expect(isValidCssColor('color(display-p3 1 0 0)')).toBe(true))
  })

  describe('accepts named colors and keywords', () => {
    it('accepts transparent', () =>
      expect(isValidCssColor('transparent')).toBe(true))
    it('accepts currentColor', () =>
      expect(isValidCssColor('currentColor')).toBe(true))
    it('accepts black', () => expect(isValidCssColor('black')).toBe(true))
    it('accepts white', () => expect(isValidCssColor('white')).toBe(true))
    it('accepts red', () => expect(isValidCssColor('red')).toBe(true))
    it('accepts green', () => expect(isValidCssColor('green')).toBe(true))
    it('accepts blue', () => expect(isValidCssColor('blue')).toBe(true))
    it('accepts gray', () => expect(isValidCssColor('gray')).toBe(true))
    it('accepts none', () => expect(isValidCssColor('none')).toBe(true))
  })

  describe('rejects non-color values', () => {
    it('rejects @@ param ref', () =>
      expect(isValidCssColor('@@#params.heatmap_color_low')).toBe(false))
    it('rejects any @@ prefix', () =>
      expect(isValidCssColor('@@#params.x')).toBe(false))
    it('rejects empty string', () => expect(isValidCssColor('')).toBe(false))
    it('rejects undefined', () =>
      expect(isValidCssColor(undefined)).toBe(false))
    it('rejects null', () => expect(isValidCssColor(null)).toBe(false))
    it('rejects number', () => expect(isValidCssColor(42)).toBe(false))
    it('rejects plain word that is not a color keyword', () =>
      expect(isValidCssColor('heatmap_color_low')).toBe(false))
    it('rejects JS expression prefix', () =>
      expect(isValidCssColor('@@=[1,2,3]')).toBe(false))
  })
})

describe('resolveItemColor', () => {
  it('returns mapping-resolved value when valueParamKey present and value is string', () => {
    const result = resolveItemColor(
      { value: '@@#params.heatmap_color_low' },
      { valueParamKey: 'heatmap_color_low' },
      { heatmap_color_low: '#2c7bb6' },
    )
    expect(result).toBe('#2c7bb6')
  })

  it('returns item.value when it is a valid CSS color and no mapping', () => {
    const result = resolveItemColor({ value: '#ff0000' }, undefined, undefined)
    expect(result).toBe('#ff0000')
  })

  it('returns item.value when valid CSS color and mapping has no valueParamKey', () => {
    const result = resolveItemColor(
      { value: '#dbeafe' },
      { labelParamKey: 'some_label' },
      { some_label: 'hello' },
    )
    expect(result).toBe('#dbeafe')
  })

  it('returns transparent when item.value is @@ ref and no mapping', () => {
    const result = resolveItemColor(
      { value: '@@#params.heatmap_color_low' },
      undefined,
      undefined,
    )
    expect(result).toBe('transparent')
  })

  it('returns transparent when item.value is @@ ref and mapping has no valueParamKey', () => {
    const result = resolveItemColor(
      { value: '@@#params.heatmap_color_low' },
      { labelParamKey: 'label_key' },
      { label_key: 'hello' },
    )
    expect(result).toBe('transparent')
  })

  it('returns transparent when item.value is @@ ref and values is undefined', () => {
    const result = resolveItemColor(
      { value: '@@#params.heatmap_color_low' },
      { valueParamKey: 'heatmap_color_low' },
      undefined,
    )
    expect(result).toBe('transparent')
  })

  it('returns transparent when valueParamKey present but resolved value is not a string', () => {
    const result = resolveItemColor(
      { value: '@@#params.some_param' },
      { valueParamKey: 'some_param' },
      { some_param: 42 },
    )
    expect(result).toBe('transparent')
  })

  it('returns transparent for garbage string input', () => {
    const result = resolveItemColor(
      { value: 'not_a_color' },
      undefined,
      undefined,
    )
    expect(result).toBe('transparent')
  })

  it('returns transparent when item.value is a number and no mapping', () => {
    const result = resolveItemColor({ value: 0 }, undefined, undefined)
    expect(result).toBe('transparent')
  })

  it('NEVER returns a raw @@ string', () => {
    const result = resolveItemColor(
      { value: '@@#params.color' },
      { valueParamKey: 'color' },
      { color: '@@#params.other' }, // malformed — resolved value is itself a ref
    )
    // resolved value is itself an @@ ref — must not leak
    expect(result).toBe('transparent')
  })
})
