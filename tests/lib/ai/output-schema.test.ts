import { describe, it, expect } from 'vitest'
import { aiOutputSchema, aiResponseSchema } from '#/lib/ai/output-schema'

describe('aiOutputSchema', () => {
  it('accepts a minimal valid envelope', () => {
    const ok = aiOutputSchema.safeParse({
      metadata: { title: 't', description: 'd', tier: 'basic' },
      style: {
        source: { type: 'raster', tiles: ['x'], tileSize: 256 },
        styles: [{ type: 'raster' }],
      },
      parameterize: [],
    })
    expect(ok.success).toBe(true)
  })

  it('accepts a parameterize entry with min/max/step', () => {
    const ok = aiOutputSchema.safeParse({
      metadata: { title: 't', description: 'd', tier: 'basic' },
      style: { source: {}, styles: [{ type: 'fill' }] },
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
      style: { source: {}, styles: [{ type: 'fill' }] },
      parameterize: [{ path: 'x', key: 'k', default: 'v', options: [1, 2] }],
    })
    expect(bad.success).toBe(false)
  })

  it('rejects metadata.tier outside basic|intermediate|advanced', () => {
    const bad = aiOutputSchema.safeParse({
      metadata: { title: 't', description: 'd', tier: 'expert' },
      style: { source: {}, styles: [{ type: 'fill' }] },
      parameterize: [],
    })
    expect(bad.success).toBe(false)
  })

  it('rejects a style with an empty styles array', () => {
    const bad = aiOutputSchema.safeParse({
      metadata: { title: 't', description: 'd', tier: 'basic' },
      style: { source: {}, styles: [] },
      parameterize: [],
    })
    expect(bad.success).toBe(false)
  })

  it('rejects a style missing the source field', () => {
    const bad = aiOutputSchema.safeParse({
      metadata: { title: 't', description: 'd', tier: 'basic' },
      style: { styles: [{ type: 'fill' }] },
      parameterize: [],
    })
    expect(bad.success).toBe(false)
  })

  it('accepts an optional legend_config', () => {
    const ok = aiOutputSchema.safeParse({
      metadata: { title: 't', description: 'd', tier: 'basic' },
      style: { source: {}, styles: [{ type: 'fill' }] },
      parameterize: [],
      legend_config: {
        type: 'basic',
        items: [{ label: 'L', value: 'V' }],
      },
    })
    expect(ok.success).toBe(true)
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
        style: { source: {}, styles: [{ type: 'fill' }] },
        parameterize: [],
      },
    })
    expect(ok.success).toBe(true)
  })
})
