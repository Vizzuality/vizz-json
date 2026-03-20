import { Slider } from '#/components/ui/slider'
import { Switch } from '#/components/ui/switch'
import { Badge } from '#/components/ui/badge'
import type { ExampleMetadata, InferredParam } from '#/lib/types'

type PanelHeaderProps = {
  readonly metadata: Pick<ExampleMetadata, 'title' | 'tier'> | null
  readonly opacityParam: InferredParam | undefined
  readonly visibilityParam: InferredParam | undefined
  readonly opacityValue: unknown
  readonly visibilityValue: unknown
  readonly onChange: (key: string, value: unknown) => void
}

const TIER_CLASSES = {
  basic: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  intermediate: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  advanced: 'bg-red-500/15 text-red-700 dark:text-red-400',
} as const

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
    <div className="flex items-center gap-3 border-b px-4 py-3">
      {metadata && (
        <>
          <span className="truncate text-sm font-medium">{metadata.title}</span>
          <Badge className={TIER_CLASSES[metadata.tier]}>{metadata.tier}</Badge>
        </>
      )}
      <div className="ml-auto flex items-center gap-3">
        {visibilityParam && (
          <Switch
            checked={isVisible}
            onCheckedChange={(checked) =>
              onChange('visibility', checked ? 'visible' : 'none')
            }
          />
        )}
        {opacityParam && (
          <div className="flex w-[180px] shrink-0 items-center gap-2">
            <Slider
              value={[typeof opacityValue === 'number' ? opacityValue : 1]}
              min={opacityParam.min ?? 0}
              max={opacityParam.max ?? 1}
              step={opacityParam.step ?? 0.05}
              onValueChange={(v) =>
                onChange('opacity', Array.isArray(v) ? v[0] : v)
              }
              className="flex-1"
            />
            <span className="w-8 shrink-0 text-right font-mono text-xs text-muted-foreground">
              {(typeof opacityValue === 'number' ? opacityValue : 1).toFixed(2)}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
