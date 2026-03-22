import { describe, it, expect } from 'vitest'
import { createSuperJSON } from '../index'

describe('resolver — recursive walker', () => {
  const superJSON = createSuperJSON({})

  it('passes through primitives unchanged', () => {
    expect(superJSON.resolve({ a: 1, b: 'hello', c: true, d: null })).toEqual({
      a: 1,
      b: 'hello',
      c: true,
      d: null,
    })
  })

  it('recurses into nested objects', () => {
    const input = { outer: { inner: { value: 42 } } }
    expect(superJSON.resolve(input)).toEqual({ outer: { inner: { value: 42 } } })
  })

  it('recurses into arrays', () => {
    const input = { items: [1, 'two', { nested: true }] }
    expect(superJSON.resolve(input)).toEqual({ items: [1, 'two', { nested: true }] })
  })

  it('does not mutate the input', () => {
    const input = { a: { b: 1 } }
    const result = superJSON.resolve(input)
    expect(result).not.toBe(input)
    expect(result.a).not.toBe(input.a)
  })

  it('handles empty objects and arrays', () => {
    expect(superJSON.resolve({})).toEqual({})
    expect(superJSON.resolve({ arr: [], obj: {} })).toEqual({ arr: [], obj: {} })
  })
})
