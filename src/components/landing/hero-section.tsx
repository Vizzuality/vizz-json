import { Link } from '@tanstack/react-router'
import { Badge } from '#/components/ui/badge'
import { buttonVariants } from '#/components/ui/button'
import { cn } from '#/lib/utils'

function PlaygroundPreview() {
  return (
    <div className="mt-16 w-full max-w-4xl mx-auto">
      <div className="rounded-xl border border-border/60 bg-card shadow-2xl overflow-hidden">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40 bg-muted/50">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
          <span className="ml-3 text-[11px] text-muted-foreground/60 font-mono">
            localhost:3000/playground
          </span>
        </div>
        {/* Content */}
        <div className="grid grid-cols-5 h-56 sm:h-64">
          {/* Editor panel */}
          <div className="col-span-2 bg-zinc-900 p-4 font-mono text-[11px] sm:text-xs leading-relaxed overflow-hidden">
            <div className="text-zinc-600">{'{'}</div>
            <div className="text-zinc-400">
              &nbsp;&nbsp;
              <span className="text-blue-400">&quot;type&quot;</span>
              {': '}
              <span className="text-amber-300">&quot;raster&quot;</span>,
            </div>
            <div className="text-zinc-400">
              &nbsp;&nbsp;
              <span className="text-blue-400">&quot;paint&quot;</span>
              {': {'}
            </div>
            <div className="text-zinc-400">
              &nbsp;&nbsp;&nbsp;&nbsp;
              <span className="text-blue-400">&quot;opacity&quot;</span>
              {': '}
              <span className="text-emerald-400">
                &quot;@@#params.opacity&quot;
              </span>
            </div>
            <div className="text-zinc-400">&nbsp;&nbsp;{'}'}</div>
            <div className="text-zinc-600">{'}'}</div>
          </div>
          {/* Map preview */}
          <div className="col-span-3 relative overflow-hidden bg-[#1a2e1a]">
            {/* Topographic-style decorative pattern */}
            <svg
              className="absolute inset-0 w-full h-full opacity-20"
              viewBox="0 0 400 300"
              preserveAspectRatio="none"
            >
              <ellipse
                cx="200"
                cy="150"
                rx="160"
                ry="100"
                fill="none"
                stroke="oklch(0.7 0.15 145)"
                strokeWidth="0.8"
              />
              <ellipse
                cx="200"
                cy="150"
                rx="120"
                ry="75"
                fill="none"
                stroke="oklch(0.65 0.15 145)"
                strokeWidth="0.8"
              />
              <ellipse
                cx="200"
                cy="150"
                rx="80"
                ry="50"
                fill="none"
                stroke="oklch(0.6 0.15 145)"
                strokeWidth="0.8"
              />
              <ellipse
                cx="200"
                cy="150"
                rx="40"
                ry="25"
                fill="oklch(0.55 0.15 145 / 0.3)"
                stroke="oklch(0.55 0.15 145)"
                strokeWidth="0.8"
              />
              <ellipse
                cx="320"
                cy="80"
                rx="60"
                ry="40"
                fill="none"
                stroke="oklch(0.6 0.12 160)"
                strokeWidth="0.6"
              />
              <ellipse
                cx="320"
                cy="80"
                rx="30"
                ry="20"
                fill="oklch(0.55 0.12 160 / 0.2)"
                stroke="oklch(0.55 0.12 160)"
                strokeWidth="0.6"
              />
              <ellipse
                cx="80"
                cy="230"
                rx="70"
                ry="45"
                fill="none"
                stroke="oklch(0.6 0.13 140)"
                strokeWidth="0.6"
              />
              <ellipse
                cx="80"
                cy="230"
                rx="35"
                ry="22"
                fill="oklch(0.55 0.13 140 / 0.2)"
                stroke="oklch(0.55 0.13 140)"
                strokeWidth="0.6"
              />
            </svg>
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 via-teal-900/20 to-cyan-900/30" />
            {/* Param control preview */}
            <div className="absolute bottom-4 right-4 left-4 flex items-center gap-3 rounded-md bg-zinc-900/80 backdrop-blur-sm px-3 py-2">
              <span className="text-[10px] sm:text-[11px] text-zinc-400 font-mono shrink-0">
                opacity
              </span>
              <div className="flex-1 h-1.5 rounded-full bg-zinc-700 relative">
                <div className="absolute left-0 top-0 h-full w-3/4 rounded-full bg-primary" />
                <div className="absolute top-1/2 -translate-y-1/2 left-[75%] -translate-x-1/2 w-3 h-3 rounded-full bg-white border-2 border-primary" />
              </div>
              <span className="text-[10px] sm:text-[11px] text-zinc-500 font-mono">
                0.75
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function HeroSection() {
  return (
    <section className="w-full landing-bg py-24 sm:py-32">
      <div className="mx-auto flex max-w-3xl flex-col items-center px-6 text-center">
        <Badge variant="secondary" className="mb-4">
          Vizzuality — Frontend Team
        </Badge>
        <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
          JSON with <span className="text-primary">Superpowers</span>
        </h1>
        <p className="mb-10 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          The <code className="font-mono text-primary">@@</code> convention for
          turning static JSON into dynamic, parameterized configurations —
          library-agnostic, CMS-ready, runtime-resolved.
        </p>
        <Link
          to="/playground"
          className={cn(buttonVariants({ size: 'lg' }), 'no-underline')}
        >
          Try the Playground
        </Link>
      </div>
      <div className="mx-auto max-w-5xl px-6">
        <PlaygroundPreview />
      </div>
    </section>
  )
}
