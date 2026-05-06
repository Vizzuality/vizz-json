import { useMemo } from 'react'
import { Map } from 'react-map-gl/maplibre'
import type { SourceProps, LayerProps } from 'react-map-gl/maplibre'
import { LayerManager } from '@vizzuality/vizz-map'
import type { LayerItem } from '@vizzuality/vizz-map'
import { buildLayerItems } from '#/lib/converter'
import type { SourceConfig, StyleConfig } from '#/lib/types'
import 'maplibre-gl/dist/maplibre-gl.css'

const BASEMAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty'
const INITIAL_VIEW = { longitude: 0, latitude: 20, zoom: 2 }
const PLAYGROUND_ITEM_BASE_ID = 'playground'

const EMPTY_SOURCES: readonly SourceConfig[] = []
const EMPTY_STYLES: readonly StyleConfig[] = []

type MapRendererProps = {
  readonly resolvedConfig: Record<string, unknown> | null
  readonly error: string | null
}

export function MapRenderer({ resolvedConfig, error }: MapRendererProps) {
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
