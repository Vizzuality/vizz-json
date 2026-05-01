import { describe, it, expect } from 'vitest'
import { aiGenerateInputSchema } from '#/lib/ai/input-schema'

const userMessage = (text: string) => ({
  id: 'm1',
  role: 'user' as const,
  parts: [{ type: 'text' as const, content: text }],
})

describe('aiGenerateInputSchema', () => {
  it('accepts a maplibre body without mapbox fields', () => {
    const ok = aiGenerateInputSchema.safeParse({
      messages: [userMessage('show me a raster')],
      renderer: 'maplibre',
    })
    expect(ok.success).toBe(true)
  })

  it('accepts a mapbox body with token and style URL', () => {
    const ok = aiGenerateInputSchema.safeParse({
      messages: [userMessage('use mapbox')],
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
