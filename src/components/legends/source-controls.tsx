import { Switch } from '#/components/ui/switch'
import { Slider } from '#/components/ui/slider'
import { formatCompact } from '#/lib/utils'
import { setStyleOpacityLiteral } from '#/lib/json-mutations'

type SourceControlsProps = {
  readonly opacityParamKey: string | null
  readonly opacityLiteral: {
    readonly paintKey: string
    readonly value: number
  } | null
  readonly styleIndex: number
  readonly visibilityParamKey: string | null
  readonly visibilityLiteral: 'visible' | 'none'
  readonly values: Record<string, unknown>
  readonly onChange: (key: string, value: unknown) => void
  readonly currentJson: string
  readonly onApply: (updatedJson: string) => void
}

export function SourceControls({
  opacityParamKey,
  opacityLiteral,
  styleIndex,
  visibilityParamKey,
  visibilityLiteral,
  values,
  onChange,
  currentJson,
  onApply,
}: SourceControlsProps) {
  const showOpacity = opacityParamKey !== null || opacityLiteral !== null

  const rawOpacity = opacityParamKey ? values[opacityParamKey] : undefined
  const opacityValue = opacityParamKey
    ? typeof rawOpacity === 'number'
      ? rawOpacity
      : 1
    : (opacityLiteral?.value ?? null)

  const handleOpacityChange = (v: number | readonly number[]) => {
    const num = Array.isArray(v) ? (v as number[])[0] : (v as number)
    if (opacityParamKey) {
      onChange(opacityParamKey, num)
    } else if (opacityLiteral) {
      onApply(
        setStyleOpacityLiteral(
          currentJson,
          styleIndex,
          opacityLiteral.paintKey,
          num,
        ),
      )
    }
  }

  const isVisible = visibilityParamKey
    ? values[visibilityParamKey] !== 'none'
    : visibilityLiteral === 'visible'

  const handleVisibilityChange = (checked: boolean) => {
    if (visibilityParamKey) {
      onChange(visibilityParamKey, checked ? 'visible' : 'none')
    }
  }

  const showVisibility = visibilityParamKey !== null

  if (!showOpacity && !showVisibility) return null

  return (
    <div className="flex flex-col gap-1 pb-2">
      {showOpacity && opacityValue !== null && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Opacity
            </span>
            <span className="font-mono text-xs text-foreground">
              {formatCompact(opacityValue)}
            </span>
          </div>
          <Slider
            value={[opacityValue]}
            min={0}
            max={1}
            step={0.05}
            onValueChange={handleOpacityChange}
          />
        </div>
      )}
      {showVisibility && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            Visible
          </span>
          <Switch
            size="sm"
            checked={isVisible}
            onCheckedChange={handleVisibilityChange}
            aria-label="Toggle layer visibility"
          />
        </div>
      )}
    </div>
  )
}
