import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  normaliseTileJsonUrl,
  fetchTileJsonHandler,
} from '#/lib/ai/tools/fetch-tilejson'

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

describe('fetchTileJsonHandler', () => {
  const realFetch = globalThis.fetch
  beforeEach(() => {
    globalThis.fetch = vi.fn() as unknown as typeof fetch
  })
  afterEach(() => {
    globalThis.fetch = realFetch
    vi.restoreAllMocks()
  })

  it('returns the parsed TileJSON for an https URL', async () => {
    const tilejson = {
      tilejson: '3.0.0',
      vector_layers: [{ id: 'building', fields: { height: 'Number' } }],
    }
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(JSON.stringify(tilejson), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    const result = await fetchTileJsonHandler(
      { url: 'https://example.com/tiles.json' },
      { mapboxToken: undefined },
    )
    expect(result).toEqual(tilejson)
  })

  it('normalises mapbox:// using the supplied token', async () => {
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(JSON.stringify({ vector_layers: [] }), { status: 200 }),
    )
    await fetchTileJsonHandler(
      { url: 'mapbox://mapbox.mapbox-streets-v8' },
      { mapboxToken: 'pk_test' },
    )
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.mapbox.com/v4/mapbox.mapbox-streets-v8.json?secure&access_token=pk_test',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    )
  })

  it('returns {error} when mapbox:// is given but no token is configured', async () => {
    const result = await fetchTileJsonHandler(
      { url: 'mapbox://x.y' },
      { mapboxToken: undefined },
    )
    expect(result).toEqual({
      error:
        'A Mapbox access token is required to look up mapbox:// tilesets. Ask the user to provide one.',
    })
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it('returns {error} when the URL scheme is unsupported', async () => {
    const result = await fetchTileJsonHandler(
      { url: 'pmtiles://foo' },
      { mapboxToken: 'pk_test' },
    )
    expect(result).toEqual({
      error:
        'Unsupported tile source URL. Provide an https TileJSON URL or a mapbox:// tileset id.',
    })
  })

  it('returns {error} on non-2xx responses', async () => {
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response('not found', { status: 404 }),
    )
    const result = await fetchTileJsonHandler(
      { url: 'https://example.com/tiles.json' },
      { mapboxToken: undefined },
    )
    expect(result).toEqual({
      error: 'Tile source request failed: HTTP 404',
    })
  })

  it('returns {error} when the response is not JSON', async () => {
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response('<html>nope</html>', { status: 200 }),
    )
    const result = await fetchTileJsonHandler(
      { url: 'https://example.com/tiles.json' },
      { mapboxToken: undefined },
    )
    expect(result).toMatchObject({ error: expect.stringContaining('JSON') })
  })

  it('returns {error} when fetch rejects (timeout/network)', async () => {
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('aborted'),
    )
    const result = await fetchTileJsonHandler(
      { url: 'https://example.com/tiles.json' },
      { mapboxToken: undefined },
    )
    expect(result).toEqual({ error: 'Tile source request failed: aborted' })
  })
})
