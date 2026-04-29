type InfoPanelProps = {
  readonly title: string
  readonly description: string
}

export function InfoPanel({ title, description }: InfoPanelProps) {
  return (
    <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
