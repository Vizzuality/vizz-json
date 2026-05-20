import { BasicLegend } from '#/components/legends/basic-legend'
import { ChoroplethLegend } from '#/components/legends/choropleth-legend'
import { GradientLegend } from '#/components/legends/gradient-legend'
import { ParamControl } from './param-control'
import type { InferredParam } from '#/lib/types'
import type { SourceLegendEntry } from '#/lib/pipeline/types'
import { Separator } from '#/components/ui/separator'

const LEGEND_COMPONENTS = {
  basic: BasicLegend,
  choropleth: ChoroplethLegend,
  gradient: GradientLegend,
} as const

type LegendCardProps = {
  readonly sourceLegends: readonly SourceLegendEntry[]
  readonly orphanLegendParams: readonly InferredParam[]
  readonly values: Record<string, unknown>
  readonly onChange: (key: string, value: unknown) => void
  readonly currentJson?: string
  readonly onApply?: (updatedJson: string) => void
}

export function LegendCard({
  sourceLegends,
  orphanLegendParams,
  values,
  onChange,
  currentJson,
  onApply,
}: LegendCardProps) {
  // Collect all param keys bound by any source's paramMapping
  const boundParamKeys = new Set<string>()
  for (const entry of sourceLegends) {
    for (const mapping of entry.paramMapping.values()) {
      if (mapping.valueParamKey) boundParamKeys.add(mapping.valueParamKey)
    }
  }
  const filteredOrphans = orphanLegendParams.filter(
    (p) => !boundParamKeys.has(p.key),
  )

  const hasPreview = sourceLegends.length > 0
  const hasOrphans = filteredOrphans.length > 0

  if (!hasPreview && !hasOrphans) return null

  const showSourceLabels = sourceLegends.length > 1

  return (
    <div className="mx-3 rounded-lg border bg-muted/30 p-3">
      {hasPreview && (
        <>
          {sourceLegends.map((entry, idx) => {
            const LegendComponent = LEGEND_COMPONENTS[entry.resolvedLegend.type]
            return (
              <div key={entry.sourceId}>
                {idx > 0 && <Separator className="my-3" />}
                {showSourceLabels && (
                  <div className="mb-2 text-xs font-medium text-muted-foreground">
                    {entry.sourceId}
                  </div>
                )}
                {entry.resolvedLegend.type === 'gradient' ? (
                  <GradientLegend
                    items={entry.resolvedLegend.items}
                    paramMapping={entry.paramMapping}
                    values={values}
                    onChange={onChange}
                    legendParams={entry.thresholdParams}
                    currentJson={currentJson}
                    onApply={onApply}
                    sourceId={entry.sourceId}
                  />
                ) : (
                  <LegendComponent
                    items={entry.resolvedLegend.items}
                    paramMapping={entry.paramMapping}
                    values={values}
                    onChange={onChange}
                  />
                )}
              </div>
            )
          })}
        </>
      )}
      {hasOrphans && (
        <>
          {hasPreview && <Separator className="my-3" />}
          <div className="flex flex-col gap-2">
            {filteredOrphans.map((param) => {
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
