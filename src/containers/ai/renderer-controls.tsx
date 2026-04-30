import { Input } from '#/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import type { RendererControls as RendererControlsValue } from '#/lib/ai/types'

type Props = {
  readonly value: RendererControlsValue
  readonly onChange: (next: RendererControlsValue) => void
}

export function RendererControls({ value, onChange }: Props) {
  const showMapbox = value.renderer === 'mapbox'
  return (
    <div className="grid gap-2 border-t p-3">
      <label className="text-xs font-medium">
        Renderer
        <Select
          value={value.renderer}
          onValueChange={(v) =>
            onChange({
              ...value,
              renderer: v as RendererControlsValue['renderer'],
            })
          }
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="maplibre">MapLibre</SelectItem>
            <SelectItem value="mapbox">Mapbox</SelectItem>
          </SelectContent>
        </Select>
      </label>
      {showMapbox && (
        <>
          <label className="text-xs font-medium">
            Mapbox token (public, runtime only)
            <Input
              className="mt-1"
              type="password"
              value={value.mapboxToken ?? ''}
              onChange={(e) =>
                onChange({ ...value, mapboxToken: e.target.value })
              }
              placeholder="pk.…"
            />
          </label>
          <label className="text-xs font-medium">
            Mapbox style URL
            <Input
              className="mt-1"
              value={value.mapboxStyleUrl ?? ''}
              onChange={(e) =>
                onChange({ ...value, mapboxStyleUrl: e.target.value })
              }
              placeholder="mapbox://styles/owner/id"
            />
          </label>
        </>
      )}
    </div>
  )
}
