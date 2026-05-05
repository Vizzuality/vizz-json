import { Input } from '#/components/ui/input'
import { RadioGroup, RadioGroupItem } from '#/components/ui/radio-group'
import { ConfigSection } from './config-section'
import type { RendererControls as RendererControlsValue } from '#/lib/ai/types'

type Props = {
  readonly value: RendererControlsValue
  readonly onChange: (next: RendererControlsValue) => void
}

const RENDERER_OPTIONS: ReadonlyArray<{
  value: RendererControlsValue['renderer']
  label: string
}> = [
  { value: 'maplibre', label: 'MapLibre' },
  { value: 'mapbox', label: 'Mapbox' },
]

export function RendererSection({ value, onChange }: Props) {
  const showMapbox = value.renderer === 'mapbox'
  return (
    <ConfigSection title="Renderer">
      <div className="grid gap-1.5 text-xs font-medium">
        Renderer
        <RadioGroup
          value={value.renderer}
          onValueChange={(v) =>
            onChange({
              ...value,
              renderer: v as RendererControlsValue['renderer'],
            })
          }
          className="grid grid-cols-2 gap-2"
        >
          {RENDERER_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex cursor-pointer items-center gap-2 rounded-md border border-input px-3 py-2 has-data-checked:border-primary has-data-checked:bg-primary/5"
            >
              <RadioGroupItem value={opt.value} />
              {opt.label}
            </label>
          ))}
        </RadioGroup>
      </div>
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
