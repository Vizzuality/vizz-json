import { Badge } from '#/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'

const STEPS = [
  { label: 'JSON Config', sublabel: 'From CMS or API' },
  { label: 'Params Resolution', sublabel: '@@#params.* → values' },
  { label: 'JSONConverter', sublabel: 'Recursive resolve', emphasized: true },
  { label: 'deck.gl / MapLibre', sublabel: 'Native JS objects' },
  { label: 'Rendered Map', sublabel: 'Live visualization' },
]

export function HowItWorksSection() {
  return (
    <section className="w-full landing-bg-muted py-20">
      <div className="mx-auto max-w-5xl px-6">
        <Badge variant="secondary" className="mb-3">
          How It Works
        </Badge>
        <h2 className="mb-12 text-3xl font-bold text-foreground">
          A single recursive pass.
        </h2>

        {/* Desktop: horizontal flow */}
        <div className="hidden flex-wrap items-center justify-center gap-2 sm:flex">
          {STEPS.map((step, index) => (
            <div key={step.label} className="flex items-center gap-2">
              <Card
                size="sm"
                className={`min-w-[130px] text-center ${
                  step.emphasized ? 'border-primary' : ''
                }`}
              >
                <CardHeader>
                  <CardTitle className="text-sm">{step.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {step.sublabel}
                  </p>
                </CardContent>
              </Card>
              {index < STEPS.length - 1 && (
                <span className="text-lg font-light text-muted-foreground">
                  →
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Mobile: vertical flow */}
        <div className="flex flex-col items-center gap-2 sm:hidden">
          {STEPS.map((step, index) => (
            <div
              key={step.label}
              className="flex w-full max-w-xs flex-col items-center gap-2"
            >
              <Card
                size="sm"
                className={`w-full text-center ${
                  step.emphasized ? 'border-primary' : ''
                }`}
              >
                <CardHeader>
                  <CardTitle className="text-sm">{step.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {step.sublabel}
                  </p>
                </CardContent>
              </Card>
              {index < STEPS.length - 1 && (
                <span className="text-lg font-light text-muted-foreground">
                  ↓
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
