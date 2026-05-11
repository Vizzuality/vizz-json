import { describe, expect, it } from 'vitest'
import { parsePastedSnapshot } from '#/lib/ai/session/parse-pasted-snapshot'

const VALID_SNAPSHOT = {
  metadata: {
    title: 'Raster Opacity',
    description: 'Simple raster',
    tier: 'basic',
  },
  config: {
    sources: [{ id: 'imagery', type: 'raster' }],
    styles: [
      {
        source: 'imagery',
        type: 'raster',
        paint: { 'raster-opacity': '@@#params.opacity' },
      },
    ],
  },
  params_config: [{ key: 'opacity', default: 0.8, min: 0, max: 1, step: 0.05 }],
}

describe('parsePastedSnapshot', () => {
  it('parses a valid LayerSchema snapshot', () => {
    const out = parsePastedSnapshot(JSON.stringify(VALID_SNAPSHOT))
    expect(out).not.toBeNull()
    expect(out?.metadata.title).toBe('Raster Opacity')
    expect(out?.params_config).toHaveLength(1)
  })

  it('tolerates surrounding whitespace', () => {
    const out = parsePastedSnapshot(`\n  ${JSON.stringify(VALID_SNAPSHOT)}  \n`)
    expect(out).not.toBeNull()
  })

  it('returns null for plain text', () => {
    expect(parsePastedSnapshot('make a heatmap of points')).toBeNull()
  })

  it('returns null for malformed JSON', () => {
    expect(parsePastedSnapshot('{ "metadata": ')).toBeNull()
  })

  it('returns null when metadata is missing', () => {
    const bad = { config: VALID_SNAPSHOT.config, params_config: [] }
    expect(parsePastedSnapshot(JSON.stringify(bad))).toBeNull()
  })

  it('returns null for the raw AI envelope shape (style + parameterize)', () => {
    const envelope = {
      metadata: VALID_SNAPSHOT.metadata,
      style: VALID_SNAPSHOT.config,
      parameterize: [],
    }
    expect(parsePastedSnapshot(JSON.stringify(envelope))).toBeNull()
  })

  it('accepts an optional legend_config', () => {
    const withLegend = {
      ...VALID_SNAPSHOT,
      legend_config: {
        type: 'basic',
        items: [{ label: 'A', value: 1 }],
      },
    }
    const out = parsePastedSnapshot(JSON.stringify(withLegend))
    expect(out?.legend_config?.type).toBe('basic')
  })

  it('returns null for a JSON array', () => {
    expect(parsePastedSnapshot('[1,2,3]')).toBeNull()
  })
})
