// src/components/legends/gradient-editor-popover.tsx
import { useMemo } from 'react'
import { useGradientEditor } from '#/hooks/use-gradient-editor'
import { initializeGradientStops } from '#/lib/gradient-stops-init'
import { serializeGradientToJson } from '#/lib/gradient-serializer'

import { InteractiveGradientBar } from '#/components/legends/interactive-gradient-bar'
import { StopList } from '#/components/legends/stop-list'
import { Button } from '#/components/ui/button'
import type { LegendItem, InferredParam } from '#/lib/types'
import type { ItemParamMapping } from '#/lib/legend-param-mapping'

type GradientEditorPopoverProps = {
  readonly items: readonly LegendItem[]
  readonly paramMapping: ReadonlyMap<number, ItemParamMapping>
  readonly legendParams: readonly InferredParam[]
  readonly values: Record<string, unknown>
  readonly currentJson: string
  readonly onApply: (updatedJson: string) => void
  readonly onClose: () => void
  readonly fullRange?: readonly [number, number]
}

export function GradientEditorPopover({
  items,
  paramMapping,
  legendParams,
  values,
  currentJson,
  onApply,
  onClose,
  fullRange,
}: GradientEditorPopoverProps) {
  const initialStops = useMemo(
    () => initializeGradientStops(items, paramMapping, legendParams, values),
    [items, paramMapping, legendParams, values],
  )

  const hasThresholds = initialStops.some(
    (s) => s.thresholdParamKey !== undefined,
  )

  const { state, selectStop, updateStop, addStop, removeStop } =
    useGradientEditor(initialStops)

  const handleApply = () => {
    const updatedJson = serializeGradientToJson(currentJson, [...state.stops])
    onApply(updatedJson)
    onClose()
  }

  return (
    <div className="flex w-72 flex-col gap-3 p-3">
      <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        Gradient Editor
      </div>

      <InteractiveGradientBar
        stops={state.stops}
        selectedStopId={state.selectedStopId}
        onSelectStop={selectStop}
        onUpdateStop={updateStop}
        onAddStop={addStop}
        fullRange={fullRange}
      />

      <StopList
        stops={state.stops}
        selectedStopId={state.selectedStopId}
        canDelete={state.stops.length > 2}
        hasThresholds={hasThresholds}
        onSelectStop={selectStop}
        onUpdateStop={updateStop}
        onRemoveStop={removeStop}
      />

      <div className="flex gap-2">
        <Button variant="ghost" size="sm" className="flex-1" onClick={onClose}>
          Cancel
        </Button>
        <Button
          size="sm"
          className="flex-1"
          disabled={!state.isDirty}
          onClick={handleApply}
        >
          Apply
        </Button>
      </div>
    </div>
  )
}
