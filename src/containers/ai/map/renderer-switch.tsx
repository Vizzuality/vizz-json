import type { ViewStateChangeEvent as MaplibreEvent } from 'react-map-gl/maplibre'
import type { ViewStateChangeEvent as MapboxEvent } from 'react-map-gl/mapbox'
import { MapRenderer } from '#/containers/playground/map-renderer'
import { MapboxRenderer } from './mapbox-renderer'
import type { MapView, RendererControls } from '#/lib/ai/types'
import { DEFAULT_MAP_VIEW, basemapStyleUrl } from '#/lib/ai/types'

type Props = {
  readonly resolvedConfig: Record<string, unknown> | null
  readonly error: string | null
  readonly renderer: RendererControls
  readonly onViewChange?: (view: MapView) => void
}

export function RendererSwitch({
  resolvedConfig,
  error,
  renderer,
  onViewChange,
}: Props) {
  const initialView = renderer.mapView ?? DEFAULT_MAP_VIEW

  const handleMove = (e: MaplibreEvent | MapboxEvent) => {
    if (!onViewChange) return
    const { longitude, latitude, zoom } = e.viewState
    onViewChange({ longitude, latitude, zoom })
  }

  if (renderer.renderer === 'mapbox') {
    if (!renderer.mapboxToken) {
      return (
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          Add a Mapbox token to render.
        </div>
      )
    }
    return (
      <MapboxRenderer
        resolvedConfig={resolvedConfig}
        error={error}
        mapboxToken={renderer.mapboxToken}
        mapboxStyleUrl={renderer.mapboxStyleUrl}
        initialView={initialView}
        onMove={handleMove}
      />
    )
  }
  return (
    <MapRenderer
      resolvedConfig={resolvedConfig}
      error={error}
      initialView={initialView}
      basemapStyle={basemapStyleUrl(renderer.basemap)}
      onMove={handleMove}
    />
  )
}
