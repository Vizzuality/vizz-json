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

function getDefaultRange(
  legendParams: readonly InferredParam[],
  paramMapping: ReadonlyMap<number, ItemParamMapping>,
): readonly [number, number] | undefined {
  const colorKeys = new Set<string>()
  for (const mapping of paramMapping.values()) {
    if (mapping.valueParamKey) colorKeys.add(mapping.valueParamKey)
  }

  const defaults = legendParams
    .filter((p) => p.control_type === 'slider' && !colorKeys.has(p.key))
    .map((p) => (typeof p.value === 'number' ? p.value : undefined))
    .filter((v) => v != null)

  if (defaults.length < 2) return undefined

  return [Math.min(...defaults), Math.max(...defaults)] as const
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

  const defaultRange = useMemo(
    () => (hasEditor ? getDefaultRange(legendParams, paramMapping) : undefined),
    [hasEditor, legendParams, paramMapping],
  )

  const gradientCss = useMemo(() => {
    if (!hasEditor || !defaultRange) return undefined
    const stops = initializeGradientStops(
      items,
      paramMapping,
      legendParams,
      values,
    )
    return buildTransparencyGradient(stops, defaultRange[0], defaultRange[1])
  }, [hasEditor, defaultRange, items, paramMapping, legendParams, values])

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
          defaultRange={defaultRange}
        />
      </PopoverContent>
    </Popover>
  )
}
