import { useState } from 'react'
import { cn } from '#/lib/utils'
import { Trash2 } from 'lucide-react'
import type { GradientStop } from '#/lib/gradient-types'

function formatCompactValue(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `${+(value / 1_000_000).toFixed(1)}M`
  if (abs >= 10_000) return `${+(value / 1_000).toFixed(1)}k`
  if (Number.isInteger(value)) return value.toString()
  return abs >= 100 ? Math.round(value).toString() : String(+value.toFixed(2))
}

function ColorSwatch({
  color,
  onColorChange,
  onOpen,
}: {
  readonly color: string
  readonly onColorChange: (color: string) => void
  readonly onOpen?: () => void
}) {
  return (
    <label
      className="size-5 shrink-0 cursor-pointer rounded border border-border transition-shadow hover:ring-2 hover:ring-primary/20"
      style={{ backgroundColor: color }}
      onClick={(e) => {
        e.stopPropagation()
        onOpen?.()
      }}
    >
      <input
        type="color"
        value={color}
        onChange={(e) => onColorChange(e.target.value)}
        className="sr-only"
      />
    </label>
  )
}

function InlineValueInput({
  value,
  onCommit,
  onFocus,
}: {
  readonly value: number
  readonly onCommit: (value: number) => void
  readonly onFocus?: () => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState('')

  if (!isEditing) {
    return (
      <button
        type="button"
        className="shrink-0 rounded px-1.5 py-0.5 text-right font-mono text-[10px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        onClick={(e) => {
          e.stopPropagation()
          setDraft(value.toString())
          setIsEditing(true)
          onFocus?.()
        }}
      >
        {formatCompactValue(value)}
      </button>
    )
  }

  return (
    <input
      type="number"
      value={draft}
      autoFocus
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        const num = Number(draft)
        if (!Number.isNaN(num)) onCommit(num)
        setIsEditing(false)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur()
        if (e.key === 'Escape') setIsEditing(false)
      }}
      onClick={(e) => e.stopPropagation()}
      className="w-16 shrink-0 rounded border border-input bg-background px-1.5 py-0.5 text-right font-mono text-[10px] outline-none focus:ring-1 focus:ring-ring"
    />
  )
}

type StopListProps = {
  readonly stops: readonly GradientStop[]
  readonly selectedStopId: string | null
  readonly canDelete: boolean
  readonly hasThresholds: boolean
  readonly onSelectStop: (id: string | null) => void
  readonly onUpdateStop: (
    id: string,
    updates: Partial<Omit<GradientStop, 'id'>>,
  ) => void
  readonly onRemoveStop: (id: string) => void
}

export function StopList({
  stops,
  selectedStopId,
  canDelete,
  hasThresholds,
  onSelectStop,
  onUpdateStop,
  onRemoveStop,
}: StopListProps) {
  const sortedStops = [...stops].sort((a, b) => a.position - b.position)

  const handleValueCommit = (stop: GradientStop, dataValue: number) => {
    const sorted = [...stops].sort((a, b) => a.position - b.position)
    const rangeMin = sorted[0]?.dataValue ?? 0
    const rangeMax = sorted[sorted.length - 1]?.dataValue ?? 0
    const range = rangeMax - rangeMin
    const position =
      range === 0 ? stop.position : (dataValue - rangeMin) / range
    onUpdateStop(stop.id, {
      dataValue,
      position: Math.max(0, Math.min(1, position)),
    })
  }

  return (
    <div className="flex flex-col gap-0.5">
      {sortedStops.map((stop) => {
        const isSelected = stop.id === selectedStopId

        return (
          <div
            key={stop.id}
            className={cn(
              'group flex items-center gap-1.5 rounded-md px-1.5 py-1 transition-colors',
              isSelected ? 'bg-accent' : 'hover:bg-muted/50',
            )}
            onClick={() => onSelectStop(isSelected ? null : stop.id)}
          >
            <ColorSwatch
              color={stop.color}
              onColorChange={(color) => onUpdateStop(stop.id, { color })}
              onOpen={() => onSelectStop(stop.id)}
            />

            <input
              type="text"
              value={stop.label}
              onChange={(e) =>
                onUpdateStop(stop.id, { label: e.target.value })
              }
              onClick={(e) => {
                e.stopPropagation()
                onSelectStop(stop.id)
              }}
              placeholder="Label"
              className="min-w-0 flex-1 truncate border-none bg-transparent px-0.5 text-xs text-foreground outline-none placeholder:text-muted-foreground/50"
            />

            {hasThresholds && (
              <InlineValueInput
                value={stop.dataValue}
                onCommit={(v) => handleValueCommit(stop, v)}
                onFocus={() => onSelectStop(stop.id)}
              />
            )}

            <button
              type="button"
              disabled={!canDelete}
              onClick={(e) => {
                e.stopPropagation()
                onRemoveStop(stop.id)
              }}
              className={cn(
                'shrink-0 overflow-hidden rounded p-0.5 text-muted-foreground transition-all duration-500 max-w-0 opacity-0 group-hover:max-w-6 group-hover:opacity-100',
                canDelete ? 'hover:text-destructive' : 'cursor-not-allowed',
              )}
            >
              <Trash2 className="size-3" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
