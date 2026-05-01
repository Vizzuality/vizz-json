import { Input } from '#/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { ConfigSection } from './config-section'
import type { RendererControls as RendererControlsValue } from '#/lib/ai/types'

type Props = {
  readonly value: RendererControlsValue
  readonly onChange: (next: RendererControlsValue) => void
}

export function RendererSection({ value, onChange }: Props) {
  const showMapbox = value.renderer === 'mapbox'
  return (
    <ConfigSection title="Renderer">
      <label className="grid gap-1 text-xs font-medium">
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
          <SelectTrigger>
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
          <label className="grid gap-1 text-xs font-medium">
            Mapbox token (public, runtime only)
            <Input
              type="password"
              value={value.mapboxToken ?? ''}
              onChange={(e) =>
                onChange({ ...value, mapboxToken: e.target.value })
              }
              placeholder="pk.…"
            />
          </label>
          <label className="grid gap-1 text-xs font-medium">
            Mapbox style URL
            <Input
              value={value.mapboxStyleUrl ?? ''}
              onChange={(e) =>
                onChange({ ...value, mapboxStyleUrl: e.target.value })
              }
              placeholder="mapbox://styles/owner/id"
            />
          </label>
        </>
      )}
    </ConfigSection>
  )
}
