import type { LegendItem } from '#/lib/types'
import type { ItemParamMapping } from '#/lib/legend-param-mapping'
import { Input } from '#/components/ui/input'

type ChoroplethLegendProps = {
  readonly items: readonly LegendItem[]
  readonly paramMapping?: ReadonlyMap<number, ItemParamMapping>
  readonly values?: Record<string, unknown>
  readonly onChange?: (key: string, value: unknown) => void
}

function getColor(item: LegendItem): string {
  return typeof item.value === 'string' ? item.value : '#000'
}

function resolveColor(
  item: LegendItem,
  mapping: ItemParamMapping | undefined,
  values: Record<string, unknown> | undefined,
): string {
  if (mapping?.valueParamKey && values) {
    return String(values[mapping.valueParamKey] ?? item.value)
  }
  return getColor(item)
}

function ColorBar({
  items,
  paramMapping,
  values,
  onChange,
}: {
  readonly items: readonly LegendItem[]
  readonly paramMapping?: ReadonlyMap<number, ItemParamMapping>
  readonly values?: Record<string, unknown>
  readonly onChange?: (key: string, value: unknown) => void
}) {
  const isEditable = paramMapping && values && onChange

  return (
    <div className="flex h-4 w-full overflow-hidden rounded-sm">
      {items.map((item, i) => {
        const mapping = isEditable ? paramMapping.get(i) : undefined
        const color = resolveColor(item, mapping, values)

        if (mapping?.valueParamKey && onChange) {
          return (
            <label
              key={i}
              className="flex-1 cursor-pointer"
              style={{ backgroundColor: color }}
            >
              <input
                type="color"
                value={color}
                onChange={(e) =>
                  onChange(mapping.valueParamKey!, e.target.value)
                }
                className="sr-only"
              />
            </label>
          )
        }

        return (
          <div
            key={i}
            className="flex-1"
            style={{ backgroundColor: color }}
          />
        )
      })}
    </div>
  )
}

function Labels({
  items,
  paramMapping,
  values,
  onChange,
}: {
  readonly items: readonly LegendItem[]
  readonly paramMapping?: ReadonlyMap<number, ItemParamMapping>
  readonly values?: Record<string, unknown>
  readonly onChange?: (key: string, value: unknown) => void
}) {
  const isEditable = paramMapping && values && onChange

  return (
    <div className="mt-1 flex">
      {items.map((item, i) => {
        const mapping = isEditable ? paramMapping.get(i) : undefined
        const labelValue = mapping?.labelParamKey && values
          ? String(values[mapping.labelParamKey] ?? item.label)
          : undefined

        if (labelValue !== undefined && mapping?.labelParamKey && onChange) {
          return (
            <div key={i} className="flex-1">
              <Input
                type="text"
                value={labelValue}
                onChange={(e) =>
                  onChange(mapping.labelParamKey!, e.target.value)
                }
                className="h-6 text-[10px]"
              />
            </div>
          )
        }

        return (
          <span
            key={i}
            className="flex-1 text-center text-[10px] text-muted-foreground"
          >
            {item.label}
          </span>
        )
      })}
    </div>
  )
}

export function ChoroplethLegend({
  items,
  paramMapping,
  values,
  onChange,
}: ChoroplethLegendProps) {
  return (
    <div>
      <ColorBar
        items={items}
        paramMapping={paramMapping}
        values={values}
        onChange={onChange}
      />
      <Labels
        items={items}
        paramMapping={paramMapping}
        values={values}
        onChange={onChange}
      />
    </div>
  )
}
