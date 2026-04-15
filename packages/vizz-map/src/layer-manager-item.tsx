import { Source, Layer } from 'react-map-gl/maplibre'
import type { SourceProps, LayerProps } from 'react-map-gl/maplibre'

export interface LayerManagerItemProps {
  readonly id: string
  readonly source: SourceProps
  readonly styles: readonly LayerProps[]
  readonly beforeId?: string
}

/**
 * Renders a single vizz-json item as a react-map-gl Source with one Layer
 * per style, all inserted above `beforeId`. The id is the stable handle
 * callers use to identify this item in the stack.
 */
export function LayerManagerItem({
  id,
  source,
  styles,
  beforeId,
}: LayerManagerItemProps) {
  return (
    <Source {...source} id={`${id}-source`}>
      {styles.map((style, i) => (
        <Layer
          {...style}
          key={`${id}-layer-${i}`}
          id={`${id}-layer-${i}`}
          beforeId={beforeId}
        />
      ))}
    </Source>
  )
}
