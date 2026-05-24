import { useEffect, useMemo, useRef } from 'react'
import { Map } from 'react-map-gl/maplibre'
import type {
  MapRef,
  SourceProps,
  LayerProps,
  ViewStateChangeEvent,
} from 'react-map-gl/maplibre'
import { LayerManager } from '@vizzuality/vizz-map'
import type { LayerItem } from '@vizzuality/vizz-map'
import { buildLayerItems } from '#/lib/converter'
import type { SourceConfig, StyleConfig } from '#/lib/types'
import 'maplibre-gl/dist/maplibre-gl.css'

const DEFAULT_BASEMAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty'
const DEFAULT_INITIAL_VIEW = { longitude: 0, latitude: 20, zoom: 2 }
const PLAYGROUND_ITEM_BASE_ID = 'playground'

const EMPTY_SOURCES: readonly SourceConfig[] = []
const EMPTY_STYLES: readonly StyleConfig[] = []

type MapRendererProps = {
  readonly resolvedConfig: Record<string, unknown> | null
  readonly error: string | null
  readonly initialView?: { longitude: number; latitude: number; zoom: number }
  readonly basemapStyle?: string
  readonly onMove?: (e: ViewStateChangeEvent) => void
}

export function MapRenderer({
  resolvedConfig,
  error,
  initialView = DEFAULT_INITIAL_VIEW,
  basemapStyle = DEFAULT_BASEMAP_STYLE,
  onMove,
}: MapRendererProps) {
  const sources =
    (resolvedConfig?.sources as readonly SourceConfig[] | undefined) ??
    EMPTY_SOURCES
  const styles =
    (resolvedConfig?.styles as readonly StyleConfig[] | undefined) ??
    EMPTY_STYLES

  const items = useMemo<LayerItem[]>(() => {
    const built = buildLayerItems({ sources, styles })
    return built.map((b) => ({
      id: `${PLAYGROUND_ITEM_BASE_ID}--${b.id}`,
      source: b.source as unknown as SourceProps,
      styles: b.styles as unknown as LayerProps[],
    }))
  }, [sources, styles])

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
    <div className="h-full w-full relative">
      <Map
        ref={mapRef}
        id="playground-map"
        initialViewState={initialView}
        style={{ width: '100%', height: '100%' }}
        mapStyle={basemapStyle}
        canvasContextAttributes={{ preserveDrawingBuffer: true }}
        onMove={onMove}
      >
        <LayerManager items={items} />
      </Map>
      {error && (
        <div className="absolute top-2 left-2 right-2 bg-destructive/90 text-destructive-foreground px-3 py-2 rounded text-xs font-mono">
          {error}
        </div>
      )}
    </div>
  )
}
