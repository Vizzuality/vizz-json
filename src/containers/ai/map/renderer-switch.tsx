import { MapRenderer } from '#/containers/playground/map-renderer'
import { MapboxRenderer } from './mapbox-renderer'
import type { RendererControls } from '#/lib/ai/types'

type Props = {
  readonly resolvedConfig: Record<string, unknown> | null
  readonly error: string | null
  readonly renderer: RendererControls
}

export function RendererSwitch({ resolvedConfig, error, renderer }: Props) {
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
      />
    )
  }
  return <MapRenderer resolvedConfig={resolvedConfig} error={error} />
}
