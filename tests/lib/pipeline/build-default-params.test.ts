import { describe, it, expect } from 'vitest'
import { buildDefaultParams } from '#/lib/pipeline'
import type { ParamConfig } from '#/lib/types'

describe('buildDefaultParams', () => {
  it('returns empty object for empty input', () => {
    expect(buildDefaultParams([])).toEqual({})
  })

  it('maps single param to its default', () => {
    const params: readonly ParamConfig[] = [{ key: 'opacity', default: 0.8 }]
    expect(buildDefaultParams(params)).toEqual({ opacity: 0.8 })
  })

  it('preserves defaults across multiple params and types', () => {
    const params: readonly ParamConfig[] = [
      { key: 'opacity', default: 0.5 },
      { key: 'enabled', default: true },
      { key: 'color', default: '#3b82f6' },
      { key: 'mode', default: 'auto', options: ['auto', 'manual'] },
    ]
    expect(buildDefaultParams(params)).toEqual({
      opacity: 0.5,
      enabled: true,
      color: '#3b82f6',
      mode: 'auto',
    })
  })

  it('preserves null and object defaults', () => {
    const params: readonly ParamConfig[] = [
      { key: 'value', default: null },
      { key: 'nested', default: { a: 1 } },
    ]
    expect(buildDefaultParams(params)).toEqual({
      value: null,
      nested: { a: 1 },
    })
  })
})
