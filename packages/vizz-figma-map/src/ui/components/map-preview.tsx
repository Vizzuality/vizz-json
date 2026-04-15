import { forwardRef, useImperativeHandle, useRef } from 'react'
import { Map } from 'react-map-gl/maplibre'
import type { MapRef, SourceProps, LayerProps } from 'react-map-gl/maplibre'
import type { Map as MaplibreMap } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { LayerManager } from '@vizzuality/vizz-map'
import type { LayerItem } from '@vizzuality/vizz-map'

export interface ResolvedVizzConfig {
  source: Record<string, unknown>
  styles: Array<Record<string, unknown>>
}

export interface MapPreviewHandle {
  getMap: () => MaplibreMap | null
  getContainer: () => HTMLDivElement | null
}

export interface MapPreviewProps {
  basemapStyleUrl: string
  resolved: ResolvedVizzConfig
  initialCenter?: [number, number]
  initialZoom?: number
}

const ITEM_ID = 'vizz'

export const MapPreview = forwardRef<MapPreviewHandle, MapPreviewProps>(
  function MapPreview(
    { basemapStyleUrl, resolved, initialCenter = [0, 20], initialZoom = 1 },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const mapRef = useRef<MapRef | null>(null)

    useImperativeHandle(ref, () => ({
      getMap: () => mapRef.current?.getMap() ?? null,
      getContainer: () => containerRef.current,
    }))

    const items: LayerItem[] = [
      {
        id: ITEM_ID,
        source: resolved.source as SourceProps,
        styles: resolved.styles as LayerProps[],
      },
    ]

    return (
      <div ref={containerRef} className="w-full h-full">
        <Map
          ref={mapRef}
          mapStyle={basemapStyleUrl}
          style={{ width: '100%', height: '100%' }}
          initialViewState={{
            longitude: initialCenter[0],
            latitude: initialCenter[1],
            zoom: initialZoom,
          }}
          canvasContextAttributes={{ preserveDrawingBuffer: true }}
          attributionControl={false}
        >
          <LayerManager items={items} />
        </Map>
      </div>
    )
  },
)
