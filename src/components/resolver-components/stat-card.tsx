type StatCardProps = {
  readonly label: string
  readonly value: string
  readonly unit: string
  readonly color: string
}

export function StatCard({ label, value, unit, color }: StatCardProps) {
  return (
    <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="text-2xl font-bold" style={{ color }}>
          {value}
        </span>
        <span className="text-sm text-muted-foreground">{unit}</span>
      </div>
    </div>
  )
}
