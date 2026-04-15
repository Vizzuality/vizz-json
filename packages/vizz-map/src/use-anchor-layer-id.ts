import { useEffect, useState } from 'react'
import { useMap } from 'react-map-gl/maplibre'
import { findAnchorLayerId } from './utils'

/**
 * Subscribes to the underlying MapLibre style and returns the id of the
 * layer overlays should be inserted before. Re-runs on `styledata` so it
 * survives basemap swaps. Returns undefined when no map is mounted, no
 * style is loaded, or no anchor layer is found.
 */
export function useAnchorLayerId(): string | undefined {
  const { current: map } = useMap()
  const [anchor, setAnchor] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (!map) {
      setAnchor(undefined)
      return
    }
    const update = () => {
      setAnchor(findAnchorLayerId(map.getStyle()?.layers))
    }
    if (map.isStyleLoaded()) update()
    map.on('styledata', update)
    return () => {
      map.off('styledata', update)
    }
  }, [map])

  return anchor
}
