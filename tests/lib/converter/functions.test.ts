import { describe, it, expect, expectTypeOf } from 'vitest'
import { registeredFunctions, getFunctionMeta } from '#/lib/converter/functions'
import type { ParamConfig } from '#/lib/types'

describe('setQueryParams', () => {
  const fn = registeredFunctions.setQueryParams

  it('appends query params to a URL', () => {
    const result = fn({
      url: 'https://example.com/tiles',
      query: { colormap: 'viridis', rescale: '0,100' },
    })
    expect(result).toContain('https://example.com/tiles?')
    expect(result).toContain('colormap=viridis')
    expect(result).toContain('rescale=0%2C100')
  })

  it('serializes object values as JSON', () => {
    const result = fn({
      url: 'https://example.com',
      query: { colormap: { '11': '#7acaff', '17': '#000dff' } },
    })
    const url = new URL(result as string)
    const colormap = url.searchParams.get('colormap')
    expect(JSON.parse(colormap!)).toEqual({ '11': '#7acaff', '17': '#000dff' })
  })
})

describe('ifParam', () => {
  const fn = registeredFunctions.ifParam

  it("returns 'then' when condition is truthy", () => {
    expect(fn({ condition: true, then: 'visible', else: 'none' })).toBe(
      'visible',
    )
  })

  it("returns 'else' when condition is falsy", () => {
    expect(fn({ condition: false, then: 'visible', else: 'none' })).toBe('none')
  })

  it("returns 'else' when condition is 0", () => {
    expect(fn({ condition: 0, then: 'yes', else: 'no' })).toBe('no')
  })
})

describe('buildColormap', () => {
  const fn = registeredFunctions.buildColormap

  it('produces interval colormap from two stops', () => {
    const result = fn({
      stops: [
        [0, '#000000'],
        [100, '#ffffff'],
      ],
    }) as unknown[][]

    expect(result.length).toBeGreaterThan(0)
    expect(result[0][1]).toEqual([0, 0, 0, 255])
  })

  it('sorts stops by data value', () => {
    const result = fn({
      stops: [
        [100, '#ffffff'],
        [0, '#000000'],
      ],
    }) as unknown[][]

    expect(result[0][1]).toEqual([0, 0, 0, 255])
  })

  it('returns empty array for empty stops', () => {
    expect(fn({ stops: [] })).toEqual([])
  })
})

// ── ParamConfig.source type-level tests ────────────────────────────

describe('ParamConfig.source', () => {
  it('has an optional source field typed as string | undefined', () => {
    expectTypeOf<ParamConfig>().toHaveProperty('source')
    expectTypeOf<ParamConfig['source']>().toEqualTypeOf<string | undefined>()
  })

  it('accepts a ParamConfig without source', () => {
    const p: ParamConfig = { key: 'opacity', default: 0.8 }
    expect(p.source).toBeUndefined()
  })

  it('accepts a ParamConfig with source', () => {
    const p: ParamConfig = { key: 'opacity', default: 0.8, source: 'layer-1' }
    expect(p.source).toBe('layer-1')
  })
})

// ── getFunctionMeta ────────────────────────────────────────────────

describe('getFunctionMeta', () => {
  it('returns colorArgPaths for buildColormap', () => {
    expect(getFunctionMeta('buildColormap')).toEqual({
      colorArgPaths: ['stops[*][1]'],
    })
  })

  it('returns undefined for setQueryParams (no meta registered)', () => {
    expect(getFunctionMeta('setQueryParams')).toBeUndefined()
  })

  it('returns undefined for an unknown function name', () => {
    expect(getFunctionMeta('nonExistentFn')).toBeUndefined()
  })

  it('registered functions without meta are still callable', () => {
    const fn = registeredFunctions.ifParam
    expect(fn({ condition: true, then: 'a', else: 'b' })).toBe('a')
    expect(getFunctionMeta('ifParam')).toBeUndefined()
  })
})
