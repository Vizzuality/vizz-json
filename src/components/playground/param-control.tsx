import * as React from 'react'
import { Slider } from '#/components/ui/slider'
import { Switch } from '#/components/ui/switch'
import { Input } from '#/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#/components/ui/popover'
import type { InferredParam } from '#/lib/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ParamControlProps = {
  readonly inferred: InferredParam
  readonly currentValue: unknown
  readonly onChange: (value: unknown) => void
}

type ColorPickerControlProps = {
  readonly value: string
  readonly onChange: (value: string) => void
}

// ---------------------------------------------------------------------------
// ColorPickerControl
// ---------------------------------------------------------------------------

function ColorPickerControl({ value, onChange }: ColorPickerControlProps) {
  const safeValue =
    typeof value === 'string' && value.startsWith('#') ? value : '#000000'

  const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value)
  }

  return (
    <Popover>
      <PopoverTrigger className="flex h-8 w-full items-center gap-2 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none hover:bg-accent focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
        <span
          className="inline-block size-4 shrink-0 rounded border border-border"
          style={{ backgroundColor: safeValue }}
        />
        <span className="font-mono text-xs text-muted-foreground">
          {safeValue}
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" side="bottom" align="start">
        <input
          type="color"
          value={safeValue}
          onChange={handleColorChange}
          className="h-24 w-24 cursor-pointer rounded border-0 bg-transparent p-0"
        />
      </PopoverContent>
    </Popover>
  )
}

// ---------------------------------------------------------------------------
// ParamControl — switches on control_type
// ---------------------------------------------------------------------------

export function ParamControl({
  inferred,
  currentValue,
  onChange,
}: ParamControlProps) {
  switch (inferred.control_type) {
    case 'slider': {
      const numValue =
        typeof currentValue === 'number' ? currentValue : (inferred.min ?? 0)
      const min = inferred.min ?? 0
      const max = inferred.max ?? 100
      const step = inferred.step ?? 1

      const handleValueChange = (newValue: number | readonly number[]) => {
        const resolved = Array.isArray(newValue) ? newValue[0] : newValue
        onChange(resolved)
      }

      return (
        <div className="flex items-center gap-2">
          <Slider
            value={[numValue]}
            min={min}
            max={max}
            step={step}
            onValueChange={handleValueChange}
            className="flex-1"
          />
          <span className="w-12 shrink-0 text-right font-mono text-xs text-muted-foreground">
            {numValue.toFixed(2)}
          </span>
        </div>
      )
    }

    case 'color_picker': {
      const strValue =
        typeof currentValue === 'string' ? currentValue : '#000000'
      return (
        <ColorPickerControl
          value={strValue}
          onChange={(newColor) => onChange(newColor)}
        />
      )
    }

    case 'switch': {
      const boolValue = typeof currentValue === 'boolean' ? currentValue : false
      return (
        <Switch
          checked={boolValue}
          onCheckedChange={(checked) => onChange(checked)}
        />
      )
    }

    case 'select': {
      const strValue = typeof currentValue === 'string' ? currentValue : ''
      const options = inferred.options ?? []
      return (
        <Select value={strValue} onValueChange={(newVal) => onChange(newVal)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }

    case 'text_input': {
      const strValue = typeof currentValue === 'string' ? currentValue : ''
      return (
        <Input
          type="text"
          value={strValue}
          onChange={(event) => onChange(event.target.value)}
        />
      )
    }

    case 'json_editor': {
      const jsonValue =
        typeof currentValue === 'object' && currentValue !== null
          ? currentValue
          : {}

      const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const raw = event.target.value
        try {
          const parsed: unknown = JSON.parse(raw)
          onChange(parsed)
        } catch {
          // Keep raw string while user is mid-edit; parent should validate on blur
          onChange(raw)
        }
      }

      return (
        <Input
          type="text"
          value={JSON.stringify(jsonValue)}
          onChange={handleChange}
          className="font-mono text-xs"
          placeholder="{}"
        />
      )
    }

    default: {
      // Exhaustive guard — TypeScript will warn if a new control_type is added
      const _exhaustive: never = inferred.control_type
      return (
        <span className="text-xs text-destructive">
          Unknown control: {String(_exhaustive)}
        </span>
      )
    }
  }
}
