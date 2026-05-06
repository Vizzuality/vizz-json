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

  const explicitSourcesArray = fragment.sources as
    | ReadonlyArray<Record<string, unknown>>
    | Record<string, unknown>
    | undefined

  const sources: Record<string, unknown> = (() => {
    if (Array.isArray(explicitSourcesArray)) {
      const out: Record<string, unknown> = {}
      for (const entry of explicitSourcesArray) {
        const { id, ...rest } = entry as { id?: string } & Record<
          string,
          unknown
        >
        if (typeof id !== 'string') continue
        out[id] = rest
      }
      return out
    }
    if (explicitSourcesArray && typeof explicitSourcesArray === 'object') {
      return explicitSourcesArray as Record<string, unknown>
    }
    const explicitSource = fragment.source as
      | Record<string, unknown>
      | undefined
    return explicitSource ? { [SYNTHETIC_SOURCE_KEY]: explicitSource } : {}
  })()

  const sourceKeys = Object.keys(sources)
  const fallbackSourceKey = sourceKeys[0] ?? SYNTHETIC_SOURCE_KEY
  const rawLayers = (fragment.layers ?? fragment.styles) as
    | ReadonlyArray<unknown>
    | undefined

  const layers = (rawLayers ?? []).map((entry, i) => {
    const layer = (entry ?? {}) as Record<string, unknown>
    return {
      id: layer.id ?? `${SYNTHETIC_SOURCE_KEY}_layer_${i}`,
      source: layer.source ?? fallbackSourceKey,
      ...layer,
    }
  })

  return { version: 8, sources, layers }
}

function customSemanticErrors(style: unknown): readonly StyleError[] {
  if (!style || typeof style !== 'object') return []
  const fragment = style as Record<string, unknown>
  const errors: StyleError[] = []

  const sourcesArr = fragment.sources
  if (Array.isArray(sourcesArr)) {
    const seen = new Set<string>()
    for (const entry of sourcesArr) {
      const id = (entry as { id?: unknown }).id
      if (typeof id !== 'string') continue
      if (seen.has(id)) errors.push({ message: `duplicate source id: "${id}"` })
      seen.add(id)
    }
  }

  return errors
}

export function validateStyle(
  style: unknown,
  renderer: RendererId,
): readonly StyleError[] {
  const custom = customSemanticErrors(style)
  const hasDuplicateIds = custom.some((e) =>
    /duplicate source id/i.test(e.message),
  )
  if (hasDuplicateIds) return custom
  const synthetic = buildSyntheticStyle(style)
  const specErrors =
    renderer === 'mapbox'
      ? validateMapbox(synthetic as never)
      : validateStyleMin(synthetic as never)
  const mappedSpec = specErrors.map(
    (e: { message: string; line?: number | null }) => ({
      message: e.message,
      line: e.line ?? undefined,
    }),
  )
  return [...custom, ...mappedSpec]
}
