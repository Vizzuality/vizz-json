import { describe, it, expect } from 'vitest'
import { walk } from '#/lib/validator/walker'

describe('walk', () => {
  it('resolves a simple object key', () => {
    const input = { color: '#ff0000' }
    const result = walk(input, 'color')
    expect(result).toEqual([{ value: '#ff0000', path: 'color' }])
  })

  it('resolves a nested key', () => {
    const input = { paint: { 'fill-color': '#aabbcc' } }
    const result = walk(input, 'paint.fill-color')
    // hyphenated keys are plain object keys — walk treats dot as separator
    expect(result).toEqual([{ value: '#aabbcc', path: 'paint.fill-color' }])
  })

  it('resolves a numeric array index', () => {
    const input = { stops: ['a', 'b', 'c'] }
    const result = walk(input, 'stops[1]')
    expect(result).toEqual([{ value: 'b', path: 'stops[1]' }])
  })

  it('resolves wildcard [*] over all array elements', () => {
    const input = { stops: ['red', 'green', 'blue'] }
    const result = walk(input, 'stops[*]')
    expect(result).toEqual([
      { value: 'red', path: 'stops[0]' },
      { value: 'green', path: 'stops[1]' },
      { value: 'blue', path: 'stops[2]' },
    ])
  })

  it('resolves chained wildcard with index: stops[*][1]', () => {
    const input = {
      stops: [
        ['v0', '#aaa'],
        ['v1', '#bbb'],
      ],
    }
    const result = walk(input, 'stops[*][1]')
    expect(result).toEqual([
      { value: '#aaa', path: 'stops[0][1]' },
      { value: '#bbb', path: 'stops[1][1]' },
    ])
  })

  it('returns empty array when key is missing', () => {
    const input = { other: 'value' }
    const result = walk(input, 'missing')
    expect(result).toEqual([])
  })

  it('returns empty array when array index is out of bounds', () => {
    const input = { arr: ['a', 'b'] }
    const result = walk(input, 'arr[5]')
    expect(result).toEqual([])
  })

  it('returns empty array when non-array is wildcard-walked', () => {
    const input = { x: 'not-an-array' }
    const result = walk(input, 'x[*]')
    expect(result).toEqual([])
  })

  it('handles deeply chained paths: a.b[*][0]', () => {
    const input = {
      a: {
        b: [
          [1, 2],
          [3, 4],
        ],
      },
    }
    const result = walk(input, 'a.b[*][0]')
    expect(result).toEqual([
      { value: 1, path: 'a.b[0][0]' },
      { value: 3, path: 'a.b[1][0]' },
    ])
  })

  it('accepts null/undefined input gracefully — returns empty', () => {
    expect(walk(null, 'foo')).toEqual([])
    expect(walk(undefined, 'foo')).toEqual([])
  })
})
