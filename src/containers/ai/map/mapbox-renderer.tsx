import { useEffect, useMemo, useRef } from 'react'
import { Map, Source, Layer } from 'react-map-gl/mapbox'
import type {
  MapRef,
  SourceProps,
  LayerProps,
  ViewStateChangeEvent,
} from 'react-map-gl/mapbox'
import { buildLayerItems } from '#/lib/converter'
import type { SourceConfig, StyleConfig } from '#/lib/types'
import 'mapbox-gl/dist/mapbox-gl.css'

const DEFAULT_INITIAL_VIEW = { longitude: 0, latitude: 20, zoom: 2 }

const EMPTY_SOURCES: readonly SourceConfig[] = []
const EMPTY_STYLES: readonly StyleConfig[] = []

type Props = {
  readonly resolvedConfig: Record<string, unknown> | null
  readonly error: string | null
  readonly mapboxToken: string
  readonly mapboxStyleUrl?: string
  readonly initialView?: { longitude: number; latitude: number; zoom: number }
  readonly onMove?: (e: ViewStateChangeEvent) => void
}

export function MapboxRenderer({
  resolvedConfig,
  error,
  mapboxToken,
  mapboxStyleUrl,
  initialView = DEFAULT_INITIAL_VIEW,
  onMove,
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

  const mapRef = useRef<MapRef | null>(null)
  const { longitude, latitude, zoom } = initialView
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const current = map.getCenter()
    if (
      current.lng === longitude &&
      current.lat === latitude &&
      map.getZoom() === zoom
    )
      return
    map.jumpTo({ center: [longitude, latitude], zoom })
  }, [longitude, latitude, zoom])

  return (
    <div className="relative h-full w-full">
      <Map
        ref={mapRef}
        id="playground-map"
        initialViewState={initialView}
        style={{ width: '100%', height: '100%' }}
        mapStyle={mapboxStyleUrl ?? 'mapbox://styles/mapbox/light-v11'}
        mapboxAccessToken={mapboxToken}
        projection={{ name: 'mercator' }}
        preserveDrawingBuffer={true}
        onMove={onMove}
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
