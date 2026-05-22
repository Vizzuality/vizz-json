import { describe, it, expect } from 'vitest'
import { aiOutputSchema, aiResponseSchema } from '#/lib/ai/output-schema'

describe('aiOutputSchema', () => {
  it('accepts a minimal valid envelope', () => {
    const ok = aiOutputSchema.safeParse({
      metadata: { title: 't', description: 'd', tier: 'basic' },
      style: {
        sources: [{ id: 'main', type: 'raster', tiles: ['x'], tileSize: 256 }],
        styles: [{ source: 'main', type: 'raster' }],
      },
      parameterize: [],
    })
    expect(ok.success).toBe(true)
  })

  it('accepts a parameterize entry with min/max/step', () => {
    const ok = aiOutputSchema.safeParse({
      metadata: { title: 't', description: 'd', tier: 'basic' },
      style: {
        sources: [{ id: 'main', type: 'raster' }],
        styles: [{ source: 'main', type: 'fill' }],
      },
      parameterize: [
        {
          path: 'styles[0].paint.raster-opacity',
          key: 'opacity',
          default: 0.8,
          min: 0,
          max: 1,
          step: 0.05,
        },
      ],
    })
    expect(ok.success).toBe(true)
  })

  it('rejects a parameterize entry with options that is not a string array', () => {
    const bad = aiOutputSchema.safeParse({
      metadata: { title: 't', description: 'd', tier: 'basic' },
      style: {
        sources: [{ id: 'main', type: 'raster' }],
        styles: [{ source: 'main', type: 'fill' }],
      },
      parameterize: [{ path: 'x', key: 'k', default: 'v', options: [1, 2] }],
    })
    expect(bad.success).toBe(false)
  })

  it('rejects metadata.tier outside basic|intermediate|advanced', () => {
    const bad = aiOutputSchema.safeParse({
      metadata: { title: 't', description: 'd', tier: 'expert' },
      style: {
        sources: [{ id: 'main', type: 'raster' }],
        styles: [{ source: 'main', type: 'fill' }],
      },
      parameterize: [],
    })
    expect(bad.success).toBe(false)
  })

  it('rejects a style with an empty styles array', () => {
    const bad = aiOutputSchema.safeParse({
      metadata: { title: 't', description: 'd', tier: 'basic' },
      style: { sources: [{ id: 'main', type: 'raster' }], styles: [] },
      parameterize: [],
    })
    expect(bad.success).toBe(false)
  })

  it('rejects a style missing the sources field', () => {
    const bad = aiOutputSchema.safeParse({
      metadata: { title: 't', description: 'd', tier: 'basic' },
      style: { styles: [{ source: 'main', type: 'fill' }] },
      parameterize: [],
    })
    expect(bad.success).toBe(false)
  })

  it('rejects styles array entries missing the source field', () => {
    const bad = aiOutputSchema.safeParse({
      metadata: { title: 't', description: 'd', tier: 'basic' },
      style: { sources: [{ id: 'a' }], styles: [{ type: 'fill' }] },
      parameterize: [],
    })
    expect(bad.success).toBe(false)
  })

  // Per-source legend: legend_config belongs on sources[*], not at envelope root
  it('accepts legend_config nested inside a source object', () => {
    const ok = aiOutputSchema.safeParse({
      metadata: { title: 't', description: 'd', tier: 'basic' },
      style: {
        sources: [
          {
            id: 'main',
            type: 'raster',
            legend_config: {
              type: 'basic',
              items: [{ label: 'L', value: '@@#params.color_a' }],
            },
          },
        ],
        styles: [{ source: 'main', type: 'fill' }],
      },
      parameterize: [],
    })
    expect(ok.success).toBe(true)
  })

  // The aiOutputSchema uses z.object() without .strict() at the envelope level,
  // so an unknown top-level legend_config is silently stripped by zod rather than
  // rejected. The practical equivalent: the parsed output has no legend_config key.
  it('top-level legend_config is silently stripped (not present in parsed output)', () => {
    const input = {
      metadata: { title: 't', description: 'd', tier: 'basic' },
      style: {
        sources: [{ id: 'main', type: 'raster' }],
        styles: [{ source: 'main', type: 'fill' }],
      },
      parameterize: [],
      legend_config: {
        type: 'basic',
        items: [{ label: 'L', value: 'V' }],
      },
    }
    const result = aiOutputSchema.safeParse(input)
    expect(result.success).toBe(true)
    if (result.success) {
      // The stripped key must not appear in the parsed data
      expect(result.data).not.toHaveProperty('legend_config')
    }
  })

  it('legend_config without a source binding is dropped from the schema output', () => {
    // This is the key behavioral assertion: top-level legend_config has no home
    // in the new per-source model and is discarded by schema parsing.
    const result = aiOutputSchema.safeParse({
      metadata: { title: 't', description: 'd', tier: 'basic' },
      style: {
        sources: [{ id: 's', type: 'geojson' }],
        styles: [{ source: 's', type: 'fill' }],
      },
      parameterize: [],
      legend_config: { type: 'choropleth', items: [] },
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(Object.keys(result.data)).not.toContain('legend_config')
    }
  })
})

describe('aiResponseSchema', () => {
  it('accepts a reply-only response without an envelope', () => {
    const ok = aiResponseSchema.safeParse({ reply: 'I need a Mapbox token.' })
    expect(ok.success).toBe(true)
  })

  it('accepts a reply with a full envelope', () => {
    const ok = aiResponseSchema.safeParse({
      reply: 'Here you go.',
      envelope: {
        metadata: { title: 't', description: 'd', tier: 'basic' },
        style: {
          sources: [{ id: 'main', type: 'raster' }],
          styles: [{ source: 'main', type: 'fill' }],
        },
        parameterize: [],
      },
    })
    expect(ok.success).toBe(true)
  })

  it('accepts envelope with per-source legend_config', () => {
    const ok = aiResponseSchema.safeParse({
      reply: 'Here you go.',
      envelope: {
        metadata: { title: 't', description: 'd', tier: 'basic' },
        style: {
          sources: [
            {
              id: 'main',
              type: 'geojson',
              legend_config: {
                type: 'choropleth',
                items: [{ label: 'High', value: '@@#params.high_color' }],
              },
            },
          ],
          styles: [{ source: 'main', type: 'fill' }],
        },
        parameterize: [
          {
            path: 'styles[0].paint.fill-color',
            key: 'high_color',
            default: '#ff0000',
            group: 'legend',
          },
        ],
      },
    })
    expect(ok.success).toBe(true)
  })
})
