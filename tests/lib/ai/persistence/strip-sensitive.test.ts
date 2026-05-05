import { describe, expect, it } from 'vitest'
import { stripSensitive } from '#/lib/ai/persistence/strip-sensitive'
import type { Chat } from '#/lib/ai/persistence/types'

const baseChat = (): Chat => ({
  id: 'c1',
  title: 't',
  createdAt: 0,
  updatedAt: 0,
  schemaVersion: 1,
  renderer: {
    renderer: 'mapbox',
    mapboxToken: 'pk.secret',
    mapboxStyleUrl: 'mapbox://styles/x/y',
  },
  activeParamValues: {},
  activeMessageId: null,
})

describe('stripSensitive', () => {
  it('removes mapboxToken but keeps everything else', () => {
    const out = stripSensitive(baseChat())
    expect(out.renderer.mapboxToken).toBeUndefined()
    expect(out.renderer.mapboxStyleUrl).toBe('mapbox://styles/x/y')
    expect(out.renderer.renderer).toBe('mapbox')
  })

  it('does not mutate input', () => {
    const c = baseChat()
    stripSensitive(c)
    expect(c.renderer.mapboxToken).toBe('pk.secret')
  })
})
