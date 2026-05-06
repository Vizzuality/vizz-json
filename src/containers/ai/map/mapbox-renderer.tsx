import { useMemo } from 'react'
import { Map, Source, Layer } from 'react-map-gl/mapbox'
import type { SourceProps, LayerProps } from 'react-map-gl/mapbox'
import { buildLayerItems } from '#/lib/converter'
import type { SourceConfig, StyleConfig } from '#/lib/types'
import 'mapbox-gl/dist/mapbox-gl.css'

const INITIAL_VIEW = { longitude: 0, latitude: 20, zoom: 2 }

const EMPTY_SOURCES: readonly SourceConfig[] = []
const EMPTY_STYLES: readonly StyleConfig[] = []

type Props = {
  readonly resolvedConfig: Record<string, unknown> | null
  readonly error: string | null
  readonly mapboxToken: string
  readonly mapboxStyleUrl?: string
}

export function MapboxRenderer({
  resolvedConfig,
  error,
  mapboxToken,
  mapboxStyleUrl,
}: Props) {
  const sources =
    (resolvedConfig?.sources as readonly SourceConfig[] | undefined) ??
    EMPTY_SOURCES
  const styles =
    (resolvedConfig?.styles as readonly StyleConfig[] | undefined) ??
    EMPTY_STYLES

  const items = useMemo(
    () => buildLayerItems({ sources, styles }),
    [sources, styles],
  )

  return (
    <div className="relative h-full w-full">
      <Map
        initialViewState={INITIAL_VIEW}
        style={{ width: '100%', height: '100%' }}
        mapStyle={mapboxStyleUrl ?? 'mapbox://styles/mapbox/light-v11'}
        mapboxAccessToken={mapboxToken}
        projection={{ name: 'mercator' }}
      >
        {items.map((item) => {
          const { id: _omitId, ...sourceProps } = item.source as Record<
            string,
            unknown
          >
          return (
            <Source
              {...(sourceProps as unknown as SourceProps)}
              key={`ai--${item.id}`}
              id={`ai--${item.id}-source`}
            >
              {item.styles.map((style, i) => {
                const { source: _omitSrc, ...layerProps } = style as Record<
                  string,
                  unknown
                >
                return (
                  <Layer
                    {...(layerProps as unknown as LayerProps)}
                    key={`ai--${item.id}-layer-${i}`}
                    id={`ai--${item.id}-layer-${i}`}
                  />
                )
              })}
            </Source>
          )
        })}
      </Map>
      {error && (
        <div className="absolute left-2 right-2 top-2 rounded bg-destructive/90 px-3 py-2 font-mono text-xs text-destructive-foreground">
          {error}
        </div>
      )}
    </div>
  )
}
