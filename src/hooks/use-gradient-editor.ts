import { useState, useCallback } from 'react'
import type { GradientStop, GradientEditorState } from '#/lib/gradient-types'

export function useGradientEditor(initialStops: readonly GradientStop[]) {
  const [state, setState] = useState<GradientEditorState>({
    stops: initialStops,
    selectedStopId: null,
    isDirty: false,
  })

  const selectStop = useCallback((id: string | null) => {
    setState((prev) => ({ ...prev, selectedStopId: id }))
  }, [])

  const updateStop = useCallback(
    (id: string, updates: Partial<Omit<GradientStop, 'id'>>) => {
      setState((prev) => ({
        ...prev,
        isDirty: true,
        stops: prev.stops.map((stop) =>
          stop.id === id ? { ...stop, ...updates } : stop,
        ),
      }))
    },
    [],
  )

  const addStop = useCallback((position: number, color: string) => {
    const id = crypto.randomUUID()
    setState((prev) => {
      const sorted = [...prev.stops].sort((a, b) => a.position - b.position)
      let dataValue = 0

      if (sorted.length >= 2) {
        const leftIdx = findLastIndex(sorted, (s) => s.position <= position)
        const rightIdx = sorted.findIndex((s) => s.position >= position)

        if (leftIdx >= 0 && rightIdx >= 0 && leftIdx !== rightIdx) {
          const left = sorted[leftIdx]
          const right = sorted[rightIdx]
          const t =
            right.position === left.position
              ? 0.5
              : (position - left.position) / (right.position - left.position)
          dataValue = Math.round(
            left.dataValue + (right.dataValue - left.dataValue) * t,
          )
        } else if (leftIdx >= 0) {
          dataValue = sorted[leftIdx].dataValue
        } else if (rightIdx >= 0) {
          dataValue = sorted[rightIdx].dataValue
        }
      }

      const newStop: GradientStop = {
        id,
        color,
        position,
        dataValue,
        label: '',
      }

      return {
        ...prev,
        isDirty: true,
        stops: [...prev.stops, newStop],
        selectedStopId: id,
      }
    })
  }, [])

  const removeStop = useCallback((id: string) => {
    setState((prev) => {
      if (prev.stops.length <= 2) return prev
      return {
        ...prev,
        isDirty: true,
        stops: prev.stops.filter((s) => s.id !== id),
        selectedStopId: prev.selectedStopId === id ? null : prev.selectedStopId,
      }
    })
  }, [])

  const reset = useCallback((stops: readonly GradientStop[]) => {
    setState({ stops, selectedStopId: null, isDirty: false })
  }, [])

  return { state, selectStop, updateStop, addStop, removeStop, reset }
}

function findLastIndex<T>(
  arr: readonly T[],
  predicate: (item: T) => boolean,
): number {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (predicate(arr[i])) return i
  }
  return -1
}
