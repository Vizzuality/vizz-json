import type { LayerSpecification } from 'maplibre-gl'

export const VIZZ_ANCHOR_MARKERS = ['custom-layer', 'label'] as const

/**
 * Find the first layer in a MapLibre style that can serve as an anchor
 * for inserting overlay layers. Prefers a `custom-layer` marker if present,
 * otherwise falls back to the first `label` layer. Returns undefined when
 * neither is found.
 */
export function findAnchorLayerId(
  layers: readonly LayerSpecification[] | undefined,
): string | undefined {
  if (!layers) return undefined
  for (const marker of VIZZ_ANCHOR_MARKERS) {
    const found = layers.find((l) => l.id.includes(marker))
    if (found) return found.id
  }
  return undefined
}
