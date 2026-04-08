import { useRef, useCallback, useMemo } from 'react'
import { cn } from '#/lib/utils'
import { interpolateHexColor, positionToDataValue } from '#/lib/gradient-types'
import type { GradientStop } from '#/lib/gradient-types'
import { buildTransparencyGradient } from '#/lib/gradient-css'

const CHECKERBOARD_BG = [
  'repeating-conic-gradient(oklch(0.7 0 0) 0% 25%, oklch(0.85 0 0) 0% 50%)',
  '0 0 / 8px 8px',
].join(' ')

type InteractiveGradientBarProps = {
  readonly stops: readonly GradientStop[]
  readonly selectedStopId: string | null
  readonly onSelectStop: (id: string) => void
  readonly onUpdateStop: (
    id: string,
    updates: Partial<Omit<GradientStop, 'id'>>,
  ) => void
  readonly onAddStop: (position: number, color: string) => void
  readonly fullRange?: readonly [number, number]
}

export function InteractiveGradientBar({
  stops,
  selectedStopId,
  onSelectStop,
  onUpdateStop,
  onAddStop,
  fullRange,
}: InteractiveGradientBarProps) {
  const barRef = useRef<HTMLDivElement>(null)

  const sortedStops = [...stops].sort((a, b) => a.position - b.position)

  const fallbackGradient = sortedStops
    .map((s) => `${s.color} ${(s.position * 100).toFixed(1)}%`)
    .join(', ')

  const gradientCss = useMemo(() => {
    if (!fullRange) return fallbackGradient
    return (
      buildTransparencyGradient(stops, fullRange[0], fullRange[1]) ??
      fallbackGradient
    )
  }, [stops, fullRange, fallbackGradient])

  const handleBarClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if ((e.target as HTMLElement).closest('[data-stop-handle]')) return
      const bar = barRef.current
      if (!bar) return
      const rect = bar.getBoundingClientRect()
      const position = Math.max(
        0,
        Math.min(1, (e.clientX - rect.left) / rect.width),
      )

      const left = [...sortedStops]
        .reverse()
        .find((s) => s.position <= position)
      const right = sortedStops.find((s) => s.position >= position)
      let color = '#808080'
      if (left && right && left.id !== right.id) {
        const t =
          right.position === left.position
            ? 0.5
            : (position - left.position) / (right.position - left.position)
        color = interpolateHexColor(left.color, right.color, t)
      } else if (left) {
        color = left.color
      } else if (right) {
        color = right.color
      }

      onAddStop(position, color)
    },
    [sortedStops, onAddStop],
  )

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const stopId = e.currentTarget.dataset.stopId
      if (!stopId) return
      e.preventDefault()
      e.stopPropagation()
      onSelectStop(stopId)

      const bar = barRef.current
      if (!bar) return
      const sorted = [...stops].sort((a, b) => a.position - b.position)
      const rangeMin = fullRange ? fullRange[0] : (sorted[0]?.dataValue ?? 0)
      const rangeMax = fullRange
        ? fullRange[1]
        : (sorted[sorted.length - 1]?.dataValue ?? 0)

      const handleMove = (moveEvent: PointerEvent) => {
        const currentRect = bar.getBoundingClientRect()
        const position = Math.max(
          0,
          Math.min(
            1,
            (moveEvent.clientX - currentRect.left) / currentRect.width,
          ),
        )
        const dataValue = positionToDataValue(position, rangeMin, rangeMax)
        onUpdateStop(stopId, { position, dataValue })
      }

      const handleUp = () => {
        document.removeEventListener('pointermove', handleMove)
        document.removeEventListener('pointerup', handleUp)
      }

      document.addEventListener('pointermove', handleMove)
      document.addEventListener('pointerup', handleUp)
    },
    [stops, onSelectStop, onUpdateStop],
  )

  return (
    <div className="relative mb-6">
      <div
        ref={barRef}
        className="group/bar relative h-7 w-full cursor-crosshair overflow-hidden rounded-md"
        style={{ background: CHECKERBOARD_BG }}
        onClick={handleBarClick}
      >
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(to right, ${gradientCss})` }}
        />
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[10px] font-medium text-white opacity-0 mix-blend-difference transition-opacity duration-300 group-hover/bar:opacity-100">
          Click to add stop
        </span>
      </div>
      {sortedStops.map((stop) => (
        <div
          key={stop.id}
          data-stop-handle
          data-stop-id={stop.id}
          className={cn(
            'absolute -bottom-2 size-4 -translate-x-1/2 cursor-grab rounded-full border-2 shadow-md transition-shadow',
            stop.id === selectedStopId
              ? 'border-primary ring-2 ring-primary/30'
              : 'border-white',
          )}
          style={{
            left: fullRange
              ? `${(((stop.dataValue - fullRange[0]) / (fullRange[1] - fullRange[0])) * 100).toFixed(1)}%`
              : `${stop.position * 100}%`,
            backgroundColor: stop.color,
          }}
          onPointerDown={handlePointerDown}
        />
      ))}
    </div>
  )
}
