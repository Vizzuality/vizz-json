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

function buildGradientCss(
  legendParams: readonly InferredParam[],
  paramMapping: ReadonlyMap<number, ItemParamMapping>,
  values: Record<string, unknown>,
  items: readonly LegendItem[],
): string | undefined {
  const colorKeys = new Set<string>()
  for (const mapping of paramMapping.values()) {
    if (mapping.valueParamKey) colorKeys.add(mapping.valueParamKey)
  }

  const thresholdParams = legendParams
    .filter((p) => p.control_type === 'slider' && !colorKeys.has(p.key))
    .sort((a, b) => {
      const av =
        typeof values[a.key] === 'number' ? (values[a.key] as number) : 0
      const bv =
        typeof values[b.key] === 'number' ? (values[b.key] as number) : 0
      return av - bv
    })
  if (thresholdParams.length < 2) return undefined

  const mins = thresholdParams.map((p) => p.min).filter((v) => v != null)
  const maxs = thresholdParams.map((p) => p.max).filter((v) => v != null)
  if (mins.length === 0 || maxs.length === 0) return undefined

  const rangeMin = Math.min(...mins)
  const rangeMax = Math.max(...maxs)
  const fullRange = rangeMax - rangeMin
  if (fullRange === 0) return undefined

  const colors = items.map((item) =>
    typeof item.value === 'string' ? item.value : '#000',
  )
  if (colors.length !== thresholdParams.length) return undefined

  const colorStops = thresholdParams.map((p, i) => {
    const val =
      typeof values[p.key] === 'number' ? (values[p.key] as number) : 0
    const pct = (((val - rangeMin) / fullRange) * 100).toFixed(1)
    return `${colors[i]} ${pct}%`
  })

  const firstVal =
    typeof values[thresholdParams[0].key] === 'number'
      ? (values[thresholdParams[0].key] as number)
      : 0
  const lastVal =
    typeof values[thresholdParams[thresholdParams.length - 1].key] === 'number'
      ? (values[thresholdParams[thresholdParams.length - 1].key] as number)
      : 0

  const firstPct = (((firstVal - rangeMin) / fullRange) * 100).toFixed(1)
  const lastPct = (((lastVal - rangeMin) / fullRange) * 100).toFixed(1)

  return [
    'transparent 0%',
    `transparent ${firstPct}%`,
    ...colorStops,
    `transparent ${lastPct}%`,
    'transparent 100%',
  ].join(', ')
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

  const gradientCss = useMemo(() => {
    if (!hasEditor) return undefined
    return buildGradientCss(legendParams, paramMapping, values, items)
  }, [hasEditor, legendParams, paramMapping, values, items])

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
        />
      </PopoverContent>
    </Popover>
  )
}
