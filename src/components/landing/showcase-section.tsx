import { Link } from '@tanstack/react-router'
import { Badge } from '#/components/ui/badge'

const EXAMPLES = [
  {
    title: 'Raster Opacity',
    description: 'Satellite layer with adjustable transparency',
    gradient: 'from-emerald-800/60 via-emerald-600/40 to-teal-700/50',
    pattern: 'raster',
  },
  {
    title: 'Choropleth Map',
    description: 'Country boundaries with data-driven fills',
    gradient: 'from-blue-800/60 via-indigo-600/40 to-violet-700/50',
    pattern: 'choropleth',
  },
  {
    title: 'Scatterplot Layer',
    description: 'deck.gl points with dynamic radius & color',
    gradient: 'from-amber-800/60 via-orange-600/40 to-red-700/50',
    pattern: 'scatter',
  },
  {
    title: 'Earthquake Heatmap',
    description: 'Real-time data-driven density visualization',
    gradient: 'from-rose-800/60 via-pink-600/40 to-fuchsia-700/50',
    pattern: 'heatmap',
  },
] as const

function PatternSvg({ pattern }: { readonly pattern: string }) {
  switch (pattern) {
    case 'raster':
      return (
        <svg
          className="absolute inset-0 w-full h-full opacity-30"
          viewBox="0 0 200 120"
        >
          {/* Grid pattern representing raster tiles */}
          {Array.from({ length: 5 }, (_, row) =>
            Array.from({ length: 7 }, (_, col) => (
              <rect
                key={`${row}-${col}`}
                x={col * 30 + 2}
                y={row * 25 + 2}
                width="26"
                height="21"
                rx="2"
                fill="currentColor"
                opacity={0.15 + Math.random() * 0.35}
              />
            )),
          )}
        </svg>
      )
    case 'choropleth':
      return (
        <svg
          className="absolute inset-0 w-full h-full opacity-30"
          viewBox="0 0 200 120"
        >
          {/* Abstract polygon shapes representing country boundaries */}
          <polygon
            points="20,20 80,10 90,50 60,70 25,55"
            fill="currentColor"
            opacity="0.4"
          />
          <polygon
            points="85,15 150,5 160,45 130,60 90,50"
            fill="currentColor"
            opacity="0.25"
          />
          <polygon
            points="155,10 195,20 190,60 160,45"
            fill="currentColor"
            opacity="0.5"
          />
          <polygon
            points="25,60 65,72 70,110 15,100"
            fill="currentColor"
            opacity="0.35"
          />
          <polygon
            points="70,65 135,58 140,100 75,110"
            fill="currentColor"
            opacity="0.45"
          />
          <polygon
            points="140,55 195,60 190,105 145,100"
            fill="currentColor"
            opacity="0.3"
          />
        </svg>
      )
    case 'scatter':
      return (
        <svg
          className="absolute inset-0 w-full h-full opacity-30"
          viewBox="0 0 200 120"
        >
          {/* Scattered circles representing data points */}
          <circle cx="30" cy="40" r="8" fill="currentColor" opacity="0.5" />
          <circle cx="70" cy="25" r="5" fill="currentColor" opacity="0.35" />
          <circle cx="120" cy="60" r="10" fill="currentColor" opacity="0.45" />
          <circle cx="160" cy="30" r="6" fill="currentColor" opacity="0.4" />
          <circle cx="45" cy="80" r="7" fill="currentColor" opacity="0.3" />
          <circle cx="100" cy="90" r="9" fill="currentColor" opacity="0.5" />
          <circle cx="150" cy="85" r="5" fill="currentColor" opacity="0.35" />
          <circle cx="85" cy="45" r="4" fill="currentColor" opacity="0.25" />
          <circle cx="175" cy="70" r="7" fill="currentColor" opacity="0.4" />
          <circle cx="55" cy="55" r="6" fill="currentColor" opacity="0.45" />
        </svg>
      )
    case 'heatmap':
      return (
        <svg
          className="absolute inset-0 w-full h-full opacity-30"
          viewBox="0 0 200 120"
        >
          {/* Radial gradients representing heat spots */}
          <defs>
            <radialGradient id="heat1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.6" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="heat2">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.4" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="80" cy="50" r="40" fill="url(#heat1)" />
          <circle cx="140" cy="70" r="30" fill="url(#heat1)" />
          <circle cx="50" cy="80" r="25" fill="url(#heat2)" />
          <circle cx="160" cy="30" r="20" fill="url(#heat2)" />
          <circle cx="110" cy="30" r="15" fill="url(#heat2)" />
        </svg>
      )
    default:
      return null
  }
}

export function ShowcaseSection() {
  return (
    <section className="w-full landing-bg py-20">
      <div className="mx-auto max-w-5xl px-6">
        <Badge variant="secondary" className="mb-3">
          See It In Action
        </Badge>
        <h2 className="mb-12 text-3xl font-bold text-foreground">
          One engine, many visualizations.
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
      </div>
    </section>
  )
}
