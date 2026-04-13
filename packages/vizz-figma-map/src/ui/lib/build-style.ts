import type { StyleSpecification } from 'maplibre-gl'

export interface ResolvedVizzConfig {
  source: Record<string, unknown>
  styles: Array<Record<string, unknown>>
}

const VIZZ_SOURCE_ID = 'vizz-data'

export function buildStyle(
  basemap: StyleSpecification | Record<string, unknown>,
  resolved: ResolvedVizzConfig,
): StyleSpecification {
  const base = structuredClone(basemap) as StyleSpecification
  const sources = {
    ...base.sources,
    [VIZZ_SOURCE_ID]: resolved.source as never,
  }

  const injectedLayers = resolved.styles.map((layer, index) => {
    const id =
      typeof layer.id === 'string' && layer.id.length > 0
        ? layer.id
        : `vizz-layer-${index}`
    return {
      ...layer,
      id,
      source: VIZZ_SOURCE_ID,
    }
  }) as unknown as StyleSpecification['layers']

  return {
    ...base,
    sources,
    layers: [...base.layers, ...injectedLayers],
  }
}
