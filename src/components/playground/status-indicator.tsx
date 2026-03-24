import { Badge } from '#/components/ui/badge'

type StatusIndicatorProps = {
  readonly error: string | null
}

export function StatusIndicator({ error }: StatusIndicatorProps) {
  if (error) {
    return (
      <Badge variant="destructive" size="sm" className="gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
        ERROR
      </Badge>
    )
  }

  return (
    <Badge
      variant="secondary"
      size="sm"
      className="gap-1 bg-primary/15 text-primary border-primary/25"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
      RESOLVED
    </Badge>
  )
}
