import { describe, it, expect } from 'vitest'
import { mergeParamValues } from '#/lib/pipeline/merge-param-values'
import type { ParamConfig, ResolvedParams } from '#/lib/types'

describe('mergeParamValues', () => {
  it('uses default for new key absent from prior', () => {
    const params: readonly ParamConfig[] = [
      { key: 'color_1', default: '#ff0000' },
    ]
    const prior: ResolvedParams = {}
    expect(mergeParamValues(params, prior)).toEqual({ color_1: '#ff0000' })
  })

  it('preserves existing key value even when different from default', () => {
    const params: readonly ParamConfig[] = [{ key: 'opacity', default: 0.8 }]
    const prior: ResolvedParams = { opacity: 0.3 }
    expect(mergeParamValues(params, prior)).toEqual({ opacity: 0.3 })
  })

  it('drops key from prior that no longer appears in params_config', () => {
    const params: readonly ParamConfig[] = [{ key: 'opacity', default: 0.8 }]
    const prior: ResolvedParams = { opacity: 0.3, old_key: 'gone' }
    expect(mergeParamValues(params, prior)).toEqual({ opacity: 0.3 })
  })

  it('seeds all defaults when prior is empty', () => {
    const params: readonly ParamConfig[] = [
      { key: 'opacity', default: 0.5 },
      { key: 'color_1', default: '#3b82f6' },
      { key: 'enabled', default: true },
    ]
    expect(mergeParamValues(params, {})).toEqual({
      opacity: 0.5,
      color_1: '#3b82f6',
      enabled: true,
    })
  })

  it('returns empty object when params_config is empty', () => {
    const prior: ResolvedParams = { opacity: 0.5 }
    expect(mergeParamValues([], prior)).toEqual({})
  })
})
