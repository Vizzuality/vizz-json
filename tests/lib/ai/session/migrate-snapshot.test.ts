import { describe, expect, it } from 'vitest'
import { migrateLegendShape } from '#/lib/ai/session/migrate-snapshot'
import type { AiSchema } from '#/lib/ai/persistence/types'
import type { LegendConfig } from '#/lib/types'

const LEGEND: LegendConfig = {
  type: 'basic',
  items: [{ label: 'Low', value: 0 }],
}

const BASE_METADATA = {
  title: 'Test',
  description: '',
  tier: 'basic' as const,
}

const BASE_PARAMS: AiSchema['params_config'] = []

function makeSnapshot(
  overrides: Record<string, unknown> = {},
): AiSchema & Record<string, unknown> {
  return {
    metadata: BASE_METADATA,
    config: {},
    params_config: BASE_PARAMS,
    ...overrides,
  } as AiSchema & Record<string, unknown>
}

describe('migrateLegendShape', () => {
  it('moves top-level legend_config into sources[0] when no source has one', () => {
    const source0 = { id: 'src-0', type: 'geojson' }
    const source1 = { id: 'src-1', type: 'geojson' }
    const snapshot = makeSnapshot({
      legend_config: LEGEND,
      config: { sources: [source0, source1] },
    })

    const result = migrateLegendShape(snapshot)

    // Top-level key is gone
    expect('legend_config' in result).toBe(false)

    const sources = result.config.sources as unknown[]
    // First source gains legend_config
    expect((sources[0] as Record<string, unknown>).legend_config).toEqual(
      LEGEND,
    )
    // Second source is untouched
    expect('legend_config' in (sources[1] as object)).toBe(false)
  })

  it('returns snapshot unchanged when sources already have legend_config (no-op)', () => {
    const source0 = { id: 'src-0', legend_config: LEGEND }
    const snapshot = makeSnapshot({
      config: { sources: [source0] },
    })

    const result = migrateLegendShape(snapshot)
    expect(result).toBe(snapshot)
  })

  it('returns snapshot unchanged when there is no legend at all (no-op)', () => {
    const snapshot = makeSnapshot({
      config: { sources: [{ id: 'src-0' }] },
    })

    const result = migrateLegendShape(snapshot)
    expect(result).toBe(snapshot)
  })

  it('is a no-op and drops stale top-level key when top-level legend exists but some source already has one', () => {
    const source0 = { id: 'src-0', legend_config: LEGEND }
    const snapshot = makeSnapshot({
      legend_config: LEGEND,
      config: { sources: [source0] },
    })

    const result = migrateLegendShape(snapshot)

    // Top-level key removed
    expect('legend_config' in result).toBe(false)
    // Per-source legend untouched
    const sources = result.config.sources as unknown[]
    expect((sources[0] as Record<string, unknown>).legend_config).toEqual(
      LEGEND,
    )
  })

  it('returns snapshot unchanged when sources is missing (malformed)', () => {
    const snapshot = makeSnapshot({
      legend_config: LEGEND,
      config: {},
    })

    const result = migrateLegendShape(snapshot)
    expect(result).toBe(snapshot)
  })

  it('returns snapshot unchanged when sources is not an array (malformed)', () => {
    const snapshot = makeSnapshot({
      legend_config: LEGEND,
      config: { sources: 'not-an-array' },
    })

    const result = migrateLegendShape(snapshot)
    expect(result).toBe(snapshot)
  })

  it('returns snapshot unchanged when sources is empty (malformed)', () => {
    const snapshot = makeSnapshot({
      legend_config: LEGEND,
      config: { sources: [] },
    })

    const result = migrateLegendShape(snapshot)
    expect(result).toBe(snapshot)
  })

  it('returns a new object reference (immutability)', () => {
    const source0 = { id: 'src-0' }
    const snapshot = makeSnapshot({
      legend_config: LEGEND,
      config: { sources: [source0] },
    })

    const result = migrateLegendShape(snapshot)

    expect(result).not.toBe(snapshot)
    expect(result.config).not.toBe(snapshot.config)
    // Original snapshot is not mutated
    expect('legend_config' in snapshot).toBe(true)
    expect('legend_config' in (source0 as object)).toBe(false)
  })
})
