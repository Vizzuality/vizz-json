import type { InferredParam, ParamValues } from '../types'

export interface ParamControlsProps {
  params: InferredParam[]
  values: ParamValues
  onChange: (key: string, value: unknown) => void
}

export function ParamControls({
  params,
  values,
  onChange,
}: ParamControlsProps) {
  return (
    <div className="flex flex-col gap-3">
      {params.map((p) => (
        <ParamRow
          key={p.key}
          param={p}
          value={values[p.key] ?? p.value}
          onChange={(v) => onChange(p.key, v)}
        />
      ))}
    </div>
  )
}

interface ParamRowProps {
  param: InferredParam
  value: unknown
  onChange: (value: unknown) => void
}

function ParamRow({ param, value, onChange }: ParamRowProps) {
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="font-medium text-text">{param.key}</span>
      <Control param={param} value={value} onChange={onChange} />
    </label>
  )
}

function Control({ param, value, onChange }: ParamRowProps) {
  switch (param.control_type) {
    case 'color_picker':
      return (
        <input
          type="color"
          value={String(value ?? '#000000')}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-full rounded border border-border"
        />
      )
    case 'slider':
      return (
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={param.min}
            max={param.max}
            step={param.step}
            value={Number(value ?? 0)}
            onChange={(e) => onChange(Number(e.target.value))}
            className="flex-1"
          />
          <span className="tabular-nums w-12 text-right">
            {Number(value ?? 0).toFixed(2)}
          </span>
        </div>
      )
    case 'switch':
      return (
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4"
        />
      )
    case 'select':
      return (
        <select
          value={String(value ?? param.options?.[0] ?? '')}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 rounded border border-border px-2"
        >
          {(param.options ?? []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      )
    case 'text_input':
    default:
      return (
        <input
          type="text"
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 rounded border border-border px-2"
        />
      )
  }
}
