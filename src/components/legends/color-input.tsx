import { cn } from '#/lib/utils'
import { parseColor, formatColor } from '#/lib/color'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#/components/ui/popover'
import { Slider } from '#/components/ui/slider'
import { Input } from '#/components/ui/input'

type ColorInputProps = {
  readonly value: string
  readonly onChange: (value: string) => void
  readonly className?: string
  readonly swatchClassName?: string
  readonly ariaLabel?: string
  readonly onOpenChange?: (open: boolean) => void
}

export function ColorInput({
  value,
  onChange,
  className,
  swatchClassName,
  ariaLabel = 'Pick color',
  onOpenChange,
}: ColorInputProps) {
  const { hex, alpha } = parseColor(value)
  const cssPreview = formatColor({ hex, alpha })

  const emit = (next: { hex?: string; alpha?: number }) => {
    onChange(
      formatColor({
        hex: next.hex ?? hex,
        alpha: next.alpha ?? alpha,
      }),
    )
  }

  return (
    <Popover onOpenChange={onOpenChange}>
      <PopoverTrigger
        aria-label={ariaLabel}
        className={cn(
          'size-5 shrink-0 cursor-pointer rounded border border-border transition-shadow hover:ring-2 hover:ring-primary/20',
          swatchClassName,
        )}
        style={{ backgroundColor: cssPreview }}
      />
      <PopoverContent
        align="start"
        className={cn('flex w-56 flex-col gap-3 p-3', className)}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <label
            className="size-9 shrink-0 cursor-pointer overflow-hidden rounded border border-border"
            style={{ backgroundColor: cssPreview }}
          >
            <input
              type="color"
              value={hex}
              onChange={(e) => emit({ hex: e.target.value })}
              className="sr-only"
            />
          </label>
          <Input
            type="text"
            value={hex}
            onChange={(e) => {
              const next = e.target.value
              if (/^#[0-9a-f]{6}$/i.test(next))
                emit({ hex: next.toLowerCase() })
            }}
            spellCheck={false}
            className="h-9 flex-1 font-mono text-xs"
          />
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Alpha
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              {Math.round(alpha * 100)}%
            </span>
          </div>
          <Slider
            value={[alpha]}
            min={0}
            max={1}
            step={0.01}
            onValueChange={(v) => {
              const next = Array.isArray(v) ? v[0] : v
              emit({ alpha: next })
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
