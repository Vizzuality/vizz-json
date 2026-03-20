type ColorInputProps = {
  readonly value: string
  readonly onChange: (value: string) => void
}

export function ColorInput({ value, onChange }: ColorInputProps) {
  const safeValue =
    typeof value === 'string' && value.startsWith('#') ? value : '#000000'
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={safeValue}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
      />
      <span className="font-mono text-xs text-muted-foreground">
        {safeValue}
      </span>
    </div>
  )
}
