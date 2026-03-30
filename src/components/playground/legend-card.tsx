import { useMemo } from 'react'
import { BasicLegend } from '#/components/legends/basic-legend'
import { ChoroplethLegend } from '#/components/legends/choropleth-legend'
import { GradientLegend } from '#/components/legends/gradient-legend'
import { ParamControl } from '#/components/playground/param-control'
import type { LegendConfig, InferredParam } from '#/lib/types'
import type { RawLegendConfig } from '#/lib/legend-param-mapping'
import {
  extractLegendParamKeys,
  getOrphanLegendParams,
} from '#/lib/legend-param-mapping'
import { Separator } from '#/components/ui/separator'

const LEGEND_COMPONENTS = {
  basic: BasicLegend,
  choropleth: ChoroplethLegend,
  gradient: GradientLegend,
} as const

type LegendCardProps = {
  readonly legendConfig: LegendConfig | null
  readonly rawLegendConfig: RawLegendConfig | null
  readonly legendParams: readonly InferredParam[]
  readonly values: Record<string, unknown>
  readonly onChange: (key: string, value: unknown) => void
  readonly currentJson?: string
  readonly onApply?: (updatedJson: string) => void
}

export function LegendCard({
  legendConfig,
  rawLegendConfig,
  legendParams,
  values,
  onChange,
  currentJson,
  onApply,
}: LegendCardProps) {
  const paramMapping = useMemo(
    () => extractLegendParamKeys(rawLegendConfig),
    [rawLegendConfig],
  )

  const orphanParams = useMemo(
    () => getOrphanLegendParams(legendParams, paramMapping),
    [legendParams, paramMapping],
  )

  const hasPreview = legendConfig !== null
  const hasOrphans = orphanParams.length > 0

  if (!hasPreview && !hasOrphans) return null

  const LegendComponent = legendConfig
    ? LEGEND_COMPONENTS[legendConfig.type]
    : null

  return (
    <div className="mx-3 rounded-lg border bg-muted/30 p-3">
      {LegendComponent && legendConfig && (
        <LegendComponent
          items={legendConfig.items}
          paramMapping={paramMapping}
          values={values}
          onChange={onChange}
          {...(legendConfig.type === 'gradient'
            ? { legendParams, currentJson, onApply }
            : {})}
        />
      )}
      {hasOrphans && (
        <>
          {hasPreview && <Separator className="my-3" />}
          <div className="flex flex-col gap-2">
            {orphanParams.map((param) => {
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
        </>
      )}
    </div>
  )
}
