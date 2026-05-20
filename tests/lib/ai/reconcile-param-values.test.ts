import { describe, expect, it } from 'vitest'
import { reconcileSnapshot } from '#/lib/ai/reconcile-param-values'
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

function defaults(s: AiSchema): Record<string, unknown> {
  return Object.fromEntries(s.params_config.map((p) => [p.key, p.default]))
}

describe('reconcileSnapshot', () => {
  it('returns next as-is when prev is null', () => {
    const next = schema([
      { key: 'opacity', default: 0.5 },
      { key: 'color_a', default: '#ff0000' },
    ])
    expect(defaults(reconcileSnapshot(null, next))).toEqual({
      opacity: 0.5,
      color_a: '#ff0000',
    })
  })

  it('preserves prior colour default when next.default matches prev.default', () => {
    const prev = schema([{ key: 'color_a', default: '#00ff00' }])
    const next = schema([{ key: 'color_a', default: '#00ff00' }])
    expect(defaults(reconcileSnapshot(prev, next))).toEqual({
      color_a: '#00ff00',
    })
  })

  it('takes the AI-emitted colour default when it differs from prev', () => {
    const prev = schema([{ key: 'color_a', default: '#00ff00' }])
    const next = schema([{ key: 'color_a', default: '#0000ff' }])
    expect(defaults(reconcileSnapshot(prev, next))).toEqual({
      color_a: '#0000ff',
    })
  })

  it('preserves non-colour prev default even when AI changed it', () => {
    const prev = schema([{ key: 'opacity', default: 0.25 }])
    const next = schema([{ key: 'opacity', default: 0.9 }])
    expect(defaults(reconcileSnapshot(prev, next))).toEqual({ opacity: 0.25 })
  })

  it('keeps next default for keys absent in prev', () => {
    const prev = schema([{ key: 'opacity', default: 0.25 }])
    const next = schema([
      { key: 'opacity', default: 0.5 },
      { key: 'radius', default: 12 },
    ])
    expect(defaults(reconcileSnapshot(prev, next))).toEqual({
      opacity: 0.25,
      radius: 12,
    })
  })

  it('drops keys removed in next', () => {
    const prev = schema([
      { key: 'opacity', default: 0.25 },
      { key: 'radius', default: 20 },
    ])
    const next = schema([{ key: 'opacity', default: 0.5 }])
    expect(defaults(reconcileSnapshot(prev, next))).toEqual({ opacity: 0.25 })
  })
})
