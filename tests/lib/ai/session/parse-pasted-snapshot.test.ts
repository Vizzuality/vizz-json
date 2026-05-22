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

  it('returns null for a JSON array', () => {
    expect(parsePastedSnapshot('[1,2,3]')).toBeNull()
  })

  // Per-source legend: snapshot with config.sources[0].legend_config must parse OK
  it('parses a snapshot with per-source legend_config on sources[0]', () => {
    const withSourceLegend = {
      ...VALID_SNAPSHOT,
      config: {
        ...VALID_SNAPSHOT.config,
        sources: [
          {
            id: 'imagery',
            type: 'raster',
            legend_config: {
              type: 'basic',
              items: [{ label: 'Sentinel-2', value: 'visible' }],
            },
          },
        ],
      },
    }
    const out = parsePastedSnapshot(JSON.stringify(withSourceLegend))
    if (out === null) throw new Error('expected non-null parse result')
    // config is parsed as z.record, so legend_config on source survives
    const sources = out.config.sources
    expect(Array.isArray(sources)).toBe(true)
    const src = (sources as Array<Record<string, unknown>>)[0]
    expect(src.legend_config).toBeDefined()
  })

  // Top-level legend_config in the snapshot schema: snapshotSchema uses z.record for
  // the config field, so extra keys there are accepted. Top-level legend_config on the
  // snapshot object itself is an unknown key — snapshotSchema does not define it, so
  // zod strips it. The resulting AiSchema has no legend_config at the top level.
  it('top-level legend_config on the snapshot is silently stripped (not in parsed AiSchema)', () => {
    const withTopLevelLegend = {
      ...VALID_SNAPSHOT,
      legend_config: {
        type: 'basic',
        items: [{ label: 'A', value: 'visible' }],
      },
    }
    const out = parsePastedSnapshot(JSON.stringify(withTopLevelLegend))
    // Still parses (snapshotSchema strips unknown keys)
    expect(out).not.toBeNull()
    // But the top-level legend_config must not be present in the AiSchema
    expect(out).not.toHaveProperty('legend_config')
  })
})
