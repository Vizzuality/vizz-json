import { describe, it, expect } from 'vitest'
import { buildSystemPrompts } from '#/lib/ai/system-prompt'

describe('buildSystemPrompts', () => {
  it('returns at least the static prompt', () => {
    const prompts = buildSystemPrompts({ renderer: 'maplibre' })
    expect(prompts.length).toBeGreaterThanOrEqual(2)
    expect(prompts[0]).toMatch(/VizzJson/i)
  })

  it('mentions MapLibre when renderer is maplibre', () => {
    const prompts = buildSystemPrompts({ renderer: 'maplibre' })
    expect(prompts.join('\n')).toMatch(/MapLibre/)
  })

  it('mentions Mapbox style URL when renderer is mapbox with a style URL', () => {
    const prompts = buildSystemPrompts({
      renderer: 'mapbox',
      mapboxStyleUrl: 'mapbox://styles/x/y',
    })
    expect(prompts.join('\n')).toMatch(/mapbox:\/\/styles\/x\/y/)
  })

  it('never includes the Mapbox token', () => {
    const prompts = buildSystemPrompts({
      renderer: 'mapbox',
      mapboxToken: 'pk.SECRET',
      mapboxStyleUrl: 'mapbox://styles/x/y',
    })
    expect(prompts.join('\n')).not.toMatch(/pk\.SECRET/)
  })
})
