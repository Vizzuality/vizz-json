import { describe, it, expect } from 'vitest'
import { mergeParamDefaults } from '#/lib/ai/merge-param-defaults'
import type { AiSchema } from '#/lib/ai/persistence/types'

const baseSnapshot: AiSchema = {
  metadata: { title: 't', description: 'd', tier: 'basic' },
  config: { layers: [{ id: 'a' }] },
  params_config: [
    { key: 'opacity', default: 1 },
    { key: 'color', default: '#ff0000' },
  ],
  legend_config: {
    type: 'basic',
    items: [{ label: 'x', value: '@@#params.color' }],
  },
}

describe('mergeParamDefaults', () => {
  it('swaps default when key is in paramValues', () => {
    const out = mergeParamDefaults(baseSnapshot, { opacity: 0.3 })
    expect(out.params_config[0]).toEqual({ key: 'opacity', default: 0.3 })
  })

  it('preserves authored default when key missing from paramValues', () => {
    const out = mergeParamDefaults(baseSnapshot, { opacity: 0.3 })
    expect(out.params_config[1]).toEqual({ key: 'color', default: '#ff0000' })
  })

  it('ignores paramValues keys not in params_config', () => {
    const out = mergeParamDefaults(baseSnapshot, { ghost: 42 })
    expect(out.params_config).toEqual(baseSnapshot.params_config)
  })

  it('empty paramValues returns structurally identical snapshot', () => {
    const out = mergeParamDefaults(baseSnapshot, {})
    expect(out).toEqual(baseSnapshot)
  })

  it('does not mutate the input snapshot', () => {
    const snapshot: AiSchema = {
      ...baseSnapshot,
      params_config: baseSnapshot.params_config.map((p) => ({ ...p })),
    }
    const frozen = JSON.parse(JSON.stringify(snapshot))
    mergeParamDefaults(snapshot, { opacity: 0.3 })
    expect(snapshot).toEqual(frozen)
  })

  it('preserves default when paramValues[key] is explicitly undefined', () => {
    const out = mergeParamDefaults(baseSnapshot, { opacity: undefined })
    expect(out.params_config[0]).toEqual({ key: 'opacity', default: 1 })
  })

  it('handles empty params_config without error', () => {
    const empty: AiSchema = { ...baseSnapshot, params_config: [] }
    const out = mergeParamDefaults(empty, { opacity: 0.3 })
    expect(out.params_config).toEqual([])
  })

  it('leaves legend_config and config tree untouched', () => {
    const out = mergeParamDefaults(baseSnapshot, {
      opacity: 0.3,
      color: '#00ff00',
    })
    expect(out.legend_config).toEqual(baseSnapshot.legend_config)
    expect(out.config).toEqual(baseSnapshot.config)
  })
})
