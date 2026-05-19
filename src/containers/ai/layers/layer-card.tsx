import { GripVertical } from 'lucide-react'
import { Switch } from '#/components/ui/switch'
import { Slider } from '#/components/ui/slider'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '#/components/ui/tooltip'
import { BasicLegend } from '#/components/legends/basic-legend'
import { ChoroplethLegend } from '#/components/legends/choropleth-legend'
import { GradientLegend } from '#/components/legends/gradient-legend'
import { ParamControl } from '#/containers/playground/param-control'
import { formatCompact } from '#/lib/utils'
import {
  setStyleVisibility,
  setStyleOpacityLiteral,
} from '#/lib/json-mutations'
import type { LayerCardProps } from './types'

const LEGEND_COMPONENTS = {
  basic: BasicLegend,
  choropleth: ChoroplethLegend,
  gradient: GradientLegend,
} as const

export function LayerCard({
  group,
  showHandle,
  values,
  onChange,
  currentJson,
  onApply,
  dragHandleProps,
}: LayerCardProps) {
  const {
    name,
    styleIndex,
    opacityParamKey,
    opacityLiteral,
    visibilityParamKey,
    visibilityLiteral,
    colorParams,
    bodyParams,
    legend,
  } = group

  // Resolve visibility state
  const isVisible = visibilityParamKey
    ? values[visibilityParamKey] !== 'none'
    : visibilityLiteral === 'visible'

  const handleVisibilityChange = (checked: boolean) => {
    if (visibilityParamKey) {
      onChange(visibilityParamKey, checked ? 'visible' : 'none')
    } else {
      onApply(setStyleVisibility(currentJson, styleIndex, checked))
    }
  }

  // Resolve opacity value
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

  const showOpacity = opacityParamKey !== null || opacityLiteral !== null

  // Build per-layer values record for legend components (they expect Record<string, unknown>)
  const valuesRecord = values as Record<string, unknown>

  // Color params NOT already represented by legend item param mapping
  const legendParamKeys = new Set<string>()
  if (legend) {
    for (const mapping of legend.paramMapping.values()) {
      if (mapping.valueParamKey) legendParamKeys.add(mapping.valueParamKey)
    }
  }
  const standaloneColorParams = colorParams.filter(
    (p) => !legendParamKeys.has(p.key),
  )

  const LegendComponent = legend ? LEGEND_COMPONENTS[legend.type] : null

  return (
    <div className="mx-3 rounded-lg border border-border bg-muted/30 overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-2 px-3 py-2">
        {showHandle && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    className="flex shrink-0 cursor-grab items-center justify-center rounded p-0.5 text-muted-foreground hover:bg-accent active:cursor-grabbing"
                    {...(dragHandleProps?.listeners ?? {})}
                    {...(dragHandleProps?.attributes ?? {})}
                  >
                    <GripVertical className="size-3" />
                  </button>
                }
              />
              <TooltipContent>Drag to reorder</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        <span className="min-w-0 flex-1 truncate text-sm font-medium">
          {name}
        </span>
        <Switch
          checked={isVisible}
          onCheckedChange={handleVisibilityChange}
          className="shrink-0"
          aria-label="Toggle layer visibility"
        />
      </div>

      {/* Body */}
      {(showOpacity ||
        LegendComponent ||
        standaloneColorParams.length > 0 ||
        bodyParams.length > 0) && (
        <div className="flex flex-col gap-3 px-3 pb-3">
          {/* Opacity slider */}
          {showOpacity && opacityValue !== null && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Opacity</span>
                <span className="font-mono text-xs text-muted-foreground">
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

          {/* Legend visualization */}
          {LegendComponent && legend && (
            <div>
              {legend.type === 'gradient' ? (
                <GradientLegend
                  items={legend.items}
                  paramMapping={legend.paramMapping}
                  values={valuesRecord}
                  onChange={onChange}
                  legendParams={colorParams}
                  currentJson={currentJson}
                  onApply={onApply}
                />
              ) : (
                <LegendComponent
                  items={legend.items}
                  paramMapping={legend.paramMapping}
                  values={valuesRecord}
                  onChange={onChange}
                />
              )}
            </div>
          )}

          {/* Standalone color params not in legend */}
          {standaloneColorParams.map((param) => {
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

          {/* Other body params */}
          {bodyParams.map((param) => {
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
