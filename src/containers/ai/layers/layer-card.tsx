import { GripVertical } from 'lucide-react'
import { Switch } from '#/components/ui/switch'
import { Slider } from '#/components/ui/slider'
import { Separator } from '#/components/ui/separator'
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
import type { LayerGroupStyle } from '#/lib/layer-groups'

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
  const { name, styles, legend } = group

  // Build per-layer values record for legend components (they expect Record<string, unknown>)
  const valuesRecord = values as Record<string, unknown>

  // Color params NOT already represented by legend item param mapping — compute once per group
  const legendParamKeys = new Set<string>()
  if (legend) {
    for (const mapping of legend.paramMapping.values()) {
      if (mapping.valueParamKey) legendParamKeys.add(mapping.valueParamKey)
    }
  }

  const LegendComponent = legend ? LEGEND_COMPONENTS[legend.type] : null

  return (
    <div>
      {/* Header row — source name + drag handle */}
      <div className="flex items-center gap-1 bg-primary py-3.5 pr-2 pl-1">
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
      </div>

      {/* Body */}
      {(LegendComponent ||
        styles.some((s) => hasAnyContent(s, legendParamKeys))) && (
        <div className="flex flex-col px-4 pb-4">
          {/* Legend visualization — one per source group, at the top */}
          {LegendComponent && legend && (
            <div className="py-2">
              {legend.type === 'gradient' ? (
                <GradientLegend
                  items={legend.items}
                  paramMapping={legend.paramMapping}
                  values={valuesRecord}
                  onChange={onChange}
                  legendParams={[...legend.thresholdParams]}
                  currentJson={currentJson}
                  onApply={onApply}
                  sourceId={group.id}
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

          {/* Per-style sub-rows */}
          {styles.map((style, loopIndex) => (
            <StyleRow
              key={style.index}
              style={style}
              showLabel={styles.length > 1}
              legendParamKeys={legendParamKeys}
              values={valuesRecord}
              onChange={onChange}
              currentJson={currentJson}
              onApply={onApply}
              isLast={loopIndex === styles.length - 1}
              showSeparator={loopIndex < styles.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/** Returns true if a style contributes any visible UI content.
 * Every style has at least a visibility switch, so this is always true. */
function hasAnyContent(
  _style: LayerGroupStyle,
  _legendParamKeys: Set<string>,
): boolean {
  return true
}

type StyleRowProps = {
  readonly style: LayerGroupStyle
  readonly showLabel: boolean
  readonly legendParamKeys: Set<string>
  readonly values: Record<string, unknown>
  readonly onChange: (key: string, value: unknown) => void
  readonly currentJson: string
  readonly onApply: (updatedJson: string) => void
  readonly isLast: boolean
  readonly showSeparator: boolean
}

function StyleRow({
  style,
  showLabel,
  legendParamKeys,
  values,
  onChange,
  currentJson,
  onApply,
  showSeparator,
}: StyleRowProps) {
  const {
    index: styleIndex,
    name: styleName,
    opacityParamKey,
    opacityLiteral,
    visibilityParamKey,
    visibilityLiteral,
    colorParams,
    bodyParams,
  } = style

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

  const standaloneColorParams = colorParams.filter(
    (p) => !legendParamKeys.has(p.key),
  )

  return (
    <>
      {showSeparator && <Separator className="my-3" />}

      {/* Style label — only when there are multiple styles */}
      {showLabel && (
        <div className="pt-2 pb-1">
          <span className="text-xs font-medium text-muted-foreground">
            {styleName}
          </span>
        </div>
      )}

      {/* Visibility + opacity row */}
      <div className="flex items-center gap-2 py-1">
        <Switch
          checked={isVisible}
          onCheckedChange={handleVisibilityChange}
          className="shrink-0"
          aria-label={`Toggle ${styleName} layer visibility`}
        />
        {showOpacity && opacityValue !== null && (
          <div className="flex min-w-0 flex-1 flex-col gap-1">
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
      </div>

      {/* Standalone color params not in legend */}
      {standaloneColorParams.map((param) => {
        const currentValue = Object.prototype.hasOwnProperty.call(
          values,
          param.key,
        )
          ? values[param.key]
          : param.value
        return (
          <div key={param.key} className="flex flex-col gap-2 py-2">
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
          <div key={param.key} className="flex flex-col gap-2 py-2">
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
    </>
  )
}
