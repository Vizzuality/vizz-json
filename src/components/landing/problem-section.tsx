import { Badge } from '#/components/ui/badge'

const PAIN_POINTS = [
  {
    heading: 'Static JSON has no feedback loop',
    body: 'Map configs are opaque until rendered. Changing an opacity or a color means editing raw JSON and refreshing — you can\'t see the effect until the whole cycle completes.',
  },
  {
    heading: 'Tunable values are buried in config',
    body: 'Opacity, colors, radii — scattered across deeply nested JSON objects. There\'s no inventory of what\'s adjustable, no defined ranges, and no way to surface them as controls.',
  },
  {
    heading: 'Designers can\'t experiment without developers',
    body: 'Trying a different palette or adjusting a radius requires someone comfortable editing raw JSON. Non-technical teammates are locked out of the exploration loop.',
  },
  {
    heading: 'No clear boundary between template and state',
    body: 'When everything is hardcoded, there\'s no way to know what\'s configurable. With explicit parameters, you know exactly what to persist in a URL, save to a database, or sync across sessions.',
  },
]

export function ProblemSection() {
  return (
    <section className="w-full landing-bg-muted py-20">
      <div className="mx-auto max-w-5xl px-6">
        <Badge variant="secondary" className="mb-3">
          The Problem
        </Badge>
        <h2 className="mb-4 text-3xl font-bold text-foreground">
          Static configs don&apos;t scale.
        </h2>
        <p className="mb-12 max-w-2xl text-muted-foreground">
          Every map team hits the same wall: JSON configs that are rigid,
          duplicated, and impossible to maintain as variations grow.
        </p>

        <div className="grid gap-6 sm:grid-cols-2">
          {PAIN_POINTS.map((point) => (
            <div key={point.heading} className="flex gap-4">
              <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-chart-5" />
              <div>
                <h3 className="mb-1.5 text-sm font-semibold text-foreground">
                  {point.heading}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {point.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
