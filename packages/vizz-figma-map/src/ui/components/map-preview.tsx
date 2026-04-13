import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import maplibregl, { type Map as MaplibreMap } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { buildStyle, type ResolvedVizzConfig } from '../lib/build-style'

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

export const MapPreview = forwardRef<MapPreviewHandle, MapPreviewProps>(
  function MapPreview(
    { basemapStyleUrl, resolved, initialCenter = [0, 20], initialZoom = 1 },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const mapRef = useRef<MaplibreMap | null>(null)

    useImperativeHandle(ref, () => ({
      getMap: () => mapRef.current,
      getContainer: () => containerRef.current,
    }))

    // Initialize map once.
    useEffect(() => {
      if (!containerRef.current || mapRef.current) return
      const map = new maplibregl.Map({
        container: containerRef.current,
        style: basemapStyleUrl,
        center: initialCenter,
        zoom: initialZoom,
        canvasContextAttributes: { preserveDrawingBuffer: true },
        attributionControl: false,
      })
      mapRef.current = map
      return () => {
        map.remove()
        mapRef.current = null
      }
      // Intentionally init-only: basemap/view changes are handled below.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Apply basemap + resolved config whenever either changes.
    useEffect(() => {
      const map = mapRef.current
      if (!map) return

      let cancelled = false

      const applyStyle = async () => {
        // Fetch the basemap style JSON so we can compose with vizz data in one go.
        // MapLibre also accepts a URL directly, but setStyle(url) replaces the entire
        // style asynchronously, which loses our injected source/layers. Fetching
        // gives us a single composed style object.
        const response = await fetch(basemapStyleUrl)
        if (!response.ok) {
          throw new Error(`Failed to fetch basemap: ${response.status}`)
        }
        const basemap = await response.json()
        if (cancelled) return

        const next = buildStyle(basemap, resolved)
        const center = map.getCenter()
        const zoom = map.getZoom()
        map.setStyle(next)
        map.jumpTo({ center, zoom })
      }

      applyStyle().catch((err) => {
        // Surface as a console error — the parent App can wire a proper error UI later.
        console.error('[vizz-figma-map] style apply failed:', err)
      })

      return () => {
        cancelled = true
      }
    }, [basemapStyleUrl, resolved])

    return <div ref={containerRef} className="w-full h-full" />
  },
)
