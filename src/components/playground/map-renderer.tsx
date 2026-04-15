import { Map } from 'react-map-gl/maplibre'
import type { SourceProps, LayerProps } from 'react-map-gl/maplibre'
import { LayerManager } from '@vizzuality/vizz-map'
import type { LayerItem } from '@vizzuality/vizz-map'
import 'maplibre-gl/dist/maplibre-gl.css'

const BASEMAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty'
const INITIAL_VIEW = { longitude: 0, latitude: 20, zoom: 2 }
const PLAYGROUND_ITEM_ID = 'playground'

type MapRendererProps = {
  readonly resolvedConfig: Record<string, unknown> | null
  readonly error: string | null
}

export function MapRenderer({ resolvedConfig, error }: MapRendererProps) {
  const source = resolvedConfig?.source as SourceProps | undefined
  const styles = resolvedConfig?.styles as LayerProps[] | undefined

  const items: LayerItem[] =
    source && styles ? [{ id: PLAYGROUND_ITEM_ID, source, styles }] : []

  return (
    <div className="h-full w-full relative">
      <Map
        initialViewState={INITIAL_VIEW}
        style={{ width: '100%', height: '100%' }}
        mapStyle={BASEMAP_STYLE}
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
