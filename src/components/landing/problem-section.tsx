import { Badge } from '#/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import rasterOpacity from '#/examples/01-raster-opacity.json'

const beforeSnippet = JSON.stringify(
  {
    type: 'raster',
    paint: {
      'raster-opacity': rasterOpacity.params_config[0].default,
    },
    layout: {
      visibility: rasterOpacity.params_config[1].default,
    },
  },
  null,
  2,
)

const afterSnippet = JSON.stringify(rasterOpacity.config.styles[0], null, 2)

export function ProblemSection() {
  return (
    <section className="w-full landing-bg-muted py-20">
      <div className="mx-auto max-w-5xl px-6">
        <Badge variant="secondary" className="mb-3">
          The Problem
        </Badge>
        <h2 className="mb-12 text-3xl font-bold text-foreground">
          Static configs don&apos;t scale.
        </h2>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-l-4 border-l-chart-5">
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wider">
                Before — Static JSON
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="overflow-x-auto rounded-md bg-muted p-4 font-mono text-sm leading-relaxed text-foreground">
                <code>{beforeSnippet}</code>
              </pre>
              <p className="mt-4 text-xs text-muted-foreground">
                Hardcoded. Need a new API endpoint for every variation.
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-chart-1">
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wider">
                After — Dynamic JSON
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="overflow-x-auto rounded-md bg-muted p-4 font-mono text-sm leading-relaxed text-foreground">
                <code>{afterSnippet}</code>
              </pre>
              <p className="mt-4 text-xs text-muted-foreground">
                One config, infinite variations. Resolved at runtime.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
