// src/components/legends/gradient-legend.tsx
import { useMemo, useState } from 'react'
import type { LegendItem, InferredParam } from '#/lib/types'
import type { ItemParamMapping } from '#/lib/legend-param-mapping'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '#/components/ui/popover'
import { GradientEditorPopover } from '#/components/legends/gradient-editor-popover'
import { initializeGradientStops } from '#/lib/gradient-stops-init'
import { buildTransparencyGradient } from '#/lib/gradient-css'

type GradientLegendProps = {
  readonly items: readonly LegendItem[]
  readonly paramMapping?: ReadonlyMap<number, ItemParamMapping>
  readonly values?: Record<string, unknown>
  readonly onChange?: (key: string, value: unknown) => void
  readonly legendParams?: readonly InferredParam[]
  readonly currentJson?: string
  readonly onApply?: (updatedJson: string) => void
}

const CHECKERBOARD_BG = [
  'repeating-conic-gradient(oklch(0.7 0 0) 0% 25%, oklch(0.85 0 0) 0% 50%)',
  '0 0 / 8px 8px',
].join(' ')

type GradientBarProps = {
  readonly items: readonly LegendItem[]
  readonly gradientCss?: string
}

function GradientBar({ items, gradientCss }: GradientBarProps) {
  const fallbackCss = items
    .map((item) => (typeof item.value === 'string' ? item.value : '#000'))
    .join(', ')

  const css = gradientCss ?? fallbackCss

  return (
    <div>
      <div
        className="relative h-4 w-full overflow-hidden rounded-sm"
        style={{ background: CHECKERBOARD_BG }}
      >
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(to right, ${css})` }}
        />
      </div>
      <div className="mt-1 flex justify-between">
        {items.map((item, i) => (
          <span key={i} className="text-[10px] text-muted-foreground">
            {item.label}
          </span>
        ))}
      </div>
    </div>
  )
}

function getFullRange(
  legendParams: readonly InferredParam[],
  paramMapping: ReadonlyMap<number, ItemParamMapping>,
): readonly [number, number] | undefined {
  const colorKeys = new Set<string>()
  for (const mapping of paramMapping.values()) {
    if (mapping.valueParamKey) colorKeys.add(mapping.valueParamKey)
  }

  const thresholdParams = legendParams.filter(
    (p) => p.control_type === 'slider' && !colorKeys.has(p.key),
  )
  if (thresholdParams.length < 2) return undefined

  const mins = thresholdParams.map((p) => p.min).filter((v) => v != null)
  const maxs = thresholdParams.map((p) => p.max).filter((v) => v != null)
  if (mins.length === 0 || maxs.length === 0) return undefined

  return [Math.min(...mins), Math.max(...maxs)] as const
}

export function GradientLegend({
  items,
  paramMapping,
  values,
  onChange,
  legendParams,
  currentJson,
  onApply,
}: GradientLegendProps) {
  const [open, setOpen] = useState(false)

  const hasEditor =
    paramMapping &&
    values &&
    onChange &&
    legendParams &&
    currentJson &&
    onApply &&
    paramMapping.size > 0

  const hasBuildColormap = hasEditor && currentJson.includes('buildColormap')

  const fullRange = useMemo(
    () =>
      hasBuildColormap ? getFullRange(legendParams, paramMapping) : undefined,
    [hasBuildColormap, legendParams, paramMapping],
  )

  const gradientCss = useMemo(() => {
    if (!hasBuildColormap || !fullRange) return undefined
    const stops = initializeGradientStops(
      items,
      paramMapping,
      legendParams,
      values,
    )
    return buildTransparencyGradient(stops, fullRange[0], fullRange[1])
  }, [hasBuildColormap, fullRange, items, paramMapping, legendParams, values])

  if (!hasEditor) {
    return <GradientBar items={items} />
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="w-full cursor-pointer text-left">
        <GradientBar items={items} gradientCss={gradientCss} />
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={8} className="w-auto p-0">
        <GradientEditorPopover
          items={items}
          paramMapping={paramMapping}
          legendParams={legendParams}
          values={values}
          currentJson={currentJson}
          onApply={onApply}
          onClose={() => setOpen(false)}
          fullRange={hasBuildColormap ? fullRange : undefined}
        />
      </PopoverContent>
    </Popover>
  )
}
