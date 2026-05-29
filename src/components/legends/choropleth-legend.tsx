import type { LegendItem } from '#/lib/types'
import type { ItemParamMapping } from '#/lib/legend-param-mapping'
import { resolveItemColor } from '#/lib/legend-color'
import { ColorInput } from '#/components/legends/color-input'

type ChoroplethLegendProps = {
  readonly items: readonly LegendItem[]
  readonly paramMapping?: ReadonlyMap<number, ItemParamMapping>
  readonly values?: Record<string, unknown>
  readonly onChange?: (key: string, value: unknown) => void
}

function resolveColor(
  item: LegendItem,
  mapping: ItemParamMapping | undefined,
  values: Record<string, unknown> | undefined,
): string {
  return resolveItemColor(item, mapping, values)
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
    <div className="flex h-6 w-full overflow-hidden rounded-sm">
      {items.map((item, i) => {
        const mapping = isEditable ? paramMapping.get(i) : undefined
        const color = resolveColor(item, mapping, values)

        if (mapping?.valueParamKey && onChange) {
          return (
            <ColorInput
              key={i}
              value={color}
              onChange={(next) => onChange(mapping.valueParamKey!, next)}
              swatchClassName="flex-1 size-auto h-full rounded-none border-0 hover:ring-0"
              ariaLabel="Edit color stop"
            />
          )
        }

        return (
          <div key={i} className="flex-1" style={{ backgroundColor: color }} />
        )
      })}
    </div>
  )
}

function Labels({
  items,
  paramMapping,
  values,
}: {
  readonly items: readonly LegendItem[]
  readonly paramMapping?: ReadonlyMap<number, ItemParamMapping>
  readonly values?: Record<string, unknown>
}) {
  const isEditable = paramMapping && values
  const resolveLabel = (item: LegendItem, i: number) => {
    const mapping = isEditable ? paramMapping.get(i) : undefined
    const r =
      mapping?.labelParamKey && values
        ? values[mapping.labelParamKey]
        : item.label
    return r === null || r === undefined || r === '' ? '' : String(r)
  }

  if (items.length > 2) {
    return (
      <div className="mt-1 flex justify-between">
        <span className="text-[10px] text-muted-foreground">
          {resolveLabel(items[0], 0)}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {resolveLabel(items[items.length - 1], items.length - 1)}
        </span>
      </div>
    )
  }

  return (
    <div className="mt-1 flex">
      {items.map((item, i) => (
        <span
          key={i}
          className="flex-1 text-center text-[10px] text-muted-foreground"
        >
          {resolveLabel(item, i)}
        </span>
      ))}
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
      <Labels items={items} paramMapping={paramMapping} values={values} />
    </div>
  )
}
