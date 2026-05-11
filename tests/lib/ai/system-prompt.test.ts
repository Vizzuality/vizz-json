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

  it('inlines current user param values when supplied', () => {
    const prompts = buildSystemPrompts({
      renderer: 'maplibre',
      paramValues: { color_a: '#abcdef', opacity: 0.42 },
    })
    const joined = prompts.join('\n')
    expect(joined).toMatch(/#abcdef/)
    expect(joined).toMatch(/0\.42/)
  })

  it('omits the param-values addendum when none are supplied', () => {
    const prompts = buildSystemPrompts({ renderer: 'maplibre' })
    expect(prompts.join('\n')).not.toMatch(/Current user parameter values/)
  })

  it('omits the param-values addendum for an empty object', () => {
    const prompts = buildSystemPrompts({
      renderer: 'maplibre',
      paramValues: {},
    })
    expect(prompts.join('\n')).not.toMatch(/Current user parameter values/)
  })
})
