import { Badge } from '#/components/ui/badge'

type SectionHeaderProps = {
  readonly title: string
  readonly description: string
  readonly syntax?: string
}

export function SectionHeader({
  title,
  description,
  syntax,
}: SectionHeaderProps) {
  return (
    <div className="mb-8">
      <h1 className="mb-2 text-3xl font-bold text-foreground">{title}</h1>
      <p className="mb-3 text-lg text-muted-foreground">{description}</p>
      {syntax && (
        <Badge variant="secondary" className="font-mono text-sm">
          {syntax}
        </Badge>
      )}
    </div>
  )
}
