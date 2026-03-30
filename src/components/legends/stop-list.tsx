import { useState } from 'react'
import { cn } from '#/lib/utils'
import { Input } from '#/components/ui/input'
import { Button } from '#/components/ui/button'
import { Trash2 } from 'lucide-react'
import type { GradientStop } from '#/lib/gradient-types'

const HEX_REGEX = /^#[0-9a-fA-F]{6}$/

function HexColorInput({
  value,
  onChange,
}: {
  readonly value: string
  readonly onChange: (color: string) => void
}) {
  const [draft, setDraft] = useState(value)
  const isValid = HEX_REGEX.test(draft)

  return (
    <Input
      type="text"
      value={draft}
      onChange={(e) => {
        setDraft(e.target.value)
        if (HEX_REGEX.test(e.target.value)) {
          onChange(e.target.value)
        }
      }}
      onBlur={() => {
        if (!isValid) setDraft(value)
      }}
      className={cn(
        'h-7 flex-1 font-mono text-xs',
        !isValid && 'border-destructive',
      )}
      placeholder="#000000"
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

  return (
    <div className="flex flex-col gap-1">
      {sortedStops.map((stop) => {
        const isSelected = stop.id === selectedStopId
        const displayText = stop.label || stop.color

        return (
          <div key={stop.id}>
            <button
              type="button"
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors',
                isSelected
                  ? 'bg-accent'
                  : 'hover:bg-muted/50',
              )}
              onClick={() => onSelectStop(isSelected ? null : stop.id)}
            >
              <span
                className="size-5 shrink-0 rounded border border-border"
                style={{ backgroundColor: stop.color }}
              />
              <span className="flex-1 truncate text-xs text-foreground">
                {displayText}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">
                {(stop.position * 100).toFixed(0)}%
              </span>
            </button>

            {isSelected && (
              <div className="flex flex-col gap-2 px-2 pb-2 pt-1">
                <div className="flex items-center gap-2">
                  <label
                    className="size-6 shrink-0 cursor-pointer rounded border border-border"
                    style={{ backgroundColor: stop.color }}
                  >
                    <input
                      type="color"
                      value={stop.color}
                      onChange={(e) =>
                        onUpdateStop(stop.id, { color: e.target.value })
                      }
                      className="sr-only"
                    />
                  </label>
                  <HexColorInput
                    value={stop.color}
                    onChange={(color) => onUpdateStop(stop.id, { color })}
                  />
                </div>

                {hasThresholds && (
                  <Input
                    type="number"
                    value={stop.dataValue}
                    onChange={(e) => {
                      const dataValue = Number(e.target.value)
                      if (!Number.isNaN(dataValue)) {
                        const sorted = [...stops].sort((a, b) => a.position - b.position)
                        const rangeMin = sorted[0]?.dataValue ?? 0
                        const rangeMax = sorted[sorted.length - 1]?.dataValue ?? 0
                        const range = rangeMax - rangeMin
                        const position = range === 0 ? stop.position : (dataValue - rangeMin) / range
                        onUpdateStop(stop.id, { dataValue, position: Math.max(0, Math.min(1, position)) })
                      }
                    }}
                    className="h-7 font-mono text-xs"
                    placeholder="Data value"
                  />
                )}

                <Input
                  type="text"
                  value={stop.label}
                  onChange={(e) =>
                    onUpdateStop(stop.id, { label: e.target.value })
                  }
                  className="h-7 text-xs"
                  placeholder="Optional label"
                />

                <Button
                  variant="ghost"
                  size="xs"
                  disabled={!canDelete}
                  onClick={() => onRemoveStop(stop.id)}
                  className="self-end text-destructive hover:text-destructive"
                >
                  <Trash2 className="mr-1 size-3" />
                  Delete
                </Button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
