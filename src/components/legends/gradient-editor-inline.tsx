import { useEffect, useMemo, useRef } from 'react'
import { useGradientEditor } from '#/hooks/use-gradient-editor'
import { initializeGradientStops } from '#/lib/gradient-stops-init'
import { serializeGradientToJson } from '#/lib/gradient-serializer'

import { InteractiveGradientBar } from '#/components/legends/interactive-gradient-bar'
import { StopList } from '#/components/legends/stop-list'
import type { LegendItem, InferredParam } from '#/lib/types'
import type { ItemParamMapping } from '#/lib/legend-param-mapping'

type GradientEditorInlineProps = {
  readonly items: readonly LegendItem[]
  readonly paramMapping: ReadonlyMap<number, ItemParamMapping>
  readonly legendParams: readonly InferredParam[]
  readonly values: Record<string, unknown>
  readonly currentJson: string
  readonly onApply: (updatedJson: string) => void
  readonly sourceId: string
  readonly fullRange?: readonly [number, number]
}

const COMMIT_DEBOUNCE_MS = 150

export function GradientEditorInline({
  items,
  paramMapping,
  legendParams,
  values,
  currentJson,
  onApply,
  sourceId,
  fullRange,
}: GradientEditorInlineProps) {
  const initialStops = useMemo(
    () => initializeGradientStops(items, paramMapping, legendParams, values),
    [items, paramMapping, legendParams, values],
  )

  const hasThresholds = initialStops.some(
    (s) => s.thresholdParamKey !== undefined,
  )

  const { state, selectStop, updateStop, addStop, removeStop } =
    useGradientEditor(initialStops)

  // Always read the latest JSON so successive commits stack on each other
  // instead of overwriting from a stale snapshot.
  const currentJsonRef = useRef(currentJson)
  useEffect(() => {
    currentJsonRef.current = currentJson
  }, [currentJson])

  const onApplyRef = useRef(onApply)
  useEffect(() => {
    onApplyRef.current = onApply
  }, [onApply])

  useEffect(() => {
    if (!state.isDirty) return
    const timer = window.setTimeout(() => {
      const updated = serializeGradientToJson(
        currentJsonRef.current,
        [...state.stops],
        sourceId,
      )
      onApplyRef.current(updated)
    }, COMMIT_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [state.stops, state.isDirty, sourceId])

  return (
    <div className="flex flex-col gap-3">
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
    </div>
  )
}
