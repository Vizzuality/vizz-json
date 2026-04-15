import { BASEMAP_OPTIONS, type BasemapOption } from '../types'

export interface StylePickerProps {
  value: BasemapOption['id']
  onChange: (id: BasemapOption['id']) => void
}

export function StylePicker({ value, onChange }: StylePickerProps) {
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="font-medium text-text">Basemap</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as BasemapOption['id'])}
        className="h-8 rounded border border-border px-2"
      >
        {BASEMAP_OPTIONS.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  )
}
