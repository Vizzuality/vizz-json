import { describe, it, expect } from 'vitest'
import { createVizzJson } from '../index'
import { getNestedValue } from '../resolver'
import { Render } from '../react'

// ── Prototype path segment guards ─────────────────────────────────────────────

describe('security — getNestedValue rejects reserved path segments', () => {
  it('throws for __proto__ at root of path', () => {
    expect(() => getNestedValue({}, '__proto__.polluted')).toThrow(
      'Forbidden path segment',
    )
  })

  it('throws for constructor in path', () => {
    expect(() => getNestedValue({}, 'foo.constructor.prototype')).toThrow(
      'Forbidden path segment',
    )
  })

  it('throws for prototype in path', () => {
    expect(() => getNestedValue({ foo: {} }, 'foo.prototype.bar')).toThrow(
      'Forbidden path segment',
    )
  })

  it('still resolves normal nested paths', () => {
    const obj = { a: { b: { c: 42 } } }
    expect(getNestedValue(obj, 'a.b.c')).toBe(42)
  })
})

describe('security — @@= expression accessor rejects reserved path segments', () => {
  const vizzJson = createVizzJson({})

  it('throws when accessor is called with __proto__ in path', () => {
    const result = vizzJson.resolve({ val: '@@=__proto__.polluted' })
    const accessor = result.val as (d: Record<string, unknown>) => unknown
    expect(() => accessor({ foo: 'bar' })).toThrow('Forbidden path segment')
  })

  it('throws when accessor is called with constructor in path', () => {
    const result = vizzJson.resolve({ val: '@@=a.constructor.prototype' })
    const accessor = result.val as (d: Record<string, unknown>) => unknown
    expect(() => accessor({ a: {} })).toThrow('Forbidden path segment')
  })

  it('still resolves legitimate accessor paths', () => {
    const result = vizzJson.resolve({ getPos: '@@=geometry.coordinates' })
    const accessor = result.getPos as (d: Record<string, unknown>) => unknown
    expect(accessor({ geometry: { coordinates: [1, 2] } })).toEqual([1, 2])
  })
})

describe('security — @@# constant handler rejects reserved path segments', () => {
  const vizzJson = createVizzJson({
    enumerations: { GL: { POINTS: 0 } },
  })

  it('throws "Forbidden path segment" for __proto__ namespace (not "Unknown constant")', () => {
    expect(() => vizzJson.resolve({ val: '@@#__proto__.polluted' })).toThrow(
      'Forbidden path segment',
    )
  })

  it('throws "Forbidden path segment" for constructor key', () => {
    expect(() => vizzJson.resolve({ val: '@@#GL.constructor' })).toThrow(
      'Forbidden path segment',
    )
  })

  it('throws "Forbidden path segment" for prototype namespace', () => {
    expect(() => vizzJson.resolve({ val: '@@#prototype.foo' })).toThrow(
      'Forbidden path segment',
    )
  })

  it('still resolves legitimate constants', () => {
    expect(vizzJson.resolve({ val: '@@#GL.POINTS' })).toEqual({ val: 0 })
  })
})

// ── React Render guard ────────────────────────────────────────────────────────

describe('security — Render component rejects non-function $$component', () => {
  it('throws controlled error when $$component is a number', () => {
    expect(() => Render({ value: { $$component: 42, props: {} } })).toThrow(
      '[vizz-json] $$component must be a function',
    )
  })

  it('throws controlled error when $$component is a string', () => {
    expect(() =>
      Render({ value: { $$component: 'not-a-fn', props: {} } }),
    ).toThrow('[vizz-json] $$component must be a function')
  })

  it('throws controlled error when $$component is null', () => {
    expect(() => Render({ value: { $$component: null, props: {} } })).toThrow(
      '[vizz-json] $$component must be a function',
    )
  })
})
