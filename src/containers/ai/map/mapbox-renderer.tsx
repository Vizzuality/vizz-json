import { useMemo } from 'react'
import { Map, Source, Layer } from 'react-map-gl/mapbox'
import type { SourceProps, LayerProps } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'

const INITIAL_VIEW = { longitude: 0, latitude: 20, zoom: 2 }

type Props = {
  readonly resolvedConfig: Record<string, unknown> | null
  readonly error: string | null
  readonly mapboxToken: string
  readonly mapboxStyleUrl?: string
}

function deriveItemId(
  source: SourceProps | undefined,
  styles: LayerProps[] | undefined,
): string {
  const sourceType = source?.type ?? 'none'
  const styleTypes = styles?.map((s) => s.type).join(',') ?? 'none'
  return `ai--${sourceType}--${styleTypes}`
}

export function MapboxRenderer({
  resolvedConfig,
  error,
  mapboxToken,
  mapboxStyleUrl,
}: Props) {
  const source = resolvedConfig?.source as SourceProps | undefined
  const styles = resolvedConfig?.styles as LayerProps[] | undefined

  const itemId = useMemo(() => deriveItemId(source, styles), [source, styles])

  return (
    <div className="relative h-full w-full">
      <Map
        initialViewState={INITIAL_VIEW}
        style={{ width: '100%', height: '100%' }}
        mapStyle={mapboxStyleUrl ?? 'mapbox://styles/mapbox/light-v11'}
        mapboxAccessToken={mapboxToken}
      >
        {source && styles && (
          <Source {...source} id={`${itemId}-source`}>
            {styles.map((style, i) => (
              <Layer
                {...style}
                key={`${itemId}-layer-${i}`}
                id={`${itemId}-layer-${i}`}
              />
            ))}
          </Source>
        )}
      </Map>
      {error && (
        <div className="absolute left-2 right-2 top-2 rounded bg-destructive/90 px-3 py-2 font-mono text-xs text-destructive-foreground">
          {error}
        </div>
      )}
    </div>
  )
}
