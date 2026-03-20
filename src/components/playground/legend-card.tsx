import { BasicLegend } from '#/components/legends/basic-legend'
import { ChoroplethLegend } from '#/components/legends/choropleth-legend'
import { GradientLegend } from '#/components/legends/gradient-legend'
import type { LegendConfig, InferredParam } from '#/lib/types'
import { ParamControl } from '#/components/playground/param-control'

const LEGEND_COMPONENTS = {
  basic: BasicLegend,
  choropleth: ChoroplethLegend,
  gradient: GradientLegend,
} as const

type LegendCardProps = {
  readonly legendConfig: LegendConfig | null
  readonly legendParams: readonly InferredParam[]
  readonly values: Record<string, unknown>
  readonly onChange: (key: string, value: unknown) => void
}

export function LegendCard({
  legendConfig,
  legendParams,
  values,
  onChange,
}: LegendCardProps) {
  const hasPreview = legendConfig !== null
  const hasControls = legendParams.length > 0

  if (!hasPreview && !hasControls) return null

  const LegendComponent = legendConfig
    ? LEGEND_COMPONENTS[legendConfig.type]
    : null

  return (
    <div className="mx-3 rounded-lg border bg-muted/30 p-3">
      {LegendComponent && legendConfig && (
        <div className="mb-3">
          <LegendComponent items={legendConfig.items} />
        </div>
      )}
      {hasControls && (
        <div className="flex flex-col gap-2">
          {legendParams.map((param) => {
            const currentValue = Object.prototype.hasOwnProperty.call(
              values,
              param.key,
            )
              ? values[param.key]
              : param.value

            return (
              <div key={param.key} className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">
                  {param.key}
                </label>
                <ParamControl
                  inferred={param}
                  currentValue={currentValue}
                  onChange={(newValue) => onChange(param.key, newValue)}
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
