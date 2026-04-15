import { useMemo } from 'react'
import { Layer } from 'react-map-gl/maplibre'
import type { SourceProps, LayerProps } from 'react-map-gl/maplibre'
import { useAnchorLayerId } from './use-anchor-layer-id'
import { LayerManagerItem } from './layer-manager-item'

export interface LayerItem {
  readonly id: string
  readonly source: SourceProps
  readonly styles: readonly LayerProps[]
}

export interface LayerManagerProps {
  readonly items: readonly LayerItem[]
}

/**
 * Stacks vizz-json items below the first label (or `custom-layer`) layer
 * found in the current MapLibre style. Uses transparent-background
 * placeholder layers chained by `beforeId` so ordering survives layer
 * add/remove cycles — see react-map-gl issue #939.
 */
export function LayerManager({ items }: LayerManagerProps) {
  const anchor = useAnchorLayerId()
  const stacked = useMemo(() => [...items].reverse(), [items])

  if (stacked.length === 0) return null

  return (
    <>
      {stacked.map((it, i, arr) => (
        <Layer
          key={`${it.id}-placeholder`}
          id={`${it.id}-layer`}
          type="background"
          layout={{ visibility: 'none' }}
          beforeId={i === 0 ? anchor : `${arr[i - 1].id}-layer`}
        />
      ))}
      {stacked.map((it, i, arr) => (
        <LayerManagerItem
          key={it.id}
          id={it.id}
          source={it.source}
          styles={it.styles}
          beforeId={i === 0 ? anchor : `${arr[i - 1].id}-layer`}
        />
      ))}
    </>
  )
}
