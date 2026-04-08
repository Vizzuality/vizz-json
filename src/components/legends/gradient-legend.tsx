// src/components/legends/gradient-legend.tsx
import { useState } from 'react'
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

function GradientBar({ items }: { readonly items: readonly LegendItem[] }) {
  const colors = items
    .map((item) => (typeof item.value === 'string' ? item.value : '#000'))
    .join(', ')

  return (
    <div>
      <div
        className="relative h-4 w-full overflow-hidden rounded-sm"
        style={{ background: CHECKERBOARD_BG }}
      >
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(to right, ${colors})` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        {items.map((item, i) => (
          <span key={i} className="text-[10px] text-muted-foreground">
            {item.label}
          </span>
        ))}
      </div>
    </div>
  )
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

  if (!hasEditor) {
    return <GradientBar items={items} />
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="w-full cursor-pointer text-left">
        <GradientBar items={items} />
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
