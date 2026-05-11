import { describe, expect, it } from 'vitest'
import { reconcileParamValues } from '#/lib/ai/reconcile-param-values'
import type { AiSchema } from '#/lib/ai/persistence/types'

function schema(
  params: ReadonlyArray<{ key: string; default: unknown }>,
): AiSchema {
  return {
    metadata: {
      title: 't',
      description: 'd',
      tier: 'basic',
    },
    config: {},
    params_config: params,
  }
}

describe('reconcileParamValues', () => {
  it('seeds all keys from next defaults on first reply', () => {
    const next = schema([
      { key: 'opacity', default: 0.5 },
      { key: 'color_a', default: '#ff0000' },
    ])
    const result = reconcileParamValues(null, next, {})
    expect(result).toEqual({ opacity: 0.5, color_a: '#ff0000' })
  })

  it('preserves user edit for colour key when prev/next defaults match', () => {
    const prev = schema([{ key: 'color_a', default: '#ff0000' }])
    const next = schema([{ key: 'color_a', default: '#ff0000' }])
    const result = reconcileParamValues(prev, next, { color_a: '#00ff00' })
    expect(result).toEqual({ color_a: '#00ff00' })
  })

  it('overwrites user edit when colour key default changed between replies', () => {
    const prev = schema([{ key: 'color_a', default: '#ff0000' }])
    const next = schema([{ key: 'color_a', default: '#0000ff' }])
    const result = reconcileParamValues(prev, next, { color_a: '#00ff00' })
    expect(result).toEqual({ color_a: '#0000ff' })
  })

  it('preserves user edit for non-colour key even when default changed', () => {
    const prev = schema([{ key: 'opacity', default: 0.5 }])
    const next = schema([{ key: 'opacity', default: 0.9 }])
    const result = reconcileParamValues(prev, next, { opacity: 0.25 })
    expect(result).toEqual({ opacity: 0.25 })
  })

  it('seeds key from next default when absent from current values', () => {
    const prev = schema([{ key: 'opacity', default: 0.5 }])
    const next = schema([
      { key: 'opacity', default: 0.5 },
      { key: 'radius', default: 12 },
    ])
    const result = reconcileParamValues(prev, next, { opacity: 0.25 })
    expect(result).toEqual({ opacity: 0.25, radius: 12 })
  })

  it('drops keys absent from next snapshot', () => {
    const prev = schema([
      { key: 'opacity', default: 0.5 },
      { key: 'radius', default: 12 },
    ])
    const next = schema([{ key: 'opacity', default: 0.5 }])
    const result = reconcileParamValues(prev, next, {
      opacity: 0.25,
      radius: 20,
    })
    expect(result).toEqual({ opacity: 0.25 })
  })
})
