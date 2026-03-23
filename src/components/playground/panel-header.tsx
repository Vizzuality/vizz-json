import { formatCompact } from '#/lib/utils'
import { Slider } from '#/components/ui/slider'
import { Switch } from '#/components/ui/switch'
import type { ExampleMetadata, InferredParam } from '#/lib/types'

type PanelHeaderProps = {
  readonly metadata: Pick<ExampleMetadata, 'title' | 'tier'> | null
  readonly opacityParam: InferredParam | undefined
  readonly visibilityParam: InferredParam | undefined
  readonly opacityValue: unknown
  readonly visibilityValue: unknown
  readonly onChange: (key: string, value: unknown) => void
}

export function PanelHeader({
  metadata,
  opacityParam,
  visibilityParam,
  opacityValue,
  visibilityValue,
  onChange,
}: PanelHeaderProps) {
  const isVisible = visibilityValue === 'visible'

  return (
    <div className="flex flex-col gap-3 px-4 py-3">
      {metadata && (
        <span className="truncate text-sm font-medium">{metadata.title}</span>
      )}
      {visibilityParam && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Visibility</span>
          <Switch
            checked={isVisible}
            onCheckedChange={(checked) =>
              onChange('visibility', checked ? 'visible' : 'none')
            }
          />
        </div>
      )}
      {opacityParam && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Opacity</span>
            <span className="font-mono text-xs text-muted-foreground">
              {formatCompact(typeof opacityValue === 'number' ? opacityValue : 1)}
            </span>
          </div>
          <Slider
            value={[typeof opacityValue === 'number' ? opacityValue : 1]}
            min={opacityParam.min ?? 0}
            max={opacityParam.max ?? 1}
            step={opacityParam.step ?? 0.05}
            onValueChange={(v) =>
              onChange('opacity', Array.isArray(v) ? v[0] : v)
            }
          />
        </div>
      )}
    </div>
  )
}
