import { validateStyleMin } from '@maplibre/maplibre-gl-style-spec'
import { validate as validateMapbox } from '@mapbox/mapbox-gl-style-spec'
import type { RendererId } from './types'

export type StyleError = { readonly message: string; readonly line?: number }

const SYNTHETIC_SOURCE_KEY = '__vizz_source__'

// VizzJson style fragments use a custom shape ({source, styles[]} or
// {sources, layers[]}) — not a full MapLibre/Mapbox style. Wrap the fragment
// into a synthetic full style so the spec validators can check sources and
// layers without complaining about missing top-level keys.
function buildSyntheticStyle(style: unknown): Record<string, unknown> {
  if (!style || typeof style !== 'object') {
    return { version: 8, sources: {}, layers: [] }
  }
  const fragment = style as Record<string, unknown>

  if (fragment.version && fragment.sources && fragment.layers) {
    return fragment
  }

  const explicitSources = fragment.sources as
    | Record<string, unknown>
    | undefined
  const explicitSource = fragment.source as Record<string, unknown> | undefined
  const sources: Record<string, unknown> = explicitSources
    ? explicitSources
    : explicitSource
      ? { [SYNTHETIC_SOURCE_KEY]: explicitSource }
      : {}

  const sourceKey = Object.keys(sources)[0] ?? SYNTHETIC_SOURCE_KEY
  const rawLayers = (fragment.layers ?? fragment.styles) as
    | ReadonlyArray<unknown>
    | undefined

  const layers = (rawLayers ?? []).map((entry, i) => {
    const layer = (entry ?? {}) as Record<string, unknown>
    return {
      id: layer.id ?? `${SYNTHETIC_SOURCE_KEY}_layer_${i}`,
      source: layer.source ?? sourceKey,
      ...layer,
    }
  })

  return { version: 8, sources, layers }
}

export function validateStyle(
  style: unknown,
  renderer: RendererId,
): readonly StyleError[] {
  const synthetic = buildSyntheticStyle(style)
  const errors =
    renderer === 'mapbox'
      ? validateMapbox(synthetic as never)
      : validateStyleMin(synthetic as never)
  return errors.map((e: { message: string; line?: number | null }) => ({
    message: e.message,
    line: e.line ?? undefined,
  }))
}
