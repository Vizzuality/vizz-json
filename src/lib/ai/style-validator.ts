import { validateStyleMin } from '@maplibre/maplibre-gl-style-spec'
import { validate as validateMapbox } from '@mapbox/mapbox-gl-style-spec'
import type { RendererId } from './types'

export type StyleError = { readonly message: string; readonly line?: number }

const SYNTHETIC_SOURCE_KEY = '__vizz_source__'

// VizzJson style fragments use a custom shape ({sources, styles[]}) — not a
// full MapLibre/Mapbox style. Wrap the fragment into a synthetic full style
// so the spec validators can check sources and layers without complaining
// about missing top-level keys. A pre-existing full style ({version, sources,
// layers}) is passed through unchanged.
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
    | undefined

  if (!Array.isArray(explicitSourcesArray)) {
    return { version: 8, sources: {}, layers: [] }
  }

  const sources: Record<string, unknown> = {}
  for (const entry of explicitSourcesArray) {
    const { id, ...rest } = entry as { id?: string } & Record<string, unknown>
    if (typeof id !== 'string') continue
    sources[id] = rest
  }

  const sourceKeys = Object.keys(sources)
  const fallbackSourceKey = sourceKeys[0] ?? SYNTHETIC_SOURCE_KEY
  const rawLayers = fragment.styles as ReadonlyArray<unknown> | undefined

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
  const ids = new Set<string>()
  if (Array.isArray(sourcesArr)) {
    for (const entry of sourcesArr) {
      const id = (entry as { id?: unknown }).id
      if (typeof id !== 'string') continue
      if (ids.has(id)) errors.push({ message: `duplicate source id: "${id}"` })
      ids.add(id)
    }
  }

  const stylesArr = fragment.styles
  if (Array.isArray(stylesArr) && ids.size > 0) {
    for (const entry of stylesArr) {
      const ref = (entry as { source?: unknown }).source
      if (typeof ref !== 'string') continue
      if (!ids.has(ref))
        errors.push({ message: `style references unknown source "${ref}"` })
    }
  }

  return errors
}

function tokenizePath(path: string): readonly (string | number)[] {
  const normalised = path.replace(/\[(\d+)\]/g, '.$1')
  return normalised
    .split('.')
    .filter(Boolean)
    .map((t) => (/^\d+$/.test(t) ? Number(t) : t))
}

export function validateParameterizeTargets(envelope: {
  readonly style: unknown
  readonly parameterize: ReadonlyArray<{ readonly path: string }>
}): readonly StyleError[] {
  const errors: StyleError[] = []
  for (const entry of envelope.parameterize) {
    const tokens = tokenizePath(entry.path)
    if (tokens.length === 0) continue
    let cursor: unknown = envelope.style
    let ok = true
    for (let i = 0; i < tokens.length - 1; i++) {
      const t = tokens[i]
      cursor =
        typeof t === 'number'
          ? Array.isArray(cursor)
            ? cursor[t]
            : undefined
          : cursor && typeof cursor === 'object'
            ? (cursor as Record<string, unknown>)[t]
            : undefined
      if (cursor === undefined || cursor === null) {
        ok = false
        break
      }
    }
    if (!ok || !Array.isArray(cursor)) continue
    const leaf = tokens[tokens.length - 1]
    if (typeof leaf !== 'number') continue
    if (cursor[0] !== 'match') continue
    const N = cursor.length
    if (leaf < 2) {
      errors.push({
        message: `parameterize path "${entry.path}" targets the "match" keyword or its input expression (index ${leaf}); only output slots are parameterizable. Move the entry to a colour slot at an odd index ≥ 3 (or the trailing default at index ${N - 1}).`,
      })
      continue
    }
    if (leaf === N - 1) continue
    if (leaf % 2 === 0) {
      errors.push({
        message: `parameterize path "${entry.path}" targets a "match" label (index ${leaf}, value ${JSON.stringify(cursor[leaf])}) — labels are the literal data values matched against the input and MUST stay as the original strings/numbers. Only output values (odd indices ≥ 3 and the trailing default) can be parameterized. To parameterize the colour for this band, point the path at index ${leaf + 1} instead.`,
      })
    }
  }
  return errors
}

export function validateLegendColors(legend: unknown): readonly StyleError[] {
  if (!legend || typeof legend !== 'object') return []
  const items = (legend as { items?: unknown }).items
  if (!Array.isArray(items)) return []
  const errors: StyleError[] = []
  items.forEach((item, i) => {
    const value = (item as { value?: unknown }).value
    if (typeof value !== 'string') return
    if (/^@@#params\..+/.test(value)) return
    errors.push({
      message: `legend_config.items[${i}].value is a literal value "${value}"; it must be a @@#params.<key> reference so every legend swatch stays editable.`,
    })
  })
  return errors
}

export function validateStyle(
  style: unknown,
  renderer: RendererId,
): readonly StyleError[] {
  const custom = customSemanticErrors(style)
  if (custom.length > 0) return custom
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
