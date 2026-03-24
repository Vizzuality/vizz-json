import { Link } from '@tanstack/react-router'
import { Badge } from '#/components/ui/badge'
import { buttonVariants } from '#/components/ui/button'
import { cn } from '#/lib/utils'

const EXAMPLES = [
  {
    title: 'Layers',
    description: 'Configure deck.gl layers from JSON with @@type prefixes',
    gradient: 'from-chart-5/60 via-chart-3/40 to-chart-2/50',
    pattern: 'layers',
  },
  {
    title: 'Components',
    description: 'Instantiate React components declaratively via @@type',
    gradient: 'from-blue-800/60 via-indigo-600/40 to-violet-700/50',
    pattern: 'components',
  },
  {
    title: 'Parameters',
    description: 'Bind live controls to any value with @@#params references',
    gradient: 'from-rose-800/60 via-pink-600/40 to-fuchsia-700/50',
    pattern: 'parameters',
  },
] as const

function PatternSvg({ pattern }: { readonly pattern: string }) {
  switch (pattern) {
    case 'layers':
      return (
        <svg
          className="absolute inset-0 w-full h-full opacity-30"
          viewBox="0 0 200 120"
        >
          {/* Stacked layers — three tilted planes */}
          <path
            d="M40,85 L100,65 L160,85 L100,105 Z"
            fill="currentColor"
            opacity="0.25"
          />
          <path
            d="M40,65 L100,45 L160,65 L100,85 Z"
            fill="currentColor"
            opacity="0.35"
          />
          <path
            d="M40,45 L100,25 L160,45 L100,65 Z"
            fill="currentColor"
            opacity="0.5"
          />
        </svg>
      )
    case 'components':
      return (
        <svg
          className="absolute inset-0 w-full h-full opacity-30"
          viewBox="0 0 200 120"
        >
          {/* UI building blocks — card, toggle, button */}
          <rect
            x="20"
            y="15"
            width="70"
            height="50"
            rx="6"
            fill="currentColor"
            opacity="0.35"
          />
          <rect
            x="28"
            y="48"
            width="30"
            height="8"
            rx="4"
            fill="currentColor"
            opacity="0.5"
          />
          <rect
            x="110"
            y="15"
            width="70"
            height="24"
            rx="6"
            fill="currentColor"
            opacity="0.3"
          />
          <rect
            x="110"
            y="47"
            width="70"
            height="24"
            rx="6"
            fill="currentColor"
            opacity="0.4"
          />
          <rect
            x="20"
            y="78"
            width="160"
            height="28"
            rx="6"
            fill="currentColor"
            opacity="0.25"
          />
          <circle cx="36" cy="92" r="6" fill="currentColor" opacity="0.5" />
          <rect
            x="50"
            y="88"
            width="50"
            height="8"
            rx="4"
            fill="currentColor"
            opacity="0.4"
          />
        </svg>
      )
    case 'parameters':
      return (
        <svg
          className="absolute inset-0 w-full h-full opacity-30"
          viewBox="0 0 200 120"
        >
          {/* Sliders and knobs — parameter controls */}
          {/* Slider 1 */}
          <line
            x1="30"
            y1="30"
            x2="170"
            y2="30"
            stroke="currentColor"
            strokeWidth="3"
            opacity="0.25"
          />
          <circle cx="110" cy="30" r="7" fill="currentColor" opacity="0.55" />
          {/* Slider 2 */}
          <line
            x1="30"
            y1="60"
            x2="170"
            y2="60"
            stroke="currentColor"
            strokeWidth="3"
            opacity="0.25"
          />
          <circle cx="70" cy="60" r="7" fill="currentColor" opacity="0.55" />
          {/* Slider 3 */}
          <line
            x1="30"
            y1="90"
            x2="170"
            y2="90"
            stroke="currentColor"
            strokeWidth="3"
            opacity="0.25"
          />
          <circle cx="140" cy="90" r="7" fill="currentColor" opacity="0.55" />
        </svg>
      )
    default:
      return null
  }
}

export function ShowcaseSection() {
  return (
    <section className="w-full py-20">
      <div className="mx-auto max-w-5xl px-6">
        <Badge variant="secondary" className="mb-3">
          Layers & Components
        </Badge>
        <h2 className="mb-12 text-3xl font-bold text-foreground">
          One engine, many visualizations.
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {EXAMPLES.map((example) => (
            <Link
              key={example.title}
              to="/playground"
              className="group no-underline"
            >
              <div className="overflow-hidden rounded-lg border border-border/60 bg-card transition-all hover:border-primary/40 hover:shadow-lg">
                <div
                  className={`relative h-32 bg-gradient-to-br ${example.gradient} text-white`}
                >
                  <PatternSvg pattern={example.pattern} />
                </div>
                <div className="px-4 py-3">
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    {example.title}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    {example.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 flex flex-col items-center text-center">
          <Link
            to="/playground"
            className={cn(buttonVariants({ size: 'xl' }), 'no-underline')}
          >
            Open the Playground
          </Link>
          <p className="mt-4 text-sm text-muted-foreground">
            Edit JSON. Tweak params. See it resolve live.
          </p>
        </div>
      </div>
    </section>
  )
}
