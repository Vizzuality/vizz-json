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
      className="gap-1 bg-green-950 text-green-400 border-green-800"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
      RESOLVED
    </Badge>
  )
}
