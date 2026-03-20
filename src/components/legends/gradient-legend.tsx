import type { LegendItem } from '#/lib/types'
import type { ItemParamMapping } from '#/lib/legend-param-mapping'
import { ColorInput } from '#/components/legends/color-input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#/components/ui/popover'
import { Input } from '#/components/ui/input'

type GradientLegendProps = {
  readonly items: readonly LegendItem[]
  readonly paramMapping?: ReadonlyMap<number, ItemParamMapping>
  readonly values?: Record<string, unknown>
  readonly onChange?: (key: string, value: unknown) => void
}

function GradientBar({ items }: { readonly items: readonly LegendItem[] }) {
  const colors = items
    .map((item) => (typeof item.value === 'string' ? item.value : '#000'))
    .join(', ')

  return (
    <div>
      <div
        className="h-4 w-full rounded-sm"
        style={{ background: `linear-gradient(to right, ${colors})` }}
      />
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

function EditableGradient({
  items,
  paramMapping,
  values,
  onChange,
}: {
  readonly items: readonly LegendItem[]
  readonly paramMapping: ReadonlyMap<number, ItemParamMapping>
  readonly values: Record<string, unknown>
  readonly onChange: (key: string, value: unknown) => void
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="w-full rounded-md px-1.5 py-1 -mx-1.5 transition-colors hover:bg-muted/50 cursor-pointer"
        >
          <GradientBar items={items} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" side="bottom" align="start">
        <div className="flex flex-col gap-3">
          {items.map((item, i) => {
            const mapping = paramMapping.get(i)
            if (!mapping) return null

            const colorValue = mapping.valueParamKey
              ? String(values[mapping.valueParamKey] ?? item.value)
              : undefined
            const labelValue = mapping.labelParamKey
              ? String(values[mapping.labelParamKey] ?? item.label)
              : undefined

            return (
              <div key={i} className="flex flex-col gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {item.label}
                </span>
                {colorValue !== undefined && mapping.valueParamKey && (
                  <ColorInput
                    value={colorValue}
                    onChange={(v) => onChange(mapping.valueParamKey!, v)}
                  />
                )}
                {labelValue !== undefined && mapping.labelParamKey && (
                  <Input
                    type="text"
                    value={labelValue}
                    onChange={(e) =>
                      onChange(mapping.labelParamKey!, e.target.value)
                    }
                    className="h-8 text-xs"
                  />
                )}
              </div>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function GradientLegend({
  items,
  paramMapping,
  values,
  onChange,
}: GradientLegendProps) {
  const hasEditableItems =
    paramMapping && values && onChange && paramMapping.size > 0

  if (hasEditableItems) {
    return (
      <EditableGradient
        items={items}
        paramMapping={paramMapping}
        values={values}
        onChange={onChange}
      />
    )
  }

  return <GradientBar items={items} />
}
