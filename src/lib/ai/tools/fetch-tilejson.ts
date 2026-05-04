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
