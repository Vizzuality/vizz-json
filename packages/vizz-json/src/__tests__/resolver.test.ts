import { describe, it, expect } from 'vitest'
import { createVizzJson } from '../index'

describe('resolver — recursive walker', () => {
  const vizzJson = createVizzJson({})

  it('passes through primitives unchanged', () => {
    expect(vizzJson.resolve({ a: 1, b: 'hello', c: true, d: null })).toEqual({
      a: 1,
      b: 'hello',
      c: true,
      d: null,
    })
  })

  it('recurses into nested objects', () => {
    const input = { outer: { inner: { value: 42 } } }
    expect(vizzJson.resolve(input)).toEqual({ outer: { inner: { value: 42 } } })
  })

  it('recurses into arrays', () => {
    const input = { items: [1, 'two', { nested: true }] }
    expect(vizzJson.resolve(input)).toEqual({
      items: [1, 'two', { nested: true }],
    })
  })

  it('does not mutate the input', () => {
    const input = { a: { b: 1 } }
    const result = vizzJson.resolve(input)
    expect(result).not.toBe(input)
    expect(result.a).not.toBe(input.a)
  })

  it('handles empty objects and arrays', () => {
    expect(vizzJson.resolve({})).toEqual({})
    expect(vizzJson.resolve({ arr: [], obj: {} })).toEqual({ arr: [], obj: {} })
  })
})
