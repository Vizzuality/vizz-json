import { Settings } from 'lucide-react'
import { Button } from '#/components/ui/button'
import type { MapView, RendererControls } from '#/lib/ai/types'
import { DEFAULT_BASEMAP, basemapLabel } from '#/lib/ai/types'

type Props = {
  readonly view: MapView
  readonly renderer: RendererControls
  readonly onOpenConfig: () => void
}

function basemapDisplay(renderer: RendererControls): string {
  if (renderer.renderer === 'mapbox') {
    return renderer.mapboxStyleUrl ?? 'mapbox light-v11'
  }
  return basemapLabel(renderer.basemap ?? DEFAULT_BASEMAP)
}

function Property({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col justify-center gap-0">
      <span className="text-xs font-medium text-muted">{label}</span>
      <span className="truncate font-mono text-xs text-foreground">
        {value}
      </span>
    </div>
  )
}

export function MapHeader({ view, renderer, onOpenConfig }: Props) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10">
      <div className="pointer-events-auto flex h-14 items-center gap-4 bg-black/70 px-4 py-3 backdrop-blur-md">
        <div className="flex min-w-0 flex-1 items-center gap-4 pr-4">
          <Property label="Zoom:" value={view.zoom.toFixed(1)} />
          <Property
            label="Center:"
            value={`${view.longitude.toFixed(4)}, ${view.latitude.toFixed(4)}`}
          />
          <Property label="Basemap:" value={basemapDisplay(renderer)} />
        </div>
        <Button
          variant="default"
          size="sm"
          onClick={onOpenConfig}
          className="shrink-0"
        >
          <Settings />
          Config
        </Button>
      </div>
    </div>
  )
}
