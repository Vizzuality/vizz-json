import { describe, it, expect } from 'vitest'
import { normaliseTileJsonUrl } from '#/lib/ai/tools/fetch-tilejson'

describe('normaliseTileJsonUrl', () => {
  it('rewrites mapbox:// IDs to the v4 TileJSON endpoint', () => {
    const url = normaliseTileJsonUrl(
      'mapbox://mapbox.mapbox-streets-v8',
      'tok_abc',
    )
    expect(url).toBe(
      'https://api.mapbox.com/v4/mapbox.mapbox-streets-v8.json?secure&access_token=tok_abc',
    )
  })

  it('passes https URLs through unchanged', () => {
    const url = normaliseTileJsonUrl(
      'https://example.com/tiles.json',
      'tok_abc',
    )
    expect(url).toBe('https://example.com/tiles.json')
  })

  it('returns null when mapbox:// is supplied without a token', () => {
    expect(normaliseTileJsonUrl('mapbox://x.y', undefined)).toBeNull()
  })

  it('rejects unsupported schemes', () => {
    expect(normaliseTileJsonUrl('pmtiles://foo', 'tok_abc')).toBeNull()
    expect(
      normaliseTileJsonUrl('http://insecure.example/tiles.json', 'tok_abc'),
    ).toBeNull()
  })

  it('rejects malformed mapbox:// IDs', () => {
    expect(normaliseTileJsonUrl('mapbox://no-dot', 'tok_abc')).toBeNull()
  })
})
