import { describe, it, expect } from 'vitest'
import { aiGenerateInputSchema } from '#/lib/ai/input-schema'

describe('aiGenerateInputSchema', () => {
  it('accepts a maplibre body without mapbox fields', () => {
    const ok = aiGenerateInputSchema.safeParse({
      messages: [{ role: 'user', content: 'show me a raster' }],
      renderer: 'maplibre',
    })
    expect(ok.success).toBe(true)
  })

  it('accepts a mapbox body with token and style URL', () => {
    const ok = aiGenerateInputSchema.safeParse({
      messages: [{ role: 'user', content: 'use mapbox' }],
      renderer: 'mapbox',
      mapboxToken: 'pk.x',
      mapboxStyleUrl: 'mapbox://styles/x/y',
    })
    expect(ok.success).toBe(true)
  })

  it('rejects an empty messages array', () => {
    const bad = aiGenerateInputSchema.safeParse({
      messages: [],
      renderer: 'maplibre',
    })
    expect(bad.success).toBe(false)
  })
})
