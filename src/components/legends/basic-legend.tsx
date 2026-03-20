import type { LegendItem } from '#/lib/types'
import type { ItemParamMapping } from '#/lib/legend-param-mapping'
import { ColorInput } from '#/components/legends/color-input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#/components/ui/popover'
import { Input } from '#/components/ui/input'

type BasicLegendProps = {
  readonly items: readonly LegendItem[]
  readonly paramMapping?: ReadonlyMap<number, ItemParamMapping>
  readonly values?: Record<string, unknown>
  readonly onChange?: (key: string, value: unknown) => void
}

function EditableRow({
  item,
  mapping,
  values,
  onChange,
}: {
  readonly item: LegendItem
  readonly mapping: ItemParamMapping
  readonly values: Record<string, unknown>
  readonly onChange: (key: string, value: unknown) => void
}) {
  const colorValue = mapping.valueParamKey
    ? String(values[mapping.valueParamKey] ?? item.value)
    : undefined
  const labelValue = mapping.labelParamKey
    ? String(values[mapping.labelParamKey] ?? item.label)
    : undefined

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-md px-1.5 py-1 -mx-1.5 transition-colors hover:bg-muted/50 cursor-pointer"
        >
          <div
            className="w-4 h-4 rounded-sm border border-border shrink-0"
            style={{
              backgroundColor:
                typeof item.value === 'string' ? item.value : undefined,
            }}
          />
          <span className="text-xs text-muted-foreground">{item.label}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3" side="bottom" align="start">
        <div className="flex flex-col gap-3">
          {colorValue !== undefined && mapping.valueParamKey && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">
                Color
              </label>
              <ColorInput
                value={colorValue}
                onChange={(v) => onChange(mapping.valueParamKey!, v)}
              />
            </div>
          )}
          {labelValue !== undefined && mapping.labelParamKey && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">
                Label
              </label>
              <Input
                type="text"
                value={labelValue}
                onChange={(e) =>
                  onChange(mapping.labelParamKey!, e.target.value)
                }
                className="h-8 text-xs"
              />
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function StaticRow({ item }: { readonly item: LegendItem }) {
  return (
    <div className="flex items-center gap-2 px-1.5 py-1 -mx-1.5">
      <div
        className="w-4 h-4 rounded-sm border border-border shrink-0"
        style={{
          backgroundColor:
            typeof item.value === 'string' ? item.value : undefined,
        }}
      />
      <span className="text-xs text-muted-foreground">{item.label}</span>
    </div>
  )
}

export function BasicLegend({
  items,
  paramMapping,
  values,
  onChange,
}: BasicLegendProps) {
  const isEditable = paramMapping && values && onChange

  return (
    <div className="flex flex-col gap-0.5">
      {items.map((item, i) => {
        const mapping = isEditable ? paramMapping.get(i) : undefined

        if (mapping && values && onChange) {
          return (
            <EditableRow
              key={i}
              item={item}
              mapping={mapping}
              values={values}
              onChange={onChange}
            />
          )
        }

        return <StaticRow key={i} item={item} />
      })}
    </div>
  )
}
