const MAPBOX_ID_RE = /^mapbox:\/\/([a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+)$/

export function normaliseTileJsonUrl(
  rawUrl: string,
  mapboxToken: string | undefined,
): string | null {
  const mapboxMatch = MAPBOX_ID_RE.exec(rawUrl)
  if (mapboxMatch) {
    if (!mapboxToken) return null
    const id = mapboxMatch[1]
    return `https://api.mapbox.com/v4/${id}.json?secure&access_token=${mapboxToken}`
  }
  if (rawUrl.startsWith('https://')) return rawUrl
  return null
}

const FETCH_TIMEOUT_MS = 5000

export type FetchTileJsonArgs = { readonly url: string }

export type FetchTileJsonContext = {
  readonly mapboxToken: string | undefined
}

export type TileJsonResult =
  | Record<string, unknown>
  | { readonly error: string }

export async function fetchTileJsonHandler(
  args: FetchTileJsonArgs,
  ctx: FetchTileJsonContext,
): Promise<TileJsonResult> {
  const isMapboxScheme = args.url.startsWith('mapbox://')
  const isHttps = args.url.startsWith('https://')

  if (isMapboxScheme && !ctx.mapboxToken) {
    return {
      error:
        'A Mapbox access token is required to look up mapbox:// tilesets. Ask the user to provide one.',
    }
  }

  const target = normaliseTileJsonUrl(args.url, ctx.mapboxToken)
  if (!target) {
    return {
      error:
        isMapboxScheme || isHttps
          ? 'Malformed tile source URL.'
          : 'Unsupported tile source URL. Provide an https TileJSON URL or a mapbox:// tileset id.',
    }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const response = await fetch(target, { signal: controller.signal })
    if (!response.ok) {
      return { error: `Tile source request failed: HTTP ${response.status}` }
    }
    try {
      return (await response.json()) as Record<string, unknown>
    } catch (err) {
      return {
        error: `Tile source response was not JSON: ${err instanceof Error ? err.message : String(err)}`,
      }
    }
  } catch (err) {
    return {
      error: `Tile source request failed: ${err instanceof Error ? err.message : String(err)}`,
    }
  } finally {
    clearTimeout(timer)
  }
}
