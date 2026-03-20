import { useMemo } from 'react'
import {
  Map,
  Source,
  Layer,
  useControl,
} from 'react-map-gl/maplibre'
import type { SourceProps, LayerProps } from 'react-map-gl/maplibre'
import { MapboxOverlay } from '@deck.gl/mapbox'
import type { MapboxOverlayProps } from '@deck.gl/mapbox'
import { LegendPanel } from './legend-panel'
import type { LegendConfig } from '#/lib/types'
import 'maplibre-gl/dist/maplibre-gl.css'

const SOURCE_ID = 'playground-source'
const BASEMAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty'
const INITIAL_VIEW = { longitude: 0, latitude: 20, zoom: 2 }

/**
 * Derive a stable key that changes only when the source identity changes
 * (type, url, tiles) — forcing React to remount the Source component.
 */
function useSourceKey(source: SourceProps | undefined): string {
  return useMemo(() => {
    if (!source) return ''
    const s = source as Record<string, unknown>
    return [s.type, s.url, s.tiles, s.data ? 'data' : '']
      .filter(Boolean)
      .join('|')
  }, [source])
}

function DeckGlOverlay(props: MapboxOverlayProps) {
  const overlay = useControl(
    () => new MapboxOverlay({ ...props, interleaved: true }),
  )
  overlay.setProps({ ...props, interleaved: true })
  return null
}

type MapRendererProps = {
  readonly resolvedConfig: Record<string, unknown> | null
  readonly error: string | null
  readonly legendConfig: LegendConfig | null
}

export function MapRenderer({
  resolvedConfig,
  error,
  legendConfig,
}: MapRendererProps) {
  const source = resolvedConfig?.source as SourceProps | undefined
  const styles = resolvedConfig?.styles as LayerProps[] | undefined
  const sourceKey = useSourceKey(source)

  return (
    <div className="h-full w-full relative">
      <Map
        initialViewState={INITIAL_VIEW}
        style={{ width: '100%', height: '100%' }}
        mapStyle={BASEMAP_STYLE}
      >
        <DeckGlOverlay layers={[]} />
        {source && styles && (
          <Source key={sourceKey} {...source} id={SOURCE_ID}>
            {styles.map((style, i) => (
              <Layer
                {...style}
                key={`${SOURCE_ID}-${i}`}
                id={`${SOURCE_ID}-${i}`}
              />
            ))}
          </Source>
        )}
      </Map>
      <LegendPanel config={legendConfig} />
      {error && (
        <div className="absolute top-2 left-2 right-2 bg-destructive/90 text-destructive-foreground px-3 py-2 rounded text-xs font-mono">
          {error}
        </div>
      )}
    </div>
  )
}
