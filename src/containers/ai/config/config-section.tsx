import type { ReactNode } from 'react'

type Props = {
  readonly title: string
  readonly children: ReactNode
}

export function ConfigSection({ title, children }: Props) {
  return (
    <section className="border-b last:border-b-0">
      <h2 className="px-4 pt-4 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      <div className="grid gap-3 px-4 pb-4">{children}</div>
    </section>
  )
}
