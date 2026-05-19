import { useMemo } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent, Modifier } from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { SortableLayer } from './sortable-layer'
import { ParamControl } from '#/containers/playground/param-control'
import { deriveLayerGroups } from '#/lib/layer-groups'
import { extractLegendParamKeys } from '#/lib/legend-param-mapping'
import { reorderStyles } from '#/lib/json-mutations'
import type { LayersPanelProps } from './types'

// Restrict drag to vertical axis only (no x movement)
const restrictToVerticalAxis: Modifier = ({ transform }) => ({
  ...transform,
  x: 0,
})

// Restrict drag to stay within parent element bounds
const restrictToParentElement: Modifier = ({
  transform,
  draggingNodeRect,
  containerNodeRect,
}) => {
  if (!draggingNodeRect || !containerNodeRect) return transform
  const minY = containerNodeRect.top - draggingNodeRect.top
  const maxY = containerNodeRect.bottom - draggingNodeRect.bottom
  return {
    ...transform,
    y: Math.min(Math.max(transform.y, minY), maxY),
  }
}

export function LayersPanel({
  parsedConfig,
  pipeline,
  values,
  onChange,
  currentJson,
  onApply,
}: LayersPanelProps) {
  const paramMapping = useMemo(
    () => extractLegendParamKeys(pipeline.rawLegendConfig),
    [pipeline.rawLegendConfig],
  )

  const { groups, orphans } = useMemo(
    () =>
      deriveLayerGroups(
        parsedConfig,
        pipeline.inferredParams,
        pipeline.rawLegendConfig,
        paramMapping,
      ),
    [
      parsedConfig,
      pipeline.inferredParams,
      pipeline.rawLegendConfig,
      paramMapping,
    ],
  )

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = groups.findIndex((g) => g.id === active.id)
    const newIndex = groups.findIndex((g) => g.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    onApply(reorderStyles(currentJson, oldIndex, newIndex))
  }

  const showHandle = groups.length > 1

  const sortableIds = groups.map((g) => g.id)

  return (
    <div className="flex flex-col gap-3 py-3">
      {/* Orphan / global params section */}
      {orphans.length > 0 && (
        <div className="mx-3 flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-3">
          <span className="text-xs font-medium text-muted-foreground">
            Global
          </span>
          {orphans.map((param) => {
            const currentValue = Object.prototype.hasOwnProperty.call(
              values,
              param.key,
            )
              ? values[param.key]
              : param.value
            return (
              <div key={param.key} className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">
                  {param.key}
                </label>
                <ParamControl
                  inferred={param}
                  currentValue={currentValue}
                  onChange={(newValue) => onChange(param.key, newValue)}
                />
              </div>
            )
          })}
        </div>
      )}

      {/* Layer cards */}
      {groups.length > 0 &&
        (showHandle ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
          >
            <SortableContext
              items={sortableIds}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-3">
                {groups.map((group) => (
                  <SortableLayer
                    key={group.id}
                    group={group}
                    showHandle={showHandle}
                    values={values}
                    onChange={onChange}
                    currentJson={currentJson}
                    onApply={onApply}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="flex flex-col gap-3">
            {groups.map((group) => (
              <SortableLayer
                key={group.id}
                group={group}
                showHandle={false}
                values={values}
                onChange={onChange}
                currentJson={currentJson}
                onApply={onApply}
              />
            ))}
          </div>
        ))}
    </div>
  )
}
