import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { LayerCard } from './layer-card'
import type { LayerGroup } from '#/lib/layer-groups'
import type { ResolvedParams } from '#/lib/types'

type SortableLayerProps = {
  readonly group: LayerGroup
  readonly showHandle: boolean
  readonly values: ResolvedParams
  readonly onChange: (key: string, value: unknown) => void
  readonly currentJson: string
  readonly onApply: (updatedJson: string) => void
  readonly globalLegendParamKeys: ReadonlySet<string>
}

export function SortableLayer({
  group,
  showHandle,
  values,
  onChange,
  currentJson,
  onApply,
  globalLegendParamKeys,
}: SortableLayerProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: group.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
    zIndex: isDragging ? 1 : undefined,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <LayerCard
        group={group}
        showHandle={showHandle}
        values={values}
        onChange={onChange}
        currentJson={currentJson}
        onApply={onApply}
        globalLegendParamKeys={globalLegendParamKeys}
        dragHandleProps={{ listeners, attributes }}
      />
    </div>
  )
}
