import { describe, it, expect } from 'vitest'
import { registeredFunctions } from '#/lib/converter/functions'

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
