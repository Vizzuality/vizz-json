import type { LegendItem } from '#/lib/types'
import type { ItemParamMapping } from '#/lib/legend-param-mapping'

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
  const resolvedLabel = mapping.labelParamKey
    ? values[mapping.labelParamKey]
    : item.label
  const labelValue =
    resolvedLabel == null || resolvedLabel === ''
      ? item.label
      : String(resolvedLabel)

  return (
    <div className="flex items-center gap-2 px-1.5 py-1 -mx-1.5">
      {colorValue !== undefined && mapping.valueParamKey ? (
        <label
          className="w-4 h-4 rounded-sm border border-border shrink-0 cursor-pointer"
          style={{ backgroundColor: colorValue }}
        >
          <input
            type="color"
            value={colorValue}
            onChange={(e) => onChange(mapping.valueParamKey!, e.target.value)}
            className="sr-only"
          />
        </label>
      ) : (
        <div
          className="w-4 h-4 rounded-sm border border-border shrink-0"
          style={{
            backgroundColor:
              typeof item.value === 'string' ? item.value : undefined,
          }}
        />
      )}
      <span className="text-xs text-muted-foreground">{labelValue}</span>
    </div>
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
