import { useMemo } from 'react'
import { Map, Source, Layer } from 'react-map-gl/maplibre'
import type { SourceProps, LayerProps } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'

const SOURCE_ID = 'playground-source'
const BASEMAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty'
const INITIAL_VIEW = { longitude: 0, latitude: 20, zoom: 2 }
const BEFORE_LAYER_ID = 'waterway_line_label'

/**
 * Derive a stable key from the source + style structure so React remounts
 * when the example changes, but keeps the same instance for param tweaks.
 */
function useConfigKey(
  source: SourceProps | undefined,
  styles: LayerProps[] | undefined,
): string {
  return useMemo(() => {
    if (!source) return ''
    const s = source as Record<string, unknown>
    const sourceId = [s.type, s.url, s.tiles, s.data ? 'data' : '']
      .filter(Boolean)
      .join('|')
    const styleId = styles
      ?.map((st) => {
        const paint = (st as Record<string, unknown>).paint as
          | Record<string, unknown>
          | undefined
        return [st.type, paint ? Object.keys(paint).sort().join(',') : ''].join(
          ':',
        )
      })
      .join(';')
    return `${sourceId}~${styleId}`
  }, [source, styles])
}

type MapRendererProps = {
  readonly resolvedConfig: Record<string, unknown> | null
  readonly error: string | null
}

export function MapRenderer({ resolvedConfig, error }: MapRendererProps) {
  const source = resolvedConfig?.source as SourceProps | undefined
  const styles = resolvedConfig?.styles as LayerProps[] | undefined
  const configKey = useConfigKey(source, styles)

  return (
    <div className="h-full w-full relative">
      <Map
        initialViewState={INITIAL_VIEW}
        style={{ width: '100%', height: '100%' }}
        mapStyle={BASEMAP_STYLE}
      >
        {source && styles && (
          <Source key={configKey} {...source} id={SOURCE_ID}>
            {styles.map((style, i) => (
              <Layer
                {...style}
                key={`${SOURCE_ID}-${i}`}
                id={`${SOURCE_ID}-${i}`}
                beforeId={BEFORE_LAYER_ID}
              />
            ))}
          </Source>
        )}
      </Map>
      {error && (
        <div className="absolute top-2 left-2 right-2 bg-destructive/90 text-destructive-foreground px-3 py-2 rounded text-xs font-mono">
          {error}
        </div>
      )}
    </div>
  )
}
